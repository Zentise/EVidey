import axios from 'axios';
import type { ChargingStation, ConnectorType, Coordinates, Amenity } from '../types';
import {
  AMENITY_SEARCH_RADIUS_METERS,
  edgeFunctionHeaders,
  edgeFunctionUrl,
} from '../constants/config';

/**
 * Fetch charging stations via the Supabase Edge Function proxy.
 * The Open Charge Map API key lives server-side in Supabase secrets.
 */
export async function fetchChargingStations(
  center: Coordinates,
  radiusKm: number,
  connectorFilter?: ConnectorType[]
): Promise<ChargingStation[]> {
  const { data } = await axios.post(
    edgeFunctionUrl('charging-stations'),
    { latitude: center.latitude, longitude: center.longitude, radiusKm },
    { headers: edgeFunctionHeaders() }
  );

  return (data as any[]).map((item) => ({
    id: String(item.ID),
    name: item.AddressInfo?.Title ?? 'Charging Station',
    operator: item.OperatorInfo?.Title,
    coordinates: {
      latitude: item.AddressInfo.Latitude,
      longitude: item.AddressInfo.Longitude,
    },
    connectors: (item.Connections ?? []).map(
      (c: any) => c.ConnectionType?.Title ?? 'Unknown'
    ) as ConnectorType[],
    powerKw: Math.max(
      ...(item.Connections ?? []).map((c: any) => c.PowerKW ?? 0)
    ),
    isOperational: item.StatusType?.IsOperational ?? true,
    address: item.AddressInfo?.AddressLine1 ?? '',
    amenities: [],
  }));
}

/**
 * Fetch nearby amenities via the Supabase Edge Function proxy.
 * All Google Places calls are consolidated server-side — no key in the app.
 */
export async function fetchAmenitiesNearStation(
  coords: Coordinates
): Promise<Amenity[]> {
  const nearbyTypes = [
    'cafe',
    'restaurant',
    'convenience_store',
    'rest_stop',
    'pharmacy',
  ];

  const { data } = await axios.post(
    edgeFunctionUrl('nearby-places'),
    {
      latitude: coords.latitude,
      longitude: coords.longitude,
      radius: AMENITY_SEARCH_RADIUS_METERS,
      types: nearbyTypes,
      lodgingRadius: 3000,
    },
    { headers: edgeFunctionHeaders() }
  );

  return ((data as any).amenities ?? []).map((place: any) => ({
    ...place,
    category: googleTypeToCategory(place.category),
    distanceMeters: haversineMeters(coords, place.coordinates),
  })) as Amenity[];
}

/**
 * Refresh operational status for a list of station IDs via Edge Function proxy.
 * Returns a map of stationId → isOperational.
 */
export async function refreshStationStatuses(
  stationIds: string[]
): Promise<Record<string, boolean>> {
  if (stationIds.length === 0) return {};
  try {
    const { data } = await axios.post(
      edgeFunctionUrl('charging-stations'),
      { stationIds },
      { headers: edgeFunctionHeaders() }
    );
    const result: Record<string, boolean> = {};
    for (const item of data as any[]) {
      result[String(item.ID)] = item.StatusType?.IsOperational ?? true;
    }
    return result;
  } catch {
    return {};
  }
}


function googleTypeToCategory(type: string): Amenity['category'] {
  const map: Record<string, Amenity['category']> = {
    cafe: 'cafe',
    restaurant: 'food',
    convenience_store: 'convenience_store',
    lodging: 'stay',
    rest_stop: 'rest_area',
    pharmacy: 'pharmacy',
  };
  return map[type] ?? 'rest_area';
}

function haversineMeters(a: Coordinates, b: Coordinates): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const aHav =
    sinLat * sinLat +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * sinLon * sinLon;
  return R * 2 * Math.atan2(Math.sqrt(aHav), Math.sqrt(1 - aHav));
}
