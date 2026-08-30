/**
 * Progress API
 * 
 * API calls for player progress, stats, and streaks.
 */

import apiClient from './apiClient';
import CacheStorage from '../storage/CacheStorage';

const progressApi = {
  /**
   * Get player progress (XP, level, stats)
   * Network-first with offline cache fallback.
   * @returns {Promise<object>} Progress data
   */
  async getPlayerProgress() {
    const progress = await CacheStorage.getWithFallback(
      'player_progress',
      async () => {
        const response = await apiClient.get('/api/gamification/progress');
        if (response.data.status !== 'success') {
          throw new Error(response.data.message || 'Failed to fetch progress');
        }
        return response.data.data.progress;
      }
    );

    if (progress == null) {
      throw new Error('Failed to fetch progress');
    }
    return progress;
  },

  /**
   * Get streak data
   * Network-first with offline cache fallback.
   * @returns {Promise<object>} Streak data
   */
  async getStreakData() {
    const streak = await CacheStorage.getWithFallback(
      'streak_data',
      async () => {
        const response = await apiClient.get('/api/gamification/streak');
        if (response.data.status !== 'success') {
          throw new Error(response.data.message || 'Failed to fetch streak');
        }
        return response.data.data.streak;
      }
    );

    if (streak == null) {
      throw new Error('Failed to fetch streak');
    }
    return streak;
  },

  /**
   * Get streak statistics
   * @returns {Promise<object>} Streak stats
   */
  async getStreakStats() {
    try {
      
      const response = await apiClient.get('/api/gamification/streak/stats');
      
      if (response.data.status === 'success') {
        return response.data.data.stats;
      } else {
        throw new Error(response.data.message || 'Failed to fetch streak stats');
      }
    } catch (error) {
      console.error('Error fetching streak stats:', error);
      throw error;
    }
  },
};

export default progressApi;
