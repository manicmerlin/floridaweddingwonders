import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ClaimsQueueClient, {
  type ClaimRow,
} from '@/components/admin/ClaimsQueueClient';
import { createSupabaseAdminClient } from '@/lib/supabaseServer';

// Server-rendered. Authorization is enforced by src/app/admin/layout.tsx
// (requireSuperAdmin); this page just queries.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Venue Claims | Admin',
  robots: { index: false, follow: false },
};

interface PendingClaim {
  id: string;
  venue_id: string;
  intended_tier: 'starter' | 'growth' | 'scale' | null;
  requester_name: string;
  requester_email: string;
  requester_phone: string | null;
  business_name: string | null;
  relationship_to_venue: string | null;
  notes: string | null;
  subscription_id: string | null;
  created_at: string;
  venues: {
    name: string;
    slug: string;
    legacy_id: string | null;
    images: unknown;
    contact_email_real: boolean | null;
  } | null;
}

async function fetchPendingClaims(): Promise<ClaimRow[]> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('claim_requests')
    .select(
      `id, venue_id, intended_tier, requester_name, requester_email, requester_phone,
       business_name, relationship_to_venue, notes, subscription_id, created_at,
       venues:venue_id ( name, slug, legacy_id, images, contact_email_real )`
    )
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .returns<PendingClaim[]>();

  if (error) {
    console.error('admin/claims fetch failed:', error);
    return [];
  }

  // Phase 6: aggregate venue stats inline. One query per cohort instead of
  // N queries — pull all relevant view/lead rows in two batched calls and
  // group in memory.
  const rows = data ?? [];
  const venueUuids = rows.map((r) => r.venue_id).filter(Boolean);
  const legacyIds = rows.map((r) => r.venues?.legacy_id ?? '').filter(Boolean);
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const since90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: views }, { data: leads }] = await Promise.all([
    venueUuids.length === 0
      ? Promise.resolve({ data: [] })
      : admin
          .from('venue_views')
          .select('venue_id, is_unique')
          .in('venue_id', venueUuids)
          .gte('viewed_at', since30),
    venueUuids.length === 0 && legacyIds.length === 0
      ? Promise.resolve({ data: [] })
      : admin
          .from('venue_leads')
          .select('venue_id')
          .in('venue_id', [...venueUuids, ...legacyIds])
          .gte('submitted_at', since90),
  ]);

  const viewsByVenue = new Map<string, { total: number; unique: number }>();
  for (const v of (views ?? []) as any[]) {
    const cur = viewsByVenue.get(v.venue_id) ?? { total: 0, unique: 0 };
    cur.total += 1;
    if (v.is_unique) cur.unique += 1;
    viewsByVenue.set(v.venue_id, cur);
  }
  const leadsByKey = new Map<string, number>();
  for (const l of (leads ?? []) as any[]) {
    leadsByKey.set(l.venue_id, (leadsByKey.get(l.venue_id) ?? 0) + 1);
  }

  return rows.map((row) => {
    const v = viewsByVenue.get(row.venue_id) ?? { total: 0, unique: 0 };
    const inquiries =
      (leadsByKey.get(row.venue_id) ?? 0) +
      (row.venues?.legacy_id ? leadsByKey.get(row.venues.legacy_id) ?? 0 : 0);
    return {
      id: row.id,
      venueName: row.venues?.name ?? '(unknown venue)',
      venueSlug: row.venues?.slug ?? '',
      requesterName: row.requester_name,
      requesterEmail: row.requester_email,
      requesterPhone: row.requester_phone,
      businessName: row.business_name,
      relationshipToVenue: row.relationship_to_venue,
      notes: row.notes,
      intendedTier: row.intended_tier,
      hasSubscription: !!row.subscription_id,
      createdAt: row.created_at,
      venueStats: {
        views30d: v.total,
        uniqueViews30d: v.unique,
        inquiries90d: inquiries,
        photoCount: Array.isArray(row.venues?.images) ? (row.venues!.images as any[]).length : 0,
        contactEmailReal: !!row.venues?.contact_email_real,
      },
    };
  });
}

export default async function AdminClaimsPage() {
  const claims = await fetchPendingClaims();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Venue Claims Queue</h1>
            <p className="text-gray-600 mt-1">
              {claims.length} pending {claims.length === 1 ? 'claim' : 'claims'}
            </p>
          </div>
          <Link
            href="/admin"
            className="text-sm text-purple-600 hover:text-purple-800 font-medium"
          >
            ← Admin home
          </Link>
        </div>

        <ClaimsQueueClient claims={claims} />
      </div>

      <Footer />
    </div>
  );
}
