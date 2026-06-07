// Supabase project credentials — safe to bundle (anon key is public by design).
// API keys for Google Maps and Open Charge Map are stored as Supabase secrets
// and never bundled into the app.
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** Returns headers required to call a Supabase Edge Function */
export function edgeFunctionHeaders() {
  return {
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    apikey: SUPABASE_ANON_KEY,
  };
}

/** Base URL for all Edge Function calls */
export function edgeFunctionUrl(name: string) {
  return `${SUPABASE_URL}/functions/v1/${name}`;
}

export const FIREBASE_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

/** Web OAuth client ID from Google Cloud Console → APIs & Services → Credentials */
export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';

// Kept for reference only — direct API calls are now proxied via Edge Functions.
// export const OPEN_CHARGE_MAP_BASE_URL = 'https://api.openchargemap.io/v3';
// export const GOOGLE_PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place';
// export const GOOGLE_ROUTES_BASE_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes';

// Minimum battery % to arrive at a charging stop
export const MIN_ARRIVAL_BATTERY_PERCENT = 15;

// Show amenities within this radius of a charging station (meters)
export const AMENITY_SEARCH_RADIUS_METERS = 500;

/** Distance in km to trigger proximity notification for upcoming charging stop */
export const PROXIMITY_ALERT_KM = 5;
