// Persistent photo storage utilities

export interface StoredPhoto {
  id: string;
  venueId: string;
  url: string;
  alt: string;
  isPrimary: boolean;
  type: 'image';
  uploadedAt: string;
  uploadedBy: string; // user ID
}

// Mock photo storage (in production, this would be in a database)
let VENUE_PHOTOS: StoredPhoto[] = [
  {
    id: 'photo-1',
    venueId: '11', // Curtiss Mansion
    url: '/images/venues/venue-11-curtiss-mansion-2.jpg',
    alt: 'Curtiss Mansion Exterior',
    isPrimary: true,
    type: 'image',
    uploadedAt: '2025-09-10T10:00:00Z',
    uploadedBy: 'owner-1'
  }
];

export function getVenuePhotos(venueId: string): StoredPhoto[] {
  return VENUE_PHOTOS.filter(photo => photo.venueId === venueId);
}

export function saveVenuePhotos(venueId: string, photos: Array<{
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
  type: 'image' | 'video';
}>, uploadedBy: string): boolean {
  try {
    // Remove existing photos for this venue
    VENUE_PHOTOS = VENUE_PHOTOS.filter(photo => photo.venueId !== venueId);
    
    // Add new photos (filter to only images for legacy support)
    const imagePhotos = photos.filter(p => p.type === 'image');
    const newPhotos: StoredPhoto[] = imagePhotos.map(photo => ({
      ...photo,
      type: 'image' as const,
      venueId,
      uploadedAt: new Date().toISOString(),
      uploadedBy
    }));
    
    VENUE_PHOTOS.push(...newPhotos);
    
    // Update the venue data in mockData.ts (this simulates updating the database)
    updateVenueInMockData(venueId, photos);
    
    // Also update the venues.json file if needed
    updateVenuesJsonWithPhotos(venueId, photos);
    
    return true;
  } catch (error) {
    console.error('Failed to save venue photos:', error);
    return false;
  }
}

// New function to update venues.json with uploaded photos
export function updateVenuesJsonWithPhotos(venueId: string, photos: Array<{
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
  type: 'image' | 'video';
}>) {
  try {
    // This would normally update the database
    // For now, we simulate by storing the update info
    const updateInfo = {
      venueId,
      photos,
      updatedAt: new Date().toISOString(),
      replacesPreviousImages: true
    };
    
    // Store update info in localStorage
    const updates = JSON.parse(localStorage.getItem('venue-photo-updates') || '{}');
    updates[venueId] = updateInfo;
    localStorage.setItem('venue-photo-updates', JSON.stringify(updates));
    
    console.log(`📸 Updated venue ${venueId} with ${photos.length} uploaded photos (replacing placeholders)`);
  } catch (error) {
    console.error('Failed to update venues.json with photos:', error);
  }
}

export function updateVenueInMockData(venueId: string, photos: Array<{
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
  type: 'image' | 'video';
}>) {
  // In a real application, this would update the database
  // For now, we'll store in localStorage as a simulation
  try {
    console.log('💾 updateVenueInMockData for venue:', venueId);
    console.log('   Saving', photos.length, 'photos');
    console.log('   Photo URLs:', photos.map(p => p.url));
    
    const venuePhotosData = JSON.parse(localStorage.getItem('venue-photos') || '{}');
    venuePhotosData[venueId] = photos;
    localStorage.setItem('venue-photos', JSON.stringify(venuePhotosData));
    
    console.log('✅ Photos saved to localStorage venue-photos');
    
    // Also update the venues.json data structure
    const venuesData = JSON.parse(localStorage.getItem('venues-data') || '{}');
    if (!venuesData.weddingVenues) {
      // Initialize with current data if not exists
      venuesData.weddingVenues = [];
    }
    
    // Update or add venue photos
    const venueIndex = venuesData.weddingVenues.findIndex((v: any) => v.id === venueId);
    if (venueIndex !== -1) {
      venuesData.weddingVenues[venueIndex].images = photos;
      console.log('✅ Updated existing venue in venues-data');
    } else {
      console.log('ℹ️  Venue not found in venues-data, skipping that update');
    }
    
    localStorage.setItem('venues-data', JSON.stringify(venuesData));
    console.log('✅ updateVenueInMockData completed successfully');
  } catch (error) {
    console.error('❌ Failed to update venue data:', error);
  }
}

