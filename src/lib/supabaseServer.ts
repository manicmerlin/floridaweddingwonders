// Server-side Supabase client builders.
//
// Use createSupabaseServerClient() inside RSC / route handlers to read the
// session cookie and call Supabase as the signed-in user.
// Use createSupabaseAdminClient() (server-only) when you need to bypass RLS
// — currently used only for admin-tier API routes that explicitly check the
// caller's role first.

import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Build a Supabase client that reads/writes the auth session cookie via
 * Next.js cookies(). Call inside server components, route handlers, and
 * server actions. Each request should build its own client.
 */
export function createSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      // RSC contexts can't write cookies. We swallow the call rather than
      // throw — the middleware is responsible for refreshing the session
      // cookie and any /api or server-action context will get a writable
      // store from cookies() automatically.
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          /* RSC: read-only, intentional no-op */
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set({ name, value: '', ...options });
        } catch {
          /* RSC: read-only, intentional no-op */
        }
      },
    },
  });
}

/**
 * Server-side client with no cookie binding, backed by the anon key.
 * For RSC reads of public-RLS tables (catalog, etc.) where there's no
 * per-user state. Reusable from sitemap.ts, route handlers, anywhere.
 *
 * Wraps fetch with `cache: 'no-store'` so Next.js's data-cache layer
 * doesn't pin stale responses from an earlier build. We saw this in
 * production after the Tier 1 venue + Tier 2 vendor inserts — the
 * `/venues` page kept returning the pre-insert 129-venue snapshot
 * despite `dynamic = 'force-dynamic'` on the route, because supabase-js
 * fetch calls were hitting the Next.js data cache (force-dynamic on the
 * route turns out not to propagate down to fetches issued by supabase-js).
 * Filtered `/venues/in/<region>` pages had different cache keys per
 * filter so they cycled fresh; the bare query was the stuck one.
 */
export function createSupabasePublicClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      // `next: { revalidate: 0 }` (not `cache: 'no-store'`) — the latter
      // forces dynamic-server-usage and breaks the homepage ISR build,
      // which legitimately wants to fetch the catalog at build time.
      // revalidate:0 disables the data-cache pin without escalating the
      // route to fully dynamic.
      fetch: (input: any, init?: any) =>
        fetch(input, { ...(init ?? {}), next: { revalidate: 0 } }),
    },
  });
}

/**
 * Server-only client backed by the service role key. Bypasses RLS — only
 * call from API routes after you have already verified the caller is a
 * super_admin via the regular client. Will throw at import time if used
 * client-side.
 */
export function createSupabaseAdminClient() {
  if (typeof window !== 'undefined') {
    throw new Error('createSupabaseAdminClient() is server-only');
  }
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set; admin client unavailable'
    );
  }
  return createClient(SUPABASE_URL, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
