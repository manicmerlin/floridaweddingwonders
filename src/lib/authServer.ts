// Server-side auth helpers. Use from RSC, route handlers, and middleware.
//
// The role precedence is:
//   1. SUPER_ADMIN_EMAILS env-var safelist  → super_admin (rescue path; can
//      never be locked out as long as the user can edit Vercel env vars)
//   2. profiles.role from the database      → whatever's stored
//   3. fallback                              → 'guest'
//
// The legacy localStorage bypass is NOT honored on the server. It's purely
// a transition aid during the rollout window and only applies to the client
// nav state.

import type { User } from '@supabase/supabase-js';
import { createSupabaseServerClient } from './supabaseServer';
import { redirect } from 'next/navigation';

export type AppRole = 'guest' | 'venue_owner' | 'vendor_owner' | 'super_admin';

export interface AppSession {
  user: User;
  role: AppRole;
  isSuperAdmin: boolean;
  // True when the role came from the env-var safelist instead of the DB.
  isAdminViaEnvSafelist: boolean;
}

/**
 * Parse SUPER_ADMIN_EMAILS=email1@x,email2@y into a normalized lowercase set.
 * Trim and ignore empties. Memoized at module-scope since env vars don't
 * change at runtime.
 */
let cachedAdminEmails: Set<string> | null = null;
export function getSuperAdminEmails(): Set<string> {
  if (cachedAdminEmails) return cachedAdminEmails;
  const raw = process.env.SUPER_ADMIN_EMAILS || '';
  cachedAdminEmails = new Set(
    raw
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
  return cachedAdminEmails;
}

export function isEmailInAdminSafelist(email: string | null | undefined): boolean {
  if (!email) return false;
  return getSuperAdminEmails().has(email.toLowerCase());
}

/**
 * Get the current Supabase user from the request cookie. Returns null if
 * unauthenticated.
 */
export async function getCurrentUserServer(): Promise<User | null> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Resolve the role for a user. Honors the env-var safelist as the highest
 * authority (rescue path) before falling back to the profiles table.
 */
export async function getRoleForUser(user: User): Promise<{
  role: AppRole;
  isAdminViaEnvSafelist: boolean;
}> {
  if (isEmailInAdminSafelist(user.email)) {
    return { role: 'super_admin', isAdminViaEnvSafelist: true };
  }
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (error || !data) {
    // No profile row yet (trigger will catch up; until then, treat as guest)
    return { role: 'guest', isAdminViaEnvSafelist: false };
  }
  const role = (data.role || 'guest') as AppRole;
  return { role, isAdminViaEnvSafelist: false };
}

/**
 * Get the full session info, or null if unauthenticated.
 */
export async function getAppSession(): Promise<AppSession | null> {
  const user = await getCurrentUserServer();
  if (!user) return null;
  const { role, isAdminViaEnvSafelist } = await getRoleForUser(user);
  return {
    user,
    role,
    isSuperAdmin: role === 'super_admin',
    isAdminViaEnvSafelist,
  };
}

/**
 * Hard server-side guard. Use in RSC / route handlers / layouts that must
 * only render for super admins. Redirects unauthenticated users to /login
 * and signed-in non-admins to / (we don't want to leak the existence of
 * /admin to non-admins).
 */
export async function requireSuperAdmin(): Promise<AppSession> {
  const session = await getAppSession();
  if (!session) redirect('/login?next=/admin');
  if (!session.isSuperAdmin) redirect('/');
  return session;
}
