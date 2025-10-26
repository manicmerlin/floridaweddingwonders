/**
 * IndexNow API Integration
 * 
 * Automatically notifies search engines (Bing, Yandex, etc.) when content is updated.
 * Helps with faster indexing of new and updated pages.
 * 
 * @see https://www.indexnow.org/
 */

const INDEXNOW_ENDPOINTS = [
  'https://api.indexnow.org/indexnow',
  'https://www.bing.com/indexnow',
  'https://yandex.com/indexnow',
];

export interface IndexNowSubmission {
  url: string;
  timestamp?: number;
}

/**
 * Submit a single URL to IndexNow
 */
export async function submitUrlToIndexNow(
  url: string,
  endpoint: string = INDEXNOW_ENDPOINTS[0]
): Promise<{ success: boolean; error?: string }> {
  try {
    const apiKey = process.env.INDEXNOW_API_KEY;
    
    if (!apiKey) {
      console.error('IndexNow: API key not found in environment variables');
      return { success: false, error: 'API key not configured' };
    }

    const host = new URL(url).hostname;
    const keyLocation = `https://${host}/${apiKey}.txt`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        host,
        key: apiKey,
        keyLocation,
        urlList: [url],
      }),
    });

    // IndexNow returns 200 for success, 202 for accepted
    if (response.status === 200 || response.status === 202) {
      console.log(`IndexNow: Successfully submitted ${url}`);
      return { success: true };
    }

    // Log the response for debugging
    const responseText = await response.text();
    console.error(`IndexNow error: ${response.status} - ${responseText}`);
    
    return { 
      success: false, 
      error: `HTTP ${response.status}: ${responseText}` 
    };
  } catch (error) {
    console.error('IndexNow submission error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Submit multiple URLs to IndexNow (max 10,000 per request)
 */
export async function submitMultipleUrls(
  urls: string[],
  endpoint: string = INDEXNOW_ENDPOINTS[0]
): Promise<{ success: boolean; error?: string; submittedCount?: number }> {
  try {
    const apiKey = process.env.INDEXNOW_API_KEY;
    
    if (!apiKey) {
      console.error('IndexNow: API key not found in environment variables');
      return { success: false, error: 'API key not configured' };
    }

    if (urls.length === 0) {
      return { success: true, submittedCount: 0 };
    }

    // IndexNow allows max 10,000 URLs per request
    const MAX_URLS = 10000;
    if (urls.length > MAX_URLS) {
      urls = urls.slice(0, MAX_URLS);
      console.warn(`IndexNow: Limited submission to ${MAX_URLS} URLs`);
    }

    const host = new URL(urls[0]).hostname;
    const keyLocation = `https://${host}/${apiKey}.txt`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        host,
        key: apiKey,
        keyLocation,
        urlList: urls,
      }),
    });

    if (response.status === 200 || response.status === 202) {
      console.log(`IndexNow: Successfully submitted ${urls.length} URLs`);
      return { success: true, submittedCount: urls.length };
    }

    const responseText = await response.text();
    console.error(`IndexNow error: ${response.status} - ${responseText}`);
    
    return { 
      success: false, 
      error: `HTTP ${response.status}: ${responseText}` 
    };
  } catch (error) {
    console.error('IndexNow batch submission error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Notify search engines of updated venue
 */
export async function notifyVenueUpdate(venueId: string): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://floridaweddingwonders.com';
  const venueUrl = `${baseUrl}/venues/${venueId}`;
  
  // Also notify the venues listing page
  const urls = [
    venueUrl,
    `${baseUrl}/venues`,
  ];

  await submitMultipleUrls(urls);
}

/**
 * Notify search engines of new blog post
 */
export async function notifyBlogPostUpdate(slug: string): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://floridaweddingwonders.com';
  const postUrl = `${baseUrl}/blog/${slug}`;
  
  // Also notify the blog listing page
  const urls = [
    postUrl,
    `${baseUrl}/blog`,
  ];

  await submitMultipleUrls(urls);
}

/**
 * Notify search engines of updated vendor
 */
export async function notifyVendorUpdate(vendorId: string): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://floridaweddingwonders.com';
  const vendorUrl = `${baseUrl}/vendors/${vendorId}`;
  
  const urls = [
    vendorUrl,
    `${baseUrl}/vendors`,
  ];

  await submitMultipleUrls(urls);
}

/**
 * Notify search engines of updated dress shop
 */
export async function notifyDressShopUpdate(shopId: string): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://floridaweddingwonders.com';
  const shopUrl = `${baseUrl}/dress-shops/${shopId}`;
  
  const urls = [
    shopUrl,
    `${baseUrl}/dress-shops`,
  ];

  await submitMultipleUrls(urls);
}

/**
 * Submit sitemap to IndexNow for bulk indexing
 */
export async function submitSitemap(): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://floridaweddingwonders.com';
  const sitemapUrl = `${baseUrl}/sitemap.xml`;
  
  await submitUrlToIndexNow(sitemapUrl);
}

/**
 * Get all available IndexNow endpoints
 */
export function getIndexNowEndpoints(): string[] {
  return [...INDEXNOW_ENDPOINTS];
}

/**
 * Validate IndexNow API key format (should be a UUID)
 */
export function validateApiKey(key: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(key);
}
