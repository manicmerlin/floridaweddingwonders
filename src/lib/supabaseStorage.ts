import { supabase } from './supabase';

const VENUE_PHOTOS_BUCKET = 'venue-photos';

/**
 * Upload an image to Supabase Storage
 * @param file - The file to upload
 * @param venueId - The venue ID for organizing files
 * @param imageId - Unique image identifier
 * @returns Public URL of the uploaded image
 */
export async function uploadImageToSupabase(
  file: Blob,
  venueId: string,
  imageId: string
): Promise<string> {
  try {
    // Create file path: venues/{venueId}/{imageId}.jpg
    const fileExt = 'jpg'; // We're converting all to JPEG in the cropper
    const filePath = `venues/${venueId}/${imageId}.${fileExt}`;
    
    console.log('📤 Uploading to Supabase Storage:', filePath);
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(VENUE_PHOTOS_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true, // Overwrite if exists
        contentType: 'image/jpeg'
      });
    
    if (error) {
      console.error('❌ Supabase upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(VENUE_PHOTOS_BUCKET)
      .getPublicUrl(filePath);
    
    console.log('✅ Upload successful:', urlData.publicUrl);
    return urlData.publicUrl;
    
  } catch (error) {
    console.error('❌ Failed to upload to Supabase:', error);
    throw error;
  }
}

/**
 * Delete an image from Supabase Storage
 * @param imageUrl - The full URL of the image to delete
 */
export async function deleteImageFromSupabase(imageUrl: string): Promise<void> {
  try {
    // Extract the file path from the URL
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split(`${VENUE_PHOTOS_BUCKET}/`);
    if (pathParts.length < 2) {
      throw new Error('Invalid image URL');
    }
    
    const filePath = pathParts[1];
    
    console.log('🗑️ Deleting from Supabase Storage:', filePath);
    
    const { error } = await supabase.storage
      .from(VENUE_PHOTOS_BUCKET)
      .remove([filePath]);
    
    if (error) {
      console.error('❌ Delete error:', error);
      throw error;
    }
    
    console.log('✅ Image deleted successfully');
  } catch (error) {
    console.error('❌ Failed to delete from Supabase:', error);
    throw error;
  }
}

/**
 * List all images for a venue
 * @param venueId - The venue ID
 * @returns Array of image URLs
 */
export async function listVenueImages(venueId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase.storage
      .from(VENUE_PHOTOS_BUCKET)
      .list(`venues/${venueId}`);
    
    if (error) {
      console.error('❌ List error:', error);
      return [];
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // Get public URLs for all files
    const urls = data.map(file => {
      const { data: urlData } = supabase.storage
        .from(VENUE_PHOTOS_BUCKET)
        .getPublicUrl(`venues/${venueId}/${file.name}`);
      return urlData.publicUrl;
    });
    
    return urls;
  } catch (error) {
    console.error('❌ Failed to list images:', error);
    return [];
  }
}

/**
 * Check if Supabase Storage is properly configured
 */
export async function checkSupabaseStorageConfig(): Promise<boolean> {
  try {
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Storage not accessible:', error);
      return false;
    }
    
    const hasVenuePhotosBucket = data?.some(bucket => bucket.name === VENUE_PHOTOS_BUCKET);
    
    if (!hasVenuePhotosBucket) {
      console.warn('⚠️ venue-photos bucket not found. Please create it in Supabase dashboard.');
      return false;
    }
    
    console.log('✅ Supabase Storage is properly configured');
    return true;
  } catch (error) {
    console.error('❌ Failed to check storage config:', error);
    return false;
  }
}
