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
 * Layout: 3-col × 2-row on desktop, single horizontal scroll on mobile.
 * Each card is the watercolor + a small caption with name + city +
 * subtitle, links straight to the detail page.
 */
export default function HomeHeroMosaic({ picks }: { picks: HeroPick[] }) {
  if (picks.length === 0) return null;
  return (
    <div className="overflow-x-auto sm:overflow-visible -mx-4 sm:mx-0 px-4 sm:px-0">
      <div className="flex sm:grid sm:grid-cols-3 gap-4 sm:gap-5 min-w-max sm:min-w-0">
        {picks.map((pick) => (
          <MosaicCard key={`${pick.kind}-${pick.slug}`} pick={pick} />
        ))}
      </div>
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
      className="group relative w-56 sm:w-auto block bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow"
      aria-label={`${pick.name}, ${kindLabel} in ${pick.city}`}
    >
      <div className="relative aspect-[4/3] bg-gray-100">
        <Image
          src={imageUrl}
          alt={`${pick.name} — watercolor illustration`}
          fill
          sizes="(max-width: 640px) 224px, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          quality={85}
          priority
        />
        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-[10px] uppercase tracking-wide font-semibold text-pink-700 px-2 py-0.5 rounded">
          {kindLabel}
        </div>
      </div>
      <div className="p-3">
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
