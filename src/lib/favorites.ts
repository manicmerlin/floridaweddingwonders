'use client';

import { Venue } from '../types';

export interface SavedVenue {
  venueId: string;
  venueName: string;
  savedAt: string;
  venue?: Venue; // Full venue data when available
}

export class FavoritesManager {
  private static STORAGE_KEY = 'savedVenues';

  // Get all saved venues for current user
  static getSavedVenues(userEmail: string): SavedVenue[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const saved = localStorage.getItem(`${this.STORAGE_KEY}_${userEmail}`);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading saved venues:', error);
      return [];
    }
  }

  // Save a venue to favorites
  static saveVenue(userEmail: string, venue: Venue): boolean {
    if (typeof window === 'undefined') return false;
    
    try {
      const saved = this.getSavedVenues(userEmail);
      
      // Check if already saved
      if (saved.some(item => item.venueId === venue.id)) {
        return false; // Already saved
      }

      const newSaved: SavedVenue = {
        venueId: venue.id,
        venueName: venue.name,
        savedAt: new Date().toISOString(),
        venue: venue
      };

      saved.push(newSaved);
      localStorage.setItem(`${this.STORAGE_KEY}_${userEmail}`, JSON.stringify(saved));
      return true;
    } catch (error) {
      console.error('Error saving venue:', error);
      return false;
    }
  }

  // Remove a venue from favorites
  static removeSavedVenue(userEmail: string, venueId: string): boolean {
    if (typeof window === 'undefined') return false;
    
    try {
      const saved = this.getSavedVenues(userEmail);
      const filtered = saved.filter(item => item.venueId !== venueId);
      
      if (filtered.length === saved.length) {
        return false; // Venue wasn't saved
      }

      localStorage.setItem(`${this.STORAGE_KEY}_${userEmail}`, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Error removing saved venue:', error);
      return false;
    }
  }

  // Check if a venue is saved
  static isVenueSaved(userEmail: string, venueId: string): boolean {
    if (typeof window === 'undefined') return false;
    
    const saved = this.getSavedVenues(userEmail);
    return saved.some(item => item.venueId === venueId);
  }

  // Get count of saved venues
  static getSavedVenuesCount(userEmail: string): number {
    return this.getSavedVenues(userEmail).length;
  }

  // Toggle venue save status
  static toggleVenue(userEmail: string, venue: Venue): boolean {
    if (this.isVenueSaved(userEmail, venue.id)) {
      this.removeSavedVenue(userEmail, venue.id);
      return false; // Now unsaved
    } else {
      this.saveVenue(userEmail, venue);
      return true; // Now saved
    }
  }
}
