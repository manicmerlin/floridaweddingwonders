'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { mockVenues } from '../../lib/mockData';
import VenueCard from '../../components/VenueCard';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function VenuesPage() {
  console.log('🏛️ VenuesPage - mockVenues:', mockVenues?.length, 'venues imported');
  
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedSize, setSelectedSize] = useState('All');
  const [selectedPrice, setSelectedPrice] = useState('all');

  // Set initial filter based on URL parameters
  useEffect(() => {
    console.log('🔄 useEffect running for URL parameters');
    console.log('📋 searchParams:', searchParams);
    console.log('📋 searchParams toString:', searchParams.toString());
    
    const typeParam = searchParams.get('type');
    console.log('🔗 URL type parameter:', typeParam);
    
    const allParams: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      allParams[key] = value;
    });
    console.log('📋 All URL params:', allParams);
    
    if (typeParam && typeParam !== 'All') {
      console.log('🎯 Setting selectedType from URL:', typeParam);
      setSelectedType(typeParam);
    } else {
      console.log('❌ No valid type parameter found in URL, keeping default');
    }
  }, [searchParams]);

  const regions = ['All', 'Miami-Dade & Broward', 'Palm Beaches', 'Southwest Florida', 'Florida Keys'];
  const venueTypes = ['All', 'beach', 'garden', 'ballroom', 'historic', 'modern', 'rustic'];
  const sizeCategories = ['All', 'Intimate (Under 75)', 'Mid-Size (75-199)', 'Large (200+)'];

  // Filter venues based on selected criteria
  const filteredVenues = useMemo(() => {
    if (!mockVenues || !Array.isArray(mockVenues)) {
      console.log('❌ No mockVenues available');
      return [];
    }
    
    // Check URL parameters directly
    const urlTypeParam = searchParams.get('type');
    const activeSelectedType = urlTypeParam || selectedType;
    
    console.log('🔍 Filtering venues - total available:', mockVenues.length);
    console.log('🎯 URL type param:', urlTypeParam);
    console.log('🎯 Active type filter:', activeSelectedType);
    console.log('🎯 Selected filters:', { selectedType, selectedRegion, selectedSize, selectedPrice, searchTerm });
    
    const filtered = mockVenues.filter(venue => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        venue.address.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        venue.description.toLowerCase().includes(searchTerm.toLowerCase());

      // Region filter - match based on city/location
      const matchesRegion = selectedRegion === 'All' || 
        (selectedRegion === 'Miami-Dade & Broward' && 
          (venue.address.city.includes('Miami') || venue.address.city.includes('Fort Lauderdale') || 
           venue.address.city.includes('Hollywood') || venue.address.city.includes('Coconut Grove') ||
           venue.address.city.includes('Coral Gables') || venue.address.city.includes('Homestead') ||
           venue.address.city.includes('Sunrise') || venue.address.city.includes('Cutler Bay'))) ||
        (selectedRegion === 'Palm Beaches' && 
          (venue.address.city.includes('Boca Raton') || venue.address.city.includes('Palm Beach') ||
           venue.address.city.includes('West Palm Beach') || venue.address.city.includes('Delray Beach'))) ||
        (selectedRegion === 'Southwest Florida' && 
          (venue.address.city.includes('Naples') || venue.address.city.includes('Fort Myers') ||
           venue.address.city.includes('Bonita Springs') || venue.address.city.includes('Marco Island'))) ||
        (selectedRegion === 'Florida Keys' && 
          (venue.address.city.includes('Key West') || venue.address.city.includes('Key Largo') ||
           venue.address.city.includes('Islamorada') || venue.address.city.includes('Duck Key')));

      // Venue type filter - match against tags array
      const matchesType = activeSelectedType === 'All' || !activeSelectedType ||
        (venue.tags && venue.tags.some((tag: string) => tag.toLowerCase().includes(activeSelectedType.toLowerCase())));
      
      // Debug logging for filtering when type is selected
      if (activeSelectedType && activeSelectedType !== 'All' && venue.id && parseInt(venue.id) <= 3) {
        console.log(`🔍 Venue ${venue.name}: tags=${JSON.stringify(venue.tags)}, activeSelectedType="${activeSelectedType}", matchesType=${matchesType}`);
        if (venue.tags) {
          venue.tags.forEach((tag: string, idx: number) => {
            console.log(`  Tag ${idx}: "${tag}" includes "${activeSelectedType}"? ${tag.toLowerCase().includes(activeSelectedType.toLowerCase())}`);
          });
        }
      }

      // Size filter based on capacity
      const matchesSize = selectedSize === 'All' || 
        (selectedSize === 'Intimate (Under 75)' && venue.capacity.max < 75) ||
        (selectedSize === 'Mid-Size (75-199)' && venue.capacity.max >= 75 && venue.capacity.max < 200) ||
        (selectedSize === 'Large (200+)' && venue.capacity.max >= 200);

      // Price filter
      const matchesPrice = selectedPrice === 'all' ||
        (selectedPrice === 'under-5k' && venue.pricing.startingPrice < 5000) ||
        (selectedPrice === '5k-15k' && venue.pricing.startingPrice >= 5000 && venue.pricing.startingPrice < 15000) ||
        (selectedPrice === '15k-30k' && venue.pricing.startingPrice >= 15000 && venue.pricing.startingPrice < 30000) ||
        (selectedPrice === 'over-30k' && venue.pricing.startingPrice >= 30000);

      const finalMatch = matchesSearch && matchesRegion && matchesType && matchesSize && matchesPrice;
      
      // Debug individual filter results for first few venues when type filtering
      if (activeSelectedType && activeSelectedType !== 'All' && venue.id && parseInt(venue.id) <= 2) {
        console.log(`📊 ${venue.name}: search=${matchesSearch}, region=${matchesRegion}, type=${matchesType}, size=${matchesSize}, price=${matchesPrice}, final=${finalMatch}`);
      }
      
      return finalMatch;
    });
    
    console.log('✅ Filtered venues result:', filtered.length, 'out of', mockVenues.length);
    if (activeSelectedType && activeSelectedType !== 'All' && filtered.length === 0) {
      console.log('⚠️ No venues found with type filter:', activeSelectedType);
    }
    return filtered;
  }, [searchTerm, selectedRegion, selectedType, selectedSize, selectedPrice, searchParams]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Header */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              South Florida Wedding Venues
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Discover {mockVenues?.length || 0} stunning venues across South Florida, from intimate beachfront ceremonies to grand ballroom receptions.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search venues by name or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-6 py-4 text-lg border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent shadow-sm"
                />
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-2 bg-pink-600 hover:bg-pink-700 text-white px-8 py-2 rounded-full font-medium transition"
                >
                  {searchTerm ? 'Clear' : 'Search'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Region:</span>
              <select 
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                {regions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Style:</span>
              <select 
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                {venueTypes.map(type => (
                  <option key={type} value={type}>{type === 'All' ? 'All Styles' : type.charAt(0).toUpperCase() + type.slice(1)}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Size:</span>
              <select 
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                {sizeCategories.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Price:</span>
              <select 
                value={selectedPrice}
                onChange={(e) => setSelectedPrice(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="all">All Prices</option>
                <option value="under-5k">Under $5,000</option>
                <option value="5k-15k">$5,000 - $15,000</option>
                <option value="15k-30k">$15,000 - $30,000</option>
                <option value="over-30k">Over $30,000</option>
              </select>
            </div>

            <span className="text-sm text-gray-500 ml-auto">
              Showing {filteredVenues?.length || 0} of {mockVenues?.length || 0} venues
            </span>
          </div>
        </div>
      </div>

      {/* Venue Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredVenues && filteredVenues.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredVenues.map((venue) => (
              <VenueCard key={venue.id} venue={venue} showFavorites={true} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {mockVenues?.length === 0 ? 'Loading venues...' : 'No venues match your criteria. Try adjusting your filters.'}
            </p>
          </div>
        )}
      </div>

      {/* Load More */}
      <div className="text-center pb-12">
        <button className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-8 rounded-full text-lg transition">
          Load More Venues
        </button>
      </div>

      <Footer />
    </div>
  );
}
