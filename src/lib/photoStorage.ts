// Persistent photo storage utilities

export interface StoredPhoto {
  id: string;
  venueId: string;
  url: string;
  alt: string;
  isPrimary: boolean;
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
}>, uploadedBy: string): boolean {
  try {
    // Remove existing photos for this venue
    VENUE_PHOTOS = VENUE_PHOTOS.filter(photo => photo.venueId !== venueId);
    
    // Add new photos
    const newPhotos: StoredPhoto[] = photos.map(photo => ({
      ...photo,
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
}>) {
  // In a real application, this would update the database
  // For now, we'll store in localStorage as a simulation
  try {
    const venuePhotosData = JSON.parse(localStorage.getItem('venue-photos') || '{}');
    venuePhotosData[venueId] = photos;
    localStorage.setItem('venue-photos', JSON.stringify(venuePhotosData));
    
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
    }
    
    localStorage.setItem('venues-data', JSON.stringify(venuesData));
  } catch (error) {
    console.error('Failed to update venue data:', error);
  }
}

export function loadVenuePhotosFromStorage(venueId: string): Array<{
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
}> {
  try {
    if (typeof window === 'undefined') return [];
    
    const venuePhotosData = JSON.parse(localStorage.getItem('venue-photos') || '{}');
    return venuePhotosData[venueId] || [];
  } catch (error) {
    console.error('Failed to load venue photos from storage:', error);
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
        isPrimary: photo.isPrimary
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
        isPrimary: photo.isPrimary
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
            isPrimary: true
          }
        ],
        '1': [
          {
            id: 'hialeah-default-1',
            url: '/images/venues/venue-1-hialeah-park-racing-casino-2.jpg',
            alt: 'Hialeah Park Racing & Casino',
            isPrimary: true
          }
        ]
      };
      
      localStorage.setItem('venue-photos', JSON.stringify(defaultPhotos));
    }
  } catch (error) {
    console.error('Failed to initialize venue photos:', error);
  }
}
