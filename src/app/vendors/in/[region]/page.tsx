import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import VendorHyperlocalLanding from '@/components/hyperlocal/VendorHyperlocalLanding';
import { getVendors } from '@/lib/catalog';
import { getRegionBySlug, regionSlugs } from '@/lib/hyperlocal';
import {
  filterVendorsByRegion,
  filterVendorsByRegionAndCategory,
  topCategoriesInRegion,
  VENDOR_CATEGORIES,
} from '@/lib/hyperlocalVendors';
import { breadcrumbLD, vendorCollectionPageLD, jsonLdScript } from '@/lib/structuredData';

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
  if (!region) return { title: 'Wedding Vendors' };

  const title = `Wedding Vendors in ${region.name} | Florida Wedding Wonders`;
  const description = `Browse curated wedding vendors in ${region.name} — photographers, florists, caterers, planners, and more. Verified contact info on every listing.`;
  return {
    title,
    description,
    alternates: { canonical: `https://floridaweddingwonders.com/vendors/in/${region.slug}` },
    openGraph: { title, description },
  };
}

export default async function VendorRegionLandingPage(props: {
  params: Promise<{ region: string }>;
}) {
  const { region: regionSlug } = await props.params;
  const region = getRegionBySlug(regionSlug);
  if (!region) notFound();

  const allVendors = await getVendors();
  const vendors = filterVendorsByRegion(allVendors, region);

  const topCats = topCategoriesInRegion(allVendors, region, 4);
  const catList =
    topCats.length > 0
      ? topCats.map((t) => t.category.pluralName.toLowerCase()).join(', ')
      : 'a working mix of vendor categories';

  const intro = `${region.flavor}. We've cataloged ${vendors.length} ${vendors.length === 1 ? 'vendor' : 'vendors'} ${region.shortName === 'the Keys' ? 'across the Keys' : `in ${region.shortName}`}, with ${catList} all represented. Each listing includes specialties, service area, and direct contact details so you can reach out the moment a profile clicks. Browse by category below to narrow further, or send your wedding details through the multi-quote form and we'll surface the venue+vendor combinations that fit your date and guest count.`;

  // Related strip — every category page within this region (skip empties).
  const related = VENDOR_CATEGORIES
    .map((c) => ({
      category: c,
      count: filterVendorsByRegionAndCategory(allVendors, region, c).length,
    }))
    .filter((x) => x.count > 0)
    .map(({ category, count }) => ({
      label: `${category.pluralName} in ${region.shortName} (${count})`,
      href: `/vendors/in/${region.slug}/${category.slug}`,
    }));

  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: 'Wedding Vendors', href: '/vendors' },
    { name: region.name, href: `/vendors/in/${region.slug}` },
  ];

  // Empty-state suggestions — only relevant when zero vendors match this
  // region (sparse cities like the Keys can hit this for niche categories,
  // but the region landing should rarely be totally empty).
  const emptyStateSuggestions = vendors.length === 0
    ? [
        {
          label: 'Browse all wedding vendors',
          href: '/vendors',
          description: 'See every vendor in our directory, statewide.',
        },
        {
          label: `Wedding venues in ${region.name}`,
          href: `/venues/in/${region.slug}`,
          description: `Many ${region.shortName} venues offer in-house vendor packages.`,
        },
      ]
    : undefined;

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
            vendorCollectionPageLD({
              name: `Wedding Vendors in ${region.name}`,
              description: `Curated list of ${vendors.length} wedding ${vendors.length === 1 ? 'vendor' : 'vendors'} in ${region.name}, Florida.`,
              path: `/vendors/in/${region.slug}`,
              vendors,
            })
          ),
        }}
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900">
        <Navigation />
        <VendorHyperlocalLanding
          h1={`Wedding Vendors in ${region.name}`}
          intro={intro}
          breadcrumbs={breadcrumbs}
          listingHeading={`All ${region.name} vendors`}
          vendors={vendors}
          related={related}
          emptyStateSuggestions={emptyStateSuggestions}
        />
        <Footer />
      </div>
    </>
  );
}
