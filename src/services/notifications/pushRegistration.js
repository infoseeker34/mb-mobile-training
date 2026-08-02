/**
 * Push registration (EPIC-006)
 *
 * Registers this device's Expo push token with the backend so server-sent push
 * (SNS → delivery Lambda → Expo Push API) can reach it, and unregisters on
 * sign-out. Push is NATIVE-only: on web this is a no-op (web notifications are a
 * different mechanism and the app is also served as a static web build). Every
 * path is guarded and non-throwing so a missing projectId, a denied permission,
 * or an offline API never breaks the auth flow that calls it.
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notificationApi from '../api/notificationApi';
import { FEATURES } from '../../constants/Config';

const STORED_TOKEN_KEY = 'expoPushToken';

// Show notifications while the app is foregrounded (otherwise iOS suppresses
// them). Set once at module load.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function getProjectId() {
  // EAS projectId lives in app config once `eas init` has run. Without it,
  // getExpoPushTokenAsync throws on a standalone build — we catch and skip.
  return (
    Constants?.expoConfig?.extra?.eas?.projectId ||
    Constants?.easConfig?.projectId ||
    undefined
  );
}

/**
 * Ask for permission and register this device's push token with the backend.
 * Safe to call on every login — the backend upserts on the unique token.
 */
export async function registerPushToken() {
  try {
    if (Platform.OS === 'web') return; // native only
    if (!FEATURES.pushNotifications) return;

    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (status !== 'granted') {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== 'granted') {
      console.log('Push permission not granted; skipping token registration');
      return;
    }

    const projectId = getProjectId();
    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    const token = tokenResponse?.data;
    if (!token) return;

    await notificationApi.registerDeviceToken(token, Platform.OS);
    await AsyncStorage.setItem(STORED_TOKEN_KEY, token);
    console.log('Registered push token with backend');
  } catch (error) {
    // Never surface to the auth flow — push is best-effort.
    console.error('registerPushToken failed (non-fatal):', error?.message || error);
  }
}

/**
 * Unregister this device's push token (call on sign-out).
 */
export async function unregisterPushToken() {
  try {
    if (Platform.OS === 'web') return;
    const token = await AsyncStorage.getItem(STORED_TOKEN_KEY);
    if (!token) return;
    await notificationApi.unregisterDeviceToken(token);
    await AsyncStorage.removeItem(STORED_TOKEN_KEY);
    console.log('Unregistered push token');
  } catch (error) {
    console.error('unregisterPushToken failed (non-fatal):', error?.message || error);
  }
}
