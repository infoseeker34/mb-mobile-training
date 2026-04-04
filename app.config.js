/**
 * Expo Dynamic App Config
 *
 * Reads environment variables at build time via EAS Secrets or local .env files.
 * Never hardcode secrets here — use process.env.* references only.
 */

module.exports = ({ config }) => ({
  ...config,
  name: 'Magic Board Training',
  slug: 'mb-mobile-training',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  splash: {
    resizeMode: 'contain',
    backgroundColor: '#6366f1',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.magicboard.training',
    buildNumber: '1',
    infoPlist: {
      NSMicrophoneUsageDescription:
        'Magic Board Training uses audio playback for training sessions. Microphone access is not used.',
      NSUserNotificationsUsageDescription:
        'Magic Board Training sends notifications to remind you about upcoming training sessions.',
      NSCameraUsageDescription:
        'Magic Board Training may use the camera for profile photos.',
    },
  },
  android: {
    package: 'com.magicboard.training',
    versionCode: 1,
    adaptiveIcon: {
      backgroundColor: '#6366f1',
    },
    permissions: [],
  },
  scheme: 'mbtraining',
  plugins: ['expo-audio', 'expo-secure-store'],
  extra: {
    // API
    apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3050',
    // Cognito OAuth
    cognitoDomain:
      process.env.COGNITO_DOMAIN ||
      'magic-board-dev-auth.auth.us-east-1.amazoncognito.com',
    cognitoUserPoolId:
      process.env.COGNITO_USER_POOL_ID || 'us-east-1_4CSKmyoGw',
    cognitoClientId:
      process.env.COGNITO_CLIENT_ID || '738um5t7qmnne5p6gumi6149ua',
    cognitoRedirectUri: process.env.COGNITO_REDIRECT_URI || 'mbtraining://auth',
    // App environment
    appEnv: process.env.APP_ENV || 'development',
    // Sentry
    sentryDsn: process.env.SENTRY_DSN || '',
  },
});
