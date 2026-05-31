/**
 * EVidey Notification Service
 * Uses expo-notifications for local proximity alerts.
 *
 * Push notifications require a development build (not Expo Go SDK 53+).
 * We lazy-require expo-notifications inside each function so the module's
 * side-effects never run in Expo Go.
 */
import Constants from 'expo-constants';
import type { RouteStop } from '../types';

const isExpoGo = Constants.executionEnvironment === 'storeClient';

export async function requestNotificationPermissions(): Promise<boolean> {
  if (isExpoGo) return false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function scheduleStopApproachNotification(
  stop: RouteStop,
  stopIndex: number,
  distanceKm: number
): Promise<string | null> {
  if (isExpoGo) return null;
  try {
    const Notifications = require('expo-notifications');
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `⚡ Stop ${stopIndex + 1} in ~${Math.round(distanceKm)} km`,
        body: `${stop.station.name} — ${stop.station.powerKw} kW charger. Arrive at ${stop.arrivalBatteryPercent}% battery.`,
        data: { stationId: stop.station.id, stopIndex },
        sound: true,
      },
      trigger: null,
    });
    return id;
  } catch {
    return null;
  }
}

export async function cancelAllTripNotifications(): Promise<void> {
  if (isExpoGo) return;
  try {
    const Notifications = require('expo-notifications');
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {}
}

export function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
