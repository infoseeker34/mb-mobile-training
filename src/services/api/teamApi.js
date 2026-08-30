/**
 * Team API
 * 
 * API calls for team management and team data.
 */

import apiClient from './apiClient';
import {
  isPersonalOrgTeamLimitError,
  getReportedTeamLimit,
  PERSONAL_ORG_TEAM_LIMIT_CODE,
} from './teamLimit';

const teamApi = {
  /**
   * Get all teams for the authenticated user
   * @returns {Promise<object>} Teams data
   */
  async getTeams() {
    try {
      
      const response = await apiClient.get('/api/teams');
      
      if (response.data.status === 'success') {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch teams');
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
      throw error;
    }
  },

  /**
   * Get team by ID
   * @param {string} teamId - Team ID
   * @returns {Promise<object>} Team data
   */
  async getTeam(teamId) {
    try {
      
      const response = await apiClient.get(`/api/teams/${teamId}`);
      
      if (response.data.status === 'success') {
        return response.data.data.team;
      } else {
        throw new Error(response.data.message || 'Failed to fetch team');
      }
    } catch (error) {
      console.error('Error fetching team:', error);
      throw error;
    }
  },

  /**
   * Get team members
   * @param {string} teamId - Team ID
   * @returns {Promise<object>} Team members data
   */
  async getTeamMembers(teamId) {
    try {
      
      const response = await apiClient.get(`/api/teams/${teamId}/members`);
      
      if (response.data.status === 'success') {
        return response.data.data.members;
      } else {
        throw new Error(response.data.message || 'Failed to fetch team members');
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
      throw error;
    }
  },

  /**
   * Get team streak data
   * @param {string} teamId - Team ID
   * @returns {Promise<object>} Team streak data
   */
  async getTeamStreak(teamId) {
    try {
      
      const response = await apiClient.get(`/api/teams/${teamId}/streak`);
      
      if (response.data.status === 'success') {
        return response.data.data.streak;
      } else {
        throw new Error(response.data.message || 'Failed to fetch team streak');
      }
    } catch (error) {
      console.error('Error fetching team streak:', error);
      throw error;
    }
  },

  /**
   * Create a new team within an organization.
   * @param {string} orgId - Organization ID the team belongs to
   * @param {object} teamData - Team data (e.g. { name })
   * @returns {Promise<object>} Created team
   * @throws Personal-org team-limit rejections are normalized so callers can
   *   key off `error.code === 'PERSONAL_ORG_TEAM_LIMIT'` and read `error.limit`.
   */
  async createTeam(orgId, teamData) {
    try {

      const response = await apiClient.post(`/api/organizations/${orgId}/teams`, teamData);

      if (response.data.status === 'success') {
        return response.data.data.team;
      } else {
        throw new Error(response.data.message || 'Failed to create team');
      }
    } catch (error) {
      // Personal orgs are capped (ORG-6). Normalize the backend's 403 into an
      // error whose `code`/`limit` the UI can consume directly, instead of
      // leaking the raw axios error whose `.code` is an axios code.
      if (isPersonalOrgTeamLimitError(error)) {
        const limit = getReportedTeamLimit(error);
        const limitError = new Error(
          error?.response?.data?.message || 'Personal organization team limit reached'
        );
        limitError.code = PERSONAL_ORG_TEAM_LIMIT_CODE;
        limitError.limit = limit;
        limitError.status = 403;
        console.warn('teamApi - personal org team limit reached (limit:', limit, ')');
        throw limitError;
      }
      console.error('Error creating team:', error);
      throw error;
    }
  },

  /**
   * Update team
   * @param {string} teamId - Team ID
   * @param {object} teamData - Updated team data
   * @returns {Promise<object>} Updated team
   */
  async updateTeam(teamId, teamData) {
    try {
      
      const response = await apiClient.put(`/api/teams/${teamId}`, teamData);
      
      if (response.data.status === 'success') {
        return response.data.data.team;
      } else {
        throw new Error(response.data.message || 'Failed to update team');
      }
    } catch (error) {
      console.error('Error updating team:', error);
      throw error;
    }
  },

  /**
   * Delete team
   * @param {string} teamId - Team ID
   * @returns {Promise<void>}
   */
  async deleteTeam(teamId) {
    try {
      
      const response = await apiClient.delete(`/api/teams/${teamId}`);
      
      if (response.data.status !== 'success') {
        throw new Error(response.data.message || 'Failed to delete team');
      }
    } catch (error) {
      console.error('Error deleting team:', error);
      throw error;
    }
  },
};

export default teamApi;
