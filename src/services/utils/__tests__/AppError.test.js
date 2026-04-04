import { AppError, ErrorType } from '../AppError';

describe('AppError', () => {
  it('creates an error with type and message', () => {
    const err = new AppError('Something failed', ErrorType.NETWORK);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
    expect(err.message).toBe('Something failed');
    expect(err.type).toBe(ErrorType.NETWORK);
    expect(err.name).toBe('AppError');
  });

  it('defaults type to UNKNOWN', () => {
    const err = new AppError('oops');
    expect(err.type).toBe(ErrorType.UNKNOWN);
    expect(err.statusCode).toBeNull();
  });

  it('isNetwork() returns true for network errors only', () => {
    const network = new AppError('net', ErrorType.NETWORK);
    const other = new AppError('auth', ErrorType.AUTH);
    expect(network.isNetwork()).toBe(true);
    expect(other.isNetwork()).toBe(false);
  });

  it('isTokenExpired() returns true for TOKEN_EXPIRED', () => {
    const err = new AppError('expired', ErrorType.TOKEN_EXPIRED);
    expect(err.isTokenExpired()).toBe(true);
    expect(err.isNetwork()).toBe(false);
  });

  it('fromAxiosError maps 401 to TOKEN_EXPIRED', () => {
    const axiosErr = { response: { status: 401, data: { message: 'Unauthorized' } }, message: 'Request failed' };
    const err = AppError.fromAxiosError(axiosErr);
    expect(err.type).toBe(ErrorType.TOKEN_EXPIRED);
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe('Unauthorized');
  });

  it('fromAxiosError maps 403 to AUTH', () => {
    const axiosErr = { response: { status: 403, data: {} }, message: 'Forbidden' };
    const err = AppError.fromAxiosError(axiosErr);
    expect(err.type).toBe(ErrorType.AUTH);
  });

  it('fromAxiosError maps 500 to SERVER', () => {
    const axiosErr = { response: { status: 500, data: { message: 'Internal error' } }, message: 'error' };
    const err = AppError.fromAxiosError(axiosErr);
    expect(err.type).toBe(ErrorType.SERVER);
  });

  it('fromAxiosError maps missing response to NETWORK', () => {
    const axiosErr = { message: 'Network Error' };
    const err = AppError.fromAxiosError(axiosErr);
    expect(err.type).toBe(ErrorType.NETWORK);
    expect(err.statusCode).toBeNull();
  });
});
