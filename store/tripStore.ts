import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TripPlan, Coordinates } from '../types';
import {
  firestoreGetSavedTrips,
  firestoreSaveTrip,
  firestoreDeleteTrip,
} from '../services/firebaseService';
import { useAuthStore } from './authStore';

const SAVED_TRIPS_KEY = 'evidey_saved_trips';
const CACHED_TRIP_KEY = 'evidey_cached_trip';

/** Get current user ID from authStore without subscribing */
function uid(): string | null {
  return useAuthStore.getState().user?.id ?? null;
}

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
    AsyncStorage.setItem(SAVED_TRIPS_KEY, JSON.stringify(updated)).catch((e) =>
      console.error('[TripStore] AsyncStorage saveTrip failed:', e)
    );
    const userId = uid();
    if (userId) {
      firestoreSaveTrip(userId, trip).catch((e) =>
        console.error('[TripStore] Firestore saveTrip failed:', e)
      );
    } else {
      console.warn('[TripStore] saveTrip: no user ID, Firestore write skipped');
    }
  },

  removeSavedTrip: (tripId) => {
    const updated = get().savedTrips.filter((t) => t.id !== tripId);
    set({ savedTrips: updated });
    AsyncStorage.setItem(SAVED_TRIPS_KEY, JSON.stringify(updated)).catch((e) =>
      console.error('[TripStore] AsyncStorage removeSavedTrip failed:', e)
    );
    const userId = uid();
    if (userId) {
      firestoreDeleteTrip(userId, tripId).catch((e) =>
        console.error('[TripStore] Firestore deleteTrip failed:', e)
      );
    }
  },

  loadSavedTrips: async () => {
    const userId = uid();
    if (userId) {
      try {
        // Firestore is the source of truth — always use it, even if empty
        const trips = await firestoreGetSavedTrips(userId);
        set({ savedTrips: trips });
        await AsyncStorage.setItem(SAVED_TRIPS_KEY, JSON.stringify(trips));
        return;
      } catch (e) {
        // Firestore failed (offline) — fall back to local cache for this user only
        console.error('[TripStore] loadSavedTrips Firestore error:', e);
      }
    }
    // Offline fallback — local cache
    try {
      const raw = await AsyncStorage.getItem(SAVED_TRIPS_KEY);
      if (raw) set({ savedTrips: JSON.parse(raw) });
    } catch (e) {
      console.error('[TripStore] loadSavedTrips AsyncStorage error:', e);
    }
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
