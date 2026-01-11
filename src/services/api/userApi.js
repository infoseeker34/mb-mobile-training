/**
 * User API
 * 
 * API calls for user profile management.
 */

import apiClient from './apiClient';

class UserApi {
  /**
   * Get current user profile
   */
  async getCurrentUser() {
    const response = await apiClient.get('/api/users/me');
    return response.data;
  }

  /**
   * Create user profile (first-time setup)
   */
  async createProfile(profileData) {
    const response = await apiClient.post('/api/users/me', profileData);
    return response.data;
  }

  /**
   * Update user profile
   */
  async updateProfile(profileData) {
    const response = await apiClient.put('/api/users/me', profileData);
    return response.data;
  }

  /**
   * Check username availability
   */
  async checkUsernameAvailability(username) {
    const response = await apiClient.get(`/api/users/username/${username}/availability`);
    return response.data;
  }

  /**
   * Get user's organizations
   */
  async getUserOrganizations() {
    const response = await apiClient.get('/api/users/me/organizations');
    return response.data;
  }
}

export default new UserApi();
