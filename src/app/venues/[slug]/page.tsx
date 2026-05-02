import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import VenueDetailClient from '@/components/venues/VenueDetailClient';
import {
  getVenueByLegacyId,
  getVenueBySlug,
  getVenues,
} from '@/lib/catalog';
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
  return {
    title: `${venue.name} | Florida Wedding Wonders`,
    description: venue.description,
    alternates: { canonical: `https://floridaweddingwonders.com/venues/${venue.slug}` },
    openGraph: {
      title: venue.name,
      description: venue.description,
      url: `https://floridaweddingwonders.com/venues/${venue.slug}`,
      type: 'website',
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
  const [reviews, aggregate] = await Promise.all([
    getApprovedReviewsForVenue(venueUuid),
    getAggregateRatingForVenue(venueUuid),
  ]);
  const venueWithRating = aggregate
    ? {
        ...venue,
        reviews: { rating: aggregate.average, count: aggregate.count, reviews: [] },
      }
    : venue;

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
      <VenueDetailClient venue={venueWithRating} relatedVenues={relatedVenues} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 pb-12">
        <VenueReviewsSection
          venueUuid={venueUuid}
          venueName={venue.name}
          reviews={reviews}
          aggregate={aggregate}
        />
      </div>
    </>
  );
}
