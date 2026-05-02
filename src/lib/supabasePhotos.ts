// Supabase database functions for venue photos
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabase: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabase && supabaseUrl && supabaseAnonKey) {
    console.log('🔧 Initializing Supabase client for database...');
    console.log('   URL:', supabaseUrl);
    console.log('   Key:', supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'MISSING');
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } else if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase credentials missing!');
    console.error('   URL:', supabaseUrl || 'MISSING');
    console.error('   Key:', supabaseAnonKey ? 'present' : 'MISSING');
  }
  return supabase;
}

export interface VenuePhoto {
  id: string;
  venue_id: string;
  url: string;
  alt: string;
  is_primary: boolean;
  uploaded_at: string;
  uploaded_by: string;
}

/**
 * Save a photo record to the Supabase database
 */
export async function savePhotoToDatabase(
  id: string,
  venueId: string,
  url: string,
  alt: string,
  isPrimary: boolean,
  uploadedBy: string
): Promise<boolean> {
  try {
    const client = getSupabaseClient();
    if (!client) {
      console.error('❌ Supabase client not available');
      return false;
    }

    console.log('💾 Saving photo to database:', { id, venueId, url: url.substring(0, 50) + '...' });

    const { data, error } = await (client.from('venue_photos') as any)
      .upsert({
        id,
        venue_id: venueId,
        url,
        alt,
        is_primary: isPrimary,
        uploaded_by: uploadedBy
      }, {
        onConflict: 'id'
      });

    if (error) {
      console.error('❌ Failed to save photo to database:', error);
      return false;
    }

    console.log('✅ Photo saved to database successfully');
    return true;
  } catch (error) {
    console.error('❌ Error saving photo to database:', error);
    return false;
  }
}

/**
 * Load photos for a venue from the Supabase database
 */
export async function loadPhotosFromDatabase(venueId: string): Promise<Array<{
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
  type: 'image';
}>> {
  try {
    const client = getSupabaseClient();
    if (!client) {
      console.log('ℹ️  Supabase client not available, returning empty array');
      return [];
    }

    console.log('🔍 Loading photos from database for venue:', venueId);

    const { data, error } = await client
      .from('venue_photos')
      .select('*')
      .eq('venue_id', venueId)
      .order('is_primary', { ascending: false })
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('❌ Failed to load photos from database:', error);
      return [];
    }

    if (!data || data.length === 0) {
      console.log('   No photos found in database');
      return [];
    }

    console.log(`   Found ${data.length} photos in database`);

    return (data as any[]).map((photo: any) => ({
      id: photo.id,
      url: photo.url,
      alt: photo.alt,
      isPrimary: photo.is_primary,
      type: 'image' as const
    }));
  } catch (error) {
    console.error('❌ Error loading photos from database:', error);
    return [];
  }
}

/**
 * Delete a photo from the database
 */
export async function deletePhotoFromDatabase(photoId: string): Promise<boolean> {
  try {
    const client = getSupabaseClient();
    if (!client) {
      console.error('❌ Supabase client not available');
      return false;
    }

    const { error } = await client
      .from('venue_photos')
      .delete()
      .eq('id', photoId);

    if (error) {
      console.error('❌ Failed to delete photo from database:', error);
      return false;
    }

    console.log('✅ Photo deleted from database');
    return true;
  } catch (error) {
    console.error('❌ Error deleting photo from database:', error);
    return false;
  }
}

/**
 * Set a photo as primary (and unset others)
 */
export async function setPrimaryPhotoInDatabase(venueId: string, photoId: string): Promise<boolean> {
  try {
    const client = getSupabaseClient();
    if (!client) {
      console.error('❌ Supabase client not available');
      return false;
    }

    // First, unset all primary photos for this venue
    await (client.from('venue_photos') as any)
      .update({ is_primary: false })
      .eq('venue_id', venueId);

    // Then set the selected photo as primary
    const { error } = await (client.from('venue_photos') as any)
      .update({ is_primary: true })
      .eq('id', photoId);

    if (error) {
      console.error('❌ Failed to set primary photo:', error);
      return false;
    }

    console.log('✅ Primary photo updated');
    return true;
  } catch (error) {
    console.error('❌ Error setting primary photo:', error);
    return false;
  }
}
