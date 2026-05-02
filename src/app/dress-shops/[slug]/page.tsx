import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import DressShopDetailClient from '@/components/dress-shops/DressShopDetailClient';
import {
  getDressShopByLegacyId,
  getDressShopBySlug,
  getDressShops,
} from '@/lib/catalog';
import {
  breadcrumbLD,
  dressShopStoreLD,
  jsonLdScript,
} from '@/lib/structuredData';

interface Params {
  params: { slug: string };
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = params;
  if (/^\d+$/.test(slug)) return { title: 'Bridal Shop | Florida Wedding Wonders' };
  const shop = await getDressShopBySlug(slug);
  if (!shop) return { title: 'Bridal Shop | Florida Wedding Wonders' };
  return {
    title: `${shop.name} | Florida Wedding Wonders`,
    description: shop.description,
    alternates: { canonical: `https://floridaweddingwonders.com/dress-shops/${shop.slug}` },
  };
}

export default async function DressShopSlugPage({ params }: Params) {
  const { slug } = params;

  if (/^\d+$/.test(slug)) {
    const shop = await getDressShopByLegacyId(slug);
    if (!shop) notFound();
    permanentRedirect(`/dress-shops/${shop.slug}`);
  }

  const dressShop = await getDressShopBySlug(slug);
  if (!dressShop) {
    const byLegacy = await getDressShopByLegacyId(slug);
    if (byLegacy && byLegacy.slug !== slug) {
      permanentRedirect(`/dress-shops/${byLegacy.slug}`);
    }
    notFound();
  }

  const cohort = await getDressShops({ shopType: dressShop.shopType });
  const relatedShops = cohort.filter((s) => s.id !== dressShop.id).slice(0, 3);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(dressShopStoreLD(dressShop)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            breadcrumbLD([
              { name: 'Home', href: '/' },
              { name: 'Bridal Shops', href: '/dress-shops' },
              { name: dressShop.name, href: `/dress-shops/${dressShop.slug}` },
            ])
          ),
        }}
      />
      <DressShopDetailClient dressShop={dressShop} relatedShops={relatedShops} />
    </>
  );
}
