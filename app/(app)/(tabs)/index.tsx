import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useState, useEffect, useRef, useMemo } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '../../../store/authStore';
import { useTripStore } from '../../../store/tripStore';
import { planTrip } from '../../../services/routeService';
import {
  getCurrentLocation,
  getPlaceSuggestions,
  getPlaceCoordinates,
  geocodeAddress,
  type PlaceSuggestion,
} from '../../../services/locationService';
import { useTheme } from '../../../hooks/useTheme';
import type { ColorScheme } from '../../../constants/colors';
import type { Coordinates, Vehicle } from '../../../types';

function computeEffectiveRange(v: Vehicle): number {
  if (v.batteryHealthPercent !== undefined) return v.realWorldRangeKm * (v.batteryHealthPercent / 100);
  if (v.currentMileageKm) {
    const factor = Math.max(0.70, 1 - (v.currentMileageKm / 100000) * 0.03);
    return v.realWorldRangeKm * factor;
  }
  return v.realWorldRangeKm;
}

export default function PlanTripScreen() {
  const user = useAuthStore((s) => s.user);
  const {
    setOrigin,
    setDestination,
    setCurrentTrip,
    setSelectedVehicle,
    selectedVehicleId,
    cachedTrip,
    loadCachedTrip,
    cacheCurrentTrip,
    setOffline,
  } = useTripStore();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [destinationText, setDestinationText] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [selectedDest, setSelectedDest] = useState<(Coordinates & { label: string }) | null>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<(Coordinates & { label: string }) | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [planning, setPlanning] = useState(false);
  const suggestDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const vehicles = user?.vehicles ?? [];
  const activeVehicleId = selectedVehicleId ?? user?.defaultVehicleId ?? vehicles[0]?.id;
  const activeVehicle = vehicles.find((v) => v.id === activeVehicleId);
  const effectiveRange = activeVehicle ? Math.round(computeEffectiveRange(activeVehicle)) : 0;
  const isDegraded = activeVehicle && effectiveRange < activeVehicle.realWorldRangeKm;

  useEffect(() => {
    fetchLocation();
    loadCachedTrip();
  }, []);

  async function fetchLocation() {
    setLoadingLocation(true);
    try {
      const loc = await getCurrentLocation();
      setCurrentLocation(loc);
    } catch (err: any) {
      console.warn('Location error:', err.message);
    } finally {
      setLoadingLocation(false);
    }
  }

  function handleDestinationChange(text: string) {
    setDestinationText(text);
    setSelectedDest(null);
    if (suggestDebounce.current) clearTimeout(suggestDebounce.current);
    if (text.trim().length < 2) { setSuggestions([]); return; }
    suggestDebounce.current = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const results = await getPlaceSuggestions(text, currentLocation ?? undefined);
        setSuggestions(results);
      } catch { setSuggestions([]); }
      finally { setLoadingSuggestions(false); }
    }, 400);
  }

  async function handleSelectSuggestion(s: PlaceSuggestion) {
    setSuggestions([]);
    setDestinationText(s.mainText);
    try {
      const coords = await getPlaceCoordinates(s.placeId);
      setSelectedDest(coords);
    } catch {
      try { setSelectedDest(await geocodeAddress(s.description)); }
      catch (e: any) { Alert.alert('Location error', e.message); }
    }
  }

  async function handlePlanTrip() {
    if (!destinationText.trim()) {
      Alert.alert('Missing destination', 'Please enter where you want to go.');
      return;
    }
    if (!activeVehicle) {
      Alert.alert('No vehicle', 'Add a vehicle in your profile first.');
      return;
    }
    setPlanning(true);
    try {
      let destCoords = selectedDest ?? await geocodeAddress(destinationText.trim());
      let originCoords = currentLocation;
      if (!originCoords) {
        try {
          originCoords = await getCurrentLocation();
          setCurrentLocation(originCoords);
        } catch {
          Alert.alert('Location unavailable', 'Enable location permissions and try again.');
          return;
        }
      }
      setOrigin(originCoords.label, originCoords);
      setDestination(destCoords.label, destCoords);
      setSelectedVehicle(activeVehicle.id);
      const trip = await planTrip(originCoords, destCoords, activeVehicle);
      setCurrentTrip(trip);
      await cacheCurrentTrip(trip);
      router.push('/(app)/trip/route');
    } catch (err: any) {
      const isOfflineErr =
        err?.message?.toLowerCase().includes('network') ||
        err?.message?.toLowerCase().includes('timeout') ||
        err?.code === 'ERR_NETWORK';
      if (isOfflineErr && cachedTrip) {
        setOffline(true);
        Alert.alert(
          'You appear to be offline',
          'Showing your last saved route instead.',
          [
            {
              text: 'Load Last Trip',
              onPress: () => {
                setCurrentTrip(cachedTrip);
                router.push('/(app)/trip/route');
              },
            },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      } else {
        Alert.alert(
          'Could not plan trip',
          err?.response?.data?.error?.message ?? err?.message ?? 'Check your internet and API key.'
        );
      }
    } finally {
      setPlanning(false);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.greeting}>Hey, {user?.name?.split(' ')[0]} 👋</Text>
          <Text style={styles.title}>Where to?</Text>
        </View>

        {vehicles.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Vehicle</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.vehicleRow}>
                {vehicles.map((v) => (
                  <TouchableOpacity
                    key={v.id}
                    style={[
                      styles.vehicleChip,
                      v.id === activeVehicleId && styles.vehicleChipActive,
                    ]}
                    onPress={() => setSelectedVehicle(v.id)}
                  >
                    <Text style={styles.vehicleEmoji}>
                      {v.type === 'car' ? '🚗' : '🛵'}
                    </Text>
                    <Text
                      style={[
                        styles.vehicleName,
                        v.id === activeVehicleId && styles.vehicleNameActive,
                      ]}
                    >
                      {v.name}
                    </Text>
                    <Text style={styles.vehicleRange}>{v.realWorldRangeKm} km</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>From</Text>
          <TouchableOpacity style={styles.originRow} onPress={fetchLocation}>
            <Text style={styles.originIcon}>📍</Text>
            <Text style={styles.originText} numberOfLines={1}>
              {loadingLocation ? 'Getting location...' : currentLocation?.label ?? 'Tap to get location'}
            </Text>
            {loadingLocation && <ActivityIndicator size="small" color={colors.primary} />}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Destination</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={destinationText}
              onChangeText={handleDestinationChange}
              placeholder="Search city or place..."
              placeholderTextColor={colors.textMuted}
              returnKeyType="search"
              onSubmitEditing={handlePlanTrip}
            />
            {loadingSuggestions && (
              <ActivityIndicator size="small" color={colors.primary} style={styles.inputLoader} />
            )}
          </View>
          {suggestions.length > 0 && (
            <View style={styles.suggestionsBox}>
              {suggestions.map((s) => (
                <TouchableOpacity
                  key={s.placeId}
                  style={styles.suggestionRow}
                  onPress={() => handleSelectSuggestion(s)}
                >
                  <Text style={styles.suggestionMain}>{s.mainText}</Text>
                  {s.secondaryText ? (
                    <Text style={styles.suggestionSub} numberOfLines={1}>{s.secondaryText}</Text>
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>
          )}
          {selectedDest && (
            <View style={styles.confirmedBadge}>
              <Text style={styles.confirmedText}>✓ {selectedDest.label}</Text>
            </View>
          )}
        </View>

        {activeVehicle && (
          <View style={styles.rangeCard}>
            <Text style={styles.rangeLabel}>Estimated range available</Text>
            <Text style={styles.rangeValue}>{effectiveRange} km</Text>
            {isDegraded && (
              <Text style={styles.degradedNote}>
                ⚠️ Nominal {activeVehicle.realWorldRangeKm} km · degradation applied
              </Text>
            )}
            <Text style={styles.rangeHint}>
              {activeVehicle.batteryCapacityKwh} kWh battery ·{' '}
              {activeVehicle.connectorTypes.join(', ')}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.btn, (planning || !destinationText.trim()) && styles.btnDisabled]}
          onPress={handlePlanTrip}
          disabled={planning || !destinationText.trim()}
        >
          {planning ? (
            <View style={styles.btnRow}>
              <ActivityIndicator color={colors.primaryForeground} />
              <Text style={[styles.btnText, { marginLeft: 10 }]}>Planning route...</Text>
            </View>
          ) : (
            <Text style={styles.btnText}>Plan Trip ⚡</Text>
          )}
        </TouchableOpacity>

        {vehicles.length === 0 && (
          <TouchableOpacity
            style={styles.addVehicleBtn}
            onPress={() => router.push('/(auth)/vehicle-setup')}
          >
            <Text style={styles.addVehicleText}>+ Add a vehicle to start planning</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: 24, paddingTop: 64, paddingBottom: 40 },
    header: { marginBottom: 32 },
    greeting: { fontSize: 16, color: colors.textSecondary },
    title: { fontSize: 34, fontWeight: '800', color: colors.text, marginTop: 4 },
    section: { marginBottom: 24 },
    sectionLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 10,
    },
    vehicleRow: { flexDirection: 'row', gap: 12 },
    vehicleChip: {
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
      alignItems: 'center',
      minWidth: 120,
    },
    vehicleChipActive: {
      borderColor: colors.primary,
      backgroundColor: `${colors.primary}18`,
    },
    vehicleEmoji: { fontSize: 24, marginBottom: 4 },
    vehicleName: { color: colors.textSecondary, fontWeight: '600', fontSize: 13 },
    vehicleNameActive: { color: colors.primary },
    vehicleRange: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
    originRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 10,
    },
    originIcon: { fontSize: 16 },
    originText: { flex: 1, color: colors.text, fontSize: 14 },
    inputWrap: { position: 'relative' },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: 14,
      paddingHorizontal: 18,
      paddingVertical: 16,
      color: colors.text,
      fontSize: 16,
      paddingRight: 44,
    },
    inputLoader: { position: 'absolute', right: 14, top: 16 },
    suggestionsBox: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      marginTop: 6,
      overflow: 'hidden',
    },
    suggestionRow: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    suggestionMain: { color: colors.text, fontSize: 14, fontWeight: '600' },
    suggestionSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
    confirmedBadge: {
      marginTop: 8,
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: `${colors.primary}20`,
      borderRadius: 8,
      alignSelf: 'flex-start',
    },
    confirmedText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
    rangeCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 28,
      borderWidth: 1,
      borderColor: colors.border,
    },
    rangeLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    rangeValue: { fontSize: 36, fontWeight: '800', color: colors.primary, marginTop: 4 },
    degradedNote: { fontSize: 12, color: colors.warning, marginTop: 2, fontWeight: '600' },
    rangeHint: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
    btn: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 18,
      alignItems: 'center',
    },
    btnDisabled: { opacity: 0.6 },
    btnRow: { flexDirection: 'row', alignItems: 'center' },
    btnText: { color: colors.primaryForeground, fontWeight: '800', fontSize: 17 },
    addVehicleBtn: { marginTop: 20, alignItems: 'center' },
    addVehicleText: { color: colors.primary, fontSize: 15, fontWeight: '600' },
  });
}
