/**
 * Error handling types and classes for consistent error management
 */

export enum ErrorCode {
  // Database errors
  DATABASE_CONNECTION_FAILED = 'DATABASE_CONNECTION_FAILED',
  DATABASE_QUERY_FAILED = 'DATABASE_QUERY_FAILED',
  DATABASE_TRANSACTION_FAILED = 'DATABASE_TRANSACTION_FAILED',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_SESSION_NAME = 'INVALID_SESSION_NAME',
  INVALID_PLAYER_NAME = 'INVALID_PLAYER_NAME',
  INVALID_PLAYER_COUNT = 'INVALID_PLAYER_COUNT',
  DUPLICATE_PLAYER_NAME = 'DUPLICATE_PLAYER_NAME',
  
  // Business logic errors
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  PLAYER_NOT_FOUND = 'PLAYER_NOT_FOUND',
  SESSION_ALREADY_STARTED = 'SESSION_ALREADY_STARTED',
  SESSION_ALREADY_COMPLETED = 'SESSION_ALREADY_COMPLETED',
  CANNOT_REMOVE_PLAYER = 'CANNOT_REMOVE_PLAYER',
  
  // Cash-out specific errors
  CASH_OUT_EXCEEDS_BUY_INS = 'CASH_OUT_EXCEEDS_BUY_INS',
  SESSION_BALANCE_EXCEEDED = 'SESSION_BALANCE_EXCEEDED',
  ORGANIZER_CONFIRMATION_REQUIRED = 'ORGANIZER_CONFIRMATION_REQUIRED',
  PLAYER_ALREADY_CASHED_OUT = 'PLAYER_ALREADY_CASHED_OUT',
  
  // Session pot validation errors (Story 1.5 - Simplified)
  INSUFFICIENT_SESSION_POT = 'INSUFFICIENT_SESSION_POT',
  SESSION_POT_WOULD_GO_NEGATIVE = 'SESSION_POT_WOULD_GO_NEGATIVE',
  
  // Cleanup service errors
  CLEANUP_INIT_FAILED = 'CLEANUP_INIT_FAILED',
  
  // Export service errors
  EXPORT_INIT_FAILED = 'EXPORT_INIT_FAILED',
  EXPORT_FAILED = 'EXPORT_FAILED',
  INVALID_FORMAT = 'INVALID_FORMAT',
  EXPORT_MARK_FAILED = 'EXPORT_MARK_FAILED',
  
  // Notification service errors
  NOTIFICATION_INIT_FAILED = 'NOTIFICATION_INIT_FAILED',
  
  // General errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export class ServiceError extends Error {
  public readonly code: ErrorCode;
  public readonly details?: Record<string, any>;

  constructor(code: ErrorCode, message: string, details?: Record<string, any>) {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
    this.details = details;
  }

  /**
   * Create a validation error
   */
  static validation(message: string, field?: string): ServiceError {
    return new ServiceError(ErrorCode.VALIDATION_ERROR, message, { field });
  }

  /**
   * Create a not found error
   */
  static notFound(resource: string, id: string): ServiceError {
    return new ServiceError(
      resource === 'session' ? ErrorCode.SESSION_NOT_FOUND : ErrorCode.PLAYER_NOT_FOUND,
      `${resource} with id ${id} not found`,
      { resource, id }
    );
  }

  /**
   * Create a database error
   */
  static database(message: string, query?: string): ServiceError {
    return new ServiceError(ErrorCode.DATABASE_QUERY_FAILED, message, { query });
  }
}