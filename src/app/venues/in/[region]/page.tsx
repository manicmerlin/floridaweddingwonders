import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import HyperlocalLanding from '@/components/hyperlocal/HyperlocalLanding';
import { getVenues } from '@/lib/catalog';
import {
  getRegionBySlug,
  regionSlugs,
  filterVenuesByRegion,
  topTypesInRegion,
  priceBandFromVenues,
  formatPriceBand,
  VENUE_TYPES,
  filterVenuesByRegionAndType,
} from '@/lib/hyperlocal';
import { breadcrumbLD, collectionPageLD, jsonLdScript } from '@/lib/structuredData';
import { decorateVenuesWithRatings } from '@/lib/reviews';

export const dynamic = 'force-static';
export const revalidate = 3600;

export function generateStaticParams() {
  return regionSlugs().map((region) => ({ region }));
}

export async function generateMetadata(props: {
  params: Promise<{ region: string }>;
}): Promise<Metadata> {
  const { region: regionSlug } = await props.params;
  const region = getRegionBySlug(regionSlug);
  if (!region) return { title: 'Wedding Venues' };

  const title = `Wedding Venues in ${region.name} | Florida Wedding Wonders`;
  const description = `Browse curated wedding venues in ${region.name}. Compare capacities, prices, photos, and venue types — all in one place.`;
  return {
    title,
    description,
    alternates: { canonical: `https://floridaweddingwonders.com/venues/in/${region.slug}` },
    openGraph: { title, description },
  };
}

export default async function RegionLandingPage(props: {
  params: Promise<{ region: string }>;
}) {
  const { region: regionSlug } = await props.params;
  const region = getRegionBySlug(regionSlug);
  if (!region) notFound();

  const allVenues = await getVenues();
  const venues = await decorateVenuesWithRatings(filterVenuesByRegion(allVenues, region));

  const topTypes = topTypesInRegion(allVenues, region, 3);
  const priceBand = priceBandFromVenues(venues);

  // Templated 200-300 word intro using dynamic facts.
  const typeList =
    topTypes.length > 0
      ? topTypes.map((t) => t.type.name.toLowerCase()).join(', ')
      : 'a mix of styles';
  const priceCopy = priceBand
    ? `Starting prices range from ${formatPriceBand(priceBand)}.`
    : 'Pricing varies — request quotes for the venues that fit your aesthetic.';

  const intro = `${region.flavor}. We've cataloged ${venues.length} ${venues.length === 1 ? 'venue' : 'venues'} ${region.shortName === 'the Keys' ? 'across the Keys' : `in ${region.shortName}`}, with ${typeList} all well-represented. ${priceCopy} Use the multi-quote form below to send your wedding details to up to five venues at once and get faster responses than reaching out one by one. Every venue here is verified, includes a photo gallery, and lists capacity ranges so you can immediately see which ones fit your guest count. New ${region.shortName} venues are added monthly — bookmark this page for the latest.`;

  // Related strip — every type page within this region (skip empties).
  const related = VENUE_TYPES
    .map((t) => ({
      type: t,
      count: filterVenuesByRegionAndType(allVenues, region, t).length,
    }))
    .filter((x) => x.count > 0)
    .map(({ type, count }) => ({
      label: `${type.name} venues in ${region.shortName} (${count})`,
      href: `/venues/in/${region.slug}/${type.slug}`,
    }));

  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: 'Wedding Venues', href: '/venues' },
    { name: region.name, href: `/venues/in/${region.slug}` },
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
              name: `Wedding Venues in ${region.name}`,
              description: `Curated list of ${venues.length} wedding venues in ${region.name}, Florida.`,
              path: `/venues/in/${region.slug}`,
              venues,
            })
          ),
        }}
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900">
        <Navigation />
        <HyperlocalLanding
          h1={`Wedding Venues in ${region.name}`}
          intro={intro}
          breadcrumbs={breadcrumbs}
          listingHeading={`All ${region.name} venues`}
          venues={venues}
          related={related}
        />
        <Footer />
      </div>
    </>
  );
}
