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
   * Check if a program is assigned to the user
   * @param {string} userId - User ID
   * @param {string} programId - Program ID
   * @returns {Promise<object>} { isAssigned, assignment, assignmentType }
   */
  async checkProgramAssignment(userId, programId) {
    try {
      console.log('assignmentApi - checkProgramAssignment:', { userId, programId });
      
      // Get all user assignments (no status filter to ensure we get everything)
      const assignments = await this.getUserAssignments(userId, {});
      
      console.log('assignmentApi - All assignments:', assignments);
      
      // Find assignment for this program (active or scheduled only)
      const assignment = assignments.find(a => 
        a.programId === programId && 
        (a.status === 'active' || a.status === 'scheduled')
      );
      
      console.log('assignmentApi - Found assignment for program:', assignment);
      
      if (assignment) {
        const assignmentType = assignment.assignmentType || 
          (assignment.assignedToUser ? 'personal' : 'team');
        
        return {
          isAssigned: true,
          assignment,
          assignmentType
        };
      }
      
      return {
        isAssigned: false,
        assignment: null,
        assignmentType: null
      };
    } catch (error) {
      console.error('Error checking program assignment:', error);
      throw error;
    }
  },

  /**
   * Get a specific assignment by ID
   * @param {string} assignmentId - Assignment ID
   * @returns {Promise<object>} Assignment details
   */
  async getAssignment(assignmentId) {
    try {
      const response = await apiClient.get(`/api/gamification/assignments/${assignmentId}`);
      
      if (response.data.status === 'success') {
        return response.data.data.assignment;
      } else {
        throw new Error(response.data.message || 'Failed to fetch assignment');
      }
    } catch (error) {
      console.error('Error fetching assignment:', error);
      throw error;
    }
  },

  /**
   * Create a personal plan assignment
   * @param {object} assignmentData - Assignment data
   * @param {string} assignmentData.programId - Program ID
   * @param {string} assignmentData.assignedToUser - User ID to assign to
   * @param {string} assignmentData.startDate - Start date (ISO string)
   * @param {string} assignmentData.endDate - End date (ISO string, optional)
   * @param {boolean} assignmentData.isRecurring - Whether assignment recurs
   * @param {string} assignmentData.recurrenceFrequency - Frequency (daily, weekly, monthly)
   * @param {number[]} assignmentData.daysOfWeek - Days of week (0-6, Sunday=0)
   * @param {string} assignmentData.notes - Optional notes
   * @returns {Promise<object>} Created assignment
   */
  async createAssignment(assignmentData) {
    try {
      console.log('assignmentApi - createAssignment:', assignmentData);
      
      const response = await apiClient.post('/api/gamification/assignments', assignmentData);
      
      if (response.data.status === 'success') {
        return response.data.data.assignment;
      } else {
        throw new Error(response.data.message || 'Failed to create assignment');
      }
    } catch (error) {
      console.error('Error creating assignment:', error);
      throw error;
    }
  },

  /**
   * Update a personal plan assignment
   * @param {string} assignmentId - Assignment ID
   * @param {object} updates - Fields to update
   * @returns {Promise<object>} Updated assignment
   */
  async updateAssignment(assignmentId, updates) {
    try {
      console.log('assignmentApi - updateAssignment:', { assignmentId, updates });
      
      const response = await apiClient.put(
        `/api/gamification/assignments/${assignmentId}`,
        updates
      );
      
      if (response.data.status === 'success') {
        return response.data.data.assignment;
      } else {
        throw new Error(response.data.message || 'Failed to update assignment');
      }
    } catch (error) {
      console.error('Error updating assignment:', error);
      throw error;
    }
  },

  /**
   * Delete a plan assignment
   * @param {string} assignmentId - Assignment ID
   * @returns {Promise<void>}
   */
  async deleteAssignment(assignmentId) {
    try {
      console.log('assignmentApi - deleteAssignment:', assignmentId);
      
      const response = await apiClient.delete(`/api/gamification/assignments/${assignmentId}`);
      
      if (response.data.status !== 'success') {
        throw new Error(response.data.message || 'Failed to delete assignment');
      }
    } catch (error) {
      console.error('Error deleting assignment:', error);
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
