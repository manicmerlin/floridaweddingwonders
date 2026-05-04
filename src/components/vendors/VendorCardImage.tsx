'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Vendor } from '@/types';
import VendorImagePlaceholder from '@/components/VendorImagePlaceholder';
import { placeholderUrlForVendor } from '@/lib/placeholderImages';

interface Props {
  vendor: Vendor;
  /** Tailwind sizes hint — defaults match the listing card. */
  sizes?: string;
}

/**
 * Image fallback chain for a vendor card (mirrors VenueCard / DressShopCard):
 *   1. Watercolor placeholder at placeholders/vendors/<slug>.png
 *   2. Existing emoji+gradient VendorImagePlaceholder if (1) 404s
 *
 * No `vendor_ownerships` table exists yet, so by definition no vendor is
 * "claimed" — every card uses the watercolor until that table lands. When
 * it does, gate on `vendor.isClaimed === true` here the same way
 * VenueCard does and add a real-photo branch above the placeholder.
 *
 * Extracted from VendorsListClient so VendorDetailClient's "More Vendors"
 * related cards stay visually consistent with the listing.
 */
export default function VendorCardImage({
  vendor,
  sizes = '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw',
}: Props) {
  const [placeholderFailed, setPlaceholderFailed] = useState(false);
  const placeholderUrl = vendor.slug ? placeholderUrlForVendor(vendor.slug) : null;
  if (placeholderUrl && !placeholderFailed) {
    return (
      <Image
        src={placeholderUrl}
        alt={`${vendor.name} — watercolor illustration`}
        fill
        className="object-cover"
        sizes={sizes}
        loading="lazy"
        quality={85}
        onError={() => {
          if (typeof console !== 'undefined') {
            console.warn(`[VendorCardImage] placeholder missing for ${vendor.slug}`);
          }
          setPlaceholderFailed(true);
        }}
      />
    );
  }
  return <VendorImagePlaceholder name={vendor.name} category={vendor.category} />;
}
