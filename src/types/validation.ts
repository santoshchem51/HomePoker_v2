/**
 * Validation Result Types - Separates user validation from system errors
 * 
 * This replaces the exception-based validation pattern with a result-based pattern:
 * - ValidationResult: Normal business rule validation (not exceptions)
 * - ServiceError: True system/infrastructure errors (exceptions)
 */

export enum ValidationCode {
  // Transaction validation codes
  INSUFFICIENT_SESSION_POT = 'INSUFFICIENT_SESSION_POT',
  LAST_PLAYER_EXACT_AMOUNT_REQUIRED = 'LAST_PLAYER_EXACT_AMOUNT_REQUIRED',
  CASH_OUT_EXCEEDS_BUY_INS = 'CASH_OUT_EXCEEDS_BUY_INS',
  PLAYER_ALREADY_CASHED_OUT = 'PLAYER_ALREADY_CASHED_OUT',
  ORGANIZER_CONFIRMATION_REQUIRED = 'ORGANIZER_CONFIRMATION_REQUIRED',
  
  // General validation codes
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  AMOUNT_TOO_LOW = 'AMOUNT_TOO_LOW',
  AMOUNT_TOO_HIGH = 'AMOUNT_TOO_HIGH',
  INVALID_PLAYER_STATE = 'INVALID_PLAYER_STATE',
  INVALID_SESSION_STATE = 'INVALID_SESSION_STATE',
  
  // Session validation codes
  SESSION_ALREADY_STARTED = 'SESSION_ALREADY_STARTED',
  SESSION_ALREADY_COMPLETED = 'SESSION_ALREADY_COMPLETED',
  INVALID_PLAYER_COUNT = 'INVALID_PLAYER_COUNT',
  DUPLICATE_PLAYER_NAME = 'DUPLICATE_PLAYER_NAME',
}

/**
 * Validation result for user input validation
 * This is NOT an error - it's a normal validation outcome
 */
export interface ValidationResult<T = any> {
  isValid: boolean;
  data?: T; // Success data when valid
  code?: ValidationCode; // Validation code when invalid
  message?: string; // User-friendly message
  title?: string; // Dialog title for UI display
  details?: Record<string, any>; // Additional context
  requiresConfirmation?: boolean; // For organizer confirmation cases
  suggestedAction?: string; // Suggested fix for user
}

/**
 * Specialized validation results for different operation types
 */
export interface TransactionValidationResult extends ValidationResult {
  transactionType?: 'buy_in' | 'cash_out';
  playerId?: string;
  playerName?: string;
  amount?: number;
  requiredAmount?: number; // For last player constraint
  availableAmount?: number; // For pot validation
}

export interface SessionValidationResult extends ValidationResult {
  sessionId?: string;
  sessionStatus?: string;
  playerCount?: number;
  requiredPlayerCount?: { min: number; max: number };
}

export interface PlayerValidationResult extends ValidationResult {
  playerId?: string;
  playerName?: string;
  playerStatus?: string;
  currentBalance?: number;
  totalBuyIns?: number;
}

/**
 * Helper functions to create common validation results
 */
export class ValidationHelper {
  /**
   * Create a successful validation result
   */
  static success<T>(data?: T): ValidationResult<T> {
    return {
      isValid: true,
      data
    };
  }

  /**
   * Create a failed validation result
   */
  static failure(
    code: ValidationCode,
    message: string,
    options: {
      title?: string;
      details?: Record<string, any>;
      requiresConfirmation?: boolean;
      suggestedAction?: string;
    } = {}
  ): ValidationResult {
    return {
      isValid: false,
      code,
      message,
      title: options.title,
      details: options.details,
      requiresConfirmation: options.requiresConfirmation,
      suggestedAction: options.suggestedAction
    };
  }

