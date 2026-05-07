import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import SuitShopsListClient from '@/components/suit-shops/SuitShopsListClient';
import { getSuitShops } from '@/lib/catalog';
import { PAGE_HERO_IMAGES } from '@/lib/pageImages';
import { resolveShorthand } from '@/lib/searchShorthand';
import {
  breadcrumbLD,
  suitShopListLD,
  jsonLdScript,
} from '@/lib/structuredData';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Suit & Tuxedo Shops in Florida | Florida Wedding Wonders',
  description:
    "Find the right suit, tuxedo, or bespoke tailor for your wedding. Independent Florida shops — bespoke tailors, tuxedo rentals, suit boutiques, and made-to-measure.",
  alternates: { canonical: 'https://floridaweddingwonders.com/suit-shops' },
};

export default async function SuitShopsPage({
  searchParams,
}: {
  searchParams?: { q?: string };
}) {
  // Same shorthand-redirect pattern as /dress-shops + /vendors.
  let initialSearch = searchParams?.q?.trim() ?? '';
  if (initialSearch) {
    const resolved = resolveShorthand(initialSearch);
    if (resolved?.type === 'region') {
      redirect(`/suit-shops/in/${resolved.region}`);
    }
    if (resolved?.type === 'city') {
      initialSearch = resolved.city;
    }
    if (resolved?.type === 'neighborhood') {
      initialSearch = resolved.neighborhood;
    }
  }

  const shops = await getSuitShops();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            breadcrumbLD([
              { name: 'Home', href: '/' },
              { name: 'Suit & Tuxedo Shops', href: '/suit-shops' },
            ])
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(suitShopListLD(shops)) }}
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-stone-900">
        <Navigation />

        <section className="relative h-64 sm:h-80 lg:h-96 overflow-hidden">
          <Image
            src={PAGE_HERO_IMAGES['suit-shops']}
            alt="Florida tailor shop interior with three-piece suits and chesterfield sofa"
            fill
            priority
            quality={85}
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-stone-900/80" />
        </section>

        <SuitShopsListClient shops={shops} initialSearch={initialSearch} />

        <section className="py-6 bg-gray-900/40 backdrop-blur-sm border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-300">
            Looking for the dress side?{' '}
            <Link
              href="/dress-shops"
              className="text-amber-200 hover:text-amber-100 underline font-medium"
            >
              Browse Bridal Shops →
            </Link>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
