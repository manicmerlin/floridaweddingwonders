'use client';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Tailwind classes for the active page button. Default: pink-600 fill. */
  activeClass?: string;
  /** Tailwind classes for inactive page buttons. Default: white bg + gray border. */
  inactiveClass?: string;
}

/**
 * Phase 7C — viewport-aware pagination.
 *
 * Replaces the prior implementation that rendered every page button + Previous
 * + Next in a single horizontal strip. With ~80px-wide buttons and 11 pages
 * that strip ran ~1040px and overflowed every phone viewport, both clipping
 * the page numbers and pushing the page wider than the viewport (which
 * surfaced as "right-side empty space" on the venue cards above).
 *
 * Two behaviors:
 *   - Truncate: render only Previous + 1 + (current ± 1, with ellipses) + last + Next.
 *     Worst case: 7 visible buttons regardless of total pages. Fits ~360px wide.
 *   - Overflow fallback: even truncated, edge cases get `overflow-x-auto` so a
 *     400-page table doesn't clip if someone passes a wild value.
 */
export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  activeClass = 'bg-pink-600 text-white border-pink-600',
  inactiveClass = 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50',
}: PaginationProps) {
  if (totalPages <= 1) return null;

  // Build the visible page list with ellipses. Always show first + last; show
  // current ± 1 in the middle. Skip duplicates and gaps that don't need a
  // separator.
  const pages = buildPageList(currentPage, totalPages);

  return (
    <nav
      aria-label="Pagination"
      className="mt-12 w-full overflow-x-auto"
    >
      <div className="flex justify-center items-center gap-1 sm:gap-2 min-w-max px-4">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          aria-label="Previous page"
          className={`px-3 sm:px-4 py-2 border rounded-lg text-sm whitespace-nowrap ${inactiveClass} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          ← <span className="hidden sm:inline">Previous</span>
        </button>

        {pages.map((p, idx) =>
          p === 'ellipsis' ? (
            <span
              key={`ellipsis-${idx}`}
              aria-hidden="true"
              className="px-1 text-gray-500"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              aria-current={currentPage === p ? 'page' : undefined}
              aria-label={`Go to page ${p}`}
              className={`min-w-[36px] sm:min-w-[40px] px-2 sm:px-3 py-2 border rounded-lg text-sm whitespace-nowrap ${
                currentPage === p ? activeClass : inactiveClass
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          aria-label="Next page"
          className={`px-3 sm:px-4 py-2 border rounded-lg text-sm whitespace-nowrap ${inactiveClass} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <span className="hidden sm:inline">Next</span> →
        </button>
      </div>
    </nav>
  );
}

/**
 * Build the visible page-button list given current + total. Returns numbers
 * for buttons and the literal string 'ellipsis' for separators.
 *
 * Pattern: always include 1 and totalPages. Include current ± 1. Insert an
 * ellipsis whenever there's a gap of 2+ between adjacent visible pages.
 *
 * Examples (current/total):
 *   2 / 11    → [1, 2, 3, …, 11]
 *   6 / 11    → [1, …, 5, 6, 7, …, 11]
 *   10 / 11   → [1, …, 9, 10, 11]
 *   1 / 3     → [1, 2, 3]   (no ellipsis needed for small totals)
 */
export function buildPageList(
  current: number,
  total: number
): Array<number | 'ellipsis'> {
  if (total <= 7) {
    // Small total: just render every page, no ellipsis needed
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const want = new Set<number>([1, total, current, current - 1, current + 1]);
  const sorted = Array.from(want)
    .filter((n) => n >= 1 && n <= total)
    .sort((a, b) => a - b);
  const out: Array<number | 'ellipsis'> = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push('ellipsis');
    out.push(sorted[i]);
  }
  return out;
}
