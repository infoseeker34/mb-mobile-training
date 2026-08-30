/**
 * Plan API
 * 
 * API calls for training plans and program details.
 */

import apiClient from './apiClient';
import CacheStorage from '../storage/CacheStorage';

const planApi = {
  /**
   * Get program details with tasks
   * Network-first with offline cache fallback.
   * @param {string} programId - Program ID
   * @returns {Promise<object>} Program with tasks
   */
  async getProgramDetails(programId) {
    const plan = await CacheStorage.getWithFallback(
      `program_details_${programId}`,
      async () => {
        const response = await apiClient.get(`/api/gamification/plans/${programId}`);
        if (response.data.status !== 'success') {
          throw new Error(response.data.message || 'Failed to fetch program details');
        }
        return response.data.data.plan;
      }
    );

    if (plan == null) {
      throw new Error('Failed to fetch program details');
    }
    return plan;
  },

  /**
   * Get assignment details with program and tasks
   * @param {string} assignmentId - Assignment ID
   * @returns {Promise<object>} Assignment with program and tasks
   */
  async getAssignmentDetails(assignmentId) {
    try {
      
      const response = await apiClient.get(`/api/gamification/assignments/${assignmentId}`);
      
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

      // Network-first with offline cache fallback, keyed per query.
      const data = await CacheStorage.getWithFallback(
        `plans_library_${queryString || 'default'}`,
        async () => {
          const response = await apiClient.get(url);
          if (response.data.status !== 'success') {
            throw new Error(response.data.message || 'Failed to fetch programs');
          }
          return response.data.data; // Returns { plans: [], total: number }
        }
      );

      if (data == null) {
        throw new Error('Failed to fetch programs');
      }
      return data;
    } catch (error) {
      console.error('Error browsing programs:', error);
      throw error;
    }
  },
};

export default planApi;
