# Manual Google Image Collection Guide

## Overview
Since automated Google scraping is blocked, this guide helps you manually collect venue images efficiently.

## Files Created
1. `venue-image-collection-template.csv` - Template for manual URL entry
2. `processManualImages.js` - Script to process completed CSV

## Step-by-Step Process

### 1. Open the CSV Template
Open `venue-image-collection-template.csv` in Excel, Google Sheets, or any spreadsheet app.

### 2. For Each Venue (focus on those marked "NEEDS_IMAGES"):
1. Click the Google Maps URL in column C
2. Look for the main venue photo
3. Right-click on the photo → "Copy image address"
4. Paste the URL in column E (Image URL 1)
5. Optionally, find 2-3 more photos and add to columns F and G

### 3. Pro Tips for Finding Images:
- Use the venue's official website (column D)
- Search "[Venue Name] wedding photos" in Google Images
- Look for professional wedding photography on their social media
- Check wedding blogs featuring the venue

### 4. Image Quality Guidelines:
- Choose high-resolution images (at least 800x600)
- Prefer professional photography over phone photos
- Look for images showing the venue setup for events
- Avoid images with heavy watermarks

### 5. Process the Images:
Once you've added image URLs to the CSV, run:
```bash
node processManualImages.js
```

## Alternative Sources
If Google Images doesn't work well:
- **Venue websites** (usually have professional photos)
- **Wedding blogs** (search "[venue name] wedding")
- **Social media** (Instagram, Facebook)
- **Photography databases** (WeddingWire, The Knot)

## Batch Processing Tips
- Focus on venues marked "NEEDS_IMAGES" first
- You can process partial CSV files (leave some rows empty)
- The script handles missing/empty image URLs gracefully
- Images are automatically downloaded and resized appropriately

## Troubleshooting
- If an image URL doesn't work, try saving the image locally first
- Some URLs expire quickly - process soon after collecting
- Large images may take time to download
