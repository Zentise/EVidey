import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, Vehicle } from '../types';
import {
  firebaseSignIn,
  firebaseSignOut,
  firebaseOnAuthChange,
  isFirebaseConfigured,
  firestoreGetUser,
  firestoreSaveUser,
  firestoreUpdateUser,
  GoogleAuthProvider,
  signInWithCredential,
  auth,
} from '../services/firebaseService';
import { signOutFromGoogle } from '../services/googleAuthService';

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
  loginWithGoogle: (idToken: string) => Promise<void>;
  updateUser: (partial: Partial<User>) => Promise<void>;
}

const AUTH_STORAGE_KEY = 'evidey_user';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: async (user) => {
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    await firestoreSaveUser(user);
    set({ user, isAuthenticated: true, isLoading: false });
  },

  loginWithEmail: async (email, password) => {
    if (isFirebaseConfigured) {
      const cred = await firebaseSignIn(email, password);
      const fbUser = cred.user;

      // Load profile from Firestore (source of truth)
      let user = await firestoreGetUser(fbUser.uid);
      if (!user) {
        // First login — create profile
        user = {
          id: fbUser.uid,
          name: fbUser.displayName ?? email.split('@')[0],
          email: fbUser.email ?? email,
          photoUrl: fbUser.photoURL ?? undefined,
          vehicles: [],
        };
        await firestoreSaveUser(user);
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

  loginWithGoogle: async (idToken: string) => {
    if (!isFirebaseConfigured) throw new Error('Firebase not configured');
    const credential = GoogleAuthProvider.credential(idToken);
    const cred = await signInWithCredential(auth, credential);
    const fbUser = cred.user;

    // Load existing profile or create a new one
    let user = await firestoreGetUser(fbUser.uid);
    if (!user) {
      user = {
        id: fbUser.uid,
        name: fbUser.displayName ?? fbUser.email?.split('@')[0] ?? 'User',
        email: fbUser.email ?? '',
        photoUrl: fbUser.photoURL ?? undefined,
        vehicles: [],
      };
      await firestoreSaveUser(user);
    }
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    set({ user, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    await AsyncStorage.removeItem('evidey_saved_trips');
    await AsyncStorage.removeItem('evidey_cached_trip');
    if (isFirebaseConfigured) await firebaseSignOut();
    await signOutFromGoogle();
    // Clear trip store state so another user's data is never shown
    const { useTripStore } = require('./tripStore');
    useTripStore.getState().resetPlanning();
    useTripStore.setState({ savedTrips: [], cachedTrip: null });
    set({ user: null, isAuthenticated: false });
  },

  updateUser: async (partial) => {
    const { user } = get();
    if (!user) return;
    const updated = { ...user, ...partial };
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
    await firestoreUpdateUser(user.id, partial);
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
    await firestoreSaveUser(updated);
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
    await firestoreSaveUser(updated);
    set({ user: updated });
  },

  setDefaultVehicle: async (vehicleId) => {
    const { user } = get();
    if (!user) return;
    const updated: User = { ...user, defaultVehicleId: vehicleId };
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
    await firestoreUpdateUser(user.id, { defaultVehicleId: vehicleId });
    set({ user: updated });
  },

  loadFromStorage: async () => {
    try {
      if (isFirebaseConfigured) {
        const unsubscribe = firebaseOnAuthChange(async (fbUser) => {
          unsubscribe();
          if (fbUser) {
            // Try Firestore first (cloud source of truth)
            let user = await firestoreGetUser(fbUser.uid);
            if (!user) {
              // Fall back to local cache if Firestore is empty (e.g. offline)
              const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
              user = raw ? JSON.parse(raw) : null;
            }
            if (user) {
              await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
              set({ user, isAuthenticated: true, isLoading: false });
              return;
            }
          }
          set({ isLoading: false });
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
