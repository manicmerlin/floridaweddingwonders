'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function VendorOwnerPage() {
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    category: '',
    subcategory: '',
    description: '',
    website: '',
    address: {
      street: '',
      city: '',
      state: 'FL',
      zipCode: ''
    },
    priceRange: {
      min: '',
      max: '',
      unit: 'event'
    },
    specialties: '',
    services: '',
    yearsInBusiness: '',
    teamSize: '',
    serviceArea: '',
    socialMedia: {
      instagram: '',
      facebook: '',
      website: ''
    },
    agreesToTerms: false
  });

  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Assume user is not premium for photo restrictions
  const isPremium = false;

  const vendorCategories = [
    { value: 'photographer', label: 'Photographer' },
    { value: 'videographer', label: 'Videographer' },
    { value: 'florist', label: 'Florist' },
    { value: 'caterer', label: 'Caterer' },
    { value: 'baker', label: 'Baker' },
    { value: 'dj', label: 'DJ' },
    { value: 'band', label: 'Band/Live Music' },
    { value: 'planner', label: 'Wedding Planner' },
    { value: 'decorator', label: 'Decorator' },
    { value: 'transportation', label: 'Transportation' },
    { value: 'officiant', label: 'Officiant' },
    { value: 'hair-makeup', label: 'Hair & Makeup' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'other', label: 'Other' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any),
          [child]: value
        }
      }));
    } else if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    alert('Thank you for your submission! We\'ll review your vendor listing and contact you within 2 business days.');
    setIsSubmitting(false);
    
    // Reset form
    setFormData({
      businessName: '',
      ownerName: '',
      email: '',
      phone: '',
      category: '',
      subcategory: '',
      description: '',
      website: '',
      address: {
        street: '',
        city: '',
        state: 'FL',
        zipCode: ''
      },
      priceRange: {
        min: '',
        max: '',
        unit: 'event'
      },
      specialties: '',
      services: '',
      yearsInBusiness: '',
      teamSize: '',
      serviceArea: '',
      socialMedia: {
        instagram: '',
        facebook: '',
        website: ''
      },
      agreesToTerms: false
    });
    setPhotos([]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-pink-600">
                SoFloWeddingVenues
              </Link>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/venues" className="text-gray-700 hover:text-gray-900 font-medium">
                Browse Venues
              </Link>
              <Link href="/dress-shops" className="text-gray-700 hover:text-gray-900 font-medium">
                Dress Shops
              </Link>
              <Link href="/vendors" className="text-gray-700 hover:text-gray-900 font-medium">
                Vendors
              </Link>
              <Link href="#" className="text-gray-700 hover:text-gray-900 font-medium">
                Planning Tools
              </Link>
              <Link href="/login" className="text-gray-700 hover:text-gray-900 font-medium">
                Login
              </Link>
              <Link href="/register" className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-md font-medium transition">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-50 to-pink-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            List Your Wedding Business
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Join South Florida's premier wedding vendor directory and connect with engaged couples
          </p>
          <div className="grid md:grid-cols-3 gap-8 text-left max-w-3xl mx-auto">
            <div className="flex items-center">
              <div className="text-3xl mr-4">💼</div>
              <div>
                <h3 className="font-semibold text-gray-900">Get More Bookings</h3>
                <p className="text-gray-600">Reach couples actively planning their weddings</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="text-3xl mr-4">📸</div>
              <div>
                <h3 className="font-semibold text-gray-900">Showcase Your Work</h3>
                <p className="text-gray-600">Display your portfolio to potential clients</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="text-3xl mr-4">⭐</div>
              <div>
                <h3 className="font-semibold text-gray-900">Build Your Brand</h3>
                <p className="text-gray-600">Manage reviews and grow your reputation</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Vendor Information</h2>
            
            {/* Basic Information */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="Your business name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name *
                </label>
                <input
                  type="text"
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="Your full name"
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="your@email.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            {/* Business Category */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="">Select a category</option>
                  {vendorCategories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subcategory/Specialty
                </label>
                <input
                  type="text"
                  name="subcategory"
                  value={formData.subcategory}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="e.g., Wedding Photographer, Corporate DJ"
                />
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Tell us about your business, services, and what makes you special..."
              />
            </div>

            {/* Address */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Address</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    name="address.street"
                    value={formData.address.street}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="123 Main Street"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="Miami"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    name="address.zipCode"
                    value={formData.address.zipCode}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="33101"
                  />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing Information</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Starting Price *
                  </label>
                  <input
                    type="number"
                    name="priceRange.min"
                    value={formData.priceRange.min}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Price
                  </label>
                  <input
                    type="number"
                    name="priceRange.max"
                    value={formData.priceRange.max}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="2500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pricing Unit
                  </label>
                  <select
                    name="priceRange.unit"
                    value={formData.priceRange.unit}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="hour">Per Hour</option>
                    <option value="day">Per Day</option>
                    <option value="event">Per Event</option>
                    <option value="package">Package</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Years in Business
                </label>
                <input
                  type="number"
                  name="yearsInBusiness"
                  value={formData.yearsInBusiness}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="5"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team Size
                </label>
                <input
                  type="number"
                  name="teamSize"
                  value={formData.teamSize}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="3"
                />
              </div>
            </div>

            {/* Services & Service Area */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Services Offered
                </label>
                <textarea
                  name="services"
                  value={formData.services}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="List your services (comma-separated)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Area
                </label>
                <textarea
                  name="serviceArea"
                  value={formData.serviceArea}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="Miami-Dade, Broward, Palm Beach Counties..."
                />
              </div>
            </div>

            {/* Website & Social Media */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Online Presence</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="https://yourwebsite.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instagram Handle
                  </label>
                  <input
                    type="text"
                    name="socialMedia.instagram"
                    value={formData.socialMedia.instagram}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="@yourinstagram"
                  />
                </div>
              </div>
            </div>

            {/* Photo Upload */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Photos</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    const newPhotoUrls = files.map(file => URL.createObjectURL(file));
                    setPhotos(prev => [...prev, ...newPhotoUrls].slice(0, isPremium ? undefined : 2));
                  }}
                  className="hidden"
                  id="photo-upload"
                />
                <label htmlFor="photo-upload" className="cursor-pointer">
                  <div className="text-gray-500 mb-2">
                    📸 Click to upload photos
                  </div>
                  <p className="text-sm text-gray-400">
                    {isPremium ? 'Upload unlimited photos' : 'Upload up to 2 photos (upgrade for more)'}
                  </p>
                </label>
                
                {photos.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative">
                        <img
                          src={photo}
                          alt={`Portfolio ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => setPhotos(prev => prev.filter((_, i) => i !== index))}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Terms Agreement */}
            <div className="mb-8">
              <label className="flex items-start">
                <input
                  type="checkbox"
                  name="agreesToTerms"
                  checked={formData.agreesToTerms}
                  onChange={handleInputChange}
                  required
                  className="mt-1 h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  I agree to the{' '}
                  <Link href="/terms" className="text-pink-600 hover:text-pink-700">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-pink-600 hover:text-pink-700">
                    Privacy Policy
                  </Link>
                  . I understand that my listing will be reviewed before being published.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="text-center">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-pink-600 hover:bg-pink-700 disabled:bg-gray-400 text-white px-8 py-4 rounded-lg font-medium text-lg transition"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Vendor Listing'}
              </button>
              <p className="text-sm text-gray-500 mt-4">
                We'll review your submission and contact you within 2 business days.
              </p>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
