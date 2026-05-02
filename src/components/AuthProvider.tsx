'use client';

// React context for auth state. Subscribes to Supabase's onAuthStateChange,
// fetches the role from the profiles table, and keeps localStorage in sync
// for legacy sync readers (see src/lib/auth.ts).
//
// Mount once at the root of the app (in src/app/layout.tsx).

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import {
  writeAuthSnapshotToLocalStorage,
  type AppRole,
  type AuthSnapshot,
} from '@/lib/auth';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  role: AppRole;
  isSuperAdmin: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Comma-separated list of emails that should always resolve to super_admin
// regardless of what's in profiles.role. Mirrors authServer.ts on the client
// so the badge / nav don't have to round-trip to verify.
function getClientAdminSafelist(): Set<string> {
  const raw = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS || '';
  return new Set(
    raw
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole>('guest');
  const [isLoading, setIsLoading] = useState(true);

  const resolveRole = useCallback(
    async (u: User): Promise<AppRole> => {
      const safelist = getClientAdminSafelist();
      if (u.email && safelist.has(u.email.toLowerCase())) {
        return 'super_admin';
      }
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', u.id)
        .maybeSingle();
      return ((data?.role as AppRole) || 'guest') as AppRole;
    },
    []
  );

  const syncFromSession = useCallback(
    async (s: Session | null) => {
      setSession(s);
      const u = s?.user || null;
      setUser(u);
      if (!u) {
        setRole('guest');
        writeAuthSnapshotToLocalStorage(null);
        return;
      }
      const r = await resolveRole(u);
      setRole(r);
      const snap: AuthSnapshot = {
        id: u.id,
        email: u.email || '',
        name: (u.user_metadata?.full_name as string) || '',
        role: r,
        isAuthenticated: true,
      };
      writeAuthSnapshotToLocalStorage(snap);
    },
    [resolveRole]
  );

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      await syncFromSession(data.session);
      setIsLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (_event, s) => {
        if (!mounted) return;
        await syncFromSession(s);
      }
    );

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [syncFromSession]);

  const refreshRole = useCallback(async () => {
    if (!user) return;
    const r = await resolveRole(user);
    setRole(r);
    writeAuthSnapshotToLocalStorage({
      id: user.id,
      email: user.email || '',
      name: (user.user_metadata?.full_name as string) || '',
      role: r,
      isAuthenticated: true,
    });
  }, [resolveRole, user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      role,
      isSuperAdmin: role === 'super_admin',
      isAuthenticated: !!user,
      isLoading,
      refreshRole,
    }),
    [user, session, role, isLoading, refreshRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth() must be used inside <AuthProvider>');
  }
  return ctx;
}
