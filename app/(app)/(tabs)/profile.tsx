import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../../store/authStore';
import { Colors } from '../../../constants/colors';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  function handleLogout() {
    Alert.alert('Log out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.[0]?.toUpperCase() ?? '?'}
          </Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <Text style={styles.sectionLabel}>My Vehicles</Text>
      {(user?.vehicles ?? []).map((v) => (
        <View key={v.id} style={styles.vehicleCard}>
          <Text style={styles.vehicleEmoji}>
            {v.type === 'car' ? '🚗' : '🛵'}
          </Text>
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleName}>{v.name}</Text>
            <Text style={styles.vehicleDetails}>
              {v.year} · {v.batteryCapacityKwh} kWh · {v.realWorldRangeKm} km range
            </Text>
            <Text style={styles.vehicleConnectors}>
              {v.connectorTypes.join(' · ')}
            </Text>
          </View>
        </View>
      ))}

      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => router.push('/(auth)/vehicle-setup')}
      >
        <Text style={styles.addBtnText}>+ Add Vehicle</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 40,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 28,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 32,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0F1923',
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  email: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  vehicleCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  vehicleEmoji: {
    fontSize: 28,
    marginTop: 2,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  vehicleDetails: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  vehicleConnectors: {
    fontSize: 12,
    color: Colors.primary,
    marginTop: 4,
    fontWeight: '600',
  },
  addBtn: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  addBtnText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 15,
  },
  logoutBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  logoutText: {
    color: Colors.error,
    fontWeight: '600',
    fontSize: 15,
  },
});
