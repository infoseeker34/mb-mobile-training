/**
 * Invitation API
 * 
 * API calls for managing invitations.
 */

import apiClient from './apiClient';

const invitationApi = {
  /**
   * Get invitation details by token
   * @param {string} token - Invitation token
   * @returns {Promise<object>} Invitation details
   */
  async getInvitationByToken(token) {
    try {
      
      const response = await apiClient.get(`/api/invitations/token/${token}`);
      
      if (response.data.status === 'success') {
        return response.data.data.invitation;
      } else {
        throw new Error(response.data.message || 'Failed to fetch invitation');
      }
    } catch (error) {
      console.error('Error fetching invitation:', error);
      throw error;
    }
  },

  /**
   * Accept an invitation
   * @param {string} token - Invitation token
   * @returns {Promise<object>} Acceptance result
   */
  async acceptInvitation(token) {
    try {
      
      const response = await apiClient.post(`/api/invitations/${token}/accept`);
      
      if (response.data.status === 'success') {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to accept invitation');
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      console.error('Error response data:', error.response?.data);
      console.error('Error response status:', error.response?.status);
      
      // Throw a more descriptive error
      const errorMessage = error.response?.data?.message || error.message || 'Failed to accept invitation';
      throw new Error(errorMessage);
    }
  },

  /**
   * Decline an invitation
   * @param {string} token - Invitation token
   * @returns {Promise<void>}
   */
  async declineInvitation(token) {
    try {
      
      const response = await apiClient.post(`/api/invitations/${token}/decline`);
      
      if (response.data.status !== 'success') {
        throw new Error(response.data.message || 'Failed to decline invitation');
      }
    } catch (error) {
      console.error('Error declining invitation:', error);
      throw error;
    }
  },

  /**
   * Get pending invitations addressed to the current user (by internal user id).
   * Returns rows with full org + team context, so combo invites are detectable.
   * @returns {Promise<array>} List of pending invitations
   */
  async getPendingInvitations() {
    try {

      const response = await apiClient.get('/api/invitations/pending');

      if (response.data.status === 'success') {
        return response.data.data.invitations || [];
      } else {
        throw new Error(response.data.message || 'Failed to fetch pending invitations');
      }
    } catch (error) {
      console.error('Error fetching pending invitations:', error);
      throw error;
    }
  },

  /**
   * Get user's invitations
   * @param {object} params - Query parameters
   * @returns {Promise<array>} List of invitations
   */
  async getInvitations(params = {}) {
    try {
      
      const queryParams = new URLSearchParams();
      if (params.email) queryParams.append('email', params.email);
      if (params.contextType) queryParams.append('contextType', params.contextType);
      if (params.contextId) queryParams.append('contextId', params.contextId);
      
      const url = `/api/invitations${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiClient.get(url);
      
      if (response.data.status === 'success') {
        return response.data.data.invitations;
      } else {
        throw new Error(response.data.message || 'Failed to fetch invitations');
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
      throw error;
    }
  },
};

export default invitationApi;
