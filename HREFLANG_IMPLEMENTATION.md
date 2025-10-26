# Hreflang Implementation Guide

## 🌍 Multilingual SEO with Hreflang Tags

Hreflang tags tell search engines about language and regional variations of your pages, ensuring users see the correct language version in search results.

## ✅ What We Implemented

### 1. **Core Infrastructure**

**Updated `/src/lib/seo.ts`**:
- Added `languages` and `defaultLanguage` to SITE_CONFIG
- Created `generateHreflangLinks(path)` function
- Generates hreflang tags for English, Spanish, and x-default

**Updated `/src/components/SEO.tsx`**:
- Added `path` parameter to SEO component
- Automatically generates and injects hreflang tags
- Adds `og:locale` and `og:locale:alternate` for Open Graph
- Cleans up old hreflang tags before adding new ones

**Updated `/src/app/layout.tsx`**:
- Added static hreflang tags for the root layout
- Points to English (default) and Spanish versions
- Includes x-default fallback

### 2. **Hreflang Structure**

For every page, we generate these tags:

```html
<!-- x-default: Fallback for unspecified languages -->
<link rel="alternate" hreflang="x-default" href="https://floridaweddingwonders.com/" />

<!-- English version (default) -->
<link rel="alternate" hreflang="en" href="https://floridaweddingwonders.com/" />

<!-- Spanish version (future) -->
<link rel="alternate" hreflang="es" href="https://floridaweddingwonders.com/es/" />
```

### 3. **Page-Specific Implementation**

**Home Page** (`/`):
```html
<link rel="alternate" hreflang="x-default" href="https://floridaweddingwonders.com/" />
<link rel="alternate" hreflang="en" href="https://floridaweddingwonders.com/" />
<link rel="alternate" hreflang="es" href="https://floridaweddingwonders.com/es/" />
```

**Venues Page** (`/venues`):
```html
<link rel="alternate" hreflang="x-default" href="https://floridaweddingwonders.com/venues" />
<link rel="alternate" hreflang="en" href="https://floridaweddingwonders.com/venues" />
<link rel="alternate" hreflang="es" href="https://floridaweddingwonders.com/es/venues" />
```

**Individual Venue** (`/venues/123`):
```html
<link rel="alternate" hreflang="x-default" href="https://floridaweddingwonders.com/venues/123" />
<link rel="alternate" hreflang="en" href="https://floridaweddingwonders.com/venues/123" />
<link rel="alternate" hreflang="es" href="https://floridaweddingwonders.com/es/venues/123" />
```

## 🎯 Benefits

### 1. **Better International SEO**
- Google shows the correct language version to users
- Prevents duplicate content issues across languages
- Improves rankings in language-specific searches

### 2. **User Experience**
- Spanish speakers automatically see Spanish version
- No confusion about which version to visit
- Consistent URL structure across languages

### 3. **Future-Proof**
- Easy to add more languages (Portuguese, French, etc.)
- Structured for regional variants (es-MX, es-ES, etc.)
- Scalable architecture

## 🧪 Testing Hreflang Implementation

### 1. **Check HTML Source**

View page source and look for hreflang tags in `<head>`:

```bash
# Home page
curl -s https://floridaweddingwonders.com | grep hreflang

# Expected output:
<link rel="alternate" hreflang="x-default" href="https://floridaweddingwonders.com/" />
<link rel="alternate" hreflang="en" href="https://floridaweddingwonders.com/" />
<link rel="alternate" hreflang="es" href="https://floridaweddingwonders.com/es/" />
```

### 2. **Google Search Console**

1. Go to: https://search.google.com/search-console
2. Select your property
3. Navigate to: **Enhancements → International Targeting**
4. Check for hreflang errors
5. Verify language/region targeting

### 3. **Hreflang Testing Tools**

**Merkle Hreflang Tags Testing Tool:**
```
https://technicalseo.com/tools/hreflang/
```
- Enter your URL
- Verifies bidirectional linking
- Checks for common errors

**Ahrefs Hreflang Tag Checker:**
```
https://ahrefs.com/hreflang-tags-generator
```
- Tests implementation
- Identifies missing tags
- Validates syntax

### 4. **Browser DevTools**

```javascript
// Open console and run:
document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(link => {
  console.log(link.hreflang + ': ' + link.href);
});

// Expected output:
// x-default: https://floridaweddingwonders.com/
// en: https://floridaweddingwonders.com/
// es: https://floridaweddingwonders.com/es/
```

## 📝 How to Use in New Pages

### For Client-Side Pages:

