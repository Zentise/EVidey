import { create } from 'zustand';
import type { TripPlan, Coordinates } from '../types';

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
  setPlanning: (value: boolean) => void;
  resetPlanning: () => void;
}

export const useTripStore = create<TripState>((set) => ({
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

  saveTrip: (trip) =>
    set((state) => ({
      savedTrips: [trip, ...state.savedTrips.filter((t) => t.id !== trip.id)],
    })),

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
