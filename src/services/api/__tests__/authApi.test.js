import apiClient from '../apiClient';
import authApi from '../authApi';

jest.mock('../apiClient', () => ({
  post: jest.fn(),
  get: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('authApi.validateToken', () => {
  it('POSTs to /api/auth/validate and returns data', async () => {
    const mockData = { status: 'success', data: { valid: true, user: { userId: '123' } } };
    apiClient.post.mockResolvedValue({ data: mockData });
    const result = await authApi.validateToken();
    expect(apiClient.post).toHaveBeenCalledWith('/api/auth/validate');
    expect(result).toEqual(mockData);
  });

  it('propagates errors from apiClient', async () => {
    apiClient.post.mockRejectedValue(new Error('Network error'));
    await expect(authApi.validateToken()).rejects.toThrow('Network error');
  });
});

describe('authApi.refreshToken', () => {
  it('POSTs to /api/auth/refresh with refreshToken in body', async () => {
    const mockData = { status: 'success', data: { tokens: { accessToken: 'new' } } };
    apiClient.post.mockResolvedValue({ data: mockData });
    const result = await authApi.refreshToken('my_refresh_token');
    expect(apiClient.post).toHaveBeenCalledWith('/api/auth/refresh', {
      refreshToken: 'my_refresh_token',
    });
    expect(result).toEqual(mockData);
  });
});
