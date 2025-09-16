'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navigation from '../../../components/Navigation';
import Footer from '../../../components/Footer';
import { mockDressShops } from '../../../lib/dressShopData';

interface DressShopDetailPageProps {
  params: {
    id: string;
  };
}

export default function DressShopDetailPage({ params }: DressShopDetailPageProps) {
  const [activeTab, setActiveTab] = useState('overview');
  
  const dressShop = mockDressShops.find(shop => shop.id === params.id);
  
  if (!dressShop) {
    notFound();
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'services', label: 'Services' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'contact', label: 'Contact' }
  ];

  const relatedShops = mockDressShops
    .filter(shop => shop.shopType === dressShop.shopType && shop.id !== dressShop.id)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative h-96 bg-gradient-to-br from-rose-400 via-pink-500 to-purple-600">
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">{dressShop.name}</h1>
            <p className="text-xl md:text-2xl mb-2">📍 {dressShop.address.city}, {dressShop.address.state}</p>
            <p className="text-lg opacity-90">{dressShop.shopType}</p>
          </div>
        </div>
      </section>

      {/* Quick Info Bar */}
      <section className="bg-white py-6 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-pink-600">{dressShop.shopType}</div>
              <div className="text-gray-600">Shop Type</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-pink-600">${dressShop.priceRange.min}-{dressShop.priceRange.max}</div>
              <div className="text-gray-600">Price Range</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-pink-600">{dressShop.address.city}</div>
              <div className="text-gray-600">Location</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-pink-600">{dressShop.brands.length}</div>
              <div className="text-gray-600">Brands</div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs Navigation */}
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
                      ? 'border-pink-500 text-pink-600'
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
                <h2 className="text-3xl font-bold text-gray-900 mb-6">About {dressShop.name}</h2>
                <p className="text-gray-600 text-lg leading-relaxed mb-8">
                  {dressShop.description}
                </p>

                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Shop Details</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <span className="font-medium text-gray-900">Shop Type:</span>
                      <span className="ml-2 text-gray-600">{dressShop.shopType}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">Location:</span>
                      <span className="ml-2 text-gray-600">{dressShop.address.city}, {dressShop.address.state}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">Price Range:</span>
                      <span className="ml-2 text-gray-600">${dressShop.priceRange.min}-${dressShop.priceRange.max}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">Brands:</span>
                      <span className="ml-2 text-gray-600">{dressShop.brands.length} brands</span>
                    </div>
                  </div>
                </div>

                {dressShop.brands && dressShop.brands.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Featured Brands</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      {dressShop.brands.slice(0, 6).map((brand, index) => (
                        <div key={index} className="bg-pink-50 rounded-lg p-4 text-center">
                          <span className="text-pink-600 font-medium">{brand}</span>
                        </div>
                      ))}
                    </div>
                    {dressShop.brands.length > 6 && (
                      <p className="text-gray-600 text-sm mt-4">
                        + {dressShop.brands.length - 6} more brands available
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Contact {dressShop.name}</h3>
                  
                  <div className="space-y-4 mb-6">
                    <div>
                      <span className="text-gray-600">📧 Email:</span>
                      <a href={`mailto:${dressShop.contact.email}`} className="block text-pink-600 hover:text-pink-700">
                        {dressShop.contact.email}
                      </a>
                    </div>
                    <div>
                      <span className="text-gray-600">📞 Phone:</span>
                      <a href={`tel:${dressShop.contact.phone}`} className="block text-pink-600 hover:text-pink-700">
                        {dressShop.contact.phone}
                      </a>
                    </div>
                    <div>
                      <span className="text-gray-600">📍 Address:</span>
                      <p className="text-gray-700">
                        {dressShop.address.street}<br />
                        {dressShop.address.city}, {dressShop.address.state} {dressShop.address.zipCode}
                      </p>
                    </div>
                    {dressShop.contact.website && (
                      <div>
                        <span className="text-gray-600">🌐 Website:</span>
                        <a href={dressShop.contact.website} target="_blank" rel="noopener noreferrer" className="block text-pink-600 hover:text-pink-700">
                          Visit Website
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <a
                      href={`mailto:${dressShop.contact.email}?subject=Appointment Inquiry for ${dressShop.name}`}
                      className="w-full bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-semibold text-center block transition"
                    >
                      Book Appointment
                    </a>
                    <a
                      href={`tel:${dressShop.contact.phone}`}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 px-6 py-3 rounded-lg font-semibold text-center block transition"
                    >
                      Call Now
                    </a>
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
                    <p className="text-gray-700">{dressShop.shopType}</p>
                    <p className="text-gray-700 text-sm mt-1">
                      Specializing in {dressShop.shopType.toLowerCase()} for brides-to-be
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Pricing Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">Price Range: ${dressShop.priceRange.min}-${dressShop.priceRange.max}</p>
                    <p className="text-gray-700 text-sm mt-1">
                      Visit our boutique for personalized styling and pricing
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Featured Brands</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid md:grid-cols-2 gap-3">
                      {dressShop.brands.map((brand, index) => (
                        <div key={index} className="flex items-center">
                          <span className="text-pink-500 mr-3">👗</span>
                          <span className="text-gray-700">{brand}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'gallery' && (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Gallery & Showcase</h2>
              
              <div className="space-y-8">
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <div className="text-6xl mb-4">👗</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Gallery Coming Soon</h3>
                  <p className="text-gray-600">
                    Visit {dressShop.name} in person to see our beautiful collection of wedding dresses.
                  </p>
                  <div className="mt-6">
                    <a
                      href={`mailto:${dressShop.contact.email}?subject=Appointment Request`}
                      className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                    >
                      Schedule Visit
                    </a>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Our Collection</h3>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    {dressShop.description}
                  </p>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    {dressShop.brands.slice(0, 6).map((brand, index) => (
                      <div key={index} className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg p-4 text-center">
                        <div className="text-2xl mb-2">👗</div>
                        <span className="text-pink-700 font-medium text-sm">{brand}</span>
                      </div>
                    ))}
                  </div>
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
                      <span className="text-pink-600 text-xl mr-4">📧</span>
                      <div>
                        <h4 className="font-medium text-gray-900">Email</h4>
                        <a href={`mailto:${dressShop.contact.email}`} className="text-pink-600 hover:text-pink-700">
                          {dressShop.contact.email}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <span className="text-pink-600 text-xl mr-4">📞</span>
                      <div>
                        <h4 className="font-medium text-gray-900">Phone</h4>
                        <a href={`tel:${dressShop.contact.phone}`} className="text-pink-600 hover:text-pink-700">
                          {dressShop.contact.phone}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <span className="text-pink-600 text-xl mr-4">📍</span>
                      <div>
                        <h4 className="font-medium text-gray-900">Address</h4>
                        <p className="text-gray-600">
                          {dressShop.address.street}<br />
                          {dressShop.address.city}, {dressShop.address.state} {dressShop.address.zipCode}
                        </p>
                      </div>
                    </div>

                    {dressShop.contact.website && (
                      <div className="flex items-start">
                        <span className="text-pink-600 text-xl mr-4">🌐</span>
                        <div>
                          <h4 className="font-medium text-gray-900">Website</h4>
                          <a href={dressShop.contact.website} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:text-pink-700">
                            Visit Website
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Schedule Appointment</h3>
                  
                  <form className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Your Name
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          placeholder="Your full name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          placeholder="your@email.com"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Wedding Date
                      </label>
                      <input
                        type="date"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dress Style Preference
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="A-line, ballgown, mermaid, etc."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Budget Range
                      </label>
                      <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent">
                        <option value="">Select budget range</option>
                        <option value="under-1000">Under $1,000</option>
                        <option value="1000-2500">$1,000 - $2,500</option>
                        <option value="2500-5000">$2,500 - $5,000</option>
                        <option value="5000-plus">$5,000+</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Message
                      </label>
                      <textarea
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="Tell us about your dream dress..."
                      ></textarea>
                    </div>
                    
                    <button
                      type="submit"
                      className="w-full bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                    >
                      Schedule Appointment
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Related Shops */}
      {relatedShops.length > 0 && (
        <section className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              More {dressShop.shopType} Shops
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              {relatedShops.map((relatedShop) => (
                <Link key={relatedShop.id} href={`/dress-shops/${relatedShop.id}`} className="block group">
                  <div className="bg-gray-50 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow p-6">
                    <div className="text-center mb-4">
                      <div className="text-4xl mb-2">👗</div>
                    </div>
                    
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{relatedShop.name}</h3>
                      <p className="text-gray-600 text-sm mb-2">📍 {relatedShop.address.city}, {relatedShop.address.state}</p>
                      <p className="text-pink-600 font-medium">${relatedShop.priceRange.min}-${relatedShop.priceRange.max}</p>
                      <p className="text-gray-500 text-sm mt-1">{relatedShop.brands.length} brands</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            
            <div className="text-center mt-8">
              <Link
                href="/dress-shops"
                className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-3 rounded-lg font-semibold transition"
              >
                Browse All Dress Shops
              </Link>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
