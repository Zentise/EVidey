/**
 * Firebase JS SDK initialization.
 * Uses modular (v9+) API — works in Expo Go without native modules.
 *
 * Setup:
 * 1. Create Firebase project at https://console.firebase.google.com
 * 2. Enable Authentication → Email/Password and Google providers
 * 3. Enable Firestore Database (start in test mode initially)
 * 4. Copy config values to your .env file (see .env.example)
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  inMemoryPersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithCredential,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  deleteDoc,
} from 'firebase/firestore';
import { FIREBASE_CONFIG } from '../constants/config';
import type { User, Vehicle, TripPlan } from '../types';

const isFirebaseConfigured = Boolean(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId);

let auth: ReturnType<typeof getAuth>;
let db: ReturnType<typeof getFirestore>;

if (isFirebaseConfigured) {
  const app = getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApp();
  try {
    auth = initializeAuth(app, {
      persistence: inMemoryPersistence,
    });
  } catch {
    // initializeAuth throws if already initialized (e.g. hot reload)
    auth = getAuth(app);
  }
  db = getFirestore(app, 'evidey');
}

export { auth, db, isFirebaseConfigured, GoogleAuthProvider, signInWithCredential, onAuthStateChanged };
export type { FirebaseUser };

export async function firebaseSignIn(email: string, password: string) {
  if (!isFirebaseConfigured) throw new Error('Firebase not configured');
  return signInWithEmailAndPassword(auth, email, password);
}

export async function firebaseRegister(email: string, password: string, displayName: string) {
  if (!isFirebaseConfigured) throw new Error('Firebase not configured');
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });
  return cred;
}

export async function firebaseSignOut() {
  if (!isFirebaseConfigured) return;
  return signOut(auth);
}

export function firebaseOnAuthChange(callback: (user: FirebaseUser | null) => void) {
  if (!isFirebaseConfigured) return () => {};
  return onAuthStateChanged(auth, callback);
}

// ─── Firestore: User profile ────────────────────────────────────────────────

/** Load a user's profile doc from Firestore. Returns null if not found. */
export async function firestoreGetUser(uid: string): Promise<User | null> {
  if (!isFirebaseConfigured) return null;
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as User) : null;
}

/** Write (merge) the user's profile doc. */
export async function firestoreSaveUser(user: User): Promise<void> {
  if (!isFirebaseConfigured) return;
  await setDoc(doc(db, 'users', user.id), user, { merge: true });
}

/** Update specific fields on the user's profile doc. */
export async function firestoreUpdateUser(uid: string, partial: Partial<User>): Promise<void> {
  if (!isFirebaseConfigured) return;
  await updateDoc(doc(db, 'users', uid), partial as Record<string, unknown>);
}

// ─── Firestore: Saved trips ──────────────────────────────────────────────────

/**
 * Recursively removes undefined values from an object so Firestore does not
 * reject the write. Firestore's JS SDK does not allow undefined field values.
 */
function sanitizeForFirestore(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);
  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (v !== undefined) result[k] = sanitizeForFirestore(v);
    }
    return result;
  }
  return obj;
}

/** Load all saved trips for a user. */
export async function firestoreGetSavedTrips(uid: string): Promise<TripPlan[]> {
  if (!isFirebaseConfigured) return [];
  const snap = await getDocs(collection(db, 'users', uid, 'savedTrips'));
  return snap.docs.map((d) => d.data() as TripPlan);
}

/** Save (upsert) a single trip. */
export async function firestoreSaveTrip(uid: string, trip: TripPlan): Promise<void> {
  if (!isFirebaseConfigured) return;
  const sanitized = sanitizeForFirestore(trip) as TripPlan;
  await setDoc(doc(db, 'users', uid, 'savedTrips', trip.id), sanitized);
}

/** Delete a single trip. */
export async function firestoreDeleteTrip(uid: string, tripId: string): Promise<void> {
  if (!isFirebaseConfigured) return;
  await deleteDoc(doc(db, 'users', uid, 'savedTrips', tripId));
}
