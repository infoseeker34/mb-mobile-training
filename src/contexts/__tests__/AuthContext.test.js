import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import * as AuthSession from 'expo-auth-session';
import { AuthProvider, useAuth } from '../AuthContext';

// Mock API modules
jest.mock('../../services/api/authApi', () => ({
  validateToken: jest.fn(),
  refreshToken: jest.fn(),
}));
jest.mock('../../services/api/userApi', () => ({
  getCurrentUser: jest.fn(),
  createProfile: jest.fn(),
}));

const authApi = require('../../services/api/authApi');
const userApi = require('../../services/api/userApi');

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

const mockValidToken = () => {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const payload = Buffer.from(JSON.stringify({ exp, sub: 'u1', email: 'a@b.com' })).toString('base64');
  return `h.${payload}.s`;
};

beforeEach(() => {
  jest.clearAllMocks();
  SecureStore.getItemAsync.mockResolvedValue(null);
  SecureStore.setItemAsync.mockResolvedValue(undefined);
  SecureStore.deleteItemAsync.mockResolvedValue(undefined);
});

describe('AuthContext initial state', () => {
  it('starts with isLoading:true and isAuthenticated:false', () => {
    authApi.validateToken.mockReturnValue(new Promise(() => {})); // never resolves
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });
});

describe('checkAuthStatus — no stored token', () => {
  it('sets isLoading:false and stays unauthenticated', async () => {
    SecureStore.getItemAsync.mockResolvedValue(null);
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });
});

describe('checkAuthStatus — valid stored token', () => {
  it('validates token and sets user when profile exists', async () => {
    SecureStore.getItemAsync.mockResolvedValue(mockValidToken());
    authApi.validateToken.mockResolvedValue({
      status: 'success',
      data: { valid: true, user: { userId: 'u1', email: 'a@b.com' } },
    });
    userApi.getCurrentUser.mockResolvedValue({
      data: { user: { userId: 'u1', displayName: 'Alice', email: 'a@b.com' } },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.displayName).toBe('Alice');
  });

  it('sets basic userData when profile 404s (first-time user)', async () => {
    SecureStore.getItemAsync.mockResolvedValue(mockValidToken());
    authApi.validateToken.mockResolvedValue({
      status: 'success',
      data: { valid: true, user: { userId: 'u1', email: 'a@b.com' } },
    });
    userApi.getCurrentUser.mockRejectedValue({ response: { status: 404 }, message: 'Not found' });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.userId).toBe('u1');
  });
});

describe('checkAuthStatus — expired token, refresh fails', () => {
  it('clears auth state when refresh fails', async () => {
    SecureStore.getItemAsync.mockResolvedValue(mockValidToken());
    authApi.validateToken.mockRejectedValue(new Error('Token expired'));
    // getRefreshToken returns null so refresh can't proceed
    SecureStore.getItemAsync
      .mockResolvedValueOnce(mockValidToken()) // getAccessToken
      .mockResolvedValueOnce(null);            // getRefreshToken

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });
});

describe('logout', () => {
  it('clears user and authentication state', async () => {
    SecureStore.getItemAsync.mockResolvedValue(mockValidToken());
    authApi.validateToken.mockResolvedValue({
      status: 'success',
      data: { valid: true, user: { userId: 'u1', email: 'a@b.com' } },
    });
    userApi.getCurrentUser.mockResolvedValue({
      data: { user: { userId: 'u1', displayName: 'Alice' } },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalled();
  });
});

describe('login', () => {
  it('calls promptAsync', async () => {
    const promptAsync = jest.fn().mockResolvedValue({ type: 'cancel' });
    AuthSession.useAuthRequest.mockReturnValue([{}, null, promptAsync]);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.login();
    });
    expect(promptAsync).toHaveBeenCalled();
  });
});
