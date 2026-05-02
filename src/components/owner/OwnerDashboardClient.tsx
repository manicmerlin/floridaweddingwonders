'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { OwnedVenueSummary, InquiryRow } from '@/lib/ownerDashboard';

interface Props {
  ownerEmail: string;
  venues: OwnedVenueSummary[];
  inquiries: InquiryRow[];
}

type Tab = 'venues' | 'inquiries' | 'analytics';

export default function OwnerDashboardClient({ ownerEmail, venues, inquiries }: Props) {
  const [tab, setTab] = useState<Tab>('venues');
  const newCount = inquiries.filter((i) => i.state === 'new').length;

  const totals = useMemo(
    () => ({
      views30d: venues.reduce((s, v) => s + v.views30d, 0),
      uniqueViews30d: venues.reduce((s, v) => s + v.uniqueViews30d, 0),
      totalLeads: venues.reduce((s, v) => s + v.totalLeadsLifetime, 0),
    }),
    [venues]
  );

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4 text-sm text-gray-600">
        Signed in as <strong className="text-gray-900">{ownerEmail}</strong>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex gap-6">
          <TabButton active={tab === 'venues'} onClick={() => setTab('venues')}>
            🏛️ My Venues ({venues.length})
          </TabButton>
          <TabButton active={tab === 'inquiries'} onClick={() => setTab('inquiries')}>
            📨 Inquiries
            {newCount > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-pink-100 text-pink-800">
                {newCount} new
              </span>
            )}
          </TabButton>
          <TabButton active={tab === 'analytics'} onClick={() => setTab('analytics')}>
            📊 Analytics
          </TabButton>
        </nav>
      </div>

      {tab === 'venues' && <VenuesPanel venues={venues} />}
      {tab === 'inquiries' && <InquiriesPanel inquiries={inquiries} />}
      {tab === 'analytics' && <AnalyticsPanel venues={venues} totals={totals} />}
    </>
  );
}

