import Link from 'next/link';
import DressShopCard from '@/components/DressShopCard';
import type { DressShop } from '@/types';

interface DressShopHyperlocalLandingProps {
  /** "Bridal Shops in Tampa Bay" — full H1 */
  h1: string;
  /** Templated intro paragraph. */
  intro: string;
  /** Breadcrumb trail. */
  breadcrumbs: Array<{ name: string; href: string }>;
  /** "All Tampa Bay bridal shops", etc. */
  listingHeading: string;
  /** The matching shops. */
  shops: DressShop[];
  /** Optional related-pages strip. */
  related?: Array<{ label: string; href: string }>;
  /**
   * Empty-state fallbacks. When `shops` is empty, show cross-link
   * suggestions — same pattern as the vendor landing pages so a region
   * with no shops yet still feels intentional rather than abandoned.
   */
  emptyStateSuggestions?: Array<{ label: string; href: string; description?: string }>;
}

/**
 * Mirrors VendorHyperlocalLanding but renders DressShopCard. Cloned
 * (rather than parameterised) because the listing components have
 * different prop shapes (Vendor vs DressShop) and the hero copy + CTA
 * differs slightly between vendor and bridal-shop pages — the small
 * duplication keeps each surface independently tunable.
 */
export default function DressShopHyperlocalLanding({
  h1,
  intro,
  breadcrumbs,
  listingHeading,
  shops,
  related,
  emptyStateSuggestions,
}: DressShopHyperlocalLandingProps) {
  return (
    <main>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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

        <header className="mb-10 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">{h1}</h1>
          <p className="text-pink-100 max-w-3xl mx-auto leading-relaxed">{intro}</p>
        </header>

        <section aria-labelledby="shop-list-heading">
          <h2
            id="shop-list-heading"
            className="text-2xl font-semibold text-white mb-6 flex items-baseline justify-between"
          >
            <span>{listingHeading}</span>
            <span className="text-sm font-normal text-pink-200">
              {shops.length} {shops.length === 1 ? 'shop' : 'shops'}
            </span>
          </h2>

          {shops.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 sm:p-10 text-center">
              <div className="text-5xl mb-4">👗</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No bridal shops listed for this region yet
              </h3>
              <p className="text-pink-100 mb-6 max-w-xl mx-auto">
                We&apos;re actively scouting boutiques here — until they&apos;re live, here&apos;s
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
              {shops.map((shop) => (
                <DressShopCard key={shop.id} shop={shop} />
              ))}
            </div>
          )}
        </section>

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
      </div>
    </main>
  );
}
