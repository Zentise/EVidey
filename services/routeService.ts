import axios from 'axios';
import type { Coordinates, RouteStop, TripPlan, Vehicle, ChargingStation } from '../types';
import { API_KEYS, MIN_ARRIVAL_BATTERY_PERCENT } from '../constants/config';
import { fetchChargingStations, fetchAmenitiesNearStation } from './chargingService';

/**
 * Core trip planning logic:
 * 1. Get route polyline + distance from Google Routes API
 * 2. Determine charging stops needed based on vehicle range
 * 3. Find real charging stations near each required stop point
 * 4. Fetch amenities around each chosen station
 */
export async function planTrip(
  origin: Coordinates & { label: string },
  destination: Coordinates & { label: string },
  vehicle: Vehicle
): Promise<TripPlan> {
  // --- Step 1: Get route from Google Routes API ---
  const routeRes = await axios.post(
    'https://routes.googleapis.com/directions/v2:computeRoutes',
    {
      origin: {
        location: {
          latLng: { latitude: origin.latitude, longitude: origin.longitude },
        },
      },
      destination: {
        location: {
          latLng: {
            latitude: destination.latitude,
            longitude: destination.longitude,
          },
        },
      },
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE',
      polylineQuality: 'HIGH_QUALITY',
    },
    {
      headers: {
        'X-Goog-Api-Key': API_KEYS.GOOGLE_MAPS,
        'X-Goog-FieldMask':
          'routes.duration,routes.distanceMeters,routes.polyline,routes.legs',
      },
    }
  );

  const route = routeRes.data.routes[0];
  const totalDistanceKm = (route.distanceMeters ?? 0) / 1000;
  const drivingMinutes = Math.round(
    parseInt(route.duration?.replace('s', '') ?? '0') / 60
  );
  const polyline: string = route.polyline?.encodedPolyline ?? '';

  // --- Step 2: Compute charging stop waypoints ---
  // Use 85% usable range for safety (accounting for real-world variance)
  const usableRangeKm = vehicle.realWorldRangeKm * 0.85;
  const stopPoints = computeStopCoordinates(
    origin,
    destination,
    totalDistanceKm,
    usableRangeKm
  );

  // --- Step 3 & 4: Find real stations + amenities for each stop ---
  const stops: RouteStop[] = [];
  let batteryPercent = 100;
  let prevKm = 0;

  for (const point of stopPoints) {
    let stations = await fetchChargingStations(point, 30, vehicle.connectorTypes);
    if (stations.length === 0) {
      // Widen search to 60km if nothing found nearby (sparse infrastructure)
      stations = await fetchChargingStations(point, 60, vehicle.connectorTypes);
    }
    if (stations.length === 0) continue;

    // Pick the highest-power compatible station
    const station = stations.sort((a, b) => b.powerKw - a.powerKw)[0];
    station.amenities = await fetchAmenitiesNearStation(station.coordinates);

    const distFromPrev = point.distanceKm - prevKm;
    const consumedPercent = (distFromPrev / vehicle.realWorldRangeKm) * 100;
    const arrivalPercent = Math.max(batteryPercent - consumedPercent, 5);
    const targetPercent = 80; // charge to 80% to avoid slow top-up
    const chargePercent = targetPercent - arrivalPercent;
    const chargeMinutes = Math.round(
      (chargePercent / 100) * vehicle.batteryCapacityKwh * (60 / station.powerKw)
    );

    stops.push({
      station,
      arrivalBatteryPercent: Math.round(arrivalPercent),
      departureBatteryPercent: targetPercent,
      estimatedChargeMinutes: Math.max(chargeMinutes, 15),
      distanceFromPrevKm: Math.round(distFromPrev),
    });

    batteryPercent = targetPercent;
    prevKm = point.distanceKm;
  }

  return {
    id: Date.now().toString(),
    origin,
    destination,
    vehicleId: vehicle.id,
    totalDistanceKm: Math.round(totalDistanceKm),
    estimatedDrivingMinutes: drivingMinutes,
    stops,
    polyline,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Distribute stop waypoints evenly along the route based on usable range.
 * Returns approximate coordinates for each required charging stop.
 */
function computeStopCoordinates(
  origin: Coordinates,
  destination: Coordinates,
  totalKm: number,
  usableRangeKm: number
): Array<Coordinates & { distanceKm: number }> {
  const numStops = Math.floor(totalKm / usableRangeKm);
  if (numStops <= 0) return [];

  const points: Array<Coordinates & { distanceKm: number }> = [];
  for (let i = 1; i <= numStops; i++) {
    const fraction = (i * usableRangeKm) / totalKm;
    points.push({
      latitude:
        origin.latitude + fraction * (destination.latitude - origin.latitude),
      longitude:
        origin.longitude + fraction * (destination.longitude - origin.longitude),
      distanceKm: i * usableRangeKm,
    });
  }
  return points;
}
