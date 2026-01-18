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
      console.log('invitationApi - getInvitationByToken called for token:', token);
      
      const response = await apiClient.get(`/api/invitations/token/${token}`);
      console.log('invitationApi - Response:', response.data);
      
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
      console.log('invitationApi - acceptInvitation called for token:', token);
      
      const response = await apiClient.post(`/api/invitations/${token}/accept`);
      console.log('invitationApi - Accept response:', response.data);
      
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
      console.log('invitationApi - declineInvitation called for token:', token);
      
      const response = await apiClient.post(`/api/invitations/${token}/decline`);
      console.log('invitationApi - Decline response:', response.data);
      
      if (response.data.status !== 'success') {
        throw new Error(response.data.message || 'Failed to decline invitation');
      }
    } catch (error) {
      console.error('Error declining invitation:', error);
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
      console.log('invitationApi - getInvitations called with params:', params);
      
      const queryParams = new URLSearchParams();
      if (params.email) queryParams.append('email', params.email);
      if (params.contextType) queryParams.append('contextType', params.contextType);
      if (params.contextId) queryParams.append('contextId', params.contextId);
      
      const url = `/api/invitations${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiClient.get(url);
      console.log('invitationApi - Response:', response.data);
      
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
