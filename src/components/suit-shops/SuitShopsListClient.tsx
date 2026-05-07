'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import SuitShopCard from '@/components/SuitShopCard';
import EmptySearchFallback from '@/components/EmptySearchFallback';
import { fuzzyMatchesCity, normalizeQuery } from '@/lib/cityProximity';
import { SuitShop } from '@/types';

interface Props {
  shops: SuitShop[];
  /** Pre-fill from /suit-shops?q=<value>. */
  initialSearch?: string;
}

export default function SuitShopsListClient({ shops, initialSearch = '' }: Props) {
  const t = useTranslations('SuitShopsList');
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
          const normQ = normalizeQuery(searchTerm);
          if (!(normQ.length >= 2 && fuzzyMatchesCity(searchTerm, shop.address.city))) {
            return false;
          }
        }
      }
      // Price buckets re-baselined for menswear: rentals tend to land under
      // $300; ready-to-wear suits/tuxedos $300–$1,500; bespoke $1,500+.
      if (priceFilter) {
        const minPrice = shop.priceRange.min;
        const maxPrice = shop.priceRange.max;
        if (priceFilter === 'rental' && (maxPrice === 0 || maxPrice > 400)) return false;
        if (priceFilter === 'rtw' && (minPrice > 1500 || maxPrice < 300)) return false;
        if (priceFilter === 'bespoke' && minPrice < 1500) return false;
      }
      return true;
    });
  }, [shops, activeTab, selectedType, searchTerm, priceFilter]);

  // shop_type tabs match the DB enum so the filter `shop.shopType === activeTab`
  // hits cleanly. Empty types drop off via the count > 0 filter.
  const tabOptions = useMemo(() => {
    const counts = new Map<string, number>();
    shops.forEach((s) => counts.set(s.shopType, (counts.get(s.shopType) ?? 0) + 1));
    return [
      { id: 'all', label: t('tabAll'), count: shops.length },
      { id: 'bespoke-tailor', label: t('tabBespoke'), count: counts.get('bespoke-tailor') ?? 0 },
      { id: 'tuxedo-rental', label: t('tabTuxedoRental'), count: counts.get('tuxedo-rental') ?? 0 },
      { id: 'suit-boutique', label: t('tabBoutique'), count: counts.get('suit-boutique') ?? 0 },
      { id: 'made-to-measure', label: t('tabMTM'), count: counts.get('made-to-measure') ?? 0 },
      { id: 'formalwear', label: t('tabFormalwear'), count: counts.get('formalwear') ?? 0 },
    ].filter((tab) => tab.id === 'all' || tab.count > 0);
  }, [shops, t]);

  return (
    <>
      {/* Header and Search Section */}
      <section className="py-8 bg-gray-900/30 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl lg:text-5xl font-bold text-white mb-6 text-center">
            {t('title')}
          </h1>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-700 focus:border-transparent"
              />
            </div>

            <div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-700 focus:border-transparent"
              >
                <option value="">{t('allShopTypes')}</option>
                {shopTypes.map((type) => (
                  <option key={type} value={type}>
                    {type
                      .split('-')
                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                      .join(' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-700 focus:border-transparent"
              >
                <option value="">{t('allPriceRanges')}</option>
                <option value="rental">{t('priceRental')}</option>
                <option value="rtw">{t('priceRtw')}</option>
                <option value="bespoke">{t('priceBespoke')}</option>
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
                      ? 'border-amber-300 text-amber-200'
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

      {/* Suit Shops Grid */}
      <section className="py-12 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredShops.length === 0 ? (
            searchTerm ? (
              <EmptySearchFallback
                query={searchTerm}
                kind="suit-shops"
                totalCount={shops.length}
                noun="suit shop"
                onClear={() => {
                  setSearchTerm('');
                  setSelectedType('');
                  setPriceFilter('');
                  setActiveTab('all');
                }}
              />
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🤵</div>
                <h3 className="text-xl font-semibold text-white mb-2">{t('noResultsTitle')}</h3>
                <p className="text-gray-300 mb-6">{t('noResultsSubtitle')}</p>
                <button
                  onClick={() => {
                    setSelectedType('');
                    setPriceFilter('');
                    setActiveTab('all');
                  }}
                  className="text-amber-200 hover:text-amber-100 font-medium"
                >
                  {t('clearFilters')}
                </button>
              </div>
            )
          ) : (
            <>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">
                  {filteredShops.length}{' '}
                  {filteredShops.length === 1 ? t('shopsFoundOne') : t('shopsFoundMany')}
                </h2>
                <div className="text-sm text-gray-600">
                  {t('showing')}{' '}
                  {activeTab === 'all'
                    ? t('showingAll')
                    : tabOptions.find((tab) => tab.id === activeTab)?.label}
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredShops.map((shop) => (
                  <SuitShopCard key={shop.id} shop={shop} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
