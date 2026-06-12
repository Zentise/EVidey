# EVidey — Common Dev Commands

## Daily Development

### Start dev server (after app is already installed on device)
```powershell
npx expo start --dev-client
```

### Start dev server and clear Metro cache
```powershell
npx expo start --dev-client --clear
```

---

## Build & Install on Connected Android Device

### Full native build + auto-install on connected device
```powershell
npx expo run:android
```
> Use this when you change `.env`, `app.config.js`, add a new native package, or after `adb uninstall`.

### If install fails due to signature mismatch
```powershell
adb uninstall com.zentise.evidey
npx expo run:android
```

### Install an already-built APK manually
```powershell
adb install "android\app\build\outputs\apk\debug\app-debug.apk"
```

---

## Supabase Edge Functions

### Deploy a single function
```powershell
supabase functions deploy compute-routes
supabase functions deploy nearby-places
supabase functions deploy charging-stations
supabase functions deploy place-search
```

### Deploy all functions at once
```powershell
supabase functions deploy
```

### Update a server-side secret
```powershell
supabase secrets set SECRET_NAME=value
```

### List current secrets
```powershell
supabase secrets list
```

---

## EAS Cloud Builds

### Build a development client APK (internal testing)
```powershell
eas build --profile development --platform android
```

### Build a production APK
```powershell
eas build --profile production --platform android
```

### Build a preview APK (release-signed, no store)
```powershell
eas build --profile preview --platform android
```

### Check build status
```powershell
eas build:list
```

---

## ADB Utilities

### Check connected devices
```powershell
adb devices
```

### Get app signing SHA-1 (needed for Google Cloud Console key restriction)
```powershell
cd android; .\gradlew signingReport
```

### View live app logs from device
```powershell
adb logcat -s ReactNative ReactNativeJS
```

### Uninstall app from device
```powershell
adb uninstall com.zentise.evidey
```

---

## Supabase CLI

### Link project to local workspace
```powershell
supabase link --project-ref hoiohtvfasepklrzmlen
```

### Login
```powershell
supabase login
```

---

## Package Management

### Install dependencies
```powershell
npm install
```

### Add a new Expo-compatible package
```powershell
npx expo install <package-name>
```

> Always use `npx expo install` instead of `npm install` for packages that have native modules — it picks the version compatible with your Expo SDK.
