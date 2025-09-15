# 🚀 Deployment Guide for Florida Wedding Wonders

## 📋 Pre-Deployment Checklist
✅ All APIs configured (Supabase, Resend)
✅ Environment variables ready
✅ Logo and fonts integrated
✅ Pricing packages configured
✅ Email capture system working

## 🌐 Deployment Steps

### 1. Create GitHub Repository
```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit - Florida Wedding Wonders"

# Add remote repository (replace with your GitHub repo)
git remote add origin https://github.com/yourusername/florida-wedding-wonders.git
git push -u origin main
```

### 2. Deploy to Vercel

#### Option A: Via Vercel Dashboard
1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "New Project"
4. Import your GitHub repository
5. Configure domains and environment variables

#### Option B: Via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add custom domains
vercel domains add floridaweddingwonders.com
vercel domains add staging.floridaweddingwonders.com
```

### 3. Environment Variables Setup

#### Production (floridaweddingwonders.com):
```
NEXT_PUBLIC_SUPABASE_URL=https://aflrmpkolumpjhpaxblz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_PASSWORD=A8cDXcAN@9m2xkt
RESEND_API_KEY=re_DJdP43zH_BpnSmJW8NTCmpYKtQFTxiDPq
NEXT_PUBLIC_SITE_URL=https://floridaweddingwonders.com
ENVIRONMENT=production
```

#### Staging (staging.floridaweddingwonders.com):
```
NEXT_PUBLIC_SUPABASE_URL=https://aflrmpkolumpjhpaxblz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_PASSWORD=A8cDXcAN@9m2xkt
RESEND_API_KEY=re_DJdP43zH_BpnSmJW8NTCmpYKtQFTxiDPq
NEXT_PUBLIC_SITE_URL=https://staging.floridaweddingwonders.com
ENVIRONMENT=staging
```

### 4. Domain Configuration

#### DNS Settings (Point to Vercel):
```
Type: A Record
Name: @
Value: 76.76.19.61

Type: CNAME
Name: staging
Value: cname.vercel-dns.com
```

### 5. Email Domain Verification
1. Go to https://resend.com/domains
2. Add floridaweddingwonders.com
3. Add required DNS records:
   - TXT record for domain verification
   - MX records for email delivery

## 🎯 What You'll Get

### Production Site (floridaweddingwonders.com):
- ✅ Coming soon page with email capture
- ✅ Venue owner registration for founding partner program
- ✅ Professional branding (logo + Nowra font)
- ✅ Automatic email notifications

### Staging Site (staging.floridaweddingwonders.com):
- ✅ Full venue directory (130+ venues)
- ✅ Admin dashboard access at /admin
- ✅ Complete pricing pages
- ✅ Vendor and dress shop directories
- ✅ All features for testing

## 🔐 Admin Access
- URL: https://staging.floridaweddingwonders.com/admin
- Use super admin credentials for testing

## ⚡ Quick Deploy Commands
```bash
# Push changes and auto-deploy
git add .
git commit -m "Deploy Florida Wedding Wonders"
git push origin main
```

Ready to launch! 🚀
