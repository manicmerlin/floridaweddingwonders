'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ModerationReview } from '@/lib/reviews';

interface Props {
  initialPending: ModerationReview[];
}

export default function AdminReviewsClient({ initialPending }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [pending, setPending] = useState(initialPending);
  const [acting, setActing] = useState<string | null>(null);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'seeded' | 'real'>('all');

  const seededCount = useMemo(
    () => pending.filter((r) => r.isSeeded).length,
    [pending]
  );
  const realCount = pending.length - seededCount;

  const visible = useMemo(() => {
    if (filter === 'seeded') return pending.filter((r) => r.isSeeded);
    if (filter === 'real') return pending.filter((r) => !r.isSeeded);
    return pending;
  }, [pending, filter]);

  const moderate = async (id: string, status: 'approved' | 'rejected') => {
    setActing(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const r = await res.json().catch(() => ({}));
        setError(r.error || 'Update failed');
        return;
      }
      setPending((prev) => prev.filter((r) => r.id !== id));
      startTransition(() => router.refresh());
    } finally {
      setActing(null);
    }
  };

  // Bulk-approve every pending+seeded review in one server roundtrip.
  // Atomic: a single SQL UPDATE flips all matching rows or none.
  const bulkApproveSeeded = async () => {
    if (seededCount === 0) return;
    if (!confirm(`Approve all ${seededCount} pending seeded reviews? This can't be undone in bulk.`)) {
      return;
    }
    setBulkRunning(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/reviews/bulk-approve-seeded', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || 'Bulk update failed');
        return;
      }
      setPending((prev) => prev.filter((r) => !r.isSeeded));
      startTransition(() => router.refresh());
    } finally {
      setBulkRunning(false);
    }
  };

  if (pending.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-10 text-center text-gray-600">
        Queue is empty. Nothing to moderate.
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Summary + bulk actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm text-gray-700">
            <strong>{pending.length} pending</strong>
            {seededCount > 0 && (
              <>
                {' '}· <span className="text-purple-700">{seededCount} from seed batch</span>
                {' '}· {realCount} from real submissions
              </>
            )}
          </p>
          <div className="flex gap-2 mt-2">
            <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
              All ({pending.length})
            </FilterChip>
            {seededCount > 0 && (
              <FilterChip active={filter === 'seeded'} onClick={() => setFilter('seeded')}>
                Seeded ({seededCount})
              </FilterChip>
            )}
            {realCount > 0 && (
              <FilterChip active={filter === 'real'} onClick={() => setFilter('real')}>
                Real submissions ({realCount})
              </FilterChip>
            )}
          </div>
        </div>
        {seededCount > 0 && (
          <button
            onClick={bulkApproveSeeded}
            disabled={bulkRunning}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-md disabled:bg-purple-300 whitespace-nowrap"
            title="Approve every pending review with is_seeded=true in one operation"
          >
            {bulkRunning ? 'Approving...' : `⚡ Bulk approve ${seededCount} seeded`}
          </button>
        )}
      </div>

      <div className="space-y-3">
        {visible.map((r) => (
          <div key={r.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
              <div>
                <h3 className="font-semibold text-gray-900 flex items-center gap-2 flex-wrap">
                  {r.title || '(no title)'}
                  {r.isSeeded && (
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200"
                      title="Generated by scripts/seed-reviews.ts. Auto-marked is_seeded=true."
                    >
                      seeded
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-600">
                  by {r.reviewerName} for{' '}
                  <Link
                    href={`/venues/${r.venueSlug}`}
                    target="_blank"
                    className="underline hover:text-pink-600"
                  >
                    {r.venueName}
                  </Link>
                  {' · '}
                  {new Date(r.submittedAt).toLocaleString()}
                </p>
              </div>
              <div className="text-amber-500 text-lg" aria-label={`${r.rating} of 5 stars`}>
                {'★'.repeat(r.rating)}
                {'☆'.repeat(5 - r.rating)}
              </div>
            </div>

            {r.weddingDate && (
              <p className="text-xs text-gray-500 mb-2">
                Wedding date: {new Date(r.weddingDate).toLocaleDateString()}
              </p>
            )}

            <div className="bg-gray-50 rounded-md p-3 text-sm text-gray-800 whitespace-pre-line">
              {r.body}
            </div>

            {r.reviewerEmail && (
              <p className="text-xs text-gray-500 mt-2">
                Email on file: {r.reviewerEmail}
              </p>
            )}

            <div className="flex flex-wrap gap-2 mt-4">
              <button
                onClick={() => moderate(r.id, 'approved')}
                disabled={acting === r.id}
                className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md disabled:bg-green-300"
              >
                Approve
              </button>
              <button
                onClick={() => moderate(r.id, 'rejected')}
                disabled={acting === r.id}
                className="px-4 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-sm font-medium rounded-md disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-medium transition ${
        active
          ? 'bg-pink-600 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  );
}
