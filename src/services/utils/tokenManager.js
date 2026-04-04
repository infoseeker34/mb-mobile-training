/**
 * Token Manager
 *
 * Handles token refresh logic and token lifecycle management.
 */

import SecureStorage from '../storage/SecureStorage';
import { API_BASE_URL } from '../../constants/Config';
import { AppError, ErrorType } from './AppError';
import logger from './logger';

class TokenManager {
  constructor() {
    this.isRefreshing = false;
    this.refreshSubscribers = [];
  }

  subscribeTokenRefresh(callback) {
    this.refreshSubscribers.push(callback);
  }

  onTokenRefreshed(token) {
    this.refreshSubscribers.forEach(callback => callback(token));
    this.refreshSubscribers = [];
  }

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
      return null;
    }
  }

  isTokenExpired(token, bufferSeconds = 60) {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) return true;
    const expiryTime = decoded.exp * 1000;
    const bufferTime = bufferSeconds * 1000;
    return Date.now() >= (expiryTime - bufferTime);
  }

  async refreshAccessToken() {
    const refreshToken = await SecureStorage.getRefreshToken();
    if (!refreshToken) {
      throw new AppError('No refresh token available', ErrorType.AUTH);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.status === 401 || response.status === 403) {
        await SecureStorage.clearTokens();
        throw new AppError('Session expired - please log in again', ErrorType.TOKEN_EXPIRED, response.status);
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new AppError(data.message || 'Token refresh failed', ErrorType.SERVER, response.status);
      }

      const data = await response.json();
      if (!data.data?.accessToken || !data.data?.idToken) {
        throw new AppError('Invalid token refresh response', ErrorType.SERVER);
      }

      const { accessToken, idToken } = data.data;
      await SecureStorage.saveTokens(accessToken, refreshToken, idToken);
      logger.info('Token refresh successful');
      return accessToken;
    } catch (error) {
      if (error instanceof AppError) throw error;
      // Network/fetch errors
      throw new AppError('Network error - please check your connection', ErrorType.NETWORK, null, error);
    }
  }

  async getValidAccessToken() {
    const accessToken = await SecureStorage.getAccessToken();
    if (!accessToken) return null;
    if (this.isTokenExpired(accessToken, 60)) {
      try {
        return await this.refreshAccessToken();
      } catch (error) {
        logger.error('Failed to refresh expired token:', error.message);
        return null;
      }
    }
    return accessToken;
  }

  async clearTokens() {
    await SecureStorage.clearTokens();
  }
}

export default new TokenManager();
