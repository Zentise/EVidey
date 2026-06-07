import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { corsHeaders } from '../_shared/cors.ts';

/**
 * Proxies Google Places Nearby Search.
 * Accepts a POST body with: latitude, longitude, radius, types[], lodgingRadius?
 * Returns: { amenities: Amenity[] }
 * All Google Places calls are consolidated here — no API key touches the client.
 */

const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY')!;
const PLACES_URL =
  'https://maps.googleapis.com/maps/api/place/nearbysearch/json';

interface PlacesRequest {
  latitude: number;
  longitude: number;
  radius: number;
  types: string[];
  lodgingRadius?: number;
}

async function searchNearby(
  location: string,
  radius: number,
  type: string,
  rankby?: string
) {
  const params = new URLSearchParams({
    location,
    radius: String(radius),
    type,
    key: GOOGLE_MAPS_API_KEY,
  });
  if (rankby) {
    params.delete('radius');
    params.set('rankby', rankby);
  }
  const res = await fetch(`${PLACES_URL}?${params}`);
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { latitude, longitude, radius, types, lodgingRadius = 3000 } =
      (await req.json()) as PlacesRequest;

    const location = `${latitude},${longitude}`;
    const amenities: unknown[] = [];

    // Regular nearby types
    for (const type of types) {
      try {
        const data = await searchNearby(location, radius, type);
        const places = (data.results ?? []).slice(0, 3);
        for (const place of places) {
          amenities.push({
            id: place.place_id,
            name: place.name,
            category: type,
            coordinates: {
              latitude: place.geometry.location.lat,
              longitude: place.geometry.location.lng,
            },
            rating: place.rating,
            isOpen: place.opening_hours?.open_now,
            address: place.vicinity,
          });
        }
      } catch {
        // silently skip failed categories
      }
    }

    // Lodging at wider radius
    try {
      const data = await searchNearby(location, lodgingRadius, 'lodging');
      const places = (data.results ?? []).slice(0, 5);
      for (const place of places) {
        amenities.push({
          id: place.place_id,
          name: place.name,
          category: 'lodging',
          coordinates: {
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
          },
          rating: place.rating,
          isOpen: place.opening_hours?.open_now,
          address: place.vicinity,
        });
      }
    } catch {
      // silently skip lodging
    }

    return new Response(JSON.stringify({ amenities }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
