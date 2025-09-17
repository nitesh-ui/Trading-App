# Expo Account Setup Guide

This guide will walk you through setting up an Expo account and configuring your development environment for building APKs.

## Prerequisites

- Node.js installed (check with `node --version`)
- Your React Native project ready
- A stable internet connection

## Step 1: Create Expo Account

### Option A: Via Web Browser
1. Go to [expo.dev](https://expo.dev)
2. Click "Sign Up" in the top right corner
3. Choose your preferred signup method:
   - **Email & Password**: Enter your email and create a password
   - **GitHub**: Sign up using your GitHub account
   - **Google**: Sign up using your Google account
4. Verify your email address if required
5. Complete your profile setup

### Option B: Via Expo CLI
```bash
# Install Expo CLI globally if not already installed
npm install -g @expo/cli

# Create account through CLI
expo register
```

## Step 2: Login to Expo CLI

Once you have an account, login through the CLI:

```bash
# Login to your Expo account
expo login

# Verify you're logged in
expo whoami
```

## Step 3: Initialize Expo in Your Project

If your project isn't already configured with Expo:

```bash
# Navigate to your project directory
cd /path/to/your/project

# Initialize Expo (if needed)
expo init --template blank-typescript

# Or if you already have a React Native project, install Expo
npx install-expo-modules@latest
```

## Step 4: Configure app.json

Ensure your `app.json` is properly configured for building:

```json
{
  "expo": {
    "name": "MyFirstApp",
    "slug": "myfirstapp",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "myfirstapp",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/images/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.myfirstapp"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.yourcompany.myfirstapp"
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      "expo-router"
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

## Step 5: Install EAS CLI (Expo Application Services)

EAS is Expo's build and submission service:

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to EAS (uses same Expo credentials)
eas login

# Verify EAS login
eas whoami
```

## Step 6: Configure EAS Build

```bash
# Initialize EAS configuration
eas build:configure

# This will create eas.json with build configurations
```

## Step 7: Build Your APK

Now you can build your APK:

```bash
# Build for Android (APK)
eas build --platform android --profile preview

# Or for a production build
eas build --platform android --profile production
```

## Step 8: Download Your APK

1. After the build completes, you'll get a link to download your APK
2. You can also find all your builds at: https://expo.dev/accounts/[your-username]/projects/[your-project]/builds
3. Download the APK file to your device or share the link

## Useful Commands

```bash
# Check project status
expo doctor

# Preview your app in Expo Go
expo start

# Check build status
eas build:list

# View build logs
eas build:view [build-id]

# Submit to Google Play Store (optional)
eas submit --platform android
```

## Troubleshooting

### Common Issues:

1. **"Not logged in"**
   ```bash
   expo logout
   expo login
   ```

2. **"Project not configured"**
   ```bash
   eas build:configure
   ```

3. **"Build failed"**
   ```bash
   # Check logs with:
   eas build:view [build-id]
   ```

4. **"Invalid package name"**
   - Ensure `android.package` in app.json follows format: `com.company.appname`
   - Use lowercase letters, numbers, and dots only

### Build Profiles Explained:

- **development**: For development builds with debugging enabled
- **preview**: For testing APKs (installable but not for store)
- **production**: For store-ready builds

## Security Notes

- Keep your Expo credentials secure
- Don't share your build links publicly
- Use environment variables for sensitive data
- Review permissions in your app.json

## Next Steps

1. Set up your Expo account using this guide
2. Configure your project settings
3. Run your first build
4. Share the APK with testers

## Support

- Expo Documentation: https://docs.expo.dev/
- Expo Discord: https://chat.expo.dev/
- Expo Forums: https://forums.expo.dev/

---

**Important**: Building with EAS requires an internet connection and can take 5-15 minutes per build. Free accounts have build limits, but paid plans offer unlimited builds.
