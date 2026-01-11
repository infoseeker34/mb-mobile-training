/**
 * Token Manager
 * 
 * Handles token refresh logic and token lifecycle management.
 */

import SecureStorage from '../storage/SecureStorage';
import { API_BASE_URL } from '../../constants/Config';

class TokenManager {
  constructor() {
    this.isRefreshing = false;
    this.refreshSubscribers = [];
  }

  /**
   * Subscribe to token refresh completion
   */
  subscribeTokenRefresh(callback) {
    this.refreshSubscribers.push(callback);
  }

  /**
   * Notify all subscribers when token is refreshed
   */
  onTokenRefreshed(token) {
    this.refreshSubscribers.forEach(callback => callback(token));
    this.refreshSubscribers = [];
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken() {
    const refreshToken = await SecureStorage.getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      const { accessToken, idToken } = data.data;

      // Save new tokens
      await SecureStorage.saveTokens(accessToken, refreshToken, idToken);

      return accessToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      // Clear tokens on refresh failure
      await SecureStorage.clearTokens();
      throw error;
    }
  }

  /**
   * Get valid access token (refresh if needed)
   */
  async getValidAccessToken() {
    const accessToken = await SecureStorage.getAccessToken();
    
    if (!accessToken) {
      return null;
    }

    // TODO: Add token expiry check if needed
    // For now, we rely on 401 response to trigger refresh
    
    return accessToken;
  }

  /**
   * Clear all tokens (logout)
   */
  async clearTokens() {
    await SecureStorage.clearTokens();
  }
}

export default new TokenManager();
