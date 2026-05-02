import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import OwnerVenueEditForm from '@/components/owner/OwnerVenueEditForm';
import { getAppSession } from '@/lib/authServer';
import {
  getAnalyticsForVenue,
  requireOwnership,
  resolveVenueIdFromParam,
} from '@/lib/ownerDashboard';
import { tierFeatures } from '@/lib/tierFeatures';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

export default async function OwnerVenueEditPage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await getAppSession();
  if (!session) {
    redirect(`/login?next=/venue-owner/venues/${params.slug}/edit`);
  }

  const venueId = await resolveVenueIdFromParam(params.slug);
  if (!venueId) notFound();

  // Super admins can edit any venue; owners only their own.
  let venueRow: any = null;
  if (session.isSuperAdmin) {
    const owned = await requireOwnership(session.user.id, venueId);
    if (owned) {
      venueRow = owned.venue;
    } else {
      // Admin without an ownership row — fetch directly via service role.
      const { createSupabaseAdminClient } = await import('@/lib/supabaseServer');
      const admin = createSupabaseAdminClient();
      const { data } = await admin.from('venues').select('*').eq('id', venueId).maybeSingle();
      venueRow = data;
    }
  } else {
    const owned = await requireOwnership(session.user.id, venueId);
    if (!owned) {
      // Either signed in but doesn't own this venue, or ownership pending.
      redirect('/venue-owner/dashboard');
    }
    venueRow = owned.venue;
  }
  if (!venueRow) notFound();

  const analytics = await getAnalyticsForVenue(venueRow.id, venueRow.legacy_id);
  const tier = (venueRow.tier ?? 'starter') as 'starter' | 'growth' | 'scale';
  const features = tierFeatures(tier);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="text-sm text-gray-600 mb-4 flex items-center gap-2">
          <Link href="/venue-owner/dashboard" className="hover:text-pink-600">
            ← Dashboard
          </Link>
          <span>/</span>
          <span>{venueRow.name}</span>
        </nav>

        <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{venueRow.name}</h1>
            <p className="text-gray-600 mt-1">
              {venueRow.city ?? 'Florida'} · {tier === 'scale' ? '★ Founding Partner' : tier === 'growth' ? 'Featured' : 'Starter'} plan
            </p>
          </div>
          <Link
            href={`/venues/${venueRow.slug}`}
            target="_blank"
            className="text-sm text-pink-600 hover:text-pink-700 underline"
          >
            View public page →
          </Link>
        </div>

        {/* Per-venue analytics quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Quick label="Views (30d)" value={analytics.views30d} sub={`${analytics.uniqueViews30d} unique`} />
          <Quick label="Lifetime views" value={analytics.viewsLifetime} />
          <Quick label="Inquiries (30d)" value={analytics.inquiries30d} sub={`${analytics.inquiriesLifetime} lifetime`} />
          <Quick
            label="Conversion (30d)"
            value={`${(analytics.conversionRate30d * 100).toFixed(1)}%`}
          />
        </div>

        <OwnerVenueEditForm
          venue={{
            id: venueRow.id,
            slug: venueRow.slug,
            name: venueRow.name,
            description: venueRow.description ?? '',
            contactPhone: venueRow.contact_phone ?? '',
            contactEmail: venueRow.contact_email ?? '',
            contactWebsite: venueRow.contact_website ?? '',
            capacityText: venueRow.capacity_text ?? '',
            addressStreet: venueRow.address_street ?? '',
            addressZip: venueRow.address_zip ?? '',
            amenities: Array.isArray(venueRow.amenities) ? venueRow.amenities : [],
            tags: Array.isArray(venueRow.tags) ? venueRow.tags : [],
            images: Array.isArray(venueRow.images) ? venueRow.images : [],
            tier,
          }}
          maxPhotos={features.maxPhotos}
        />
      </main>

      <Footer />
    </div>
  );
}

function Quick({
  label,
  value,
  sub,
}: {
  label: string;
  value: number | string;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}
