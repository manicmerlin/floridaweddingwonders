'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';

// Import vendor data
import vendorData from '../../data/vendors.json';

interface Vendor {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  location: string;
  description: string;
  priceRange: string;
  rating: number;
  reviewCount: number;
  images: string[];
  contact: {
    phone: string;
    email: string;
    website?: string;
  };
  services: string[];
  specialties?: string[];
  yearsInBusiness?: number;
  teamSize?: string;
  socialMedia?: {
    instagram?: string;
    facebook?: string;
  };
}

export default function VendorsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceFilter, setPriceFilter] = useState('');

  // Get vendors from data
  const vendors: Vendor[] = vendorData.weddingVendors;

  // Get unique categories for filtering
  const categories = Array.from(new Set(vendors.map(vendor => vendor.category))).sort();

  // Filter vendors based on active tab and filters
  const filteredVendors = vendors.filter(vendor => {
    // Tab filtering
    if (activeTab !== 'all' && vendor.category.toLowerCase() !== activeTab) {
      return false;
    }

    // Category filtering
    if (selectedCategory && vendor.category !== selectedCategory) {
      return false;
    }

    // Search filtering
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        vendor.name.toLowerCase().includes(searchLower) ||
        vendor.description.toLowerCase().includes(searchLower) ||
        vendor.services.some(service => service.toLowerCase().includes(searchLower)) ||
        vendor.location.toLowerCase().includes(searchLower)
      );
    }

    // Price filtering
    if (priceFilter) {
      // This is a simple implementation - you might want to enhance this
      const priceRangeLower = vendor.priceRange.toLowerCase();
      if (priceFilter === 'low' && !priceRangeLower.includes('$')) return false;
      if (priceFilter === 'medium' && !priceRangeLower.includes('$$')) return false;
      if (priceFilter === 'high' && !priceRangeLower.includes('$$$')) return false;
    }

    return true;
  });

  // Tab options based on vendor categories
  const tabOptions = [
    { id: 'all', label: 'All Vendors', count: vendors.length },
    { id: 'photography', label: 'Photography', count: vendors.filter(v => v.category.toLowerCase().includes('photo')).length },
    { id: 'catering', label: 'Catering', count: vendors.filter(v => v.category.toLowerCase().includes('cater')).length },
    { id: 'florist', label: 'Florals', count: vendors.filter(v => v.category.toLowerCase().includes('flor')).length },
    { id: 'music', label: 'Music & DJ', count: vendors.filter(v => v.category.toLowerCase().includes('music') || v.category.toLowerCase().includes('dj')).length },
    { id: 'planning', label: 'Planning', count: vendors.filter(v => v.category.toLowerCase().includes('plan')).length },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900">
      <Navigation />
      
      {/* Header and Search Section */}
      <section className="py-8 bg-gray-900/30 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl lg:text-5xl font-bold text-white mb-6 text-center">
            Wedding Vendors in Florida
          </h1>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Search vendors by name, location, or service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 bg-white/90 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900"
              />
            </div>
            
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 bg-white/90 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div>
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
                className="w-full px-4 py-3 bg-white/90 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900"
              >
                <option value="">All Prices</option>
                <option value="low">Budget-Friendly ($)</option>
                <option value="medium">Mid-Range ($$)</option>
                <option value="high">Premium ($$$)</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Category Tabs */}
      <section className="py-6 bg-gray-900/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-b border-white/20">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {tabOptions.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition ${
                    activeTab === tab.id
                      ? 'border-pink-400 text-pink-300'
                      : 'border-transparent text-gray-300 hover:text-white hover:border-gray-500'
                  }`}
                >
                  {tab.label}
                  <span className="ml-2 bg-white/20 text-white py-1 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </section>

      {/* Vendors Grid */}
      <section className="py-12 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredVendors.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-white mb-2">No vendors found</h3>
              <p className="text-gray-300 mb-6">Try adjusting your search or filters</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('');
                  setPriceFilter('');
                  setActiveTab('all');
                }}
                className="text-pink-300 hover:text-pink-200 font-medium"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">
                  {filteredVendors.length} Vendor{filteredVendors.length !== 1 ? 's' : ''} Found
                </h2>
                <div className="text-sm text-gray-600">
                  Showing {activeTab === 'all' ? 'all categories' : tabOptions.find(t => t.id === activeTab)?.label}
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredVendors.map((vendor) => (
                  <div key={vendor.id} className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden">
                    {/* Vendor Image */}
                    <div className="aspect-w-16 aspect-h-10 bg-gray-200">
                      {vendor.images && vendor.images.length > 0 ? (
                        <img
                          src={vendor.images[0]}
                          alt={vendor.name}
                          className="w-full h-48 object-cover"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                          <span className="text-6xl">�🤵</span>
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      {/* Vendor Header */}
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1">{vendor.name}</h3>
                          <p className="text-pink-600 font-medium">{vendor.category}</p>
                        </div>
                        <div className="text-right">
                          {vendor.rating && (
                            <div className="flex items-center">
                              <span className="text-yellow-400">⭐</span>
                              <span className="ml-1 text-sm font-medium text-gray-900">{vendor.rating}</span>
                              <span className="text-sm text-gray-500">({vendor.reviewCount})</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Location and Price */}
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-gray-600 text-sm">📍 {vendor.location}</span>
                        <span className="text-green-600 font-semibold">{vendor.priceRange}</span>
                      </div>

                      {/* Description */}
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {vendor.description}
                      </p>

                      {/* Services */}
                      {vendor.services && vendor.services.length > 0 && (
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-2">
                            {vendor.services.slice(0, 3).map((service, index) => (
                              <span
                                key={index}
                                className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs"
                              >
                                {service}
                              </span>
                            ))}
                            {vendor.services.length > 3 && (
                              <span className="text-gray-500 text-xs">
                                +{vendor.services.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Contact Buttons */}
                      <div className="grid grid-cols-2 gap-3">
                        <a
                          href={`tel:${vendor.contact.phone}`}
                          className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg text-sm font-medium text-center transition"
                        >
                          Call Now
                        </a>
                        <a
                          href={`mailto:${vendor.contact.email}`}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-4 py-2 rounded-lg text-sm font-medium text-center transition"
                        >
                          Email
                        </a>
                      </div>

                      {/* Website Link */}
                      {vendor.contact.website && (
                        <div className="mt-3">
                          <a
                            href={vendor.contact.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-pink-600 hover:text-pink-700 text-sm font-medium"
                          >
                            Visit Website →
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-gradient-to-r from-purple-600 to-pink-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Are You a Wedding Vendor?
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Join our directory and connect with couples planning their dream wedding
          </p>
          <Link
            href="/vendor-owner"
            className="bg-white hover:bg-gray-100 text-purple-600 px-8 py-4 rounded-lg font-semibold text-lg transition"
          >
            List Your Business Today
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
