#!/bin/bash

# Production Build Script for Virtual Trading App
# Optimizes and builds the app for production deployment

set -e

echo "🚀 Starting production build process..."

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI not found. Installing..."
    npm install -g @expo/eas-cli
fi

# Check if user is logged in to Expo
if ! eas whoami &> /dev/null; then
    echo "🔐 Please log in to your Expo account:"
    eas login
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/
rm -rf .expo/
npx expo install --fix

# Install dependencies with legacy peer deps
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Type check
echo "🔍 Running TypeScript checks..."
npx tsc --noEmit

# Lint check
echo "📝 Running ESLint..."
npm run lint

# Build for production
echo "🏗️ Building for production..."

# Set production environment
export NODE_ENV=production

# Build Android APK
echo "📱 Building Android APK..."
eas build --platform android --profile production --local

# Build iOS (if on macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 Building iOS app..."
    eas build --platform ios --profile production --local
else
    echo "⚠️ Skipping iOS build (not on macOS)"
fi

# Build for web
echo "🌐 Building for web..."
npx expo export:web

echo "✅ Production build completed successfully!"
echo ""
echo "📂 Build artifacts:"
echo "   - Android: Check EAS dashboard or local build output"
echo "   - iOS: Check EAS dashboard or local build output (if built)"
echo "   - Web: dist/ directory"
echo ""
echo "🚀 Next steps:"
echo "   1. Test the builds on physical devices"
echo "   2. Submit to app stores using 'eas submit'"
echo "   3. Deploy web build to your hosting service"
echo ""
echo "🔗 Useful commands:"
echo "   - eas build:list                 # View build history"
echo "   - eas submit                     # Submit to app stores"
echo "   - expo start --prod              # Test production mode locally"
