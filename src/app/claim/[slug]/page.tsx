import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { getVenueBySlug } from '@/lib/catalog';
import { createSupabaseAdminClient } from '@/lib/supabaseServer';

// Phase 6 — personalized cold-outreach claim landing page.
//
// Linked from cold-outreach emails (UTM-tagged) so a venue owner who clicks
// arrives on a splash that names their venue, shows what we already have on
// file, and surfaces real engagement numbers (last 30d views, last 90d
// inquiries) so the claim has tangible motivation behind it.
//
// "Claim this listing" → /venues/[slug]?claim=1 → modal auto-opens via
// VenueClaimButton's useSearchParams effect (added in this same PR).

export const dynamic = 'force-dynamic';
export const revalidate = 600;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const venue = await getVenueBySlug(params.slug);
  if (!venue) return { title: 'Claim your venue' };
  return {
    title: `Claim ${venue.name} | Florida Wedding Wonders`,
    description: `${venue.name} is listed on Florida Wedding Wonders. Claim it to manage photos, respond to inquiries, and unlock priority placement.`,
    robots: { index: false, follow: false }, // Don't index personalized claim pages
  };
}

interface VenueStats {
  views30d: number;
  uniqueViews30d: number;
  inquiries90d: number;
  isClaimed: boolean;
}

async function getVenueStatsForClaim(
  venueUuid: string,
  legacyId: string | null
): Promise<VenueStats> {
  const admin = createSupabaseAdminClient();
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const since90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: views }, { count: leadsCount }, { data: ownerships }] = await Promise.all([
    admin
      .from('venue_views')
      .select('is_unique')
      .eq('venue_id', venueUuid)
      .gte('viewed_at', since30),
    admin
      .from('venue_leads')
      .select('*', { count: 'exact', head: true })
      .in('venue_id', [legacyId, venueUuid].filter(Boolean) as string[])
      .gte('submitted_at', since90),
    admin
      .from('venue_ownerships')
      .select('id')
      .eq('venue_id', venueUuid)
      .eq('status', 'active')
      .limit(1),
  ]);

  const viewsArr = (views ?? []) as Array<{ is_unique: boolean }>;
  return {
    views30d: viewsArr.length,
    uniqueViews30d: viewsArr.filter((v) => v.is_unique).length,
    inquiries90d: leadsCount ?? 0,
    isClaimed: !!ownerships && ownerships.length > 0,
  };
}

