# Expo APK Build Guide

This guide will walk you through building a shareable APK for your React Native trading app using Expo Application Services (EAS).

## Prerequisites

1. **Node.js** (version 16 or later)
2. **Expo CLI** (should already be installed)
3. **Expo Account** (free to create)
4. **EAS CLI** (for building)

## Step 1: Create an Expo Account

1. Visit [https://expo.dev/signup](https://expo.dev/signup)
2. Sign up with your email or GitHub account
3. Verify your email address
4. Note down your username - you'll need it later

## Step 2: Install EAS CLI

Open terminal in your project directory and run:

```bash
npm install -g @expo/cli@latest
npm install -g eas-cli
```

## Step 3: Login to Your Expo Account

```bash
expo login
```

Enter your Expo credentials when prompted.

## Step 4: Configure EAS Build

Initialize EAS configuration:

```bash
eas build:configure
```

This will create an `eas.json` file in your project root. The default configuration should work for most cases.

## Step 5: Update app.json Configuration

Ensure your `app.json` has the proper configuration for building:

```json
{
  "expo": {
    "name": "MyFirstApp",
    "slug": "myfirstapp-trading",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "myapp",
    "userInterfaceStyle": "automatic",
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
      "package": "com.yourcompany.myfirstapp",
      "versionCode": 1
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

**Important**: Update the `package` field under `android` with your own unique package name (e.g., `com.yourname.tradingapp`).

## Step 6: Build Your APK

### For Development Build (Internal Testing)

```bash
eas build --platform android --profile development
```

### For Production Build (App Store Ready)

```bash
eas build --platform android --profile production
```

### For Preview Build (Shareable APK)

```bash
eas build --platform android --profile preview
```

The **preview** build is recommended for creating shareable APKs for testing.

## Step 7: Monitor Build Progress

After running the build command:

1. You'll see a build URL in the terminal
2. Visit the URL to monitor build progress
3. The build typically takes 5-15 minutes
4. You'll receive an email notification when complete

## Step 8: Download Your APK

Once the build completes:

1. Visit your Expo dashboard: [https://expo.dev/accounts/[username]/projects](https://expo.dev/accounts/[username]/projects)
2. Click on your project
3. Go to the "Builds" tab
4. Download the APK file
5. The APK can be shared and installed on any Android device

## Step 9: Install APK on Android Device

### Method 1: Direct Installation
1. Transfer the APK to your Android device
2. Open file manager and locate the APK
3. Tap to install (you may need to enable "Install from unknown sources")

### Method 2: ADB Installation
```bash
adb install path/to/your-app.apk
```

## Troubleshooting

### Build Fails
- Check your `app.json` configuration
- Ensure all assets exist in the specified paths
- Verify your package name is unique
- Check the build logs for specific errors

### APK Won't Install
- Enable "Install from unknown sources" in Android settings
- Check if the package name conflicts with an existing app
- Try uninstalling any previous versions first

### Performance Issues
- Use production build for better performance
- Optimize your assets (compress images)
- Remove any development-only dependencies

## Build Profiles Explanation

The `eas.json` file contains different build profiles:

- **development**: For development with Expo Go
- **preview**: Creates installable APK for testing (recommended for sharing)
- **production**: App store ready build with optimizations

## Cost Information

- **Free tier**: 30 builds per month
- **Production builds**: Use more resources
- **Preview builds**: Lighter, good for testing

## Security Notes

- Never commit sensitive API keys to your repository
- Use environment variables for sensitive data
- Consider code obfuscation for production builds

## Next Steps

After successfully building your APK:

1. Test thoroughly on different Android devices
2. Gather feedback from beta testers
3. Consider publishing to Google Play Store
4. Set up CI/CD for automated builds

## Useful Commands

```bash
# Check build status
eas build:list

# Cancel a build
eas build:cancel [build-id]

# View build logs
eas build:view [build-id]

# Update Expo CLI
npm install -g @expo/cli@latest

# Update EAS CLI
npm install -g eas-cli@latest
```

## Support

- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Expo Discord Community](https://discord.gg/expo)
- [Expo Forums](https://forums.expo.dev/)

---

**Note**: This guide assumes you're building from a macOS environment. The process is similar on Windows and Linux, but some commands might vary slightly.
