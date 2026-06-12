import { Redirect } from 'expo-router';
import { View, Text, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { Colors } from '../constants/colors';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background, gap: 16 }}>
        <View style={{
          width: 64, height: 64, borderRadius: 20,
          backgroundColor: Colors.primary,
          justifyContent: 'center', alignItems: 'center',
          shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
        }}>
          <Text style={{ fontSize: 28 }}>⚡</Text>
        </View>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;
  return <Redirect href="/(app)/(tabs)" />;
}