export function loadVenuePhotosFromStorage(venueId: string): Array<{
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
  type: 'image';
}> {
  try {
    if (typeof window === 'undefined') {
      console.log('🔍 loadVenuePhotosFromStorage: Server-side, returning empty array');
      return [];
    }
    
    // First, try to load from localStorage (for backward compatibility)
    const venuePhotosData = JSON.parse(localStorage.getItem('venue-photos') || '{}');
    const localPhotos = venuePhotosData[venueId] || [];
    
    console.log('🔍 loadVenuePhotosFromStorage for venue:', venueId);
    console.log('   Found in localStorage:', localPhotos.length);
    
    // Check if we have Supabase URLs (they start with https://aflrmpkolumpjhpaxblz.supabase.co)
    const hasSupabasePhotos = localPhotos.some((p: any) => 
      p.url && p.url.includes('supabase.co/storage')
    );
    
    if (hasSupabasePhotos || localPhotos.length > 0) {
      console.log('   Using photos from storage (', hasSupabasePhotos ? 'Supabase URLs' : 'data URLs', ')');
      if (localPhotos.length > 0) {
        console.log('   Photo URLs:', localPhotos.map((p: any) => p.url.substring(0, 50) + '...'));
      }
    }
    
    return localPhotos;
  } catch (error) {
    console.error('❌ Failed to load venue photos from storage:', error);
    return [];
  }
}

export function deleteVenuePhoto(venueId: string, photoId: string, userId: string): boolean {
  try {
    const photoIndex = VENUE_PHOTOS.findIndex(
      photo => photo.venueId === venueId && photo.id === photoId && photo.uploadedBy === userId
    );
    
    if (photoIndex !== -1) {
      VENUE_PHOTOS.splice(photoIndex, 1);
      
      // Update localStorage
      const remainingPhotos = getVenuePhotos(venueId);
      const photoData = remainingPhotos.map(photo => ({
        id: photo.id,
        url: photo.url,
        alt: photo.alt,
        isPrimary: photo.isPrimary,
        type: 'image' as const
      }));
      
      updateVenueInMockData(venueId, photoData);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Failed to delete venue photo:', error);
    return false;
  }
}

export function setPrimaryPhoto(venueId: string, photoId: string, userId: string): boolean {
  try {
    const venuePhotos = VENUE_PHOTOS.filter(photo => photo.venueId === venueId);
    
    // Remove primary from all photos
    venuePhotos.forEach(photo => {
      photo.isPrimary = false;
    });
    
    // Set the selected photo as primary
    const targetPhoto = venuePhotos.find(photo => photo.id === photoId);
    if (targetPhoto && targetPhoto.uploadedBy === userId) {
      targetPhoto.isPrimary = true;
      
      // Update localStorage
      const photoData = venuePhotos.map(photo => ({
        id: photo.id,
        url: photo.url,
        alt: photo.alt,
        isPrimary: photo.isPrimary,
        type: 'image' as const
      }));
      
      updateVenueInMockData(venueId, photoData);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Failed to set primary photo:', error);
    return false;
  }
}

// Initialize venue photos from existing data
export function initializeVenuePhotos() {
  if (typeof window === 'undefined') return;
  
  try {
    // Check if we already have data in localStorage
    const existingData = localStorage.getItem('venue-photos');
    if (!existingData) {
      // Initialize with some default data
      const defaultPhotos = {
        '11': [
          {
            id: 'curtiss-default-1',
            url: '/images/venues/venue-11-curtiss-mansion-2.jpg',
            alt: 'Curtiss Mansion Exterior',
            isPrimary: true,
            type: 'image' as const
          }
        ],
        '1': [
          {
            id: 'hialeah-default-1',
            url: '/images/venues/venue-1-hialeah-park-racing-casino-2.jpg',
            alt: 'Hialeah Park Racing & Casino',
            isPrimary: true,
            type: 'image' as const
          }
        ]
      };
      
      localStorage.setItem('venue-photos', JSON.stringify(defaultPhotos));
    }
  } catch (error) {
    console.error('Failed to initialize venue photos:', error);
  }
}
