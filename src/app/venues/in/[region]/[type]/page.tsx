import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import HyperlocalLanding from '@/components/hyperlocal/HyperlocalLanding';
import { getVenues } from '@/lib/catalog';
import {
  getRegionBySlug,
  getVenueTypeBySlug,
  combosWithCoverage,
  filterVenuesByRegionAndType,
  priceBandFromVenues,
  formatPriceBand,
  VENUE_TYPES,
  REGIONS,
} from '@/lib/hyperlocal';
import { breadcrumbLD, collectionPageLD, jsonLdScript } from '@/lib/structuredData';
import { decorateVenuesWithRatings } from '@/lib/reviews';

export const dynamic = 'force-static';
export const revalidate = 3600;

export async function generateStaticParams() {
  // Only build pages for combos with ≥3 venues; the others 404.
  const venues = await getVenues();
  return combosWithCoverage(venues, 3).map((c) => ({
    region: c.region.slug,
    type: c.type.slug,
  }));
}

export async function generateMetadata(props: {
  params: Promise<{ region: string; type: string }>;
}): Promise<Metadata> {
  const { region: regionSlug, type: typeSlug } = await props.params;
  const region = getRegionBySlug(regionSlug);
  const type = getVenueTypeBySlug(typeSlug);
  if (!region || !type) return { title: 'Wedding Venues' };

  const title = `${type.name} Wedding Venues in ${region.name} | Florida Wedding Wonders`;
  const description = `Curated ${type.name.toLowerCase()} wedding venues in ${region.name}. Photos, capacity, pricing, and direct contact.`;
  return {
    title,
    description,
    alternates: {
      canonical: `https://floridaweddingwonders.com/venues/in/${region.slug}/${type.slug}`,
    },
    openGraph: { title, description },
  };
}

export default async function RegionTypeLandingPage(props: {
  params: Promise<{ region: string; type: string }>;
}) {
  const { region: regionSlug, type: typeSlug } = await props.params;
  const region = getRegionBySlug(regionSlug);
  const type = getVenueTypeBySlug(typeSlug);
  if (!region || !type) notFound();

  const allVenues = await getVenues();
  const matched = filterVenuesByRegionAndType(allVenues, region, type);

  // Combos under coverage threshold should 404 — keeps the index clean and
  // avoids thin pages indexing for low-volume queries.
  if (matched.length < 3) notFound();
  const venues = await decorateVenuesWithRatings(matched);

  const priceBand = priceBandFromVenues(venues);
  const priceCopy = priceBand
    ? `Starting prices range from ${formatPriceBand(priceBand)}.`
    : 'Pricing varies between venues.';

  const intro = `${type.flavor}, paired with the ${region.shortName} setting. We've cataloged ${venues.length} ${type.name.toLowerCase()} ${venues.length === 1 ? 'venue' : 'venues'} ${region.shortName === 'the Keys' ? 'across the Keys' : `in ${region.shortName}`}. ${priceCopy} Each listing includes a verified photo gallery and direct contact details. Use the multi-quote form to send your wedding details to several venues at once — most respond within 24-48 hours.`;

  // Related strip: other venue types in the same region, plus same type
  // in other regions.
  const related: { label: string; href: string }[] = [];
  for (const t of VENUE_TYPES) {
    if (t.slug === type.slug) continue;
    const count = filterVenuesByRegionAndType(allVenues, region, t).length;
    if (count >= 3) {
      related.push({
        label: `${t.name} venues in ${region.shortName} (${count})`,
        href: `/venues/in/${region.slug}/${t.slug}`,
      });
    }
  }
  for (const r of REGIONS) {
    if (r.slug === region.slug) continue;
    const count = filterVenuesByRegionAndType(allVenues, r, type).length;
    if (count >= 3) {
      related.push({
        label: `${type.name} venues in ${r.shortName} (${count})`,
        href: `/venues/in/${r.slug}/${type.slug}`,
      });
    }
  }

  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: 'Wedding Venues', href: '/venues' },
    { name: region.name, href: `/venues/in/${region.slug}` },
    { name: type.name, href: `/venues/in/${region.slug}/${type.slug}` },
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
              name: `${type.name} Wedding Venues in ${region.name}`,
              description: `${venues.length} ${type.name.toLowerCase()} wedding ${
                venues.length === 1 ? 'venue' : 'venues'
              } in ${region.name}, Florida.`,
              path: `/venues/in/${region.slug}/${type.slug}`,
              venues,
            })
          ),
        }}
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900">
        <Navigation />
        <HyperlocalLanding
          h1={`${type.name} Wedding Venues in ${region.name}`}
          intro={intro}
          breadcrumbs={breadcrumbs}
          listingHeading={`${type.name} venues in ${region.shortName}`}
          venues={venues}
          related={related}
        />
        <Footer />
      </div>
    </>
  );
}
