/**
 * React hook for IndexNow notifications
 * 
 * Provides easy-to-use functions for notifying search engines of content updates
 */

import { useCallback } from 'react';

interface IndexNowHookReturn {
  notifyVenueUpdate: (venueId: string) => Promise<void>;
  notifyBlogPostUpdate: (slug: string) => Promise<void>;
  notifyVendorUpdate: (vendorId: string) => Promise<void>;
  notifyDressShopUpdate: (shopId: string) => Promise<void>;
  notifyUrl: (url: string) => Promise<void>;
  notifyUrls: (urls: string[]) => Promise<void>;
}

export function useIndexNow(): IndexNowHookReturn {
  const notifyUrl = useCallback(async (url: string): Promise<void> => {
    try {
      const response = await fetch('/api/indexnow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('IndexNow notification failed:', error);
      } else {
        console.log('IndexNow: Successfully notified search engines about:', url);
      }
    } catch (error) {
      console.error('IndexNow notification error:', error);
    }
  }, []);

  const notifyUrls = useCallback(async (urls: string[]): Promise<void> => {
    try {
      const response = await fetch('/api/indexnow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ urls }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('IndexNow notification failed:', error);
      } else {
        console.log(`IndexNow: Successfully notified search engines about ${urls.length} URLs`);
      }
    } catch (error) {
      console.error('IndexNow notification error:', error);
    }
  }, []);

  const notifyVenueUpdate = useCallback(async (venueId: string): Promise<void> => {
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_SITE_URL || 'https://floridaweddingwonders.com';
    
    const urls = [
      `${baseUrl}/venues/${venueId}`,
      `${baseUrl}/venues`,
    ];

    await notifyUrls(urls);
  }, [notifyUrls]);

  const notifyBlogPostUpdate = useCallback(async (slug: string): Promise<void> => {
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_SITE_URL || 'https://floridaweddingwonders.com';
    
    const urls = [
      `${baseUrl}/blog/${slug}`,
      `${baseUrl}/blog`,
    ];

    await notifyUrls(urls);
  }, [notifyUrls]);

  const notifyVendorUpdate = useCallback(async (vendorId: string): Promise<void> => {
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_SITE_URL || 'https://floridaweddingwonders.com';
    
    const urls = [
      `${baseUrl}/vendors/${vendorId}`,
      `${baseUrl}/vendors`,
    ];

    await notifyUrls(urls);
  }, [notifyUrls]);

  const notifyDressShopUpdate = useCallback(async (shopId: string): Promise<void> => {
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_SITE_URL || 'https://floridaweddingwonders.com';
    
    const urls = [
      `${baseUrl}/dress-shops/${shopId}`,
      `${baseUrl}/dress-shops`,
    ];

    await notifyUrls(urls);
  }, [notifyUrls]);

  return {
    notifyVenueUpdate,
    notifyBlogPostUpdate,
    notifyVendorUpdate,
    notifyDressShopUpdate,
    notifyUrl,
    notifyUrls,
  };
}
