#!/bin/bash

echo "Building Virtual Trading App APK..."
echo "======================================"

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "Installing EAS CLI..."
    npm install -g eas-cli
fi

# Login to EAS (user needs to provide credentials)
echo "Please login to your Expo account:"
eas login

# Build the APK
echo "Starting APK build..."
eas build --profile preview --platform android --non-interactive

echo "Build started! You can monitor the build progress at:"
echo "https://expo.dev/accounts/[your-username]/projects/virtual-trading-app/builds"
echo ""
echo "Once the build is complete, you can download the APK from the Expo dashboard."
