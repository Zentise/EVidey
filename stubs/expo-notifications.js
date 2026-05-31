// No-op stub for expo-notifications when running in Expo Go (SDK 53+).
// Expo Go removed push notification support; this prevents the crash.
// This stub is only used when EXPO_DISABLE_PUSH=true (set in .env for local dev).
const noop = () => {};
const noopAsync = async () => {};
const noopPermission = async () => ({ status: 'undetermined', canAskAgain: false, granted: false, expires: 'never' });

module.exports = {
  setNotificationHandler: noop,
  getPermissionsAsync: noopPermission,
  requestPermissionsAsync: noopPermission,
  scheduleNotificationAsync: async () => 'stub-id',
  cancelAllScheduledNotificationsAsync: noopAsync,
  cancelScheduledNotificationAsync: noopAsync,
  addNotificationReceivedListener: () => ({ remove: noop }),
  addNotificationResponseReceivedListener: () => ({ remove: noop }),
  removeNotificationSubscription: noop,
  getPresentedNotificationsAsync: async () => [],
  dismissAllNotificationsAsync: noopAsync,
  AndroidImportance: {},
  IosAlertStyle: {},
};
