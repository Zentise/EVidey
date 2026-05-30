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
import { useState, useEffect, useRef } from 'react';
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
import { Colors } from '../../../constants/colors';
import type { Coordinates } from '../../../types';

export default function PlanTripScreen() {
  const user = useAuthStore((s) => s.user);
  const {
    setOrigin,
    setDestination,
    setCurrentTrip,
    setSelectedVehicle,
    selectedVehicleId,
  } = useTripStore();

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

  useEffect(() => { fetchLocation(); }, []);

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
        try { originCoords = await getCurrentLocation(); setCurrentLocation(originCoords); }
        catch { Alert.alert('Location unavailable', 'Enable location permissions and try again.'); return; }
      }
      setOrigin(originCoords.label, originCoords);
      setDestination(destCoords.label, destCoords);
      setSelectedVehicle(activeVehicle.id);
      const trip = await planTrip(originCoords, destCoords, activeVehicle);
      setCurrentTrip(trip);
      router.push('/(app)/trip/route');
    } catch (err: any) {
      Alert.alert('Could not plan trip', err?.response?.data?.error?.message ?? err?.message ?? 'Check your internet and API key.');
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

      {/* Vehicle Selector */}
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

      {/* Origin */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>From</Text>
        <TouchableOpacity style={styles.originRow} onPress={fetchLocation}>
          <Text style={styles.originIcon}>📍</Text>
          <Text style={styles.originText} numberOfLines={1}>
            {loadingLocation ? 'Getting location...' : currentLocation?.label ?? 'Tap to get location'}
          </Text>
          {loadingLocation && <ActivityIndicator size="small" color={Colors.primary} />}
        </TouchableOpacity>
      </View>

      {/* Destination Input */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Destination</Text>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            value={destinationText}
            onChangeText={handleDestinationChange}
            placeholder="Search city or place..."
            placeholderTextColor={Colors.textMuted}
            returnKeyType="search"
            onSubmitEditing={handlePlanTrip}
          />
          {loadingSuggestions && (
            <ActivityIndicator size="small" color={Colors.primary} style={styles.inputLoader} />
          )}
        </View>
        {suggestions.length > 0 && (
          <View style={styles.suggestionsBox}>
            {suggestions.map((s) => (
              <TouchableOpacity key={s.placeId} style={styles.suggestionRow} onPress={() => handleSelectSuggestion(s)}>
                <Text style={styles.suggestionMain}>{s.mainText}</Text>
                {s.secondaryText ? <Text style={styles.suggestionSub} numberOfLines={1}>{s.secondaryText}</Text> : null}
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

      {/* Range Info */}
      {activeVehicle && (
        <View style={styles.rangeCard}>
          <Text style={styles.rangeLabel}>Estimated range available</Text>
          <Text style={styles.rangeValue}>{activeVehicle.realWorldRangeKm} km</Text>
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
            <ActivityIndicator color="#0F1923" />
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
  header: {
    marginBottom: 32,
  },
  greeting: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  vehicleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  vehicleChip: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    minWidth: 120,
  },
  vehicleChipActive: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}18`,
  },
  vehicleEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  vehicleName: {
    color: Colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  vehicleNameActive: {
    color: Colors.primary,
  },
  vehicleRange: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  originRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  originIcon: { fontSize: 16 },
  originText: { flex: 1, color: Colors.text, fontSize: 14 },
  inputWrap: { position: 'relative' },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    color: Colors.text,
    fontSize: 16,
    paddingRight: 44,
  },
  inputLoader: { position: 'absolute', right: 14, top: 16 },
  suggestionsBox: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    marginTop: 6,
    overflow: 'hidden',
  },
  suggestionRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  suggestionMain: { color: Colors.text, fontSize: 14, fontWeight: '600' },
  suggestionSub: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  confirmedBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: `${Colors.primary}20`,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  confirmedText: { color: Colors.primary, fontSize: 12, fontWeight: '600' },
  rangeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rangeLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rangeValue: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.primary,
    marginTop: 4,
  },
  rangeHint: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnText: {
    color: '#0F1923',
    fontWeight: '800',
    fontSize: 17,
  },
  addVehicleBtn: {
    marginTop: 20,
    alignItems: 'center',
  },
  addVehicleText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
});