```tsx
import SEO from '@/components/SEO';

export default function MyPage() {
  return (
    <>
      <SEO
        title="My Page Title"
        description="Page description"
        canonical="https://floridaweddingwonders.com/my-page"
        path="/my-page"  // ← Add this for hreflang
        keywords={['keyword1', 'keyword2']}
      />
      
      {/* Your content */}
    </>
  );
}
```

### For Dynamic Routes:

```tsx
import { useParams } from 'next/navigation';
import SEO from '@/components/SEO';

export default function VenueDetailPage() {
  const params = useParams();
  const venueId = params.id as string;
  
  return (
    <>
      <SEO
        title={`${venue.name} - Wedding Venue`}
        description={venue.description}
        path={`/venues/${venueId}`}  // ← Dynamic path
      />
      
      {/* Your content */}
    </>
  );
}
```

## 🌐 Adding More Languages

### Step 1: Update SITE_CONFIG

```typescript
// src/lib/seo.ts
export const SITE_CONFIG = {
  // ...
  languages: ['en', 'es', 'pt', 'fr'], // Add more languages
  defaultLanguage: 'en',
};
```

### Step 2: Update generateHreflangLinks

```typescript
export function generateHreflangLinks(path: string = '/'): Array<{
  hreflang: string;
  href: string;
}> {
  const baseUrl = SITE_CONFIG.url;
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  return [
    // x-default (fallback)
    { hreflang: 'x-default', href: `${baseUrl}/${cleanPath}` },
    
    // English
    { hreflang: 'en', href: `${baseUrl}/${cleanPath}` },
    
    // Spanish
    { hreflang: 'es', href: `${baseUrl}/es/${cleanPath}` },
    
    // Portuguese (new)
    { hreflang: 'pt', href: `${baseUrl}/pt/${cleanPath}` },
    
    // French (new)
    { hreflang: 'fr', href: `${baseUrl}/fr/${cleanPath}` },
  ];
}
```

### Step 3: Create Language Routes

```
/app/es/          → Spanish homepage
/app/es/venues/   → Spanish venues
/app/pt/          → Portuguese homepage
/app/pt/venues/   → Portuguese venues
```

## 🚨 Common Hreflang Mistakes (We Avoid)

### ❌ **Missing Return Links**
- **Problem**: English page links to Spanish, but Spanish doesn't link back
- **Our Solution**: `generateHreflangLinks()` ensures all pages have all links

### ❌ **Self-Referencing Errors**
- **Problem**: English page doesn't include itself in hreflang
- **Our Solution**: Every page includes `hreflang="en"` pointing to itself

### ❌ **Missing x-default**
- **Problem**: No fallback for unspecified languages
- **Our Solution**: Always includes `hreflang="x-default"`

### ❌ **Incorrect URL Format**
- **Problem**: Relative URLs or wrong protocol
- **Our Solution**: Always uses absolute URLs with HTTPS

### ❌ **Conflicting Canonical Tags**
- **Problem**: Canonical points to different language
- **Our Solution**: Canonical always points to current language version

## 📊 Expected SEO Impact

### Short-term (1-2 months):
- ✅ Proper indexing of language versions
- ✅ No duplicate content penalties
- ✅ Correct language shown in search results

### Medium-term (3-6 months):
- ✅ Improved rankings for Spanish keywords
- ✅ Higher CTR from Spanish-speaking users
- ✅ Better international visibility

### Long-term (6+ months):
- ✅ Expanded international market share
- ✅ Reduced bounce rate from language mismatch
- ✅ Higher conversion rates per language

## 🔍 Monitoring Hreflang

### Weekly Checks:
- [ ] Google Search Console → International Targeting
- [ ] Check for hreflang errors
- [ ] Verify new pages have correct tags

### Monthly Analysis:
- [ ] Traffic by language (Google Analytics)
- [ ] Rankings in different countries
- [ ] Conversion rates per language
- [ ] Bounce rate by language

## 📚 Resources

**Google Documentation:**
- https://developers.google.com/search/docs/specialty/international/localized-versions

**Hreflang Best Practices:**
- https://ahrefs.com/blog/hreflang-tags/

**Testing Tools:**
- Google Search Console
- https://technicalseo.com/tools/hreflang/
- https://ahrefs.com/hreflang-tags-generator

---

## 🎯 Current Status

**Implemented:**
- ✅ English version (default) - `hreflang="en"`
- ✅ Spanish version (placeholder) - `hreflang="es"`
- ✅ x-default fallback
- ✅ Bidirectional linking on all pages
- ✅ Dynamic hreflang generation
- ✅ Open Graph locale tags

**Next Steps:**
1. Create `/es/` route structure
2. Translate content to Spanish
3. Test with Spanish-speaking users
4. Monitor Search Console for errors
5. Add regional variants (es-MX, es-ES) if needed

**Ready to add Spanish content:** The infrastructure is in place! 🎊
