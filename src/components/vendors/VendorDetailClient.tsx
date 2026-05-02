'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import vendorsData from '@/data/vendors.json';

interface VendorDetailPageProps {
  params: {
    id: string;
  };
}

export default function VendorDetailPage({ params }: VendorDetailPageProps) {
  const [activeTab, setActiveTab] = useState('overview');
  
  const vendor = vendorsData.weddingVendors.find(v => v.id === params.id);
  
  if (!vendor) {
    notFound();
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'services', label: 'Services' },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'contact', label: 'Contact' }
  ];

  const relatedVendors = vendorsData.weddingVendors
    .filter(v => v.category === vendor.category && v.id !== vendor.id)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative h-96 bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600">
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">{vendor.name}</h1>
            <p className="text-xl md:text-2xl mb-2">📍 {vendor.address.city}, {vendor.address.state}</p>
            <p className="text-lg opacity-90">{vendor.category}</p>
          </div>
        </div>
      </section>

      {/* Quick Info Bar */}
      <section className="bg-white py-6 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-pink-600">{vendor.category}</div>
              <div className="text-gray-600">Category</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-pink-600">{vendor.subcategory}</div>
              <div className="text-gray-600">Specialty</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-pink-600">{vendor.address.city}</div>
              <div className="text-gray-600">Location</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-pink-600">{vendor.address.serviceArea.length}</div>
              <div className="text-gray-600">Service Areas</div>
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
                <h2 className="text-3xl font-bold text-gray-900 mb-6">About {vendor.name}</h2>
                <p className="text-gray-600 text-lg leading-relaxed mb-8">
                  {vendor.description}
                </p>

                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Highlights</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <span className="font-medium text-gray-900">Category:</span>
                      <span className="ml-2 text-gray-600">{vendor.category}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">Specialty:</span>
                      <span className="ml-2 text-gray-600">{vendor.subcategory}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">Location:</span>
                      <span className="ml-2 text-gray-600">{vendor.address.city}, {vendor.address.state}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">Service Areas:</span>
                      <span className="ml-2 text-gray-600">{vendor.address.serviceArea.join(', ')}</span>
                    </div>
                  </div>
                </div>

                {vendor.address.serviceArea && vendor.address.serviceArea.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Service Areas</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {vendor.address.serviceArea.map((area, index) => (
                        <div key={index} className="flex items-center">
                          <span className="text-green-500 mr-2">📍</span>
                          <span className="text-gray-700">{area}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Contact {vendor.name}</h3>
                  
                  <div className="space-y-4 mb-6">
                    {vendor.contact.email && (
                      <div>
                        <span className="text-gray-600">📧 Email:</span>
                        <a href={`mailto:${vendor.contact.email}`} className="block text-pink-600 hover:text-pink-700">
                          {vendor.contact.email}
                        </a>
                      </div>
                    )}
                    {vendor.contact.phone && (
                      <div>
                        <span className="text-gray-600">📞 Phone:</span>
                        <a href={`tel:${vendor.contact.phone}`} className="block text-pink-600 hover:text-pink-700">
                          {vendor.contact.phone}
                        </a>
                      </div>
                    )}
                    {vendor.contact.website && (
                      <div>
                        <span className="text-gray-600">🌐 Website:</span>
                        <a href={vendor.contact.website} target="_blank" rel="noopener noreferrer" className="block text-pink-600 hover:text-pink-700">
                          Visit Website
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {vendor.contact.email && (
                      <a
                        href={`mailto:${vendor.contact.email}?subject=Wedding Inquiry for ${vendor.name}`}
                        className="w-full bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-semibold text-center block transition"
                      >
                        Send Inquiry
                      </a>
                    )}
                    {vendor.contact.phone && (
                      <a
                        href={`tel:${vendor.contact.phone}`}
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
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Services & Packages</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Service Category</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{vendor.category}</p>
                    <p className="text-gray-700 text-sm mt-1">
                      Specializing in professional {vendor.category.toLowerCase()} services for weddings
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Pricing Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">Category: {vendor.category} - {vendor.subcategory}</p>
                    <p className="text-gray-700 text-sm mt-1">
                      Contact for detailed pricing and package information
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'portfolio' && (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Portfolio & Work</h2>
              
              <div className="space-y-8">
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <div className="text-6xl mb-4">📷</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Portfolio Coming Soon</h3>
                  <p className="text-gray-600">
                    Contact {vendor.name} directly to view their portfolio and recent work samples.
                  </p>
                  <div className="mt-6">
                    {vendor.contact.email && (
                      <a
                        href={`mailto:${vendor.contact.email}?subject=Portfolio Request`}
                        className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                      >
                        Request Portfolio
                      </a>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">About Our Work</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {vendor.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm">
                      {vendor.category}
                    </span>
                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                      {vendor.subcategory}
                    </span>
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
                    {vendor.contact.email && (
                      <div className="flex items-start">
                        <span className="text-pink-600 text-xl mr-4">📧</span>
                        <div>
                          <h4 className="font-medium text-gray-900">Email</h4>
                          <a href={`mailto:${vendor.contact.email}`} className="text-pink-600 hover:text-pink-700">
                            {vendor.contact.email}
                          </a>
                        </div>
                      </div>
                    )}

                    {vendor.contact.phone && (
                      <div className="flex items-start">
                        <span className="text-pink-600 text-xl mr-4">📞</span>
                        <div>
                          <h4 className="font-medium text-gray-900">Phone</h4>
                          <a href={`tel:${vendor.contact.phone}`} className="text-pink-600 hover:text-pink-700">
                            {vendor.contact.phone}
                          </a>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start">
                      <span className="text-pink-600 text-xl mr-4">📍</span>
                      <div>
                        <h4 className="font-medium text-gray-900">Service Area</h4>
                        <p className="text-gray-600">{vendor.address.city}, {vendor.address.state}</p>
                      </div>
                    </div>

                    {vendor.contact.website && (
                      <div className="flex items-start">
                        <span className="text-pink-600 text-xl mr-4">🌐</span>
                        <div>
                          <h4 className="font-medium text-gray-900">Website</h4>
                          <a href={vendor.contact.website} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:text-pink-700">
                            Visit Website
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Send a Message</h3>
                  
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
                        Service Needed
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="What services are you looking for?"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Message
                      </label>
                      <textarea
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="Tell us about your wedding and what you're looking for..."
                      ></textarea>
                    </div>
                    
                    <button
                      type="submit"
                      className="w-full bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                    >
                      Send Message
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Related Vendors */}
      {relatedVendors.length > 0 && (
        <section className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              More {vendor.category} Vendors
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              {relatedVendors.map((relatedVendor) => (
                <Link key={relatedVendor.id} href={`/vendors/${relatedVendor.id}`} className="block group">
                  <div className="bg-gray-50 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow p-6">
                    <div className="text-center mb-4">
                      <div className="text-4xl mb-2">
                        {relatedVendor.category === 'Photography' && '📷'}
                        {relatedVendor.category === 'Catering' && '🍽️'}
                        {relatedVendor.category === 'Flowers' && '💐'}
                        {relatedVendor.category === 'Music' && '🎵'}
                        {relatedVendor.category === 'Planning' && '📋'}
                        {relatedVendor.category === 'Transportation' && '🚗'}
                        {!['Photography', 'Catering', 'Flowers', 'Music', 'Planning', 'Transportation'].includes(relatedVendor.category) && '💼'}
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{relatedVendor.name}</h3>
                      <p className="text-gray-600 text-sm mb-2">📍 {relatedVendor.address.city}, {relatedVendor.address.state}</p>
                      <p className="text-pink-600 font-medium">{relatedVendor.subcategory}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            
            <div className="text-center mt-8">
              <Link
                href="/vendors"
                className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-3 rounded-lg font-semibold transition"
              >
                Browse All Vendors
              </Link>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
