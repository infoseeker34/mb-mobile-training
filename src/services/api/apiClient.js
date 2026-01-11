/**
 * API Client
 * 
 * Axios instance with interceptors for authentication and error handling.
 */

import axios from 'axios';
import { API_BASE_URL, APP_CONFIG } from '../../constants/Config';
import tokenManager from '../utils/tokenManager';
import SecureStorage from '../storage/SecureStorage';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: APP_CONFIG.apiTimeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and ID token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const tokens = await SecureStorage.getTokens();
      if (tokens.accessToken) {
        config.headers.Authorization = `Bearer ${tokens.accessToken}`;
      }
      // Also send ID token so backend can extract email
      if (tokens.idToken) {
        config.headers['x-id-token'] = tokens.idToken;
      }
    } catch (error) {
      console.error('Error getting token for request:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle token refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // If already refreshing, wait for it to complete
      if (tokenManager.isRefreshing) {
        return new Promise((resolve) => {
          tokenManager.subscribeTokenRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          });
        });
      }

      tokenManager.isRefreshing = true;

      try {
        const newAccessToken = await tokenManager.refreshAccessToken();
        tokenManager.isRefreshing = false;
        tokenManager.onTokenRefreshed(newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        tokenManager.isRefreshing = false;
        
        // Refresh failed, clear tokens and reject
        await tokenManager.clearTokens();
        
        // Emit logout event (will be handled by AuthContext)
        if (global.authEventEmitter) {
          global.authEventEmitter.emit('logout');
        }
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
