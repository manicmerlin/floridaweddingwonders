'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { placeholderUrlForSuitShop } from '@/lib/placeholderImages';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import VerifiedChip from '@/components/VerifiedChip';
import ListingRatingStrip from '@/components/ListingRatingStrip';
import ListingReviewsStub from '@/components/ListingReviewsStub';
import { isListingComplete } from '@/lib/listingCompleteness';
import { SuitShop } from '@/types';

interface Props {
  suitShop: SuitShop;
  relatedShops: SuitShop[];
}

const HUMAN_SHOP_TYPE: Record<SuitShop['shopType'], string> = {
  'bespoke-tailor': 'Bespoke Tailor',
  'tuxedo-rental': 'Tuxedo Rental',
  'suit-boutique': 'Suit Boutique',
  'made-to-measure': 'Made-to-Measure',
  formalwear: 'Formalwear',
};

export default function SuitShopDetailClient({ suitShop, relatedShops }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'gallery' | 'contact'>('overview');

  const tabs: Array<{ id: typeof activeTab; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'services', label: 'Services' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'contact', label: 'Contact' },
  ];

  const humanType = HUMAN_SHOP_TYPE[suitShop.shopType] ?? suitShop.shopType;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Hero Section — palette swap from the rose/pink dress-shop hero to
          a slate/stone gradient that reads as masculine without going
          full black-tie cliché. */}
      <section className="relative h-96 bg-gradient-to-br from-slate-700 via-stone-700 to-slate-900">
        <div className="absolute inset-0 bg-black bg-opacity-30" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="mb-3 flex justify-center">
              <VerifiedChip
                verified={isListingComplete({
                  hasContact: !!(suitShop.contact.phone || suitShop.contact.email || suitShop.contact.website),
                  description: suitShop.description,
                  imagesCount: suitShop.images?.length ?? 0,
                })}
                updatedAt={suitShop.updatedAt}
              />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">{suitShop.name}</h1>
            <p className="text-xl md:text-2xl mb-2">📍 {suitShop.address.city}, {suitShop.address.state}</p>
            <p className="text-lg opacity-90 mb-3">{humanType}</p>
            <div className="flex justify-center">
              <span className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5">
                <ListingRatingStrip
                  rating={null}
                  count={0}
                  slug={suitShop.slug || suitShop.id}
                  kind="suit-shops"
                  className="!text-white"
                />
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Info Bar */}
      <section className="bg-white py-6 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-slate-800">{humanType}</div>
              <div className="text-gray-600">Shop Type</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">
                {suitShop.priceRange.min > 0 || suitShop.priceRange.max > 0
                  ? `$${suitShop.priceRange.min}-${suitShop.priceRange.max}`
                  : '—'}
              </div>
              <div className="text-gray-600">Price Range</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{suitShop.address.city}</div>
              <div className="text-gray-600">Location</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{suitShop.brands.length}</div>
              <div className="text-gray-600">Brands</div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                    activeTab === tab.id
                      ? 'border-amber-500 text-slate-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </section>

      {/* Tab Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {activeTab === 'overview' && (
            <div className="grid lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">About {suitShop.name}</h2>
                <p className="text-gray-600 text-lg leading-relaxed mb-8">{suitShop.description}</p>

                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Shop Details</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <span className="font-medium text-gray-900">Shop Type:</span>
                      <span className="ml-2 text-gray-600">{humanType}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">Location:</span>
                      <span className="ml-2 text-gray-600">{suitShop.address.city}, {suitShop.address.state}</span>
                    </div>
                    {(suitShop.priceRange.min > 0 || suitShop.priceRange.max > 0) && (
                      <div>
                        <span className="font-medium text-gray-900">Price Range:</span>
                        <span className="ml-2 text-gray-600">${suitShop.priceRange.min}-${suitShop.priceRange.max}</span>
                      </div>
                    )}
                    {suitShop.brands.length > 0 && (
                      <div>
                        <span className="font-medium text-gray-900">Brands:</span>
                        <span className="ml-2 text-gray-600">{suitShop.brands.length} brands</span>
                      </div>
                    )}
                  </div>
                </div>

                {suitShop.brands && suitShop.brands.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Featured Brands</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      {suitShop.brands.slice(0, 6).map((brand, i) => (
                        <div key={i} className="bg-slate-50 rounded-lg p-4 text-center">
                          <span className="text-slate-800 font-medium">{brand}</span>
                        </div>
                      ))}
                    </div>
                    {suitShop.brands.length > 6 && (
                      <p className="text-gray-600 text-sm mt-4">+ {suitShop.brands.length - 6} more brands</p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Contact {suitShop.name}</h3>

                  <div className="space-y-4 mb-6">
                    <div>
                      <span className="text-gray-600">📧 Email:</span>
                      <a href={`mailto:${suitShop.contact.email}`} className="block text-slate-800 hover:text-slate-900">
                        {suitShop.contact.email}
                      </a>
                    </div>
                    {suitShop.contact.phone && (
                      <div>
                        <span className="text-gray-600">📞 Phone:</span>
                        <a href={`tel:${suitShop.contact.phone}`} className="block text-slate-800 hover:text-slate-900">
                          {suitShop.contact.phone}
                        </a>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-600">📍 Address:</span>
                      <p className="text-gray-700">
                        {suitShop.address.street && (<>{suitShop.address.street}<br /></>)}
                        {suitShop.address.city}, {suitShop.address.state} {suitShop.address.zipCode}
                      </p>
                    </div>
                    {suitShop.contact.website && (
                      <div>
                        <span className="text-gray-600">🌐 Website:</span>
                        <a href={suitShop.contact.website} target="_blank" rel="noopener noreferrer" className="block text-slate-800 hover:text-slate-900">
                          Visit Website
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <a
                      href={`mailto:${suitShop.contact.email}?subject=Appointment Inquiry for ${suitShop.name}`}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-lg font-semibold text-center block transition"
                    >
                      Book Fitting
                    </a>
                    {suitShop.contact.phone && (
                      <a
                        href={`tel:${suitShop.contact.phone}`}
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 px-6 py-3 rounded-lg font-semibold text-center block transition"
                      >
                        Call Now
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'services' && (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Services & Offerings</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Shop Specialization</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{humanType}</p>
                  </div>
                </div>

                {(suitShop.priceRange.min > 0 || suitShop.priceRange.max > 0) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Pricing Information</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700">Price Range: ${suitShop.priceRange.min}-${suitShop.priceRange.max}</p>
                      <p className="text-gray-700 text-sm mt-1">Visit in-store for accurate quotes after a fitting.</p>
                    </div>
                  </div>
                )}

                {suitShop.specialties.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Specialties</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex flex-wrap gap-2">
                        {suitShop.specialties.map((s, i) => (
                          <span key={i} className="bg-white px-3 py-1 rounded-full text-sm border">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {suitShop.brands.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Featured Brands</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid md:grid-cols-2 gap-3">
                        {suitShop.brands.map((brand, i) => (
                          <div key={i} className="flex items-center">
                            <span className="text-amber-600 mr-3">🤵</span>
                            <span className="text-gray-700">{brand}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'gallery' && (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Gallery</h2>
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <div className="text-6xl mb-4">🤵</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Visit in person</h3>
                <p className="text-gray-600">
                  See {suitShop.name}&apos;s full collection in store.
                </p>
                <div className="mt-6">
                  <a
                    href={`mailto:${suitShop.contact.email}?subject=Fitting Request`}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-lg font-semibold transition"
                  >
                    Schedule Fitting
                  </a>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Get In Touch</h2>
              <div className="grid lg:grid-cols-2 gap-12">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Contact Information</h3>
                  <div className="space-y-6">
                    <div className="flex items-start">
                      <span className="text-slate-700 text-xl mr-4">📧</span>
                      <div>
                        <h4 className="font-medium text-gray-900">Email</h4>
                        <a href={`mailto:${suitShop.contact.email}`} className="text-slate-800 hover:text-slate-900">
                          {suitShop.contact.email}
                        </a>
                      </div>
                    </div>
                    {suitShop.contact.phone && (
                      <div className="flex items-start">
                        <span className="text-slate-700 text-xl mr-4">📞</span>
                        <div>
                          <h4 className="font-medium text-gray-900">Phone</h4>
                          <a href={`tel:${suitShop.contact.phone}`} className="text-slate-800 hover:text-slate-900">
                            {suitShop.contact.phone}
                          </a>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start">
                      <span className="text-slate-700 text-xl mr-4">📍</span>
                      <div>
                        <h4 className="font-medium text-gray-900">Address</h4>
                        <p className="text-gray-600">
                          {suitShop.address.street && (<>{suitShop.address.street}<br /></>)}
                          {suitShop.address.city}, {suitShop.address.state} {suitShop.address.zipCode}
                        </p>
                      </div>
                    </div>
                    {suitShop.contact.website && (
                      <div className="flex items-start">
                        <span className="text-slate-700 text-xl mr-4">🌐</span>
                        <div>
                          <h4 className="font-medium text-gray-900">Website</h4>
                          <a href={suitShop.contact.website} target="_blank" rel="noopener noreferrer" className="text-slate-800 hover:text-slate-900">
                            Visit Website
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Schedule a Fitting</h3>
                  <a
                    href={`mailto:${suitShop.contact.email}?subject=Fitting Request - ${suitShop.name}`}
                    className="block w-full bg-slate-900 hover:bg-slate-800 text-white px-6 py-4 rounded-lg font-semibold text-center transition"
                  >
                    Email {suitShop.name}
                  </a>
                  <p className="text-sm text-gray-500 mt-3 text-center">
                    Most {humanType.toLowerCase()} shops require an appointment for full service. We&apos;ll forward your inquiry directly.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Reviews stub */}
      <div className="bg-gray-50 px-4 sm:px-6 lg:px-8 py-12">
        <ListingReviewsStub kind="suit-shop" name={suitShop.name} />
      </div>

      {/* Related Shops */}
      {relatedShops.length > 0 && (
        <section className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">More {humanType} Shops</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {relatedShops.map((rs) => (
                <Link key={rs.id} href={`/suit-shops/${rs.slug || rs.id}`} className="block group">
                  <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
                    {rs.slug ? (
                      <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
                        <Image
                          src={placeholderUrlForSuitShop(rs.slug)}
                          alt={`${rs.name} — watercolor illustration`}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          quality={85}
                        />
                      </div>
                    ) : (
                      <div className="h-48 bg-gradient-to-br from-slate-700 to-stone-700 flex items-center justify-center text-5xl">
                        🤵
                      </div>
                    )}
                    <div className="p-5 text-center">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{rs.name}</h3>
                      <p className="text-gray-600 text-sm mb-2">📍 {rs.address.city}, {rs.address.state}</p>
                      {(rs.priceRange.min > 0 || rs.priceRange.max > 0) && (
                        <p className="text-slate-800 font-medium">
                          ${rs.priceRange.min.toLocaleString()}-${rs.priceRange.max.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link
                href="/suit-shops"
                className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-lg font-semibold transition"
              >
                Browse All Suit Shops
              </Link>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
