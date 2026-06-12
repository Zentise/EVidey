/**
 * Native Google Sign-In service using @react-native-google-signin/google-signin.
 *
 * This replaces the browser-based expo-auth-session approach with a native
 * sign-in dialog that is faster, more reliable, and officially recommended
 * by both Expo and Google.
 *
 * Prerequisites:
 * - google-services.json must be placed in the project root
 * - SHA-1 fingerprint(s) registered in Firebase Console
 * - Google provider enabled in Firebase Authentication
 */
import {
  GoogleSignin,
  isSuccessResponse,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { GOOGLE_WEB_CLIENT_ID } from '../constants/config';

let isConfigured = false;

/**
 * Call once at app startup (e.g. in root layout).
 * Safe to call multiple times — will only configure once.
 */
export function configureGoogleSignIn() {
  if (isConfigured) return;
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    offlineAccess: false,
  });
  isConfigured = true;
}

/**
 * Opens the native Google Sign-In dialog and returns the `idToken`.
 * Throws if the user cancels or an error occurs.
 */
export async function signInWithGoogle(): Promise<{ idToken: string }> {
  configureGoogleSignIn();

  // Ensure Google Play Services are available (no-op on iOS)
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  const response = await GoogleSignin.signIn();

  if (isSuccessResponse(response)) {
    const idToken = response.data?.idToken;
    if (!idToken) {
      throw new Error(
        'Google Sign-In succeeded but no idToken was returned. ' +
          'Make sure webClientId is set correctly.',
      );
    }
    return { idToken };
  }

  // User cancelled
  throw new Error('Google Sign-In was cancelled.');
}

/**
 * Sign out from Google (clears cached credentials on the device).
 */
export async function signOutFromGoogle() {
  try {
    await GoogleSignin.signOut();
  } catch {
    // Silently ignore — the user may not have been signed in with Google
  }
}
