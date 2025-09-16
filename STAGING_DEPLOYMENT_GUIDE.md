# Deployment & Staging Guide

## 🎯 Overview

Florida Wedding Wonders uses Vercel for hosting with two environments:

- **🧪 Staging**: https://floridaweddingwonders-7duarsa04-bennetts-projects-9dec6313.vercel.app
- **🌐 Production**: https://floridaweddingwonders.com

## 🚀 Quick Deployment

### Using the Deployment Script

```bash
# Deploy to staging
./deploy.sh staging

# Deploy to production  
./deploy.sh production

# Show help
./deploy.sh
```

### Manual Deployment

```bash
# Staging
npm run build && vercel

# Production
npm run build && vercel --prod
```

## 🔄 Development Workflow

### 1. Local Development
```bash
npm run dev
# Visit http://localhost:3000
```

### 2. Feature Development
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes
# ... code changes ...

# Test locally
npm run build
npm run dev

# Commit changes
git add .
git commit -m "Add new feature"
```

### 3. Staging Deployment
```bash
# Deploy to staging for testing
./deploy.sh staging

# Test staging environment
# Visit staging URL and verify changes
```

### 4. Production Deployment
```bash
# Merge to master
git checkout master
git merge feature/new-feature

# Deploy to production
./deploy.sh production

# Verify production deployment
```

## 🌍 Environment URLs

| Environment | URL | Purpose |
|-------------|-----|---------|
| Local | http://localhost:3000 | Development |
| Staging | [Staging URL](https://floridaweddingwonders-7duarsa04-bennetts-projects-9dec6313.vercel.app) | Testing |
| Production | [floridaweddingwonders.com](https://floridaweddingwonders.com) | Live site |

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

### Latest Deployment
- ✅ Separate venue packages page with Stripe preparation
- ✅ Enhanced hero section with better CTAs
- ✅ Improved responsive design
- ✅ Staging environment configured

### Next Steps
- 💳 Stripe payment integration
- 📧 Enhanced email automation
- 📊 Analytics implementation
- 🔍 SEO optimization
