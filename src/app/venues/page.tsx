import Image from 'next/image';
import { redirect } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import VenuesListClient from '@/components/venues/VenuesListClient';
import LeadMagnetCapture from '@/components/LeadMagnetCapture';
import { getVenues, decorateVenuesWithClaims } from '@/lib/catalog';
import { decorateVenuesWithRatings } from '@/lib/reviews';
import { generateBreadcrumbSchema } from '@/lib/seo';
import { PAGE_HERO_IMAGES } from '@/lib/pageImages';
import { resolveShorthand } from '@/lib/searchShorthand';
import { getRegionBySlug } from '@/lib/hyperlocal';
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
  // Search-shorthand: turn casual variants ("fll", "panhandle", "30a") into
  // navigation intent BEFORE we touch the catalog. Region matches redirect
  // to /venues/in/<region>; city/neighborhood matches feed the canonical
  // string into the listing client so the existing fuzzy filter takes
  // over from there.
  let initialSearch = searchParams?.q?.trim() ?? '';
  let initialRegion: string | undefined;
  let initialNeighborhood: string | undefined;
  if (initialSearch) {
    const resolved = resolveShorthand(initialSearch);
    if (resolved?.type === 'region') {
      redirect(`/venues/in/${resolved.region}`);
    }
    if (resolved?.type === 'city') {
      initialSearch = resolved.city;
    }
    if (resolved?.type === 'neighborhood') {
      // Pre-select the region + neighborhood dropdowns; clear the free-
      // text search so the chained filters do the work cleanly.
      const region = resolved.region ? getRegionBySlug(resolved.region) : undefined;
      // Region-dropdown values are city strings (the dropdown is built from
      // unique city names), so we can't pre-select on slug. Instead, fall
      // back to using the neighborhood string as the search term — the
      // listing client filters by neighborhood= when the dropdown picks it,
      // but the search text alone is enough for the fuzzy match across
      // name/description/city.
      void region;
      initialRegion = undefined;
      initialNeighborhood = resolved.neighborhood;
      initialSearch = '';
    }
  }

  // decorateVenuesWithClaims runs ONE query for all venue ownerships,
  // not per-card — keeps the listing fast even at 129 cards.
  const venues = await decorateVenuesWithClaims(
    await decorateVenuesWithRatings(await getVenues())
  );

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
        <VenuesListClient
          venues={venues}
          initialSearch={initialSearch}
          initialRegion={initialRegion}
          initialNeighborhood={initialNeighborhood}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <LeadMagnetCapture source="venues" />
        </div>
        <Footer />
      </div>
    </>
  );
}
