import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import DressShopHyperlocalLanding from '@/components/hyperlocal/DressShopHyperlocalLanding';
import { getDressShops } from '@/lib/catalog';
import { getRegionBySlug, regionSlugs, REGIONS, venueInRegion } from '@/lib/hyperlocal';
import { breadcrumbLD, jsonLdScript } from '@/lib/structuredData';
import type { DressShop } from '@/types';

export const dynamic = 'force-static';
export const revalidate = 3600;

export function generateStaticParams() {
  // Pre-generate one page per known region. Regions with zero shops still
  // render — the empty state cross-links to neighbours so the URL never
  // 404s as long as the region slug is in the allowlist.
  return regionSlugs().map((region) => ({ region }));
}

export async function generateMetadata(props: {
  params: Promise<{ region: string }>;
}): Promise<Metadata> {
  const { region: regionSlug } = await props.params;
  const region = getRegionBySlug(regionSlug);
  if (!region) return { title: 'Bridal Shops' };

  const title = `Bridal Shops in ${region.name} | Florida Wedding Wonders`;
  const description = `Browse boutique bridal shops in ${region.name} — gowns, accessories, and styling appointments curated for ${region.shortName} brides.`;
  return {
    title,
    description,
    alternates: { canonical: `https://floridaweddingwonders.com/dress-shops/in/${region.slug}` },
    openGraph: { title, description },
  };
}

/** Reuse venueInRegion (same city → region map applies to dress shops). */
function shopInRegion(shop: DressShop, region: ReturnType<typeof getRegionBySlug>): boolean {
  if (!region) return false;
  // Duck-typed reuse — same shape on .address.city.
  return venueInRegion(shop as unknown as Parameters<typeof venueInRegion>[0], region);
}

export default async function DressShopRegionLandingPage(props: {
  params: Promise<{ region: string }>;
}) {
  const { region: regionSlug } = await props.params;
  const region = getRegionBySlug(regionSlug);
  if (!region) notFound();

  const allShops = await getDressShops();
  const shops = allShops.filter((s) => shopInRegion(s, region));

  const intro = shops.length > 0
    ? `${region.flavor}. We've cataloged ${shops.length} ${shops.length === 1 ? 'bridal shop' : 'bridal shops'} ${region.shortName === 'the Keys' ? 'across the Keys' : `in ${region.shortName}`}, with a mix of designer salons, boutiques, and appointment-only ateliers. Each listing includes specialties, brands carried, and direct contact details.`
    : `Looking for a bridal shop in ${region.name}? We don't have any ${region.shortName} boutiques in our directory yet — we're actively scouting. Until then, the links below point to the closest covered regions plus the full statewide directory.`;

  // Related strip — every other region with at least one shop.
  const related = REGIONS
    .filter((r) => r.slug !== region.slug)
    .map((r) => ({
      region: r,
      count: allShops.filter((s) => shopInRegion(s, r)).length,
    }))
    .filter((x) => x.count > 0)
    .map(({ region: r, count }) => ({
      label: `Bridal shops in ${r.shortName} (${count})`,
      href: `/dress-shops/in/${r.slug}`,
    }));

  // Empty-state suggestions — only used when shops.length === 0.
  const emptyStateSuggestions = shops.length === 0
    ? [
        ...REGIONS
          .filter((r) => r.slug !== region.slug && allShops.filter((s) => shopInRegion(s, r)).length > 0)
          .slice(0, 3)
          .map((r) => ({
            label: `Bridal shops in ${r.name}`,
            href: `/dress-shops/in/${r.slug}`,
            description: `${allShops.filter((s) => shopInRegion(s, r)).length} listed.`,
          })),
        {
          label: 'Browse the full bridal shop directory',
          href: '/dress-shops',
          description: `${allShops.length} shops across Florida.`,
        },
      ]
    : undefined;

  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: 'Bridal Shops', href: '/dress-shops' },
    { name: region.name, href: `/dress-shops/in/${region.slug}` },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbLD(breadcrumbs)) }}
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900">
        <Navigation />
        <DressShopHyperlocalLanding
          h1={`Bridal Shops in ${region.name}`}
          intro={intro}
          breadcrumbs={breadcrumbs}
          listingHeading={`All ${region.shortName} bridal shops`}
          shops={shops}
          related={related}
          emptyStateSuggestions={emptyStateSuggestions}
        />
        <Footer />
      </div>
    </>
  );
}
