// app.config.js — dynamic Expo config so we can read .env at build time.
// Expo automatically loads .env files, so process.env.EXPO_PUBLIC_* is available here.

const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  name: 'EVidey',
  slug: 'evidey',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  scheme: 'evidey',
  extra: {
    eas: {
      projectId: '3d038622-84ab-456f-8719-3b759bddebba',
    },
  },
  android: {
    package: 'com.zentise.evidey',
    adaptiveIcon: {
      backgroundColor: '#0F1923',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    config: {
      googleMaps: {
        // This embeds the key into the native AndroidManifest.xml
        apiKey: googleMapsApiKey,
      },
    },
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-status-bar',
    [
      'react-native-maps',
      {
        androidGoogleMapsApiKey: googleMapsApiKey,
      },
    ],
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission: 'EVidey needs your location to find charging stops along your route.',
        locationWhenInUsePermission: 'EVidey needs your location to find charging stops along your route.',
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/icon.png',
        color: '#00C853',
        sounds: [],
      },
    ],
  ],
};
