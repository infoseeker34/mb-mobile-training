/**
 * Secure Storage Service
 * 
 * Handles secure storage of sensitive data (tokens) using Expo SecureStore.
 * On iOS: Uses Keychain
 * On Android: Uses EncryptedSharedPreferences
 */

import * as SecureStore from 'expo-secure-store';
import logger from '../utils/logger';

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
      await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, accessToken);
      await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, refreshToken);
      if (idToken) {
        await SecureStore.setItemAsync(KEYS.ID_TOKEN, idToken);
      }
    } catch (error) {
      logger.error('Error saving tokens:', error);
      throw error;
    }
  }

  /**
   * Get all authentication tokens
   */
  async getTokens() {
    try {
      const accessToken = await SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
      const refreshToken = await SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
      const idToken = await SecureStore.getItemAsync(KEYS.ID_TOKEN);
      
      return { accessToken, refreshToken, idToken };
    } catch (error) {
      logger.error('Error getting tokens:', error);
      return { accessToken: null, refreshToken: null, idToken: null };
    }
  }

  /**
   * Get access token only
   */
  async getAccessToken() {
    try {
      return await SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
    } catch (error) {
      logger.error('Error getting access token:', error);
      return null;
    }
  }

  /**
   * Get refresh token only
   */
  async getRefreshToken() {
    try {
      return await SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
    } catch (error) {
      logger.error('Error getting refresh token:', error);
      return null;
    }
  }

  /**
   * Clear all authentication tokens
   */
  async clearTokens() {
    try {
      await SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN);
      await SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN);
      await SecureStore.deleteItemAsync(KEYS.ID_TOKEN);
      await SecureStore.deleteItemAsync(KEYS.USER_ID);
    } catch (error) {
      logger.error('Error clearing tokens:', error);
      throw error;
    }
  }

  /**
   * Save user ID
   */
  async saveUserId(userId) {
    try {
      await SecureStore.setItemAsync(KEYS.USER_ID, userId);
    } catch (error) {
      logger.error('Error saving user ID:', error);
      throw error;
    }
  }

  /**
   * Get user ID
   */
  async getUserId() {
    try {
      return await SecureStore.getItemAsync(KEYS.USER_ID);
    } catch (error) {
      logger.error('Error getting user ID:', error);
      return null;
    }
  }
}

export default new SecureStorageService();
