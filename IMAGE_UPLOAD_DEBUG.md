# 🔍 Image Upload Debugging Guide

## Recent Changes (October 1, 2025)

We've added comprehensive error handling and logging to the image upload system to help identify issues.

## How to Debug Image Upload Errors

### 1. Open Browser Console
- **Chrome/Edge**: Press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
- **Safari**: Enable Developer Menu, then `Cmd+Option+C`
- Look for the **Console** tab

### 2. Look for Upload Logs

When you upload an image, you'll now see detailed logs:

```
📁 Processing 1 file(s)...
📁 Processing file 1/1: spanish-monastery.jpg image/jpeg 2458932 bytes
🖼️  Processing as image...
✅ Image processed successfully: temp-1696198847123-abc123
📤 Starting upload of 1 file(s)...
✅ Image uploaded successfully (development mode): blob:http://localhost:3000/...
✅ Upload complete. Success: 1 Failed: 0
```

### 3. Common Error Messages

#### ❌ File Too Large
```
Error: Image file too large. Maximum size: 10.0MB
```
**Solution**: Resize or compress the image before uploading

#### ❌ Invalid File Type
```
Error: Invalid image type. Allowed types: image/jpeg, image/jpg, image/png, image/webp
```
**Solution**: Convert image to JPG, PNG, or WebP format

#### ❌ Upload Failed
```
❌ Upload to cloud storage failed
```
**Solution**: Check browser console for detailed error. May be a network issue.

#### ❌ Processing Error
```
Failed to process image.jpg. Please try again.
```
**Solution**: Image may be corrupted. Try a different file.

## Testing the Upload System

### Step 1: Select an Image
1. Go to venue management page: `http://localhost:3000/venues/[venue-id]/manage`
2. Click the "Photos" tab
3. Click "Select Files" or drag an image

### Step 2: Check Preview
- Image should appear with "Pending Upload" badge
- Check console for: `✅ Image processed successfully`

### Step 3: Upload
1. Click "Upload Files" button
2. Watch console for upload progress
3. Should see: `✅ Successfully uploaded X file(s)!`

### Step 4: Verify
- "Pending Upload" badge should disappear
- Image should remain visible in the gallery
- Can now set as primary or remove

## File Requirements

### Images
- **Formats**: JPG, PNG, WebP
- **Max Size**: 10 MB
- **Recommended**: 1200px wide minimum
- **Best**: 2048x2048 max, 80% quality

### Videos
- **Formats**: MP4, MOV, WebM, AVI
- **Max Size**: 100 MB
- **Recommended**: Under 30 seconds

## Troubleshooting Steps

### If Upload Button Doesn't Appear
- Make sure you've selected at least one file
- Check that file appears in the gallery with "Pending Upload" badge

### If Upload Fails Silently
1. Open browser console (F12)
2. Look for red error messages (❌)
3. Check Network tab for failed requests
4. Verify file meets size/type requirements

### If Image Appears Broken After Upload
1. Check console for the uploaded URL
2. Verify the blob URL is valid (starts with `blob:`)
3. Try refreshing the page
4. Check localStorage for saved photos

### Clear Cached Data
If things seem stuck:
```javascript
// In browser console
localStorage.removeItem('venue-photos');
localStorage.removeItem('venue-photo-updates');
location.reload();
```

## Current Limitations (Development Mode)

- Images are stored as blob URLs (temporary, in-memory)
- Page refresh will lose uploaded images
- Production will use permanent cloud storage
- localStorage is used to simulate persistence

## Next Steps for Production

1. **Setup Cloud Storage**
   - AWS S3, Cloudinary, or similar
   - Update `uploadToCloudStorage()` function
   - Add proper authentication

2. **Database Integration**
   - Store image metadata in Supabase
   - Link images to venue records
   - Track upload history

3. **Image Optimization**
   - Server-side image processing
   - Multiple size variants (thumbnails, etc.)
   - WebP conversion for better performance

## Need Help?

Check the console logs first! The new logging will tell you exactly what's happening during upload.

Common questions:
- **"Where are images stored?"** - Currently blob URLs in memory, will be cloud storage in production
- **"Why does it disappear on refresh?"** - Development mode limitation, production will persist
- **"Can I upload videos?"** - Yes! Same process, videos get thumbnails automatically
- **"What's the free tier limit?"** - 3 files total (images + videos)
- **"How to get more space?"** - Premium subscription for unlimited uploads

---

**Last Updated**: October 1, 2025
**Version**: 2.0 with enhanced error handling
