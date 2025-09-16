# 🚀 Staging & Production Deployment Guide

## 🎯 Overview

Florida Wedding Wonders uses Vercel with dedicated staging and production environments:

- **🧪 Staging**: `staging.floridaweddingwonders.com` (staging branch)
- **🌐 Production**: `floridaweddingwonders.com` (master branch)

## 🔧 Initial Staging Setup

### 1. Configure Staging Subdomain
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to `floridaweddingwonders` project
3. Go to **Settings** → **Domains**
4. Add domain: `staging.floridaweddingwonders.com`
5. Point it to staging branch deployment

### 2. DNS Configuration
Add CNAME record in your domain provider:
```
CNAME   staging   cname.vercel-dns.com
```

## 🚀 Quick Deployment

### Using the Deployment Script

```bash
# Deploy to staging (staging branch)
./deploy.sh staging

# Deploy to production (master branch)
./deploy.sh production

# Show help and environment info
./deploy.sh
```

### Manual Deployment

```bash
# Staging (from staging branch)
git checkout staging
npm run build && vercel --prod

# Production (from master branch)
git checkout master
npm run build && vercel --prod
```

## 🔄 Development Workflow

### 1. Feature Development (Staging Branch)
```bash
# Switch to staging branch
git checkout staging

# Make changes
# ... code changes ...

# Test locally
npm run build
npm run dev

# Commit changes
git add .
git commit -m "Add new feature"
git push origin staging
```

### 2. Deploy to Staging
```bash
# Deploy to staging environment
./deploy.sh staging

# Test at staging.floridaweddingwonders.com
```

### 3. Production Release
```bash
# Merge staging to master
git checkout master
git merge staging
git push origin master

# Deploy to production
./deploy.sh production

# Verify at floridaweddingwonders.com
```

## 🌍 Environment URLs

| Environment | URL | Branch | Purpose |
|-------------|-----|---------|---------|
| Local | http://localhost:3000 | Any | Development |
| **Staging** | **staging.floridaweddingwonders.com** | `staging` | Testing |
| **Production** | **floridaweddingwonders.com** | `master` | Live site |

## 🔧 Environment Variables

Both staging and production use the same environment variables:

- `SUPABASE_URL` - Database connection
- `SUPABASE_ANON_KEY` - Database access key
- `RESEND_API_KEY` - Email service
- Domain is automatically configured by Vercel

## 📋 Pre-Deployment Checklist

### Before Staging
- [ ] Code compiles successfully (`npm run build`)
- [ ] All new features work locally
- [ ] No TypeScript errors
- [ ] All tests pass (if applicable)

### Before Production
- [ ] Staging deployment tested and approved
- [ ] No critical bugs in staging
- [ ] Performance is acceptable
- [ ] Mobile responsiveness verified
- [ ] Email functionality works
- [ ] Forms submit correctly

## 🚨 Rollback Process

If production deployment has issues:

```bash
# Check previous deployments
vercel ls

# Rollback to previous version
vercel rollback [deployment-url]

# Or redeploy last known good commit
git checkout [good-commit-hash]
./deploy.sh production
```

## 🔍 Monitoring & Debugging

### Check Deployment Status
- Visit [Vercel Dashboard](https://vercel.com/bennetts-projects-9dec6313/floridaweddingwonders)
- View build logs and runtime logs
- Monitor performance metrics

### Common Issues
1. **Build Failures**: Check TypeScript errors, missing imports
2. **Runtime Errors**: Check Vercel function logs
3. **Email Issues**: Verify Resend API key
4. **Database Issues**: Check Supabase connection

## 📱 Testing Checklist

### Staging Tests
- [ ] Email signup form works
- [ ] Venue packages page loads
- [ ] Contact form submits
- [ ] Mobile responsive design
- [ ] Logo and images load correctly
- [ ] External links work

### Production Tests
- [ ] Domain redirects correctly
- [ ] SSL certificate works
- [ ] All staging tests pass
- [ ] Google Analytics (if added)
- [ ] SEO meta tags working

## 🔐 Security Notes

- Never commit API keys to git
- Environment variables are managed in Vercel dashboard
- Production domain has SSL automatically
- Database access is restricted by Row Level Security

## 📞 Support

For deployment issues:
- Check Vercel dashboard for logs
- Review this guide
- Contact Bennett for critical issues

## 🎉 Recent Updates

### Latest Deployment Infrastructure
- ✅ Dedicated staging branch and subdomain
- ✅ staging.floridaweddingwonders.com configured
- ✅ Separate venue packages page with Stripe preparation
- ✅ Enhanced hero section with better CTAs
- ✅ Improved responsive design
- ✅ Google Analytics integration

### Branch Strategy
- 📦 `staging` branch → staging.floridaweddingwonders.com
- 📦 `master` branch → floridaweddingwonders.com

### Next Steps
- 💳 Stripe payment integration
- 📧 Enhanced email automation
- 📊 Advanced analytics implementation
- 🔍 SEO optimization
