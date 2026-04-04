/**
 * Jest Setup
 * Mocks all native modules that can't run in a Node.js test environment.
 */

import '@testing-library/jest-native/extend-expect';

// --- expo-secure-store ---
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

// --- @react-native-async-storage/async-storage ---
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// --- expo-auth-session ---
jest.mock('expo-auth-session', () => ({
  useAuthRequest: jest.fn(() => [null, null, jest.fn()]),
  exchangeCodeAsync: jest.fn(),
  ResponseType: { Code: 'code' },
}));

// --- expo-web-browser ---
jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
  openAuthSessionAsync: jest.fn(() => Promise.resolve({ type: 'cancel' })),
}));

// --- expo-constants ---
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      apiBaseUrl: 'http://localhost:3050',
      cognitoDomain: 'test.auth.us-east-1.amazoncognito.com',
      cognitoUserPoolId: 'us-east-1_test',
      cognitoClientId: 'test_client_id',
      cognitoRedirectUri: 'mbtraining://auth',
      appEnv: 'test',
      sentryDsn: '',
    },
  },
}));

// --- react-native-youtube-iframe ---
jest.mock('react-native-youtube-iframe', () => 'YoutubeIframe');

// --- expo-audio ---
jest.mock('expo-audio', () => ({
  useAudioPlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    remove: jest.fn(),
  })),
  AudioQuality: {},
}));

// --- expo-linear-gradient ---
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

// --- @react-native-community/netinfo ---
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true, isInternetReachable: true })),
}));

// --- react-native-webview ---
jest.mock('react-native-webview', () => ({
  WebView: 'WebView',
}));

// --- react-native safe area ---
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: View,
    SafeAreaProvider: ({ children }) => children,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

// Silence specific warnings in tests
const originalWarn = console.warn;
beforeEach(() => {
  console.warn = (...args) => {
    const msg = args[0]?.toString() ?? '';
    if (
      msg.includes('Warning: An update to') ||
      msg.includes('Warning: ReactDOM.render') ||
      msg.includes('[Config] Missing')
    ) return;
    originalWarn(...args);
  };
});
afterEach(() => {
  console.warn = originalWarn;
});
