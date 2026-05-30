import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, Vehicle } from '../types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  logout: () => void;
  addVehicle: (vehicle: Vehicle) => void;
  setDefaultVehicle: (vehicleId: string) => void;
  loadFromStorage: () => Promise<void>;
}

const AUTH_STORAGE_KEY = 'evidey_user';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: async (user) => {
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    set({ user, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    set({ user: null, isAuthenticated: false });
  },

  addVehicle: async (vehicle) => {
    const { user } = get();
    if (!user) return;
    const updated: User = {
      ...user,
      vehicles: [...user.vehicles, vehicle],
      defaultVehicleId: user.defaultVehicleId ?? vehicle.id,
    };
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
    set({ user: updated });
  },

  setDefaultVehicle: async (vehicleId) => {
    const { user } = get();
    if (!user) return;
    const updated: User = { ...user, defaultVehicleId: vehicleId };
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
    set({ user: updated });
  },

  loadFromStorage: async () => {
    try {
      const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        const user: User = JSON.parse(raw);
        set({ user, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
