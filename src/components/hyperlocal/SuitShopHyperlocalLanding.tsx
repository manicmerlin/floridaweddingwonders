import Link from 'next/link';
import SuitShopCard from '@/components/SuitShopCard';
import type { SuitShop } from '@/types';

interface SuitShopHyperlocalLandingProps {
  h1: string;
  intro: string;
  breadcrumbs: Array<{ name: string; href: string }>;
  listingHeading: string;
  shops: SuitShop[];
  related?: Array<{ label: string; href: string }>;
  emptyStateSuggestions?: Array<{ label: string; href: string; description?: string }>;
}

/**
 * Mirror of DressShopHyperlocalLanding. Cloned (rather than parameterised
 * over a generic <Card>) so the suit-shop and dress-shop landing pages
 * can drift independently as the two surfaces tune their hero copy +
 * empty-state framing.
 */
export default function SuitShopHyperlocalLanding({
  h1,
  intro,
  breadcrumbs,
  listingHeading,
  shops,
  related,
  emptyStateSuggestions,
}: SuitShopHyperlocalLandingProps) {
  return (
    <main>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <nav aria-label="Breadcrumb" className="text-sm text-amber-200/80 mb-6">
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.href}>
              {i > 0 && <span className="mx-2 text-amber-300/60">›</span>}
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
          <p className="text-stone-200 max-w-3xl mx-auto leading-relaxed">{intro}</p>
        </header>

        <section aria-labelledby="shop-list-heading">
          <h2
            id="shop-list-heading"
            className="text-2xl font-semibold text-white mb-6 flex items-baseline justify-between"
          >
            <span>{listingHeading}</span>
            <span className="text-sm font-normal text-amber-200/80">
              {shops.length} {shops.length === 1 ? 'shop' : 'shops'}
            </span>
          </h2>

          {shops.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 sm:p-10 text-center">
              <div className="text-5xl mb-4">🤵</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No suit shops listed for this region yet
              </h3>
              <p className="text-stone-200 mb-6 max-w-xl mx-auto">
                We&apos;re actively scouting tailors and tuxedo shops here — until they&apos;re live, here&apos;s where to look next:
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
                        <div className="text-sm text-stone-200 mt-1">{s.description}</div>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {shops.map((shop) => (
                <SuitShopCard key={shop.id} shop={shop} />
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
                  className="bg-white/10 hover:bg-white/20 text-stone-200 hover:text-white px-4 py-2 rounded-full text-sm transition"
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
