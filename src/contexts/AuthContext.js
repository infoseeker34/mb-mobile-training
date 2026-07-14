/**
 * Authentication Context
 * 
 * Manages authentication state and provides auth methods to the app.
 */

import React, { createContext, useState, useEffect, useContext } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { COGNITO_CONFIG } from '../constants/Config';
import SecureStorage from '../services/storage/SecureStorage';
import authApi from '../services/api/authApi';
import userApi from '../services/api/userApi';

// Enable web browser to dismiss on iOS
WebBrowser.maybeCompleteAuthSession();

const ATHLETE_ONBOARDING_SKIPPED_KEY_PREFIX = 'athlete_onboarding_skipped_';

const AuthContext = createContext({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  athleteOnboardingSkipped: false,
  login: async () => {},
  logout: async () => {},
  checkAuthStatus: async () => {},
  skipAthleteOnboarding: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [athleteOnboardingSkipped, setAthleteOnboardingSkipped] = useState(false);

  // Re-check the skip flag whenever the signed-in user changes, so
  // AddAthleteScreen's "skip for now" persists across app launches without
  // needing a backend round-trip for what's purely a local UX preference.
  useEffect(() => {
    if (!user?.userId) {
      setAthleteOnboardingSkipped(false);
      return;
    }

    AsyncStorage.getItem(`${ATHLETE_ONBOARDING_SKIPPED_KEY_PREFIX}${user.userId}`)
      .then((value) => setAthleteOnboardingSkipped(value === 'true'))
      .catch(() => setAthleteOnboardingSkipped(false));
  }, [user?.userId]);

  const skipAthleteOnboarding = async () => {
    if (!user?.userId) return;
    try {
      await AsyncStorage.setItem(`${ATHLETE_ONBOARDING_SKIPPED_KEY_PREFIX}${user.userId}`, 'true');
    } catch (error) {
      console.error('Error persisting athlete onboarding skip:', error);
    }
    setAthleteOnboardingSkipped(true);
  };

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

  // Handle OAuth response (native: popup/in-app-browser flow)
  useEffect(() => {
    if (response?.type === 'success') {
      handleOAuthSuccess(response);
    } else if (response?.type === 'error') {
      console.error('OAuth error:', response.error);
      setIsLoading(false);
    }
  }, [response]);

  // Handle OAuth callback on web. Popups are unreliable across browsers
  // (blocked by default in many, especially outside a same-tick click
  // handler), so web uses a full-page redirect instead: login() navigates
  // the whole tab to Cognito, and this effect picks the `code` back up
  // from the URL once Cognito redirects back to this same page.
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code) return;

    // Strip the auth params so a refresh doesn't try to re-exchange the code
    window.history.replaceState(null, '', window.location.pathname);

    const codeVerifier = window.sessionStorage.getItem('pkce_code_verifier');
    window.sessionStorage.removeItem('pkce_code_verifier');

    if (!codeVerifier) {
      console.error('Missing PKCE code verifier for web OAuth callback');
      setIsLoading(false);
      return;
    }

    (async () => {
      try {
        const tokenResponse = await AuthSession.exchangeCodeAsync(
          {
            clientId: COGNITO_CONFIG.clientId,
            code,
            redirectUri: COGNITO_CONFIG.redirectUri,
            extraParams: { code_verifier: codeVerifier },
          },
          discovery
        );

        const { accessToken, refreshToken, idToken } = tokenResponse;
        const idTokenPayload = decodeJWT(idToken);

        await SecureStorage.saveTokens(accessToken, refreshToken, idToken);
        await validateAndLoadUser(idTokenPayload);
      } catch (error) {
        console.error('Error exchanging code for tokens (web):', error);
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      if (Platform.OS === 'web') {
        if (!request?.url || !request.codeVerifier) {
          console.error('Auth request is not ready yet');
          return;
        }
        // Full-page redirect instead of a popup - see the callback effect above.
        window.sessionStorage.setItem('pkce_code_verifier', request.codeVerifier);
        window.location.href = request.url;
        return;
      }

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
    athleteOnboardingSkipped,
    login,
    logout,
    checkAuthStatus,
    skipAthleteOnboarding,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
