/**
 * Secure Storage Service
 *
 * Handles secure storage of sensitive data (tokens) using Expo SecureStore.
 * On iOS: Uses Keychain
 * On Android: Uses EncryptedSharedPreferences
 * On web: expo-secure-store has no native keychain to back it, so we fall
 * back to localStorage. This is not encrypted at rest - fine for local dev
 * preview, but browsers have no OS-level secure storage equivalent, so this
 * is not a production-grade solution for a web deployment.
 */

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const webStorage = {
  async setItemAsync(key, value) {
    window.localStorage.setItem(key, value);
  },
  async getItemAsync(key) {
    return window.localStorage.getItem(key);
  },
  async deleteItemAsync(key) {
    window.localStorage.removeItem(key);
  },
};

const storage = Platform.OS === 'web' ? webStorage : SecureStore;

const KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  ID_TOKEN: 'id_token',
  USER_ID: 'user_id',
};

class SecureStorageService {
  /**
   * Save authentication tokens
   */
  async saveTokens(accessToken, refreshToken, idToken) {
    try {
      await storage.setItemAsync(KEYS.ACCESS_TOKEN, accessToken);
      await storage.setItemAsync(KEYS.REFRESH_TOKEN, refreshToken);
      if (idToken) {
        await storage.setItemAsync(KEYS.ID_TOKEN, idToken);
      }
    } catch (error) {
      console.error('Error saving tokens:', error);
      throw error;
    }
  }

  /**
   * Get all authentication tokens
   */
  async getTokens() {
    try {
      const accessToken = await storage.getItemAsync(KEYS.ACCESS_TOKEN);
      const refreshToken = await storage.getItemAsync(KEYS.REFRESH_TOKEN);
      const idToken = await storage.getItemAsync(KEYS.ID_TOKEN);
      
      return { accessToken, refreshToken, idToken };
    } catch (error) {
      console.error('Error getting tokens:', error);
      return { accessToken: null, refreshToken: null, idToken: null };
    }
  }

  /**
   * Get access token only
   */
  async getAccessToken() {
    try {
      return await storage.getItemAsync(KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  /**
   * Get refresh token only
   */
  async getRefreshToken() {
    try {
      return await storage.getItemAsync(KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  }

  /**
   * Clear all authentication tokens
   */
  async clearTokens() {
    try {
      await storage.deleteItemAsync(KEYS.ACCESS_TOKEN);
      await storage.deleteItemAsync(KEYS.REFRESH_TOKEN);
      await storage.deleteItemAsync(KEYS.ID_TOKEN);
      await storage.deleteItemAsync(KEYS.USER_ID);
    } catch (error) {
      console.error('Error clearing tokens:', error);
      throw error;
    }
  }

  /**
   * Save user ID
   */
  async saveUserId(userId) {
    try {
      await storage.setItemAsync(KEYS.USER_ID, userId);
    } catch (error) {
      console.error('Error saving user ID:', error);
      throw error;
    }
  }

  /**
   * Get user ID
   */
  async getUserId() {
    try {
      return await storage.getItemAsync(KEYS.USER_ID);
    } catch (error) {
      console.error('Error getting user ID:', error);
      return null;
    }
  }
}

export default new SecureStorageService();
