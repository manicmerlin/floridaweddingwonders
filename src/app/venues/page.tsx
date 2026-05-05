import Image from 'next/image';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import VenuesListClient from '@/components/venues/VenuesListClient';
import LeadMagnetCapture from '@/components/LeadMagnetCapture';
import { getVenues, decorateVenuesWithClaims } from '@/lib/catalog';
import { decorateVenuesWithRatings } from '@/lib/reviews';
import { generateBreadcrumbSchema } from '@/lib/seo';
import { PAGE_HERO_IMAGES } from '@/lib/pageImages';
import {
  breadcrumbLD,
  jsonLdScript,
  venueListLD,
} from '@/lib/structuredData';

// Force fresh data on every request — once admin write-paths land in Phase 3
// we'll switch to ISR with revalidate-on-demand. For now the catalog is
// effectively read-only and Vercel cache will dedupe identical requests.
export const dynamic = 'force-dynamic';

export default async function VenuesPage({
  searchParams,
}: {
  searchParams?: { q?: string };
}) {
  // decorateVenuesWithClaims runs ONE query for all venue ownerships,
  // not per-card — keeps the listing fast even at 129 cards.
  const venues = await decorateVenuesWithClaims(
    await decorateVenuesWithRatings(await getVenues())
  );
  const initialSearch = searchParams?.q?.trim() ?? '';

  return (
    <>
      <SEO
        title="Wedding Venues in Florida"
        description="Browse hundreds of stunning wedding venues across Florida. From Miami to Orlando, find beachfront resorts, historic estates, gardens, and more for your perfect wedding day."
        canonical="https://floridaweddingwonders.com/venues"
        path="/venues"
        keywords={[
          'Florida wedding venues',
          'wedding venues near me',
          'South Florida venues',
          'beach wedding venues',
          'garden wedding venues Florida',
          'historic wedding venues Florida',
          'outdoor wedding venues Florida',
          'wedding reception venues',
        ]}
        jsonLd={generateBreadcrumbSchema([
          { name: 'Home', url: 'https://floridaweddingwonders.com' },
          { name: 'Wedding Venues', url: 'https://floridaweddingwonders.com/venues' },
        ])}
      />
      {/* Server-rendered JSON-LD: Breadcrumbs + ItemList for SEO. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            breadcrumbLD([
              { name: 'Home', href: '/' },
              { name: 'Wedding Venues', href: '/venues' },
            ])
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(venueListLD(venues)),
        }}
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900">
        <Navigation />
        <section className="relative h-64 sm:h-80 lg:h-96 overflow-hidden">
          <Image
            src={PAGE_HERO_IMAGES.venues}
            alt="A Florida wedding venue exterior at golden hour"
            fill
            priority
            quality={85}
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-purple-900/80" />
        </section>
        <VenuesListClient venues={venues} initialSearch={initialSearch} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <LeadMagnetCapture source="venues" />
        </div>
        <Footer />
      </div>
    </>
  );
}
