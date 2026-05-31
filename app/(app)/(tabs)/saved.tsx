import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useMemo } from 'react';
import { router } from 'expo-router';
import { useTripStore } from '../../../store/tripStore';
import { useTheme } from '../../../hooks/useTheme';
import type { ColorScheme } from '../../../constants/colors';
import type { TripPlan } from '../../../types';

export default function SavedTripsScreen() {
  const savedTrips = useTripStore((s) => s.savedTrips);
  const setCurrentTrip = useTripStore((s) => s.setCurrentTrip);
  const removeSavedTrip = useTripStore((s) => s.removeSavedTrip);
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  function handleOpenTrip(trip: TripPlan) {
    setCurrentTrip(trip);
    router.push('/(app)/trip/route');
  }

  function handleDelete(trip: TripPlan) {
    Alert.alert(
      'Remove trip',
      `Remove "${trip.origin.label} → ${trip.destination.label}" from saved?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeSavedTrip(trip.id),
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Saved Trips</Text>

        {savedTrips.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔖</Text>
            <Text style={styles.emptyTitle}>No saved trips yet</Text>
            <Text style={styles.emptySubtitle}>
              Plan a trip and tap the bookmark icon to save it here.
            </Text>
            <TouchableOpacity
              style={styles.planBtn}
              onPress={() => router.push('/(app)/(tabs)')}
            >
              <Text style={styles.planBtnText}>Plan a Trip ⚡</Text>
            </TouchableOpacity>
          </View>
        ) : (
          savedTrips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              colors={colors}
              onOpen={() => handleOpenTrip(trip)}
              onDelete={() => handleDelete(trip)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function TripCard({
  trip,
  colors,
  onOpen,
  onDelete,
}: {
  trip: TripPlan;
  colors: ColorScheme;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const date = new Date(trip.createdAt);
  const formattedDate = date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <TouchableOpacity
      style={{
        backgroundColor: colors.surface,
        borderRadius: 18,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
      }}
      onPress={onOpen}
      activeOpacity={0.75}
    >
      {/* Route */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 }}>
        <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '700' }}>📍</Text>
        <Text
          style={{ flex: 1, fontSize: 15, fontWeight: '700', color: colors.text }}
          numberOfLines={1}
        >
          {trip.origin.label}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 8 }}>
        <Text style={{ fontSize: 13, color: colors.route }}>🏁</Text>
        <Text
          style={{ flex: 1, fontSize: 15, fontWeight: '700', color: colors.text }}
          numberOfLines={1}
        >
          {trip.destination.label}
        </Text>
      </View>

      {/* Meta row */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <MetaPill icon="📏" value={`${trip.totalDistanceKm} km`} colors={colors} />
          <MetaPill
            icon="⚡"
            value={`${trip.stops.length} stop${trip.stops.length !== 1 ? 's' : ''}`}
            colors={colors}
          />
          <MetaPill
            icon="🕐"
            value={`${Math.floor(trip.estimatedDrivingMinutes / 60)}h ${trip.estimatedDrivingMinutes % 60}m`}
            colors={colors}
          />
        </View>
        <TouchableOpacity
          onPress={onDelete}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={{ fontSize: 18 }}>🗑️</Text>
        </TouchableOpacity>
      </View>

      <Text
        style={{
          fontSize: 11,
          color: colors.textMuted,
          marginTop: 10,
        }}
      >
        Saved {formattedDate}
      </Text>
    </TouchableOpacity>
  );
}

function MetaPill({
  icon,
  value,
  colors,
}: {
  icon: string;
  value: string;
  colors: ColorScheme;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Text style={{ fontSize: 12 }}>{icon}</Text>
      <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: '600' }}>
        {value}
      </Text>
    </View>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: 20, paddingTop: 64, paddingBottom: 40 },
    pageTitle: {
      fontSize: 30,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 24,
    },
    emptyState: { alignItems: 'center', paddingTop: 60 },
    emptyIcon: { fontSize: 52, marginBottom: 16 },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      paddingHorizontal: 24,
      marginBottom: 28,
    },
    planBtn: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 28,
    },
    planBtnText: { color: colors.primaryForeground, fontWeight: '700', fontSize: 15 },
  });
}
