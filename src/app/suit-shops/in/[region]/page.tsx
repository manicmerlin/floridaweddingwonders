import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import SuitShopHyperlocalLanding from '@/components/hyperlocal/SuitShopHyperlocalLanding';
import { getSuitShops } from '@/lib/catalog';
import { getRegionBySlug, regionSlugs, REGIONS, venueInRegion } from '@/lib/hyperlocal';
import { breadcrumbLD, jsonLdScript } from '@/lib/structuredData';
import type { SuitShop } from '@/types';

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
  if (!region) return { title: 'Suit & Tuxedo Shops' };

  const title = `Suit & Tuxedo Shops in ${region.name} | Florida Wedding Wonders`;
  const description = `Bespoke tailors, tuxedo rentals, and suit boutiques in ${region.name} — ${region.shortName} grooms-to-be and groomsmen.`;
  return {
    title,
    description,
    alternates: { canonical: `https://floridaweddingwonders.com/suit-shops/in/${region.slug}` },
    openGraph: { title, description },
  };
}

/** Reuse venueInRegion (same city → region map applies to suit shops). */
function shopInRegion(shop: SuitShop, region: ReturnType<typeof getRegionBySlug>): boolean {
  if (!region) return false;
  return venueInRegion(shop as unknown as Parameters<typeof venueInRegion>[0], region);
}

export default async function SuitShopRegionLandingPage(props: {
  params: Promise<{ region: string }>;
}) {
  const { region: regionSlug } = await props.params;
  const region = getRegionBySlug(regionSlug);
  if (!region) notFound();

  const allShops = await getSuitShops();
  const shops = allShops.filter((s) => shopInRegion(s, region));

  const intro = shops.length > 0
    ? `${region.flavor}. We've cataloged ${shops.length} ${shops.length === 1 ? 'suit shop' : 'suit shops'} ${region.shortName === 'the Keys' ? 'across the Keys' : `in ${region.shortName}`} — bespoke tailors, tuxedo rentals, and made-to-measure boutiques. Each listing has direct contact details so the groom (and groomsmen) can book a fitting before suit-budget season hits.`
    : `Looking for a tailor or tuxedo shop in ${region.name}? We don't have any ${region.shortName} listings in the directory yet — we're actively scouting. Until then, the links below point to the closest covered regions and the statewide directory.`;

  const related = REGIONS
    .filter((r) => r.slug !== region.slug)
    .map((r) => ({
      region: r,
      count: allShops.filter((s) => shopInRegion(s, r)).length,
    }))
    .filter((x) => x.count > 0)
    .map(({ region: r, count }) => ({
      label: `Suit shops in ${r.shortName} (${count})`,
      href: `/suit-shops/in/${r.slug}`,
    }));

  const emptyStateSuggestions = shops.length === 0
    ? [
        ...REGIONS
          .filter((r) => r.slug !== region.slug && allShops.filter((s) => shopInRegion(s, r)).length > 0)
          .slice(0, 3)
          .map((r) => ({
            label: `Suit shops in ${r.name}`,
            href: `/suit-shops/in/${r.slug}`,
            description: `${allShops.filter((s) => shopInRegion(s, r)).length} listed.`,
          })),
        {
          label: 'Browse the full suit shop directory',
          href: '/suit-shops',
          description: `${allShops.length} shops across Florida.`,
        },
      ]
    : undefined;

  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: 'Suit & Tuxedo Shops', href: '/suit-shops' },
    { name: region.name, href: `/suit-shops/in/${region.slug}` },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbLD(breadcrumbs)) }}
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-stone-900">
        <Navigation />
        <SuitShopHyperlocalLanding
          h1={`Suit & Tuxedo Shops in ${region.name}`}
          intro={intro}
          breadcrumbs={breadcrumbs}
          listingHeading={`All ${region.shortName} suit shops`}
          shops={shops}
          related={related}
          emptyStateSuggestions={emptyStateSuggestions}
        />
        <Footer />
      </div>
    </>
  );
}
