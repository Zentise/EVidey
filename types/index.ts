export type VehicleType = 'car' | 'two_wheeler';

export type ConnectorType =
  | 'CCS2'
  | 'CHAdeMO'
  | 'Type2'
  | 'GB/T'
  | 'Type1'
  | 'CCS1';

export interface Vehicle {
  id: string;
  name: string;             // user-given nickname e.g. "My Tesla"
  make: string;
  model: string;
  year: number;
  type: VehicleType;
  batteryCapacityKwh: number;
  realWorldRangeKm: number;
  connectorTypes: ConnectorType[];
  /** 0–100 — actual battery health from OBD or manufacturer app (optional) */
  batteryHealthPercent?: number;
  /** Odometer reading in km — used to estimate degradation if healthPercent not set */
  currentMileageKm?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  vehicles: Vehicle[];
  defaultVehicleId?: string;
  photoUrl?: string;
}

export interface Review {
  id: string;
  stationId: string;
  userId: string;
  userName: string;
  rating: number;      // 1–5
  comment: string;
  createdAt: string;   // ISO string
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface ChargingStation {
  id: string;
  name: string;
  operator?: string;
  coordinates: Coordinates;
  connectors: ConnectorType[];
  powerKw: number;
  isOperational: boolean;
  address: string;
  amenities: Amenity[];
}

export type AmenityCategory =
  | 'food'
  | 'cafe'
  | 'convenience_store'
  | 'washroom'
  | 'rest_area'
  | 'pharmacy'
  | 'atm'
  | 'stay';

export interface Amenity {
  id: string;
  name: string;
  category: AmenityCategory;
  coordinates: Coordinates;
  distanceMeters: number;
  rating?: number;
  isOpen?: boolean;
  address?: string;
}

export interface RouteStop {
  station: ChargingStation;
  arrivalBatteryPercent: number;
  departureBatteryPercent: number;
  estimatedChargeMinutes: number;
  distanceFromPrevKm: number;
}

export interface TripPlan {
  id: string;
  origin: Coordinates & { label: string };
  destination: Coordinates & { label: string };
  vehicleId: string;
  totalDistanceKm: number;
  estimatedDrivingMinutes: number;
  stops: RouteStop[];
  polyline: string;      // encoded polyline from Google
  createdAt: string;
}
