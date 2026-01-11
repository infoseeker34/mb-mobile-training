/**
 * Authentication API
 * 
 * API calls for authentication and token management.
 */

import apiClient from './apiClient';

class AuthApi {
  /**
   * Validate access token
   */
  async validateToken() {
    const response = await apiClient.post('/api/auth/validate');
    return response.data;
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    const response = await apiClient.post('/api/auth/refresh', {
      refreshToken,
    });
    return response.data;
  }
}

export default new AuthApi();
