/**
 * Progress API
 * 
 * API calls for player progress, stats, and streaks.
 */

import apiClient from './apiClient';

const progressApi = {
  /**
   * Get player progress (XP, level, stats)
   * @returns {Promise<object>} Progress data
   */
  async getPlayerProgress() {
    try {
      console.log('progressApi - getPlayerProgress called');
      
      const response = await apiClient.get('/api/gamification/progress');
      console.log('progressApi - Progress response:', response.data);
      
      if (response.data.status === 'success') {
        return response.data.data.progress;
      } else {
        throw new Error(response.data.message || 'Failed to fetch progress');
      }
    } catch (error) {
      console.error('Error fetching player progress:', error);
      throw error;
    }
  },

  /**
   * Get streak data
   * @returns {Promise<object>} Streak data
   */
  async getStreakData() {
    try {
      console.log('progressApi - getStreakData called');
      
      const response = await apiClient.get('/api/gamification/streak');
      console.log('progressApi - Streak response:', response.data);
      
      if (response.data.status === 'success') {
        return response.data.data.streak;
      } else {
        throw new Error(response.data.message || 'Failed to fetch streak');
      }
    } catch (error) {
      console.error('Error fetching streak data:', error);
      throw error;
    }
  },

  /**
   * Get streak statistics
   * @returns {Promise<object>} Streak stats
   */
  async getStreakStats() {
    try {
      console.log('progressApi - getStreakStats called');
      
      const response = await apiClient.get('/api/gamification/streak/stats');
      console.log('progressApi - Streak stats response:', response.data);
      
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
