// Replace with your actual keys — never commit real keys to source control.
// Store these in a .env file (see .env.example) and load via expo-constants.
export const API_KEYS = {
  GOOGLE_MAPS: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
  OPEN_CHARGE_MAP: process.env.EXPO_PUBLIC_OCM_API_KEY ?? '',
};

export const OPEN_CHARGE_MAP_BASE_URL = 'https://api.openchargemap.io/v3';
export const GOOGLE_PLACES_BASE_URL =
  'https://maps.googleapis.com/maps/api/place';
export const GOOGLE_ROUTES_BASE_URL =
  'https://routes.googleapis.com/directions/v2:computeRoutes';

// Minimum battery % to arrive at a charging stop
export const MIN_ARRIVAL_BATTERY_PERCENT = 15;

// Show amenities within this radius of a charging station (meters)
export const AMENITY_SEARCH_RADIUS_METERS = 500;
