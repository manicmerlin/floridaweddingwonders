'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { mockVenues } from '../../../../lib/mockData';
import { Venue, VenueImage } from '../../../../types';
import Image from 'next/image';
import Link from 'next/link';

export default function VenueAdminPanel() {
  const params = useParams();
  const router = useRouter();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedVenue, setEditedVenue] = useState<Venue | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'images' | 'pricing'>('info');
  const [draggedImage, setDraggedImage] = useState<string | null>(null);

  useEffect(() => {
    const foundVenue = mockVenues.find(v => v.id === params.id);
    if (foundVenue) {
      setVenue(foundVenue);
      setEditedVenue(foundVenue);
    }
  }, [params.id]);

  const handleLogout = () => {
    document.cookie = 'admin-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    router.push('/admin/login');
  };

  const handleSave = () => {
    if (editedVenue) {
      setVenue(editedVenue);
      setIsEditing(false);
      // In a real app, this would save to the backend
      console.log('Saving venue:', editedVenue);
    }
  };

  const handleImageReorder = (draggedId: string, targetId: string) => {
    if (!editedVenue || !editedVenue.images) return;

    const images = [...editedVenue.images];
    const draggedIndex = images.findIndex(img => img.id === draggedId);
    const targetIndex = images.findIndex(img => img.id === targetId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      const [draggedItem] = images.splice(draggedIndex, 1);
      images.splice(targetIndex, 0, draggedItem);

      setEditedVenue({
        ...editedVenue,
        images: images
      });
    }
  };

  const setPrimaryImage = (imageId: string) => {
    if (!editedVenue || !editedVenue.images) return;

    const updatedImages = editedVenue.images.map(img => ({
      ...img,
      isPrimary: img.id === imageId
    }));

    setEditedVenue({
      ...editedVenue,
      images: updatedImages
    });
  };

  const deleteImage = (imageId: string) => {
    if (!editedVenue || !editedVenue.images) return;

    const updatedImages = editedVenue.images.filter(img => img.id !== imageId);
    
    setEditedVenue({
      ...editedVenue,
      images: updatedImages
    });
  };

  if (!venue) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl text-gray-400 mb-4">🏛️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Venue Not Found</h1>
          <p className="text-gray-600 mb-6">The venue you're looking for doesn't exist.</p>
          <Link href="/admin" className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg transition">
            Back to Admin Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/admin" className="text-2xl font-bold text-gray-900">
                SoFlo Venues Admin
              </Link>
              <span className="mx-3 text-gray-400">/</span>
              <span className="text-gray-600 font-medium">{venue.name}</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href={`/venues/${venue.id}`} className="text-gray-700 hover:text-gray-900 font-medium">
                View Public Page
              </Link>
              <Link href="/admin" className="text-gray-700 hover:text-gray-900 font-medium">
                Back to Dashboard
              </Link>
              <button 
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{venue.name}</h1>
              <p className="text-gray-600 mb-4">{venue.address.street}, {venue.address.city}, {venue.address.state}</p>
              <div className="flex items-center space-x-4 text-sm">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                  {venue.venueType}
                </span>
                <span className="text-gray-600">
                  Capacity: {venue.capacity.min}-{venue.capacity.max} guests
                </span>
                <span className="text-gray-600">
                  From ${venue.pricing.startingPrice.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="flex space-x-3">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    Save Changes
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Edit Venue
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'info', name: 'Venue Information', icon: '📝' },
                { id: 'images', name: 'Photo Gallery', icon: '📸' },
                { id: 'pricing', name: 'Pricing & Availability', icon: '💰' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-pink-500 text-pink-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Venue Information Tab */}
            {activeTab === 'info' && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Venue Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedVenue?.name || ''}
                        onChange={(e) => setEditedVenue(prev => prev ? {...prev, name: e.target.value} : null)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="p-3 bg-gray-50 rounded-lg">{venue.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Venue Type</label>
                    {isEditing ? (
                      <select
                        value={editedVenue?.venueType || ''}
                        onChange={(e) => setEditedVenue(prev => prev ? {...prev, venueType: e.target.value as any} : null)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      >
                        <option value="beach">Beach</option>
                        <option value="garden">Garden</option>
                        <option value="ballroom">Ballroom</option>
                        <option value="historic">Historic</option>
                        <option value="modern">Modern</option>
                        <option value="rustic">Rustic</option>
                      </select>
                    ) : (
                      <p className="p-3 bg-gray-50 rounded-lg capitalize">{venue.venueType}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  {isEditing ? (
                    <textarea
                      value={editedVenue?.description || ''}
                      onChange={(e) => setEditedVenue(prev => prev ? {...prev, description: e.target.value} : null)}
                      rows={4}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="p-3 bg-gray-50 rounded-lg">{venue.description}</p>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    {isEditing ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Street Address"
                          value={editedVenue?.address.street || ''}
                          onChange={(e) => setEditedVenue(prev => prev ? {
                            ...prev, 
                            address: {...prev.address, street: e.target.value}
                          } : null)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="City"
                            value={editedVenue?.address.city || ''}
                            onChange={(e) => setEditedVenue(prev => prev ? {
                              ...prev, 
                              address: {...prev.address, city: e.target.value}
                            } : null)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          />
                          <input
                            type="text"
                            placeholder="ZIP Code"
                            value={editedVenue?.address.zipCode || ''}
                            onChange={(e) => setEditedVenue(prev => prev ? {
                              ...prev, 
                              address: {...prev.address, zipCode: e.target.value}
                            } : null)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p>{venue.address.street}</p>
                        <p>{venue.address.city}, {venue.address.state} {venue.address.zipCode}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Information</label>
                    {isEditing ? (
                      <div className="space-y-3">
                        <input
                          type="email"
                          placeholder="Email"
                          value={editedVenue?.contact.email || ''}
                          onChange={(e) => setEditedVenue(prev => prev ? {
                            ...prev, 
                            contact: {...prev.contact, email: e.target.value}
                          } : null)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        />
                        <input
                          type="tel"
                          placeholder="Phone"
                          value={editedVenue?.contact.phone || ''}
                          onChange={(e) => setEditedVenue(prev => prev ? {
                            ...prev, 
                            contact: {...prev.contact, phone: e.target.value}
                          } : null)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        />
                        <input
                          type="url"
                          placeholder="Website (optional)"
                          value={editedVenue?.contact.website || ''}
                          onChange={(e) => setEditedVenue(prev => prev ? {
                            ...prev, 
                            contact: {...prev.contact, website: e.target.value}
                          } : null)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        />
                      </div>
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg space-y-1">
                        <p>{venue.contact.email}</p>
                        <p>{venue.contact.phone}</p>
                        {venue.contact.website && <p>{venue.contact.website}</p>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Images Tab */}
            {activeTab === 'images' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Photo Gallery Management</h3>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition">
                    Upload New Photos
                  </button>
                </div>

                {venue.images && venue.images.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(isEditing ? editedVenue?.images : venue.images)?.map((image, index) => (
                      <div
                        key={image.id}
                        className="group relative bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all"
                        draggable={isEditing}
                        onDragStart={() => setDraggedImage(image.id)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => {
                          if (draggedImage && draggedImage !== image.id) {
                            handleImageReorder(draggedImage, image.id);
                          }
                          setDraggedImage(null);
                        }}
                      >
                        <div className="aspect-video relative">
                          <Image
                            src={image.url}
                            alt={image.alt}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                          
                          {/* Primary Badge */}
                          {image.isPrimary && (
                            <div className="absolute top-3 left-3 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                              PRIMARY PHOTO
                            </div>
                          )}
                          
                          {/* Image Order */}
                          <div className="absolute top-3 right-3 bg-black bg-opacity-50 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>

                          {/* Edit Actions */}
                          {isEditing && (
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                                {!image.isPrimary && (
                                  <button
                                    onClick={() => setPrimaryImage(image.id)}
                                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition"
                                  >
                                    Set as Primary
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteImage(image.id)}
                                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="p-4">
                          <p className="text-sm text-gray-600 mb-2">{image.alt}</p>
                          {isEditing && (
                            <p className="text-xs text-gray-400">Drag to reorder</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="text-6xl text-gray-400 mb-4">📸</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Photos Yet</h3>
                    <p className="text-gray-600 mb-4">Upload some beautiful photos to showcase this venue.</p>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition">
                      Upload First Photo
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Pricing Tab */}
            {activeTab === 'pricing' && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Starting Price</label>
                    {isEditing ? (
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          value={editedVenue?.pricing.startingPrice || 0}
                          onChange={(e) => setEditedVenue(prev => prev ? {
                            ...prev, 
                            pricing: {...prev.pricing, startingPrice: parseInt(e.target.value) || 0}
                          } : null)}
                          className="w-full pl-8 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        />
                      </div>
                    ) : (
                      <p className="p-3 bg-gray-50 rounded-lg">${venue.pricing.startingPrice.toLocaleString()}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Guest Capacity</label>
                    {isEditing ? (
                      <div className="flex space-x-3">
                        <div className="flex-1">
                          <input
                            type="number"
                            placeholder="Min"
                            value={editedVenue?.capacity.min || 0}
                            onChange={(e) => setEditedVenue(prev => prev ? {
                              ...prev, 
                              capacity: {...prev.capacity, min: parseInt(e.target.value) || 0}
                            } : null)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          />
                        </div>
                        <span className="flex items-center text-gray-500">to</span>
                        <div className="flex-1">
                          <input
                            type="number"
                            placeholder="Max"
                            value={editedVenue?.capacity.max || 0}
                            onChange={(e) => setEditedVenue(prev => prev ? {
                              ...prev, 
                              capacity: {...prev.capacity, max: parseInt(e.target.value) || 0}
                            } : null)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="p-3 bg-gray-50 rounded-lg">
                        {venue.capacity.min} - {venue.capacity.max} guests
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex flex-wrap gap-2">
                      {venue.amenities.map((amenity, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Availability Status</label>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-gray-900">Currently Available for Bookings</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        venue.availability.isAvailable 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {venue.availability.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                    {isEditing && (
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={editedVenue?.availability.isAvailable || false}
                          onChange={(e) => setEditedVenue(prev => prev ? {
                            ...prev, 
                            availability: {...prev.availability, isAvailable: e.target.checked}
                          } : null)}
                          className="w-4 h-4 text-pink-600 bg-gray-100 border-gray-300 rounded focus:ring-pink-500"
                        />
                        <span className="ml-2 text-sm text-gray-900">Available for new bookings</span>
                      </label>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
