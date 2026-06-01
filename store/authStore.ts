import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, Vehicle } from '../types';
import {
  firebaseSignIn,
  firebaseSignOut,
  firebaseOnAuthChange,
  isFirebaseConfigured,
} from '../services/firebaseService';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  logout: () => Promise<void>;
  addVehicle: (vehicle: Vehicle) => void;
  removeVehicle: (vehicleId: string) => void;
  setDefaultVehicle: (vehicleId: string) => void;
  loadFromStorage: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  updateUser: (partial: Partial<User>) => Promise<void>;
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

  loginWithEmail: async (email, password) => {
    if (isFirebaseConfigured) {
      const cred = await firebaseSignIn(email, password);
      const fbUser = cred.user;
      const user: User = {
        id: fbUser.uid,
        name: fbUser.displayName ?? email.split('@')[0],
        email: fbUser.email ?? email,
        photoUrl: fbUser.photoURL ?? undefined,
        vehicles: [],
      };
      // Merge existing vehicles from local storage (in case user had vehicles saved)
      const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        const cached: User = JSON.parse(raw);
        if (cached.id === user.id) {
          user.vehicles = cached.vehicles;
          user.defaultVehicleId = cached.defaultVehicleId;
        }
      }
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      set({ user, isAuthenticated: true, isLoading: false });
    } else {
      // Fallback mock login when Firebase is not configured
      const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      let existing: User | null = null;
      if (raw) {
        const parsed: User = JSON.parse(raw);
        if (parsed.email === email.trim().toLowerCase()) existing = parsed;
      }
      const user: User = existing ?? {
        id: `local_${Date.now()}`,
        name: email.split('@')[0],
        email: email.trim().toLowerCase(),
        vehicles: [],
      };
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      set({ user, isAuthenticated: true, isLoading: false });
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    if (isFirebaseConfigured) await firebaseSignOut();
    set({ user: null, isAuthenticated: false });
  },

  updateUser: async (partial) => {
    const { user } = get();
    if (!user) return;
    const updated = { ...user, ...partial };
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
    set({ user: updated });
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

  removeVehicle: async (vehicleId) => {
    const { user } = get();
    if (!user) return;
    const vehicles = user.vehicles.filter((v) => v.id !== vehicleId);
    const defaultVehicleId =
      user.defaultVehicleId === vehicleId
        ? (vehicles[0]?.id ?? undefined)
        : user.defaultVehicleId;
    const updated: User = { ...user, vehicles, defaultVehicleId };
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
      // Listen for Firebase auth state changes
      if (isFirebaseConfigured) {
        const unsubscribe = firebaseOnAuthChange(async (fbUser) => {
          unsubscribe();
          if (fbUser) {
            const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
            if (raw) {
              const cached: User = JSON.parse(raw);
              if (cached.id === fbUser.uid) {
                set({ user: cached, isAuthenticated: true, isLoading: false });
                return;
              }
            }
          }
          // Fall through to AsyncStorage check
          const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
          if (raw) {
            set({ user: JSON.parse(raw), isAuthenticated: true, isLoading: false });
          } else {
            set({ isLoading: false });
          }
        });
        return;
      }
      // Non-Firebase: load directly from AsyncStorage
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
