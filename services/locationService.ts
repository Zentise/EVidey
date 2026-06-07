import axios from 'axios';
import * as Location from 'expo-location';
import type { Coordinates } from '../types';
import { edgeFunctionHeaders, edgeFunctionUrl } from '../constants/config';

export interface PlaceSuggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

/**
 * Get the device's current GPS coordinates.
 * Requests permission if not already granted.
 */
export async function getCurrentLocation(): Promise<Coordinates & { label: string }> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission denied. Please enable it in Settings.');
  }

  const loc = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  // Reverse geocode to get a readable label
  const [place] = await Location.reverseGeocodeAsync({
    latitude: loc.coords.latitude,
    longitude: loc.coords.longitude,
  });

  const label = place
    ? [place.name, place.district, place.city].filter(Boolean).join(', ')
    : 'Current Location';

  return {
    latitude: loc.coords.latitude,
    longitude: loc.coords.longitude,
    label,
  };
}

/**
 * Autocomplete place suggestions via Supabase Edge Function proxy.
 */
export async function getPlaceSuggestions(
  input: string,
  locationBias?: Coordinates
): Promise<PlaceSuggestion[]> {
  if (input.trim().length < 2) return [];

  const { data } = await axios.post(
    edgeFunctionUrl('place-search'),
    {
      operation: 'autocomplete',
      input: input.trim(),
      latitude: locationBias?.latitude,
      longitude: locationBias?.longitude,
    },
    { headers: edgeFunctionHeaders() }
  );

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    console.warn('Places Autocomplete error:', data.status, data.error_message);
    return [];
  }

  return (data.predictions ?? []).map((p: any) => ({
    placeId: p.place_id,
    description: p.description,
    mainText: p.structured_formatting?.main_text ?? p.description,
    secondaryText: p.structured_formatting?.secondary_text ?? '',
  }));
}

/**
 * Resolve a Google Place ID to coordinates via Supabase Edge Function proxy.
 */
export async function getPlaceCoordinates(
  placeId: string
): Promise<Coordinates & { label: string }> {
  const { data } = await axios.post(
    edgeFunctionUrl('place-search'),
    { operation: 'details', placeId },
    { headers: edgeFunctionHeaders() }
  );

  const result = data.result;
  return {
    latitude: result.geometry.location.lat,
    longitude: result.geometry.location.lng,
    label: result.name ?? result.formatted_address,
  };
}

/**
 * Fallback: geocode a plain text address string to coordinates via Supabase Edge Function proxy.
 */
export async function geocodeAddress(
  address: string
): Promise<Coordinates & { label: string }> {
  const { data } = await axios.post(
    edgeFunctionUrl('place-search'),
    { operation: 'geocode', address },
    { headers: edgeFunctionHeaders() }
  );

  if (data.status !== 'OK' || !data.results?.length) {
    throw new Error(`Could not find location: "${address}"`);
  }

  const top = data.results[0];
  return {
    latitude: top.geometry.location.lat,
    longitude: top.geometry.location.lng,
    label: top.formatted_address,
  };
}
