import Image from 'next/image';
import Link from 'next/link';
import {
  placeholderUrlForVenue,
  placeholderUrlForVendor,
  placeholderUrlForDressShop,
} from '@/lib/placeholderImages';
import type { HeroPick } from '@/lib/catalog';

/**
 * 6-card watercolor mosaic for the homepage hero. Picks come server-side
 * via getHomeHeroPicks() — 3 venues + 2 vendors + 1 dress shop, sorted
 * tier-first then alphabetical so it's deterministic across rebuilds.
 *
 * Layout: 2 cols on mobile (3 rows), 3 cols on sm+ (2 rows). Plain CSS
 * grid — no horizontal scroll, no min-w-max. The previous flex+scroll
 * version was leaking content past the viewport on real iPhones at 390px,
 * which made the WHOLE page horizontally scrollable and clipped the H1.
 */
export default function HomeHeroMosaic({ picks }: { picks: HeroPick[] }) {
  if (picks.length === 0) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5 max-w-full">
      {picks.map((pick) => (
        <MosaicCard key={`${pick.kind}-${pick.slug}`} pick={pick} />
      ))}
    </div>
  );
}

function MosaicCard({ pick }: { pick: HeroPick }) {
  const href = hrefFor(pick);
  const imageUrl = imageUrlFor(pick);
  const kindLabel = pick.kind === 'dress-shop' ? 'Bridal Shop' : pick.kind === 'vendor' ? 'Vendor' : 'Venue';

  return (
    <Link
      href={href}
      className="group relative block bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow min-w-0"
      aria-label={`${pick.name}, ${kindLabel} in ${pick.city}`}
    >
      <div className="relative aspect-[4/3] bg-gray-100">
        <Image
          src={imageUrl}
          alt={`${pick.name} — watercolor illustration`}
          fill
          sizes="(max-width: 640px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          quality={85}
          priority
        />
        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-[10px] uppercase tracking-wide font-semibold text-pink-700 px-2 py-0.5 rounded">
          {kindLabel}
        </div>
      </div>
      <div className="p-3 text-left">
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-1 group-hover:text-pink-700">
          {pick.name}
        </h3>
        <p className="text-xs text-gray-500 line-clamp-1 capitalize">
          {pick.subtitle} · {pick.city}
        </p>
      </div>
    </Link>
  );
}

function hrefFor(pick: HeroPick): string {
  switch (pick.kind) {
    case 'venue':
      return `/venues/${pick.slug}`;
    case 'vendor':
      return `/vendors/${pick.slug}`;
    case 'dress-shop':
      return `/dress-shops/${pick.slug}`;
  }
}

function imageUrlFor(pick: HeroPick): string {
  switch (pick.kind) {
    case 'venue':
      return placeholderUrlForVenue(pick.slug);
    case 'vendor':
      return placeholderUrlForVendor(pick.slug);
    case 'dress-shop':
      return placeholderUrlForDressShop(pick.slug);
  }
}
