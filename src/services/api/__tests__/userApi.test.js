import apiClient from '../apiClient';
import userApi from '../userApi';

jest.mock('../apiClient', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('userApi.getCurrentUser', () => {
  it('GETs /api/users/me and returns data', async () => {
    const mockData = { status: 'success', data: { user: { userId: '1', displayName: 'Alice' } } };
    apiClient.get.mockResolvedValue({ data: mockData });
    const result = await userApi.getCurrentUser();
    expect(apiClient.get).toHaveBeenCalledWith('/api/users/me');
    expect(result).toEqual(mockData);
  });
});

describe('userApi.createProfile', () => {
  it('POSTs profile data to /api/users/me', async () => {
    const profile = { displayName: 'Alice', firstName: 'Alice', lastName: 'Smith' };
    const mockData = { status: 'success', data: { user: profile } };
    apiClient.post.mockResolvedValue({ data: mockData });
    const result = await userApi.createProfile(profile);
    expect(apiClient.post).toHaveBeenCalledWith('/api/users/me', profile);
    expect(result).toEqual(mockData);
  });
});

describe('userApi.updateProfile', () => {
  it('PUTs to /api/users/me', async () => {
    const update = { displayName: 'NewName' };
    apiClient.put.mockResolvedValue({ data: { status: 'success' } });
    await userApi.updateProfile(update);
    expect(apiClient.put).toHaveBeenCalledWith('/api/users/me', update);
  });
});

describe('userApi.checkUsernameAvailability', () => {
  it('GETs the availability endpoint', async () => {
    apiClient.get.mockResolvedValue({ data: { available: true } });
    await userApi.checkUsernameAvailability('alice');
    expect(apiClient.get).toHaveBeenCalledWith('/api/users/username/alice/availability');
  });
});

describe('userApi.deleteAccount', () => {
  it('DELETEs /api/users/me', async () => {
    apiClient.delete.mockResolvedValue({ data: { status: 'success' } });
    await userApi.deleteAccount();
    expect(apiClient.delete).toHaveBeenCalledWith('/api/users/me');
  });

  it('propagates errors', async () => {
    apiClient.delete.mockRejectedValue(new Error('Server error'));
    await expect(userApi.deleteAccount()).rejects.toThrow('Server error');
  });
});
