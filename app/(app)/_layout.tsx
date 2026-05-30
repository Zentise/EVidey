import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="trip/route"
        options={{ presentation: 'fullScreenModal' }}
      />
      <Stack.Screen
        name="trip/stop-detail"
        options={{ presentation: 'card' }}
      />
    </Stack>
  );
}
