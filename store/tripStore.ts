import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TripPlan, Coordinates } from '../types';

const SAVED_TRIPS_KEY = 'evidey_saved_trips';

interface TripState {
  currentTrip: TripPlan | null;
  savedTrips: TripPlan[];
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
  setPlanning: (value: boolean) => void;
  resetPlanning: () => void;
}

export const useTripStore = create<TripState>((set, get) => ({
  currentTrip: null,
  savedTrips: [],
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
