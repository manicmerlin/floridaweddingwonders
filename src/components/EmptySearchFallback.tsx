'use client';

import Link from 'next/link';
import { lookupProximitySuggestion } from '@/lib/cityProximity';
import { REGIONS } from '@/lib/hyperlocal';

interface Props {
  /** What the user typed in the search box. */
  query: string;
  /**
   * URL kind so the region pills point to the right page family.
   * 'venues' → /venues/in/<region>, 'vendors' → /vendors/in/<region>,
   * 'dress-shops' → /dress-shops (no region pages yet, link to index).
   */
  kind: 'venues' | 'vendors' | 'dress-shops';
  /** Total catalog size for the "View all <N>" CTA. */
  totalCount: number;
  /** Singular noun for copy ("venue" / "vendor" / "bridal shop"). */
  noun: string;
  /** Callback to clear the search and reset the listing. */
  onClear: () => void;
}

/**
 * Empty-state panel for searches that produced zero results. Looks up the
 * query against the off-coverage proximity map (St. Pete → Naples, etc.);
 * if there's a match, surfaces the closest covered regions with chip
 * links. Otherwise renders a generic "no matches" panel with the full
 * region list as fallback chips.
 *
 * Replaces the old "0 results — sad face" UI when a search is active.
 */
export default function EmptySearchFallback({ query, kind, totalCount, noun, onClear }: Props) {
  const suggestion = lookupProximitySuggestion(query);

  if (suggestion) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-10 text-center text-pink-100 max-w-3xl mx-auto">
        <div className="text-5xl mb-4" aria-hidden>
          🗺️
        </div>
        <h3 className="text-2xl font-semibold text-white mb-2">
          We don&apos;t have {noun}s in {suggestion.searchedFor} yet
        </h3>
        <p className="mb-6 max-w-xl mx-auto">{suggestion.note}</p>
        <p className="text-sm uppercase tracking-wide text-pink-300 mb-3">
          Closest areas we do cover
        </p>
        <div className="flex flex-wrap gap-3 justify-center mb-6">
          {suggestion.suggestedRegions.map(({ region, why }) => (
            <Link
              key={region.slug}
              href={kind === 'dress-shops' ? '/dress-shops' : `/${kind}/in/${region.slug}`}
              className="bg-white/10 hover:bg-white/20 text-white px-5 py-3 rounded-xl text-left transition border border-white/10 max-w-xs"
              onClick={onClear}
            >
              <div className="font-semibold">{region.name}</div>
              {why && <div className="text-xs text-pink-200 mt-1">{why}</div>}
            </Link>
          ))}
        </div>
        <button
          onClick={onClear}
          className="text-sm text-pink-300 hover:text-pink-200 underline"
        >
          View all {totalCount} {noun}s
        </button>
      </div>
    );
  }

  // No proximity match — generic graceful empty state with the full
  // region list as fallback chips. Better than the old sad-face panel.
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-10 text-center text-pink-100 max-w-3xl mx-auto">
      <div className="text-5xl mb-4" aria-hidden>
        🔍
      </div>
      <h3 className="text-2xl font-semibold text-white mb-2">
        No matches for &ldquo;{query}&rdquo;
      </h3>
      <p className="mb-6 max-w-xl mx-auto">
        Try one of the South Florida areas we cover, or browse the full directory.
      </p>
      <div className="flex flex-wrap gap-2 justify-center mb-6">
        {REGIONS.map((region) => (
          <Link
            key={region.slug}
            href={kind === 'dress-shops' ? '/dress-shops' : `/${kind}/in/${region.slug}`}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full text-sm transition"
            onClick={onClear}
          >
            {region.name}
          </Link>
        ))}
      </div>
      <button
        onClick={onClear}
        className="text-sm text-pink-300 hover:text-pink-200 underline"
      >
        View all {totalCount} {noun}s
      </button>
    </div>
  );
}
