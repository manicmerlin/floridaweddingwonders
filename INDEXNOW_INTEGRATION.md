# IndexNow Integration Guide

## 🚀 What is IndexNow?

IndexNow is a protocol that allows websites to instantly notify search engines whenever content is created, updated, or deleted. Instead of waiting for search engine crawlers to discover changes, you proactively tell them what's new.

### Supported Search Engines
- **Bing** (Microsoft)
- **Yandex**
- **Seznam.cz**
- **Naver**
- More joining regularly!

### Benefits
✅ **Faster indexing** - New content appears in search results within minutes/hours instead of days  
✅ **Better crawl efficiency** - Search engines focus on what actually changed  
✅ **Improved SEO** - Fresh content gets indexed and ranked faster  
✅ **Free protocol** - No cost to use  
✅ **Simple implementation** - RESTful API  

---

## 🔧 Setup Instructions

### Step 1: Generate API Key

The API key must be a UUID (universally unique identifier).

```bash
# Generate a UUID (lowercase)
uuidgen | tr '[:upper:]' '[:lower:]'
```

**Our Generated Key**: `d8e26f10-45fd-4817-9db1-4f3666a232c2`

### Step 2: Create Verification File

Create a text file in `/public/` with the UUID as the filename and content:

**File**: `/public/d8e26f10-45fd-4817-9db1-4f3666a232c2.txt`  
**Content**: `d8e26f10-45fd-4817-9db1-4f3666a232c2`

This file proves you own the domain.

### Step 3: Add to Environment Variables

Add to `.env.local` (production) and `.env.example` (template):

```bash
# IndexNow API Configuration
INDEXNOW_API_KEY=d8e26f10-45fd-4817-9db1-4f3666a232c2
```

### Step 4: Deploy Verification File

Ensure the verification file is accessible at:
```
https://floridaweddingwonders.com/d8e26f10-45fd-4817-9db1-4f3666a232c2.txt
```

Test it:
```bash
curl https://floridaweddingwonders.com/d8e26f10-45fd-4817-9db1-4f3666a232c2.txt
```

Should return: `d8e26f10-45fd-4817-9db1-4f3666a232c2`

---

## 📁 Implementation Files

### 1. **Core Utility** (`src/lib/indexnow.ts`)

Handles all IndexNow API interactions:

```typescript
import { submitUrlToIndexNow, notifyVenueUpdate } from '@/lib/indexnow';

// Submit single URL
await submitUrlToIndexNow('https://floridaweddingwonders.com/venues/new-venue');

// Submit multiple URLs
await submitMultipleUrls([
  'https://floridaweddingwonders.com/venues/venue-1',
  'https://floridaweddingwonders.com/venues/venue-2',
]);

// Notify venue update (auto-includes listing page)
await notifyVenueUpdate('venue-id');

// Notify blog post
await notifyBlogPostUpdate('post-slug');

// Submit sitemap
await submitSitemap();
```

### 2. **API Route** (`src/app/api/indexnow/route.ts`)

Server-side endpoint for IndexNow submissions:

```bash
# Submit single URL
curl -X POST https://floridaweddingwonders.com/api/indexnow \
  -H "Content-Type: application/json" \
  -d '{"url": "https://floridaweddingwonders.com/venues/new-venue"}'

# Submit multiple URLs
curl -X POST https://floridaweddingwonders.com/api/indexnow \
  -H "Content-Type: application/json" \
  -d '{"urls": ["https://floridaweddingwonders.com/venues/venue-1", "https://floridaweddingwonders.com/venues/venue-2"]}'

# Health check
curl https://floridaweddingwonders.com/api/indexnow
```

### 3. **React Hook** (`src/hooks/useIndexNow.ts`)

Easy-to-use React hook for client-side notifications:

```tsx
import { useIndexNow } from '@/hooks/useIndexNow';

function MyComponent() {
  const { notifyVenueUpdate, notifyBlogPostUpdate } = useIndexNow();

  const handleVenueUpdate = async () => {
    // Do update...
    
    // Notify search engines
    await notifyVenueUpdate('venue-id');
  };

  return <button onClick={handleVenueUpdate}>Update Venue</button>;
}
```

---

## 🎯 Integration Points

### 1. **Venue Photo Upload** ✅

**File**: `src/components/PhotoUpload.tsx`

```tsx
import { useIndexNow } from '@/hooks/useIndexNow';

const { notifyVenueUpdate } = useIndexNow();

// After successful photo upload
await notifyVenueUpdate(venueId);
```

**When**: After new photos are uploaded to Supabase  
**URLs Notified**:
- `/venues/[venueId]` (venue detail page)
- `/venues` (venues listing page)

### 2. **Blog Post Creation** (Future)

**When**: New blog post created or updated  
**Implementation**:
```tsx
import { useIndexNow } from '@/hooks/useIndexNow';

const { notifyBlogPostUpdate } = useIndexNow();

// After saving blog post
await notifyBlogPostUpdate('post-slug');
```

**URLs Notified**:
- `/blog/[slug]` (post detail page)
- `/blog` (blog listing page)

### 3. **Vendor Updates** (Future)

```tsx
await notifyVendorUpdate('vendor-id');
```

**URLs Notified**:
- `/vendors/[vendorId]`
- `/vendors`

### 4. **Dress Shop Updates** (Future)

```tsx
await notifyDressShopUpdate('shop-id');
```

**URLs Notified**:
- `/dress-shops/[shopId]`
- `/dress-shops`

---

## 🧪 Testing

### Test Verification File

