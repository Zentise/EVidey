import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Switch, Animated,
} from 'react-native';
import { useMemo, useRef, useEffect } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '../../../store/authStore';
import { useTripStore } from '../../../store/tripStore';
import { useTheme } from '../../../hooks/useTheme';
import type { ColorScheme } from '../../../constants/colors';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const removeVehicle = useAuthStore(s => s.removeVehicle);
  const savedTrips = useTripStore(s => s.savedTrips);
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const totalKm = savedTrips.reduce((sum, t) => sum + t.totalDistanceKm, 0);
  const initials = (user?.name ?? '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  function handleLogout() {
    Alert.alert('Log out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/login'); } },
    ]);
  }

  function handleDeleteVehicle(vehicleId: string, vehicleName: string) {
    Alert.alert('Remove Vehicle', `Remove "${vehicleName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeVehicle(vehicleId) },
    ]);
  }

  return (
    <Animated.View style={[{ flex: 1, backgroundColor: colors.background }, { opacity: fadeAnim }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsCard}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{savedTrips.length}</Text>
            <Text style={styles.statLabel}>Trips</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{Math.round(totalKm)}</Text>
            <Text style={styles.statLabel}>km planned</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{user?.vehicles?.length ?? 0}</Text>
            <Text style={styles.statLabel}>Vehicles</Text>
          </View>
        </View>

        {/* Vehicles */}
        <Text style={styles.sectionLabel}>My Vehicles</Text>
        {(user?.vehicles ?? []).map(v => (
          <View key={v.id} style={styles.vehicleCard}>
            <View style={styles.vehicleIconWrap}>
              <Text style={{ fontSize: 24 }}>{v.type === 'car' ? '🚗' : '🛵'}</Text>
            </View>
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleName}>{v.name}</Text>
              <Text style={styles.vehicleDetails}>{v.year} · {v.batteryCapacityKwh} kWh · {v.realWorldRangeKm} km</Text>
              <Text style={styles.vehicleConnectors}>{v.connectorTypes.join(' · ')}</Text>
            </View>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDeleteVehicle(v.id, v.name)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.deleteBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={styles.addVehicleBtn} onPress={() => router.push('/(auth)/vehicle-setup')} activeOpacity={0.8}>
          <Text style={styles.addVehicleText}>+ Add Vehicle</Text>
        </TouchableOpacity>

        {/* Settings */}
        <Text style={[styles.sectionLabel, { marginTop: 32 }]}>Settings</Text>
        <View style={styles.settingRow}>
          <Text style={styles.settingIcon}>{isDark ? '🌙' : '☀️'}</Text>
          <Text style={styles.settingLabel}>{isDark ? 'Dark Mode' : 'Light Mode'}</Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.primary + '88' }}
            thumbColor={isDark ? colors.primary : colors.textMuted}
          />
        </View>

        {/* Logout */}
        <Text style={[styles.sectionLabel, { marginTop: 32 }]}>Account</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </Animated.View>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    content: { paddingHorizontal: 20, paddingTop: 64, paddingBottom: 48 },
    hero: { alignItems: 'center', marginBottom: 24 },
    avatarWrap: {
      width: 88, height: 88, borderRadius: 44,
      backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center',
      marginBottom: 14,
      shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2, shadowRadius: 10, elevation: 4,
    },
    avatar: {
      width: 80, height: 80, borderRadius: 40,
      backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
    },
    avatarText: { fontSize: 30, fontWeight: '800', color: colors.primaryForeground },
    name: { fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
    email: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
    statsCard: {
      flexDirection: 'row', backgroundColor: colors.surface,
      borderRadius: 20, padding: 20, marginBottom: 28,
      borderWidth: 1, borderColor: colors.border, alignItems: 'center',
      shadowColor: colors.cardShadow, shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07, shadowRadius: 10, elevation: 2,
    },
    stat: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 26, fontWeight: '800', color: colors.primary },
    statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 4, fontWeight: '600' },
    statDivider: { width: 1, height: 36, backgroundColor: colors.border },
    sectionLabel: {
      fontSize: 11, fontWeight: '700', color: colors.textMuted,
      textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12,
    },
    vehicleCard: {
      backgroundColor: colors.surface, borderRadius: 16, padding: 16,
      flexDirection: 'row', alignItems: 'center', gap: 14,
      borderWidth: 1, borderColor: colors.border, marginBottom: 10,
      shadowColor: colors.cardShadow, shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
    },
    vehicleIconWrap: {
      width: 48, height: 48, borderRadius: 14,
      backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center',
    },
    vehicleInfo: { flex: 1 },
    vehicleName: { fontSize: 15, fontWeight: '700', color: colors.text },
    vehicleDetails: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    vehicleConnectors: { fontSize: 11, color: colors.primary, marginTop: 3, fontWeight: '700' },
    deleteBtn: {
      padding: 8, borderRadius: 10,
      backgroundColor: colors.error + '15',
    },
    deleteBtnText: { fontSize: 13, color: colors.error, fontWeight: '700' },
    addVehicleBtn: {
      borderWidth: 1.5, borderColor: colors.primary, borderRadius: 14,
      paddingVertical: 14, alignItems: 'center', borderStyle: 'dashed',
    },
    addVehicleText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
    settingRow: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.surface, borderRadius: 16, padding: 18,
      borderWidth: 1, borderColor: colors.border, gap: 12,
    },
    settingIcon: { fontSize: 20 },
    settingLabel: { flex: 1, fontSize: 15, color: colors.text, fontWeight: '500' },
    logoutBtn: {
      paddingVertical: 16, alignItems: 'center',
      backgroundColor: colors.surface, borderRadius: 16,
      borderWidth: 1, borderColor: colors.border,
    },
    logoutText: { color: colors.error, fontWeight: '700', fontSize: 15 },
  });
}
