import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import VendorHyperlocalLanding from '@/components/hyperlocal/VendorHyperlocalLanding';
import { getVendors } from '@/lib/catalog';
import { getRegionBySlug, regionSlugs, REGIONS } from '@/lib/hyperlocal';
import {
  getVendorCategoryBySlug,
  vendorCategorySlugs,
  filterVendorsByRegionAndCategory,
  filterVendorsByRegion,
  filterVendorsByCategory,
  VENDOR_CATEGORIES,
} from '@/lib/hyperlocalVendors';
import { breadcrumbLD, vendorCollectionPageLD, jsonLdScript } from '@/lib/structuredData';

export const dynamic = 'force-static';
export const revalidate = 3600;

export function generateStaticParams() {
  // Pre-generate every region × category combo. Even empty ones render —
  // the page falls back to a cross-link panel rather than 404'ing, which
  // keeps the SEO surface predictable. Anything outside this allowlist
  // 404s via the `notFound()` checks below.
  const params: { region: string; category: string }[] = [];
  for (const region of regionSlugs()) {
    for (const category of vendorCategorySlugs()) {
      params.push({ region, category });
    }
  }
  return params;
}

export async function generateMetadata(props: {
  params: Promise<{ region: string; category: string }>;
}): Promise<Metadata> {
  const { region: regionSlug, category: categorySlug } = await props.params;
  const region = getRegionBySlug(regionSlug);
  const category = getVendorCategoryBySlug(categorySlug);
  if (!region || !category) return { title: 'Wedding Vendors' };

  const title = `${category.pluralName} in ${region.name} | Florida Wedding Wonders`;
  const description = `Curated ${category.bodyNoun}s serving ${region.name} weddings. Specialties, service areas, and direct contact info on every listing.`;
  return {
    title,
    description,
    alternates: {
      canonical: `https://floridaweddingwonders.com/vendors/in/${region.slug}/${category.slug}`,
    },
    openGraph: { title, description },
  };
}

export default async function VendorRegionCategoryLandingPage(props: {
  params: Promise<{ region: string; category: string }>;
}) {
  const { region: regionSlug, category: categorySlug } = await props.params;
  const region = getRegionBySlug(regionSlug);
  const category = getVendorCategoryBySlug(categorySlug);
  if (!region || !category) notFound();

  const allVendors = await getVendors();
  const vendors = filterVendorsByRegionAndCategory(allVendors, region, category);

  const intro = vendors.length === 0
    ? `Looking for a ${category.bodyNoun} in ${region.name}? We don't have any ${region.shortName === 'the Keys' ? 'Keys-based' : `${region.shortName}-based`} ${category.pluralName.toLowerCase()} in our directory yet — but we're adding new vendors monthly. The links below point to the closest matches: every ${category.pluralName.toLowerCase().replace(/s$/, '')} we have statewide, and every vendor we have in ${region.shortName}.`
    : `${category.flavor}, paired with the ${region.shortName} setting. We've cataloged ${vendors.length} ${category.bodyNoun}${vendors.length === 1 ? '' : 's'} ${region.shortName === 'the Keys' ? 'across the Keys' : `in ${region.shortName}`}. Each listing includes specialties, service area, and direct contact info so you can reach out fast. Use the multi-quote form to send wedding details to multiple venues at once and assemble the rest of the team from there.`;

  // Related strip: same category in other regions, plus other categories
  // in this same region — caps each list at 4 items so the strip stays
  // browseable, not a wall of links.
  const related: { label: string; href: string }[] = [];
  let sameCatCount = 0;
  for (const r of REGIONS) {
    if (r.slug === region.slug) continue;
    const count = filterVendorsByRegionAndCategory(allVendors, r, category).length;
    if (count > 0 && sameCatCount < 4) {
      related.push({
        label: `${category.pluralName} in ${r.shortName} (${count})`,
        href: `/vendors/in/${r.slug}/${category.slug}`,
      });
      sameCatCount++;
    }
  }
  let sameRegionCount = 0;
  for (const c of VENDOR_CATEGORIES) {
    if (c.slug === category.slug) continue;
    const count = filterVendorsByRegionAndCategory(allVendors, region, c).length;
    if (count > 0 && sameRegionCount < 4) {
      related.push({
        label: `${c.pluralName} in ${region.shortName} (${count})`,
        href: `/vendors/in/${region.slug}/${c.slug}`,
      });
      sameRegionCount++;
    }
  }

  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: 'Wedding Vendors', href: '/vendors' },
    { name: region.name, href: `/vendors/in/${region.slug}` },
    { name: category.pluralName, href: `/vendors/in/${region.slug}/${category.slug}` },
  ];

  // Empty-state suggestions — the audit was specific that empty intersection
  // pages must NOT 404. Two anchored cross-links: same category statewide,
  // and same region across categories. Both pages are guaranteed to exist
  // because they're in the allowlist.
  const statewideCount = filterVendorsByCategory(allVendors, category).length;
  const regionTotal = filterVendorsByRegion(allVendors, region).length;
  const emptyStateSuggestions = vendors.length === 0
    ? [
        {
          label: `View all ${category.pluralName} statewide`,
          href: `/vendors/category/${category.slug}`,
          description: `${statewideCount} ${category.pluralName.toLowerCase()} across Florida.`,
        },
        {
          label: `All vendors in ${region.name}`,
          href: `/vendors/in/${region.slug}`,
          description: `${regionTotal} ${region.shortName} vendors across every category.`,
        },
        {
          label: 'Browse the full vendor directory',
          href: '/vendors',
          description: 'Filter by category, search by name or specialty.',
        },
        {
          label: 'Get matched via multi-quote',
          href: '/quotes/request',
          description: "Send your wedding details and we'll surface fits.",
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
              name: `${category.pluralName} in ${region.name}`,
              description: `${vendors.length} ${category.bodyNoun}${vendors.length === 1 ? '' : 's'} for weddings in ${region.name}, Florida.`,
              path: `/vendors/in/${region.slug}/${category.slug}`,
              vendors,
            })
          ),
        }}
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900">
        <Navigation />
        <VendorHyperlocalLanding
          h1={`${category.pluralName} in ${region.name}`}
          intro={intro}
          breadcrumbs={breadcrumbs}
          listingHeading={`${category.pluralName} in ${region.shortName}`}
          vendors={vendors}
          related={related}
          emptyStateSuggestions={emptyStateSuggestions}
        />
        <Footer />
      </div>
    </>
  );
}
