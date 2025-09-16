# 🔧 Vercel Staging Subdomain Setup

## Quick Setup Instructions

### 1. Access Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Click on your `floridaweddingwonders` project

### 2. Add Staging Domain
1. Go to **Settings** → **Domains** 
2. Click **Add Domain**
3. Enter: `staging.floridaweddingwonders.com`
4. Click **Add**

### 3. Configure Domain Mapping
1. When prompted for deployment to point to, select:
   - **Branch**: `staging`
   - **Latest deployment from staging branch**

### 4. DNS Configuration
Add this CNAME record in your domain provider (where you bought floridaweddingwonders.com):

```
Type: CNAME
Name: staging
Value: cname.vercel-dns.com
TTL: 300 (or default)
```

### 5. Verify Setup
Once DNS propagates (5-60 minutes):
- Visit: https://staging.floridaweddingwonders.com
- Should show your staging branch deployment

## 🚀 Deployment Workflow

### Deploy to Staging
```bash
./deploy.sh staging
```
- Switches to staging branch
- Builds and deploys
- Updates staging.floridaweddingwonders.com

### Deploy to Production  
```bash
./deploy.sh production
```
- Switches to master branch
- Builds and deploys  
- Updates floridaweddingwonders.com

## 🎯 Current Status

**Staging Branch Deployment URL**: 
https://floridaweddingwonders-ee9fxg7iy-bennetts-projects-9dec6313.vercel.app

This URL will become `staging.floridaweddingwonders.com` once you complete the domain setup above.

## ✅ Verification Checklist

After setup, verify:
- [ ] staging.floridaweddingwonders.com loads
- [ ] Shows same content as staging deployment URL
- [ ] Email forms work on staging  
- [ ] Venue packages page loads on staging
- [ ] SSL certificate is active (https://)

## 🆘 Troubleshooting

**Domain not working?**
- Check DNS propagation: https://whatsmydns.net
- Verify CNAME record is correct
- Wait up to 24 hours for full propagation

**Wrong content showing?**
- Ensure domain points to staging branch in Vercel
- Redeploy staging: `./deploy.sh staging`

## 📞 Next Steps

Once staging subdomain is working:
1. Test all functionality on staging.floridaweddingwonders.com
2. Use staging for development and client previews
3. Only deploy to production when staging is fully tested
4. Consider adding staging/production environment indicators to the UI
