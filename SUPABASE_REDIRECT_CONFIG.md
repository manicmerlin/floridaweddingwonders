# Configure Supabase Redirect URLs

## Problem
When users click the email confirmation link from Supabase, it redirects to `http://localhost:3000` instead of the production site.

## Solution
Configure the Site URL and Redirect URLs in Supabase dashboard.

## Steps:

### 1. Go to Supabase Dashboard
1. Visit https://supabase.com/dashboard
2. Select your project: `aflrmpkolumpjhpaxblz`

### 2. Configure Authentication URLs
1. Click on **Authentication** in the left sidebar
2. Click on **URL Configuration**

### 3. Update Site URL
Set the **Site URL** to:
```
https://floridaweddingwonders.com
```

### 4. Add Redirect URLs
Add these URLs to **Redirect URLs** (one per line):
```
https://floridaweddingwonders.com/**
https://www.floridaweddingwonders.com/**
http://localhost:3000/**
```

The `**` wildcard allows any path after the domain.

### 5. Save Changes
Click **Save** at the bottom of the page.

## What This Does

✅ Email confirmation links will redirect to `https://floridaweddingwonders.com` instead of localhost
✅ OAuth redirects will work on production
✅ Still allows localhost for development
✅ Supports both www and non-www versions

## Testing

1. Register a new user on production
2. Check your email for the confirmation link
3. Click the link
4. You should be redirected to `https://floridaweddingwonders.com` (not localhost)

## Additional Configuration (Optional)

### Disable Email Confirmation for Development
If you want to skip email confirmation during development:

1. Go to **Authentication** → **Settings**
2. Under **Email Auth**, toggle **Enable email confirmations** OFF
3. Users can login immediately without confirming email

**⚠️ Warning**: Only do this for development. Keep it enabled for production!

## Environment Variables

Make sure your `.env.local` and `.env.production` have:
```env
NEXT_PUBLIC_SUPABASE_URL=https://aflrmpkolumpjhpaxblz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

## Current Status

✅ Supabase Auth integrated in registration and login
✅ User data stored in Supabase Auth (not localStorage)
✅ Passwords hashed securely by Supabase
⏳ **Next Step**: Configure redirect URLs in Supabase dashboard (see steps above)