function TabButton({
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
      className={`py-3 px-1 border-b-2 text-sm font-medium whitespace-nowrap transition ${
        active
          ? 'border-pink-500 text-pink-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Venues panel
// ---------------------------------------------------------------------------

function VenuesPanel({ venues }: { venues: OwnedVenueSummary[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {venues.map((v) => (
        <div
          key={v.venueId}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{v.name}</h3>
              <p className="text-sm text-gray-500">{v.city}</p>
            </div>
            <TierBadge tier={v.tier} />
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4 text-center">
            <Stat label="Photos" value={v.imageCount} />
            <Stat label="Views (30d)" value={v.views30d} secondary={`${v.uniqueViews30d} unique`} />
            <Stat label="New leads" value={v.newLeadsCount} secondary={`${v.totalLeadsLifetime} total`} />
          </div>

          <div className="flex gap-2 flex-wrap">
            <Link
              href={`/venue-owner/venues/${v.slug}/edit`}
              className="flex-1 text-center px-3 py-2 bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium rounded-md"
            >
              Edit listing
            </Link>
            <Link
              href={`/venues/${v.slug}`}
              target="_blank"
              className="px-3 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-md"
            >
              View public
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

function TierBadge({ tier }: { tier: 'starter' | 'growth' | 'scale' }) {
  if (tier === 'scale') {
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950">
        ★ Founding Partner
      </span>
    );
  }
  if (tier === 'growth') {
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        Featured
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
      Starter
    </span>
  );
}

function Stat({
  label,
  value,
  secondary,
}: {
  label: string;
  value: number;
  secondary?: string;
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-2">
      <div className="text-xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
      {secondary && <div className="text-xs text-gray-400 mt-0.5">{secondary}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inquiries panel — pipeline-state controls
// ---------------------------------------------------------------------------

function InquiriesPanel({ inquiries }: { inquiries: InquiryRow[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setState = async (id: string, state: InquiryRow['state']) => {
    setError(null);
    setActingOn(id);
    try {
      const res = await fetch(`/api/owner/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state }),
      });
      if (!res.ok) {
        const r = await res.json().catch(() => ({}));
        setError(r.error || 'Could not update');
        return;
      }
      startTransition(() => router.refresh());
    } finally {
      setActingOn(null);
    }
  };

  if (inquiries.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-10 text-center">
        <div className="text-5xl mb-3">📭</div>
        <p className="text-gray-600">No inquiries yet. They'll show up here as couples reach out.</p>
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
        {inquiries.map((inq) => (
          <div
            key={inq.id}
            className={`bg-white rounded-xl shadow-sm border p-5 ${
              inq.state === 'new' ? 'border-pink-200 ring-1 ring-pink-100' : 'border-gray-100'
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
              <div>
                <h3 className="font-semibold text-gray-900">{inq.userName}</h3>
                <p className="text-sm text-gray-600">
                  for{' '}
                  <Link
                    href={`/venues/${inq.venueSlug}`}
                    target="_blank"
                    className="underline hover:text-pink-600"
                  >
                    {inq.venueName}
                  </Link>
                  {' · '}
                  {new Date(inq.submittedAt).toLocaleString()}
                </p>
              </div>
              <StateBadge state={inq.state} />
            </div>

            <div className="grid sm:grid-cols-3 gap-3 mt-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-500">Contact</dt>
                <dd className="text-gray-900">
                  <a href={`mailto:${inq.userEmail}`} className="text-pink-600 hover:underline">
                    {inq.userEmail}
                  </a>
                  {inq.userPhone && (
                    <>
                      <br />
                      <a href={`tel:${inq.userPhone}`} className="text-pink-600 hover:underline">
                        {inq.userPhone}
                      </a>
                    </>
                  )}
                </dd>
              </div>
              {inq.qualification && (
                <div className="sm:col-span-2">
                  <dt className="text-xs uppercase tracking-wide text-gray-500">Wedding details</dt>
                  <dd className="text-gray-700">
                    {[
                      inq.qualification.eventType,
                      inq.qualification.guestCount && `${inq.qualification.guestCount} guests`,
                      inq.qualification.venuebudget,
                      inq.qualification.dateFlexibility,
                      inq.qualification.preferredDate &&
                        `Preferred: ${new Date(inq.qualification.preferredDate).toLocaleDateString()}`,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </dd>
                </div>
              )}
            </div>

            <div className="mt-3 bg-gray-50 rounded-md p-3 text-sm text-gray-800 italic">
              "{inq.message}"
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {inq.state !== 'viewed' && inq.state !== 'responded' && (
                <button
                  onClick={() => setState(inq.id, 'viewed')}
                  disabled={actingOn === inq.id}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium rounded-md"
                >
                  Mark viewed
                </button>
              )}
              {inq.state !== 'responded' && (
                <button
                  onClick={() => setState(inq.id, 'responded')}
                  disabled={actingOn === inq.id}
                  className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-sm font-medium rounded-md"
                >
                  Mark responded
                </button>
              )}
              {inq.state !== 'archived' && (
                <button
                  onClick={() => setState(inq.id, 'archived')}
                  disabled={actingOn === inq.id}
                  className="px-3 py-1.5 hover:bg-gray-100 text-gray-600 text-sm rounded-md"
                >
                  Archive
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function StateBadge({ state }: { state: InquiryRow['state'] }) {
  const variant = {
    new: 'bg-pink-100 text-pink-800',
    viewed: 'bg-blue-100 text-blue-800',
    responded: 'bg-green-100 text-green-800',
    archived: 'bg-gray-100 text-gray-600',
  }[state];
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${variant}`}>
      {state}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Analytics panel — global summary
// ---------------------------------------------------------------------------

function AnalyticsPanel({
  venues,
  totals,
}: {
  venues: OwnedVenueSummary[];
  totals: { views30d: number; uniqueViews30d: number; totalLeads: number };
}) {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-5 text-center">
          <div className="text-3xl font-bold text-pink-600">{totals.views30d}</div>
          <div className="text-sm text-gray-500 mt-1">Views in last 30 days</div>
          <div className="text-xs text-gray-400">{totals.uniqueViews30d} unique</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 text-center">
          <div className="text-3xl font-bold text-purple-600">{totals.totalLeads}</div>
          <div className="text-sm text-gray-500 mt-1">Total inquiries</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 text-center">
          <div className="text-3xl font-bold text-amber-600">
            {totals.views30d > 0
              ? `${((venues.reduce((s, v) => s + v.totalLeadsLifetime, 0) / Math.max(totals.views30d, 1)) * 100).toFixed(1)}%`
              : '—'}
          </div>
          <div className="text-sm text-gray-500 mt-1">Conversion (lifetime ÷ 30d views)</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">Venue</th>
              <th className="text-right px-4 py-3">Views (30d)</th>
              <th className="text-right px-4 py-3">Unique</th>
              <th className="text-right px-4 py-3">New leads</th>
              <th className="text-right px-4 py-3">Total leads</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {venues.map((v) => (
              <tr key={v.venueId}>
                <td className="px-4 py-3 font-medium text-gray-900">{v.name}</td>
                <td className="px-4 py-3 text-right">{v.views30d}</td>
                <td className="px-4 py-3 text-right text-gray-500">{v.uniqueViews30d}</td>
                <td className="px-4 py-3 text-right">
                  {v.newLeadsCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-pink-100 text-pink-800">
                      {v.newLeadsCount}
                    </span>
                  )}
                  {v.newLeadsCount === 0 && <span className="text-gray-400">—</span>}
                </td>
                <td className="px-4 py-3 text-right text-gray-700">{v.totalLeadsLifetime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
