# How to Create a Shareable APK for MyFirstApp

## Method 1: Using EAS Build (Recommended)

1. **Create an Expo Account**
   - Go to https://expo.dev and create an account
   - Verify your email address

2. **Login to EAS**
   ```bash
   cd /Users/shubhamsingh/Desktop/Native/MyFirstApp
   eas login
   ```

3. **Build APK**
   ```bash
   eas build --profile preview --platform android
   ```

## Method 2: Using Expo Development Build

1. **Install Dependencies**
   ```bash
   npm install -g @expo/cli
   ```

2. **Build Development APK**
   ```bash
   npx expo build:android -t apk
   ```

## Method 3: Using Android Studio (Local Build)

1. **Install Android Studio**
   - Download from https://developer.android.com/studio
   - Install Android SDK and build tools

2. **Set Environment Variables**
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

3. **Build APK**
   ```bash
   cd /Users/shubhamsingh/Desktop/Native/MyFirstApp
   npx expo prebuild
   cd android
   ./gradlew assembleRelease
   ```

4. **Find your APK**
   The APK will be located at:
   ```
   android/app/build/outputs/apk/release/app-release.apk
   ```

## Method 4: Using Expo Web Build + PWA

1. **Build for Web**
   ```bash
   npx expo export:web
   ```

2. **Create PWA**
   The web build can be installed as a PWA on mobile devices.

## Quick Start (Easiest Method)

Since you don't have Android development environment set up, the easiest way is:

1. Create an Expo account at https://expo.dev
2. Run these commands:
   ```bash
   npm install -g eas-cli
   eas login
   eas build --profile preview --platform android
   ```

3. Wait for build to complete (usually 5-10 minutes)
4. Download the APK from the provided link

## Configuration Files Already Created

- `eas.json` - EAS build configuration
- The project is already configured for building

## APK Signing

For production APKs, you'll need to:
1. Generate a keystore
2. Configure signing in `android/app/build.gradle`
3. Use the production build profile

## Notes

- The preview build creates an unsigned APK suitable for testing
- For Play Store distribution, use the production profile
- The APK will be around 50-100MB in size
- You can share the APK via any file sharing method

## Troubleshooting

If you encounter issues:
1. Make sure you have the latest version of Node.js
2. Clear npm cache: `npm cache clean --force`
3. Delete node_modules and reinstall: `rm -rf node_modules && npm install`
4. Try using Expo CLI instead of EAS: `npx expo build:android -t apk`
