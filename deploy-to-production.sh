#!/bin/bash
# Hunt Wet AI - Complete Production Deployment
# This script deploys everything to huntwet.com

echo "🦌 DEPLOYING HUNT WET AI TO PRODUCTION 🦌"

# Step 1: Build the production app
echo "📦 Building production build..."
npm run build

# Step 2: Deploy to Vercel (easiest production hosting)
echo "🚀 Deploying to production hosting..."

# Install Vercel CLI if not present
if ! command -v vercel &> /dev/null; then
    npm install -g vercel
fi

# Deploy to Vercel and connect to huntwet.com domain
vercel --prod

echo "✅ Hunt Wet AI deployed to production!"

# Step 3: Configure domain
echo "🌐 Configuring huntwet.com domain..."

# Add custom domain to Vercel project
vercel domains add huntwet.com

echo "🎉 HUNT WET AI IS LIVE AT HUNTWET.COM!"
echo "🔗 Your hunting intelligence platform is now available to the world"