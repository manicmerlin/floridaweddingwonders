import Link from 'next/link';
import VendorListingCard from '@/components/vendors/VendorListingCard';
import type { Vendor } from '@/types';

interface VendorHyperlocalLandingProps {
  /** "Wedding Photographers in Miami" — full H1 */
  h1: string;
  /** Templated intro paragraph, already rendered. */
  intro: string;
  /** Breadcrumb trail. */
  breadcrumbs: Array<{ name: string; href: string }>;
  /** "All Photography vendors", "Top Florists in Miami", etc. */
  listingHeading: string;
  /** The matching vendors. */
  vendors: Vendor[];
  /** Optional related-pages strip ({label, href}[]). */
  related?: Array<{ label: string; href: string }>;
  /**
   * Empty-state fallbacks. When `vendors` is empty, show this list of
   * cross-link suggestions instead of a generic "no results" panel —
   * audit feedback was that 404s and dead-ends across this many SEO
   * surfaces would tank trust. Each entry is a label + href; the page
   * shows them as prominent cards with a short descriptor.
   */
  emptyStateSuggestions?: Array<{ label: string; href: string; description?: string }>;
}

export default function VendorHyperlocalLanding({
  h1,
  intro,
  breadcrumbs,
  listingHeading,
  vendors,
  related,
  emptyStateSuggestions,
}: VendorHyperlocalLandingProps) {
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

        {/* Vendors */}
        <section aria-labelledby="vendor-list-heading">
          <h2
            id="vendor-list-heading"
            className="text-2xl font-semibold text-white mb-6 flex items-baseline justify-between"
          >
            <span>{listingHeading}</span>
            <span className="text-sm font-normal text-pink-200">
              {vendors.length} {vendors.length === 1 ? 'vendor' : 'vendors'}
            </span>
          </h2>

          {vendors.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 sm:p-10 text-center">
              <div className="text-5xl mb-4">🤔</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Nothing in this exact slice yet
              </h3>
              <p className="text-pink-100 mb-6 max-w-xl mx-auto">
                We haven&apos;t added vendors that match this combination — but here&apos;s
                where to look next:
              </p>
              {emptyStateSuggestions && emptyStateSuggestions.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
                  {emptyStateSuggestions.map((s) => (
                    <Link
                      key={s.href}
                      href={s.href}
                      className="block bg-white/10 hover:bg-white/20 text-left text-white px-5 py-4 rounded-xl transition border border-white/10"
                    >
                      <div className="font-semibold">{s.label}</div>
                      {s.description && (
                        <div className="text-sm text-pink-200 mt-1">{s.description}</div>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {vendors.map((vendor) => (
                <VendorListingCard key={vendor.id} vendor={vendor} />
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
