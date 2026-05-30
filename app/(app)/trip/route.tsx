import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { router } from 'expo-router';
import { useTripStore } from '../../../store/tripStore';
import { useAuthStore } from '../../../store/authStore';
import { Colors } from '../../../constants/colors';
import type { RouteStop } from '../../../types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function RouteScreen() {
  const trip = useTripStore((s) => s.currentTrip);
  const user = useAuthStore((s) => s.user);
  const vehicle = user?.vehicles.find((v) => v.id === trip?.vehicleId);

  if (!trip) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>No trip loaded.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const region = {
    latitude:
      (trip.origin.latitude + trip.destination.latitude) / 2,
    longitude:
      (trip.origin.longitude + trip.destination.longitude) / 2,
    latitudeDelta:
      Math.abs(trip.origin.latitude - trip.destination.latitude) * 1.4 + 0.05,
    longitudeDelta:
      Math.abs(trip.origin.longitude - trip.destination.longitude) * 1.4 + 0.05,
  };

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
      >
        {/* Origin */}
        <Marker
          coordinate={trip.origin}
          title="Start"
          description={trip.origin.label}
          pinColor={Colors.primary}
        />

        {/* Destination */}
        <Marker
          coordinate={trip.destination}
          title="Destination"
          description={trip.destination.label}
          pinColor={Colors.route}
        />

        {/* Charging stop markers */}
        {trip.stops.map((stop, i) => (
          <Marker
            key={stop.station.id}
            coordinate={stop.station.coordinates}
            title={`Stop ${i + 1}: ${stop.station.name}`}
            description={`Charge ~${stop.estimatedChargeMinutes} min · ${stop.arrivalBatteryPercent}% arrival`}
            pinColor={Colors.charger}
          />
        ))}
      </MapView>

      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backBtnText}>← Back</Text>
      </TouchableOpacity>

      {/* Trip summary panel */}
      <View style={styles.panel}>
        <View style={styles.panelHandle} />

        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{trip.totalDistanceKm} km</Text>
            <Text style={styles.summaryLabel}>Distance</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {Math.floor(trip.estimatedDrivingMinutes / 60)}h{' '}
              {trip.estimatedDrivingMinutes % 60}m
            </Text>
            <Text style={styles.summaryLabel}>Drive time</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{trip.stops.length}</Text>
            <Text style={styles.summaryLabel}>Stops</Text>
          </View>
        </View>

        <Text style={styles.stopsHeading}>Charging Stops</Text>

        <ScrollView
          style={styles.stopsList}
          showsVerticalScrollIndicator={false}
        >
          {trip.stops.length === 0 && (
            <Text style={styles.noStops}>
              {vehicle && trip.totalDistanceKm > vehicle.realWorldRangeKm
                ? `No charging stations found along this route — search radius expanded to 60 km but found nothing. You may need to plan manual stops.`
                : "No charging stops needed — your battery can make the full trip!"}
            </Text>
          )}

          {trip.stops.map((stop, i) => (
            <StopCard
              key={stop.station.id}
              stop={stop}
              index={i + 1}
              onPress={() =>
                router.push({
                  pathname: '/(app)/trip/stop-detail',
                  params: { stopIndex: i },
                })
              }
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

function StopCard({
  stop,
  index,
  onPress,
}: {
  stop: RouteStop;
  index: number;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.stopCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.stopBadge}>
        <Text style={styles.stopBadgeText}>{index}</Text>
      </View>
      <View style={styles.stopInfo}>
        <Text style={styles.stopName} numberOfLines={1}>
          {stop.station.name}
        </Text>
        <Text style={styles.stopMeta}>
          {stop.distanceFromPrevKm} km · {stop.arrivalBatteryPercent}% arrival →{' '}
          {stop.departureBatteryPercent}%
        </Text>
        <Text style={styles.stopCharge}>
          ~{stop.estimatedChargeMinutes} min charge · {stop.station.powerKw} kW
        </Text>
        {stop.station.amenities.length > 0 && (
          <Text style={styles.stopAmenities}>
            📍 {stop.station.amenities.length} nearby amenities
          </Text>
        )}
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  errorText: {
    color: Colors.text,
    fontSize: 16,
  },
  backLink: {
    color: Colors.primary,
    marginTop: 12,
    fontSize: 15,
  },
  map: {
    height: SCREEN_HEIGHT * 0.45,
    width: '100%',
  },
  backBtn: {
    position: 'absolute',
    top: 52,
    left: 20,
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  backBtnText: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  panel: {
    flex: 1,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  panelHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  summary: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary,
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  stopsHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  stopsList: {
    flex: 1,
  },
  noStops: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 22,
  },
  stopCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stopBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stopBadgeText: {
    color: '#0F1923',
    fontWeight: '800',
    fontSize: 14,
  },
  stopInfo: {
    flex: 1,
  },
  stopName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  stopMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  stopCharge: {
    fontSize: 12,
    color: Colors.primary,
    marginTop: 2,
    fontWeight: '600',
  },
  stopAmenities: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
  },
  chevron: {
    color: Colors.textMuted,
    fontSize: 22,
    marginLeft: 8,
  },
});
