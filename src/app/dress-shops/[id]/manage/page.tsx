'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { mockDressShops } from '../../../../lib/dressShopData';
import Link from 'next/link';

export default function ManageDressShopPage() {
  const params = useParams();
  const shopId = params.id as string;
  const shop = mockDressShops.find(s => s.id === shopId);
  
  const [formData, setFormData] = useState({
    name: shop?.name || '',
    description: shop?.description || '',
    phone: shop?.contact.phone || '',
    email: shop?.contact.email || '',
    website: shop?.contact.website || '',
    street: shop?.address.street || '',
    city: shop?.address.city || '',
    zipCode: shop?.address.zipCode || '',
    minPrice: shop?.priceRange.min || 0,
    maxPrice: shop?.priceRange.max || 0,
    specialties: shop?.specialties.join(', ') || '',
    services: shop?.services.join(', ') || '',
    brands: shop?.brands.join(', ') || '',
  });

  const [activeTab, setActiveTab] = useState('basic');
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would update the shop data on the server
    console.log('Shop data updated:', formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'minPrice' || name === 'maxPrice' ? parseInt(value) || 0 : value
    }));
  };

  if (!shop) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Dress Shop Not Found</h1>
          <Link href="/dress-shops" className="text-pink-600 hover:text-pink-700">
            ← Back to Dress Shops
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-gray-900">SoFlo Venues</Link>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-700 hover:text-gray-900 font-medium">Home</Link>
              <Link href="/venues" className="text-gray-700 hover:text-gray-900 font-medium">Venues</Link>
              <Link href="/dress-shops" className="text-gray-700 hover:text-gray-900 font-medium">Dress Shops</Link>
              <Link href={`/dress-shops/${shopId}`} className="text-pink-600 font-medium">View Listing</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-pink-600 to-purple-600 px-8 py-6 text-white">
            <h1 className="text-3xl font-bold">Manage Your Listing</h1>
            <p className="text-pink-100 mt-2">{shop.name}</p>
            {isSaved && (
              <div className="mt-4 bg-green-500 text-white px-4 py-2 rounded-lg inline-block">
                ✅ Changes saved successfully!
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-8" aria-label="Tabs">
              {[
                { id: 'basic', name: 'Basic Info' },
                { id: 'pricing', name: 'Pricing' },
                { id: 'services', name: 'Services & Brands' },
                { id: 'hours', name: 'Hours' },
                { id: 'photos', name: 'Photos' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-pink-500 text-pink-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="p-8">
              {/* Basic Info Tab */}
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">Basic Information</h2>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Shop Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={4}
                      required
                      value={formData.description}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    ></textarea>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                        Website
                      </label>
                      <input
                        type="url"
                        id="website"
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                      <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-2">
                        Street Address
                      </label>
                      <input
                        type="text"
                        id="street"
                        name="street"
                        value={formData.street}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-2">
                        ZIP Code
                      </label>
                      <input
                        type="text"
                        id="zipCode"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Pricing Tab */}
              {activeTab === 'pricing' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">Pricing Information</h2>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="minPrice" className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Price ($)
                      </label>
                      <input
                        type="number"
                        id="minPrice"
                        name="minPrice"
                        value={formData.minPrice}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum Price ($)
                      </label>
                      <input
                        type="number"
                        id="maxPrice"
                        name="maxPrice"
                        value={formData.maxPrice}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">💡 Pricing Tips</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Include your typical dress price range</li>
                      <li>• Consider alterations in your pricing</li>
                      <li>• Update prices seasonally if needed</li>
                      <li>• Be transparent about additional fees</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Services & Brands Tab */}
              {activeTab === 'services' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">Services & Brands</h2>
                  
                  <div>
                    <label htmlFor="specialties" className="block text-sm font-medium text-gray-700 mb-2">
                      Specialties (comma separated)
                    </label>
                    <input
                      type="text"
                      id="specialties"
                      name="specialties"
                      value={formData.specialties}
                      onChange={handleChange}
                      placeholder="Designer Gowns, Plus Size, Custom Alterations"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="services" className="block text-sm font-medium text-gray-700 mb-2">
                      Services Offered (comma separated)
                    </label>
                    <input
                      type="text"
                      id="services"
                      name="services"
                      value={formData.services}
                      onChange={handleChange}
                      placeholder="Alterations, Personal Styling, Accessories"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="brands" className="block text-sm font-medium text-gray-700 mb-2">
                      Designer Brands (comma separated)
                    </label>
                    <input
                      type="text"
                      id="brands"
                      name="brands"
                      value={formData.brands}
                      onChange={handleChange}
                      placeholder="Vera Wang, Maggie Sottero, Allure Bridals"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                </div>
              )}

              {/* Hours Tab */}
              {activeTab === 'hours' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">Business Hours</h2>
                  
                  <div className="space-y-4">
                    {Object.entries(shop.hours).map(([day, hours]) => (
                      <div key={day} className="flex items-center space-x-4">
                        <div className="w-24 font-medium text-gray-900 capitalize">
                          {day}
                        </div>
                        <input
                          type="text"
                          defaultValue={hours}
                          placeholder="9am-6pm or Closed"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Photos Tab */}
              {activeTab === 'photos' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">Photo Gallery</h2>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <div className="text-gray-400 text-4xl mb-4">📷</div>
                    <p className="text-gray-600 mb-4">Upload photos of your shop, dresses, and events</p>
                    <button
                      type="button"
                      className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-medium transition"
                    >
                      Upload Photos
                    </button>
                  </div>

                  <div className="bg-yellow-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-yellow-900 mb-2">📸 Photo Guidelines</h3>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      <li>• High-resolution images (1200px+ width)</li>
                      <li>• Show your best dresses and shop interior</li>
                      <li>• Include photos of happy brides (with permission)</li>
                      <li>• Keep photos professional and well-lit</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-8 py-6 flex flex-col sm:flex-row gap-4">
              <button
                type="submit"
                className="flex-1 bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-6 rounded-lg transition"
              >
                Save Changes
              </button>
              <Link
                href={`/dress-shops/${shopId}`}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg text-center transition"
              >
                View Public Listing
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