  /**
   * Create transaction validation results with common patterns
   */
  static transactionValidation = {
    insufficientPot: (
      attemptedAmount: number,
      availableAmount: number,
      playerName: string
    ): TransactionValidationResult => ({
      isValid: false,
      code: ValidationCode.INSUFFICIENT_SESSION_POT,
      title: '💰 Insufficient Pot',
      message: `Cannot cash out $${attemptedAmount.toFixed(2)} for ${playerName}. Only $${availableAmount.toFixed(2)} remaining in pot.`,
      suggestedAction: `Try an amount up to $${availableAmount.toFixed(2)}`,
      amount: attemptedAmount,
      availableAmount,
      playerName
    }),

    lastPlayerExactAmount: (
      attemptedAmount: number,
      requiredAmount: number,
      playerName: string
    ): TransactionValidationResult => ({
      isValid: false,
      code: ValidationCode.LAST_PLAYER_EXACT_AMOUNT_REQUIRED,
      title: '🎯 Last Player Constraint',
      message: `As the last player, ${playerName} must cash out exactly $${requiredAmount.toFixed(2)} (the remaining pot). You entered $${attemptedAmount.toFixed(2)}.`,
      suggestedAction: `Use exactly $${requiredAmount.toFixed(2)}`,
      amount: attemptedAmount,
      requiredAmount,
      playerName
    }),

    organizerConfirmationRequired: (
      amount: number,
      playerName: string,
      playerBuyIns: number
    ): TransactionValidationResult => ({
      isValid: false,
      code: ValidationCode.ORGANIZER_CONFIRMATION_REQUIRED,
      title: '⚠️ Organizer Confirmation Required',
      message: `Cash-out amount $${amount.toFixed(2)} exceeds ${playerName}'s total buy-ins of $${playerBuyIns.toFixed(2)}.`,
      requiresConfirmation: true,
      suggestedAction: 'Organizer approval required to proceed',
      amount,
      playerName,
      details: { playerBuyIns }
    }),

    playerAlreadyCashedOut: (playerName: string): TransactionValidationResult => ({
      isValid: false,
      code: ValidationCode.PLAYER_ALREADY_CASHED_OUT,
      title: '⚠️ Player Already Cashed Out',
      message: `${playerName} has already cashed out and cannot perform additional cash-out transactions.`,
      suggestedAction: 'Select a different player or check transaction history',
      playerName
    }),

    invalidAmount: (
      amount: number,
      min: number,
      max: number,
      transactionType: 'buy_in' | 'cash_out'
    ): TransactionValidationResult => ({
      isValid: false,
      code: ValidationCode.INVALID_AMOUNT,
      title: '💵 Invalid Amount',
      message: `${transactionType === 'buy_in' ? 'Buy-in' : 'Cash-out'} amount must be between $${min.toFixed(2)} and $${max.toFixed(2)}. You entered $${amount.toFixed(2)}.`,
      suggestedAction: `Enter an amount between $${min.toFixed(2)} and $${max.toFixed(2)}`,
      amount,
      transactionType
    }),

    success: <T>(data: T): ValidationResult<T> => ValidationHelper.success(data)
  };

  /**
   * Create session validation results
   */
  static sessionValidation = {
    invalidPlayerCount: (
      currentCount: number,
      min: number,
      max: number
    ): SessionValidationResult => ({
      isValid: false,
      code: ValidationCode.INVALID_PLAYER_COUNT,
      title: '👥 Invalid Player Count',
      message: `Session requires ${min}-${max} players. Currently has ${currentCount} players.`,
      suggestedAction: currentCount < min 
        ? `Add ${min - currentCount} more player${min - currentCount > 1 ? 's' : ''}`
        : `Remove ${currentCount - max} player${currentCount - max > 1 ? 's' : ''}`,
      playerCount: currentCount,
      requiredPlayerCount: { min, max }
    }),

    sessionAlreadyStarted: (sessionName: string): SessionValidationResult => ({
      isValid: false,
      code: ValidationCode.SESSION_ALREADY_STARTED,
      title: '🎮 Session Already Started',
      message: `Session "${sessionName}" has already been started and cannot be modified.`,
      suggestedAction: 'Create a new session or join an active session'
    }),

    duplicatePlayerName: (playerName: string): PlayerValidationResult => ({
      isValid: false,
      code: ValidationCode.DUPLICATE_PLAYER_NAME,
      title: '👤 Duplicate Player Name',
      message: `A player named "${playerName}" is already in this session.`,
      suggestedAction: 'Choose a different name or add a number (e.g., "John 2")',
      playerName
    }),

    success: <T>(data: T): ValidationResult<T> => ValidationHelper.success(data)
  };
}

/**
 * Type guard functions to check validation result types
 */
export function isValidationFailure(result: ValidationResult): result is ValidationResult & { isValid: false } {
  return !result.isValid;
}

export function requiresConfirmation(result: ValidationResult): boolean {
  return result.requiresConfirmation === true;
}

export function isTransactionValidation(result: ValidationResult): result is TransactionValidationResult {
  return result.code !== undefined && Object.values(ValidationCode).includes(result.code);
}

/**
 * UI Helper to convert ValidationResult to modal dialog properties
 */
export function validationToModalProps(result: ValidationResult) {
  if (result.isValid) return null;

  return {
    visible: true,
    title: result.title || 'Validation Error',
    message: result.message || 'Please check your input and try again.',
    confirmText: result.requiresConfirmation ? 'Confirm' : 'OK',
    cancelText: result.requiresConfirmation ? 'Cancel' : undefined,
    confirmStyle: result.requiresConfirmation ? 'destructive' : 'default'
  };
}