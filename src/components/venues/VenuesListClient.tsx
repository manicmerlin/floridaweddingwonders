'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { Venue } from '@/types';
import VenueCard from '@/components/VenueCard';
import Pagination from '@/components/Pagination';
import EmptySearchFallback from '@/components/EmptySearchFallback';
import { compareByTier } from '@/lib/tierFeatures';
import { fuzzyMatchesCity, normalizeQuery } from '@/lib/cityProximity';

// Map is dynamically imported with ssr:false because Leaflet touches
// `window` at module load time. This also keeps the entire ~200kb leaflet
// bundle out of the listing page's initial JS — only paid when the user
// actively toggles to the Map view. Loading placeholder shown for the
// first ~500ms while the chunk fetches.
const VenuesMap = dynamic(() => import('./VenuesMap'), {
  ssr: false,
  loading: () => <MapLoadingSkeleton />,
});

function MapLoadingSkeleton() {
  return (
    <div className="w-full h-[600px] rounded-lg border border-white/10 bg-gray-800/40 animate-pulse flex items-center justify-center">
      <span className="text-gray-300 text-sm">Loading map…</span>
    </div>
  );
}

const ITEMS_PER_PAGE = 12;

// REMOVED: per-device localStorage `deleted-venues` filter.
//
// The legacy admin VenueManagement UI writes legacy_ids into a localStorage
// array when admin clicks Delete. Reading that array here meant any venue
// the admin had ever soft-deleted in their browser became invisible — to
// THEM only — across every session, with no way to undo without DevTools.
// This collided with paid tiers in Phase 3A: a $2,500 Scale-tier customer
// could be invisible to the admin's stale localStorage. Phase 0 recon
// flagged this as a "device-local soft-delete" bug; Phase 3B will replace
// it with a DB-backed deleted_at column. Until then the safe behaviour is
// to render every catalog row; the localStorage writes from
// VenueManagement become no-ops on read paths.
export default function VenuesListClient({
  venues,
  initialSearch = '',
  initialRegion = '',
  initialNeighborhood = '',
}: {
  venues: Venue[];
  /** Pre-fill from /venues?q=<value> when the homepage search form posts here. */
  initialSearch?: string;
  /** Pre-select the region dropdown (city-string match). Used by the search
   *  shorthand resolver when a query like "broward" lands here. */
  initialRegion?: string;
  /** Pre-select the neighborhood dropdown. Used by the search shorthand
   *  resolver when a query like "sobe" / "the grove" lands here. */
  initialNeighborhood?: string;
}) {
  const t = useTranslations('VenuesList');
  const tCta = useTranslations('MultiQuoteCTA');
  const tMap = useTranslations('Map');
  const [view, setView] = useState<'list' | 'map'>('list');
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedRegion, setSelectedRegion] = useState(initialRegion);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(initialNeighborhood);
  const [selectedType, setSelectedType] = useState('');
  const [selectedCapacity, setSelectedCapacity] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // No client-side filter — every catalog row is visible. Server-side sort
  // (compareByTier in catalog.ts) controls ordering: scale > growth > starter.
  const visible = venues;

  const filteredVenues = useMemo(() => {
    let out = visible;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const normQ = normalizeQuery(searchTerm);
      out = out.filter((v) => {
        // Substring match on name / description / city — works for the
        // bulk of queries.
        if (
          v.name.toLowerCase().includes(q) ||
          v.description.toLowerCase().includes(q) ||
          v.address.city.toLowerCase().includes(q)
        ) {
          return true;
        }
        // Fuzzy alias match — "st pete" → "st. petersburg", "ft laud"
        // → "fort lauderdale". Catches the casual short forms users
        // actually type. Falls back to substring above so legit name
        // matches still hit even if normalize would drop characters.
        return normQ.length >= 2 && fuzzyMatchesCity(searchTerm, v.address.city);
      });
    }
    if (selectedRegion) {
      out = out.filter((v) =>
        v.address.city.toLowerCase().includes(selectedRegion.toLowerCase())
      );
    }
    if (selectedNeighborhood) {
      out = out.filter((v) => v.neighborhood === selectedNeighborhood);
    }
    if (selectedType) {
      out = out.filter((v) => v.venueType === selectedType);
    }
    if (selectedCapacity) {
      const [minStr, maxStr] = selectedCapacity.split('-');
      const min = parseInt(minStr, 10);
      const max = maxStr ? parseInt(maxStr, 10) : Infinity;
      out = out.filter((v) => v.capacity.max >= min && v.capacity.min <= max);
    }
    // Match the server-side sort from catalog.ts so filters don't reorder
    // the list incorrectly. Tier-first (scale > growth > starter), alpha
    // within tier. The legacy `owner.isPremium` sort that lived here was a
    // Phase 0 leftover — that field is hardcoded to `false` for every venue
    // in the catalog mapper, so the sort collapsed to pure alphabetical and
    // sent paid scale-tier venues several pages deep.
    return out.slice().sort(compareByTier);
  }, [visible, searchTerm, selectedRegion, selectedNeighborhood, selectedType, selectedCapacity]);

  // Reset to page 1 whenever filters change.
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedRegion, selectedNeighborhood, selectedType, selectedCapacity]);

  // Reset neighborhood when the region changes — neighborhoods are scoped
  // to a city, so a neighborhood from the previous region wouldn't match
  // any rows in the new one. Skip the first run so the search-shorthand
  // initialNeighborhood prop survives initial mount.
  const skipFirstNeighborhoodReset = useRef(true);
  useEffect(() => {
    if (skipFirstNeighborhoodReset.current) {
      skipFirstNeighborhoodReset.current = false;
      return;
    }
    setSelectedNeighborhood('');
  }, [selectedRegion]);

  const totalPages = Math.max(1, Math.ceil(filteredVenues.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedVenues = filteredVenues.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const regions = useMemo(
    () => Array.from(new Set(visible.map((v) => v.address.city).filter(Boolean))).sort(),
    [visible]
  );
  const venueTypes = useMemo(
    () => Array.from(new Set(visible.map((v) => v.venueType))).sort(),
    [visible]
  );
  // Neighborhood options are derived from the current region selection so
  // the dropdown is empty (or hidden) until the user picks a region. Only
  // include the sub-set of venues that has a neighborhood populated — most
  // venues have NULL until owners self-tag.
  const neighborhoodsForRegion = useMemo(() => {
    if (!selectedRegion) return [] as string[];
    return Array.from(
      new Set(
        visible
          .filter((v) => v.address.city.toLowerCase().includes(selectedRegion.toLowerCase()))
          .map((v) => v.neighborhood)
          .filter((n): n is string => !!n)
      )
    ).sort();
  }, [visible, selectedRegion]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedRegion('');
    setSelectedNeighborhood('');
    setSelectedType('');
    setSelectedCapacity('');
  };

  return (
    <>
      {/* Multi-quote CTA — pre-search, where intent is highest */}
      <section className="py-6 bg-gradient-to-r from-pink-700/40 to-purple-700/40 backdrop-blur-sm border-b border-pink-300/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <p className="text-white font-semibold">
              ⚡ {tCta('compareTitle')}
            </p>
            <p className="text-pink-100 text-sm">
              {tCta('compareSubtitle')}
            </p>
          </div>
          <a
            href="/quotes/request"
            className="bg-white text-pink-700 font-semibold px-5 py-2 rounded-lg hover:bg-pink-50 whitespace-nowrap"
          >
            {tCta('ctaButton')} →
          </a>
        </div>
      </section>

      {/* Search and filters */}
      <section className="py-8 bg-gray-900/30 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <p className="text-lg text-gray-300">
              {t('introCopy')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-white/90 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900"
              />
            </div>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="">{t('allRegions')}</option>
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            {/* Neighborhood — chained after region. Hidden when no region is
                selected, or when the picked region has no tagged venues
                (the spec is to leave NULL when uncertain, so most regions
                will have an empty list). */}
            {neighborhoodsForRegion.length > 0 && (
              <select
                value={selectedNeighborhood}
                onChange={(e) => setSelectedNeighborhood(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                aria-label={t('neighborhoodLabel')}
              >
                <option value="">{t('allNeighborhoods')}</option>
                {neighborhoodsForRegion.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            )}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="">{t('allTypes')}</option>
              {venueTypes.map((vt) => (
                <option key={vt} value={vt} className="capitalize">
                  {vt}
                </option>
              ))}
            </select>
            <select
              value={selectedCapacity}
              onChange={(e) => setSelectedCapacity(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="">{t('anySize')}</option>
              <option value="0-100">{t('capacityIntimate')}</option>
              <option value="100-200">{t('capacityMedium')}</option>
              <option value="200-400">{t('capacityLarge')}</option>
              <option value="400">{t('capacityGrand')}</option>
            </select>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-gray-300">
            <div>
              {t('showing')} {view === 'list' ? paginatedVenues.length : filteredVenues.length} {t('of')} {filteredVenues.length} {t('venuesPlural')}
              {searchTerm && ` ${t('for')} "${searchTerm}"`}
            </div>
            {/* List | Map toggle. ARIA grouped so keyboard users hear the
                pair and can tab into them as a unit. */}
            <div
              role="group"
              aria-label="View mode"
              className="inline-flex rounded-md overflow-hidden border border-white/20 self-start sm:self-auto"
            >
              <button
                type="button"
                onClick={() => setView('list')}
                aria-pressed={view === 'list'}
                className={`px-4 py-1.5 text-sm font-medium transition ${
                  view === 'list'
                    ? 'bg-white text-gray-900'
                    : 'bg-transparent text-gray-200 hover:bg-white/10'
                }`}
              >
                {tMap('viewList')}
              </button>
              <button
                type="button"
                onClick={() => setView('map')}
                aria-pressed={view === 'map'}
                className={`px-4 py-1.5 text-sm font-medium border-l border-white/20 transition ${
                  view === 'map'
                    ? 'bg-white text-gray-900'
                    : 'bg-transparent text-gray-200 hover:bg-white/10'
                }`}
              >
                {tMap('viewMap')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Grid OR Map */}
      <section className="py-12 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {view === 'map' ? (
            <VenuesMap venues={filteredVenues} />
          ) : filteredVenues.length === 0 ? (
            searchTerm ? (
              // Search-driven empty state — try to convert "St. Pete →
              // Naples" rather than dropping the user on a sad-face wall.
              <EmptySearchFallback
                query={searchTerm}
                kind="venues"
                totalCount={visible.length}
                noun="venue"
                onClear={clearFilters}
              />
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-semibold text-white mb-2">{t('noResultsTitle')}</h3>
                <p className="text-gray-300 mb-6">{t('noResultsSubtitle')}</p>
                <button
                  onClick={clearFilters}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-300 hover:scale-105"
                >
                  {t('clearFilters')}
                </button>
              </div>
            )
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedVenues.map((venue) => (
                  <VenueCard key={venue.id} venue={venue} showFavorites />
                ))}
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      </section>
    </>
  );
}
