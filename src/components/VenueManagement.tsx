'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Venue } from '@/types';
import { mockVenues } from '@/lib/mockData';
import PhotoUpload from '@/components/PhotoUpload';
import { getCurrentUser, canManageVenue, getPhotoLimit, logout, isSuperAdmin } from '@/lib/auth';
import { loadVenuePhotosFromStorage, saveVenuePhotos, initializeVenuePhotos } from '@/lib/photoStorage';

interface VenueManagementProps {
  venueId: string;
}

export default function VenueManagement({ venueId }: VenueManagementProps) {
  const router = useRouter();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'photos' | 'pricing' | 'availability'>('info');
  const [saving, setSaving] = useState(false);
  const [authState, setAuthState] = useState<{ user: any; isAuthenticated: boolean }>({ user: null, isAuthenticated: false });
  const [accessDenied, setAccessDenied] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    capacity: { min: 0, max: 0 },
    pricing: { startingPrice: 0 },
    amenities: [] as string[],
    contact: { email: '', phone: '', website: '' }
  });

  useEffect(() => {
    // Initialize photo storage
    initializeVenuePhotos();
    
    // Check authentication
    const auth = getCurrentUser();
    setAuthState(auth);
    
    // Check if user can manage this venue
    if (!canManageVenue(venueId)) {
      setAccessDenied(true);
      return;
    }

    // Find the venue by ID
    const foundVenue = mockVenues.find(v => v.id === venueId);
    if (foundVenue) {
      // Load stored photos for this venue
      const storedPhotos = loadVenuePhotosFromStorage(venueId);
      const venueWithStoredPhotos = {
        ...foundVenue,
        images: storedPhotos.length > 0 ? storedPhotos : foundVenue.images
      };
      
      setVenue(venueWithStoredPhotos);
      setFormData({
        name: venueWithStoredPhotos.name,
        description: venueWithStoredPhotos.description,
        capacity: venueWithStoredPhotos.capacity,
        pricing: venueWithStoredPhotos.pricing,
        amenities: venueWithStoredPhotos.amenities,
        contact: {
          email: venueWithStoredPhotos.contact.email,
          phone: venueWithStoredPhotos.contact.phone,
          website: venueWithStoredPhotos.contact.website || ''
        }
      });
    }
  }, [venueId]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedInputChange = (parent: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof typeof prev] as any,
        [field]: value
      }
    }));
  };

  const handleAmenitiesChange = (amenity: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      amenities: checked 
        ? [...prev.amenities, amenity]
        : prev.amenities.filter(a => a !== amenity)
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log('Saving venue data:', formData);
      alert('Venue information updated successfully!');
      setSaving(false);
    }, 2000);
  };

  const handlePhotosUpdate = (photos: any[]) => {
    if (venue && authState.user) {
      // Save photos to persistent storage
      const success = saveVenuePhotos(venueId, photos, authState.user?.id || 'unknown');
      
      if (success) {
        // Update local state
        setVenue({
          ...venue,
          images: photos
        });
        console.log('Photos saved successfully');
      } else {
        console.error('Failed to save photos');
        alert('Failed to save photos. Please try again.');
      }
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Access denied screen
  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔒</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You don't have permission to manage this venue. Only verified venue owners can edit their property information.
          </p>
          <div className="space-y-3">
            <Link href="/login" className="block bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg transition">
              Login as Venue Owner
            </Link>
            <Link href={`/venues/${venueId}`} className="block text-gray-600 hover:text-gray-800 transition">
              View Venue Page
            </Link>
          </div>
          
          {/* Demo credentials for testing */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-left">
            <h4 className="font-medium text-blue-900 mb-2">Demo Credentials:</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p><strong>Super Admin (All Venues):</strong> admin@sofloweddingvenues.com / superadmin2025</p>
              <p><strong>Curtiss Mansion:</strong> manager@curtissmansion.com / curtiss123</p>
              <p><strong>Hialeah Park:</strong> owner@hialeahpark.com / hialeah123</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading venue...</p>
        </div>
      </div>
    );
  }

  const photoLimit = getPhotoLimit(venueId);
  const isPremium = authState.user?.subscriptionTier === 'premium' || authState.user?.subscriptionTier === 'enterprise';
  const isSuper = isSuperAdmin();

  const availableAmenities = [
    'Wi-Fi', 'Parking', 'Bridal Suite', 'Catering Kitchen', 'Dance Floor',
    'Audio/Visual Equipment', 'Outdoor Ceremony Space', 'Bar Service',
    'Handicap Accessible', 'Air Conditioning', 'Getting Ready Rooms',
    'Photography Permitted', 'Live Music Allowed', 'Decorating Allowed',
    'Outside Catering Allowed', 'Alcohol Permitted', 'Late Night Events',
    'Valet Parking', 'Guest Accommodations', 'Scenic Views'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-pink-600">SoFlo Wedding Venues</Link>
              <span className="ml-4 text-gray-400">|</span>
              <span className="ml-4 text-gray-600">Venue Management</span>
            </div>
            <div className="flex items-center space-x-4">
              {authState.user && (
                <div className="flex items-center space-x-3">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{authState.user?.email || 'Unknown User'}</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                      isSuper ? 'bg-purple-100 text-purple-800' : 
                      isPremium ? 'bg-gold-100 text-gold-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {isSuper ? 'SUPER ADMIN' : (authState.user?.subscriptionTier || 'free').toUpperCase()}
                    </span>
                  </div>
                </div>
              )}
              <Link href={`/venues/${venueId}`} className="text-gray-700 hover:text-pink-600 font-medium transition">
                View Public Page
              </Link>
              <Link href="/venues" className="text-gray-700 hover:text-pink-600 font-medium transition">
                Browse Venues
              </Link>
              <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {isSuper ? 'Super Admin - Manage Venue' : 'Manage Your Venue'}
              </h1>
              <p className="text-gray-600">{venue.name}</p>
              <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                <span>Photos: {venue.images?.length || 0}/{photoLimit}</span>
                <span>•</span>
                <span>Subscription: {authState.user?.subscriptionTier || 'free'}</span>
                {isSuper && (
                  <>
                    <span>•</span>
                    <span className="text-purple-600 font-medium">🔑 SUPER ADMIN ACCESS</span>
                  </>
                )}
              </div>
            </div>
            {isSuper && (
              <div className="text-right">
                <Link 
                  href="/venues" 
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-medium transition"
                >
                  Browse All Venues
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'info', label: 'Basic Information', icon: '📝' },
                { id: 'photos', label: 'Photo Gallery', icon: '📷' },
                { id: 'pricing', label: 'Pricing & Packages', icon: '💰' },
                { id: 'availability', label: 'Availability', icon: '📅' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                    activeTab === tab.id
                      ? 'border-pink-500 text-pink-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Basic Information Tab */}
            {activeTab === 'info' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Venue Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-pink-500 focus:border-pink-500"
                    placeholder="Describe your venue, its unique features, and what makes it special..."
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Capacity
                    </label>
                    <input
                      type="number"
                      value={formData.capacity.min}
                      onChange={(e) => handleNestedInputChange('capacity', 'min', parseInt(e.target.value))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-pink-500 focus:border-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Capacity
                    </label>
                    <input
                      type="number"
                      value={formData.capacity.max}
                      onChange={(e) => handleNestedInputChange('capacity', 'max', parseInt(e.target.value))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-pink-500 focus:border-pink-500"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.contact.email}
                      onChange={(e) => handleNestedInputChange('contact', 'email', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-pink-500 focus:border-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.contact.phone}
                      onChange={(e) => handleNestedInputChange('contact', 'phone', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-pink-500 focus:border-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website (Optional)
                    </label>
                    <input
                      type="url"
                      value={formData.contact.website || ''}
                      onChange={(e) => handleNestedInputChange('contact', 'website', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="https://"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Amenities & Features
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {availableAmenities.map((amenity) => (
                      <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.amenities.includes(amenity)}
                          onChange={(e) => handleAmenitiesChange(amenity, e.target.checked)}
                          className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                        />
                        <span className="text-sm text-gray-700">{amenity}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Photos Tab */}
            {activeTab === 'photos' && (
              <div>
                <PhotoUpload
                  venueId={venueId}
                  existingPhotos={venue.images?.map(img => ({
                    id: img.id,
                    url: img.url,
                    alt: img.alt,
                    isPrimary: img.isPrimary || false
                  })) || []}
                  onPhotosUpdate={handlePhotosUpdate}
                  maxPhotos={photoLimit}
                  isPremium={isPremium}
                />
              </div>
            )}

            {/* Pricing Tab */}
            {activeTab === 'pricing' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Starting Price
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={formData.pricing.startingPrice}
                      onChange={(e) => handleNestedInputChange('pricing', 'startingPrice', parseInt(e.target.value))}
                      className="w-full border border-gray-300 rounded-md pl-8 pr-3 py-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="5000"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">This is the starting price for your venue rental</p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-900 mb-2">Pricing Strategy Tips</h4>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• Set competitive rates based on your market and amenities</li>
                    <li>• Consider seasonal pricing adjustments</li>
                    <li>• Offer package deals to attract more bookings</li>
                    <li>• Be transparent about what's included in your base price</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Availability Tab */}
            {activeTab === 'availability' && (
              <div className="space-y-6">
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📅</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Calendar Management</h3>
                  <p className="text-gray-600 mb-4">
                    Advanced calendar features for managing bookings and availability will be available soon.
                  </p>
                  <p className="text-sm text-gray-500">
                    This will include blocked dates, booking management, and integration with your existing calendar system.
                  </p>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-between items-center pt-6 border-t mt-8">
              <p className="text-sm text-gray-500">
                Changes are automatically saved as you edit.
              </p>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-pink-600 text-white px-6 py-2 rounded-md font-medium hover:bg-pink-700 transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
