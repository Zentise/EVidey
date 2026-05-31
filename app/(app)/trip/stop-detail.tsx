import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  Alert,
} from 'react-native';
import { useMemo, useState, useEffect } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { useTripStore } from '../../../store/tripStore';
import { useAuthStore } from '../../../store/authStore';
import { useReviewStore } from '../../../store/reviewStore';
import { useTheme } from '../../../hooks/useTheme';
import type { ColorScheme } from '../../../constants/colors';
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
  const user = useAuthStore((s) => s.user);
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const loadReviews = useReviewStore((s) => s.loadReviews);
  const addReview = useReviewStore((s) => s.addReview);
  const reviews = useReviewStore((s) => s.reviews);

  const stop = trip?.stops[parseInt(stopIndex ?? '0', 10)];
  const vehicle = user?.vehicles.find((v) => v.id === trip?.vehicleId);
  const isCar = vehicle?.type === 'car';

  const stationId = stop?.station.id ?? '';
  const stationReviews = reviews[stationId] ?? [];

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (stationId) loadReviews(stationId);
  }, [stationId]);

  async function handleSubmitReview() {
    if (!user || !stationId) return;
    setSubmitting(true);
    try {
      await addReview(
        stationId,
        user.id,
        user.name,
        reviewRating,
        reviewComment.trim(),
      );
      setReviewComment('');
      setReviewRating(5);
      setShowReviewForm(false);
    } catch (e: any) {
      Alert.alert('Could not submit review', e?.message ?? 'Try again later.');
    }
    setSubmitting(false);
  }

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

  const amenityGroups = stop.station.amenities.reduce<Record<string, Amenity[]>>(
    (acc, a) => {
      if (a.category === 'stay') return acc;
      if (!acc[a.category]) acc[a.category] = [];
      acc[a.category].push(a);
      return acc;
    },
    {}
  );

  const stays = stop.station.amenities.filter((a) => a.category === 'stay');

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
          color={stop.arrivalBatteryPercent < 20 ? colors.warning : colors.text}
          textSecondary={colors.textSecondary}
        />
        <ChargeStat
          label="Leave at"
          value={`${stop.departureBatteryPercent}%`}
          color={colors.primary}
          textSecondary={colors.textSecondary}
        />
        <ChargeStat
          label="Charge time"
          value={`~${stop.estimatedChargeMinutes} min`}
          color={colors.text}
          textSecondary={colors.textSecondary}
        />
        <ChargeStat
          label="Charger speed"
          value={`${stop.station.powerKw} kW`}
          color={colors.text}
          textSecondary={colors.textSecondary}
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

      {/* Stay Recommendations — shown for car users */}
      {isCar && (
        <View style={styles.staySection}>
          <Text style={styles.staySectionTitle}>🏨 Where to Stay</Text>
          {stays.length > 0 ? (
            <>
              <Text style={styles.staySectionSubtitle}>
                Hotels near this charging stop — perfect for overnight trips
              </Text>
              {stays.map((hotel) => (
                <StayCard key={hotel.id} hotel={hotel} colors={colors} />
              ))}
            </>
          ) : (
            <Text style={styles.noStayText}>
              No hotels found within 3 km of this charger.
            </Text>
          )}
        </View>
      )}

      {/* Amenities */}
      {Object.keys(amenityGroups).length > 0 && (
        <View style={styles.amenitiesSection}>
          <Text style={styles.sectionTitle}>Nearby while you charge</Text>
          <Text style={styles.sectionSubtitle}>
            Within walking distance
          </Text>
          {Object.entries(amenityGroups).map(([category, items]) => (
            <View key={category} style={styles.amenityGroup}>
              <Text style={styles.amenityGroupLabel}>
                {AMENITY_ICONS[category] ?? '📍'}{' '}
                {category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </Text>
              {items.map((a) => (
                <AmenityCard key={a.id} amenity={a} colors={colors} />
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

      {/* Community Reviews */}
      <View style={styles.reviewsSection}>
        <View style={styles.reviewsHeader}>
          <Text style={styles.sectionTitle}>Community Reviews</Text>
          {user && (
            <TouchableOpacity onPress={() => setShowReviewForm((v) => !v)}>
              <Text style={styles.writeReviewBtn}>
                {showReviewForm ? 'Cancel' : '✏️ Write a review'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {showReviewForm && (
          <View style={styles.reviewForm}>
            <Text style={styles.reviewFormLabel}>Your rating</Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity key={s} onPress={() => setReviewRating(s)}>
                  <Text style={[styles.star, s <= reviewRating && styles.starActive]}>★</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[styles.reviewInput, { color: colors.text }]}
              placeholder="Share your experience (optional)"
              placeholderTextColor={colors.textMuted}
              value={reviewComment}
              onChangeText={setReviewComment}
              multiline
              numberOfLines={3}
            />
            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
              onPress={handleSubmitReview}
              disabled={submitting}
            >
              <Text style={styles.submitBtnText}>{submitting ? 'Submitting…' : 'Submit Review'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {stationReviews.length === 0 && !showReviewForm && (
          <Text style={styles.noReviewsText}>No reviews yet — be the first!</Text>
        )}

        {stationReviews.map((r) => (
          <View key={r.id} style={styles.reviewCard}>
            <View style={styles.reviewCardTop}>
              <Text style={styles.reviewUser}>{r.userName}</Text>
              <Text style={styles.reviewStars}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</Text>
            </View>
            {r.comment ? <Text style={styles.reviewComment}>{r.comment}</Text> : null}
            <Text style={styles.reviewDate}>
              {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function ChargeStat({
  label,
  value,
  color,
  textSecondary,
}: {
  label: string;
  value: string;
  color: string;
  textSecondary: string;
}) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontSize: 18, fontWeight: '800', color }}>{value}</Text>
      <Text style={{ fontSize: 11, color: textSecondary, marginTop: 2, fontWeight: '600' }}>
        {label}
      </Text>
    </View>
  );
}

function AmenityCard({ amenity, colors }: { amenity: Amenity; colors: ColorScheme }) {
  function open() {
    const url = `https://www.google.com/maps/search/?api=1&query=${amenity.coordinates.latitude},${amenity.coordinates.longitude}`;
    Linking.openURL(url);
  }

  return (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surfaceAlt,
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
      }}
      onPress={open}
      activeOpacity={0.7}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
          {amenity.name}
        </Text>
        <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
          {Math.round(amenity.distanceMeters)} m away
          {amenity.rating ? ` · ⭐ ${amenity.rating}` : ''}
          {amenity.isOpen === true
            ? ' · Open'
            : amenity.isOpen === false
            ? ' · Closed'
            : ''}
        </Text>
      </View>
      <Text style={{ color: colors.textMuted, fontSize: 20 }}>›</Text>
    </TouchableOpacity>
  );
}

function StayCard({ hotel, colors }: { hotel: Amenity; colors: ColorScheme }) {
  function open() {
    const url = `https://www.google.com/maps/search/?api=1&query=${hotel.coordinates.latitude},${hotel.coordinates.longitude}`;
    Linking.openURL(url);
  }

  return (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 12,
      }}
      onPress={open}
      activeOpacity={0.7}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          backgroundColor: `${colors.warning}22`,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 22 }}>🏨</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>{hotel.name}</Text>
        <Text style={{ fontSize: 12, color: colors.primary, marginTop: 2, fontWeight: '600' }}>
          {(hotel.distanceMeters / 1000).toFixed(1)} km away
          {hotel.rating ? ` · ⭐ ${hotel.rating}` : ''}
        </Text>
        {hotel.address ? (
          <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }} numberOfLines={1}>
            {hotel.address}
          </Text>
        ) : null}
      </View>
      <Text style={{ color: colors.textMuted, fontSize: 20 }}>›</Text>
    </TouchableOpacity>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 40 },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    errorText: { color: colors.text, fontSize: 16 },
    backLink: { color: colors.primary, marginTop: 12, fontSize: 15 },
    backBtn: { marginBottom: 20 },
    backBtnText: { color: colors.primary, fontWeight: '600', fontSize: 15 },
    stationCard: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'flex-start',
      gap: 14,
    },
    stationIcon: {
      width: 52,
      height: 52,
      borderRadius: 14,
      backgroundColor: `${colors.primary}22`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    stationInfo: { flex: 1 },
    stationName: { fontSize: 18, fontWeight: '800', color: colors.text },
    stationOperator: { fontSize: 13, color: colors.primary, marginTop: 2, fontWeight: '600' },
    stationAddress: { fontSize: 12, color: colors.textSecondary, marginTop: 4, lineHeight: 18 },
    chargePlan: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    connectorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    connectorTag: {
      backgroundColor: `${colors.primary}22`,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    connectorText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
    mapsBtn: {
      borderWidth: 1,
      borderColor: colors.route,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
      marginBottom: 28,
    },
    mapsBtnText: { color: colors.route, fontWeight: '700', fontSize: 14 },
    staySection: {
      marginBottom: 28,
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.border,
    },
    staySectionTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 4 },
    staySectionSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 16,
      lineHeight: 18,
    },
    noStayText: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
    amenitiesSection: { marginBottom: 20 },
    sectionTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 4 },
    sectionSubtitle: { fontSize: 13, color: colors.textSecondary, marginBottom: 20 },
    amenityGroup: { marginBottom: 20 },
    amenityGroupLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 10,
    },
    noAmenities: { alignItems: 'center', paddingVertical: 32 },
    noAmenitiesText: { color: colors.textMuted, fontSize: 14, textAlign: 'center' },
    reviewsSection: {
      marginTop: 12,
      marginBottom: 40,
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.border,
    },
    reviewsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    writeReviewBtn: { color: colors.primary, fontSize: 13, fontWeight: '600' },
    reviewForm: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: 14,
      padding: 14,
      marginBottom: 16,
    },
    reviewFormLabel: { color: colors.text, fontWeight: '700', marginBottom: 8 },
    starRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
    star: { fontSize: 28, color: colors.border },
    starActive: { color: colors.warning },
    reviewInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 12,
      fontSize: 14,
      minHeight: 70,
      textAlignVertical: 'top',
      backgroundColor: colors.background,
      marginBottom: 10,
    },
    submitBtn: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
    },
    submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    noReviewsText: { color: colors.textMuted, fontSize: 13, textAlign: 'center', paddingVertical: 12 },
    reviewCard: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    reviewCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    reviewUser: { fontWeight: '700', color: colors.text, fontSize: 13 },
    reviewStars: { color: colors.warning, fontSize: 14 },
    reviewComment: { color: colors.textSecondary, fontSize: 13, lineHeight: 18, marginBottom: 4 },
    reviewDate: { color: colors.textMuted, fontSize: 11 },
  });
}
