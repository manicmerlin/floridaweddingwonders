'use client';

import { useEffect, useMemo, useState } from 'react';
import { Venue } from '@/types';
import VenueCard from '@/components/VenueCard';

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
export default function VenuesListClient({ venues }: { venues: Venue[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
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
      out = out.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.description.toLowerCase().includes(q) ||
          v.address.city.toLowerCase().includes(q)
      );
    }
    if (selectedRegion) {
      out = out.filter((v) =>
        v.address.city.toLowerCase().includes(selectedRegion.toLowerCase())
      );
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
    return out.slice().sort((a, b) => {
      if (a.owner.isPremium && !b.owner.isPremium) return -1;
      if (!a.owner.isPremium && b.owner.isPremium) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [visible, searchTerm, selectedRegion, selectedType, selectedCapacity]);

  // Reset to page 1 whenever filters change.
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedRegion, selectedType, selectedCapacity]);

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

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedRegion('');
    setSelectedType('');
    setSelectedCapacity('');
  };

  return (
    <>
      {/* Search and filters */}
      <section className="py-8 bg-gray-900/30 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <p className="text-lg text-gray-300">
              Discover stunning wedding venues across the Sunshine State from beachfront ceremonies to elegant ballrooms
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <input
                type="text"
                placeholder="Search venues, locations, or features..."
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
              <option value="">All Regions</option>
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              {venueTypes.map((t) => (
                <option key={t} value={t} className="capitalize">
                  {t}
                </option>
              ))}
            </select>
            <select
              value={selectedCapacity}
              onChange={(e) => setSelectedCapacity(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="">Any Size</option>
              <option value="0-100">Intimate (Up to 100)</option>
              <option value="100-200">Medium (100-200)</option>
              <option value="200-400">Large (200-400)</option>
              <option value="400">Grand (400+)</option>
            </select>
          </div>

          <div className="mt-4 text-gray-300">
            Showing {paginatedVenues.length} of {filteredVenues.length} venues
            {searchTerm && ` for "${searchTerm}"`}
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="py-12 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredVenues.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-semibold text-white mb-2">No venues found</h3>
              <p className="text-gray-300 mb-6">Try adjusting your search criteria or filters</p>
              <button
                onClick={clearFilters}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-300 hover:scale-105"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedVenues.map((venue) => (
                  <VenueCard key={venue.id} venue={venue} showFavorites />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-12 flex justify-center items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`px-4 py-2 border rounded-lg ${
                        currentPage === p
                          ? 'bg-pink-600 text-white border-pink-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
