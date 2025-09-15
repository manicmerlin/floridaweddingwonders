'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { Vendor } from '@/types';
import vendorData from '@/data/vendors.json';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

// Extended VendorFilters for this page
interface ExtendedVendorFilters {
  location?: string;
  category?: Vendor['category'];
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  priceRange?: 'under-500' | '500-1500' | '1500-3000' | 'over-3000';
  specialties?: string[];
  serviceArea?: string;
}

// Load vendors from the JSON file
const vendors: any[] = vendorData.weddingVendors;

export default function VendorsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<ExtendedVendorFilters>({});

  // Debug logging can be removed in production

  const filteredVendors = useMemo(() => {
    return vendors.filter(vendor => {
      // Search term filter
      if (searchTerm && 
          !vendor.name?.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !vendor.address?.city?.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !vendor.category?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Category filter
      if (filters.category && vendor.category !== filters.category) {
        return false;
      }

      // City filter  
      if (filters.city && vendor.address?.city !== filters.city) {
        return false;
      }

      // Price range filter - skip for now since your data structure doesn't have priceRange
      // if (filters.priceRange) {
      //   const vendorPrice = vendor.priceRange?.min;
      //   if (!vendorPrice) return true;
      //   
      //   switch (filters.priceRange) {
      //     case 'under-500':
      //       return vendorPrice < 500;
      //     case '500-1500':
      //       return vendorPrice >= 500 && vendorPrice <= 1500;
      //     case '1500-3000':
      //       return vendorPrice >= 1500 && vendorPrice <= 3000;
      //     case 'over-3000':
      //       return vendorPrice > 3000;
      //     default:
      //       return true;
      //   }
      // }

      return true;
    });
  }, [vendors, searchTerm, filters]);

  const vendorCategories = [
    'photographer',
    'videographer', 
    'planner',
    'caterer',
    'baker',
    'entertainment',
    'florist',
    'musician',
    'dj',
    'decorator',
    'transportation',
    'officiant',
    'other'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-50 to-pink-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Find Your Wedding <span className="text-pink-600">Vendors</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Connect with top-rated photographers, florists, caterers, and more across South Florida
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search vendors by name, service, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-6 py-4 text-lg border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent shadow-sm"
                />
                <button className="absolute right-2 top-2 bg-pink-600 hover:bg-pink-700 text-white px-8 py-2 rounded-full font-medium transition">
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters & Results */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filter Bar */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="grid md:grid-cols-3 gap-4">
              <select
                value={filters.category || ''}
                onChange={(e) => setFilters(prev => ({...prev, category: e.target.value as Vendor['category'] || undefined}))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="">All Categories</option>
                {vendorCategories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Filter by city..."
                value={filters.city || ''}
                onChange={(e) => setFilters(prev => ({...prev, city: e.target.value || undefined}))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />

              <select
                value={filters.priceRange || ''}
                onChange={(e) => setFilters(prev => ({...prev, priceRange: e.target.value as ExtendedVendorFilters['priceRange'] || undefined}))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="">All Price Ranges</option>
                <option value="under-500">Under $500</option>
                <option value="500-1500">$500 - $1,500</option>
                <option value="1500-3000">$1,500 - $3,000</option>
                <option value="over-3000">Over $3,000</option>
              </select>
            </div>
          </div>

          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {filteredVendors.length} Vendor{filteredVendors.length === 1 ? '' : 's'} Found
            </h2>
          </div>

          {/* Vendor Grid */}
          {filteredVendors.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVendors.map((vendor) => (
                <div key={vendor.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition">
                  <div className="h-48 bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                    <div className="text-center p-6">
                      <div className="text-4xl mb-2">
                        {vendor.category === 'photographer' ? '📸' : 
                         vendor.category === 'videographer' ? '🎥' :
                         vendor.category === 'planner' ? '📋' :
                         vendor.category === 'caterer' ? '🍽️' :
                         vendor.category === 'baker' ? '🍰' :
                         vendor.category === 'entertainment' ? '🎭' : '💍'}
                      </div>
                      <span className="bg-pink-100 text-pink-800 text-xs px-2 py-1 rounded-full">
                        {vendor.subcategory || vendor.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{vendor.name}</h3>
                    </div>
                    <p className="text-gray-600 mb-2">{vendor.address.city}, FL</p>
                    <p className="text-gray-700 mb-4 line-clamp-3">{vendor.description}</p>
                    
                    {/* Contact Info */}
                    <div className="space-y-2 mb-4">
                      {vendor.contact.website && (
                        <a 
                          href={vendor.contact.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-pink-600 hover:text-pink-700 text-sm font-medium block"
                        >
                          🌐 Visit Website
                        </a>
                      )}
                      {vendor.contact.socialMedia?.instagram && (
                        <a 
                          href={`https://instagram.com/${vendor.contact.socialMedia.instagram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer" 
                          className="text-pink-600 hover:text-pink-700 text-sm font-medium block"
                        >
                          📱 {vendor.contact.socialMedia.instagram}
                        </a>
                      )}
                      {vendor.contact.phone && (
                        <a 
                          href={`tel:${vendor.contact.phone}`}
                          className="text-pink-600 hover:text-pink-700 text-sm font-medium block"
                        >
                          📞 {vendor.contact.phone}
                        </a>
                      )}
                    </div>

                    <Link
                      href={`/vendors/${vendor.id}`}
                      className="w-full bg-pink-600 hover:bg-pink-700 text-white py-2 px-4 rounded-lg font-medium transition text-center block"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No vendors found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Are You a Wedding Vendor?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join our growing network of South Florida wedding professionals and connect with engaged couples.
          </p>
          <Link
            href="/vendor-owner"
            className="inline-block bg-pink-600 hover:bg-pink-700 text-white px-8 py-4 rounded-lg font-medium text-lg transition"
          >
            List Your Business
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
