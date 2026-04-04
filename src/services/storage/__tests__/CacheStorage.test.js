import AsyncStorage from '@react-native-async-storage/async-storage';
import CacheStorage from '../CacheStorage';

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('CacheStorage.set', () => {
  it('stores data with a timestamp under a prefixed key', async () => {
    await CacheStorage.set('myKey', { foo: 'bar' });
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'cache_myKey',
      expect.stringContaining('"foo":"bar"')
    );
    const stored = JSON.parse(AsyncStorage.setItem.mock.calls[0][1]);
    expect(stored.data).toEqual({ foo: 'bar' });
    expect(typeof stored.timestamp).toBe('number');
  });
});

describe('CacheStorage.get', () => {
  it('returns data for non-expired cache entries', async () => {
    const cacheItem = JSON.stringify({ data: { val: 1 }, timestamp: Date.now() });
    AsyncStorage.getItem.mockResolvedValue(cacheItem);
    const result = await CacheStorage.get('myKey');
    expect(result).toEqual({ val: 1 });
  });

  it('returns null and removes key for expired entries', async () => {
    const fiveMinutesAgo = Date.now() - 6 * 60 * 1000; // 6 minutes ago
    const cacheItem = JSON.stringify({ data: { val: 1 }, timestamp: fiveMinutesAgo });
    AsyncStorage.getItem.mockResolvedValue(cacheItem);
    const result = await CacheStorage.get('myKey');
    expect(result).toBeNull();
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('cache_myKey');
  });

  it('returns null for missing keys', async () => {
    AsyncStorage.getItem.mockResolvedValue(null);
    const result = await CacheStorage.get('missing');
    expect(result).toBeNull();
  });
});

describe('CacheStorage.clearAll', () => {
  it('removes only cache-prefixed keys', async () => {
    AsyncStorage.getAllKeys.mockResolvedValue([
      'cache_plans',
      'cache_user',
      'some_other_key',
    ]);
    await CacheStorage.clearAll();
    expect(AsyncStorage.multiRemove).toHaveBeenCalledWith(['cache_plans', 'cache_user']);
  });
});

describe('CacheStorage.getWithFallback', () => {
  it('returns fresh data and caches it on success', async () => {
    const fetchFn = jest.fn().mockResolvedValue({ fresh: true });
    const result = await CacheStorage.getWithFallback('key', fetchFn);
    expect(result).toEqual({ fresh: true });
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });

  it('falls back to cache when fetch throws', async () => {
    const cacheItem = JSON.stringify({ data: { cached: true }, timestamp: Date.now() });
    AsyncStorage.getItem.mockResolvedValue(cacheItem);
    const fetchFn = jest.fn().mockRejectedValue(new Error('Network error'));
    const result = await CacheStorage.getWithFallback('key', fetchFn);
    expect(result).toEqual({ cached: true });
  });
});
