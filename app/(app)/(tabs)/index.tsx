import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Animated,
} from 'react-native';
import { useState, useEffect, useRef, useMemo } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '../../../store/authStore';
import { useTripStore } from '../../../store/tripStore';
import { planTrip } from '../../../services/routeService';
import {
  getCurrentLocation, getPlaceSuggestions, getPlaceCoordinates,
  geocodeAddress, type PlaceSuggestion,
} from '../../../services/locationService';
import { useTheme } from '../../../hooks/useTheme';
import type { ColorScheme } from '../../../constants/colors';
import type { Coordinates, Vehicle } from '../../../types';

function computeEffectiveRange(v: Vehicle): number {
  if (v.batteryHealthPercent !== undefined) return v.realWorldRangeKm * (v.batteryHealthPercent / 100);
  if (v.currentMileageKm) return v.realWorldRangeKm * Math.max(0.70, 1 - (v.currentMileageKm / 100000) * 0.03);
  return v.realWorldRangeKm;
}

export default function PlanTripScreen() {
  const user = useAuthStore(s => s.user);
  const { setOrigin, setDestination, setCurrentTrip, setSelectedVehicle,
    selectedVehicleId, cachedTrip, loadCachedTrip, cacheCurrentTrip, setOffline } = useTripStore();
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
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const vehicles = user?.vehicles ?? [];
  const activeVehicleId = selectedVehicleId ?? user?.defaultVehicleId ?? vehicles[0]?.id;
  const activeVehicle = vehicles.find(v => v.id === activeVehicleId);
  const effectiveRange = activeVehicle ? Math.round(computeEffectiveRange(activeVehicle)) : 0;

  useEffect(() => {
    fetchLocation();
    loadCachedTrip();
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  async function fetchLocation() {
    setLoadingLocation(true);
    try {
      const loc = await getCurrentLocation();
      setCurrentLocation(loc);
    } catch {}
    finally { setLoadingLocation(false); }
  }

  function handleDestinationChange(text: string) {
    setDestinationText(text);
    setSelectedDest(null);
    if (suggestDebounce.current) clearTimeout(suggestDebounce.current);
    if (text.trim().length < 2) { setSuggestions([]); return; }
    suggestDebounce.current = setTimeout(async () => {
      setLoadingSuggestions(true);
      try { setSuggestions(await getPlaceSuggestions(text, currentLocation ?? undefined)); }
      catch { setSuggestions([]); }
      finally { setLoadingSuggestions(false); }
    }, 400);
  }

  async function handleSelectSuggestion(s: PlaceSuggestion) {
    setSuggestions([]);
    setDestinationText(s.mainText);
    try { setSelectedDest(await getPlaceCoordinates(s.placeId)); }
    catch { try { setSelectedDest(await geocodeAddress(s.description)); } catch (e: any) { Alert.alert('Location error', e.message); } }
  }

  async function handlePlanTrip() {
    if (!destinationText.trim()) { Alert.alert('Missing destination', 'Enter where you want to go.'); return; }
    if (!activeVehicle) { Alert.alert('No vehicle', 'Add a vehicle in your profile first.'); return; }
    setPlanning(true);
    try {
      const destCoords = selectedDest ?? await geocodeAddress(destinationText.trim());
      let originCoords = currentLocation;
      if (!originCoords) {
        try { originCoords = await getCurrentLocation(); setCurrentLocation(originCoords); }
        catch { Alert.alert('Location unavailable', 'Enable location permissions.'); return; }
      }
      setOrigin(originCoords.label, originCoords);
      setDestination(destCoords.label, destCoords);
      setSelectedVehicle(activeVehicle.id);
      const trip = await planTrip(originCoords, destCoords, activeVehicle);
      setCurrentTrip(trip);
      await cacheCurrentTrip(trip);
      router.push('/(app)/trip/route');
    } catch (err: any) {
      const isOffline = err?.message?.toLowerCase().includes('network') || err?.message?.toLowerCase().includes('timeout');
      if (isOffline && cachedTrip) {
        setOffline(true);
        Alert.alert('Offline', 'Showing your last saved route.', [
          { text: 'Load Last Trip', onPress: () => { setCurrentTrip(cachedTrip); router.push('/(app)/trip/route'); } },
          { text: 'Cancel', style: 'cancel' },
        ]);
      } else {
        Alert.alert('Could not plan trip', err?.response?.data?.error?.message ?? err?.message ?? 'Check connection.');
      }
    } finally { setPlanning(false); }
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0]} 👋</Text>
          <Text style={styles.title}>Where to?</Text>
        </View>

        {/* Search card */}
        <View style={styles.searchCard}>
          {/* From */}
          <TouchableOpacity style={styles.searchRow} onPress={fetchLocation} activeOpacity={0.7}>
            <View style={[styles.dot, { backgroundColor: colors.success }]} />
            <Text style={styles.searchRowText} numberOfLines={1}>
              {loadingLocation ? 'Getting location…' : currentLocation?.label ?? 'Your location'}
            </Text>
            {loadingLocation && <ActivityIndicator size="small" color={colors.primary} />}
          </TouchableOpacity>

          <View style={styles.searchDivider} />

          {/* To */}
          <View style={styles.searchRow}>
            <View style={[styles.dot, { backgroundColor: colors.error }]} />
            <TextInput
              style={styles.searchInput}
              value={destinationText}
              onChangeText={handleDestinationChange}
              placeholder="Search destination…"
              placeholderTextColor={colors.textMuted}
              returnKeyType="search"
              onSubmitEditing={handlePlanTrip}
            />
            {loadingSuggestions && <ActivityIndicator size="small" color={colors.primary} />}
          </View>
        </View>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <View style={styles.suggestionsBox}>
            {suggestions.map(s => (
              <TouchableOpacity key={s.placeId} style={styles.suggestionRow} onPress={() => handleSelectSuggestion(s)} activeOpacity={0.7}>
                <Text style={styles.suggestionIcon}>📍</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.suggestionMain} numberOfLines={1}>{s.mainText}</Text>
                  {s.secondaryText ? <Text style={styles.suggestionSub} numberOfLines={1}>{s.secondaryText}</Text> : null}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {selectedDest && (
          <View style={styles.confirmedBadge}>
            <Text style={styles.confirmedText}>✓ {selectedDest.label}</Text>
          </View>
        )}

        {/* Vehicle selector */}
        {vehicles.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Vehicle</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.vehicleRow}>
                {vehicles.map(v => (
                  <TouchableOpacity
                    key={v.id}
                    style={[styles.vehicleCard, v.id === activeVehicleId && styles.vehicleCardActive]}
                    onPress={() => setSelectedVehicle(v.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.vehicleEmoji}>{v.type === 'car' ? '🚗' : '🛵'}</Text>
                    <Text style={[styles.vehicleName, v.id === activeVehicleId && styles.vehicleNameActive]} numberOfLines={1}>
                      {v.name}
                    </Text>
                    <Text style={styles.vehicleRange}>{v.realWorldRangeKm} km</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Range card */}
        {activeVehicle && (
          <View style={styles.rangeCard}>
            <View>
              <Text style={styles.rangeLabel}>Range available</Text>
              <Text style={styles.rangeValue}>{effectiveRange} <Text style={styles.rangeUnit}>km</Text></Text>
              <Text style={styles.rangeHint}>{activeVehicle.batteryCapacityKwh} kWh · {activeVehicle.connectorTypes.join(', ')}</Text>
            </View>
            <View style={styles.rangePill}>
              <Text style={styles.rangePillText}>⚡</Text>
            </View>
          </View>
        )}

        {/* CTA */}
        <TouchableOpacity
          style={[styles.planBtn, (planning || !destinationText.trim()) && styles.planBtnDisabled]}
          onPress={handlePlanTrip}
          disabled={planning || !destinationText.trim()}
          activeOpacity={0.85}
        >
          {planning ? (
            <View style={styles.btnRow}>
              <ActivityIndicator color={colors.primaryForeground} />
              <Text style={[styles.planBtnText, { marginLeft: 10 }]}>Planning route…</Text>
            </View>
          ) : (
            <Text style={styles.planBtnText}>Plan Trip  →</Text>
          )}
        </TouchableOpacity>

        {vehicles.length === 0 && (
          <TouchableOpacity style={styles.addVehicleBtn} onPress={() => router.push('/(auth)/vehicle-setup')}>
            <Text style={styles.addVehicleText}>+ Add a vehicle to start planning</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </Animated.View>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: 20, paddingTop: 64, paddingBottom: 40 },
    header: { marginBottom: 24 },
    greeting: { fontSize: 15, color: colors.textSecondary, fontWeight: '500' },
    title: { fontSize: 36, fontWeight: '800', color: colors.text, marginTop: 2, letterSpacing: -0.5 },
    searchCard: {
      backgroundColor: colors.surface,
      borderRadius: 20, marginBottom: 10,
      borderWidth: 1, borderColor: colors.border,
      shadowColor: colors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
    },
    searchRow: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 18, paddingVertical: 16, gap: 12,
    },
    dot: { width: 10, height: 10, borderRadius: 5 },
    searchRowText: { flex: 1, color: colors.text, fontSize: 15 },
    searchDivider: { height: 1, backgroundColor: colors.borderLight, marginLeft: 46 },
    searchInput: { flex: 1, color: colors.text, fontSize: 15, padding: 0 },
    suggestionsBox: {
      backgroundColor: colors.surface,
      borderRadius: 16, marginBottom: 8,
      borderWidth: 1, borderColor: colors.border,
      overflow: 'hidden',
      shadowColor: colors.cardShadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
    },
    suggestionRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingHorizontal: 16, paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: colors.borderLight,
    },
    suggestionIcon: { fontSize: 14 },
    suggestionMain: { color: colors.text, fontSize: 14, fontWeight: '600' },
    suggestionSub: { color: colors.textMuted, fontSize: 12, marginTop: 1 },
    confirmedBadge: {
      flexDirection: 'row', alignSelf: 'flex-start',
      backgroundColor: colors.primaryLight, borderRadius: 20,
      paddingHorizontal: 14, paddingVertical: 6, marginBottom: 12,
    },
    confirmedText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
    section: { marginBottom: 20 },
    sectionLabel: {
      fontSize: 11, fontWeight: '700', color: colors.textMuted,
      textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10,
    },
    vehicleRow: { flexDirection: 'row', gap: 10 },
    vehicleCard: {
      backgroundColor: colors.surface, borderWidth: 1.5,
      borderColor: colors.border, borderRadius: 16,
      paddingHorizontal: 16, paddingVertical: 14, alignItems: 'center', minWidth: 110,
      shadowColor: colors.cardShadow,
      shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05,
      shadowRadius: 4, elevation: 1,
    },
    vehicleCardActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    vehicleEmoji: { fontSize: 24, marginBottom: 4 },
    vehicleName: { color: colors.textSecondary, fontWeight: '600', fontSize: 12, maxWidth: 100 },
    vehicleNameActive: { color: colors.primary },
    vehicleRange: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
    rangeCard: {
      backgroundColor: colors.surface, borderRadius: 20, padding: 20, marginBottom: 20,
      borderWidth: 1, borderColor: colors.border,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      shadowColor: colors.cardShadow,
      shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 2,
    },
    rangeLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '600', marginBottom: 4 },
    rangeValue: { fontSize: 40, fontWeight: '800', color: colors.primary },
    rangeUnit: { fontSize: 20, fontWeight: '600' },
    rangeHint: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
    rangePill: {
      width: 52, height: 52, borderRadius: 16,
      backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center',
    },
    rangePillText: { fontSize: 24 },
    planBtn: {
      backgroundColor: colors.primary, borderRadius: 18,
      paddingVertical: 18, alignItems: 'center',
      shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3, shadowRadius: 14, elevation: 6,
    },
    planBtnDisabled: { opacity: 0.5, shadowOpacity: 0 },
    btnRow: { flexDirection: 'row', alignItems: 'center' },
    planBtnText: { color: colors.primaryForeground, fontWeight: '800', fontSize: 17, letterSpacing: 0.3 },
    addVehicleBtn: { marginTop: 20, alignItems: 'center' },
    addVehicleText: { color: colors.primary, fontSize: 15, fontWeight: '600' },
  });
}
