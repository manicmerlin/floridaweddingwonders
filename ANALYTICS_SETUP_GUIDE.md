# Venue Analytics System - Setup Guide

## 📊 Overview

The venue analytics system tracks and displays visitor engagement metrics for venue owners. It provides insights into page views, unique visitors, device breakdown, and user actions.

## ✅ What's Been Implemented

### 1. Database Schema (`database/venue-analytics-schema.sql`)
- **venue_analytics**: Tracks individual page views with visitor IDs
- **venue_analytics_summary**: Aggregated daily statistics
- **venue_analytics_actions**: User interaction tracking
- PostgreSQL functions for efficient data management
- Row Level Security policies

### 2. API Endpoint (`src/app/api/venue-analytics/route.ts`)
- **POST**: Track page views and user actions
- **GET**: Retrieve analytics data for a venue
- Automatic visitor ID and session management via cookies
- Device type detection (mobile/tablet/desktop)

### 3. Client Hook (`src/hooks/useVenueAnalytics.ts`)
- `useVenueAnalytics(venueId)`: Automatically tracks page views
- `trackVenueAction()`: Manual action tracking function

### 4. Analytics Panel Component (`src/components/VenueAnalyticsPanel.tsx`)
- Beautiful dashboard with Chart.js visualizations
- Key metrics: Total Views, Unique Visitors, Engagement Rate, Mobile Traffic
- Time range selector (7/30/90/365 days)
- Line chart for views over time
- Doughnut chart for device breakdown
- User actions tracking (phone clicks, email clicks, etc.)
- Insights and tips based on data

### 5. Integration
- Added to VenueManagement component as "Analytics" tab
- Venue detail page tracks views automatically
- Ready for action tracking on contact buttons

## 🔧 Setup Instructions

### Step 1: Run Database Schema

In your Supabase SQL editor, run the schema file:

```sql
-- Run the contents of database/venue-analytics-schema.sql
```

This creates:
- `venue_analytics` table
- `venue_analytics_summary` table  
- `venue_analytics_actions` table
- Helper functions and indexes

### Step 2: Verify Dependencies

The Chart.js libraries have been installed:
```bash
npm install chart.js react-chartjs-2
```

### Step 3: Test the System

1. **Login as a venue owner**:
   - Email: `manager@curtissmansion.com`
   - Password: `curtiss123`

2. **Go to your venue management page**:
   - Visit: `/venues/11/manage`
   - Click the "Analytics" tab

3. **Generate some test data**:
   - Open an incognito window
   - Visit the venue detail page: `/venues/11`
   - Refresh a few times from different devices
   - Click contact buttons (when tracking is added)

4. **View analytics**:
   - Return to management dashboard
   - See analytics update with views and visitor data

## 📈 Features

### Tracked Metrics
- **Page Views**: Total number of times venue page was loaded
- **Unique Visitors**: Count of distinct visitors (via cookie ID)
- **Device Breakdown**: Mobile vs Desktop vs Tablet traffic
- **User Actions**: Phone clicks, email clicks, website visits, gallery opens, saves, shares

### Visualizations
- Line chart showing views and unique visitors over time
- Doughnut chart for device type distribution
- Action cards for engagement metrics
- Automated insights and recommendations

### Time Ranges
- Last 7 days
- Last 30 days (default)
- Last 90 days
- Last year

## 🎯 How It Works

### Automatic Page View Tracking

When a user visits a venue detail page:

```tsx
// In /venues/[id]/page.tsx
useVenueAnalytics(venue?.id || null);
```

This automatically:
1. Generates or retrieves a visitor ID (stored in cookie for 2 years)
2. Creates a session ID (expires in 30 minutes)
3. Sends a POST request to `/api/venue-analytics`
4. Tracks device type, referrer, user agent
5. Updates both raw analytics and daily summary

### Manual Action Tracking

To track specific user actions:

