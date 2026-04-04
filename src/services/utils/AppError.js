export const ErrorType = {
  NETWORK: 'NETWORK_ERROR',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  AUTH: 'AUTH_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION: 'VALIDATION_ERROR',
  SERVER: 'SERVER_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR',
};

export class AppError extends Error {
  constructor(message, type = ErrorType.UNKNOWN, statusCode = null, originalError = null) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.statusCode = statusCode;
    this.originalError = originalError;
  }

  static fromAxiosError(error) {
    if (!error.response) {
      // Network error
      return new AppError(
        'Network error - please check your connection',
        ErrorType.NETWORK,
        null,
        error
      );
    }
    const status = error.response.status;
    const message = error.response.data?.message || error.message;
    if (status === 401) return new AppError(message, ErrorType.TOKEN_EXPIRED, status, error);
    if (status === 403) return new AppError(message, ErrorType.AUTH, status, error);
    if (status === 404) return new AppError(message, ErrorType.NOT_FOUND, status, error);
    if (status === 422) return new AppError(message, ErrorType.VALIDATION, status, error);
    if (status >= 500) return new AppError(message, ErrorType.SERVER, status, error);
    return new AppError(message, ErrorType.UNKNOWN, status, error);
  }

  isNetwork() { return this.type === ErrorType.NETWORK; }
  isTokenExpired() { return this.type === ErrorType.TOKEN_EXPIRED; }
  isAuth() { return this.type === ErrorType.AUTH; }
}

export default AppError;
