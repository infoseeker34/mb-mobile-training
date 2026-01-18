/**
 * Session API
 * 
 * API calls for training sessions (history, active sessions, etc.).
 */

import apiClient from './apiClient';

const sessionApi = {
  /**
   * Get session history for the current user
   * @param {object} params - Query parameters
   * @param {number} params.limit - Number of results (default: 10)
   * @param {number} params.offset - Offset for pagination (default: 0)
   * @returns {Promise<object>} Object with sessions array, limit, and offset
   */
  async getSessionHistory(params = {}) {
    try {
      console.log('sessionApi - getSessionHistory called with params:', params);
      
      const queryParams = new URLSearchParams();
      
      if (params.limit !== undefined) {
        queryParams.append('limit', params.limit.toString());
      }
      if (params.offset !== undefined) {
        queryParams.append('offset', params.offset.toString());
      }

      const queryString = queryParams.toString();
      const url = `/api/gamification/sessions/history${queryString ? `?${queryString}` : ''}`;
      console.log('sessionApi - Full URL:', url);
      
      const response = await apiClient.get(url);
      console.log('sessionApi - Response status:', response.status);
      console.log('sessionApi - Response data:', response.data);
      
      if (response.data.status === 'success') {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch session history');
      }
    } catch (error) {
      console.error('Error fetching session history:', error);
      throw error;
    }
  },

  /**
   * Start a new training session
   * @param {object} sessionData - Session data
   * @param {string} sessionData.programId - Program ID
   * @param {string} sessionData.assignmentId - Assignment ID (optional)
   * @returns {Promise<object>} Started session
   */
  async startSession(sessionData) {
    try {
      console.log('sessionApi - startSession:', sessionData);
      
      const response = await apiClient.post('/api/gamification/sessions/start', sessionData);
      
      if (response.data.status === 'success') {
        return response.data.data.session;
      } else {
        throw new Error(response.data.message || 'Failed to start session');
      }
    } catch (error) {
      console.error('Error starting session:', error);
      throw error;
    }
  },

  /**
   * Complete a training session
   * @param {string} sessionId - Session ID
   * @param {object} completionData - Completion data
   * @returns {Promise<object>} Completed session
   */
  async completeSession(sessionId, completionData) {
    try {
      console.log('sessionApi - completeSession:', { sessionId, completionData });
      
      const response = await apiClient.post(
        `/api/gamification/sessions/${sessionId}/complete`,
        completionData
      );
      
      if (response.data.status === 'success') {
        return response.data.data.session;
      } else {
        throw new Error(response.data.message || 'Failed to complete session');
      }
    } catch (error) {
      console.error('Error completing session:', error);
      throw error;
    }
  },
};

export default sessionApi;
