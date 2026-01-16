/**
 * Plan API
 * 
 * API calls for training plans and program details.
 */

import apiClient from './apiClient';

const planApi = {
  /**
   * Get program details with tasks
   * @param {string} programId - Program ID
   * @returns {Promise<object>} Program with tasks
   */
  async getProgramDetails(programId) {
    try {
      console.log('planApi - getProgramDetails called with programId:', programId);
      
      const response = await apiClient.get(`/api/gamification/plans/${programId}`);
      console.log('planApi - Response status:', response.status);
      console.log('planApi - Response data:', response.data);
      
      if (response.data.status === 'success') {
        return response.data.data.plan;
      } else {
        throw new Error(response.data.message || 'Failed to fetch program details');
      }
    } catch (error) {
      console.error('Error fetching program details:', error);
      throw error;
    }
  },

  /**
   * Get assignment details with program and tasks
   * @param {string} assignmentId - Assignment ID
   * @returns {Promise<object>} Assignment with program and tasks
   */
  async getAssignmentDetails(assignmentId) {
    try {
      console.log('planApi - getAssignmentDetails called with assignmentId:', assignmentId);
      
      const response = await apiClient.get(`/api/gamification/assignments/${assignmentId}`);
      console.log('planApi - Response status:', response.status);
      console.log('planApi - Response data:', response.data);
      
      if (response.data.status === 'success') {
        return response.data.data.assignment;
      } else {
        throw new Error(response.data.message || 'Failed to fetch assignment details');
      }
    } catch (error) {
      console.error('Error fetching assignment details:', error);
      throw error;
    }
  },

  /**
   * Browse public training plans
   * @param {object} params - Query parameters
   * @param {string} params.sportCategory - Filter by sport category
   * @param {string} params.difficulty - Filter by difficulty
   * @param {string} params.search - Search query
   * @returns {Promise<Array>} Array of programs
   */
  async browsePrograms(params = {}) {
    try {
      console.log('planApi - browsePrograms called with params:', params);
      
      const queryParams = new URLSearchParams();
      
      if (params.sportCategory) {
        queryParams.append('sportCategory', params.sportCategory);
      }
      if (params.difficulty) {
        queryParams.append('difficulty', params.difficulty);
      }
      if (params.search) {
        queryParams.append('search', params.search);
      }

      const queryString = queryParams.toString();
      const url = `/api/gamification/programs${queryString ? `?${queryString}` : ''}`;
      console.log('planApi - Full URL:', url);
      
      const response = await apiClient.get(url);
      console.log('planApi - Response status:', response.status);
      console.log('planApi - Response data:', response.data);
      
      if (response.data.status === 'success') {
        return response.data.data.programs;
      } else {
        throw new Error(response.data.message || 'Failed to fetch programs');
      }
    } catch (error) {
      console.error('Error browsing programs:', error);
      throw error;
    }
  },
};

export default planApi;
