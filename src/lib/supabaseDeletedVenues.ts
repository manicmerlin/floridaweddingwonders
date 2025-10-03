// Supabase database functions for deleted venues
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabase: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabase && supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabase;
}

export interface DeletedVenue {
  id: string;
  venue_id: string;
  venue_name: string;
  deleted_at: string;
  deleted_by: string;
  reason?: string;
}

/**
 * Mark a venue as deleted in the database
 */
export async function markVenueAsDeleted(
  venueId: string,
  venueName: string,
  deletedBy: string,
  reason?: string
): Promise<boolean> {
  try {
    const client = getSupabaseClient();
    if (!client) {
      console.error('❌ Supabase client not available');
      return false;
    }

    console.log('🗑️  Marking venue as deleted in database:', { venueId, venueName });

    const deleteRecord = {
      id: `deleted-${venueId}-${Date.now()}`,
      venue_id: venueId,
      venue_name: venueName,
      deleted_by: deletedBy,
      reason: reason || 'User deleted'
    };

    const { data, error } = await client
      .from('deleted_venues')
      .insert(deleteRecord)
      .select();

    if (error) {
      console.error('❌ Failed to mark venue as deleted:', error);
      return false;
    }

    console.log('✅ Venue marked as deleted in database');
    return true;
  } catch (error) {
    console.error('❌ Error marking venue as deleted:', error);
    return false;
  }
}

/**
 * Check if a venue is deleted
 */
export async function isVenueDeletedInDatabase(venueId: string): Promise<boolean> {
  try {
    const client = getSupabaseClient();
    if (!client) {
      return false;
    }

    const { data, error } = await client
      .from('deleted_venues')
      .select('id')
      .eq('venue_id', venueId)
      .limit(1);

    if (error) {
      console.error('❌ Error checking if venue is deleted:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('❌ Error checking deleted venue:', error);
    return false;
  }
}

/**
 * Get all deleted venues
 */
export async function getDeletedVenues(): Promise<DeletedVenue[]> {
  try {
    const client = getSupabaseClient();
    if (!client) {
      console.log('ℹ️  Supabase client not available');
      return [];
    }

    console.log('🔍 Loading deleted venues from database...');

    const { data, error } = await client
      .from('deleted_venues')
      .select('*')
      .order('deleted_at', { ascending: false });

    if (error) {
      console.error('❌ Failed to load deleted venues:', error);
      return [];
    }

    console.log(`   Found ${data?.length || 0} deleted venues`);

    return data || [];
  } catch (error) {
    console.error('❌ Error loading deleted venues:', error);
    return [];
  }
}

/**
 * Restore a deleted venue (remove from deleted list)
 */
export async function restoreVenue(venueId: string): Promise<boolean> {
  try {
    const client = getSupabaseClient();
    if (!client) {
      console.error('❌ Supabase client not available');
      return false;
    }

    console.log('♻️  Restoring venue:', venueId);

    const { error } = await client
      .from('deleted_venues')
      .delete()
      .eq('venue_id', venueId);

    if (error) {
      console.error('❌ Failed to restore venue:', error);
      return false;
    }

    console.log('✅ Venue restored successfully');
    return true;
  } catch (error) {
    console.error('❌ Error restoring venue:', error);
    return false;
  }
}

/**
 * Permanently delete a venue from deleted list
 */
export async function permanentlyDeleteVenue(venueId: string): Promise<boolean> {
  try {
    const client = getSupabaseClient();
    if (!client) {
      console.error('❌ Supabase client not available');
      return false;
    }

    console.log('🗑️  Permanently deleting venue records:', venueId);

    // Delete from deleted_venues table
    await client
      .from('deleted_venues')
      .delete()
      .eq('venue_id', venueId);

    // Delete all photos for this venue
    await client
      .from('venue_photos')
      .delete()
      .eq('venue_id', venueId);

    console.log('✅ Venue permanently deleted');
    return true;
  } catch (error) {
    console.error('❌ Error permanently deleting venue:', error);
    return false;
  }
}
