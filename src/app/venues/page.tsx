'use client';

import { useState, useEffect } from 'react';
import { Venue } from '@/types';
import VenueCard from '@/components/VenueCard';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import venuesData from '@/data/venues.json';

// Transform the venues data to match our Venue type
const transformVenueData = (venueData: any): Venue => {
  return {
    id: venueData.id || venueData.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    name: venueData.name,
    description: venueData.style || 'Beautiful wedding venue in South Florida',
    venueType: venueData.tags?.includes('beach') ? 'beach' :
                venueData.tags?.includes('garden') ? 'garden' :
                venueData.tags?.includes('ballroom') ? 'ballroom' :
                venueData.tags?.includes('historic') ? 'historic' :
                venueData.tags?.includes('modern') ? 'modern' : 'ballroom',
    address: {
      street: venueData.location || '',
      city: venueData.region?.split(',')[0] || 'Miami',
      state: 'FL',
      zipCode: venueData.location?.match(/\d{5}$/)?.[0] || '33101'
    },
    capacity: {
      min: 50,
      max: parseInt(venueData.capacity?.match(/\d+/)?.[0]) || 200
    },
    pricing: {
      startingPrice: venueData.pricing?.match(/\$(\d+)/)?.[1] ? 
        parseInt(venueData.pricing.match(/\$(\d+)/)[1]) * 100 : 5000,
      packages: []
    },
    amenities: venueData.servicesAmenities || [],
    images: venueData.images || [],
    contact: {
      phone: '',
      email: '',
      website: venueData.website || ''
    },
    availability: [],
    reviews: {
      rating: 4.5,
      count: 0,
      reviews: []
    },
    owner: {
      id: 'default',
      name: 'Venue Owner',
      email: 'owner@venue.com',
      isPremium: false
    }
  };
};

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
    // Transform and load venues data
    const transformedVenues = venuesData.weddingVenues.map(transformVenueData);
    setVenues(transformedVenues);
    setFilteredVenues(transformedVenues);
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

    setFilteredVenues(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [venues, searchTerm, selectedRegion, selectedType, selectedCapacity]);

  // Pagination
  const totalPages = Math.ceil(filteredVenues.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedVenues = filteredVenues.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Get unique regions and types for filters
  const regions = [...new Set(venues.map(v => v.address.city))].sort();
  const venueTypes = [...new Set(venues.map(v => v.venueType))].sort();

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
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-6">
            Discover Florida's Premier Wedding Venues
          </h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            From stunning beachfront resorts to elegant ballrooms, find the perfect setting for your dream wedding in the Sunshine State.
          </p>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 inline-block">
            <span className="text-lg font-semibold">{venues.length} Beautiful Venues</span>
          </div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="py-8 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <input
                type="text"
                placeholder="Search venues, locations, or features..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
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
          <div className="mt-4 text-gray-600">
            Showing {paginatedVenues.length} of {filteredVenues.length} venues
            {searchTerm && ` for "${searchTerm}"`}
          </div>
        </div>
      </section>

      {/* Venues Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredVenues.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-2">No venues found</h3>
              <p className="text-gray-600 mb-6">Try adjusting your search criteria or filters</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedRegion('');
                  setSelectedType('');
                  setSelectedCapacity('');
                }}
                className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
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
