// Client-side auth surface for the rest of the app. Wraps Supabase Auth and
// keeps a small, sync-readable mirror in localStorage so the existing
// localStorage-reading components (Navigation, VenueCard, VenueManagement,
// etc.) keep working without a one-shot mass refactor.
//
// IMPORTANT: client-side state is a CACHE, not a security boundary. Every
// secured surface (middleware, /admin/layout.tsx server guard, admin API
// routes) re-validates against the Supabase session cookie on the server.
// Setting localStorage flags in DevTools no longer grants access to anything
// that matters.

'use client';

import { supabase } from './supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AppRole = 'guest' | 'venue_owner' | 'vendor_owner' | 'super_admin';

export interface AuthSnapshot {
  id: string;
  email: string;
  name: string;
  role: AppRole;
  isAuthenticated: true;
}

// Legacy shape compat. Some callers destructure `{ user, isAuthenticated }`.
export interface LegacyAuthSession {
  user: AuthSnapshot | null;
  isAuthenticated: boolean;
}

// ---------------------------------------------------------------------------
// Feature flags
// ---------------------------------------------------------------------------

/**
 * NEXT_PUBLIC_LEGACY_AUTH_BYPASS=true keeps the pre-Supabase-Auth client
 * helpers reading the old localStorage flags. Production should NEVER set
 * this. Locally the user can flip it on if the new auth misbehaves.
 */
function legacyBypassEnabled(): boolean {
  return process.env.NEXT_PUBLIC_LEGACY_AUTH_BYPASS === 'true';
}

// ---------------------------------------------------------------------------
// localStorage cache (written by AuthProvider; read by sync helpers below)
// ---------------------------------------------------------------------------

const LS_KEY = 'user'; // intentionally the same key the legacy code wrote

export function readAuthSnapshotFromLocalStorage(): AuthSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.email || !parsed?.id) return null;
    return {
      id: parsed.id,
      email: parsed.email,
      name: parsed.name || '',
      role: (parsed.role || 'guest') as AppRole,
      isAuthenticated: true,
    };
  } catch {
    return null;
  }
}

/**
 * AuthProvider calls this on every Supabase auth-state change to keep the
 * legacy mirror in sync. Single writer, many readers.
 */
export function writeAuthSnapshotToLocalStorage(snap: AuthSnapshot | null) {
  if (typeof window === 'undefined') return;
  if (!snap) {
    localStorage.removeItem(LS_KEY);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('isSuperAdmin');
    localStorage.removeItem('userEmail');
    return;
  }
  localStorage.setItem(LS_KEY, JSON.stringify(snap));
  localStorage.setItem('isAuthenticated', 'true');
  localStorage.setItem('isSuperAdmin', snap.role === 'super_admin' ? 'true' : 'false');
  localStorage.setItem('userEmail', snap.email);
}

// ---------------------------------------------------------------------------
// Sync helpers — backward-compatible API surface
// ---------------------------------------------------------------------------

/**
 * Sync read of the current auth state for code that can't easily go async or
 * use React context. Reflects whatever AuthProvider last cached. Returns
 * null when signed out.
 */
export function getCurrentUser(): LegacyAuthSession {
  // In production: read the cache the AuthProvider keeps in sync. The cache
  // is purely UX; security relies on the server.
  const snap = readAuthSnapshotFromLocalStorage();
  if (snap) return { user: snap, isAuthenticated: true };

  // Bypass: also accept the old hardcoded super-admin flag pattern.
  if (legacyBypassEnabled() && typeof window !== 'undefined') {
    const isAuth = localStorage.getItem('isAuthenticated') === 'true';
    const email = localStorage.getItem('userEmail') || '';
    if (isAuth && email) {
      const isSuper = localStorage.getItem('isSuperAdmin') === 'true';
      return {
        user: {
          id: 'legacy-' + email,
          email,
          name: '',
          role: isSuper ? 'super_admin' : 'guest',
          isAuthenticated: true,
        },
        isAuthenticated: true,
      };
    }
  }

  return { user: null, isAuthenticated: false };
}

export function isSuperAdmin(): boolean {
  const { user } = getCurrentUser();
  return user?.role === 'super_admin';
}

export function canManageVenue(_venueId: string): boolean {
  // Until per-venue ownership records land in profiles, only super_admin can
  // manage. Phase 3 expands this to vendor_owner / venue_owner with venue_id
  // join lookups.
  return isSuperAdmin();
}

export function getPhotoLimit(_venueId: string): number {
  return isSuperAdmin() ? Number.POSITIVE_INFINITY : 0;
}

// ---------------------------------------------------------------------------
// Auth actions
// ---------------------------------------------------------------------------

export interface SignInResult {
  success: boolean;
  error?: string;
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<SignInResult> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function signUpWithEmail(input: {
  email: string;
  password: string;
  fullName: string;
}): Promise<SignInResult> {
  const emailRedirectTo =
    typeof window !== 'undefined'
      ? `${window.location.origin}/login`
      : undefined;
  const { error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: { full_name: input.fullName },
      emailRedirectTo,
    },
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function requestPasswordReset(email: string): Promise<SignInResult> {
  const redirectTo =
    typeof window !== 'undefined'
      ? `${window.location.origin}/reset-password`
      : undefined;
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updatePassword(newPassword: string): Promise<SignInResult> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
  writeAuthSnapshotToLocalStorage(null);
  if (typeof document !== 'undefined') {
    // Belt-and-braces: clear the legacy compat cookies too.
    document.cookie = 'venue-owner-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    document.cookie = 'venue-owner-email=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
  }
}

// Legacy alias used by Navigation.tsx and other callers.
export const logout = signOut;
