// Set the language cookie + bounce back to the page that called us.
//
// Why a route handler and not a server action: we want the language
// toggle to work without requiring the calling page to be a server
// component (Navigation is a client component) and without forcing a
// JS-driven cookie write that wouldn't survive SSR. A plain GET that
// 303's back to the referrer is the simplest thing that works.
//
//   GET /api/locale?to=es&next=/venues
//
// `next` is sanity-checked to be a same-origin path so we can't be turned
// into an open redirect.

import { NextResponse } from 'next/server';
import { LOCALE_COOKIE, SUPPORTED_LOCALES } from '@/i18n/request';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const to = url.searchParams.get('to') ?? 'en';
  const next = url.searchParams.get('next') ?? '/';

  if (!(SUPPORTED_LOCALES as readonly string[]).includes(to)) {
    return NextResponse.json({ error: 'unsupported locale' }, { status: 400 });
  }

  // Only allow same-origin paths for `next`. URL.parse with the request
  // origin as base will normalise something like "//evil.com" to a path,
  // but we additionally enforce that the parsed pathname starts with "/"
  // and the host matches.
  let safeNext = '/';
  try {
    const parsed = new URL(next, url.origin);
    if (parsed.origin === url.origin && parsed.pathname.startsWith('/')) {
      safeNext = parsed.pathname + parsed.search + parsed.hash;
    }
  } catch {
    /* fall through to "/" */
  }

  const res = NextResponse.redirect(new URL(safeNext, url.origin), { status: 303 });
  // Persist for 1 year — surviving the browser session is the whole
  // point of this cookie (per spec). httpOnly: false so client-side
  // analytics can read it if we ever wire that up; sameSite: lax to
  // allow the cookie to come back on cross-site clicks back to us.
  res.cookies.set(LOCALE_COOKIE, to, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    secure: true,
  });
  return res;
}
