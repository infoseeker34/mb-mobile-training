/**
 * App Configuration
 *
 * Centralized configuration for API endpoints, OAuth, and app settings.
 * Easy to modify for different environments.
 */

import { Platform } from 'react-native';

// API Configuration
export const API_BASE_URL = 'http://localhost:3050';

// Cognito OAuth Configuration
// Web has no custom URL scheme, so the hosted UI must redirect back to an
// http(s) page instead of `mbtraining://auth`. This URL must be registered
// as an allowed callback URL on the Cognito app client (see
// update-cognito-callbacks.sh) and match the port the web preview runs on.
export const COGNITO_CONFIG = {
  domain: 'magic-board-dev-auth.auth.us-east-1.amazoncognito.com',
  userPoolId: 'us-east-1_4CSKmyoGw',
  clientId: '738um5t7qmnne5p6gumi6149ua',
  redirectUri: Platform.OS === 'web' ? 'http://localhost:8081/auth/callback' : 'mbtraining://auth',
  scopes: ['openid', 'email', 'profile'],
  responseType: 'code',
};

// Consent
// Bump this string whenever the Terms of Service / Privacy Policy text
// changes - stored alongside each user's terms_accepted_at so re-consent
// can be required after a material policy update. Placeholder copy only;
// ConsentScreen.js's text must be reviewed by counsel before real launch.
export const POLICY_VERSION = '2026-07-placeholder';

// App Settings
export const APP_CONFIG = {
  appName: 'Steamers Crew Training',
  version: '1.0.0',
  
  // Pagination
  defaultPageSize: 20,
  maxPageSize: 100,
  
  // Cache
  cacheExpiryMinutes: 5,
  
  // Session
  sessionAutoSaveInterval: 30000, // 30 seconds
  
  // Timeouts
  apiTimeout: 10000, // 10 seconds
  
  // Rate Limiting
  maxRetries: 3,
  retryDelay: 1000, // 1 second
};

// Feature Flags (for gradual rollout)
export const FEATURES = {
  offlineMode: true,
  pushNotifications: false, // Enable in Phase 5
  analytics: false, // Enable in Phase 5
  deepLinking: false, // Enable in Phase 5
};

export default {
  API_BASE_URL,
  COGNITO_CONFIG,
  POLICY_VERSION,
  APP_CONFIG,
  FEATURES,
};
