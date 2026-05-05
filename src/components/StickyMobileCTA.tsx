'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

/**
 * Mobile-only sticky CTA bar that points couples at the multi-quote form.
 * Renders on the venue listing and venue detail pages — surfaces the
 * highest-intent action (compare quotes from up to 5 venues) without the
 * user having to scroll back to a hero CTA.
 *
 * Visibility:
 *   - shown on /venues and /venues/<slug> (and their nested filter routes)
 *   - hidden on /quotes/request — the form itself, success state included
 *     (the success step is rendered inline by MultiQuoteForm so the URL
 *     doesn't change)
 *   - hidden on desktop (lg+) — desktop has the green CTA banner already
 *
 * Mounted at the root layout so it's a single render across the app, not
 * duplicated per page. Gating happens here via usePathname.
 */
export default function StickyMobileCTA() {
  const t = useTranslations('MultiQuoteCTA');
  const pathname = usePathname() ?? '';

  // Show on /venues and /venues/<slug> only. /venues/in/<region>, manage,
  // and pin sub-routes inherit the same prefix and that's intentional —
  // the CTA still applies on filter landings. Excludes /venues/<slug>/manage
  // and /venues/<slug>/pin (the OG-image route) because both are owner /
  // bot views, not couple-facing.
  const isVenuesView =
    pathname === '/venues' ||
    (pathname.startsWith('/venues/') &&
      !pathname.endsWith('/manage') &&
      !pathname.endsWith('/pin'));

  // Hidden on the multi-quote form itself (covers the inline success step).
  const isQuoteFlow = pathname.startsWith('/quotes/request');

  if (!isVenuesView || isQuoteFlow) return null;

  return (
    <div
      className="lg:hidden fixed inset-x-0 bottom-0 z-40 bg-pink-600 shadow-2xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <Link
        href="/quotes/request"
        className="flex items-center justify-center px-4 py-3 text-white font-semibold text-sm"
      >
        {t('stickyCta')}
        <span aria-hidden="true" className="ml-2">→</span>
      </Link>
    </div>
  );
}
