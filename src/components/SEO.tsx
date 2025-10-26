/**
 * SEO Component for Client-Side Pages
 * 
 * Injects meta tags into the document head for client-side rendered pages
 */

'use client';

import { useEffect } from 'react';
import { SITE_CONFIG } from '@/lib/seo';

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  keywords?: string[];
  noindex?: boolean;
  jsonLd?: object | object[];
}

export default function SEO({
  title,
  description,
  canonical,
  ogImage = `${SITE_CONFIG.url}/images/og-default.jpg`,
  ogType = 'website',
  keywords = [],
  noindex = false,
  jsonLd,
}: SEOProps) {
  const fullTitle = title.includes(SITE_CONFIG.name) ? title : `${title} | ${SITE_CONFIG.name}`;
  const url = canonical || SITE_CONFIG.url;

  useEffect(() => {
    // Update document title
    document.title = fullTitle;
    
    // Helper function to update or create meta tag
    const updateMetaTag = (selector: string, attribute: string, content: string) => {
      let element = document.querySelector(selector) as HTMLMetaElement;
      if (!element) {
        element = document.createElement('meta');
        if (selector.includes('property=')) {
          element.setAttribute('property', selector.match(/property="([^"]+)"/)?.[1] || '');
        } else {
          element.setAttribute('name', selector.match(/name="([^"]+)"/)?.[1] || '');
        }
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };
    
    // Update meta tags
    updateMetaTag('meta[name="description"]', 'content', description);
    
    if (keywords.length > 0) {
      updateMetaTag('meta[name="keywords"]', 'content', keywords.join(', '));
    }
    
    updateMetaTag('meta[name="robots"]', 'content', 
      noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    );
    
    // Open Graph
    updateMetaTag('meta[property="og:title"]', 'content', fullTitle);
    updateMetaTag('meta[property="og:description"]', 'content', description);
    updateMetaTag('meta[property="og:url"]', 'content', url);
    updateMetaTag('meta[property="og:type"]', 'content', ogType);
    updateMetaTag('meta[property="og:image"]', 'content', ogImage);
    updateMetaTag('meta[property="og:site_name"]', 'content', SITE_CONFIG.name);
    
    // Twitter Card
    updateMetaTag('meta[name="twitter:card"]', 'content', 'summary_large_image');
    updateMetaTag('meta[name="twitter:title"]', 'content', fullTitle);
    updateMetaTag('meta[name="twitter:description"]', 'content', description);
    updateMetaTag('meta[name="twitter:image"]', 'content', ogImage);
    
    // Canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', url);
    
    // JSON-LD
    if (jsonLd) {
      const scriptId = 'json-ld-script';
      let script = document.getElementById(scriptId) as HTMLScriptElement;
      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(Array.isArray(jsonLd) ? jsonLd : [jsonLd]);
    }
  }, [fullTitle, description, url, ogImage, ogType, keywords, noindex, jsonLd]);

  return null;
}
