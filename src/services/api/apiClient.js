/**
 * API Client
 *
 * Axios instance with interceptors for authentication and error handling.
 */

import axios from 'axios';
import { API_BASE_URL, APP_CONFIG } from '../../constants/Config';
import tokenManager from '../utils/tokenManager';
import authEventBus from '../utils/authEventBus';
import logger from '../utils/logger';

if (!__DEV__ && API_BASE_URL.startsWith('http://')) {
  throw new Error('API_BASE_URL must use HTTPS in production');
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: APP_CONFIG.apiTimeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: add auth token only (no PII headers)
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await tokenManager.getValidAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      logger.warn('Could not attach auth token to request:', error.message);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 with token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (tokenManager.isRefreshing) {
        return new Promise((resolve, reject) => {
          tokenManager.subscribeTokenRefresh((token) => {
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(originalRequest));
            } else {
              reject(error);
            }
          });
        });
      }

      tokenManager.isRefreshing = true;

      try {
        const newToken = await tokenManager.refreshAccessToken();
        tokenManager.isRefreshing = false;
        tokenManager.onTokenRefreshed(newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        tokenManager.isRefreshing = false;
        tokenManager.onTokenRefreshed(null);
        await tokenManager.clearTokens();
        authEventBus.emit('logout');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
