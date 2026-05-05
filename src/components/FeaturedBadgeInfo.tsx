'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

/**
 * "What does Featured / Founding Partner mean?" info popover. Renders a
 * small ⓘ button inline next to the tier badge; click/tap opens a modal
 * with the explanation and a link to /venue-packages.
 *
 * Designed to be dropped next to any tier badge (VenueCard, VenueDetailClient
 * hero, anywhere). The badge itself is rendered separately — this component
 * is only the info affordance.
 */
export default function FeaturedBadgeInfo({
  tierLabel,
}: {
  /** "Featured" or "Founding Partner" — used to title the modal. */
  tierLabel: 'Featured' | 'Founding Partner';
}) {
  const [open, setOpen] = useState(false);

  // ESC closes the modal — small accessibility win.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          // Stop propagation so clicking the info icon doesn't also trigger
          // the parent link/card-click handler.
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        aria-label={`What does ${tierLabel} mean?`}
        className="inline-flex items-center justify-center w-4 h-4 ml-1 rounded-full bg-white/30 hover:bg-white/50 text-current text-[10px] font-bold leading-none transition"
      >
        ⓘ
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="featured-badge-info-title"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-3">
              <h2 id="featured-badge-info-title" className="text-lg font-bold text-gray-900">
                What does {tierLabel} mean?
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-sm text-gray-700">
              <p>
                {tierLabel === 'Founding Partner'
                  ? 'Founding Partners are venues on our Scale tier — a one-time partnership that includes a professional photo + drone shoot, lifetime priority placement in search results, and the gold ★ badge you see on the listing.'
                  : 'Featured listings are venues partnered with us through our Growth tier. They appear higher in search results, get unlimited photos and lead capture, and have priority lead routing.'}
              </p>
              <p className="text-gray-500">
                Listings are vetted and verified before the badge shows up. We don&apos;t pay-to-play
                — venues with broken contact info or thin content can&apos;t earn the badge even if
                they&apos;re on a paid tier.
              </p>
            </div>

            <div className="mt-5 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Got it
              </button>
              <Link
                href="/venue-packages"
                className="px-4 py-2 text-sm bg-pink-600 hover:bg-pink-700 text-white font-medium rounded-md"
                onClick={() => setOpen(false)}
              >
                See partnership tiers
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
