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
import { getFirestore } from 'firebase/firestore';
import { FIREBASE_CONFIG } from '../constants/config';

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
