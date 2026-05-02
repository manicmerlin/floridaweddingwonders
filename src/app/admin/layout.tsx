// Server-side guard for the entire /admin/** subtree. Runs before any child
// page renders, so non-admins never see admin UI even for the brief moment
// before client-side hydration.
//
// Layered with middleware (which already redirects unauth/unauthorised away
// from /admin paths) — the layout is the second wall: even if middleware is
// bypassed, accidentally disabled, or matcher-mismatched, this server-side
// check stops the render.

import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { requireSuperAdmin } from '@/lib/authServer';

const LEGACY_BYPASS_COOKIE = 'venue-owner-auth';

async function legacyBypassPasses(): Promise<boolean> {
  if (process.env.LEGACY_AUTH_BYPASS !== 'true') return false;
  const cookieStore = cookies();
  return cookieStore.get(LEGACY_BYPASS_COOKIE)?.value === 'authenticated';
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  if (await legacyBypassPasses()) {
    return <>{children}</>;
  }
  // Will redirect to /login or / if the caller is not super_admin.
  await requireSuperAdmin();
  return <>{children}</>;
}
