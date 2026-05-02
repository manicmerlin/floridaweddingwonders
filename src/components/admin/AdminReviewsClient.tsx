'use client';

import { useState, useTransition } from 'react';
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
  const [error, setError] = useState<string | null>(null);

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
      <div className="space-y-3">
        {pending.map((r) => (
          <div key={r.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
              <div>
                <h3 className="font-semibold text-gray-900">{r.title || '(no title)'}</h3>
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
