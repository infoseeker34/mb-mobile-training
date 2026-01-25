import apiClient from './apiClient';

class OrganizationApi {
  async getOrganizations() {
    try {
      const response = await apiClient.get('/api/organizations');
      return response.data;
    } catch (error) {
      console.error('Error fetching organizations:', error);
      throw error;
    }
  }

  async getOrganization(orgId) {
    try {
      const response = await apiClient.get(`/api/organizations/${orgId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching organization:', error);
      throw error;
    }
  }

  async getOrganizationMembers(orgId) {
    try {
      const response = await apiClient.get(`/api/organizations/${orgId}/members`);
      return response.data;
    } catch (error) {
      console.error('Error fetching organization members:', error);
      throw error;
    }
  }
}

export const organizationApi = new OrganizationApi();
