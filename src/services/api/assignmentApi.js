/**
 * Assignment API
 * 
 * API calls for plan assignments (personal and team).
 */

import apiClient from './apiClient';

const assignmentApi = {
  /**
   * Get user's plan assignments (personal + team)
   * @param {string} userId - User ID
   * @param {object} params - Query parameters
   * @param {string} params.status - Filter by status (scheduled, active, completed, cancelled)
   * @param {string} params.startDate - Filter by start date (ISO string)
   * @param {string} params.endDate - Filter by end date (ISO string)
   * @returns {Promise<Array>} Array of assignments
   */
  async getUserAssignments(userId, params = {}) {
    try {
      console.log('assignmentApi - getUserAssignments called with userId:', userId);
      console.log('assignmentApi - params:', params);
      
      const queryParams = new URLSearchParams();
      
      if (params.status) {
        queryParams.append('status', params.status);
      }
      if (params.startDate) {
        queryParams.append('startDate', params.startDate);
      }
      if (params.endDate) {
        queryParams.append('endDate', params.endDate);
      }

      const queryString = queryParams.toString();
      const url = `/api/gamification/assignments/user/${userId}${queryString ? `?${queryString}` : ''}`;
      console.log('assignmentApi - Full URL:', url);
      
      const response = await apiClient.get(url);
      console.log('assignmentApi - Response status:', response.status);
      console.log('assignmentApi - Response data:', response.data);
      
      if (response.data.status === 'success') {
        return response.data.data.assignments;
      } else {
        throw new Error(response.data.message || 'Failed to fetch assignments');
      }
    } catch (error) {
      console.error('Error fetching user assignments:', error);
      throw error;
    }
  },

  /**
   * Get team's plan assignments
   * @param {string} teamId - Team ID
   * @param {string} status - Filter by status (optional)
   * @returns {Promise<Array>} Array of team assignments
   */
  async getTeamAssignments(teamId, status = null) {
    try {
      const queryString = status ? `?status=${status}` : '';
      const url = `/api/gamification/assignments/team/${teamId}${queryString}`;
      
      const response = await apiClient.get(url);
      
      if (response.data.status === 'success') {
        return response.data.data.assignments;
      } else {
        throw new Error(response.data.message || 'Failed to fetch team assignments');
      }
    } catch (error) {
      console.error('Error fetching team assignments:', error);
      throw error;
    }
  },

  /**
   * Complete a plan assignment
   * @param {string} assignmentId - Assignment ID
   * @param {object} completionData - Completion data
   * @returns {Promise<object>} Completion record
   */
  async completeAssignment(assignmentId, completionData) {
    try {
      const response = await apiClient.post(
        `/api/gamification/assignments/${assignmentId}/complete`,
        completionData
      );
      
      if (response.data.status === 'success') {
        return response.data.data.completion;
      } else {
        throw new Error(response.data.message || 'Failed to complete assignment');
      }
    } catch (error) {
      console.error('Error completing assignment:', error);
      throw error;
    }
  },
};

export default assignmentApi;
