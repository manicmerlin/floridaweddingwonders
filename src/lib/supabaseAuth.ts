// Supabase authentication utilities for user management
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aflrmpkolumpjhpaxblz.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmbHJtcGtvbHVtcGpocGF4Ymx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY0MjcyMTIsImV4cCI6MjA0MjAwMzIxMn0.y7cCU7LNcanterUpMPU6j5rO_hWJlgEYF3z9FRw00LU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface UserRegistrationData {
  email: string;
  password: string;
  fullName: string;
  role?: 'guest' | 'venue_owner';
}

export interface UserLoginData {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  emailVerified: boolean;
  profileComplete: boolean;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  sessionToken?: string;
}

/**
 * Register a new user
 */
export async function registerUser(data: UserRegistrationData): Promise<AuthResponse> {
  try {
    const { data: result, error } = await supabase
      .rpc('register_user', {
        p_email: data.email,
        p_password: data.password,
        p_full_name: data.fullName,
        p_role: data.role || 'guest'
      });

    if (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error.message || 'Registration failed'
      };
    }

    if (result && result.length > 0) {
      const registrationResult = result[0];
      
      if (registrationResult.success) {
        // Fetch the full user data
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', registrationResult.user_id)
          .single();

        if (userError) {
          console.error('Error fetching user data:', userError);
          return {
            success: true,
            message: registrationResult.message,
            sessionToken: registrationResult.user_id
          };
        }

        return {
          success: true,
          message: registrationResult.message,
          user: {
            id: userData.id,
            email: userData.email,
            fullName: userData.full_name,
            role: userData.role,
            emailVerified: userData.email_verified,
            profileComplete: userData.profile_complete,
            createdAt: userData.created_at
          },
          sessionToken: userData.id
        };
      } else {
        return {
          success: false,
          message: registrationResult.message
        };
      }
    }

    return {
      success: false,
      message: 'Registration failed - no response from server'
    };
  } catch (error: any) {
    console.error('Registration exception:', error);
    return {
      success: false,
      message: error.message || 'An unexpected error occurred during registration'
    };
  }
}

/**
 * Authenticate a user (login)
 */
export async function authenticateUser(data: UserLoginData): Promise<AuthResponse> {
  try {
    const { data: result, error } = await supabase
      .rpc('authenticate_user', {
        p_email: data.email,
        p_password: data.password
      });

    if (error) {
      console.error('Authentication error:', error);
      return {
        success: false,
        message: error.message || 'Authentication failed'
      };
    }

    if (result && result.length > 0) {
      const authResult = result[0];
      
      if (authResult.success) {
        return {
          success: true,
          message: authResult.message,
          user: {
            id: authResult.user_id,
            email: authResult.email,
            fullName: authResult.full_name,
            role: authResult.role,
            emailVerified: true,
            profileComplete: false,
            createdAt: new Date().toISOString()
          },
          sessionToken: authResult.user_id
        };
      } else {
        return {
          success: false,
          message: authResult.message
        };
      }
    }

    return {
      success: false,
      message: 'Authentication failed - no response from server'
    };
  } catch (error: any) {
    console.error('Authentication exception:', error);
    return {
      success: false,
      message: error.message || 'An unexpected error occurred during login'
    };
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.error('Error fetching user:', error);
      return null;
    }

    return {
      id: data.id,
      email: data.email,
      fullName: data.full_name,
      role: data.role,
      emailVerified: data.email_verified,
      profileComplete: data.profile_complete,
      createdAt: data.created_at
    };
  } catch (error) {
    console.error('Exception fetching user:', error);
    return null;
  }
}

/**
 * Update user profile completion status
 */
export async function updateProfileCompletion(userId: string, isComplete: boolean): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('users')
      .update({ profile_complete: isComplete, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      console.error('Error updating profile completion:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception updating profile completion:', error);
    return false;
  }
}

/**
 * Save user profile data (lead qualification)
 */
export async function saveUserProfile(userId: string, profileData: any): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        phone: profileData.phone,
        wedding_date: profileData.weddingDate,
        guest_count: profileData.guestCount,
        budget_min: profileData.budgetMin,
        budget_max: profileData.budgetMax,
        venue_type: profileData.venueType,
        preferred_locations: profileData.preferredLocations,
        additional_notes: profileData.additionalNotes,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error saving user profile:', error);
      return false;
    }

    // Mark profile as complete
    await updateProfileCompletion(userId, true);

    return true;
  } catch (error) {
    console.error('Exception saving user profile:', error);
    return false;
  }
}

/**
 * Add venue to favorites
 */
export async function addFavorite(userId: string, venueId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_favorites')
      .insert({
        user_id: userId,
        venue_id: venueId
      });

    if (error) {
      console.error('Error adding favorite:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception adding favorite:', error);
    return false;
  }
}

/**
 * Remove venue from favorites
 */
export async function removeFavorite(userId: string, venueId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('venue_id', venueId);

    if (error) {
      console.error('Error removing favorite:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception removing favorite:', error);
    return false;
  }
}

/**
 * Get user's favorite venues
 */
export async function getFavorites(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('user_favorites')
      .select('venue_id')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching favorites:', error);
      return [];
    }

    return data.map((fav: any) => fav.venue_id);
  } catch (error) {
    console.error('Exception fetching favorites:', error);
    return [];
  }
}

/**
 * Check if venue is favorited by user
 */
export async function isFavorite(userId: string, venueId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('venue_id', venueId)
      .single();

    return !error && !!data;
  } catch (error) {
    return false;
  }
}
