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
   * Browse training plans from library
   * @param {object} params - Query parameters
   * @param {string} params.sportCategory - Filter by sport category
   * @param {string} params.difficulty - Filter by difficulty (easy, medium, hard, elite)
   * @param {string} params.searchQuery - Search query
   * @param {string} params.visibility - Filter by visibility (public, team, organization, private)
   * @param {string} params.sortBy - Sort by (rating, saves, recent, popular, name)
   * @param {string} params.sortOrder - Sort order (asc, desc)
   * @param {number} params.limit - Number of results (default: 20)
   * @param {number} params.offset - Offset for pagination (default: 0)
   * @returns {Promise<object>} Object with plans array and total count
   */
  async browsePrograms(params = {}) {
    try {
      console.log('planApi - browsePrograms called with params:', params);
      
      const queryParams = new URLSearchParams();
      
      // Add all supported filter parameters
      if (params.sportCategory) {
        queryParams.append('sportCategory', params.sportCategory);
      }
      if (params.difficulty) {
        queryParams.append('difficulty', params.difficulty);
      }
      if (params.searchQuery) {
        queryParams.append('searchQuery', params.searchQuery);
      }
      if (params.visibility) {
        queryParams.append('visibility', params.visibility);
      }
      if (params.sortBy) {
        queryParams.append('sortBy', params.sortBy);
      }
      if (params.sortOrder) {
        queryParams.append('sortOrder', params.sortOrder);
      }
      if (params.limit !== undefined) {
        queryParams.append('limit', params.limit.toString());
      }
      if (params.offset !== undefined) {
        queryParams.append('offset', params.offset.toString());
      }

      const queryString = queryParams.toString();
      const url = `/api/gamification/plans/library${queryString ? `?${queryString}` : ''}`;
      console.log('planApi - Full URL:', url);
      
      const response = await apiClient.get(url);
      console.log('planApi - Response status:', response.status);
      console.log('planApi - Response data:', response.data);
      
      if (response.data.status === 'success') {
        return response.data.data; // Returns { plans: [], total: number }
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
