'use client';

import { useState, useEffect } from 'react';
import { Venue } from '@/types';
import VenueCard from '@/components/VenueCard';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { mockVenues } from '@/lib/mockData';
import { loadVenuePhotosFromStorage } from '@/lib/photoStorage';

// Use mockVenues which already includes the JSON data to avoid duplicates
const allVenues = mockVenues;

const ITEMS_PER_PAGE = 12;

export default function VenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [filteredVenues, setFilteredVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedCapacity, setSelectedCapacity] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    // Use combined venues data (same as detail page)
    // Load stored photos for each venue
    const venuesWithStoredPhotos = allVenues.map(venue => {
      const storedPhotos = loadVenuePhotosFromStorage(venue.id);
      if (storedPhotos.length > 0) {
        return {
          ...venue,
          images: storedPhotos
        };
      }
      return venue;
    });
    
    setVenues(venuesWithStoredPhotos);
    setFilteredVenues(venuesWithStoredPhotos);
    setLoading(false);
  }, []);

  useEffect(() => {
    let filtered = venues;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(venue =>
        venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        venue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        venue.address.city.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Region filter
    if (selectedRegion) {
      filtered = filtered.filter(venue =>
        venue.address.city.toLowerCase().includes(selectedRegion.toLowerCase())
      );
    }

    // Type filter
    if (selectedType) {
      filtered = filtered.filter(venue => venue.venueType === selectedType);
    }

    // Capacity filter
    if (selectedCapacity) {
      const capacityRange = selectedCapacity.split('-');
      const min = parseInt(capacityRange[0]);
      const max = capacityRange[1] ? parseInt(capacityRange[1]) : Infinity;
      filtered = filtered.filter(venue =>
        venue.capacity.max >= min && venue.capacity.min <= max
      );
    }

    // Sort venues with premium venues first
    filtered = filtered.sort((a, b) => {
      // Premium venues first
      if (a.owner.isPremium && !b.owner.isPremium) return -1;
      if (!a.owner.isPremium && b.owner.isPremium) return 1;
      
      // Then by name alphabetically
      return a.name.localeCompare(b.name);
    });

    setFilteredVenues(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [venues, searchTerm, selectedRegion, selectedType, selectedCapacity]);

  // Pagination
  const totalPages = Math.ceil(filteredVenues.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedVenues = filteredVenues.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Get unique regions and types for filters
  const regions = Array.from(new Set(venues.map(v => v.address.city))).sort();
  const venueTypes = Array.from(new Set(venues.map(v => v.venueType))).sort();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Florida's most beautiful venues...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900">
      <Navigation />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-600/80 via-pink-600/80 to-indigo-600/80 backdrop-blur-sm text-white py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-4xl lg:text-6xl font-bold mb-6">
            Wedding Venues in Florida
          </h1>
          <p className="text-xl lg:text-2xl text-purple-100 max-w-4xl mx-auto mb-8">
            Discover over 130 stunning wedding venues across the Sunshine State. From beachfront ceremonies to elegant ballrooms.
          </p>
          
          {/* Search and Filter Bar */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <input
                  type="text"
                  placeholder="Search venues..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 bg-white/90 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                />
              </div>
              <div>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-4 py-3 bg-white/90 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                >
                  <option value="">All Venue Types</option>
                  <option value="beach">Beach</option>
                  <option value="ballroom">Ballroom</option>
                  <option value="garden">Garden</option>
                  <option value="historic">Historic</option>
                  <option value="modern">Modern</option>
                </select>
              </div>
              <div>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full px-4 py-3 bg-white/90 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                >
                  <option value="">All Locations</option>
                  <option value="Miami">Miami</option>
                  <option value="Fort Lauderdale">Fort Lauderdale</option>
                  <option value="Key Largo">Key Largo</option>
                  <option value="Naples">Naples</option>
                  <option value="Tampa">Tampa</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="py-8 bg-gray-900/30 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <input
                type="text"
                placeholder="Search venues, locations, or features..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-white/90 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900"
              />
            </div>

            {/* Region Filter */}
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="">All Regions</option>
              {regions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              {venueTypes.map(type => (
                <option key={type} value={type} className="capitalize">{type}</option>
              ))}
            </select>

            {/* Capacity Filter */}
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

          {/* Results Count */}
          <div className="mt-4 text-gray-300">
            Showing {paginatedVenues.length} of {filteredVenues.length} venues
            {searchTerm && ` for "${searchTerm}"`}
          </div>
        </div>
      </section>

      {/* Venues Grid */}
      <section className="py-12 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredVenues.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-semibold text-white mb-2">No venues found</h3>
              <p className="text-gray-300 mb-6">Try adjusting your search criteria or filters</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedRegion('');
                  setSelectedType('');
                  setSelectedCapacity('');
                }}
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12 flex justify-center items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`px-4 py-2 border rounded-lg ${
                        currentPage === i + 1
                          ? 'bg-pink-600 text-white border-pink-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {i + 1}
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

      <Footer />
    </div>
  );
}
