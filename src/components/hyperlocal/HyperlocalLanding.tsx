import Link from 'next/link';
import VenueCard from '@/components/VenueCard';
import type { Venue } from '@/types';

interface HyperlocalLandingProps {
  /** "Wedding Venues in Miami" — full H1 */
  h1: string;
  /** 200-300 word intro string, already templated. */
  intro: string;
  /** Breadcrumb trail. */
  breadcrumbs: Array<{ name: string; href: string }>;
  /** "Top Garden Venues", "All Venues", etc. */
  listingHeading: string;
  /** The matching venues, already sorted (tier-first). */
  venues: Venue[];
  /** Optional related-pages strip ({label, href}[]). */
  related?: Array<{ label: string; href: string }>;
}

export default function HyperlocalLanding({
  h1,
  intro,
  breadcrumbs,
  listingHeading,
  venues,
  related,
}: HyperlocalLandingProps) {
  return (
    <main>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="text-sm text-pink-200 mb-6">
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.href}>
              {i > 0 && <span className="mx-2 text-pink-400">›</span>}
              {i === breadcrumbs.length - 1 ? (
                <span className="text-white font-medium">{crumb.name}</span>
              ) : (
                <Link href={crumb.href} className="hover:text-white underline-offset-2 hover:underline">
                  {crumb.name}
                </Link>
              )}
            </span>
          ))}
        </nav>

        {/* Hero */}
        <header className="mb-10 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">{h1}</h1>
          <p className="text-pink-100 max-w-3xl mx-auto leading-relaxed">{intro}</p>
        </header>

        {/* Venues */}
        <section aria-labelledby="venue-list-heading">
          <h2
            id="venue-list-heading"
            className="text-2xl font-semibold text-white mb-6 flex items-baseline justify-between"
          >
            <span>{listingHeading}</span>
            <span className="text-sm font-normal text-pink-200">
              {venues.length} {venues.length === 1 ? 'venue' : 'venues'}
            </span>
          </h2>

          {venues.length === 0 ? (
            <div className="text-center py-16 text-pink-100">
              <p className="mb-4">No venues match this combination yet.</p>
              <Link
                href="/venues"
                className="inline-block bg-pink-600 hover:bg-pink-700 text-white px-6 py-2 rounded-lg"
              >
                Browse all venues
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {venues.map((venue) => (
                <VenueCard key={venue.id} venue={venue} />
              ))}
            </div>
          )}
        </section>

        {/* Related pages */}
        {related && related.length > 0 && (
          <section className="mt-16" aria-labelledby="related-pages-heading">
            <h2 id="related-pages-heading" className="text-xl font-semibold text-white mb-4">
              Explore more
            </h2>
            <div className="flex flex-wrap gap-2">
              {related.map((r) => (
                <Link
                  key={r.href}
                  href={r.href}
                  className="bg-white/10 hover:bg-white/20 text-pink-100 hover:text-white px-4 py-2 rounded-full text-sm transition"
                >
                  {r.label}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Multi-quote CTA */}
        <aside className="mt-16 bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-2">Compare quotes from up to 5 venues</h3>
          <p className="text-pink-100 mb-4">
            Pre-qualified leads. One form. Faster responses.
          </p>
          <Link
            href="/quotes/request"
            className="inline-block bg-white text-pink-700 font-semibold px-6 py-3 rounded-lg hover:bg-pink-50"
          >
            Get matching quotes →
          </Link>
        </aside>
      </div>
    </main>
  );
}
