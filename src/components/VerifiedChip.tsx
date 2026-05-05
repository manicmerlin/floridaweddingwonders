interface Props {
  /**
   * True when the listing has at least one real contact channel (phone /
   * website / non-synthesized email) AND a description over 50 chars.
   * Same gate as isListingComplete from src/lib/listingCompleteness.ts —
   * callers compute and pass the boolean.
   */
  verified: boolean;
  /**
   * ISO timestamp or Date for the listing's last update. Renders as
   * "Updated Apr 2026" style. Falsy → omits the suffix.
   */
  updatedAt?: string | Date | null;
  /** Optional className — usually a margin tweak. */
  className?: string;
}

/**
 * Small trust chip rendered near the H1 on every detail page (venue,
 * vendor, dress-shop). Combines two cheap signals:
 *   - "✓ Verified" when the listing has real contact + content
 *   - "Updated <Mon Year>" pulled from updated_at
 *
 * Both are independent — a listing with no real contact still gets the
 * "Updated" suffix on its own. Shown together when both apply.
 */
export default function VerifiedChip({ verified, updatedAt, className = '' }: Props) {
  const updatedLabel = formatUpdatedAt(updatedAt);
  if (!verified && !updatedLabel) return null;
  return (
    <span
      className={`inline-flex items-center gap-2 text-xs text-gray-600 bg-white/80 backdrop-blur-sm border border-gray-200 px-3 py-1 rounded-full ${className}`}
      aria-label={
        verified && updatedLabel
          ? `Verified listing, last updated ${updatedLabel}`
          : verified
            ? 'Verified listing'
            : `Last updated ${updatedLabel}`
      }
    >
      {verified && (
        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
          <span aria-hidden>✓</span>
          <span>Verified</span>
        </span>
      )}
      {verified && updatedLabel && <span aria-hidden className="text-gray-300">·</span>}
      {updatedLabel && <span className="text-gray-500">Updated {updatedLabel}</span>}
    </span>
  );
}

function formatUpdatedAt(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  const d = typeof value === 'string' ? new Date(value) : value;
  if (isNaN(d.getTime())) return null;
  // "Apr 2026" style — month + year, no day. Day-level precision feels
  // weirdly precise for a trust signal that's really about freshness
  // bands.
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}
