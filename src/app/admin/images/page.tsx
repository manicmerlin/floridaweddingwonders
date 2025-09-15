'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { mockVenues } from '../../../lib/mockData';
import { Venue } from '../../../types';
import Image from 'next/image';
import Link from 'next/link';

export default function AdminImageManagement() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setVenues(mockVenues);
  }, []);

  const filteredVenues = venues.filter(venue =>
    venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    venue.address.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleManageImages = (venue: Venue) => {
    setSelectedVenue(venue);
    setIsImageModalOpen(true);
  };

  const handleSetPrimaryImage = (venue: Venue, imageId: string) => {
    if (!venue.images) return;

    const updatedImages = venue.images.map(img => ({
      ...img,
      isPrimary: img.id === imageId
    }));

    const updatedVenue = { ...venue, images: updatedImages };
    setVenues(venues.map(v => v.id === venue.id ? updatedVenue : v));
    setSelectedVenue(updatedVenue);
    
    console.log(`🖼️ Set ${imageId} as primary for ${venue.name}`);
  };

  const handleDeleteImage = (venue: Venue, imageId: string) => {
    if (!venue.images || venue.images.length <= 1) {
      alert('Cannot delete the only image for this venue');
      return;
    }

    const updatedImages = venue.images.filter(img => img.id !== imageId);
    
    // If we deleted the primary image, make the first remaining image primary
    if (venue.images.find(img => img.id === imageId)?.isPrimary && updatedImages.length > 0) {
      updatedImages[0].isPrimary = true;
    }

    const updatedVenue = { ...venue, images: updatedImages };
    setVenues(venues.map(v => v.id === venue.id ? updatedVenue : v));
    setSelectedVenue(updatedVenue);
    
    console.log(`🗑️ Deleted image ${imageId} from ${venue.name}`);
  };

  const venuesWithImages = venues.filter(v => v.images && v.images.length > 0);
  const venuesWithoutImages = venues.filter(v => !v.images || v.images.length === 0);
  const totalImages = venues.reduce((sum, v) => sum + (v.images?.length || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/admin" className="text-2xl font-bold text-gray-900">SoFlo Venues Admin</Link>
              <span className="ml-4 text-gray-400">/</span>
              <span className="ml-4 text-gray-600">Image Management</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-gray-700 hover:text-gray-900 font-medium">
                Dashboard
              </Link>
              <Link href="/venues" className="text-gray-700 hover:text-gray-900 font-medium">
                View Site
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Image Management Dashboard</h1>
          <p className="text-gray-600">Manage venue photos, set primary images, and handle image uploads</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{totalImages}</div>
            <div className="text-gray-600">Total Images</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-green-600">{venuesWithImages.length}</div>
            <div className="text-gray-600">Venues with Images</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-red-600">{venuesWithoutImages.length}</div>
            <div className="text-gray-600">Need Images</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-purple-600">{Math.round(totalImages / venuesWithImages.length * 10) / 10}</div>
            <div className="text-gray-600">Avg Images/Venue</div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Venue Images</h2>
            <div className="flex space-x-3">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition">
                Bulk Upload Images
              </button>
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition">
                Run Image Scraper
              </button>
            </div>
          </div>
          
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search venues by name or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Venues Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVenues.map((venue) => {
            const hasImages = venue.images && venue.images.length > 0;
            const primaryImage = venue.images?.find(img => img.isPrimary) || venue.images?.[0];
            
            return (
              <div key={venue.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Image Preview */}
                <div className="aspect-video bg-gray-200 relative">
                  {hasImages && primaryImage ? (
                    <Image
                      src={primaryImage.url}
                      alt={primaryImage.alt || venue.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm text-gray-500">No images</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Image Count Badge */}
                  {hasImages && (
                    <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded-md text-sm">
                      {venue.images?.length} {venue.images?.length === 1 ? 'image' : 'images'}
                    </div>
                  )}
                  
                  {/* Primary Badge */}
                  {hasImages && primaryImage && (
                    <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded-md text-xs font-medium">
                      PRIMARY
                    </div>
                  )}
                </div>

                {/* Venue Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">{venue.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{venue.address.city}, {venue.address.state}</p>
                  
                  {/* Status */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      hasImages 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {hasImages ? `${venue.images?.length} Images` : 'No Images'}
                    </span>
                    
                    <Link 
                      href={`/venues/${venue.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Live →
                    </Link>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleManageImages(venue)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium transition"
                    >
                      {hasImages ? 'Manage Images' : 'Add Images'}
                    </button>
                    <Link
                      href={`/venues/${venue.id}/manage`}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm font-medium transition text-center"
                    >
                      Edit Venue
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Image Management Modal */}
      {isImageModalOpen && selectedVenue && (
        <ImageManagementModal
          venue={selectedVenue}
          onSetPrimary={handleSetPrimaryImage}
          onDeleteImage={handleDeleteImage}
          onClose={() => setIsImageModalOpen(false)}
        />
      )}
    </div>
  );
}

// Image Management Modal Component
function ImageManagementModal({ 
  venue, 
  onSetPrimary, 
  onDeleteImage, 
  onClose 
}: {
  venue: Venue;
  onSetPrimary: (venue: Venue, imageId: string) => void;
  onDeleteImage: (venue: Venue, imageId: string) => void;
  onClose: () => void;
}) {
  const hasImages = venue.images && venue.images.length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{venue.name}</h2>
            <p className="text-gray-600">{venue.address.city}, {venue.address.state}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {hasImages ? (
            <>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Images ({venue.images?.length})
                </h3>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition">
                  Upload New Images
                </button>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {venue.images?.map((image, index) => (
                  <div key={image.id} className="relative group">
                    <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                      <Image
                        src={image.url}
                        alt={image.alt || `${venue.name} photo ${index + 1}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                    
                    {/* Primary Badge */}
                    {image.isPrimary && (
                      <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded-md text-xs font-medium">
                        PRIMARY
                      </div>
                    )}
                    
                    {/* Hover Actions */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                        {!image.isPrimary && (
                          <button
                            onClick={() => onSetPrimary(venue, image.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-xs font-medium transition"
                          >
                            Set Primary
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteImage(venue, image.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-xs font-medium transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    
                    {/* Image Info */}
                    <div className="mt-2">
                      <p className="text-xs text-gray-600 truncate">{image.alt}</p>
                      <p className="text-xs text-gray-500">ID: {image.id}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No images uploaded</h3>
              <p className="text-gray-600 mb-6">This venue doesn't have any images yet. Upload some photos to get started.</p>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium transition">
                Upload First Images
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
