'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Vendor } from '@/types';
import VendorImagePlaceholder from '@/components/VendorImagePlaceholder';

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

  // Tabs: only categories with non-zero vendor counts (Phase 1 step 7).
  const tabOptions = useMemo(
    () =>
      [
        { id: 'all', label: 'All Vendors', count: vendors.length },
        {
          id: 'photographer',
          label: 'Photography',
          count: vendors.filter((v) => v.category.toLowerCase().includes('photo')).length,
        },
        {
          id: 'caterer',
          label: 'Catering',
          count: vendors.filter((v) => v.category.toLowerCase().includes('cater')).length,
        },
        {
          id: 'florist',
          label: 'Florals',
          count: vendors.filter((v) => v.category.toLowerCase().includes('flor')).length,
        },
        {
          id: 'music',
          label: 'Music & DJ',
          count: vendors.filter(
            (v) => v.category.toLowerCase().includes('music') || v.category.toLowerCase().includes('dj')
          ).length,
        },
        {
          id: 'planner',
          label: 'Planning',
          count: vendors.filter((v) => v.category.toLowerCase().includes('plan')).length,
        },
      ].filter((t) => t.id === 'all' || t.count > 0),
    [vendors]
  );

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
                {filteredVendors.map((vendor) => {
                  const primaryImage = vendor.images?.find((i) => i.isPrimary) ?? vendor.images?.[0];
                  return (
                    <div
                      key={vendor.id}
                      className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden"
                    >
                      <div className="aspect-w-16 aspect-h-10">
                        {primaryImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={primaryImage.url}
                            alt={vendor.name}
                            className="w-full h-48 object-cover"
                          />
                        ) : (
                          <VendorImagePlaceholder name={vendor.name} category={vendor.category} />
                        )}
                      </div>

                      <div className="p-6">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">{vendor.name}</h3>
                            <p className="text-pink-600 font-medium capitalize">{vendor.category}</p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center mb-3">
                          <span className="text-gray-600 text-sm">📍 {vendor.address.city}</span>
                        </div>

                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{vendor.description}</p>

                        {vendor.specialties && vendor.specialties.length > 0 && (
                          <div className="mb-4 flex flex-wrap gap-2">
                            {vendor.specialties.slice(0, 3).map((s, i) => (
                              <span
                                key={i}
                                className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                          {vendor.contact.phone ? (
                            <a
                              href={`tel:${vendor.contact.phone}`}
                              className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg text-sm font-medium text-center transition"
                            >
                              Call Now
                            </a>
                          ) : (
                            <Link
                              href={`/vendors/${vendor.slug || vendor.id}`}
                              className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg text-sm font-medium text-center transition"
                            >
                              View Details
                            </Link>
                          )}
                          {vendor.contact.email ? (
                            <a
                              href={`mailto:${vendor.contact.email}`}
                              className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-4 py-2 rounded-lg text-sm font-medium text-center transition"
                            >
                              Email
                            </a>
                          ) : (
                            <Link
                              href={`/vendors/${vendor.slug || vendor.id}`}
                              className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-4 py-2 rounded-lg text-sm font-medium text-center transition"
                            >
                              Profile
                            </Link>
                          )}
                        </div>

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
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
