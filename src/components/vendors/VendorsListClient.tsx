'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Vendor } from '@/types';
import VendorListingCard from '@/components/vendors/VendorListingCard';
import EmptySearchFallback from '@/components/EmptySearchFallback';
import { fuzzyMatchesCity, normalizeQuery } from '@/lib/cityProximity';

interface Props {
  vendors: Vendor[];
  /** Pre-fill from /vendors?q=<value>. */
  initialSearch?: string;
}

export default function VendorsListClient({ vendors, initialSearch = '' }: Props) {
  const t = useTranslations('VendorsList');
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState(initialSearch);
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
        if (haystack.includes(q)) return true;
        // Fuzzy alias match — "st pete" → "st. petersburg" etc.
        const normQ = normalizeQuery(searchTerm);
        if (normQ.length >= 2 && fuzzyMatchesCity(searchTerm, v.address.city)) return true;
        return false;
      }
      return true;
    });
  }, [vendors, activeTab, selectedCategory, searchTerm]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setActiveTab('all');
  };

  // All 14 vendor categories the catalog supports. Each tab counts vendors
  // whose `category` matches the id, then we drop empty ones — so the tab
  // bar grows naturally as new categories get populated.
  // The `id` here is matched against `category.toLowerCase().includes(id)`
  // in the filter above, so "music" must match both 'dj' and 'band' rows.
  const tabOptions = useMemo(() => {
    const count = (predicate: (cat: string) => boolean) =>
      vendors.filter((v) => predicate(v.category.toLowerCase())).length;
    return [
      { id: 'all', label: t('tabAll'), count: vendors.length },
      { id: 'photo', label: t('tabPhoto'), count: count((c) => c.includes('photo')) },
      { id: 'video', label: t('tabVideo'), count: count((c) => c.includes('video')) },
      { id: 'flor', label: t('tabFlor'), count: count((c) => c.includes('flor')) },
      {
        id: 'music',
        label: t('tabMusic'),
        count: count((c) => c.includes('dj') || c.includes('band') || c.includes('music')),
      },
      { id: 'cater', label: t('tabCater'), count: count((c) => c.includes('cater')) },
      { id: 'baker', label: t('tabBaker'), count: count((c) => c.includes('baker') || c.includes('cake')) },
      { id: 'plan', label: t('tabPlan'), count: count((c) => c.includes('plan')) },
      { id: 'rental', label: t('tabRental'), count: count((c) => c.includes('rental') || c.includes('decor')) },
      { id: 'transport', label: t('tabTransport'), count: count((c) => c.includes('transport')) },
      { id: 'offici', label: t('tabOffici'), count: count((c) => c.includes('offici')) },
      { id: 'hair', label: t('tabHair'), count: count((c) => c.includes('hair') || c.includes('makeup')) },
      { id: 'entertain', label: t('tabEntertain'), count: count((c) => c.includes('entertain')) },
      { id: 'lighting', label: t('tabLighting'), count: count((c) => c.includes('light')) },
      { id: 'station', label: t('tabStation'), count: count((c) => c.includes('station')) },
      { id: 'jewel', label: t('tabJewel'), count: count((c) => c.includes('jewel')) },
    ].filter((tab) => tab.id === 'all' || tab.count > 0);
  }, [vendors, t]);

  return (
    <>
      <section className="py-8 bg-gray-900/30 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl lg:text-5xl font-bold text-white mb-6 text-center">
            {t('title')}
          </h1>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
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
                <option value="">{t('allCategories')}</option>
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
            searchTerm ? (
              <EmptySearchFallback
                query={searchTerm}
                kind="vendors"
                totalCount={vendors.length}
                noun="vendor"
                onClear={clearFilters}
              />
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-white mb-2">{t('noResultsTitle')}</h3>
                <p className="text-gray-300 mb-6">{t('noResultsSubtitle')}</p>
                <button
                  onClick={clearFilters}
                  className="text-pink-300 hover:text-pink-200 font-medium"
                >
                  {t('clearFilters')}
                </button>
              </div>
            )
          ) : (
            <>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-white">
                  {filteredVendors.length}{' '}
                  {filteredVendors.length === 1 ? t('vendorsFoundOne') : t('vendorsFoundMany')}
                </h2>
                <div className="text-sm text-gray-300">
                  {t('showing')}{' '}
                  {activeTab === 'all'
                    ? t('showingAll')
                    : tabOptions.find((tab) => tab.id === activeTab)?.label}
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

