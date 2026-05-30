import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { Colors } from '../constants/colors';

export default function Index() {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // If authenticated but no vehicles added yet, send to onboarding
  if (!user?.vehicles?.length) {
    return <Redirect href="/(auth)/vehicle-setup" />;
  }

  return <Redirect href="/(app)/(tabs)" />;
}
