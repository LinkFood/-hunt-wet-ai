#!/bin/bash

# Hunt Wet AI - Automated Setup Script
# This script sets up the development environment automatically

echo "🎯 Setting up Hunt Wet AI Development Environment"
echo "================================================="

# Check Node.js version
echo "📦 Checking Node.js version..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first:"
    echo "   https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please install Node.js 18+"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Setup environment file
echo "🔑 Setting up environment variables..."
if [ ! -f .env.local ]; then
    if [ -f .env.local.example ]; then
        cp .env.local.example .env.local
        echo "✅ Created .env.local from template"
        echo "⚠️  IMPORTANT: Edit .env.local with your actual API keys!"
    else
        echo "❌ .env.local.example not found"
        exit 1
    fi
else
    echo "✅ .env.local already exists"
fi

# Check if API keys are configured
echo "🔍 Checking API key configuration..."
if grep -q "your_.*_key_here" .env.local; then
    echo "⚠️  WARNING: Some API keys are still placeholder values!"
    echo "   Please edit .env.local with your real API keys:"
    echo "   - OpenWeather API: https://openweathermap.org/api"
    echo "   - OpenAI API: https://platform.openai.com/api-keys"
    echo "   - Supabase: https://supabase.com/dashboard"
else
    echo "✅ API keys appear to be configured"
fi

# Test build
echo "🔨 Testing build process..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please check for errors above."
    exit 1
fi

echo "✅ Build successful"

# Success message
echo ""
echo "🎉 Hunt Wet AI setup complete!"
echo "================================"
echo ""
echo "Next steps:"
echo "1. Edit .env.local with your API keys (if not done already)"
echo "2. Start development server: npm run dev"
echo "3. Visit http://localhost:3000"
echo ""
echo "Test endpoints:"
echo "- Weather: curl 'localhost:3000/api/test-weather?zip=10001'"
echo "- Lunar: curl 'localhost:3000/api/test-lunar'"
echo "- AI: curl -X POST localhost:3000/api/hunting-advice -H 'Content-Type: application/json' -d '{\"userMessage\":\"Hunt deer in 12345?\"}'"
echo ""
echo "For help, see README.md and DEVELOPER_GUIDE.md"
echo "Happy hunting! 🎯"