#!/bin/bash

# Florida Wedding Wonders Deployment Script
# Usage: ./deploy.sh [staging|production]

if [ "$1" = "staging" ]; then
    echo "🚀 Deploying to STAGING environment..."
    echo "� Switching to staging branch..."
    git checkout staging
    
    echo "�📋 Running build check..."
    npm run build
    
    if [ $? -eq 0 ]; then
        echo "✅ Build successful, deploying to staging..."
        vercel --prod
        echo ""
        echo "🎯 Staging deployment complete!"
        echo "🔗 Staging URL: https://staging.floridaweddingwonders.com"
        echo "🚀 Site is live and ready for testing!"
        echo "🔍 Inspect: Check Vercel dashboard for details"
    else
        echo "❌ Build failed, deployment aborted"
        exit 1
    fi
    
elif [ "$1" = "production" ]; then
    echo "🏛️ Deploying to PRODUCTION environment..."
    echo "� Switching to master branch..."
    git checkout master
    
    echo "�📋 Running build check..."
    npm run build
    
    if [ $? -eq 0 ]; then
        echo "✅ Build successful, deploying to production..."
        vercel --prod
        echo ""
        echo "🎉 PRODUCTION deployment complete!"
        echo "🌐 Live URL: https://floridaweddingwonders.com"
        echo "🔍 Inspect: Check Vercel dashboard for details"
    else
        echo "❌ Build failed, deployment aborted"
        exit 1
    fi
    
else
    echo "🤖 Florida Wedding Wonders Deployment Script"
    echo ""
    echo "Usage:"
    echo "  ./deploy.sh staging     - Deploy to staging environment (staging branch)"
    echo "  ./deploy.sh production  - Deploy to production environment (master branch)"
    echo ""
    echo "Available environments:"
    echo "  🧪 Staging:    https://staging.floridaweddingwonders.com"
    echo "  🌐 Production: https://floridaweddingwonders.com"
    echo ""
    echo "Branch Configuration:"
    echo "  📦 staging branch  → staging.floridaweddingwonders.com"
    echo "  📦 master branch   → floridaweddingwonders.com"
    echo ""
fi
