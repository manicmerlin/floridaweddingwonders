'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import DressShopCard from '../../components/DressShopCard';
import { mockDressShops } from '../../lib/dressShopData';
import { DressShop } from '../../types';

export default function DressShopsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [priceFilter, setPriceFilter] = useState('');

  // Get unique shop types for filtering
  const shopTypes = Array.from(new Set(mockDressShops.map(shop => shop.shopType))).sort();

  // Filter dress shops based on active tab and filters
  const filteredShops = mockDressShops.filter(shop => {
    // Tab filtering
    if (activeTab !== 'all' && shop.shopType !== activeTab) {
      return false;
    }

    // Type filtering
    if (selectedType && shop.shopType !== selectedType) {
      return false;
    }

    // Search filtering
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        shop.name.toLowerCase().includes(searchLower) ||
        shop.description.toLowerCase().includes(searchLower) ||
        shop.specialties.some(specialty => specialty.toLowerCase().includes(searchLower)) ||
        shop.address.city.toLowerCase().includes(searchLower) ||
        shop.brands?.some(brand => brand.toLowerCase().includes(searchLower))
      );
    }

    // Price filtering
    if (priceFilter) {
      const minPrice = shop.priceRange.min;
      const maxPrice = shop.priceRange.max;
      if (priceFilter === 'budget' && maxPrice > 1000) return false;
      if (priceFilter === 'mid' && (minPrice < 1000 || maxPrice > 3000)) return false;
      if (priceFilter === 'luxury' && minPrice < 3000) return false;
    }

    return true;
  });

  // Tab options based on shop types
  const tabOptions = [
    { id: 'all', label: 'All Shops', count: mockDressShops.length },
    { id: 'boutique', label: 'Boutiques', count: mockDressShops.filter(s => s.shopType === 'boutique').length },
    { id: 'designer', label: 'Designer', count: mockDressShops.filter(s => s.shopType === 'designer').length },
    { id: 'department', label: 'Department Stores', count: mockDressShops.filter(s => s.shopType === 'department').length },
    { id: 'consignment', label: 'Consignment', count: mockDressShops.filter(s => s.shopType === 'consignment').length },
    { id: 'plus-size', label: 'Plus Size', count: mockDressShops.filter(s => s.shopType === 'plus-size').length },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-pink-50 to-purple-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Find Your Dream Wedding Dress
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Discover South Florida's finest bridal boutiques, from designer showrooms to charming local shops.
          </p>
          
          {/* Call to Action */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-3 rounded-lg font-semibold transition"
            >
              Start Your Search
            </Link>
            <Link
              href="/venues"
              className="bg-white hover:bg-gray-50 text-gray-900 px-8 py-3 rounded-lg font-semibold border border-gray-300 transition"
            >
              Browse Venues
            </Link>
          </div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="py-8 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-6">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Search by shop name, designer, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="">All Shop Types</option>
                {shopTypes.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="">All Price Ranges</option>
                <option value="budget">Budget-Friendly (Under $1,000)</option>
                <option value="mid">Mid-Range ($1,000-$3,000)</option>
                <option value="luxury">Luxury ($3,000+)</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Shop Type Tabs */}
      <section className="py-6 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {tabOptions.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition ${
                    activeTab === tab.id
                      ? 'border-pink-500 text-pink-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  <span className="ml-2 bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </section>

      {/* Dress Shops Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredShops.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">👗</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No dress shops found</h3>
              <p className="text-gray-600 mb-6">Try adjusting your search or filters</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedType('');
                  setPriceFilter('');
                  setActiveTab('all');
                }}
                className="text-pink-600 hover:text-pink-700 font-medium"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">
                  {filteredShops.length} Dress Shop{filteredShops.length !== 1 ? 's' : ''} Found
                </h2>
                <div className="text-sm text-gray-600">
                  Showing {activeTab === 'all' ? 'all shop types' : tabOptions.find(t => t.id === activeTab)?.label}
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredShops.map((shop) => (
                  <DressShopCard key={shop.id} shop={shop} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Featured Services */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose South Florida Bridal Shops?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From Miami to Palm Beach, discover what makes our bridal boutiques special
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">🌴</div>
              <h3 className="font-semibold text-gray-900 mb-2">Beach-Ready Styles</h3>
              <p className="text-gray-600 text-sm">Perfect gowns for Florida's beautiful beach and outdoor venues</p>
            </div>
            
            <div className="text-center">
              <div className="text-4xl mb-4">✨</div>
              <h3 className="font-semibold text-gray-900 mb-2">Designer Selection</h3>
              <p className="text-gray-600 text-sm">Exclusive access to top designers and unique collections</p>
            </div>
            
            <div className="text-center">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="font-semibold text-gray-900 mb-2">Expert Stylists</h3>
              <p className="text-gray-600 text-sm">Personal consultants who understand Florida wedding style</p>
            </div>
            
            <div className="text-center">
              <div className="text-4xl mb-4">⏰</div>
              <h3 className="font-semibold text-gray-900 mb-2">Perfect Timing</h3>
              <p className="text-gray-600 text-sm">Alterations and timing perfect for your Florida wedding date</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tips Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Dress Shopping Tips for Florida Brides
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">🏖️ Consider the Climate</h3>
              <p className="text-gray-600 text-sm">
                Florida's warm weather calls for breathable fabrics like chiffon, tulle, or lightweight satin. 
                Avoid heavy materials that might be uncomfortable in the heat.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">📅 Start Early</h3>
              <p className="text-gray-600 text-sm">
                Begin shopping 8-12 months before your wedding. Florida's peak wedding season requires extra time 
                for alterations and shipping delays.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">👯 Bring Your Crew</h3>
              <p className="text-gray-600 text-sm">
                Limit your entourage to 2-3 trusted people whose opinions matter most. Too many voices 
                can make the decision overwhelming.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">💰 Set Your Budget</h3>
              <p className="text-gray-600 text-sm">
                Remember to budget for alterations (typically 15-20% of dress cost) and accessories. 
                Communicate your budget clearly with your consultant.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-gradient-to-r from-pink-600 to-purple-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Find Your Perfect Dress?
          </h2>
          <p className="text-xl text-pink-100 mb-8">
            Book appointments at multiple shops and start your bridal journey
          </p>
          <Link
            href="/register"
            className="bg-white hover:bg-gray-100 text-purple-600 px-8 py-4 rounded-lg font-semibold text-lg transition"
          >
            Create Your Bridal Profile
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
