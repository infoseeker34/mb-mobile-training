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
   * Get user's organizations.
   * Each org carries an `isActive` flag marking the user's current context (ORG-4).
   */
  async getUserOrganizations() {
    const response = await apiClient.get('/api/users/me/organizations');
    return response.data;
  }

  /**
   * Switch the authenticated user's active organization context (ORG-4).
   * The backend persists `active_org_id` and returns the now-active org.
   * @param {string} orgId - Target organization the user is an active member of
   * @returns {Promise<object>} { status, message, data: { activeOrgId, organization } }
   * @throws Rejects with the axios error (403 when not an active member).
   */
  async setActiveOrganization(orgId) {
    const response = await apiClient.post('/api/users/me/context', { orgId });
    return response.data;
  }

  /**
   * Add an athlete profile under the authenticated (parent) account.
   * Athletes never get their own login - see GET /api/users/me's
   * `athletes` array for the full list.
   */
  async addAthlete(athleteData) {
    const response = await apiClient.post('/api/users/me/athletes', athleteData);
    return response.data;
  }

  /**
   * Update an athlete profile owned by the authenticated account
   */
  async updateAthlete(athleteId, athleteData) {
    const response = await apiClient.put(`/api/users/me/athletes/${athleteId}`, athleteData);
    return response.data;
  }

  /**
   * Remove an athlete profile owned by the authenticated account
   */
  async deleteAthlete(athleteId) {
    const response = await apiClient.delete(`/api/users/me/athletes/${athleteId}`);
    return response.data;
  }
}

export default new UserApi();
