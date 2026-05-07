import Link from 'next/link';

interface Props {
  /** 0-5; null means no aggregate available. */
  rating: number | null;
  /** Number of approved reviews. */
  count: number;
  /** Slug of the listing the user clicks to. */
  slug: string;
  /** URL kind — drives the deep-link target. */
  kind: 'venues' | 'vendors' | 'dress-shops' | 'suit-shops';
  /** Optional className override. */
  className?: string;
}

/**
 * Small under-title strip showing either the live rating or a "be the first
 * to review" empty state. Linked so the click jumps to the detail page's
 * #reviews anchor (the section we hoisted above the footer in the audit
 * fixes PR).
 *
 * Empty state is the important half of this component — it primes the
 * reviews surface across the entire directory before any reviews exist,
 * and gives couples a one-tap path to write the first one.
 */
export default function ListingRatingStrip({
  rating,
  count,
  slug,
  kind,
  className = '',
}: Props) {
  if (rating !== null && count > 0) {
    return (
      <Link
        href={`/${kind}/${slug}#reviews`}
        className={`inline-flex items-center gap-1.5 text-xs text-amber-700 hover:text-amber-800 ${className}`}
        aria-label={`${rating.toFixed(1)} of 5 stars from ${count} reviews`}
      >
        <Stars value={rating} />
        <span className="font-medium">{rating.toFixed(1)}</span>
        <span className="text-gray-500">·</span>
        <span className="text-gray-600">
          {count} {count === 1 ? 'review' : 'reviews'}
        </span>
      </Link>
    );
  }
  return (
    <Link
      href={`/${kind}/${slug}#reviews`}
      className={`inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-pink-600 hover:underline ${className}`}
    >
      <span aria-hidden>☆☆☆☆☆</span>
      <span>New listing — be the first to review</span>
    </Link>
  );
}

/** 5-star renderer with half-star midpoints (rounds to nearest 0.5). */
function Stars({ value }: { value: number }) {
  const rounded = Math.round(value * 2) / 2;
  // We render filled / half / empty as plain unicode so it copy-pastes
  // cleanly into screen readers and prints. The aria-label above carries
  // the precise number for assistive tech.
  return (
    <span aria-hidden className="tracking-tight">
      {[1, 2, 3, 4, 5].map((n) => {
        if (rounded >= n) return <span key={n}>★</span>;
        if (rounded >= n - 0.5) return <span key={n}>⯨</span>;
        return (
          <span key={n} className="text-gray-300">
            ★
          </span>
        );
      })}
    </span>
  );
}
