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

// Enable web browser to dismiss on iOS
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

  // Configure OAuth discovery
  const discovery = {
    authorizationEndpoint: `https://${COGNITO_CONFIG.domain}/oauth2/authorize`,
    tokenEndpoint: `https://${COGNITO_CONFIG.domain}/oauth2/token`,
    revocationEndpoint: `https://${COGNITO_CONFIG.domain}/oauth2/revoke`,
  };

  // Configure auth request
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

  // Handle OAuth response
  useEffect(() => {
    if (response?.type === 'success') {
      handleOAuthSuccess(response);
    } else if (response?.type === 'error') {
      console.error('OAuth error:', response.error);
      setIsLoading(false);
    }
  }, [response]);

  // Decode JWT token (base64)
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
      console.error('Error decoding JWT:', error);
      return null;
    }
  };

  // Handle successful OAuth response
  const handleOAuthSuccess = async (authResponse) => {
    try {
      const { code } = authResponse.params;

      // Exchange code for tokens
      const tokenResponse = await AuthSession.exchangeCodeAsync(
        {
          clientId: COGNITO_CONFIG.clientId,
          code,
          redirectUri: COGNITO_CONFIG.redirectUri,
          extraParams: {
            code_verifier: request.codeVerifier,
          },
        },
        discovery
      );

      const { accessToken, refreshToken, idToken } = tokenResponse;

      // Decode ID token to get user info (email, username)
      const idTokenPayload = decodeJWT(idToken);
      console.log('ID Token payload:', idTokenPayload);

      // Save tokens
      await SecureStorage.saveTokens(accessToken, refreshToken, idToken);

      // Validate token and get user info
      await validateAndLoadUser(idTokenPayload);
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      setIsLoading(false);
    }
  };

  // Validate token and load user data
  const validateAndLoadUser = async (idTokenPayload = null) => {
    try {
      // Validate token
      const validationResponse = await authApi.validateToken();
      
      if (validationResponse.status === 'success' && validationResponse.data.valid) {
        const userData = validationResponse.data.user;
        
        // Merge with ID token data if available (contains email, username)
        if (idTokenPayload) {
          userData.email = idTokenPayload.email || userData.email;
          userData.username = idTokenPayload['cognito:username'] || idTokenPayload.username || userData.username;
        }
        
        console.log('User data after merge:', userData);
        
        // Save user ID
        await SecureStorage.saveUserId(userData.userId);
        
        // Try to get full profile
        try {
          const profileResponse = await userApi.getCurrentUser();
          console.log('Fetched full profile:', profileResponse.data.user);
          setUser(profileResponse.data.user);
        } catch (profileError) {
          // Profile doesn't exist yet (first-time user)
          // Set basic user data from validation
          console.log('Profile fetch failed, using basic user data:', profileError.message);
          setUser(userData);
        }
        
        setIsAuthenticated(true);
      } else {
        await logout();
      }
    } catch (error) {
      console.error('Error validating token:', error);
      
      // Token is invalid or expired - try to refresh it
      console.log('Token validation failed, attempting refresh...');
      try {
        const refreshToken = await SecureStorage.getRefreshToken();
        if (refreshToken) {
          const refreshResponse = await authApi.refreshToken(refreshToken);
          
          if (refreshResponse.status === 'success' && refreshResponse.data.tokens) {
            console.log('Token refresh successful');
            const { accessToken, idToken } = refreshResponse.data.tokens;
            
            // Save new tokens (keep existing refresh token)
            await SecureStorage.saveTokens(accessToken, refreshToken, idToken);
            
            // Retry validation with new token
            const newIdTokenPayload = idToken ? decodeJWT(idToken) : null;
            await validateAndLoadUser(newIdTokenPayload);
            return;
          }
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }
      
      // Refresh failed - clear everything and require re-login
      console.log('Token refresh failed, clearing auth state');
      await SecureStorage.clearTokens();
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user is already authenticated
  const checkAuthStatus = async () => {
    try {
      const accessToken = await SecureStorage.getAccessToken();
      
      if (accessToken) {
        console.log('Found stored access token, validating...');
        await validateAndLoadUser();
      } else {
        console.log('No stored access token found');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      // Clear any invalid tokens
      await SecureStorage.clearTokens();
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  // Login function
  const login = async () => {
    try {
      await promptAsync();
    } catch (error) {
      console.error('Error during login:', error);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await SecureStorage.clearTokens();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // Set up global logout event listener
  useEffect(() => {
    global.authEventEmitter = {
      emit: (event) => {
        if (event === 'logout') {
          logout();
        }
      },
    };

    return () => {
      global.authEventEmitter = null;
    };
  }, []);

  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
