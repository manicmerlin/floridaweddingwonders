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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(venueLocalBusinessLD(venue)),
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
      <VenueDetailClient venue={venue} relatedVenues={relatedVenues} />
    </>
  );
}
