/**
 * App Configuration
 *
 * All runtime config is sourced from Expo's `extra` field, which is populated
 * from environment variables at build time via app.config.js.
 * No secrets or environment-specific values should be hardcoded here.
 */

import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

// Validate required config in development
if (__DEV__) {
  const required = ['apiBaseUrl', 'cognitoDomain', 'cognitoClientId'];
  required.forEach((key) => {
    if (!extra[key]) {
      console.warn(`[Config] Missing required config key: ${key}`);
    }
  });
}

export const API_BASE_URL = extra.apiBaseUrl || 'http://localhost:3050';

export const COGNITO_CONFIG = {
  domain: extra.cognitoDomain || '',
  userPoolId: extra.cognitoUserPoolId || '',
  clientId: extra.cognitoClientId || '',
  redirectUri: extra.cognitoRedirectUri || 'mbtraining://auth',
  scopes: ['openid', 'email', 'profile'],
  responseType: 'code',
};

export const APP_CONFIG = {
  appName: 'Magic Board Training',
  version: '1.0.0',
  env: extra.appEnv || 'development',
  sentryDsn: extra.sentryDsn || '',

  // Pagination
  defaultPageSize: 20,
  maxPageSize: 100,

  // Cache
  cacheExpiryMinutes: 5,

  // Session
  sessionAutoSaveInterval: 30000,

  // Timeouts
  apiTimeout: 10000,

  // Rate Limiting
  maxRetries: 3,
  retryDelay: 1000,
};

export const FEATURES = {
  offlineMode: true,
  pushNotifications: false,
  analytics: false,
  deepLinking: false,
};

export default {
  API_BASE_URL,
  COGNITO_CONFIG,
  APP_CONFIG,
  FEATURES,
};
