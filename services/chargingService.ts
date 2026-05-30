import axios from 'axios';
import type { ChargingStation, ConnectorType, Coordinates, Amenity } from '../types';
import {
  OPEN_CHARGE_MAP_BASE_URL,
  API_KEYS,
  AMENITY_SEARCH_RADIUS_METERS,
} from '../constants/config';

/**
 * Fetch charging stations within a bounding box / radius from Open Charge Map.
 * Docs: https://openchargemap.org/site/develop/api
 */
export async function fetchChargingStations(
  center: Coordinates,
  radiusKm: number,
  connectorFilter?: ConnectorType[]
): Promise<ChargingStation[]> {
  const params: Record<string, unknown> = {
    output: 'json',
    latitude: center.latitude,
    longitude: center.longitude,
    distance: radiusKm,
    distanceunit: 'km',
    maxresults: 50,
    compact: true,
    verbose: false,
    key: API_KEYS.OPEN_CHARGE_MAP,
  };

  const { data } = await axios.get(`${OPEN_CHARGE_MAP_BASE_URL}/poi`, { params });

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
 * Fetch nearby amenities (food, cafes, washrooms, etc.) using Google Places.
 */
export async function fetchAmenitiesNearStation(
  coords: Coordinates
): Promise<Amenity[]> {
  const types = [
    'cafe',
    'restaurant',
    'convenience_store',
    'lodging',
    'rest_stop',
    'pharmacy',
  ];

  const results: Amenity[] = [];

  for (const type of types) {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json`;
    const params = {
      location: `${coords.latitude},${coords.longitude}`,
      radius: AMENITY_SEARCH_RADIUS_METERS,
      type,
      key: API_KEYS.GOOGLE_MAPS,
    };

    try {
      const { data } = await axios.get(url, { params });
      const places = (data.results ?? []).slice(0, 3);
      for (const place of places) {
        const lat: number = place.geometry.location.lat;
        const lng: number = place.geometry.location.lng;
        const dist = haversineMeters(coords, { latitude: lat, longitude: lng });

        results.push({
          id: place.place_id,
          name: place.name,
          category: googleTypeToCategory(type),
          coordinates: { latitude: lat, longitude: lng },
          distanceMeters: dist,
          rating: place.rating,
          isOpen: place.opening_hours?.open_now,
          address: place.vicinity,
        });
      }
    } catch {
      // Silently continue if one category fails
    }
  }

  return results;
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
