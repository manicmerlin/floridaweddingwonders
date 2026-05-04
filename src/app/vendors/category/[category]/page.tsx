import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import VendorHyperlocalLanding from '@/components/hyperlocal/VendorHyperlocalLanding';
import { getVendors } from '@/lib/catalog';
import {
  getVendorCategoryBySlug,
  vendorCategorySlugs,
  filterVendorsByCategory,
  filterVendorsByRegionAndCategory,
  REGIONS,
} from '@/lib/hyperlocalVendors';
import { breadcrumbLD, vendorCollectionPageLD, jsonLdScript } from '@/lib/structuredData';

export const dynamic = 'force-static';
export const revalidate = 3600;

export function generateStaticParams() {
  return vendorCategorySlugs().map((category) => ({ category }));
}

export async function generateMetadata(props: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: categorySlug } = await props.params;
  const category = getVendorCategoryBySlug(categorySlug);
  if (!category) return { title: 'Wedding Vendors' };

  const title = `${category.pluralName} for Florida Weddings | Florida Wedding Wonders`;
  const description = `Browse curated ${category.bodyNoun}s across Florida. Compare specialties, locations, and direct contact info — all in one place.`;
  return {
    title,
    description,
    alternates: { canonical: `https://floridaweddingwonders.com/vendors/category/${category.slug}` },
    openGraph: { title, description },
  };
}

export default async function VendorCategoryLandingPage(props: {
  params: Promise<{ category: string }>;
}) {
  const { category: categorySlug } = await props.params;
  const category = getVendorCategoryBySlug(categorySlug);
  if (!category) notFound();

  const allVendors = await getVendors();
  const vendors = filterVendorsByCategory(allVendors, category);

  const intro = `${category.flavor}. We've cataloged ${vendors.length} ${category.bodyNoun}${vendors.length === 1 ? '' : 's'} across Florida — ${
    vendors.length === 0
      ? 'check back soon as we add more.'
      : 'every one verified, with direct contact details, service area, and a quick read on what they specialize in.'
  } Browse by region below if you want to narrow to vendors who routinely work in your area, or use the multi-quote form to send your wedding details to several venues at once and assemble the rest of the team from there.`;

  // Related strip — same category in each region with at least one match.
  const related = REGIONS
    .map((r) => ({
      region: r,
      count: filterVendorsByRegionAndCategory(allVendors, r, category).length,
    }))
    .filter((x) => x.count > 0)
    .map(({ region, count }) => ({
      label: `${category.pluralName} in ${region.shortName} (${count})`,
      href: `/vendors/in/${region.slug}/${category.slug}`,
    }));

  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: 'Wedding Vendors', href: '/vendors' },
    { name: category.pluralName, href: `/vendors/category/${category.slug}` },
  ];

  // Empty-state suggestions — when this category has zero vendors statewide
  // (rare but possible during early build-out), nudge couples toward the
  // index plus the closest adjacent category alphabetically.
  const emptyStateSuggestions = vendors.length === 0
    ? [
        {
          label: 'Browse all wedding vendors',
          href: '/vendors',
          description: 'See the full directory across every category.',
        },
        {
          label: 'Get matched with venues',
          href: '/quotes/request',
          description: 'Many venues bundle vendor packages — start there.',
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
              name: `${category.pluralName} for Florida Weddings`,
              description: `Curated list of ${vendors.length} ${category.bodyNoun}${vendors.length === 1 ? '' : 's'} for Florida weddings.`,
              path: `/vendors/category/${category.slug}`,
              vendors,
            })
          ),
        }}
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900">
        <Navigation />
        <VendorHyperlocalLanding
          h1={`${category.pluralName} for Florida Weddings`}
          intro={intro}
          breadcrumbs={breadcrumbs}
          listingHeading={`All Florida ${category.pluralName.toLowerCase()}`}
          vendors={vendors}
          related={related}
          emptyStateSuggestions={emptyStateSuggestions}
        />
        <Footer />
      </div>
    </>
  );
}
