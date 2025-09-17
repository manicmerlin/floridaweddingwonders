'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Navigation from '../../../components/Navigation';
import Footer from '../../../components/Footer';
import { mockVenues } from '../../../lib/mockData';
import { Venue } from '../../../types';

export default function VenueDetailPage() {
  const params = useParams();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('description');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);

  useEffect(() => {
    if (params.id) {
      // Find venue by ID
      const foundVenue = mockVenues.find(v => v.id === params.id);
      setVenue(foundVenue || null);
      setLoading(false);
      
      // If venue has videos, prioritize the first video for main display
      if (foundVenue?.images) {
        const videoIndex = foundVenue.images.findIndex(media => media.type === 'video');
        if (videoIndex !== -1) {
          setSelectedMediaIndex(videoIndex);
        }
      }
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading venue details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center">
            <div className="text-gray-400 text-6xl mb-4">🏛️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Venue Not Found</h1>
            <p className="text-gray-600 mb-6">The venue you're looking for doesn't exist.</p>
            <Link
              href="/venues"
              className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-medium transition"
            >
              Browse All Venues
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const tabs = [
    { id: 'description', label: 'Description' },
    { id: 'amenities', label: 'Amenities' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'faq', label: 'FAQ' }
  ];

  const handleBookTour = () => {
    if (selectedDate && selectedTime) {
      alert(`Tour booked for ${selectedDate} at ${selectedTime}. We'll contact you to confirm!`);
    } else {
      alert('Please select both date and time for your tour.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Hero Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Main Image/Video */}
          <div className="col-span-2 overflow-hidden rounded-xl shadow-lg">
            {venue.images && venue.images.length > 0 ? (
              venue.images[selectedMediaIndex]?.type === 'video' ? (
                <video
                  src={venue.images[selectedMediaIndex].url}
                  controls
                  className="w-full h-96 object-cover"
                  poster={venue.images.find(img => img.type === 'image')?.url}
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <Image
                  src={venue.images[selectedMediaIndex]?.url || venue.images[0].url}
                  alt={venue.images[selectedMediaIndex]?.alt || venue.images[0].alt}
                  width={800}
                  height={400}
                  className="w-full h-96 object-cover cursor-pointer"
                />
              )
            ) : (
              <div className="w-full h-96 bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center">
                <span className="text-white text-6xl">🏛️</span>
              </div>
            )}
          </div>
          
          {/* Thumbnail Grid */}
          <div className="grid grid-cols-2 gap-2">
            {venue.images && venue.images.slice(0, 4).map((media, index) => (
              <div 
                key={index} 
                className={`overflow-hidden rounded-lg cursor-pointer border-2 transition-all ${
                  selectedMediaIndex === index ? 'border-pink-500' : 'border-transparent hover:border-pink-300'
                }`}
                onClick={() => setSelectedMediaIndex(index)}
              >
                {media.type === 'video' ? (
                  <div className="relative">
                    <video
                      src={media.url}
                      className="w-full h-24 object-cover"
                      muted
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                      <span className="text-white text-2xl">▶️</span>
                    </div>
                  </div>
                ) : (
                  <Image
                    src={media.url}
                    alt={media.alt}
                    width={200}
                    height={150}
                    className="w-full h-24 object-cover"
                  />
                )}
              </div>
            ))}
            {(!venue.images || venue.images.length < 4) && 
              Array.from({ length: 4 - (venue.images?.length || 0) }).map((_, index) => (
                <div key={`placeholder-${index}`} className="w-full h-24 bg-gradient-to-br from-pink-100 to-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🏛️</span>
                </div>
              ))
            }
            {venue.images && venue.images.length > 4 && (
              <div className="w-full h-24 bg-gray-200 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors">
                <span className="text-gray-600 text-sm">+{venue.images.length - 4} more</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Grid: Left side content + Right side contact */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Content - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Venue Info Header */}
            <div className="text-center lg:text-left space-y-2">
              <h1 className="text-3xl font-serif font-bold text-pink-600">
                {venue.name}
              </h1>
              <p className="text-gray-500">
                {venue.address.street ? `${venue.address.street}, ` : ''}{venue.address.city}, {venue.address.state} {venue.address.zipCode}
              </p>
              <p className="text-gray-700 leading-relaxed">
                {venue.description}
              </p>
              <p className="text-gray-700 leading-relaxed">
                This {venue.venueType} venue offers an unforgettable setting for your special day, 
                accommodating {venue.capacity.min} to {venue.capacity.max} guests with elegance and style.
              </p>
            </div>

            {/* Quick Facts */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-gray-100 p-6 rounded-xl shadow-md border border-gray-200">
              <div className="text-center">
                <p className="font-semibold text-gray-700">Capacity</p>
                <p className="text-pink-600 font-medium">{venue.capacity.min}-{venue.capacity.max}</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-700">Venue Type</p>
                <p className="text-pink-600 font-medium capitalize">{venue.venueType}</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-700">Lodging</p>
                <p className="text-pink-600 font-medium">Contact Venue</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-700">Indoor/Outdoor</p>
                <p className="text-pink-600 font-medium">Both</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-700">Pricing</p>
                <p className="text-pink-600 font-medium">${venue.pricing.startingPrice.toLocaleString()}+</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="w-full">
              {/* Tab Headers */}
              <div className="flex space-x-4 border-b border-gray-200 mb-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-3 px-4 font-medium text-sm transition-colors border-b-2 ${
                      activeTab === tab.id
                        ? 'border-pink-500 text-pink-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="bg-white p-6 rounded-xl shadow-sm">
                {activeTab === 'description' && (
                  <div className="space-y-4">
                    <p className="text-gray-700 leading-relaxed">
                      {venue.description}
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                      This {venue.venueType} venue offers an unforgettable setting for your special day, 
                      accommodating {venue.capacity.min} to {venue.capacity.max} guests with elegance and style.
                    </p>
                  </div>
                )}

                {activeTab === 'amenities' && (
                  <div className="space-y-4">
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {venue.amenities && venue.amenities.length > 0 ? (
                        venue.amenities.map((amenity, index) => (
                          <li key={index} className="flex items-center space-x-2">
                            <span className="text-green-500">✓</span>
                            <span className="text-gray-700">{amenity}</span>
                          </li>
                        ))
                      ) : (
                        <>
                          <li className="flex items-center space-x-2">
                            <span className="text-green-500">✓</span>
                            <span className="text-gray-700">Bridal Suite</span>
                          </li>
                          <li className="flex items-center space-x-2">
                            <span className="text-green-500">✓</span>
                            <span className="text-gray-700">On-site Catering</span>
                          </li>
                          <li className="flex items-center space-x-2">
                            <span className="text-green-500">✓</span>
                            <span className="text-gray-700">Parking Available</span>
                          </li>
                          <li className="flex items-center space-x-2">
                            <span className="text-green-500">✓</span>
                            <span className="text-gray-700">Tables & Chairs Included</span>
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="text-3xl font-bold text-pink-600">{venue.reviews.rating}</div>
                      <div className="flex text-yellow-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={i < Math.floor(venue.reviews.rating) ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                        ))}
                      </div>
                      <div className="text-gray-600">({venue.reviews.count} reviews)</div>
                    </div>
                    
                    <div className="space-y-4">
                      <blockquote className="italic text-gray-700 border-l-4 border-pink-500 pl-4">
                        "The gardens were breathtaking — it felt like a fairy tale wedding come to life."
                      </blockquote>
                      <blockquote className="italic text-gray-700 border-l-4 border-pink-500 pl-4">
                        "Staff made our wedding seamless and magical. Every detail was perfect."
                      </blockquote>
                      <blockquote className="italic text-gray-700 border-l-4 border-pink-500 pl-4">
                        "Absolutely stunning venue with incredible photo opportunities everywhere."
                      </blockquote>
                    </div>
                  </div>
                )}

                {activeTab === 'faq' && (
                  <div className="space-y-4">
                    <div className="border-b border-gray-200 pb-4">
                      <p className="font-semibold text-gray-800 mb-2">What's the rain plan?</p>
                      <p className="text-gray-700">Indoor space available with full backup options for weather concerns.</p>
                    </div>
                    <div className="border-b border-gray-200 pb-4">
                      <p className="font-semibold text-gray-800 mb-2">Is outside catering allowed?</p>
                      <p className="text-gray-700">We work with approved preferred vendors only to ensure quality and service standards.</p>
                    </div>
                    <div className="border-b border-gray-200 pb-4">
                      <p className="font-semibold text-gray-800 mb-2">What's included in the venue rental?</p>
                      <p className="text-gray-700">Tables, chairs, basic linens, and access to bridal preparation areas are included.</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 mb-2">How far in advance should we book?</p>
                      <p className="text-gray-700">We recommend booking 12-18 months in advance for peak wedding season.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Contact Card - 1/3 width */}
          <div className="lg:col-span-1">
            <div className="p-6 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl shadow-lg sticky top-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold mb-2">Contact Venue Manager</h2>
                  <p className="text-pink-100">Events Coordinator</p>
                  <p className="text-sm text-pink-100">{venue.contact.email}</p>
                  <p className="text-sm text-pink-100">{venue.contact.phone}</p>
                </div>
                
                <a
                  href={`mailto:${venue.contact.email}?subject=Wedding Inquiry for ${venue.name}`}
                  className="block w-full bg-white text-pink-600 text-center py-3 px-6 rounded-lg font-semibold hover:bg-gray-100 transition"
                >
                  Request Info
                </a>
                
                <div className="space-y-4">
                  <p className="font-semibold text-lg">Book a Tour</p>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-pink-100 mb-1">Select Date</label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full p-3 rounded-lg bg-white text-gray-700 border-0"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-pink-100 mb-1">Select Time</label>
                      <input
                        type="time"
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        className="w-full p-3 rounded-lg bg-white text-gray-700 border-0"
                      />
                    </div>
                    
                    <button
                      onClick={handleBookTour}
                      className="w-full bg-white text-purple-600 py-3 px-6 rounded-lg font-semibold hover:bg-gray-100 transition"
                    >
                      Confirm Appointment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Venues */}
        <div className="bg-white py-16 rounded-xl shadow-sm">
          <div className="px-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              More Venues near {venue.address.city}
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              {mockVenues
                .filter(v => v.address.city === venue.address.city && v.id !== venue.id)
                .slice(0, 3)
                .map((relatedVenue) => (
                  <Link key={relatedVenue.id} href={`/venues/${relatedVenue.id}`} className="block group">
                    <div className="bg-gray-50 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
                      {relatedVenue.images && relatedVenue.images.length > 0 ? (
                        <div className="aspect-w-16 aspect-h-10">
                          <Image
                            src={relatedVenue.images[0].url}
                            alt={relatedVenue.images[0].alt}
                            width={400}
                            height={250}
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-48 bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                          <span className="text-4xl">🏛️</span>
                        </div>
                      )}
                      
                      <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{relatedVenue.name}</h3>
                        <p className="text-gray-600 text-sm mb-2">📍 {relatedVenue.address.city}, {relatedVenue.address.state}</p>
                        <p className="text-pink-600 font-medium">${relatedVenue.pricing.startingPrice.toLocaleString()}+</p>
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
            
            <div className="text-center mt-8">
              <Link
                href="/venues"
                className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-3 rounded-lg font-semibold transition"
              >
                Browse All Venues
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}