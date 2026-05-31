import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Linking } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useTripStore } from '../store/tripStore';
import { requestNotificationPermissions } from '../services/notificationService';

function parseDeepLink(url: string | null) {
  if (!url) return null;
  try {
    // evidey://route?lat1=...&lng1=...&label1=...&lat2=...&lng2=...&label2=...&vehicleId=...
    const u = new URL(url);
    if (u.hostname !== 'route') return null;
    return {
      lat1: parseFloat(u.searchParams.get('lat1') ?? ''),
      lng1: parseFloat(u.searchParams.get('lng1') ?? ''),
      label1: decodeURIComponent(u.searchParams.get('label1') ?? ''),
      lat2: parseFloat(u.searchParams.get('lat2') ?? ''),
      lng2: parseFloat(u.searchParams.get('lng2') ?? ''),
      label2: decodeURIComponent(u.searchParams.get('label2') ?? ''),
      vehicleId: u.searchParams.get('vehicleId') ?? '',
    };
  } catch {
    return null;
  }
}

export default function RootLayout() {
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage);
  const loadTheme = useThemeStore((s) => s.loadTheme);
  const loadSavedTrips = useTripStore((s) => s.loadSavedTrips);
  const loadCachedTrip = useTripStore((s) => s.loadCachedTrip);
  const setOrigin = useTripStore((s) => s.setOrigin);
  const setDestination = useTripStore((s) => s.setDestination);
  const setSelectedVehicle = useTripStore((s) => s.setSelectedVehicle);
  const isDark = useThemeStore((s) => s.isDark);

  function handleDeepLink(url: string | null) {
    const params = parseDeepLink(url);
    if (!params) return;
    if (isNaN(params.lat1) || isNaN(params.lng1)) return;
    setOrigin(params.label1, { latitude: params.lat1, longitude: params.lng1 });
    setDestination(params.label2, { latitude: params.lat2, longitude: params.lng2 });
    if (params.vehicleId) setSelectedVehicle(params.vehicleId);
  }

  useEffect(() => {
    loadFromStorage();
    loadTheme();
    loadSavedTrips();
    loadCachedTrip();
    requestNotificationPermissions();

    // Handle cold-start deep link
    Linking.getInitialURL().then(handleDeepLink);

    // Handle warm-start deep link
    const sub = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));
    return () => sub.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </GestureHandlerRootView>
  );
}
