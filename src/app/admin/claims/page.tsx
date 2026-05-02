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
  intended_tier: 'starter' | 'growth' | 'scale' | null;
  requester_name: string;
  requester_email: string;
  requester_phone: string | null;
  business_name: string | null;
  relationship_to_venue: string | null;
  notes: string | null;
  subscription_id: string | null;
  created_at: string;
  venues: { name: string; slug: string } | null;
}

async function fetchPendingClaims(): Promise<ClaimRow[]> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('claim_requests')
    .select(
      `id, intended_tier, requester_name, requester_email, requester_phone,
       business_name, relationship_to_venue, notes, subscription_id, created_at,
       venues:venue_id ( name, slug )`
    )
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .returns<PendingClaim[]>();

  if (error) {
    console.error('admin/claims fetch failed:', error);
    return [];
  }

  return (data ?? []).map((row) => ({
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
  }));
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
