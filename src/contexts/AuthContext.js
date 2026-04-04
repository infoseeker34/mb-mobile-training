/**
 * Authentication Context
 *
 * Manages authentication state and provides auth methods to the app.
 */

import React, { createContext, useState, useEffect, useContext } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { COGNITO_CONFIG } from '../constants/Config';
import SecureStorage from '../services/storage/SecureStorage';
import authApi from '../services/api/authApi';
import userApi from '../services/api/userApi';
import authEventBus from '../services/utils/authEventBus';
import logger from '../services/utils/logger';

WebBrowser.maybeCompleteAuthSession();

const AuthContext = createContext({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
  checkAuthStatus: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const discovery = {
    authorizationEndpoint: `https://${COGNITO_CONFIG.domain}/oauth2/authorize`,
    tokenEndpoint: `https://${COGNITO_CONFIG.domain}/oauth2/token`,
    revocationEndpoint: `https://${COGNITO_CONFIG.domain}/oauth2/revoke`,
  };

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: COGNITO_CONFIG.clientId,
      scopes: COGNITO_CONFIG.scopes,
      redirectUri: COGNITO_CONFIG.redirectUri,
      responseType: COGNITO_CONFIG.responseType,
      usePKCE: true,
    },
    discovery
  );

  useEffect(() => {
    if (response?.type === 'success') {
      handleOAuthSuccess(response);
    } else if (response?.type === 'error') {
      logger.error('OAuth error:', response.error);
      setIsLoading(false);
    }
  }, [response]);

  // Subscribe to logout events from apiClient (token refresh failures)
  useEffect(() => {
    const unsubscribe = authEventBus.on('logout', logout);
    return unsubscribe;
  }, []);

  const decodeJWT = (token) => {
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
  };

  const handleOAuthSuccess = async (authResponse) => {
    try {
      const { code } = authResponse.params;
      const tokenResponse = await AuthSession.exchangeCodeAsync(
        {
          clientId: COGNITO_CONFIG.clientId,
          code,
          redirectUri: COGNITO_CONFIG.redirectUri,
          extraParams: { code_verifier: request.codeVerifier },
        },
        discovery
      );

      const { accessToken, refreshToken, idToken } = tokenResponse;
      const idTokenPayload = idToken ? decodeJWT(idToken) : null;

      await SecureStorage.saveTokens(accessToken, refreshToken, idToken);
      await validateAndLoadUser(idTokenPayload);
    } catch (error) {
      logger.error('Error exchanging code for tokens:', error.message);
      setIsLoading(false);
    }
  };

  const validateAndLoadUser = async (idTokenPayload = null) => {
    try {
      const validationResponse = await authApi.validateToken();

      if (validationResponse.status === 'success' && validationResponse.data.valid) {
        const userData = validationResponse.data.user;

        if (idTokenPayload) {
          userData.email = idTokenPayload.email || userData.email;
          userData.username = idTokenPayload['cognito:username'] || idTokenPayload.username || userData.username;
        }

        await SecureStorage.saveUserId(userData.userId);

        try {
          const profileResponse = await userApi.getCurrentUser();
          setUser(profileResponse.data.user);
        } catch (profileError) {
          // First-time user - profile doesn't exist yet
          setUser(userData);
        }

        setIsAuthenticated(true);
      } else {
        await performLogout();
      }
    } catch (error) {
      logger.warn('Token validation failed, attempting refresh...');
      try {
        // Use tokenManager's refresh (has the mutex)
        const SecureStore = await import('../services/storage/SecureStorage');
        const refreshToken = await SecureStore.default.getRefreshToken();
        if (refreshToken) {
          const refreshResponse = await authApi.refreshToken(refreshToken);
          if (refreshResponse.status === 'success' && refreshResponse.data.tokens) {
            const { accessToken, idToken } = refreshResponse.data.tokens;
            await SecureStorage.saveTokens(accessToken, refreshToken, idToken);
            const newIdTokenPayload = idToken ? decodeJWT(idToken) : null;
            await validateAndLoadUser(newIdTokenPayload);
            return;
          }
        }
      } catch (refreshError) {
        logger.error('Token refresh failed:', refreshError.message);
      }
      await SecureStorage.clearTokens();
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const checkAuthStatus = async () => {
    try {
      const accessToken = await SecureStorage.getAccessToken();
      if (accessToken) {
        await validateAndLoadUser();
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      logger.error('Error checking auth status:', error.message);
      await SecureStorage.clearTokens();
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  const login = async () => {
    try {
      await promptAsync();
    } catch (error) {
      logger.error('Error during login:', error.message);
    }
  };

  const performLogout = async () => {
    await SecureStorage.clearTokens();
    setUser(null);
    setIsAuthenticated(false);
  };

  const logout = async () => {
    try {
      await performLogout();
    } catch (error) {
      logger.error('Error during logout:', error.message);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const value = { user, isLoading, isAuthenticated, login, logout, checkAuthStatus };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
