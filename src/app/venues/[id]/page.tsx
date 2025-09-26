'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Navigation from '../../../components/Navigation';
import Footer from '../../../components/Footer';
import PhotoGallery from '../../../components/PhotoGallery';
import VenueClaimButton from '../../../components/VenueClaimButton';
import VenueContactForm from '../../../components/VenueContactForm';
import { mockVenues } from '../../../lib/mockData';
import { Venue } from '../../../types';

// Use mockVenues which already includes the JSON data to avoid duplicates
const allVenues = mockVenues;

export default function VenueDetailPage() {
  const params = useParams();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showContactForm, setShowContactForm] = useState(false);

  useEffect(() => {
    if (params.id) {
      console.log('Looking for venue with ID:', params.id);
      console.log('Available venues:', allVenues.map(v => ({ id: v.id, name: v.name })));
      
      // Find venue by ID or slug in combined venues list
      let foundVenue = allVenues.find(v => v.id === params.id);
      
      // If not found by exact ID, try to find by name-based slug
      if (!foundVenue) {
        foundVenue = allVenues.find(v => 
          v.name.toLowerCase().replace(/[^a-z0-9]/g, '-') === params.id ||
          v.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') === params.id
        );
      }
      
      // If still not found, try partial name matching
      if (!foundVenue && typeof params.id === 'string') {
        foundVenue = allVenues.find(v => 
          v.name.toLowerCase().includes(params.id.toString().replace(/-/g, ' ')) ||
          params.id.toString().replace(/-/g, ' ').includes(v.name.toLowerCase())
        );
      }
      
      console.log('Found venue:', foundVenue ? foundVenue.name : 'None');
      setVenue(foundVenue || null);
      setLoading(false);
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
    { id: 'overview', label: 'Overview' },
    { id: 'details', label: 'Details' },
    { id: 'contact', label: 'Contact' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Hero Gallery Section */}
      <section className="relative bg-white">
        {venue.images && venue.images.length > 0 ? (
          <PhotoGallery 
            images={venue.images.map((img, index) => ({
              id: img.id,
              url: img.url,
              alt: img.alt,
              isPrimary: img.isPrimary || index === 0
            }))} 
            venueName={venue.name} 
          />
        ) : (
          <div className="h-96 bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center">
            <div className="text-center text-white">
              <span className="text-6xl mb-4 block">🏛️</span>
              <h1 className="text-4xl md:text-6xl font-bold mb-4">{venue.name}</h1>
              <p className="text-xl md:text-2xl mb-2">📍 {venue.address.city}, {venue.address.state}</p>
              <p className="text-lg opacity-90">{venue.venueType}</p>
            </div>
          </div>
        )}
        
        {/* Venue Title Section - Below Gallery */}
        {venue.images && venue.images.length > 0 && (
          <div className="bg-white py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">{venue.name}</h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-2">📍 {venue.address.city}, {venue.address.state}</p>
              <p className="text-lg text-gray-500 capitalize">{venue.venueType}</p>
            </div>
          </div>
        )}
      </section>

      {/* Quick Info Bar */}
      <section className="bg-white py-6 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-pink-600">{venue.capacity.min}-{venue.capacity.max}</div>
              <div className="text-gray-600">Capacity</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-pink-600">${venue.pricing.startingPrice.toLocaleString()}+</div>
              <div className="text-gray-600">Starting Price</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-pink-600">{venue.address.city}</div>
              <div className="text-gray-600">Location</div>
            </div>
            <div>
              {venue.externalReviews?.google ? (
                <div className="cursor-pointer" onClick={() => window.open(venue.externalReviews?.google?.url, '_blank')}>
                  <div className="flex items-center justify-center mb-1">
                    <Image
                      src="https://upload.wikimedia.org/wikipedia/commons/3/39/Google_Maps_icon_%282015-2020%29.svg"
                      alt="Google Maps"
                      width={24}
                      height={24}
                      className="mr-2"
                    />
                    <div className="text-lg font-bold text-pink-600">
                      Google Reviews
                    </div>
                  </div>
                  <div className="text-gray-600 text-sm">
                    View Reviews
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-2xl font-bold text-gray-400">—</div>
                  <div className="text-gray-600">Reviews</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Actions */}
      <section className="bg-white py-8 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Interested in This Venue?</h2>
            <p className="text-gray-600 mb-6">Get personalized pricing and availability for your special day</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => setShowContactForm(true)}
                className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
              >
                💌 Request Information
              </button>
              <div className="flex items-center space-x-4">
                <a
                  href={`mailto:${venue.contact.email}?subject=Wedding Inquiry - ${venue.name}`}
                  className="text-pink-600 hover:text-pink-700 font-medium transition flex items-center"
                >
                  ✉️ {venue.contact.email}
                </a>
                <a
                  href={`tel:${venue.contact.phone}`}
                  className="text-pink-600 hover:text-pink-700 font-medium transition flex items-center"
                >
                  📞 {venue.contact.phone}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Venue Claim Button */}
      <section className="bg-gray-50 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <VenueClaimButton venue={venue} />
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
                <h2 className="text-3xl font-bold text-gray-900 mb-6">About {venue.name}</h2>
                <p className="text-gray-600 text-lg leading-relaxed mb-8">
                  {venue.description}
                </p>

                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Amenities & Services</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {venue.amenities && venue.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        <span className="text-gray-700">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Facts</h3>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium text-gray-900">Venue Type:</span>
                        <span className="ml-2 text-gray-600">{venue.venueType}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">City:</span>
                        <span className="ml-2 text-gray-600">{venue.address.city}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">Capacity:</span>
                        <span className="ml-2 text-gray-600">{venue.capacity.min}-{venue.capacity.max} guests</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">Starting Price:</span>
                        <span className="ml-2 text-gray-600">${venue.pricing.startingPrice.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Contact {venue.name}</h3>
                  
                  <div className="space-y-4 mb-6">
                    <div>
                      <span className="text-gray-600">📧 Email:</span>
                      <a href={`mailto:${venue.contact.email}`} className="block text-pink-600 hover:text-pink-700">
                        {venue.contact.email}
                      </a>
                    </div>
                    <div>
                      <span className="text-gray-600">📞 Phone:</span>
                      <a href={`tel:${venue.contact.phone}`} className="block text-pink-600 hover:text-pink-700">
                        {venue.contact.phone}
                      </a>
                    </div>
                    {venue.contact.website && (
                      <div>
                        <span className="text-gray-600">🌐 Website:</span>
                        <a href={venue.contact.website} target="_blank" rel="noopener noreferrer" className="block text-pink-600 hover:text-pink-700">
                          Visit Website
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <a
                      href={`mailto:${venue.contact.email}?subject=Wedding Inquiry for ${venue.name}`}
                      className="w-full bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-semibold text-center block transition"
                    >
                      Send Inquiry
                    </a>
                    <a
                      href={`tel:${venue.contact.phone}`}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 px-6 py-3 rounded-lg font-semibold text-center block transition"
                    >
                      Call Now
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="grid lg:grid-cols-2 gap-12">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Venue Details</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Address</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700">{venue.address.street}</p>
                      <p className="text-gray-700">{venue.address.city}, {venue.address.state} {venue.address.zipCode}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Capacity Details</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700">Guest Capacity: {venue.capacity.min}-{venue.capacity.max} guests</p>
                      <p className="text-gray-700 text-sm mt-1">
                        Perfect for {venue.capacity.max >= 150 ? 'large' : venue.capacity.max >= 100 ? 'medium' : 'intimate'} celebrations
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Pricing Information</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700">Starting Price: ${venue.pricing.startingPrice.toLocaleString()}</p>
                      <p className="text-gray-700 text-sm mt-1">
                        Contact venue for detailed pricing and package information
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Amenities & Services</h3>
                <div className="grid gap-3">
                  {venue.amenities && venue.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center bg-white rounded-lg p-3 shadow-sm">
                      <span className="text-green-500 mr-3">✓</span>
                      <span className="text-gray-700">{amenity}</span>
                    </div>
                  ))}
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
                        <a href={`mailto:${venue.contact.email}`} className="text-pink-600 hover:text-pink-700">
                          {venue.contact.email}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <span className="text-pink-600 text-xl mr-4">📞</span>
                      <div>
                        <h4 className="font-medium text-gray-900">Phone</h4>
                        <a href={`tel:${venue.contact.phone}`} className="text-pink-600 hover:text-pink-700">
                          {venue.contact.phone}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <span className="text-pink-600 text-xl mr-4">📍</span>
                      <div>
                        <h4 className="font-medium text-gray-900">Address</h4>
                        <p className="text-gray-600">
                          {venue.address.street}<br />
                          {venue.address.city}, {venue.address.state} {venue.address.zipCode}
                        </p>
                      </div>
                    </div>

                    {venue.contact.website && (
                      <div className="flex items-start">
                        <span className="text-pink-600 text-xl mr-4">🌐</span>
                        <div>
                          <h4 className="font-medium text-gray-900">Website</h4>
                          <a href={venue.contact.website} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:text-pink-700">
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
                        Message
                      </label>
                      <textarea
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="Tell us about your wedding plans..."
                      />
                    </div>
                    
                    <button
                      type="submit"
                      className="w-full bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                    >
                      Send Inquiry
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Related Venues */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            More Venues near {venue.address.city}
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {allVenues
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
      </section>

      <Footer />
      
      {/* Contact Form Modal */}
      {showContactForm && (
        <VenueContactForm 
          venue={venue} 
          onClose={() => setShowContactForm(false)} 
        />
      )}
    </div>
  );
}