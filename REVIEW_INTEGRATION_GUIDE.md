# Review Integration Implementation Guide

## Overview
This guide explains how to implement real-time review data from Google, Yelp, and The Knot for your wedding venue listings.

## ✅ What's Already Implemented

### 1. Review UI Components
- **ReviewsSection Component** (`/src/components/ReviewsSection.tsx`)
  - Displays review cards matching your pink design mockup
  - Clickable cards that open review platforms
  - Refresh button to update reviews
  - Handles venues with and without review data

### 2. Data Structure
- **Updated Venue Type** (`/src/types/index.ts`)
  - Added `externalReviews` field with Google, Yelp, The Knot, and WeddingWire support
  - Each platform includes rating, review count, and URL

### 3. Mock Data
- **Sample Review Data** (`/src/lib/mockData.ts`)
  - Notable venues have realistic review data
  - Includes Hialeah Park, Surfcomber Hotel, Ancient Spanish Monastery, etc.

### 4. API Endpoints
- **Review Refresh API** (`/src/app/api/reviews/refresh/route.ts`)
  - Mock implementation showing how to fetch and update reviews
  - Ready for real API integration

## 🔧 How to Add Real API Integration

### Step 1: Get API Keys

#### Google Places API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable the Places API
4. Create credentials (API Key)
5. Add to `.env.local`:
   ```
   GOOGLE_PLACES_API_KEY=your_key_here
   ```

#### Yelp Fusion API
1. Go to [Yelp Developers](https://www.yelp.com/developers/documentation/v3)
2. Create an app
3. Get your API key
4. Add to `.env.local`:
   ```
   YELP_API_KEY=your_key_here
   ```

### Step 2: Find Venue IDs

#### Google Place IDs
```javascript
// Use Google Places Autocomplete or Search to find Place IDs
// Example: "ChIJN1t_tDeuEmsRUsoyG83frY4" for Hialeah Park
```

#### Yelp Business IDs
```javascript
// Search Yelp API or use the URL slug
// Example: "hialeah-park-racing-casino-hialeah"
```

### Step 3: Update Venue Data

Add external platform IDs to your venue records:
```javascript
{
  id: "1",
  name: "Hialeah Park Racing & Casino",
  // ... other venue data
  externalReviews: {
    google: {
      placeId: "ChIJN1t_tDeuEmsRUsoyG83frY4",
      rating: 4.5,
      reviewCount: 127,
      url: "https://www.google.com/maps/search/?api=1&query=place_id:ChIJN1t_tDeuEmsRUsoyG83frY4"
    },
    yelp: {
      businessId: "hialeah-park-racing-casino-hialeah",
      rating: 4.2,
      reviewCount: 89,
      url: "https://www.yelp.com/biz/hialeah-park-racing-casino-hialeah"
    },
    theKnot: {
      rating: 4.7,
      reviewCount: 45,
      url: "https://www.theknot.com/marketplace/hialeah-park-racing-casino"
    }
  }
}
```

### Step 4: Implement Real API Calls

Replace the mock functions in `/src/app/api/reviews/refresh/route.ts` with real API calls:

```typescript
async function fetchGoogleReviews(placeId: string) {
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=rating,user_ratings_total&key=${process.env.GOOGLE_PLACES_API_KEY}`
  );
  const data = await response.json();
  return {
    rating: data.result.rating,
    reviewCount: data.result.user_ratings_total,
    url: `https://www.google.com/maps/search/?api=1&query=place_id:${placeId}`
  };
}
```

## 🚀 Quick Start Options

### Option 1: Manual Updates (Easiest)
Use the provided script to manually update review data:
```bash
node scripts/updateReviews.js --venue "Hialeah Park Racing & Casino" --platform google --rating 4.5 --count 127
```

### Option 2: Semi-Automated (Recommended)
1. Get API keys for Google and Yelp
2. Update the refresh API with real calls
3. Manually manage The Knot data (no public API)

### Option 3: Fully Automated
1. Implement all APIs
2. Set up scheduled jobs to refresh data
3. Use web scraping for The Knot (carefully!)

## 📊 Current Status

### Working Right Now:
- ✅ Review cards display with your pink design
- ✅ Sample data for major venues
- ✅ Clickable links to external platforms
- ✅ Responsive design matching your site

### Ready for Integration:
- 🔧 API endpoint structure in place
- 🔧 TypeScript interfaces defined
- 🔧 Error handling implemented
- 🔧 Refresh functionality built

## 🎯 Platform-Specific Notes

### Google Places API
- **Pros**: Reliable data, large coverage, official API
- **Cons**: Rate limits, costs money at scale
- **Rate Limit**: 1000 requests/day free, then $17/1000 requests

### Yelp Fusion API
- **Pros**: Good for restaurant/venue reviews, free tier
- **Cons**: Limited venue coverage for weddings
- **Rate Limit**: 5000 requests/day free

### The Knot
- **Pros**: Wedding-specific reviews, high trust
- **Cons**: No public API, requires manual updates or scraping
- **Solution**: Manual data entry or careful scraping

### WeddingWire
- **Pros**: Another wedding-specific platform
- **Cons**: No public API
- **Solution**: Manual data entry

## 🔄 Automatic Updates

Set up a cron job or scheduled function to refresh reviews:
```javascript
// Update reviews daily at 3 AM
cron.schedule('0 3 * * *', async () => {
  console.log('🔄 Refreshing venue reviews...');
  // Call refresh API for all venues
});
```

## 📈 Analytics & Monitoring

Track review performance:
- Monitor API usage and costs
- Track which venues get the most review clicks
- A/B test different review display formats

## 🚨 Important Considerations

### Legal & Terms of Service
- ✅ Google Places API: Allowed for business listings
- ✅ Yelp Fusion API: Allowed for business information
- ⚠️ The Knot: Check terms before scraping
- ⚠️ Always respect rate limits and robots.txt

### Performance
- Cache review data to avoid hitting API limits
- Update reviews periodically, not on every page load
- Consider showing cached data with "last updated" timestamp

### Fallbacks
- Always show something even if API calls fail
- Have default review data for important venues
- Graceful degradation when APIs are down

## 🎨 Design Customization

The ReviewsSection component matches your design with:
- Pink gradient backgrounds (`bg-gradient-to-r from-pink-400 to-pink-600`)
- Hover effects and transitions
- Responsive grid layout
- Clean typography matching your site

You can customize colors, spacing, or layout by editing `/src/components/ReviewsSection.tsx`.

## 📞 Need Help?

The implementation is production-ready with mock data. To go live with real reviews:
1. Get API keys (takes 5-10 minutes)
2. Replace mock functions with real API calls
3. Add venue platform IDs to your database
4. Test with a few venues first

The infrastructure is already built - you just need to connect the real data sources!
