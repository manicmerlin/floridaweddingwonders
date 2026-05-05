'use client';

import { useMemo, useState } from 'react';
import DressShopCard from '@/components/DressShopCard';
import EmptySearchFallback from '@/components/EmptySearchFallback';
import { fuzzyMatchesCity, normalizeQuery } from '@/lib/cityProximity';
import { DressShop } from '@/types';

interface Props {
  shops: DressShop[];
  /** Pre-fill from /dress-shops?q=<value>. */
  initialSearch?: string;
}

export default function DressShopsListClient({ shops, initialSearch = '' }: Props) {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedType, setSelectedType] = useState('');
  const [priceFilter, setPriceFilter] = useState('');

  const shopTypes = useMemo(
    () => Array.from(new Set(shops.map((s) => s.shopType).filter(Boolean))).sort(),
    [shops]
  );

  const filteredShops = useMemo(() => {
    return shops.filter((shop) => {
      if (activeTab !== 'all' && shop.shopType !== activeTab) return false;
      if (selectedType && shop.shopType !== selectedType) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matched =
          shop.name.toLowerCase().includes(q) ||
          shop.description.toLowerCase().includes(q) ||
          shop.specialties.some((s) => s.toLowerCase().includes(q)) ||
          shop.address.city.toLowerCase().includes(q) ||
          (shop.brands ?? []).some((b) => b.toLowerCase().includes(q));
        if (!matched) {
          // Fuzzy alias match — "st pete" → "st. petersburg" etc.
          const normQ = normalizeQuery(searchTerm);
          if (!(normQ.length >= 2 && fuzzyMatchesCity(searchTerm, shop.address.city))) {
            return false;
          }
        }
      }
      if (priceFilter) {
        const minPrice = shop.priceRange.min;
        const maxPrice = shop.priceRange.max;
        if (priceFilter === 'budget' && maxPrice > 1000) return false;
        if (priceFilter === 'mid' && (minPrice < 1000 || maxPrice > 3000)) return false;
        if (priceFilter === 'luxury' && minPrice < 3000) return false;
      }
      return true;
    });
  }, [shops, activeTab, selectedType, searchTerm, priceFilter]);

  // Tabs cover every shop_type the catalog supports. Empty ones drop off
  // via the count > 0 filter, so the bar grows as new types get populated.
  // Labels are pluralised; keep ids matching the DB enum exactly so the
  // filter above (`shop.shopType !== activeTab`) hits.
  const tabOptions = useMemo(() => {
    const counts = new Map<string, number>();
    shops.forEach((s) => counts.set(s.shopType, (counts.get(s.shopType) ?? 0) + 1));
    return [
      { id: 'all', label: 'All Shops', count: shops.length },
      { id: 'boutique', label: 'Boutiques', count: counts.get('boutique') ?? 0 },
      { id: 'designer', label: 'Designer', count: counts.get('designer') ?? 0 },
      { id: 'department', label: 'Department Stores', count: counts.get('department') ?? 0 },
      { id: 'salon', label: 'Salons', count: counts.get('salon') ?? 0 },
      { id: 'showroom', label: 'Showrooms', count: counts.get('showroom') ?? 0 },
      { id: 'mega-store', label: 'Mega-Stores', count: counts.get('mega-store') ?? 0 },
      { id: 'mobile service', label: 'Mobile Service', count: counts.get('mobile service') ?? 0 },
      { id: 'consignment', label: 'Consignment', count: counts.get('consignment') ?? 0 },
      { id: 'vintage', label: 'Vintage', count: counts.get('vintage') ?? 0 },
      { id: 'plus-size', label: 'Plus Size', count: counts.get('plus-size') ?? 0 },
    ].filter((t) => t.id === 'all' || t.count > 0);
  }, [shops]);

  return (
    <>
      {/* Header and Search Section */}
      <section className="py-8 bg-gray-900/30 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl lg:text-5xl font-bold text-white mb-6 text-center">
            Bridal Shops in Florida
          </h1>
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

      {/* Dress Shops Grid */}
      <section className="py-12 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredShops.length === 0 ? (
            searchTerm ? (
              <EmptySearchFallback
                query={searchTerm}
                kind="dress-shops"
                totalCount={shops.length}
                noun="bridal shop"
                onClear={() => {
                  setSearchTerm('');
                  setSelectedType('');
                  setPriceFilter('');
                  setActiveTab('all');
                }}
              />
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">👗</div>
                <h3 className="text-xl font-semibold text-white mb-2">No dress shops found</h3>
                <p className="text-gray-300 mb-6">Try adjusting your filters</p>
                <button
                  onClick={() => {
                    setSelectedType('');
                    setPriceFilter('');
                    setActiveTab('all');
                  }}
                  className="text-pink-300 hover:text-pink-200 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            )
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

    </>
  );
}
