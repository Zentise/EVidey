import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Animated,
} from 'react-native';
import { useMemo, useRef, useEffect } from 'react';
import { router } from 'expo-router';
import { useTripStore } from '../../../store/tripStore';
import { useTheme } from '../../../hooks/useTheme';
import type { ColorScheme } from '../../../constants/colors';
import type { TripPlan } from '../../../types';

export default function SavedTripsScreen() {
  const savedTrips = useTripStore(s => s.savedTrips);
  const setCurrentTrip = useTripStore(s => s.setCurrentTrip);
  const removeSavedTrip = useTripStore(s => s.removeSavedTrip);
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  function handleOpenTrip(trip: TripPlan) {
    setCurrentTrip(trip);
    router.push('/(app)/trip/route');
  }

  function handleDelete(trip: TripPlan) {
    Alert.alert('Remove trip', `Remove "${trip.origin.label.split(',')[0]} → ${trip.destination.label.split(',')[0]}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeSavedTrip(trip.id) },
    ]);
  }

  return (
    <Animated.View style={[{ flex: 1, backgroundColor: colors.background }, { opacity: fadeAnim }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Saved Trips</Text>

        {savedTrips.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Text style={styles.emptyIcon}>🔖</Text>
            </View>
            <Text style={styles.emptyTitle}>No saved trips yet</Text>
            <Text style={styles.emptySubtitle}>
              Plan a trip and save it here for quick access later.
            </Text>
            <TouchableOpacity style={styles.planBtn} onPress={() => router.push('/(app)/(tabs)')} activeOpacity={0.85}>
              <Text style={styles.planBtnText}>Plan a Trip  →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          savedTrips.map(trip => (
            <TouchableOpacity
              key={trip.id}
              style={styles.tripCard}
              onPress={() => handleOpenTrip(trip)}
              activeOpacity={0.8}
            >
              {/* Route */}
              <View style={styles.routeRow}>
                <View style={styles.routeIconCol}>
                  <View style={[styles.routeDot, { backgroundColor: colors.success }]} />
                  <View style={styles.routeLine} />
                  <View style={[styles.routeDot, { backgroundColor: colors.error }]} />
                </View>
                <View style={styles.routeLabels}>
                  <Text style={styles.routeText} numberOfLines={1}>{trip.origin.label.split(',')[0]}</Text>
                  <View style={{ height: 12 }} />
                  <Text style={styles.routeText} numberOfLines={1}>{trip.destination.label.split(',')[0]}</Text>
                </View>
              </View>

              {/* Meta */}
              <View style={styles.metaRow}>
                <View style={styles.metaPill}>
                  <Text style={styles.metaText}>📏 {trip.totalDistanceKm} km</Text>
                </View>
                <View style={styles.metaPill}>
                  <Text style={styles.metaText}>⚡ {trip.stops.length} stop{trip.stops.length !== 1 ? 's' : ''}</Text>
                </View>
                <View style={styles.metaPill}>
                  <Text style={styles.metaText}>🕐 {Math.floor(trip.estimatedDrivingMinutes / 60)}h {trip.estimatedDrivingMinutes % 60}m</Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(trip)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.deleteIcon}>🗑️</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.tripDate}>
                {new Date(trip.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </Animated.View>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    content: { paddingHorizontal: 20, paddingTop: 64, paddingBottom: 40 },
    pageTitle: { fontSize: 30, fontWeight: '800', color: colors.text, marginBottom: 24, letterSpacing: -0.3 },
    emptyState: { alignItems: 'center', paddingTop: 60 },
    emptyIconWrap: {
      width: 80, height: 80, borderRadius: 24,
      backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 20,
    },
    emptyIcon: { fontSize: 36 },
    emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 8 },
    emptySubtitle: {
      fontSize: 14, color: colors.textSecondary, textAlign: 'center',
      lineHeight: 20, paddingHorizontal: 24, marginBottom: 28,
    },
    planBtn: {
      backgroundColor: colors.primary, borderRadius: 14,
      paddingVertical: 14, paddingHorizontal: 28,
      shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25, shadowRadius: 10, elevation: 4,
    },
    planBtnText: { color: colors.primaryForeground, fontWeight: '700', fontSize: 15 },
    tripCard: {
      backgroundColor: colors.surface, borderRadius: 20, padding: 18,
      marginBottom: 12, borderWidth: 1, borderColor: colors.border,
      shadowColor: colors.cardShadow, shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07, shadowRadius: 10, elevation: 2,
    },
    routeRow: { flexDirection: 'row', gap: 14, marginBottom: 14 },
    routeIconCol: { alignItems: 'center', paddingTop: 2, gap: 0 },
    routeDot: { width: 10, height: 10, borderRadius: 5 },
    routeLine: { width: 2, flex: 1, backgroundColor: colors.border, marginVertical: 4 },
    routeLabels: { flex: 1, justifyContent: 'space-between' },
    routeText: { fontSize: 15, fontWeight: '700', color: colors.text },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
    metaPill: {
      backgroundColor: colors.surfaceAlt, borderRadius: 20,
      paddingHorizontal: 10, paddingVertical: 5,
    },
    metaText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
    deleteIcon: { fontSize: 18, marginLeft: 4 },
    tripDate: { fontSize: 11, color: colors.textMuted, marginTop: 10 },
  });
}
