import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTripStore } from '../../../store/tripStore';
import { Colors } from '../../../constants/colors';
import type { Amenity } from '../../../types';

const AMENITY_ICONS: Record<string, string> = {
  food: '🍽️',
  cafe: '☕',
  convenience_store: '🛒',
  washroom: '🚻',
  rest_area: '🛋️',
  pharmacy: '💊',
  atm: '🏧',
  stay: '🏨',
};

export default function StopDetailScreen() {
  const { stopIndex } = useLocalSearchParams<{ stopIndex: string }>();
  const trip = useTripStore((s) => s.currentTrip);

  const stop = trip?.stops[parseInt(stopIndex ?? '0', 10)];

  if (!stop) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Stop not found.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function openInMaps() {
    const { latitude, longitude } = stop!.station.coordinates;
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.openURL(url);
  }

  const amenityGroups = stop.station.amenities.reduce<
    Record<string, Amenity[]>
  >((acc, a) => {
    if (!acc[a.category]) acc[a.category] = [];
    acc[a.category].push(a);
    return acc;
  }, {});

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backBtnText}>← Route</Text>
      </TouchableOpacity>

      {/* Station header */}
      <View style={styles.stationCard}>
        <View style={styles.stationIcon}>
          <Text style={{ fontSize: 28 }}>⚡</Text>
        </View>
        <View style={styles.stationInfo}>
          <Text style={styles.stationName}>{stop.station.name}</Text>
          {stop.station.operator && (
            <Text style={styles.stationOperator}>{stop.station.operator}</Text>
          )}
          <Text style={styles.stationAddress} numberOfLines={2}>
            {stop.station.address}
          </Text>
        </View>
      </View>

      {/* Charge plan */}
      <View style={styles.chargePlan}>
        <ChargeStat
          label="Arrive at"
          value={`${stop.arrivalBatteryPercent}%`}
          color={stop.arrivalBatteryPercent < 20 ? Colors.warning : Colors.text}
        />
        <ChargeStat
          label="Leave at"
          value={`${stop.departureBatteryPercent}%`}
          color={Colors.primary}
        />
        <ChargeStat
          label="Charge time"
          value={`~${stop.estimatedChargeMinutes} min`}
          color={Colors.text}
        />
        <ChargeStat
          label="Charger speed"
          value={`${stop.station.powerKw} kW`}
          color={Colors.text}
        />
      </View>

      {/* Connector types */}
      <View style={styles.connectorRow}>
        {stop.station.connectors.map((c, i) => (
          <View key={i} style={styles.connectorTag}>
            <Text style={styles.connectorText}>{c}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.mapsBtn} onPress={openInMaps}>
        <Text style={styles.mapsBtnText}>Open in Google Maps →</Text>
      </TouchableOpacity>

      {/* Amenities */}
      {stop.station.amenities.length > 0 && (
        <View style={styles.amenitiesSection}>
          <Text style={styles.sectionTitle}>Nearby while you charge</Text>
          <Text style={styles.sectionSubtitle}>
            Within {stop.estimatedChargeMinutes} min walking distance
          </Text>

          {Object.entries(amenityGroups).map(([category, items]) => (
            <View key={category} style={styles.amenityGroup}>
              <Text style={styles.amenityGroupLabel}>
                {AMENITY_ICONS[category] ?? '📍'}{' '}
                {category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </Text>
              {items.map((a) => (
                <AmenityCard key={a.id} amenity={a} />
              ))}
            </View>
          ))}
        </View>
      )}

      {stop.station.amenities.length === 0 && (
        <View style={styles.noAmenities}>
          <Text style={styles.noAmenitiesText}>
            No amenity data available for this stop yet.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

function ChargeStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={chargStatStyles.item}>
      <Text style={[chargStatStyles.value, { color }]}>{value}</Text>
      <Text style={chargStatStyles.label}>{label}</Text>
    </View>
  );
}

const chargStatStyles = StyleSheet.create({
  item: { flex: 1, alignItems: 'center' },
  value: { fontSize: 18, fontWeight: '800' },
  label: { fontSize: 11, color: Colors.textSecondary, marginTop: 2, fontWeight: '600' },
});

function AmenityCard({ amenity }: { amenity: Amenity }) {
  function open() {
    const url = `https://www.google.com/maps/search/?api=1&query=${amenity.coordinates.latitude},${amenity.coordinates.longitude}`;
    Linking.openURL(url);
  }

  return (
    <TouchableOpacity style={amenityStyles.card} onPress={open} activeOpacity={0.7}>
      <View style={amenityStyles.info}>
        <Text style={amenityStyles.name}>{amenity.name}</Text>
        <Text style={amenityStyles.meta}>
          {Math.round(amenity.distanceMeters)} m away
          {amenity.rating ? ` · ⭐ ${amenity.rating}` : ''}
          {amenity.isOpen === true
            ? ' · Open'
            : amenity.isOpen === false
            ? ' · Closed'
            : ''}
        </Text>
      </View>
      <Text style={amenityStyles.arrow}>›</Text>
    </TouchableOpacity>
  );
}

const amenityStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '600', color: Colors.text },
  meta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  arrow: { color: Colors.textMuted, fontSize: 20 },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  errorText: { color: Colors.text, fontSize: 16 },
  backLink: { color: Colors.primary, marginTop: 12, fontSize: 15 },
  backBtn: {
    marginBottom: 20,
  },
  backBtnText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 15,
  },
  stationCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'flex-start',
    gap: 14,
  },
  stationIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: `${Colors.primary}22`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stationInfo: { flex: 1 },
  stationName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  stationOperator: {
    fontSize: 13,
    color: Colors.primary,
    marginTop: 2,
    fontWeight: '600',
  },
  stationAddress: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  chargePlan: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  connectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  connectorTag: {
    backgroundColor: `${Colors.primary}22`,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  connectorText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  mapsBtn: {
    borderWidth: 1,
    borderColor: Colors.route,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 28,
  },
  mapsBtnText: {
    color: Colors.route,
    fontWeight: '700',
    fontSize: 14,
  },
  amenitiesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  amenityGroup: {
    marginBottom: 20,
  },
  amenityGroupLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  noAmenities: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noAmenitiesText: {
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
});
