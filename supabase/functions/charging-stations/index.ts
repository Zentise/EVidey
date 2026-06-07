import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { corsHeaders } from '../_shared/cors.ts';

/**
 * Proxies Open Charge Map /poi endpoint.
 * Accepts POST body: { latitude, longitude, radiusKm, stationIds? }
 * Returns raw OCM POI array.
 * API key never leaves this server.
 */

const OCM_API_KEY = Deno.env.get('OPEN_CHARGE_MAP_API_KEY')!;
const OCM_BASE = 'https://api.openchargemap.io/v3/poi';

interface StationsRequest {
  latitude: number;
  longitude: number;
  radiusKm: number;
  /** When provided, fetches status for specific station IDs (for refreshStationStatuses) */
  stationIds?: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { latitude, longitude, radiusKm, stationIds } =
      (await req.json()) as StationsRequest;

    const params = new URLSearchParams({
      output: 'json',
      compact: 'true',
      verbose: 'false',
      key: OCM_API_KEY,
    });

    if (stationIds && stationIds.length > 0) {
      params.set('id', stationIds.join(','));
    } else {
      params.set('latitude', String(latitude));
      params.set('longitude', String(longitude));
      params.set('distance', String(radiusKm));
      params.set('distanceunit', 'km');
      params.set('maxresults', '50');
    }

    const res = await fetch(`${OCM_BASE}?${params}`);
    const data = await res.json();

    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
