/**
 * Unified Error Testing Strategy
 * Standardized patterns for testing error conditions across all test suites
 */

/**
 * Error matching utilities that work with any error type
 */
export const ErrorMatchers = {
  /**
   * Test that a promise rejects with a message containing specific text
   * @param {Promise} promise - Promise that should reject
   * @param {string} messagePattern - Text that should be in error message
   */
  async rejectsWithMessage(promise, messagePattern) {
    await expect(promise).rejects.toThrow(
      expect.objectContaining({
        message: expect.stringContaining(messagePattern)
      })
    );
  },

  /**
   * Test that a promise rejects with a specific error code
   * @param {Promise} promise - Promise that should reject
   * @param {string} errorCode - Expected error code
   */
  async rejectsWithCode(promise, errorCode) {
    await expect(promise).rejects.toThrow(
      expect.objectContaining({ code: errorCode })
    );
  },

  /**
   * Test that a promise rejects with both message and code
   * @param {Promise} promise - Promise that should reject
   * @param {string} messagePattern - Text that should be in error message
   * @param {string} errorCode - Expected error code
   */
  async rejectsWithMessageAndCode(promise, messagePattern, errorCode) {
    await expect(promise).rejects.toThrow(
      expect.objectContaining({
        message: expect.stringContaining(messagePattern),
        code: errorCode
      })
    );
  },

  /**
   * Test that a function throws with a specific message
   * @param {Function} fn - Function that should throw
   * @param {string} messagePattern - Text that should be in error message
   */
  throwsWithMessage(fn, messagePattern) {
    expect(fn).toThrow(
      expect.objectContaining({
        message: expect.stringContaining(messagePattern)
      })
    );
  },

  /**
   * Test that a function throws any error
   * @param {Function} fn - Function that should throw
   */
  throwsAnyError(fn) {
    expect(fn).toThrow();
  },

  /**
   * Test validation errors specifically
   * @param {Promise} promise - Promise that should reject with validation error
   * @param {string} field - Field that failed validation
   */
  async validationError(promise, field) {
    await expect(promise).rejects.toThrow(
      expect.objectContaining({
        code: 'VALIDATION_ERROR',
        message: expect.stringContaining(field)
      })
    );
  },

  /**
   * Test service errors specifically
   * @param {Promise} promise - Promise that should reject with service error
   * @param {string} operation - Operation that failed
   */
  async serviceError(promise, operation) {
    await expect(promise).rejects.toThrow(
      expect.objectContaining({
        message: expect.stringContaining(operation)
      })
    );
  }
};

/**
 * Common error scenarios for different service types
 */
export const ErrorScenarios = {
  /**
   * Database connection errors
   */
  database: {
    connectionFailed: 'Database connection failed',
    queryFailed: 'Query execution failed',
    transactionFailed: 'Transaction failed',
    notFound: 'Record not found'
  },

  /**
   * Validation errors
   */
  validation: {
    required: 'is required',
    tooSmall: 'must be at least',
    tooLarge: 'cannot exceed',
    invalid: 'is invalid',
    duplicate: 'already exists'
  },

  /**
   * Business logic errors
   */
  business: {
    insufficientFunds: 'insufficient funds',
    playerNotFound: 'Player not found',
    sessionNotActive: 'Session is not active',
    alreadyProcessed: 'already processed'
  },

  /**
   * System errors
   */
  system: {
    networkError: 'Network error',
    timeout: 'Request timeout',
    unauthorized: 'Unauthorized',
    forbidden: 'Forbidden'
  }
};

/**
 * Error testing helpers for specific domains
 */
export const DomainErrorTesters = {
  /**
   * Transaction service error testing
   */
  transaction: {
    async invalidAmount(promise) {
      await ErrorMatchers.validationError(promise, 'amount');
    },

    async playerNotFound(promise) {
      await ErrorMatchers.rejectsWithMessage(promise, ErrorScenarios.business.playerNotFound);
    },

    async sessionNotActive(promise) {
      await ErrorMatchers.rejectsWithMessage(promise, ErrorScenarios.business.sessionNotActive);
    },

    async duplicateTransaction(promise) {
      await ErrorMatchers.rejectsWithMessage(promise, ErrorScenarios.validation.duplicate);
    }
  },

  /**
   * Settlement service error testing
   */
  settlement: {
    async validationFailed(promise) {
      await ErrorMatchers.rejectsWithCode(promise, 'VALIDATION_FAILED');
    },

    async optimizationFailed(promise) {
      await ErrorMatchers.rejectsWithMessage(promise, 'optimization failed');
    },

    async proofGenerationFailed(promise) {
      await ErrorMatchers.rejectsWithMessage(promise, 'proof generation failed');
    }
  },

  /**
   * Session service error testing
   */
  session: {
    async sessionNotFound(promise) {
      await ErrorMatchers.rejectsWithMessage(promise, 'Session not found');
    },

    async sessionAlreadyEnded(promise) {
      await ErrorMatchers.rejectsWithMessage(promise, 'Session has already ended');
    }
  }
};

/**
 * Error state testing for stores
 */
export const StoreErrorTesters = {
  /**
   * Test error state in Zustand store
   * @param {Object} store - Zustand store instance
   * @param {Function} failingAction - Action that should fail
   * @param {string} expectedErrorPattern - Expected error message pattern
   */
  async testErrorState(store, failingAction, expectedErrorPattern) {
    const initialState = store.getState();
    
    try {
      await failingAction();
      throw new Error('Expected action to fail');
    } catch (error) {
      expect(error.message).toContain(expectedErrorPattern);
    }
    
    const errorState = store.getState();
    expect(errorState.error).toBeTruthy();
    
    return { initialState, errorState };
  },

  /**
   * Test error recovery in store
   * @param {Object} store - Zustand store instance
   */
  testErrorRecovery(store) {
    const initialError = new Error('Test error');
    store.getState().setError(initialError);
    
    expect(store.getState().error).toEqual(initialError);
    
    store.getState().clearError();
    expect(store.getState().error).toBeNull();
  }
};

/**
 * Mock error generators for testing
 */
export const MockErrors = {
  /**
   * Create a ServiceError-like object
   */
  serviceError(code, message, details = undefined) {
    const error = new Error(message);
    error.name = 'ServiceError';
    error.code = code;
    error.details = details;
    return error;
  },

  /**
   * Create a validation error
   */
  validationError(field, message) {
    return this.serviceError('VALIDATION_ERROR', `${field} ${message}`);
  },

  /**
   * Create a database error
   */
  databaseError(operation) {
    return this.serviceError('DATABASE_ERROR', `${operation} failed`);
  },

  /**
   * Create a business logic error
   */
  businessError(rule, message) {
    return this.serviceError('BUSINESS_RULE_VIOLATION', `${rule}: ${message}`);
  }
};

export default {
  ErrorMatchers,
  ErrorScenarios,
  DomainErrorTesters,
  StoreErrorTesters,
  MockErrors
};