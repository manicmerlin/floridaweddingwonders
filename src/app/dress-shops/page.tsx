'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { DressShop } from '../../types';
import { mockDressShops } from '../../lib/dressShopData';
import DressShopCard from '../../components/DressShopCard';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function DressShopsPage() {
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [selectedPrice, setSelectedPrice] = useState<string>('all');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('All');

  // Debug logging
  console.log('👗 DressShopsPage - mockDressShops:', mockDressShops.length, 'shops imported');

  // Get all available specialties for filter
  const allSpecialties = useMemo(() => {
    const specialties = new Set<string>();
    mockDressShops.forEach(shop => {
      shop.specialties.forEach(specialty => specialties.add(specialty));
    });
    return Array.from(specialties).sort();
  }, []);

  // Filter dress shops based on current filters and URL parameters
  const filteredShops = useMemo(() => {
    console.log('🔍 Filtering dress shops - total available:', mockDressShops.length);
    
    // Check URL parameters for initial filtering
    const typeParam = searchParams.get('type');
    console.log('🎯 URL type param:', typeParam);
    
    // Determine active type filter
    const activeSelectedType = typeParam || selectedType;
    console.log('🎯 Active type filter:', activeSelectedType);

    console.log('🎯 Selected filters:', {
      selectedType: activeSelectedType,
      selectedRegion,
      selectedPrice,
      selectedSpecialty,
      searchTerm
    });

    let filtered = mockDressShops.filter(shop => {
      // Type filter
      if (activeSelectedType !== 'All' && shop.shopType !== activeSelectedType.toLowerCase()) {
        return false;
      }

      // Region filter
      if (selectedRegion !== 'All') {
        const shopRegion = shop.address.city.toLowerCase().includes('miami') ? 'Miami-Dade' :
                          shop.address.city.toLowerCase().includes('fort lauderdale') || 
                          shop.address.city.toLowerCase().includes('hollywood') ||
                          shop.address.city.toLowerCase().includes('pompano') ? 'Broward' :
                          shop.address.city.toLowerCase().includes('palm beach') ||
                          shop.address.city.toLowerCase().includes('boca') ||
                          shop.address.city.toLowerCase().includes('delray') ? 'Palm Beach' : 'Other';
        
        if (shopRegion !== selectedRegion) return false;
      }

      // Price filter
      if (selectedPrice !== 'all') {
        const shopMaxPrice = shop.priceRange.max;
        switch (selectedPrice) {
          case 'under-1000':
            if (shopMaxPrice >= 1000) return false;
            break;
          case '1000-3000':
            if (shopMaxPrice < 1000 || shopMaxPrice > 3000) return false;
            break;
          case '3000-5000':
            if (shopMaxPrice < 3000 || shopMaxPrice > 5000) return false;
            break;
          case 'over-5000':
            if (shopMaxPrice <= 5000) return false;
            break;
        }
      }

      // Specialty filter
      if (selectedSpecialty !== 'All' && !shop.specialties.some(spec => 
        spec.toLowerCase().includes(selectedSpecialty.toLowerCase())
      )) {
        return false;
      }

      // Search term filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return shop.name.toLowerCase().includes(searchLower) ||
               shop.description.toLowerCase().includes(searchLower) ||
               shop.address.city.toLowerCase().includes(searchLower) ||
               shop.specialties.some(spec => spec.toLowerCase().includes(searchLower)) ||
               shop.brands.some(brand => brand.toLowerCase().includes(searchLower));
      }

      return true;
    });

    console.log('✅ Filtered dress shops result:', filtered.length, 'out of', mockDressShops.length);
    return filtered;
  }, [searchParams, selectedType, selectedRegion, selectedPrice, selectedSpecialty, searchTerm, allSpecialties]);

  // Update selectedType when URL changes
  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam) {
      setSelectedType(typeParam.charAt(0).toUpperCase() + typeParam.slice(1));
    }
  }, [searchParams]);

  const shopTypes = ['All', 'Boutique', 'Department', 'Designer', 'Consignment', 'Vintage', 'Plus-size'];
  const regions = ['All', 'Miami-Dade', 'Broward', 'Palm Beach'];
  const priceRanges = [
    { value: 'all', label: 'All Prices' },
    { value: 'under-1000', label: 'Under $1,000' },
    { value: '1000-3000', label: '$1,000 - $3,000' },
    { value: '3000-5000', label: '$3,000 - $5,000' },
    { value: 'over-5000', label: 'Over $5,000' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Header */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Wedding Dress Shops
              <span className="text-pink-600 block">in South Florida</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Find your dream dress at the best bridal boutiques, from luxury designers to affordable options
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search by shop name, brand, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-6 py-4 text-lg border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent shadow-sm"
                />
                <div className="absolute right-2 top-2">
                  <button className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-2 rounded-full font-medium transition">
                    Search
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Shop Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Shop Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                {shopTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Region Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                {regions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>

            {/* Price Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
              <select
                value={selectedPrice}
                onChange={(e) => setSelectedPrice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                {priceRanges.map(range => (
                  <option key={range.value} value={range.value}>{range.label}</option>
                ))}
              </select>
            </div>

            {/* Specialty Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Specialty</label>
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="All">All Specialties</option>
                {allSpecialties.map(specialty => (
                  <option key={specialty} value={specialty}>{specialty}</option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSelectedType('All');
                  setSelectedRegion('All');
                  setSelectedPrice('all');
                  setSelectedSpecialty('All');
                  setSearchTerm('');
                }}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md font-medium transition"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            {filteredShops.length} Dress Shop{filteredShops.length !== 1 ? 's' : ''} Found
          </h2>
          <div className="text-sm text-gray-600">
            Showing {filteredShops.length} of {mockDressShops.length} shops
          </div>
        </div>

        {filteredShops.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredShops.map((shop) => (
              <DressShopCard key={shop.id} shop={shop} showFavorites={true} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👗</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No dress shops found</h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your filters or search terms to find more results.
            </p>
            <button
              onClick={() => {
                setSelectedType('All');
                setSelectedRegion('All');
                setSelectedPrice('all');
                setSelectedSpecialty('All');
                setSearchTerm('');
              }}
              className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-medium transition"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
