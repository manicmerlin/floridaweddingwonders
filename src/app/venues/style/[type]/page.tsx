import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import HyperlocalLanding from '@/components/hyperlocal/HyperlocalLanding';
import { getVenues } from '@/lib/catalog';
import {
  getVenueTypeBySlug,
  venueTypeSlugs,
  filterVenuesByType,
  filterVenuesByRegionAndType,
  REGIONS,
  priceBandFromVenues,
  formatPriceBand,
} from '@/lib/hyperlocal';
import { breadcrumbLD, collectionPageLD, jsonLdScript } from '@/lib/structuredData';
import { decorateVenuesWithRatings } from '@/lib/reviews';

export const dynamic = 'force-static';
export const revalidate = 3600;

export function generateStaticParams() {
  return venueTypeSlugs().map((type) => ({ type }));
}

export async function generateMetadata(props: {
  params: Promise<{ type: string }>;
}): Promise<Metadata> {
  const { type: typeSlug } = await props.params;
  const type = getVenueTypeBySlug(typeSlug);
  if (!type) return { title: 'Wedding Venues' };

  const title = `${type.name} Wedding Venues in Florida | Florida Wedding Wonders`;
  const description = `Hand-picked ${type.name.toLowerCase()} wedding venues across Florida. Compare photos, capacity, and pricing.`;
  return {
    title,
    description,
    alternates: { canonical: `https://floridaweddingwonders.com/venues/style/${type.slug}` },
    openGraph: { title, description },
  };
}

export default async function VenueTypeLandingPage(props: {
  params: Promise<{ type: string }>;
}) {
  const { type: typeSlug } = await props.params;
  const type = getVenueTypeBySlug(typeSlug);
  if (!type) notFound();

  const allVenues = await getVenues();
  const venues = await decorateVenuesWithRatings(filterVenuesByType(allVenues, type));
  const priceBand = priceBandFromVenues(venues);

  const priceCopy = priceBand
    ? `Starting prices range from ${formatPriceBand(priceBand)}.`
    : 'Pricing varies — request quotes for the venues that fit your aesthetic.';

  const intro = `${type.flavor}. We've cataloged ${venues.length} ${type.name.toLowerCase()} ${venues.length === 1 ? 'venue' : 'venues'} across South Florida, from the Keys to Palm Beach. ${priceCopy} Browse by region below if you want to narrow further, or use the multi-quote form to send your details to up to five at once. Every listing includes a verified photo gallery, capacity range, and direct contact details so you can reach out the moment you find your match.`;

  // Related strip — every region with this venue type (skip empties).
  const related = REGIONS
    .map((r) => ({
      region: r,
      count: filterVenuesByRegionAndType(allVenues, r, type).length,
    }))
    .filter((x) => x.count > 0)
    .map(({ region, count }) => ({
      label: `${type.name} venues in ${region.shortName} (${count})`,
      href: `/venues/in/${region.slug}/${type.slug}`,
    }));

  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: 'Wedding Venues', href: '/venues' },
    { name: `${type.name} venues`, href: `/venues/style/${type.slug}` },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbLD(breadcrumbs)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            collectionPageLD({
              name: `${type.name} Wedding Venues in Florida`,
              description: `Curated list of ${venues.length} ${type.name.toLowerCase()} wedding venues in Florida.`,
              path: `/venues/style/${type.slug}`,
              venues,
            })
          ),
        }}
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900">
        <Navigation />
        <HyperlocalLanding
          h1={`${type.name} Wedding Venues in Florida`}
          intro={intro}
          breadcrumbs={breadcrumbs}
          listingHeading={`All ${type.name.toLowerCase()} venues`}
          venues={venues}
          related={related}
        />
        <Footer />
      </div>
    </>
  );
}
