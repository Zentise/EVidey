import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { useMemo } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '../../../store/authStore';
import { useTripStore } from '../../../store/tripStore';
import { useTheme } from '../../../hooks/useTheme';
import type { ColorScheme } from '../../../constants/colors';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const savedTrips = useTripStore((s) => s.savedTrips);
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const totalKm = savedTrips.reduce((sum, t) => sum + t.totalDistanceKm, 0);
  const initials = (user?.name ?? '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

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
      <Text style={styles.pageTitle}>Profile</Text>

      {/* Avatar + identity */}
      <View style={styles.identityCard}>
        <View style={styles.avatarRing}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{savedTrips.length}</Text>
          <Text style={styles.statLabel}>Trips</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{Math.round(totalKm)}</Text>
          <Text style={styles.statLabel}>km planned</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{user?.vehicles?.length ?? 0}</Text>
          <Text style={styles.statLabel}>Vehicles</Text>
        </View>
      </View>

      {/* Vehicles */}
      <Text style={styles.sectionLabel}>My Vehicles</Text>
      {(user?.vehicles ?? []).map((v) => (
        <View key={v.id} style={styles.vehicleCard}>
          <View style={styles.vehicleIconWrap}>
            <Text style={styles.vehicleEmoji}>{v.type === 'car' ? '🚗' : '🛵'}</Text>
          </View>
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

      {/* Settings */}
      <Text style={[styles.sectionLabel, { marginTop: 28 }]}>Settings</Text>
      <View style={styles.settingRow}>
        <Text style={styles.settingIcon}>{isDark ? '🌙' : '☀️'}</Text>
        <Text style={styles.settingLabel}>{isDark ? 'Dark Mode (AMOLED)' : 'Light Mode (AMOLED)'}</Text>
        <Switch
          value={isDark}
          onValueChange={toggleTheme}
          trackColor={{ false: colors.border, true: `${colors.primary}66` }}
          thumbColor={colors.primary}
        />
      </View>

      {/* Account */}
      <Text style={[styles.sectionLabel, { marginTop: 28 }]}>Account</Text>
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: 24, paddingTop: 64, paddingBottom: 48 },
    pageTitle: {
      fontSize: 30,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 28,
    },
    identityCard: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 24,
      paddingVertical: 28,
      paddingHorizontal: 24,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    avatarRing: {
      width: 84,
      height: 84,
      borderRadius: 42,
      borderWidth: 2.5,
      borderColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 14,
    },
    avatar: {
      width: 74,
      height: 74,
      borderRadius: 37,
      backgroundColor: `${colors.primary}33`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.primary,
    },
    name: { fontSize: 20, fontWeight: '700', color: colors.text },
    email: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
    statsRow: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 20,
      marginBottom: 28,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    statCard: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 24, fontWeight: '800', color: colors.primary },
    statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 4, fontWeight: '600' },
    statDivider: { width: 1, height: 36, backgroundColor: colors.border },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1.2,
      marginBottom: 12,
    },
    vehicleCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 10,
    },
    vehicleIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: `${colors.primary}22`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    vehicleEmoji: { fontSize: 24 },
    vehicleInfo: { flex: 1 },
    vehicleName: { fontSize: 15, fontWeight: '700', color: colors.text },
    vehicleDetails: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    vehicleConnectors: { fontSize: 11, color: colors.primary, marginTop: 4, fontWeight: '600' },
    addBtn: {
      borderWidth: 1.5,
      borderColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 13,
      alignItems: 'center',
      marginTop: 4,
    },
    addBtnText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
    },
    settingIcon: { fontSize: 20 },
    settingLabel: { flex: 1, fontSize: 15, color: colors.text, fontWeight: '500' },
    logoutBtn: {
      paddingVertical: 14,
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    logoutText: { color: colors.error, fontWeight: '600', fontSize: 15 },
  });
}