```tsx
import { trackVenueAction } from '@/hooks/useVenueAnalytics';

// When user clicks phone number
<a 
  href={`tel:${venue.contact.phone}`}
  onClick={() => trackVenueAction(venue.id, 'phone_click', venue.contact.phone)}
>
  Call Now
</a>

// When user clicks email
<a 
  href={`mailto:${venue.contact.email}`}
  onClick={() => trackVenueAction(venue.id, 'email_click', venue.contact.email)}
>
  Email Us
</a>

// When user opens photo gallery
<button onClick={() => {
  trackVenueAction(venue.id, 'gallery_open');
  // ... open gallery
}}>
  View Photos
</button>
```

### Available Action Types
- `phone_click`: User clicked phone number
- `email_click`: User clicked email address
- `website_click`: User visited venue website
- `photo_view`: User viewed a photo
- `gallery_open`: User opened photo gallery
- `save_venue`: User saved venue to favorites
- `share`: User shared the venue

## 🔐 Privacy & Data

### What We Track
- Anonymous visitor IDs (not personally identifiable)
- Session IDs for user journey tracking
- Device type and user agent (for experience optimization)
- Referrer URLs (to understand traffic sources)
- Timestamps of visits

### What We DON'T Track
- Personal information
- IP addresses
- Exact location data
- Browsing history outside the site

### Cookie Usage
- `visitor_id`: Persistent identifier (2 year expiry)
- `session_id`: Session identifier (30 minute expiry)

## 📊 Data Aggregation

### Real-time Updates
- Page views are tracked immediately
- Daily summaries update on each visit
- Analytics panel fetches latest data on load

### Database Optimization
- Indexes on frequently queried columns
- Upsert logic prevents duplicate visitor records
- Summary table for fast aggregate queries
- PostgreSQL functions for efficient updates

## 🚀 Future Enhancements

### Potential Additions
- **Geographic Data**: City/state/country tracking
- **Time on Page**: Average session duration
- **Bounce Rate**: Single-page sessions
- **Conversion Tracking**: Inquiry form submissions
- **A/B Testing**: Compare different venue presentations
- **Export Reports**: Download analytics as CSV/PDF
- **Email Reports**: Weekly/monthly analytics emails
- **Comparison Views**: Compare to previous period
- **Heat Maps**: Visual engagement patterns
- **Real-time Dashboard**: Live visitor count

### Integration Ideas
- **Google Analytics**: Supplement with GA4 data
- **Facebook Pixel**: Track ad campaign effectiveness
- **CRM Integration**: Sync with customer relationship tools
- **Booking System**: Track conversion to bookings

## 📝 Troubleshooting

### Analytics Not Showing
1. Check that database schema is installed
2. Verify Supabase connection is working
3. Check browser console for API errors
4. Ensure cookies are enabled
5. Try clearing browser cache

### No Data Appearing
1. Visit venue pages to generate test data
2. Check that venue ID matches between page and analytics
3. Verify RLS policies allow reading analytics
4. Check API endpoint is returning data

### Charts Not Rendering
1. Verify Chart.js is installed: `npm list chart.js`
2. Check browser console for errors
3. Ensure data format matches chart expectations
4. Try different time ranges

## 🎨 Customization

### Adjust Tracking
Edit `/src/hooks/useVenueAnalytics.ts` to:
- Change tracking behavior
- Add custom analytics events
- Modify cookie settings

### Modify Visualizations
Edit `/src/components/VenueAnalyticsPanel.tsx` to:
- Change chart types
- Add new metrics
- Customize colors and styling
- Add/remove sections

### API Configuration
Edit `/src/app/api/venue-analytics/route.ts` to:
- Change data retention
- Add custom logic
- Modify device detection
- Adjust aggregation

## 🔗 Related Files

- `/database/venue-analytics-schema.sql` - Database schema
- `/src/app/api/venue-analytics/route.ts` - API endpoint
- `/src/hooks/useVenueAnalytics.ts` - React hook
- `/src/components/VenueAnalyticsPanel.tsx` - Dashboard UI
- `/src/components/VenueManagement.tsx` - Integration point
- `/src/app/venues/[id]/page.tsx` - Tracking implementation

## 🎉 Done!

The analytics system is ready to use. Venue owners can now track their listing performance and optimize based on real data!
