#!/bin/bash

# Florida Wedding Wonders Deployment Script
# Usage: ./deploy.sh [staging|production]

if [ "$1" = "staging" ]; then
    echo "🚀 Deploying to STAGING environment..."
    echo "📋 Running build check..."
    npm run build
    
    if [ $? -eq 0 ]; then
        echo "✅ Build successful, deploying to staging..."
        vercel
        echo ""
        echo "🎯 Staging deployment complete!"
        echo "🔗 Staging URL: https://floridaweddingwonders-7duarsa04-bennetts-projects-9dec6313.vercel.app"
        echo "🔍 Inspect: Check Vercel dashboard for details"
    else
        echo "❌ Build failed, deployment aborted"
        exit 1
    fi
    
elif [ "$1" = "production" ]; then
    echo "🏛️ Deploying to PRODUCTION environment..."
    echo "📋 Running build check..."
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
    echo "  ./deploy.sh staging     - Deploy to staging environment"
    echo "  ./deploy.sh production  - Deploy to production environment"
    echo ""
    echo "Available environments:"
    echo "  🧪 Staging:    https://floridaweddingwonders-7duarsa04-bennetts-projects-9dec6313.vercel.app"
    echo "  🌐 Production: https://floridaweddingwonders.com"
    echo ""
fi
