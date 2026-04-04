import * as SecureStore from 'expo-secure-store';
import SecureStorage from '../SecureStorage';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('SecureStorage.saveTokens', () => {
  it('saves access, refresh, and id tokens', async () => {
    await SecureStorage.saveTokens('access', 'refresh', 'id');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('access_token', 'access');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('refresh_token', 'refresh');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('id_token', 'id');
    expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(3);
  });

  it('skips id token when not provided', async () => {
    await SecureStorage.saveTokens('access', 'refresh', null);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('access_token', 'access');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('refresh_token', 'refresh');
    expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(2);
  });
});

describe('SecureStorage.getTokens', () => {
  it('returns all three tokens', async () => {
    SecureStore.getItemAsync
      .mockResolvedValueOnce('access')
      .mockResolvedValueOnce('refresh')
      .mockResolvedValueOnce('id');
    const tokens = await SecureStorage.getTokens();
    expect(tokens).toEqual({ accessToken: 'access', refreshToken: 'refresh', idToken: 'id' });
  });

  it('returns nulls when SecureStore throws', async () => {
    SecureStore.getItemAsync.mockRejectedValue(new Error('Keychain error'));
    const tokens = await SecureStorage.getTokens();
    expect(tokens).toEqual({ accessToken: null, refreshToken: null, idToken: null });
  });
});

describe('SecureStorage.getAccessToken', () => {
  it('returns the stored access token', async () => {
    SecureStore.getItemAsync.mockResolvedValue('my_access_token');
    const token = await SecureStorage.getAccessToken();
    expect(token).toBe('my_access_token');
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('access_token');
  });

  it('returns null on error', async () => {
    SecureStore.getItemAsync.mockRejectedValue(new Error('error'));
    const token = await SecureStorage.getAccessToken();
    expect(token).toBeNull();
  });
});

describe('SecureStorage.getRefreshToken', () => {
  it('returns the stored refresh token', async () => {
    SecureStore.getItemAsync.mockResolvedValue('my_refresh');
    const token = await SecureStorage.getRefreshToken();
    expect(token).toBe('my_refresh');
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('refresh_token');
  });
});

describe('SecureStorage.clearTokens', () => {
  it('deletes all four keys', async () => {
    await SecureStorage.clearTokens();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('access_token');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('refresh_token');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('id_token');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('user_id');
  });
});

describe('SecureStorage.saveUserId / getUserId', () => {
  it('saves and retrieves user id', async () => {
    await SecureStorage.saveUserId('user_abc');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('user_id', 'user_abc');
    SecureStore.getItemAsync.mockResolvedValue('user_abc');
    const id = await SecureStorage.getUserId();
    expect(id).toBe('user_abc');
  });
});
