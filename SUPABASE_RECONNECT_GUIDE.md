# Supabase Reconnection Guide

## Current Status
- **Supabase Account**: Temporarily suspended due to compromised credentials
- **Security**: 2FA enabled on GitHub ✅
- **Code Status**: All features ready, just need new Supabase credentials

## When Supabase Is Back Online

### 1. Create Fresh Supabase Project
1. Go to https://supabase.com
2. Create a new project (or unsuspend current one)
3. Note down the new credentials

### 2. Update Environment Variables

Update `.env.local` with new credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-new-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-new-anon-key

# Optional: For admin features (Users Management)
NEXT_PUBLIC_SUPABASE_SERVICE_KEY=your-service-role-key
```

### 3. Update Supabase URL Configuration

In Supabase Dashboard → Authentication → URL Configuration:
- **Site URL**: `https://floridaweddingwonders.com`
- **Redirect URLs**: 
  - `https://floridaweddingwonders.com/**`
  - `https://www.floridaweddingwonders.com/**`
  - `http://localhost:3000/**`

### 4. Re-run Database Setup

Run the SQL scripts in the `database/` folder:
1. `schema.sql` - Main tables
2. `auth-schema.sql` - Authentication tables
3. `users-schema.sql` - User profiles
4. `venue-photos-schema.sql` - Photo storage tables
5. `storage-policies.sql` - Storage bucket policies

### 5. Update Vercel Environment Variables

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Update the Supabase credentials:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SUPABASE_SERVICE_KEY` (optional)
3. Redeploy the site

### 6. Test Key Features

After reconnection, test these features:
- ✅ User registration and login
- ✅ Photo uploads to Supabase Storage
- ✅ Venue photos displaying on cards
- ✅ Favorites system
- ✅ Admin panel (Users Management)
- ✅ Early bird form submission (venue-packages page)

## Email API Status

The early bird form currently tries to POST to `/api/send-email`, but this endpoint is designed for email subscriptions, not contact forms.

### Option 1: Use Existing Email System
The form currently sends to `bennett.boundless@gmail.com` but the API expects:
```json
{
  "type": "venue_owner",
  "email": "user@email.com",
  "venueName": "Venue Name"
}
```

### Option 2: Create New Early Bird Endpoint
Create `/src/app/api/early-bird/route.ts` that:
1. Accepts the form data (name, email, phone, venueName, claimOffer)
2. Sends an email to `bennett.boundless@gmail.com` via Resend
3. Optionally stores in a `early_bird_requests` table

### Recommended: Create Dedicated Endpoint
```typescript
// src/app/api/early-bird/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  const { name, email, phone, venueName, claimOffer } = await request.json();
  
  await resend.emails.send({
    from: 'noreply@floridaweddingwonders.com',
    to: 'bennett.boundless@gmail.com',
    subject: `🎁 Early Bird Offer Request - ${venueName}`,
    html: `
      <h2>Early Bird Offer Request</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Venue:</strong> ${venueName}</p>
      <p><strong>Claimed Offer:</strong> ${claimOffer ? 'Yes' : 'No'}</p>
    `
  });
  
  return NextResponse.json({ success: true });
}
```

Then update the form in `venue-packages/page.tsx` to POST to `/api/early-bird` instead.

## Recent Updates (Commit: e1c0a00)

### Early Bird Modal Form
- ✅ Clickable banner in hero section: "FREE Premium Year for First 10 Venues"
- ✅ Badge showing "4 / 10 Left"
- ✅ Modal form with fields:
  - Name (required)
  - Email (required)
  - Phone (required)
  - Venue Name (required)
  - Checkbox: "Yes, I want to claim the FREE Premium Year offer!" (required)
- ✅ Form validation (all fields must be filled, checkbox must be checked)
- ✅ Success/error alerts
- ✅ Responsive design (mobile + desktop)

### Update Counter
To update the remaining spots, change this constant in `src/app/venue-packages/page.tsx`:
```typescript
const EARLY_BIRD_REMAINING = 4; // Update this as venues claim the offer
```

## Security Notes
- ✅ GitHub 2FA enabled
- ⚠️ Never commit `.env.local` to Git
- ⚠️ Store Service Role Key only in Vercel (never in client-side code)
- ⚠️ Use environment variables for all API keys

## Support
If you need help reconnecting, the code is ready - just update the environment variables and you're good to go!
