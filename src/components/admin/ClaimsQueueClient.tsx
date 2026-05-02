'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export interface ClaimRow {
  id: string;
  venueName: string;
  venueSlug: string;
  requesterName: string;
  requesterEmail: string;
  requesterPhone: string | null;
  businessName: string | null;
  relationshipToVenue: string | null;
  notes: string | null;
  intendedTier: 'starter' | 'growth' | 'scale' | null;
  hasSubscription: boolean;
  createdAt: string;
}

export default function ClaimsQueueClient({ claims }: { claims: ClaimRow[] }) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string; reason: string } | null>(null);

  const approve = async (id: string) => {
    setError(null);
    setActingOn(id);
    try {
      const res = await fetch(`/api/admin/claims/${id}/approve`, { method: 'POST' });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(result?.error || `Approve failed (${res.status})`);
        return;
      }
      startTransition(() => router.refresh());
    } finally {
      setActingOn(null);
    }
  };

  const reject = async () => {
    if (!rejectModal) return;
    setError(null);
    setActingOn(rejectModal.id);
    try {
      const res = await fetch(`/api/admin/claims/${rejectModal.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectModal.reason || undefined }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(result?.error || `Reject failed (${res.status})`);
        return;
      }
      setRejectModal(null);
      startTransition(() => router.refresh());
    } finally {
      setActingOn(null);
    }
  };

  if (claims.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <span className="text-5xl block mb-3">📭</span>
        <p>No pending claims.</p>
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

      <div className="space-y-4">
        {claims.map((c) => {
          const tierLabel =
            c.intendedTier === 'scale'
              ? 'Scale ($2,500 lifetime)'
              : c.intendedTier === 'growth'
                ? 'Growth ($250/yr)'
                : 'Starter (free)';
          return (
            <div
              key={c.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    <a href={`/venues/${c.venueSlug}`} target="_blank" className="underline">
                      {c.venueName}
                    </a>
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Submitted {new Date(c.createdAt).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    c.intendedTier === 'scale'
                      ? 'bg-amber-100 text-amber-900'
                      : c.intendedTier === 'growth'
                        ? 'bg-purple-100 text-purple-900'
                        : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {tierLabel}
                </span>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mt-4 text-sm">
                <Row label="Requester">{c.requesterName}</Row>
                <Row label="Email">
                  <a href={`mailto:${c.requesterEmail}`} className="text-pink-600 underline">
                    {c.requesterEmail}
                  </a>
                </Row>
                {c.requesterPhone && (
                  <Row label="Phone">
                    <a href={`tel:${c.requesterPhone}`} className="text-pink-600">
                      {c.requesterPhone}
                    </a>
                  </Row>
                )}
                {c.businessName && <Row label="Business">{c.businessName}</Row>}
                {c.relationshipToVenue && (
                  <Row label="Relationship">{c.relationshipToVenue}</Row>
                )}
                {c.notes && (
                  <div className="col-span-full">
                    <dt className="text-gray-500 text-xs uppercase tracking-wide">Notes</dt>
                    <dd className="mt-1 text-gray-800 bg-gray-50 rounded p-2">{c.notes}</dd>
                  </div>
                )}
                {c.hasSubscription && (
                  <div className="col-span-full">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-semibold">
                      ✓ Stripe payment received — auto-approved by webhook
                    </span>
                  </div>
                )}
              </dl>

              <div className="flex flex-wrap gap-3 mt-5">
                <button
                  onClick={() => approve(c.id)}
                  disabled={busy || actingOn === c.id}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-medium rounded-md text-sm"
                >
                  {actingOn === c.id ? 'Approving…' : 'Approve & grant ownership'}
                </button>
                <button
                  onClick={() => setRejectModal({ id: c.id, reason: '' })}
                  disabled={busy || actingOn === c.id}
                  className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-md text-sm"
                >
                  Reject
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Reject claim</h3>
            <p className="text-sm text-gray-600 mb-4">
              Optionally include a reason — useful if the requester might re-submit with
              different info.
            </p>
            <textarea
              value={rejectModal.reason}
              onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
              rows={4}
              placeholder="Reason (optional, internal use)…"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-400"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setRejectModal(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={reject}
                disabled={busy}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-medium rounded-md"
              >
                {busy ? 'Rejecting…' : 'Reject claim'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-gray-500 text-xs uppercase tracking-wide">{label}</dt>
      <dd className="mt-0.5 text-gray-900">{children}</dd>
    </div>
  );
}
