import Image from 'next/image';
import { redirect } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import Link from 'next/link';
import VendorsListClient from '@/components/vendors/VendorsListClient';
import { getVendors } from '@/lib/catalog';
import { generateBreadcrumbSchema } from '@/lib/seo';
import { PAGE_HERO_IMAGES } from '@/lib/pageImages';
import { resolveShorthand } from '@/lib/searchShorthand';
import {
  breadcrumbLD,
  jsonLdScript,
  vendorListLD,
} from '@/lib/structuredData';

export const dynamic = 'force-dynamic';

export default async function VendorsPage({
  searchParams,
}: {
  searchParams?: { q?: string };
}) {
  // Search-shorthand: region matches redirect to /vendors/in/<region>; city
  // and neighborhood matches feed the canonical string into the listing
  // client so the existing fuzzy filter takes over from there.
  let initialSearch = searchParams?.q?.trim() ?? '';
  if (initialSearch) {
    const resolved = resolveShorthand(initialSearch);
    if (resolved?.type === 'region') {
      redirect(`/vendors/in/${resolved.region}`);
    }
    if (resolved?.type === 'city') {
      initialSearch = resolved.city;
    }
    if (resolved?.type === 'neighborhood') {
      // Vendors listing has no neighborhood dropdown — best we can do is
      // hand the canonical string to the search input and let the existing
      // fuzzy match against vendor service-area / city.
      initialSearch = resolved.neighborhood;
    }
  }

  const vendors = await getVendors();

  return (
    <>
      <SEO
        title="Wedding Vendors in Florida | Photographers, Caterers & More"
        description="Find trusted wedding vendors in Florida. Browse photographers, caterers, DJs, florists, and all the professionals you need for your perfect wedding day."
        canonical="https://floridaweddingwonders.com/vendors"
        path="/vendors"
        keywords={[
          'Florida wedding vendors',
          'wedding photographers Florida',
          'wedding caterers Florida',
          'wedding DJs Florida',
          'wedding florists Florida',
          'wedding planners Florida',
          'wedding vendors near me',
        ]}
        jsonLd={generateBreadcrumbSchema([
          { name: 'Home', url: 'https://floridaweddingwonders.com' },
          { name: 'Wedding Vendors', url: 'https://floridaweddingwonders.com/vendors' },
        ])}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            breadcrumbLD([
              { name: 'Home', href: '/' },
              { name: 'Wedding Vendors', href: '/vendors' },
            ])
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(vendorListLD(vendors)),
        }}
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900">
        <Navigation />
        <section className="relative h-64 sm:h-80 lg:h-96 overflow-hidden">
          <Image
            src={PAGE_HERO_IMAGES.vendors}
            alt="A florist arranging blooms for a Florida wedding"
            fill
            priority
            quality={85}
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-purple-900/80" />
        </section>
        <VendorsListClient vendors={vendors} initialSearch={initialSearch} />

        {/* Venue-owner cross-link — subtle, distinct from the vendor-owner
            CTA below. Aimed at venue owners who land here while shopping
            vendors and didn't realize there's a separate partnership path. */}
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

        {/* CTA */}
        <section className="bg-gradient-to-r from-purple-600 to-pink-600 py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Are You a Wedding Vendor?
            </h2>
            <p className="text-xl text-purple-100 mb-8">
              Join our directory and connect with couples planning their dream wedding
            </p>
            <a
              href="/vendor-owner"
              className="bg-white hover:bg-gray-100 text-purple-600 px-8 py-4 rounded-lg font-semibold text-lg transition"
            >
              List Your Business Today
            </a>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
