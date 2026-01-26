/**
 * Team Activity API
 * 
 * API calls for team activity feed, milestones, and celebrations
 */

import apiClient from './apiClient';

const teamActivityApi = {
  /**
   * Get activity feed for all user's teams
   * @param {number} limit - Number of activities to fetch
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Array>} Array of team activities
   */
  async getUserTeamsActivityFeed(limit = 20, offset = 0) {
    try {
      console.log('teamActivityApi - getUserTeamsActivityFeed called');
      
      const response = await apiClient.get('/api/teams/activity/feed', {
        params: { limit, offset }
      });
      
      console.log('teamActivityApi - Response:', response.data);
      
      if (response.data.status === 'success') {
        return response.data.data.activities;
      } else {
        throw new Error(response.data.message || 'Failed to fetch activity feed');
      }
    } catch (error) {
      console.error('Error fetching activity feed:', error);
      throw error;
    }
  },

  /**
   * Get activity feed for a specific team
   * @param {string} teamId - Team ID
   * @param {number} limit - Number of activities to fetch
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Array>} Array of team activities
   */
  async getTeamActivityFeed(teamId, limit = 20, offset = 0) {
    try {
      console.log('teamActivityApi - getTeamActivityFeed called for team:', teamId);
      
      const response = await apiClient.get(`/api/teams/${teamId}/activity`, {
        params: { limit, offset }
      });
      
      if (response.data.status === 'success') {
        return response.data.data.activities;
      } else {
        throw new Error(response.data.message || 'Failed to fetch team activity feed');
      }
    } catch (error) {
      console.error('Error fetching team activity feed:', error);
      throw error;
    }
  },

  /**
   * Celebrate an activity
   * @param {string} activityId - Activity ID to celebrate
   * @returns {Promise<object>} Celebration data
   */
  async celebrateActivity(activityId) {
    try {
      console.log('teamActivityApi - celebrateActivity called for:', activityId);
      
      const response = await apiClient.post(`/api/teams/activity/${activityId}/celebrate`);
      
      if (response.data.status === 'success') {
        return response.data.data.celebration;
      } else {
        throw new Error(response.data.message || 'Failed to celebrate activity');
      }
    } catch (error) {
      console.error('Error celebrating activity:', error);
      throw error;
    }
  },

  /**
   * Get incomplete assignments across all user's teams
   * @returns {Promise<Array>} Array of incomplete assignments
   */
  async getUserTeamsIncompleteAssignments() {
    try {
      console.log('teamActivityApi - getUserTeamsIncompleteAssignments called');
      
      // Get device timezone for accurate "today" calculations
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      console.log('teamActivityApi - Using timezone:', timezone);
      
      const response = await apiClient.get(`/api/teams/incomplete-assignments/feed?timezone=${encodeURIComponent(timezone)}`);
      
      console.log('teamActivityApi - Incomplete assignments response:', response.data);
      
      if (response.data.status === 'success') {
        return response.data.data.incompleteAssignments;
      } else {
        throw new Error(response.data.message || 'Failed to fetch incomplete assignments');
      }
    } catch (error) {
      console.error('Error fetching incomplete assignments:', error);
      throw error;
    }
  },

  /**
   * Get today's nudge history for an assignment
   * @param {string} assignmentId - Assignment ID
   * @returns {Promise<Array>} Array of nudges sent today
   */
  async getTodaysNudges(assignmentId) {
    try {
      console.log('teamActivityApi - getTodaysNudges called for:', assignmentId);
      
      // Get device timezone for accurate "today" calculations
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      const response = await apiClient.get(`/api/teams/nudges/${assignmentId}/today?timezone=${encodeURIComponent(timezone)}`);
      
      if (response.data.status === 'success') {
        return response.data.data.nudges;
      } else {
        throw new Error(response.data.message || 'Failed to fetch nudge history');
      }
    } catch (error) {
      console.error('Error fetching nudge history:', error);
      throw error;
    }
  },

  /**
   * Get today's assignment completion stats
   * @param {string} assignmentId - Assignment ID
   * @returns {Promise<object>} Completion stats {completed, total, completedUserIds}
   */
  async getTodaysAssignmentCompletions(assignmentId) {
    try {
      console.log('teamActivityApi - getTodaysAssignmentCompletions called for:', assignmentId);
      
      // Get device timezone for accurate "today" calculations
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      console.log('teamActivityApi - Using timezone:', timezone);
      
      const response = await apiClient.get(`/api/teams/assignments/${assignmentId}/completions/today?timezone=${encodeURIComponent(timezone)}`);
      
      if (response.data.status === 'success') {
        return response.data.data.stats;
      } else {
        throw new Error(response.data.message || 'Failed to fetch assignment completions');
      }
    } catch (error) {
      console.error('Error fetching assignment completions:', error);
      throw error;
    }
  },

  /**
   * Send a nudge to a user about an incomplete assignment
   * @param {string} toUserId - User ID to send nudge to
   * @param {string} assignmentId - Assignment ID
   * @param {string} message - Optional custom message
   * @returns {Promise<object>} Nudge data
   */
  async sendNudge(toUserId, assignmentId, message = null) {
    try {
      console.log('teamActivityApi - sendNudge called:', { toUserId, assignmentId });
      
      const response = await apiClient.post('/api/teams/nudge', {
        toUserId,
        assignmentId,
        message
      });
      
      if (response.data.status === 'success') {
        return response.data.data.nudge;
      } else {
        throw new Error(response.data.message || 'Failed to send nudge');
      }
    } catch (error) {
      console.error('Error sending nudge:', error);
      throw error;
    }
  }
};

export default teamActivityApi;
