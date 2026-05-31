import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TripPlan, Coordinates } from '../types';

const SAVED_TRIPS_KEY = 'evidey_saved_trips';
const CACHED_TRIP_KEY = 'evidey_cached_trip';

interface TripState {
  currentTrip: TripPlan | null;
  savedTrips: TripPlan[];
  cachedTrip: TripPlan | null;
  isOffline: boolean;
  /** stationId → isOperational (live refresh result) */
  stationStatuses: Record<string, boolean>;
  isPlanning: boolean;
  originLabel: string;
  destinationLabel: string;
  originCoords: Coordinates | null;
  destinationCoords: Coordinates | null;
  selectedVehicleId: string | null;
  setOrigin: (label: string, coords: Coordinates) => void;
  setDestination: (label: string, coords: Coordinates) => void;
  setSelectedVehicle: (vehicleId: string) => void;
  setCurrentTrip: (trip: TripPlan) => void;
  saveTrip: (trip: TripPlan) => void;
  removeSavedTrip: (tripId: string) => void;
  loadSavedTrips: () => Promise<void>;
  loadCachedTrip: () => Promise<void>;
  cacheCurrentTrip: (trip: TripPlan) => Promise<void>;
  setOffline: (value: boolean) => void;
  updateStationStatuses: (statuses: Record<string, boolean>) => void;
  setPlanning: (value: boolean) => void;
  resetPlanning: () => void;
}

export const useTripStore = create<TripState>((set, get) => ({
  currentTrip: null,
  savedTrips: [],
  cachedTrip: null,
  isOffline: false,
  stationStatuses: {},
  isPlanning: false,
  originLabel: '',
  destinationLabel: '',
  originCoords: null,
  destinationCoords: null,
  selectedVehicleId: null,

  setOrigin: (label, coords) =>
    set({ originLabel: label, originCoords: coords }),

  setDestination: (label, coords) =>
    set({ destinationLabel: label, destinationCoords: coords }),

  setSelectedVehicle: (vehicleId) => set({ selectedVehicleId: vehicleId }),

  setCurrentTrip: (trip) => set({ currentTrip: trip, isPlanning: false }),

  saveTrip: (trip) => {
    const updated = [trip, ...get().savedTrips.filter((t) => t.id !== trip.id)];
    set({ savedTrips: updated });
    AsyncStorage.setItem(SAVED_TRIPS_KEY, JSON.stringify(updated)).catch(() => {});
  },

  removeSavedTrip: (tripId) => {
    const updated = get().savedTrips.filter((t) => t.id !== tripId);
    set({ savedTrips: updated });
    AsyncStorage.setItem(SAVED_TRIPS_KEY, JSON.stringify(updated)).catch(() => {});
  },

  loadSavedTrips: async () => {
    try {
      const raw = await AsyncStorage.getItem(SAVED_TRIPS_KEY);
      if (raw) set({ savedTrips: JSON.parse(raw) });
    } catch {}
  },

  cacheCurrentTrip: async (trip) => {
    set({ cachedTrip: trip });
    await AsyncStorage.setItem(CACHED_TRIP_KEY, JSON.stringify(trip)).catch(() => {});
  },

  loadCachedTrip: async () => {
    try {
      const raw = await AsyncStorage.getItem(CACHED_TRIP_KEY);
      if (raw) set({ cachedTrip: JSON.parse(raw) });
    } catch {}
  },

  setOffline: (value) => set({ isOffline: value }),

  updateStationStatuses: (statuses) =>
    set({ stationStatuses: { ...get().stationStatuses, ...statuses } }),

  setPlanning: (value) => set({ isPlanning: value }),

  resetPlanning: () =>
    set({
      currentTrip: null,
      isPlanning: false,
      originLabel: '',
      destinationLabel: '',
      originCoords: null,
      destinationCoords: null,
    }),
}));
