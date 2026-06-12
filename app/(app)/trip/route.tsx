import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  Linking,
  Share,
  Animated,
  PanResponder,
} from 'react-native';
import { useMemo, useState, useRef, useEffect } from 'react';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useTripStore } from '../../../store/tripStore';
import { useAuthStore } from '../../../store/authStore';
import { useTheme } from '../../../hooks/useTheme';
import { refreshStationStatuses } from '../../../services/chargingService';
import {
  requestNotificationPermissions,
  scheduleStopApproachNotification,
  cancelAllTripNotifications,
  haversineKm,
} from '../../../services/notificationService';
import type { ColorScheme } from '../../../constants/colors';
import type { RouteStop } from '../../../types';
import { PROXIMITY_ALERT_KM } from '../../../constants/config';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const SNAP_COLLAPSED = 290;
const SNAP_HALF = Math.round(SCREEN_HEIGHT * 0.52);
const SNAP_EXPANDED = Math.round(SCREEN_HEIGHT * 0.91);

export default function RouteScreen() {
  const trip = useTripStore((s) => s.currentTrip);
  const savedTrips = useTripStore((s) => s.savedTrips);
  const saveTrip = useTripStore((s) => s.saveTrip);
  const stationStatuses = useTripStore((s) => s.stationStatuses);
  const updateStationStatuses = useTripStore((s) => s.updateStationStatuses);
  const user = useAuthStore((s) => s.user);
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [justSaved, setJustSaved] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);
  const notifiedStops = useRef<Set<string>>(new Set());

  // Expandable bottom panel
  const panelHeight = useRef(new Animated.Value(SNAP_HALF)).current;
  const lastPanelHeight = useRef(SNAP_HALF);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 8,
      onPanResponderGrant: () => {
        panelHeight.stopAnimation((val) => {
          lastPanelHeight.current = val;
        });
      },
      onPanResponderMove: (_, gs) => {
        const newH = Math.max(
          SNAP_COLLAPSED,
          Math.min(SNAP_EXPANDED, lastPanelHeight.current - gs.dy)
        );
        panelHeight.setValue(newH);
      },
      onPanResponderRelease: (_, gs) => {
        const currentH = lastPanelHeight.current - gs.dy;
        const snapPoints = [SNAP_COLLAPSED, SNAP_HALF, SNAP_EXPANDED];
        let target: number;
        if (gs.vy < -0.5) {
          target = snapPoints.find((s) => s > currentH) ?? SNAP_EXPANDED;
        } else if (gs.vy > 0.5) {
          const reversed = [...snapPoints].reverse();
          target = reversed.find((s) => s < currentH) ?? SNAP_COLLAPSED;
        } else {
          target = snapPoints.reduce((prev, curr) =>
            Math.abs(curr - currentH) < Math.abs(prev - currentH) ? curr : prev
          );
        }
        Animated.spring(panelHeight, {
          toValue: target,
          useNativeDriver: false,
          bounciness: 3,
          speed: 14,
        }).start(() => {
          lastPanelHeight.current = target;
        });
      },
    })
  ).current;

  const vehicle = user?.vehicles.find((v) => v.id === trip?.vehicleId);
  const isSaved = trip ? savedTrips.some((t) => t.id === trip.id) : false;

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
    latitude: (trip.origin.latitude + trip.destination.latitude) / 2,
    longitude: (trip.origin.longitude + trip.destination.longitude) / 2,
    latitudeDelta: Math.abs(trip.origin.latitude - trip.destination.latitude) * 1.4 + 0.05,
    longitudeDelta: Math.abs(trip.origin.longitude - trip.destination.longitude) * 1.4 + 0.05,
  };

  function handleSaveTrip() {
    saveTrip(trip!);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  }

  function handleStartTrip() {
    const origin = `${trip!.origin.latitude},${trip!.origin.longitude}`;
    const destination = `${trip!.destination.latitude},${trip!.destination.longitude}`;
    const waypoints = trip!.stops
      .map((s) => `${s.station.coordinates.latitude},${s.station.coordinates.longitude}`)
      .join('|');

    let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
    if (waypoints) url += `&waypoints=${waypoints}`;

    Linking.openURL(url).catch(() =>
      Alert.alert('Cannot open Maps', 'Google Maps does not appear to be installed.')
    );
  }

  async function handleShare() {
    const t = trip!;
    const url = `evidey://route?lat1=${t.origin.latitude}&lng1=${t.origin.longitude}&label1=${encodeURIComponent(t.origin.label)}&lat2=${t.destination.latitude}&lng2=${t.destination.longitude}&label2=${encodeURIComponent(t.destination.label)}&vehicleId=${t.vehicleId}`;
    try {
      await Share.share({
        title: `EVidey Trip: ${t.origin.label.split(',')[0]} → ${t.destination.label.split(',')[0]}`,
        message: `Check out this EV route on EVidey!\n${t.totalDistanceKm} km · ${t.stops.length} charge stop${t.stops.length !== 1 ? 's' : ''}\n\nOpen in EVidey: ${url}`,
      });
    } catch {}
  }

  async function handleRefreshStatus() {
    if (!trip || trip.stops.length === 0) return;
    setRefreshing(true);
    try {
      const ids = trip.stops.map((s) => s.station.id);
      const statuses = await refreshStationStatuses(ids);
      updateStationStatuses(statuses);
    } catch {}
    setRefreshing(false);
  }

  async function handleToggleAlerts() {
    if (alertsEnabled) {
      locationSubRef.current?.remove();
      locationSubRef.current = null;
      await cancelAllTripNotifications();
      setAlertsEnabled(false);
      return;
    }
    const granted = await requestNotificationPermissions();
    if (!granted) {
      Alert.alert('Permission needed', 'Enable notifications in settings to receive trip alerts.');
      return;
    }
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Location needed', 'Enable location to receive proximity alerts.');
      return;
    }
    notifiedStops.current.clear();
    locationSubRef.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, distanceInterval: 500 },
      (loc) => {
        if (!trip) return;
        trip.stops.forEach((stop, i) => {
          const stationId = stop.station.id;
          if (notifiedStops.current.has(stationId)) return;
          const dist = haversineKm(
            loc.coords.latitude, loc.coords.longitude,
            stop.station.coordinates.latitude, stop.station.coordinates.longitude
          );
          if (dist <= PROXIMITY_ALERT_KM) {
            notifiedStops.current.add(stationId);
            scheduleStopApproachNotification(stop, i, dist);
          }
        });
      }
    );
    setAlertsEnabled(true);
    Alert.alert('Trip Alerts ON', `You'll be notified when within ${PROXIMITY_ALERT_KM} km of each charging stop.`);
  }

  // Clean up location watcher on unmount
  useEffect(() => () => { locationSubRef.current?.remove(); }, []);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
      >
        <Marker
          coordinate={trip.origin}
          title="Start"
          description={trip.origin.label}
          pinColor={colors.primary}
        />
        <Marker
          coordinate={trip.destination}
          title="Destination"
          description={trip.destination.label}
          pinColor={colors.route}
        />
        {trip.stops.map((stop, i) => (
          <Marker
            key={stop.station.id}
            coordinate={stop.station.coordinates}
            title={`Stop ${i + 1}: ${stop.station.name}`}
            description={`Charge ~${stop.estimatedChargeMinutes} min · ${stop.arrivalBatteryPercent}% arrival`}
            pinColor={colors.charger}
          />
        ))}
      </MapView>

      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.85}>
        <Text style={styles.backBtnText}>←</Text>
      </TouchableOpacity>

      {/* Trip summary panel */}
      <Animated.View style={[styles.panel, { height: panelHeight }]}>
        <View {...panResponder.panHandlers}>
        <View style={styles.panelHandle} />

        {/* Panel header with save button */}
        <View style={styles.panelHeader}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={styles.routeOrigin} numberOfLines={1}>{trip.origin.label.split(',')[0]}</Text>
            <Text style={styles.routeArrow}>↓</Text>
            <Text style={styles.routeDest} numberOfLines={1}>{trip.destination.label.split(',')[0]}</Text>
          </View>
          <TouchableOpacity
            style={[styles.saveBtn, (isSaved || justSaved) && styles.saveBtnActive]}
            onPress={handleSaveTrip}
            disabled={isSaved}
            activeOpacity={0.85}
          >
            <Text style={styles.saveBtnText}>
              {justSaved ? '✓ Saved' : isSaved ? '🔖 Saved' : '🔖 Save'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Summary stats */}
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

        {/* Start Trip button */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.startBtn, { flex: 1 }]} onPress={handleStartTrip} activeOpacity={0.85}>
            <Text style={styles.startBtnText}>🗺️  Start in Google Maps</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.85}>
            <Text style={styles.shareBtnText}>↗</Text>
          </TouchableOpacity>
        </View>

        {/* Trip Alerts toggle */}
        <TouchableOpacity
          style={[styles.alertsBtn, alertsEnabled && styles.alertsBtnActive]}
          onPress={handleToggleAlerts}
        >
          <Text style={[styles.alertsBtnText, alertsEnabled && styles.alertsBtnTextActive]}>
            {alertsEnabled ? '🔔 Trip Alerts ON — tap to disable' : '🔔 Enable Trip Alerts'}
          </Text>
        </TouchableOpacity>

        <View style={styles.stopsHeader}>
          <Text style={styles.stopsHeading}>Charging Stops</Text>
          {trip.stops.length > 0 && (
            <TouchableOpacity onPress={handleRefreshStatus} disabled={refreshing}>
              <Text style={[styles.refreshBtn, refreshing && { opacity: 0.5 }]}>
                {refreshing ? '⏳' : '🔄 Refresh'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        </View>

        <ScrollView style={styles.stopsList} showsVerticalScrollIndicator={false}>
          {trip.stops.length === 0 && (
            <Text style={styles.noStops}>
              {vehicle && trip.totalDistanceKm > vehicle.realWorldRangeKm
                ? `No charging stations found along this route — search radius expanded to 60 km but found nothing. You may need to plan manual stops.`
                : 'No charging stops needed — your battery can make the full trip!'}
            </Text>
          )}

          {trip.stops.map((stop, i) => (
            <StopCard
              key={stop.station.id}
              stop={stop}
              index={i + 1}
              colors={colors}
              liveStatus={stationStatuses[stop.station.id]}
              onPress={() =>
                router.push({
                  pathname: '/(app)/trip/stop-detail',
                  params: { stopIndex: i },
                })
              }
            />
          ))}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

function StopCard({
  stop, index, colors, liveStatus, onPress,
}: {
  stop: RouteStop; index: number; colors: ColorScheme;
  liveStatus?: boolean; onPress: () => void;
}) {
  const statusColor = liveStatus === undefined ? colors.textMuted : liveStatus ? colors.success : colors.error;
  const statusText = liveStatus === undefined ? '' : liveStatus ? '● Available' : '● Offline';
  return (
    <TouchableOpacity
      style={{
        backgroundColor: colors.surface,
        borderRadius: 18, padding: 16,
        flexDirection: 'row', alignItems: 'center',
        marginBottom: 10, borderWidth: 1, borderColor: colors.border,
        shadowColor: colors.cardShadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
      }}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={{
        width: 36, height: 36, borderRadius: 12,
        backgroundColor: colors.primary,
        justifyContent: 'center', alignItems: 'center', marginRight: 14,
      }}>
        <Text style={{ color: colors.primaryForeground, fontWeight: '800', fontSize: 15 }}>{index}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }} numberOfLines={1}>
          {stop.station.name}
        </Text>
        <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
          {stop.distanceFromPrevKm} km · {stop.arrivalBatteryPercent}% → {stop.departureBatteryPercent}%
        </Text>
        <Text style={{ fontSize: 12, color: colors.primary, marginTop: 2, fontWeight: '700' }}>
          ~{stop.estimatedChargeMinutes} min · {stop.station.powerKw} kW
        </Text>
        {statusText ? <Text style={{ fontSize: 11, color: statusColor, marginTop: 3, fontWeight: '600' }}>{statusText}</Text> : null}
        {stop.station.amenities.length > 0 && (
          <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 3 }}>
            📍 {stop.station.amenities.length} nearby
          </Text>
        )}
      </View>
      <Text style={{ color: colors.textMuted, fontSize: 20 }}>›</Text>
    </TouchableOpacity>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    errorText: { color: colors.text, fontSize: 16 },
    backLink: { color: colors.primary, marginTop: 12, fontSize: 15 },
    map: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    backBtn: {
      position: 'absolute', top: 52, left: 16,
      backgroundColor: colors.surface,
      width: 40, height: 40, borderRadius: 20,
      justifyContent: 'center', alignItems: 'center',
      borderWidth: 1, borderColor: colors.border,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12, shadowRadius: 6, elevation: 4,
    },
    backBtnText: { color: colors.text, fontWeight: '700', fontSize: 18 },
    panel: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      backgroundColor: colors.surface,
      borderTopLeftRadius: 28, borderTopRightRadius: 28,
      paddingHorizontal: 20, paddingTop: 12,
      overflow: 'hidden',
      shadowColor: '#000', shadowOffset: { width: 0, height: -6 },
      shadowOpacity: 0.15, shadowRadius: 20, elevation: 24,
    },
    panelHandle: {
      width: 36, height: 4, backgroundColor: colors.border,
      borderRadius: 2, alignSelf: 'center', marginBottom: 16,
    },
    panelHeader: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', marginBottom: 14,
    },
    routeOrigin: { fontSize: 14, fontWeight: '700', color: colors.text },
    routeArrow: { fontSize: 12, color: colors.textMuted, marginVertical: 1 },
    routeDest: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
    saveBtn: {
      paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
      backgroundColor: colors.primaryLight, borderWidth: 1.5, borderColor: colors.primary,
    },
    saveBtnActive: { backgroundColor: colors.primary },
    saveBtnText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
    summary: {
      flexDirection: 'row', backgroundColor: colors.background,
      borderRadius: 18, padding: 18, marginBottom: 12,
      borderWidth: 1, borderColor: colors.border,
    },
    summaryItem: { flex: 1, alignItems: 'center' },
    summaryValue: { fontSize: 22, fontWeight: '800', color: colors.primary },
    summaryLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2, fontWeight: '600' },
    divider: { width: 1, backgroundColor: colors.border, marginVertical: 4 },
    startBtn: {
      backgroundColor: colors.primary, borderRadius: 16,
      paddingVertical: 15, alignItems: 'center',
      shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25, shadowRadius: 10, elevation: 4,
    },
    startBtnText: { color: colors.primaryForeground, fontWeight: '700', fontSize: 15 },
    actionRow: { flexDirection: 'row', gap: 8, marginBottom: 10, alignItems: 'center' },
    shareBtn: {
      backgroundColor: colors.background, borderRadius: 16,
      paddingVertical: 15, alignItems: 'center', justifyContent: 'center',
      width: 50, borderWidth: 1, borderColor: colors.border,
    },
    shareBtnText: { color: colors.primary, fontWeight: '700', fontSize: 18 },
    alertsBtn: {
      borderWidth: 1.5, borderColor: colors.border, borderRadius: 14,
      padding: 12, alignItems: 'center', marginBottom: 12,
    },
    alertsBtnActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
    alertsBtnText: { color: colors.textSecondary, fontWeight: '600', fontSize: 13 },
    alertsBtnTextActive: { color: colors.primary },
    stopsHeader: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', marginBottom: 8,
    },
    stopsHeading: { fontSize: 16, fontWeight: '700', color: colors.text },
    refreshBtn: { fontSize: 13, color: colors.primary, fontWeight: '600' },
    stopsList: { flex: 1 },
    noStops: { color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 20, lineHeight: 22 },
  });
}
