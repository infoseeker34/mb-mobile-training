import authEventBus from '../authEventBus';

describe('authEventBus', () => {
  afterEach(() => {
    // Clean up any listeners added during tests
    authEventBus.off('logout', expect.any(Function));
    authEventBus.off('test', expect.any(Function));
  });

  it('calls registered listener when event is emitted', () => {
    const handler = jest.fn();
    authEventBus.on('test', handler);
    authEventBus.emit('test', 'payload');
    expect(handler).toHaveBeenCalledWith('payload');
    authEventBus.off('test', handler);
  });

  it('calls multiple listeners for the same event', () => {
    const h1 = jest.fn();
    const h2 = jest.fn();
    authEventBus.on('test', h1);
    authEventBus.on('test', h2);
    authEventBus.emit('test');
    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).toHaveBeenCalledTimes(1);
    authEventBus.off('test', h1);
    authEventBus.off('test', h2);
  });

  it('does not call listener after off()', () => {
    const handler = jest.fn();
    authEventBus.on('test', handler);
    authEventBus.off('test', handler);
    authEventBus.emit('test');
    expect(handler).not.toHaveBeenCalled();
  });

  it('returns an unsubscribe function from on()', () => {
    const handler = jest.fn();
    const unsub = authEventBus.on('test', handler);
    unsub();
    authEventBus.emit('test');
    expect(handler).not.toHaveBeenCalled();
  });

  it('does not throw when emitting event with no listeners', () => {
    expect(() => authEventBus.emit('nonexistent')).not.toThrow();
  });

  it('emits logout event to registered handlers', () => {
    const logoutHandler = jest.fn();
    const unsub = authEventBus.on('logout', logoutHandler);
    authEventBus.emit('logout');
    expect(logoutHandler).toHaveBeenCalledTimes(1);
    unsub();
  });
});
