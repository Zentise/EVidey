import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { corsHeaders } from '../_shared/cors.ts';

/**
 * Unified Google Places proxy covering three operations:
 *   - autocomplete  → Places Autocomplete API
 *   - details       → Places Details API (placeId → coordinates)
 *   - geocode       → Geocoding API (address string → coordinates)
 *
 * POST body: { operation, ...operationParams }
 */

const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { operation } = body;

    let result: unknown;

    if (operation === 'autocomplete') {
      const { input, latitude, longitude } = body;
      const params = new URLSearchParams({
        input: input.trim(),
        key: GOOGLE_MAPS_API_KEY,
        language: 'en',
      });
      if (latitude != null && longitude != null) {
        params.set('location', `${latitude},${longitude}`);
        params.set('radius', '200000');
      }
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`
      );
      result = await res.json();

    } else if (operation === 'details') {
      const { placeId } = body;
      const params = new URLSearchParams({
        place_id: placeId,
        fields: 'geometry,name,formatted_address',
        key: GOOGLE_MAPS_API_KEY,
      });
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?${params}`
      );
      result = await res.json();

    } else if (operation === 'geocode') {
      const { address } = body;
      const params = new URLSearchParams({
        address,
        key: GOOGLE_MAPS_API_KEY,
      });
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?${params}`
      );
      result = await res.json();

    } else {
      return new Response(
        JSON.stringify({ error: `Unknown operation: ${operation}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
