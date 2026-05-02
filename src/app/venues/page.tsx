import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import VenuesListClient from '@/components/venues/VenuesListClient';
import { getVenues } from '@/lib/catalog';
import { generateBreadcrumbSchema } from '@/lib/seo';
import {
  breadcrumbLD,
  jsonLdScript,
  venueListLD,
} from '@/lib/structuredData';

// Force fresh data on every request — once admin write-paths land in Phase 3
// we'll switch to ISR with revalidate-on-demand. For now the catalog is
// effectively read-only and Vercel cache will dedupe identical requests.
export const dynamic = 'force-dynamic';

export default async function VenuesPage() {
  const venues = await getVenues();

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
        <VenuesListClient venues={venues} />
        <Footer />
      </div>
    </>
  );
}
