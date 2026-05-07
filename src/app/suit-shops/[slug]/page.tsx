import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import SuitShopDetailClient from '@/components/suit-shops/SuitShopDetailClient';
import {
  getSuitShopByLegacyId,
  getSuitShopBySlug,
  getSuitShops,
} from '@/lib/catalog';
import {
  breadcrumbLD,
  suitShopStoreLD,
  jsonLdScript,
} from '@/lib/structuredData';

interface Params {
  params: { slug: string };
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = params;
  if (/^\d+$/.test(slug)) return { title: 'Suit Shop | Florida Wedding Wonders' };
  const shop = await getSuitShopBySlug(slug);
  if (!shop) return { title: 'Suit Shop | Florida Wedding Wonders' };
  return {
    title: `${shop.name} | Florida Wedding Wonders`,
    description: shop.description,
    alternates: { canonical: `https://floridaweddingwonders.com/suit-shops/${shop.slug}` },
  };
}

export default async function SuitShopSlugPage({ params }: Params) {
  const { slug } = params;

  if (/^\d+$/.test(slug)) {
    const shop = await getSuitShopByLegacyId(slug);
    if (!shop) notFound();
    permanentRedirect(`/suit-shops/${shop.slug}`);
  }

  const suitShop = await getSuitShopBySlug(slug);
  if (!suitShop) {
    const byLegacy = await getSuitShopByLegacyId(slug);
    if (byLegacy && byLegacy.slug !== slug) {
      permanentRedirect(`/suit-shops/${byLegacy.slug}`);
    }
    notFound();
  }

  const cohort = await getSuitShops({ shopType: suitShop.shopType });
  const relatedShops = cohort.filter((s) => s.id !== suitShop.id).slice(0, 3);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(suitShopStoreLD(suitShop)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            breadcrumbLD([
              { name: 'Home', href: '/' },
              { name: 'Suit & Tuxedo Shops', href: '/suit-shops' },
              { name: suitShop.name, href: `/suit-shops/${suitShop.slug}` },
            ])
          ),
        }}
      />
      <SuitShopDetailClient suitShop={suitShop} relatedShops={relatedShops} />
    </>
  );
}
