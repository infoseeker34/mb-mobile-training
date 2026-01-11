/**
 * Cache Storage Service
 * 
 * Handles caching of non-sensitive data for offline support.
 * Uses AsyncStorage for persistent local storage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_CONFIG } from '../../constants/Config';

const CACHE_PREFIX = 'cache_';
const CACHE_EXPIRY_MS = APP_CONFIG.cacheExpiryMinutes * 60 * 1000;

class CacheStorageService {
  /**
   * Cache data with timestamp
   */
  async set(key, data) {
    try {
      const cacheItem = {
        data,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(
        `${CACHE_PREFIX}${key}`,
        JSON.stringify(cacheItem)
      );
    } catch (error) {
      console.error('Error caching data:', error);
    }
  }

  /**
   * Get cached data if not expired
   */
  async get(key) {
    try {
      const cached = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      
      // Check if expired
      if (Date.now() - timestamp > CACHE_EXPIRY_MS) {
        await this.remove(key);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error getting cached data:', error);
      return null;
    }
  }

  /**
   * Remove cached item
   */
  async remove(key) {
    try {
      await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
    } catch (error) {
      console.error('Error removing cached data:', error);
    }
  }

  /**
   * Clear all cached data
   */
  async clearAll() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Get data with fallback to cache
   * Useful pattern: try API, fallback to cache on error
   */
  async getWithFallback(key, fetchFunction) {
    try {
      // Try to fetch fresh data
      const freshData = await fetchFunction();
      await this.set(key, freshData);
      return freshData;
    } catch (error) {
      // Fallback to cache
      console.log('Fetching failed, using cache for:', key);
      return await this.get(key);
    }
  }
}

export default new CacheStorageService();
