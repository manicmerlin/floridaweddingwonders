import { DressShop } from '../../../types';
import { mockDressShops } from '../../../lib/dressShopData';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import PhotoGallery from '../../../components/PhotoGallery';

interface DressShopDetailPageProps {
  params: {
    id: string;
  };
}

export default function DressShopDetailPage({ params }: DressShopDetailPageProps) {
  const shop = mockDressShops.find(s => s.id === params.id);

  if (!shop) {
    notFound();
  }

  // Debug logging
  console.log('👗 Dress Shop Detail - shop found:', shop.name);
  console.log('📸 Images available:', shop.images?.length || 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-gray-900">SoFlo Venues</Link>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-700 hover:text-gray-900 font-medium">Home</Link>
              <Link href="/venues" className="text-gray-700 hover:text-gray-900 font-medium">Venues</Link>
              <Link href="/dress-shops" className="text-gray-700 hover:text-gray-900 font-medium">Dress Shops</Link>
              <Link href="/admin" className="text-gray-700 hover:text-gray-900 font-medium">Admin</Link>
              <button className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-md font-medium transition">
                List Your Business
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Image Gallery */}
      <div className="relative h-96 bg-gray-900">
        <div className="absolute inset-0">
          <img
            src={shop.images?.[0]?.url || `https://images.unsplash.com/photo-1595341888016-a392ef81b7de?w=1200&h=600&fit=crop&q=80`}
            alt={shop.name}
            className="w-full h-full object-cover opacity-80"
          />
        </div>
        <div className="absolute inset-0 bg-black bg-opacity-40" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <div className="text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{shop.name}</h1>
            <p className="text-xl mb-4">{shop.address.city}, {shop.address.state}</p>
            <div className="flex items-center space-x-4">
              <span className="bg-pink-600 px-3 py-1 rounded-full text-sm font-medium">
                {shop.shopType.charAt(0).toUpperCase() + shop.shopType.slice(1)}
              </span>
              <span className="text-lg font-semibold">
                ${shop.priceRange.min.toLocaleString()} - ${shop.priceRange.max.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Left Column - Main Details */}
          <div className="lg:col-span-2">
            {/* Description */}
            <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Shop</h2>
              <p className="text-gray-700 text-lg leading-relaxed">
                {shop.description}
              </p>
            </div>

            {/* Price Range & Shop Type */}
            <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Price Range & Style</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Price Range</h3>
                  <p className="text-3xl font-bold text-pink-600">
                    ${shop.priceRange.min.toLocaleString()} - ${shop.priceRange.max.toLocaleString()}
                  </p>
                  <p className="text-gray-600">for wedding dresses</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Shop Type</h3>
                  <p className="text-3xl font-bold text-pink-600 capitalize">
                    {shop.shopType}
                  </p>
                  <p className="text-gray-600">specialized boutique</p>
                </div>
              </div>
            </div>

            {/* Specialties & Services */}
            <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Specialties & Services</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Specialties</h3>
                  <div className="space-y-2">
                    {shop.specialties.map((specialty, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-pink-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-gray-700">{specialty}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Services</h3>
                  <div className="space-y-2">
                    {shop.services.map((service, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-pink-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-gray-700">{service}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Designer Brands */}
            <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Designer Brands</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {shop.brands.map((brand, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 text-center">
                    <span className="font-medium text-gray-900">{brand}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Photo Gallery */}
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Photo Gallery</h2>
              <PhotoGallery 
                images={(shop.images || []).map(img => ({
                  ...img,
                  isPrimary: img.isPrimary ?? false
                }))} 
                venueName={shop.name} 
              />
            </div>
          </div>

          {/* Right Column - Contact & Actions */}
          <div className="lg:col-span-1">
            {/* Contact Card */}
            <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Shop</h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  <span className="text-gray-700">{shop.contact.email}</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  <span className="text-gray-700">{shop.contact.phone}</span>
                </div>

                {shop.contact.website && (
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.559-.499-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.559.499.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.497-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.148.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd" />
                    </svg>
                    <a href={shop.contact.website} className="text-pink-600 hover:text-pink-700" target="_blank" rel="noopener noreferrer">
                      Visit Website
                    </a>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <button className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-6 rounded-lg transition">
                  Schedule Appointment
                </button>
                <button className="w-full border-2 border-pink-600 text-pink-600 hover:bg-pink-50 font-bold py-3 px-6 rounded-lg transition">
                  Check Availability
                </button>
                <button className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-3 px-6 rounded-lg transition">
                  Save to Favorites
                </button>
              </div>
            </div>

            {/* Hours */}
            <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Hours</h2>
              <div className="space-y-2">
                {Object.entries(shop.hours).map(([day, hours]) => (
                  <div key={day} className="flex justify-between items-center">
                    <span className="font-medium text-gray-900 capitalize">{day}</span>
                    <span className="text-gray-600">{hours}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Business Owner Actions */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg shadow-sm p-8 text-white">
              <h3 className="text-xl font-bold mb-3">Own this shop?</h3>
              <p className="text-purple-100 mb-6">
                Claim your listing to manage photos, update information, and respond to inquiries directly.
              </p>
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <Link 
                  href={`/dress-shops/${params.id}/manage`}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition text-center"
                >
                  📊 Manage Listing
                </Link>
                <Link 
                  href={`/dress-shops/${params.id}/claim`}
                  className="flex-1 bg-white text-purple-600 font-bold py-3 px-6 rounded-lg hover:bg-gray-100 transition text-center"
                >
                  🏢 Claim This Listing
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
