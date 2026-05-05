import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import DressShopsListClient from '@/components/dress-shops/DressShopsListClient';
import { getDressShops } from '@/lib/catalog';
import { PAGE_HERO_IMAGES } from '@/lib/pageImages';
import { resolveShorthand } from '@/lib/searchShorthand';
import {
  breadcrumbLD,
  dressShopListLD,
  jsonLdScript,
} from '@/lib/structuredData';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Bridal Shops in Florida | Florida Wedding Wonders',
  description:
    'Find the perfect wedding dress at Florida\'s top bridal boutiques, designers, and salons.',
  alternates: { canonical: 'https://floridaweddingwonders.com/dress-shops' },
};

export default async function DressShopsPage({
  searchParams,
}: {
  searchParams?: { q?: string };
}) {
  // Search-shorthand: region matches redirect to /dress-shops/in/<region>;
  // city/neighborhood matches feed the canonical string into the listing.
  let initialSearch = searchParams?.q?.trim() ?? '';
  if (initialSearch) {
    const resolved = resolveShorthand(initialSearch);
    if (resolved?.type === 'region') {
      redirect(`/dress-shops/in/${resolved.region}`);
    }
    if (resolved?.type === 'city') {
      initialSearch = resolved.city;
    }
    if (resolved?.type === 'neighborhood') {
      initialSearch = resolved.neighborhood;
    }
  }

  const shops = await getDressShops();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            breadcrumbLD([
              { name: 'Home', href: '/' },
              { name: 'Bridal Shops', href: '/dress-shops' },
            ])
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(dressShopListLD(shops)),
        }}
      />
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900">
      <Navigation />

      <section className="relative h-64 sm:h-80 lg:h-96 overflow-hidden">
        <Image
          src={PAGE_HERO_IMAGES['dress-shops']}
          alt="A serene Florida bridal boutique interior"
          fill
          priority
          quality={85}
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-purple-900/80" />
      </section>

      <DressShopsListClient shops={shops} initialSearch={initialSearch} />

      {/* Venue-owner cross-link — subtle, sits between the listing and the
          editorial sections so venue owners browsing dress shops have a
          clear path to the package page. */}
      <section className="py-6 bg-gray-900/40 backdrop-blur-sm border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-300">
          Own a venue?{' '}
          <Link
            href="/venue-packages"
            className="text-pink-300 hover:text-pink-200 underline font-medium"
          >
            See our partnership tiers for venues →
          </Link>
        </div>
      </section>

      {/* Featured Services */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose South Florida Bridal Shops?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From Miami to Palm Beach, discover what makes our bridal boutiques special
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">🌴</div>
              <h3 className="font-semibold text-gray-900 mb-2">Beach-Ready Styles</h3>
              <p className="text-gray-600 text-sm">
                Perfect gowns for Florida's beautiful beach and outdoor venues
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">✨</div>
              <h3 className="font-semibold text-gray-900 mb-2">Designer Selection</h3>
              <p className="text-gray-600 text-sm">
                Exclusive access to top designers and unique collections
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="font-semibold text-gray-900 mb-2">Expert Stylists</h3>
              <p className="text-gray-600 text-sm">
                Personal consultants who understand Florida wedding style
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">⏰</div>
              <h3 className="font-semibold text-gray-900 mb-2">Perfect Timing</h3>
              <p className="text-gray-600 text-sm">
                Alterations and timing perfect for your Florida wedding date
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tips */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Dress Shopping Tips for Florida Brides
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">🏖️ Consider the Climate</h3>
              <p className="text-gray-600 text-sm">
                Florida's warm weather calls for breathable fabrics like chiffon, tulle, or
                lightweight satin. Avoid heavy materials that might be uncomfortable in the heat.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">📅 Start Early</h3>
              <p className="text-gray-600 text-sm">
                Begin shopping 8-12 months before your wedding. Florida's peak wedding season
                requires extra time for alterations and shipping delays.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">👯 Bring Your Crew</h3>
              <p className="text-gray-600 text-sm">
                Limit your entourage to 2-3 trusted people whose opinions matter most. Too many
                voices can make the decision overwhelming.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">💰 Set Your Budget</h3>
              <p className="text-gray-600 text-sm">
                Remember to budget for alterations (typically 15-20% of dress cost) and
                accessories. Communicate your budget clearly with your consultant.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-pink-600 to-purple-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Find Your Perfect Dress?
          </h2>
          <p className="text-xl text-pink-100 mb-8">
            Book appointments at multiple shops and start your bridal journey
          </p>
          <Link
            href="/register"
            className="bg-white hover:bg-gray-100 text-purple-600 px-8 py-4 rounded-lg font-semibold text-lg transition"
          >
            Create Your Bridal Profile
          </Link>
        </div>
      </section>

      <Footer />
    </div>
    </>
  );
}