export default async function ClaimSplashPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { utm_source?: string; utm_campaign?: string };
}) {
  const venue = await getVenueBySlug(params.slug);
  if (!venue) notFound();

  const stats = await getVenueStatsForClaim(venue.uuid ?? venue.id, venue.id);
  const primaryImage =
    venue.images?.find((i) => i.isPrimary)?.url || venue.images?.[0]?.url;

  // Pass UTM params through to the claim modal so the entire funnel keeps
  // attribution. Existing modal opens via ?claim=1.
  const claimQs = new URLSearchParams({ claim: '1' });
  if (searchParams.utm_source) claimQs.set('utm_source', searchParams.utm_source);
  if (searchParams.utm_campaign) claimQs.set('utm_campaign', searchParams.utm_campaign);
  const claimHref = `/venues/${venue.slug}?${claimQs.toString()}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <Navigation />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <header className="text-center mb-10">
          <span className="inline-block px-3 py-1 bg-pink-100 text-pink-700 text-sm font-semibold rounded-full mb-4">
            Hi, {venue.name}!
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3 leading-tight">
            Your venue is on Florida Wedding Wonders.<br />
            <span className="text-pink-600">Claim it to manage your listing.</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We've already cataloged {venue.name} as a {venue.venueType} venue in {venue.address.city}.
            Owners who claim their listing manage their own photos, respond to inquiries
            directly, and unlock priority placement on regional + style-based search pages.
          </p>
        </header>

        {/* Already-claimed state */}
        {stats.isClaimed && (
          <div className="mb-8 rounded-2xl border-2 border-amber-300 bg-amber-50 p-6 text-amber-900">
            <h2 className="font-bold text-lg mb-1">This listing is already claimed.</h2>
            <p className="text-sm">
              If you believe this is an error or you're a co-owner who needs access, contact us at{' '}
              <a href="mailto:hello@floridaweddingwonders.com" className="underline font-medium">
                hello@floridaweddingwonders.com
              </a>{' '}
              and we'll sort it out.
            </p>
          </div>
        )}

        {/* Engagement stats */}
        <section className="grid sm:grid-cols-3 gap-4 mb-10">
          <StatTile
            label="Page views"
            value={stats.views30d.toLocaleString()}
            sublabel="last 30 days"
            accent="pink"
          />
          <StatTile
            label="Unique visitors"
            value={stats.uniqueViews30d.toLocaleString()}
            sublabel="last 30 days"
            accent="purple"
          />
          <StatTile
            label="Inquiries received"
            value={stats.inquiries90d.toLocaleString()}
            sublabel="last 90 days"
            accent="blue"
          />
        </section>

        {/* Listing preview + CTA */}
        <section className="grid md:grid-cols-2 gap-6 items-center bg-white rounded-2xl shadow-md p-6 sm:p-8">
          <div>
            {primaryImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={primaryImage}
                alt={venue.name}
                className="rounded-xl w-full h-64 object-cover"
                loading="lazy"
              />
            ) : (
              <div className="rounded-xl w-full h-64 bg-gradient-to-br from-pink-300 to-purple-400 flex items-center justify-center text-white text-5xl">
                💒
              </div>
            )}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
              Your current listing
            </p>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{venue.name}</h2>
            <p className="text-gray-700 mb-3 leading-relaxed line-clamp-3">
              {venue.description || `${venue.venueType} venue in ${venue.address.city}.`}
            </p>
            <dl className="text-sm text-gray-600 mb-5 space-y-1">
              <div>
                <dt className="inline font-medium text-gray-900">Capacity:</dt>{' '}
                <dd className="inline">{venue.capacity.min}–{venue.capacity.max} guests</dd>
              </div>
              <div>
                <dt className="inline font-medium text-gray-900">Type:</dt>{' '}
                <dd className="inline capitalize">{venue.venueType}</dd>
              </div>
              <div>
                <dt className="inline font-medium text-gray-900">Photos on file:</dt>{' '}
                <dd className="inline">{venue.images?.length ?? 0}</dd>
              </div>
            </dl>
            <Link
              href={stats.isClaimed ? `/venues/${venue.slug}` : claimHref}
              className="inline-block bg-gradient-to-r from-pink-600 to-purple-600 hover:shadow-lg text-white font-semibold px-6 py-3 rounded-lg transition"
            >
              {stats.isClaimed ? 'View public listing →' : 'Claim this listing →'}
            </Link>
            {!stats.isClaimed && (
              <p className="mt-2 text-xs text-gray-500">
                Free starter tier. Paid tiers unlock priority placement, multi-photo
                galleries, and analytics.
              </p>
            )}
          </div>
        </section>

        {/* What you get */}
        {!stats.isClaimed && (
          <section className="mt-10 grid md:grid-cols-3 gap-4">
            {[
              {
                title: 'Manage your photos',
                blurb:
                  'Upload, reorder, and remove. Most listings come from web archives — yours probably needs a refresh.',
                icon: '📸',
              },
              {
                title: 'Receive inquiries directly',
                blurb:
                  'Every inquiry routed to your inbox plus the in-dashboard pipeline (new → viewed → responded → archived).',
                icon: '📨',
              },
              {
                title: 'Track your traffic',
                blurb:
                  'See views, unique visitors, and conversion rates per month — same data we use to score venues.',
                icon: '📊',
              },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-xl p-5 border border-gray-100">
                <div className="text-3xl mb-2">{f.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-600">{f.blurb}</p>
              </div>
            ))}
          </section>
        )}

        {/* Trust signal */}
        <p className="text-center text-sm text-gray-500 mt-8">
          Florida Wedding Wonders catalogs 130+ venues across the state. Listings
          are free; paid tiers are optional and start at $29/mo.
        </p>
      </main>
      <Footer />
    </div>
  );
}

function StatTile({
  label,
  value,
  sublabel,
  accent,
}: {
  label: string;
  value: string;
  sublabel: string;
  accent: 'pink' | 'purple' | 'blue';
}) {
  const accentClass = {
    pink: 'text-pink-600',
    purple: 'text-purple-600',
    blue: 'text-blue-600',
  }[accent];
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 text-center">
      <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${accentClass}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{sublabel}</p>
    </div>
  );
}
