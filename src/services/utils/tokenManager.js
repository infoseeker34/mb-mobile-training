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
      console.error('TokenManager: No refresh token available');
      throw new Error('No refresh token available');
    }

    console.log('TokenManager: Attempting to refresh access token...');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('TokenManager: Token refresh failed:', data);
        throw new Error(data.message || 'Token refresh failed');
      }

      if (!data.data?.accessToken || !data.data?.idToken) {
        console.error('TokenManager: Invalid refresh response:', data);
        throw new Error('Invalid token refresh response');
      }

      const { accessToken, idToken } = data.data;

      // Save new tokens (keep the same refresh token)
      await SecureStorage.saveTokens(accessToken, refreshToken, idToken);

      console.log('TokenManager: Token refresh successful');
      return accessToken;
    } catch (error) {
      console.error('TokenManager: Error refreshing token:', error.message);
      
      // Determine if this is a token issue or network issue
      const isNetworkError = error.message?.includes('ENOTFOUND') || 
                            error.message?.includes('ECONNREFUSED') ||
                            error.message?.includes('Network request failed');
      
      const isTokenInvalid = error.message?.includes('invalid') || 
                            error.message?.includes('expired') ||
                            error.message?.includes('Refresh token');
      
      if (isNetworkError) {
        console.warn('TokenManager: Network error during token refresh - tokens not cleared');
        throw new Error('Network error - please check your connection');
      } else if (isTokenInvalid) {
        console.log('TokenManager: Token invalid/expired - clearing tokens and requiring re-login');
        await SecureStorage.clearTokens();
        throw new Error('Session expired - please log in again');
      } else {
        // Unknown error - don't clear tokens, let user retry
        throw error;
      }
    }
  }

  /**
   * Decode JWT token to get expiry time
   */
  decodeToken(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('TokenManager: Error decoding token:', error);
      return null;
    }
  }

  /**
   * Check if token is expired or will expire soon
   */
  isTokenExpired(token, bufferSeconds = 60) {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) {
      return true;
    }
    
    const expiryTime = decoded.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    const bufferTime = bufferSeconds * 1000;
    
    return now >= (expiryTime - bufferTime);
  }

  /**
   * Get valid access token (refresh if expired or expiring soon)
   */
  async getValidAccessToken() {
    const accessToken = await SecureStorage.getAccessToken();
    
    if (!accessToken) {
      console.log('TokenManager: No access token found');
      return null;
    }

    // Check if token is expired or will expire in the next 60 seconds
    if (this.isTokenExpired(accessToken, 60)) {
      console.log('TokenManager: Access token expired or expiring soon, refreshing...');
      try {
        return await this.refreshAccessToken();
      } catch (error) {
        console.error('TokenManager: Failed to refresh expired token:', error);
        return null;
      }
    }
    
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
