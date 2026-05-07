'use client';

import { SuitShop } from '../types';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { placeholderUrlForSuitShop } from '@/lib/placeholderImages';
import { isListingComplete } from '@/lib/listingCompleteness';
import ListingRatingStrip from './ListingRatingStrip';

interface SuitShopCardProps {
  shop: SuitShop;
}

// Per-shop-type gradient — used as the emoji-fallback background when the
// watercolor placeholder 404s. Picked to read masculine/dark vs the dress
// shop's pink/violet palette so the two surfaces feel like siblings, not
// twins.
const getShopColors = (shopType: SuitShop['shopType']) => {
  const colorSchemes: Record<SuitShop['shopType'], string> = {
    'bespoke-tailor': 'from-slate-700 to-stone-700',
    'tuxedo-rental': 'from-zinc-800 to-neutral-900',
    'suit-boutique': 'from-blue-900 to-slate-800',
    'made-to-measure': 'from-amber-800 to-stone-700',
    formalwear: 'from-gray-700 to-zinc-800',
  };
  return colorSchemes[shopType] || 'from-slate-700 to-stone-800';
};

const SHOP_TYPE_EMOJI: Record<SuitShop['shopType'], string> = {
  'bespoke-tailor': '✂️',
  'tuxedo-rental': '🎩',
  'suit-boutique': '🤵',
  'made-to-measure': '🧵',
  formalwear: '👔',
};

export default function SuitShopCard({ shop }: SuitShopCardProps) {
  const gradientColors = getShopColors(shop.shopType);
  const [placeholderFailed, setPlaceholderFailed] = useState(false);

  // Same "always-watercolor" rule as DressShopCard — no suit_shop_ownerships
  // table yet, so every card uses the watercolor placeholder until that
  // model lands. Real-photo gating can be added the same way VenueCard
  // does it once shop.isClaimed is meaningful.
  const placeholderUrl = shop.slug ? placeholderUrlForSuitShop(shop.slug) : null;
  const showPlaceholder = !!placeholderUrl && !placeholderFailed;
  const hasImage = showPlaceholder;

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="relative h-48 overflow-hidden">
        {showPlaceholder ? (
          <Image
            src={placeholderUrl!}
            alt={`${shop.name} - watercolor illustration`}
            fill
            className="object-cover hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            loading="lazy"
            quality={85}
            onError={() => {
              if (typeof console !== 'undefined') {
                console.warn(`[SuitShopCard] placeholder missing for ${shop.slug}`);
              }
              setPlaceholderFailed(true);
            }}
          />
        ) : (
          <div
            className={`h-full bg-gradient-to-br ${gradientColors} flex items-center justify-center`}
            role="img"
            aria-label={`${shop.name} - ${shop.shopType} suit shop`}
          >
            <div className="text-center text-white p-4">
              <div className="text-2xl mb-2" aria-hidden="true">
                {SHOP_TYPE_EMOJI[shop.shopType] ?? '🤵'}
              </div>
              <div className="text-lg font-semibold leading-tight">{shop.name}</div>
            </div>
          </div>
        )}

        {hasImage && (
          <div className="absolute inset-0 bg-black bg-opacity-20 hover:bg-opacity-10 transition-all duration-300">
            <div className="absolute bottom-4 left-4 text-white">
              <div className="text-lg font-semibold leading-tight drop-shadow-lg">
                {shop.name}
              </div>
            </div>
          </div>
        )}

        {shop.owner?.isPremium &&
          isListingComplete({
            hasContact: !!(shop.contact.phone || shop.contact.email || shop.contact.website),
            description: shop.description,
            imagesCount: shop.images?.length ?? 0,
          }) && (
            <div className="absolute top-2 right-2 bg-slate-900 text-white px-2 py-1 rounded text-xs font-semibold shadow-sm">
              PREMIUM
            </div>
          )}
      </div>

      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2">{shop.name}</h3>
        <ListingRatingStrip
          rating={null}
          count={0}
          slug={shop.slug || shop.id}
          kind="suit-shops"
          className="mb-2"
        />
        <p className="text-gray-600 mb-3 line-clamp-2">{shop.description}</p>

        <div className="flex justify-between items-center mb-3">
          <span className="text-sm text-gray-500">
            {shop.address.city}, {shop.address.state}
          </span>
          {(shop.priceRange.min > 0 || shop.priceRange.max > 0) && (
            <span className="text-lg font-bold text-slate-800">
              ${shop.priceRange.min.toLocaleString()}-${shop.priceRange.max.toLocaleString()}
            </span>
          )}
        </div>

        <div className="flex justify-between items-center mb-4">
          <span className="text-sm bg-slate-100 text-slate-800 px-2 py-1 rounded capitalize">
            {shop.shopType.replace('-', ' ')}
          </span>
          {shop.brands.length > 0 && (
            <span className="text-sm text-gray-500">
              {shop.brands.length} Brand{shop.brands.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1 mb-4">
          {shop.specialties.slice(0, 3).map((specialty) => (
            <span
              key={specialty}
              className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
            >
              {specialty}
            </span>
          ))}
          {shop.specialties.length > 3 && (
            <span className="text-xs text-gray-500">
              +{shop.specialties.length - 3} more
            </span>
          )}
        </div>

        <Link href={`/suit-shops/${shop.slug || shop.id}`} className="block w-full">
          <button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 px-4 rounded transition-colors duration-200">
            View Details
          </button>
        </Link>
      </div>
    </div>
  );
}
