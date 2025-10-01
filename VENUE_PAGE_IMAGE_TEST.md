# 🧪 Test: Images Showing on Venue Page

## The Issue
After uploading images in the venue management page, they don't appear on the venue's public page.

## Debug Steps

### Step 1: Upload an Image
1. Go to: http://localhost:3000/venues/1000/manage
2. Open Browser Console (F12)
3. Click "Photos" tab
4. Select and upload an image
5. **Watch console logs carefully**

### Step 2: Check What Gets Saved
After upload completes, look for these console logs:

```
💾 updateVenueInMockData for venue: 1000
   Saving 1 photos
   Photo URLs: ["blob:http://localhost:3000/..."]
✅ Photos saved to localStorage venue-photos
✅ Updated existing venue in venues-data (or: Venue not found...)
✅ updateVenueInMockData completed successfully
```

### Step 3: Verify localStorage
In the console, run:
```javascript
// Check what's stored
const venuePhotos = JSON.parse(localStorage.getItem('venue-photos') || '{}');
console.log('Stored photos:', venuePhotos);
console.log('Photos for venue 1000:', venuePhotos['1000']);
```

You should see something like:
```json
{
  "1000": [
    {
      "id": "img_1696198847123_abc123",
      "url": "blob:http://localhost:3000/...",
      "alt": "spanish monastery",
      "isPrimary": true,
      "type": "image"
    }
  ]
}
```

### Step 4: Navigate to Venue Page
1. Click "View Public Page" button (or navigate to http://localhost:3000/venues/1000)
2. **Watch console logs**

Look for:
```
🔍 loadVenuePhotosFromStorage for venue: 1000
   Found photos: 1
   Photo URLs: ["blob:http://localhost:3000/..."]
Loading stored photos for venue: Ancient Spanish Monastery [...photos...]
```

### Step 5: Check if Image Displays
- ✅ **SUCCESS**: Image appears in the photo gallery
- ❌ **FAIL**: Image doesn't appear or shows placeholder

## Common Issues & Solutions

### Issue 1: "Found photos: 0" on venue page
**Problem**: Photos aren't being loaded from localStorage

**Solution**: Check venue ID mismatch
```javascript
// In console on manage page
console.log('Current venue ID:', venueId);

// In console on venue page
console.log('Looking for venue ID:', params.id);
```

If they don't match, that's the problem!

### Issue 2: Blob URLs don't work across pages
**Problem**: Blob URLs are page-specific and don't persist

**This is expected behavior in development mode!**

Blob URLs only work within the same browser session and page context. When you navigate to a different page, the blob URL becomes invalid.

**Solution Options:**

**Option A: Test on Same Page (Temporary)**
Instead of navigating away, refresh the management page and check if images persist there.

**Option B: Use Data URLs (Better for Dev)**
We need to convert images to data URLs instead of blob URLs for cross-page persistence.

**Option C: Production Setup (Best)**
In production, images will be uploaded to cloud storage and get real URLs that work everywhere.

### Issue 3: Images show on manage page but not venue page
**Problem**: The venue page might not be checking localStorage properly

**Check**: Look at the venue page console logs. If you see:
```
🔍 loadVenuePhotosFromStorage: Server-side, returning empty array
```

This means the code is running on the server where localStorage doesn't exist. The page needs to load photos client-side.

## The Root Problem: Blob URLs

**Blob URLs are temporary and page-specific!**

When you:
1. Upload image on `/venues/1000/manage` → Creates blob URL `blob:...abc123`
2. Navigate to `/venues/1000` → New page, blob URL `abc123` is invalid!

### Quick Fix for Testing
Convert blob URLs to data URLs so they work across pages:

Run this in console after uploading:
```javascript
async function convertBlobToDataURL() {
  const venuePhotos = JSON.parse(localStorage.getItem('venue-photos') || '{}');
  const photos = venuePhotos['1000'];
  
  for (let photo of photos) {
    if (photo.url.startsWith('blob:')) {
      const response = await fetch(photo.url);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        photo.url = reader.result;
        console.log('Converted to data URL');
      };
      reader.readAsDataURL(blob);
    }
  }
  
  // Wait a moment then save
  setTimeout(() => {
    localStorage.setItem('venue-photos', JSON.stringify(venuePhotos));
    console.log('✅ Saved with data URLs');
  }, 1000);
}

convertBlobToDataURL();
```

Then navigate to the venue page and it should work!

## Permanent Solution Needed

We need to update the code to use data URLs instead of blob URLs for development mode. This would make images persist across pages.

### Code Change Required
In `imageUpload.ts`, instead of:
```typescript
const url = URL.createObjectURL(blob); // Creates blob URL
```

Use:
```typescript
// Convert to data URL for cross-page persistence
const dataUrl = await new Promise((resolve) => {
  const reader = new FileReader();
  reader.onloadend = () => resolve(reader.result);
  reader.readAsDataURL(blob);
});
```

## Expected Console Output (Full Flow)

### On Management Page (Upload):
```
📁 Processing 1 file(s)...
🖼️  Processing as image...
✅ Image processed successfully: temp-123
📤 Starting upload of 1 file(s)...
✅ Image uploaded successfully (development mode): img_123
💾 updateVenueInMockData for venue: 1000
   Saving 1 photos
✅ Photos saved to localStorage venue-photos
✅ updateVenueInMockData completed successfully
```

### On Venue Page (View):
```
Looking for venue with ID: 1000
🔍 loadVenuePhotosFromStorage for venue: 1000
   Found photos: 1
   Photo URLs: ["blob:http://localhost:3000/..."]
Loading stored photos for venue: Ancient Spanish Monastery
Found venue: Ancient Spanish Monastery
```

---

**Current Status**: Blob URLs don't persist across page navigations
**Temporary Fix**: Use the data URL conversion script above
**Permanent Fix**: Update code to use data URLs in development mode
**Production**: Will use real cloud storage URLs
