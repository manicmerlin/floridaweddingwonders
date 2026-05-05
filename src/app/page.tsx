import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import SEO from '@/components/SEO';
import FAQ from '@/components/FAQ';
import HomeHeroMosaic from '@/components/HomeHeroMosaic';
import HomeSearchBar from '@/components/HomeSearchBar';
import { generateWebsiteSchema, generateOrganizationSchema, SITE_CONFIG } from '@/lib/seo';
import { getSiteStatsLive, getHomeHeroPicks } from '@/lib/catalog';

// Stats query hits Postgres on each request. Hourly revalidation is plenty
// — the catalog doesn't churn that fast and we'd rather show fresh counts
// than risk the homepage drifting from reality (the 30-vs-86 vendor gap
// the audit caught was a build-time JSON snapshot from a different era).
export const revalidate = 3600;

export default async function HomePage() {
  const [stats, heroPicks, t] = await Promise.all([
    getSiteStatsLive(),
    getHomeHeroPicks(),
    getTranslations('Hero'),
  ]);
  return (
    <>
      <SEO
        title="Florida Wedding Wonders - Premier Wedding Venues in Florida"
        description="Discover Florida's most beautiful wedding venues, trusted vendors, and elegant bridal shops. From beachfront ceremonies to historic estates, find your perfect wedding venue in the Sunshine State."
        canonical="https://floridaweddingwonders.com"
        path="/"
        keywords={[
          'Florida wedding venues',
          'wedding venues Florida',
          'South Florida wedding venues',
          'beach wedding venues Florida',
          'Miami wedding venues',
          'Orlando wedding venues',
          'Tampa wedding venues',
          'wedding planning Florida',
          'destination wedding Florida',
        ]}
        jsonLd={[generateWebsiteSchema(), generateOrganizationSchema()]}
      />
      <div className="min-h-screen bg-gray-900 overflow-x-hidden">
      {/* Hero Section. overflow-x-hidden on the parent is a safety net —
          if any nested element sneaks past the viewport (mosaic, etc.)
          this prevents horizontal page scroll. The mosaic now uses a
          proper grid instead of a horizontal-scroll flex, so this should
          never be the primary fix — it's belt-and-suspenders. */}
      <div className="relative min-h-screen flex items-center justify-center px-4 sm:px-6">
        <div className="relative z-10 text-center max-w-6xl mx-auto w-full">
          {/* Logo */}
          <div className="mb-12">
            <div className="flex justify-center mb-8">
              <Image 
                src="/images/logo.png" 
                alt="Florida Wedding Wonders - Premier Wedding Venues in Florida" 
                width={150} 
                height={150}
                className="drop-shadow-lg"
                priority
                quality={90}
              />
            </div>
          </div>

          {/* Main Heading. Responsive scale: 36px mobile → 48px sm → 60px md
              → 72px lg. The previous text-4xl baseline was overflowing on
              real iPhone widths (390px). break-words lets long brand
              names wrap if a future rename lands. */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent mb-6 break-words">
            {t('siteName')}
          </h1>
          <p className="text-base sm:text-lg lg:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed mb-8">
            {t('subhead')}
          </p>

          {/* Search bar — single input + Search button. Posts to
              /venues?q=<value>; VenuesListClient picks up the param. */}
          <div className="mb-10">
            <HomeSearchBar />
          </div>

          {/* Hero mosaic — 6 watercolors (3 venues + 2 vendors + 1 shop).
              Picks are deterministic by tier-then-alphabetical order so the
              same six render across every visit until the catalog changes. */}
          <div className="mb-12">
            <HomeHeroMosaic picks={heroPicks} />
          </div>

          {/* Main Navigation Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <a 
              href="/venues" 
              className="group bg-white/10 backdrop-blur-sm border border-white/20 text-white p-8 rounded-2xl font-semibold text-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:bg-white/20"
            >
              <div className="text-5xl mb-4">🏛️</div>
              <div className="text-2xl mb-3 group-hover:text-purple-200 transition-colors">{t('weddingVenues')}</div>
              <div className="text-sm text-gray-300 leading-relaxed">{t('weddingVenuesBlurb')}</div>
            </a>

            <a
              href="/vendors"
              className="group bg-white/10 backdrop-blur-sm border border-white/20 text-white p-8 rounded-2xl font-semibold text-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:bg-white/20"
            >
              <div className="text-5xl mb-4">🎯</div>
              <div className="text-2xl mb-3 group-hover:text-pink-200 transition-colors">{t('weddingVendors')}</div>
              <div className="text-sm text-gray-300 leading-relaxed">{t('weddingVendorsBlurb')}</div>
            </a>

            <a
              href="/dress-shops"
              className="group bg-white/10 backdrop-blur-sm border border-white/20 text-white p-8 rounded-2xl font-semibold text-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:bg-white/20"
            >
              <div className="text-5xl mb-4">👗</div>
              <div className="text-2xl mb-3 group-hover:text-rose-200 transition-colors">{t('bridalShops')}</div>
              <div className="text-sm text-gray-300 leading-relaxed">{t('bridalShopsBlurb')}</div>
            </a>
          </div>

          {/* Stats Section */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 mb-16">
            <div className="grid grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-white mb-2">{stats.venues}</div>
                <div className="text-gray-300 font-medium">{t('statVenues')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-white mb-2">{stats.vendors}</div>
                <div className="text-gray-300 font-medium">{t('statVendors')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-white mb-2">{stats.dressShops}</div>
                <div className="text-gray-300 font-medium">{t('statShops')}</div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-sm border border-purple-400/30 rounded-2xl p-8 mb-16">
            <h3 className="text-2xl font-bold text-white mb-4">Ready to Plan Your Dream Wedding?</h3>
            <p className="text-gray-300 mb-6">Start exploring Florida's most beautiful venues and connect with trusted wedding professionals.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/venues"
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-lg transition-all duration-300 hover:scale-105"
              >
                Explore Venues 🏛️
              </a>
              <a
                href="/quotes/request"
                className="bg-gradient-to-r from-amber-500 to-rose-500 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-lg transition-all duration-300 hover:scale-105"
              >
                Get Quotes from 5 Venues ⚡
              </a>
              <a
                href="/venue-packages"
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-lg transition-all duration-300 hover:scale-105"
              >
                List Your Venue 💼
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <section className="relative z-10 py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Common Questions About Florida Weddings
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Get expert answers to the most frequently asked questions about planning your perfect Florida wedding.
            </p>
          </div>
          
          <FAQ 
            showCategoryFilter={false} 
            maxItems={5}
          />
          
          <div className="text-center mt-8">
            <a
              href="/faq"
              className="inline-block px-8 py-3 bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-lg transition-colors"
            >
              View All FAQs →
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-gray-900/50 backdrop-blur-sm text-white py-12 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Image 
                  src="/images/logo.png" 
                  alt="Florida Wedding Wonders" 
                  width={40} 
                  height={40}
                  className="mr-3"
                />
                <span className="text-xl font-bold">Florida Wedding Wonders</span>
              </div>
              <p className="text-gray-400">
                Creating unforgettable moments in the Sunshine State.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/venues" className="hover:text-white transition-colors">Wedding Venues</a></li>
                <li><a href="/vendors" className="hover:text-white transition-colors">Wedding Vendors</a></li>
                <li><a href="/dress-shops" className="hover:text-white transition-colors">Bridal Shops</a></li>
                <li><a href="/blog" className="hover:text-white transition-colors">Wedding Blog</a></li>
                <li><a href="/faq" className="hover:text-white transition-colors">FAQs</a></li>
                <li><a href="/venue-packages" className="hover:text-white transition-colors">List Your Venue</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact Info</h4>
              <div className="space-y-2 text-gray-400">
                <p>📧 <a href={`mailto:${SITE_CONFIG.email}`} className="hover:text-white transition-colors">{SITE_CONFIG.email}</a></p>
                {SITE_CONFIG.phone && (
                  <p>📱 <a href={`tel:${SITE_CONFIG.phone.replace(/[^+\d]/g, '')}`} className="hover:text-white transition-colors">{SITE_CONFIG.phone}</a></p>
                )}
                <p>📍 South Florida</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>© 2025 Florida Wedding Wonders. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}
