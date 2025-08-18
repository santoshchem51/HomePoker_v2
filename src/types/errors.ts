/**
 * System Error handling types - for true infrastructure/system failures
 * 
 * NOTE: User validation errors have been moved to src/types/validation.ts
 * This file now only contains true system errors that should be exceptions.
 */

export enum ErrorCode {
  // Database/Infrastructure errors (TRUE SYSTEM ERRORS)
  DATABASE_CONNECTION_FAILED = 'DATABASE_CONNECTION_FAILED',
  DATABASE_QUERY_FAILED = 'DATABASE_QUERY_FAILED', 
  DATABASE_TRANSACTION_FAILED = 'DATABASE_TRANSACTION_FAILED',
  DATABASE_INITIALIZATION_FAILED = 'DATABASE_INITIALIZATION_FAILED',
  
  // Resource not found errors (SYSTEM ERRORS)
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  PLAYER_NOT_FOUND = 'PLAYER_NOT_FOUND',
  TRANSACTION_NOT_FOUND = 'TRANSACTION_NOT_FOUND',
  
  // Service initialization errors (SYSTEM ERRORS)
  CLEANUP_INIT_FAILED = 'CLEANUP_INIT_FAILED',
  EXPORT_INIT_FAILED = 'EXPORT_INIT_FAILED',
  NOTIFICATION_INIT_FAILED = 'NOTIFICATION_INIT_FAILED',
  
  // Operation failures (SYSTEM ERRORS)
  EXPORT_FAILED = 'EXPORT_FAILED',
  EXPORT_MARK_FAILED = 'EXPORT_MARK_FAILED',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  UNDO_FAILED = 'UNDO_FAILED',
  
  // Internal consistency errors (SYSTEM ERRORS)
  SESSION_POT_WOULD_GO_NEGATIVE = 'SESSION_POT_WOULD_GO_NEGATIVE',
  INTEGRITY_CHECK_FAILED = 'INTEGRITY_CHECK_FAILED',
  BALANCE_CALCULATION_FAILED = 'BALANCE_CALCULATION_FAILED',
  
  // Configuration/Format errors (SYSTEM ERRORS)
  INVALID_FORMAT = 'INVALID_FORMAT',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  
  // Catch-all system error
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  
  // DEPRECATED - Moving to ValidationCode in validation.ts
  // These remain temporarily for backward compatibility during migration
  VALIDATION_ERROR = 'VALIDATION_ERROR', // @deprecated - use ValidationResult instead
  INSUFFICIENT_SESSION_POT = 'INSUFFICIENT_SESSION_POT', // @deprecated - use ValidationCode
  LAST_PLAYER_EXACT_AMOUNT_REQUIRED = 'LAST_PLAYER_EXACT_AMOUNT_REQUIRED', // @deprecated - use ValidationCode
  ORGANIZER_CONFIRMATION_REQUIRED = 'ORGANIZER_CONFIRMATION_REQUIRED', // @deprecated - use ValidationCode
  PLAYER_ALREADY_CASHED_OUT = 'PLAYER_ALREADY_CASHED_OUT', // @deprecated - use ValidationCode
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