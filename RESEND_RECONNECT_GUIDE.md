# Resend Email Service Reconnection Guide

## Current Status
- **Resend Account**: Temporarily having authentication issues due to compromised credentials
- **Supabase**: ✅ Working fine (database, auth, storage all operational)
- **Security**: 2FA enabled on GitHub ✅
- **Code Status**: All features ready, just need new Resend API key for email sending

## What's Affected
- Email notifications (user welcome emails, admin notifications)
- Early bird form submissions (sends email to bennett.boundless@gmail.com)
- Contact form emails
- Venue owner notification emails

## What's Still Working
- ✅ User registration and login (Supabase Auth)
- ✅ Photo uploads to Supabase Storage
- ✅ Venue photos displaying on cards
- ✅ Favorites system
- ✅ Admin panel (Users Management)
- ✅ All database operations

## When Resend Is Back Online

### 1. Get Fresh Resend API Key
1. Go to https://resend.com
2. Log in or create new account
3. Go to API Keys section
4. Create a new API key
5. Copy the key (it starts with `re_`)

### 2. Update Environment Variables

Update `.env.local` with new Resend API key:

```env
# Resend Email Configuration
RESEND_API_KEY=re_your_new_api_key_here
```

### 3. Update Vercel Environment Variables

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Update the Resend API key:
   - `RESEND_API_KEY=re_your_new_api_key_here`
3. Redeploy the site (or it will auto-deploy on next git push)

### 4. Verify Domain in Resend (If Needed)

If you want to send from `@floridaweddingwonders.com`:
1. Go to Resend Dashboard → Domains
2. Add `floridaweddingwonders.com`
3. Add the DNS records they provide
4. Wait for verification

Otherwise, you can send from `onboarding@resend.dev` (free tier default)

### 5. Test Email Features

After updating the API key, test:
- ✅ User registration emails (welcome messages)
- ✅ Early bird form submission (venue-packages page)
- ✅ Contact form emails
- ✅ Admin notification emails

## Early Bird Form - Email Endpoint

The early bird form currently POSTs to `/api/send-email`, but that endpoint is designed for email subscriptions, not contact forms.

### Current Form Data Structure
```json
{
  "to": "bennett.boundless@gmail.com",
  "subject": "🎁 Early Bird Offer Request - [Venue Name]",
  "text": "Name: ...\nEmail: ...\nPhone: ...\nVenue Name: ...",
  "from": "user@email.com",
  "replyTo": "user@email.com"
}
```

### Option 1: Quick Fix - Use Resend Directly
Update the form to bypass the API and use a simple serverless function:

```typescript
// src/app/api/early-bird/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, venueName, claimOffer } = await request.json();
    
    const { data, error } = await resend.emails.send({
      from: 'Early Bird Offers <noreply@resend.dev>', // or your verified domain
      to: 'bennett.boundless@gmail.com',
      replyTo: email,
      subject: `🎁 Early Bird Offer Request - ${venueName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ec4899;">🎁 Early Bird Offer Request</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <p><strong>Phone:</strong> <a href="tel:${phone}">${phone}</a></p>
          <p><strong>Venue Name:</strong> ${venueName}</p>
          <p><strong>Claimed Offer:</strong> ${claimOffer ? '✅ Yes' : '❌ No'}</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ccc;">
          <p style="color: #666; font-size: 14px;">Submitted: ${new Date().toLocaleString()}</p>
        </div>
      `
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

Then update `src/app/venue-packages/page.tsx` to POST to `/api/early-bird` instead of `/api/send-email`.

### Option 2: Temporary Fallback (While Resend is Down)
Store submissions in Supabase and review them manually later:

```typescript
// In venue-packages/page.tsx, update handleEarlyBirdSubmit:
const handleEarlyBirdSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);

  try {
    // Store in Supabase instead of sending email
    const { error } = await supabase
      .from('early_bird_requests')
      .insert({
        name: earlyBirdForm.name,
        email: earlyBirdForm.email,
        phone: earlyBirdForm.phone,
        venue_name: earlyBirdForm.venueName,
        claimed_offer: earlyBirdForm.claimOffer,
        submitted_at: new Date().toISOString()
      });

    if (error) throw error;

    alert('🎉 Your request has been saved! We\'ll contact you within 24 hours.');
    setEarlyBirdForm({ name: '', email: '', phone: '', venueName: '', claimOffer: false });
    setShowEarlyBirdForm(false);
  } catch (error) {
    console.error('Error:', error);
    alert('Something went wrong. Please email us directly at bennett.boundless@gmail.com');
  }

  setIsSubmitting(false);
};
```

Don't forget to create the table:
```sql
CREATE TABLE early_bird_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  venue_name TEXT NOT NULL,
  claimed_offer BOOLEAN NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed BOOLEAN DEFAULT FALSE
);
```

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
- ⚠️ Currently sending to `/api/send-email` (needs Resend API key)

### Update Counter
To update the remaining spots, change this constant in `src/app/venue-packages/page.tsx`:
```typescript
const EARLY_BIRD_REMAINING = 4; // Update this as venues claim the offer
```

## Immediate Workaround (While Resend is Down)

Since Resend is temporarily unavailable, you have two options:

### Option A: Store in Supabase Database
Create the `early_bird_requests` table and store submissions there. Review them manually later.

### Option B: Use Alternative Email Service
- Temporarily switch to SendGrid, Mailgun, or Postmark
- Update the API endpoint to use the alternative service
- Switch back to Resend when it's restored

## Security Notes
- ✅ GitHub 2FA enabled
- ⚠️ Never commit `.env.local` to Git
- ⚠️ Store API keys only in Vercel environment variables (never in client-side code)
- ⚠️ Use environment variables for all API keys (Resend, Supabase, etc.)

## Support
If you need help reconnecting Resend, the code is ready - just update the `RESEND_API_KEY` environment variable and you're good to go!
