/**
 * App Configuration
 * 
 * Centralized configuration for API endpoints, OAuth, and app settings.
 * Easy to modify for different environments.
 */

// API Configuration
export const API_BASE_URL = 'http://localhost:3050';

// Cognito OAuth Configuration
export const COGNITO_CONFIG = {
  domain: 'magic-board-dev-auth.auth.us-east-1.amazoncognito.com',
  userPoolId: 'us-east-1_4CSKmyoGw',
  clientId: '738um5t7qmnne5p6gumi6149ua',
  redirectUri: 'mbtraining://auth',
  scopes: ['openid', 'email', 'profile'],
  responseType: 'code',
};

// App Settings
export const APP_CONFIG = {
  appName: 'Magic Board Training',
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
  APP_CONFIG,
  FEATURES,
};
