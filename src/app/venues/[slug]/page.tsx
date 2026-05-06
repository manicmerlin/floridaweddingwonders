import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import VenueDetailClient from '@/components/venues/VenueDetailClient';
import {
  getClaimedVenueIds,
  getVendors,
  getVenueByLegacyId,
  getVenueBySlug,
  getVenues,
} from '@/lib/catalog';
import { vendorsServingCity, diversifyByKey } from '@/lib/crossLinking';
import {
  breadcrumbLD,
  jsonLdScript,
  venueLocalBusinessLD,
} from '@/lib/structuredData';
import {
  getApprovedReviewsForVenue,
  getAggregateRatingForVenue,
} from '@/lib/reviews';
import VenueReviewsSection from '@/components/reviews/VenueReviewsSection';
import Footer from '@/components/Footer';
import Link from 'next/link';

interface Params {
  params: { slug: string };
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  // Numeric param? It'll redirect; metadata for the legacy URL is fine to be
  // minimal — search engines will follow the 308 to the canonical slug URL
  // and re-index from there.
  const slug = params.slug;
  if (/^\d+$/.test(slug)) {
    return { title: 'Venue | Florida Wedding Wonders' };
  }
  const venue = await getVenueBySlug(slug);
  if (!venue) return { title: 'Venue | Florida Wedding Wonders' };

  const pinUrl = `https://floridaweddingwonders.com/venues/${venue.slug}/pin`;
  const description =
    venue.description ||
    `${venue.name} — ${venue.venueType} wedding venue in ${venue.address.city}, Florida.`;

  return {
    title: `${venue.name} | Florida Wedding Wonders`,
    description,
    alternates: { canonical: `https://floridaweddingwonders.com/venues/${venue.slug}` },
    openGraph: {
      title: venue.name,
      description,
      url: `https://floridaweddingwonders.com/venues/${venue.slug}`,
      type: 'website',
    },
    other: {
      // Pinterest rich-pin signals + 2:3 share image (Phase 6).
      // Pinterest crawls the page, finds these tags, and uses the 2:3 image
      // for the pin instead of the 1.91:1 og:image.
      'pinterest:image': pinUrl,
      'pinterest:description': description,
      'pinterest:rich-pin': 'true',
    },
  };
}

export default async function VenueSlugPage({ params }: Params) {
  const { slug } = params;

  // Legacy /venues/<numeric-id> → 308 to /venues/<slug> (preserves PageRank).
  if (/^\d+$/.test(slug)) {
    const venue = await getVenueByLegacyId(slug);
    if (!venue) notFound();
    permanentRedirect(`/venues/${venue.slug}`);
  }

  const venue = await getVenueBySlug(slug);
  if (!venue) notFound();

  // Related venues from the same city. Server-side N+1 avoided: one extra
  // query, in-memory filter to 3 results.
  const cityCohort = venue.address.city
    ? await getVenues({ filters: { city: venue.address.city } })
    : [];
  const relatedVenues = cityCohort.filter((v) => v.id !== venue.id);

  // Reviews + aggregate. Both queries hit RLS-gated public reads so no auth
  // is required. Decorate the venue with the live aggregate so JSON-LD
  // emits actual aggregateRating (the catalog default is {rating:0,count:0}).
  // venue.uuid is the Postgres UUID; the catalog mapper always populates it
  // (see rowToVenue in src/lib/catalog.ts) — the optional Venue.uuid in
  // src/types is a legacy artifact from when ids were string slugs.
  const venueUuid = venue.uuid ?? venue.id;
  const [reviews, aggregate, claimedIds] = await Promise.all([
    getApprovedReviewsForVenue(venueUuid),
    getAggregateRatingForVenue(venueUuid),
    getClaimedVenueIds(),
  ]);
  // Decorate with both the rating aggregate AND the isClaimed flag — the
  // detail-page hero gates real photos on isClaimed (same rule as cards).
  const isClaimed = venue.uuid ? claimedIds.has(venue.uuid) : false;
  const venueWithRating = aggregate
    ? {
        ...venue,
        isClaimed,
        reviews: { rating: aggregate.average, count: aggregate.count, reviews: [] },
      }
    : { ...venue, isClaimed };
  const decoratedRelated = relatedVenues.map((v) => ({
    ...v,
    isClaimed: v.uuid ? claimedIds.has(v.uuid) : false,
  }));

  // "Wedding pros who serve <city>" — pull all vendors, filter to those
  // serving this venue's city, then mix categories so the section shows
  // a photographer + florist + caterer rather than six photographers.
  const allVendors = await getVendors();
  const cityVendors = diversifyByKey(
    vendorsServingCity(allVendors, venue.address.city || ''),
    (v) => v.category,
    6
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(venueLocalBusinessLD(venueWithRating)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            breadcrumbLD([
              { name: 'Home', href: '/' },
              { name: 'Wedding Venues', href: '/venues' },
              { name: venue.name, href: `/venues/${venue.slug}` },
            ])
          ),
        }}
      />
      <VenueDetailClient
        venue={venueWithRating}
        relatedVenues={decoratedRelated}
        cityVendors={cityVendors}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 pb-12">
        <VenueReviewsSection
          venueUuid={venueUuid}
          venueName={venue.name}
          reviews={reviews}
          aggregate={aggregate}
        />
      </div>
      {/* Small "Own this venue?" cross-link — separate from the desktop-only
          VenueClaimButton inside VenueDetailClient. Mobile users miss that
          one entirely; this surfaces the package page on every screen. Only
          renders for unclaimed listings. */}
      {!isClaimed && <ClaimCallout slug={venue.slug} />}
      <Footer />
    </>
  );
}

async function ClaimCallout({ slug }: { slug: string }) {
  const t = await getTranslations('VenueDetail');
  return (
    <div className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-gray-700">
        {t('ownThisVenue')}{' '}
        <Link
          href={`/venue-packages?venue=${slug}`}
          className="text-pink-700 hover:text-pink-800 underline font-medium"
        >
          {t('claimAndManage')} →
        </Link>
      </div>
    </div>
  );
}
