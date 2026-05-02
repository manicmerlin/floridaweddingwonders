import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import VendorsListClient from '@/components/vendors/VendorsListClient';
import { getVendors } from '@/lib/catalog';
import { generateBreadcrumbSchema } from '@/lib/seo';
import {
  breadcrumbLD,
  jsonLdScript,
  vendorListLD,
} from '@/lib/structuredData';

export const dynamic = 'force-dynamic';

export default async function VendorsPage() {
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
        <VendorsListClient vendors={vendors} />

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
