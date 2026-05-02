// Auth middleware. Validates the Supabase session cookie on every request to
// a gated path and redirects unauthenticated/unauthorised users to /login.
//
// Two layers, in order:
//   1. LEGACY_AUTH_BYPASS=true → fall back to the pre-Supabase-Auth cookie
//      check (`venue-owner-auth=authenticated`). Transition-only escape
//      hatch. Production should leave this unset.
//   2. New: refresh the Supabase session cookie via @supabase/ssr, then
//      consult the SUPER_ADMIN_EMAILS safelist + profiles.role to gate
//      /admin/** and /api/admin/**.

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const ADMIN_PATH_PREFIXES = ['/admin', '/api/admin'];
const MANAGE_PATH_REGEX = /\/(venues|dress-shops)\/[^/]+\/manage($|\/)/;

function legacyBypassEnabled(): boolean {
  return process.env.LEGACY_AUTH_BYPASS === 'true';
}

function getSafelistEmails(): Set<string> {
  const raw = process.env.SUPER_ADMIN_EMAILS || '';
  return new Set(
    raw
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
}

function isAdminPath(pathname: string): boolean {
  return ADMIN_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

function isManagePath(pathname: string): boolean {
  return MANAGE_PATH_REGEX.test(pathname);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const adminGated = isAdminPath(pathname);
  const managementGated = isManagePath(pathname);

  if (!adminGated && !managementGated) {
    return NextResponse.next();
  }

  // ---- Legacy bypass --------------------------------------------------
  if (legacyBypassEnabled()) {
    const legacy = request.cookies.get('venue-owner-auth')?.value;
    if (legacy === 'authenticated') {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // ---- Real path: validate Supabase session ---------------------------
  const response = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (adminGated) {
    const isAdminBySafelist = !!user.email && getSafelistEmails().has(user.email.toLowerCase());
    if (!isAdminBySafelist) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      if (profile?.role !== 'super_admin') {
        // 404-equivalent for non-admins: don't reveal /admin exists.
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
  }

  // /manage paths gate on having ANY authenticated session for now. Phase 3
  // will tighten this to the specific venue/shop ownership.
  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/venues/:path*/manage',
    '/dress-shops/:path*/manage',
  ],
};
