// Compute headline stats from the source-of-truth JSON files. Runs at module
// import time (synchronous require) so consumers get a plain object — no
// async, no React hooks, no per-request work.
//
// Once Phase 1 step 1 migrates the catalog into Supabase, this file should be
// replaced with a server-side query (and consumers stay the same).

import venuesJson from '../data/venues.json';
import vendorsJson from '../data/vendors.json';
import dressShopsJson from '../data/dressShops.json';

export interface SiteStats {
  venues: number;
  vendors: number;
  dressShops: number;
}

export function getSiteStats(): SiteStats {
  return {
    venues: (venuesJson as any).weddingVenues?.length ?? 0,
    vendors: (vendorsJson as any).weddingVendors?.length ?? 0,
    dressShops: (dressShopsJson as any).weddingDressShops?.length ?? 0,
  };
}
