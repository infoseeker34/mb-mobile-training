import * as SecureStore from 'expo-secure-store';
import { AppError, ErrorType } from '../AppError';

// We need to reset the tokenManager singleton between tests
let tokenManager;

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  tokenManager = require('../tokenManager').default;
});

describe('TokenManager.isTokenExpired', () => {
  const makeToken = (expOffsetSeconds) => {
    const exp = Math.floor(Date.now() / 1000) + expOffsetSeconds;
    const payload = Buffer.from(JSON.stringify({ exp, sub: 'user123' })).toString('base64');
    return `header.${payload}.signature`;
  };

  it('returns false for a token with plenty of time left', () => {
    const token = makeToken(3600); // expires in 1 hour
    expect(tokenManager.isTokenExpired(token)).toBe(false);
  });

  it('returns true for an already-expired token', () => {
    const token = makeToken(-100); // expired 100s ago
    expect(tokenManager.isTokenExpired(token)).toBe(true);
  });

  it('returns true for a token expiring within the buffer window', () => {
    const token = makeToken(30); // expires in 30s, buffer is 60s
    expect(tokenManager.isTokenExpired(token, 60)).toBe(true);
  });

  it('returns true for a malformed token', () => {
    expect(tokenManager.isTokenExpired('not.a.token')).toBe(true);
  });

  it('returns true for a token payload without exp', () => {
    const payload = Buffer.from(JSON.stringify({ sub: 'user123' })).toString('base64');
    const token = `header.${payload}.sig`;
    expect(tokenManager.isTokenExpired(token)).toBe(true);
  });
});

describe('TokenManager.getValidAccessToken', () => {
  it('returns null when no access token in storage', async () => {
    SecureStore.getItemAsync.mockResolvedValue(null);
    const result = await tokenManager.getValidAccessToken();
    expect(result).toBeNull();
  });

  it('returns token directly when not expired', async () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const payload = Buffer.from(JSON.stringify({ exp })).toString('base64');
    const validToken = `h.${payload}.s`;
    SecureStore.getItemAsync.mockResolvedValue(validToken);
    const result = await tokenManager.getValidAccessToken();
    expect(result).toBe(validToken);
  });
});

describe('TokenManager.refreshAccessToken', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    delete global.fetch;
  });

  it('throws AppError(AUTH) when no refresh token', async () => {
    SecureStore.getItemAsync.mockResolvedValue(null);
    await expect(tokenManager.refreshAccessToken()).rejects.toMatchObject({
      type: ErrorType.AUTH,
    });
  });

  it('returns new access token on successful refresh', async () => {
    SecureStore.getItemAsync.mockResolvedValue('refresh_token_abc');
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        data: { accessToken: 'new_access', idToken: 'new_id' },
      }),
    });
    const result = await tokenManager.refreshAccessToken();
    expect(result).toBe('new_access');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'access_token',
      'new_access'
    );
  });

  it('throws AppError(TOKEN_EXPIRED) and clears tokens on 401 response', async () => {
    SecureStore.getItemAsync.mockResolvedValue('refresh_token');
    global.fetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({}),
    });
    await expect(tokenManager.refreshAccessToken()).rejects.toMatchObject({
      type: ErrorType.TOKEN_EXPIRED,
      statusCode: 401,
    });
    expect(SecureStore.deleteItemAsync).toHaveBeenCalled();
  });

  it('throws AppError(NETWORK) on fetch failure', async () => {
    SecureStore.getItemAsync.mockResolvedValue('refresh_token');
    global.fetch.mockRejectedValue(new Error('Network request failed'));
    await expect(tokenManager.refreshAccessToken()).rejects.toMatchObject({
      type: ErrorType.NETWORK,
    });
  });

  it('throws AppError(SERVER) on invalid response shape', async () => {
    SecureStore.getItemAsync.mockResolvedValue('refresh_token');
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: {} }), // missing accessToken
    });
    await expect(tokenManager.refreshAccessToken()).rejects.toMatchObject({
      type: ErrorType.SERVER,
    });
  });
});
