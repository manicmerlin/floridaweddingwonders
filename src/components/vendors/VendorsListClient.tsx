'use client';

import { useMemo, useState } from 'react';
import { Vendor } from '@/types';
import VendorListingCard from '@/components/vendors/VendorListingCard';

interface Props {
  vendors: Vendor[];
}

export default function VendorsListClient({ vendors }: Props) {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const categories = useMemo(
    () => Array.from(new Set(vendors.map((v) => v.category))).sort(),
    [vendors]
  );

  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      if (activeTab !== 'all' && !v.category.toLowerCase().includes(activeTab)) return false;
      if (selectedCategory && v.category !== selectedCategory) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const haystack = [
          v.name,
          v.description,
          v.address.city,
          ...(v.services ?? []),
          ...(v.specialties ?? []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [vendors, activeTab, selectedCategory, searchTerm]);

  // All 14 vendor categories the catalog supports. Each tab counts vendors
  // whose `category` matches the id, then we drop empty ones — so the tab
  // bar grows naturally as new categories get populated.
  // The `id` here is matched against `category.toLowerCase().includes(id)`
  // in the filter above, so "music" must match both 'dj' and 'band' rows.
  const tabOptions = useMemo(() => {
    const count = (predicate: (cat: string) => boolean) =>
      vendors.filter((v) => predicate(v.category.toLowerCase())).length;
    return [
      { id: 'all', label: 'All Vendors', count: vendors.length },
      { id: 'photo', label: 'Photography', count: count((c) => c.includes('photo')) },
      { id: 'video', label: 'Videography', count: count((c) => c.includes('video')) },
      { id: 'flor', label: 'Florals', count: count((c) => c.includes('flor')) },
      {
        id: 'music',
        label: 'Music & DJ',
        count: count((c) => c.includes('dj') || c.includes('band') || c.includes('music')),
      },
      { id: 'cater', label: 'Catering', count: count((c) => c.includes('cater')) },
      { id: 'baker', label: 'Cakes & Bakers', count: count((c) => c.includes('baker') || c.includes('cake')) },
      { id: 'plan', label: 'Planning', count: count((c) => c.includes('plan')) },
      { id: 'rental', label: 'Rentals', count: count((c) => c.includes('rental') || c.includes('decor')) },
      { id: 'transport', label: 'Transportation', count: count((c) => c.includes('transport')) },
      { id: 'offici', label: 'Officiants', count: count((c) => c.includes('offici')) },
      { id: 'hair', label: 'Hair & Makeup', count: count((c) => c.includes('hair') || c.includes('makeup')) },
      { id: 'entertain', label: 'Entertainment', count: count((c) => c.includes('entertain')) },
      { id: 'lighting', label: 'Lighting', count: count((c) => c.includes('light')) },
      { id: 'station', label: 'Stationery', count: count((c) => c.includes('station')) },
      { id: 'jewel', label: 'Jewelry', count: count((c) => c.includes('jewel')) },
    ].filter((t) => t.id === 'all' || t.count > 0);
  }, [vendors]);

  return (
    <>
      <section className="py-8 bg-gray-900/30 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl lg:text-5xl font-bold text-white mb-6 text-center">
            Wedding Vendors in Florida
          </h1>
          <div className="grid md:grid-cols-3 gap-6">
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
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

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
                <h2 className="text-2xl font-bold text-white">
                  {filteredVendors.length} Vendor{filteredVendors.length !== 1 ? 's' : ''} Found
                </h2>
                <div className="text-sm text-gray-300">
                  Showing{' '}
                  {activeTab === 'all'
                    ? 'all categories'
                    : tabOptions.find((t) => t.id === activeTab)?.label}
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredVendors.map((vendor) => (
                  <VendorListingCard key={vendor.id} vendor={vendor} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}