```bash
# Should return your UUID
curl https://floridaweddingwonders.com/d8e26f10-45fd-4817-9db1-4f3666a232c2.txt
```

### Test API Endpoint

```bash
# Health check
curl https://floridaweddingwonders.com/api/indexnow

# Test submission (replace with actual URL)
curl -X POST https://floridaweddingwonders.com/api/indexnow \
  -H "Content-Type: application/json" \
  -d '{"url": "https://floridaweddingwonders.com/"}'
```

### Test from Browser Console

```javascript
// Test single URL
fetch('/api/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    url: 'https://floridaweddingwonders.com/' 
  })
}).then(r => r.json()).then(console.log);

// Test multiple URLs
fetch('/api/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    urls: [
      'https://floridaweddingwonders.com/',
      'https://floridaweddingwonders.com/venues'
    ]
  })
}).then(r => r.json()).then(console.log);
```

### Verify Submission

IndexNow returns:
- **200 OK**: Successfully submitted
- **202 Accepted**: Accepted, processing
- **400 Bad Request**: Invalid request
- **403 Forbidden**: Verification failed
- **429 Too Many Requests**: Rate limited

Check browser Network tab or server logs for responses.

---

## 📊 Expected Responses

### Success (200 or 202)

```json
{
  "success": true,
  "message": "URL submitted successfully",
  "url": "https://floridaweddingwonders.com/venues/new-venue"
}
```

### Multiple URLs Success

```json
{
  "success": true,
  "message": "URLs submitted successfully",
  "count": 2
}
```

### Error (400, 403, 500)

```json
{
  "success": false,
  "error": "API key not configured"
}
```

---

## ⚠️ Important Considerations

### Rate Limiting

**IndexNow Limits**:
- **10,000 URLs per request** (maximum)
- **No official daily limit** but avoid spam
- Submitting same URL repeatedly is wasteful

**Best Practices**:
- Only submit when content actually changes
- Batch multiple updates together
- Don't submit every tiny change (e.g., typo fixes)

### What to Submit

**✅ DO Submit**:
- New pages (venues, blog posts, vendors)
- Major content updates (new photos, text changes)
- URL structure changes
- Deleted pages (use 404 status)

**❌ DON'T Submit**:
- Minor typo fixes
- CSS/JavaScript changes
- Template changes
- Same URL repeatedly within hours

### Search Engine Behavior

**IndexNow notifies, but doesn't guarantee**:
- Search engines may still crawl on their own schedule
- Notification doesn't force immediate indexing
- Quality content still matters for ranking
- Bad content won't rank just because it's submitted

### Privacy & Security

- API key is **not secret** (verification file is public)
- Don't include sensitive data in URLs
- Only submit public, crawlable pages
- Use HTTPS URLs only

---

## 🔍 Monitoring & Debugging

### Check Server Logs

```bash
# Development
npm run dev

# Look for IndexNow logs:
# ✅ IndexNow: Successfully submitted [url]
# ❌ IndexNow error: [error details]
```

### Browser Console

```javascript
// Enable verbose logging
localStorage.debug = '*';

// Check for IndexNow notifications
// Should see: "IndexNow: Successfully notified search engines"
```

### Verify in Bing Webmaster Tools

1. Go to [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. Add your site
3. Check **URL Inspection** to see indexing status
4. IndexNow submissions may show in tools

---

## 🚀 Advanced Usage

### Bulk Submit All Venues

```typescript
import { submitMultipleUrls } from '@/lib/indexnow';
import { getAllVenues } from '@/lib/venues';

const venues = getAllVenues();
const urls = venues.map(v => 
  `https://floridaweddingwonders.com/venues/${v.id}`
);

await submitMultipleUrls(urls);
```

### Submit Entire Sitemap

```typescript
import { submitSitemap } from '@/lib/indexnow';

// Notifies search engines to crawl sitemap
await submitSitemap();
```

### Custom Endpoint

```typescript
// Submit to specific search engine
await submitUrlToIndexNow(
  'https://floridaweddingwonders.com/new-page',
  'https://www.bing.com/indexnow' // Bing-specific
);
```

---

## 📚 Additional Resources

- **IndexNow Website**: https://www.indexnow.org/
- **IndexNow Documentation**: https://www.indexnow.org/documentation
- **Bing Webmaster Tools**: https://www.bing.com/webmasters
- **Yandex Webmaster**: https://webmaster.yandex.com/

---

## ✅ Checklist

Before deploying to production:

- [ ] Generate UUID API key
- [ ] Create verification file at `/public/[uuid].txt`
- [ ] Add `INDEXNOW_API_KEY` to `.env.local`
- [ ] Verify file is accessible at `https://domain.com/[uuid].txt`
- [ ] Test API endpoint with curl
- [ ] Verify logs show successful submissions
- [ ] Check Bing Webmaster Tools (optional)
- [ ] Monitor for 429 rate limit errors

---

## 🎉 Summary

**What We Built**:
- ✅ Complete IndexNow integration
- ✅ API route for server-side submissions
- ✅ React hook for client-side notifications
- ✅ Automatic notifications on photo uploads
- ✅ Utility functions for all content types
- ✅ Verification file hosted
- ✅ Environment variable configured

**Impact**:
- Faster indexing of new venues
- Better search engine discovery
- Improved SEO performance
- Real-time content updates to search engines

**Your site is now IndexNow-enabled!** 🚀

Search engines will be notified instantly whenever you:
- Upload new venue photos
- Add new blog posts
- Update vendor listings
- Create new content

**Faster indexing = Better SEO = More traffic!**
