import { useEffect } from 'react';

// Hook to automatically track venue page views
export function useVenueAnalytics(venueId: string | null) {
  useEffect(() => {
    if (!venueId) return;

    // Track page view
    const trackPageView = async () => {
      try {
        await fetch('/api/venue-analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            venueId,
            action: 'page_view'
          }),
        });
      } catch (error) {
        // Silently fail - analytics shouldn't break the app
        console.debug('Analytics tracking failed:', error);
      }
    };

    trackPageView();
  }, [venueId]);
}

// Function to track specific actions
export async function trackVenueAction(
  venueId: string,
  action: 'phone_click' | 'email_click' | 'website_click' | 'photo_view' | 'gallery_open' | 'save_venue' | 'share',
  actionValue?: string
) {
  try {
    await fetch('/api/venue-analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        venueId,
        action,
        actionValue
      }),
    });
  } catch (error) {
    // Silently fail
    console.debug('Action tracking failed:', error);
  }
}
