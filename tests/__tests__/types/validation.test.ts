/**
 * Test suite for ValidationResult type system
 * Validates the new error architecture separating validation from system errors
 */

import { 
  ValidationHelper, 
  ValidationCode,
  ValidationResult,
  TransactionValidationResult,
  isValidationFailure,
  requiresConfirmation,
  validationToModalProps 
} from '../../../src/types/validation';

describe('ValidationResult Type System', () => {
  describe('ValidationHelper.success', () => {
    it('should create successful validation result', () => {
      const result = ValidationHelper.success({ amount: 25.00 });
      
      expect(result.isValid).toBe(true);
      expect(result.data).toEqual({ amount: 25.00 });
      expect(result.code).toBeUndefined();
      expect(result.message).toBeUndefined();
    });
  });

  describe('ValidationHelper.failure', () => {
    it('should create failed validation result with all properties', () => {
      const result = ValidationHelper.failure(
        ValidationCode.INSUFFICIENT_SESSION_POT,
        'Not enough funds in pot',
        {
          title: '💰 Insufficient Pot',
          details: { amount: 30, available: 25 },
          requiresConfirmation: false,
          suggestedAction: 'Try a smaller amount'
        }
      );
      
      expect(result.isValid).toBe(false);
      expect(result.code).toBe(ValidationCode.INSUFFICIENT_SESSION_POT);
      expect(result.message).toBe('Not enough funds in pot');
      expect(result.title).toBe('💰 Insufficient Pot');
      expect(result.details).toEqual({ amount: 30, available: 25 });
      expect(result.requiresConfirmation).toBe(false);
      expect(result.suggestedAction).toBe('Try a smaller amount');
    });
  });

  describe('Transaction Validation Helpers', () => {
    it('should create insufficient pot validation result', () => {
      const result = ValidationHelper.transactionValidation.insufficientPot(30, 25, 'Alice');
      
      expect(result.isValid).toBe(false);
      expect(result.code).toBe(ValidationCode.INSUFFICIENT_SESSION_POT);
      expect(result.title).toBe('💰 Insufficient Pot');
      expect(result.message).toContain('Cannot cash out $30.00 for Alice');
      expect(result.message).toContain('Only $25.00 remaining');
      expect(result.suggestedAction).toBe('Try an amount up to $25.00');
      expect(result.amount).toBe(30);
      expect(result.availableAmount).toBe(25);
      expect(result.playerName).toBe('Alice');
    });

    it('should create last player constraint validation result', () => {
      const result = ValidationHelper.transactionValidation.lastPlayerExactAmount(20, 25, 'Bob');
      
      expect(result.isValid).toBe(false);
      expect(result.code).toBe(ValidationCode.LAST_PLAYER_EXACT_AMOUNT_REQUIRED);
      expect(result.title).toBe('🎯 Last Player Constraint');
      expect(result.message).toContain('As the last player, Bob must cash out exactly $25.00');
      expect(result.message).toContain('You entered $20.00');
      expect(result.suggestedAction).toBe('Use exactly $25.00');
      expect(result.amount).toBe(20);
      expect(result.requiredAmount).toBe(25);
      expect(result.playerName).toBe('Bob');
    });

    it('should create organizer confirmation required result', () => {
      const result = ValidationHelper.transactionValidation.organizerConfirmationRequired(50, 'Charlie', 30);
      
      expect(result.isValid).toBe(false);
      expect(result.code).toBe(ValidationCode.ORGANIZER_CONFIRMATION_REQUIRED);
      expect(result.title).toBe('⚠️ Organizer Confirmation Required');
      expect(result.message).toContain('Cash-out amount $50.00 exceeds Charlie\'s total buy-ins of $30.00');
      expect(result.requiresConfirmation).toBe(true);
      expect(result.suggestedAction).toBe('Organizer approval required to proceed');
      expect(result.amount).toBe(50);
      expect(result.playerName).toBe('Charlie');
      expect(result.details?.playerBuyIns).toBe(30);
    });

    it('should create invalid amount validation result', () => {
      const result = ValidationHelper.transactionValidation.invalidAmount(0.50, 1.00, 1000.00, 'buy_in');
      
      expect(result.isValid).toBe(false);
      expect(result.code).toBe(ValidationCode.INVALID_AMOUNT);
      expect(result.title).toBe('💵 Invalid Amount');
      expect(result.message).toContain('Buy-in amount must be between $1.00 and $1000.00');
      expect(result.message).toContain('You entered $0.50');
      expect(result.suggestedAction).toBe('Enter an amount between $1.00 and $1000.00');
      expect(result.amount).toBe(0.50);
      expect(result.transactionType).toBe('buy_in');
    });
  });

  describe('Type Guards', () => {
    it('should identify validation failures', () => {
      const success = ValidationHelper.success();
      const failure = ValidationHelper.failure(ValidationCode.INVALID_AMOUNT, 'Test error');
      
      expect(isValidationFailure(success)).toBe(false);
      expect(isValidationFailure(failure)).toBe(true);
    });

    it('should identify confirmation requirements', () => {
      const noConfirmation = ValidationHelper.failure(ValidationCode.INVALID_AMOUNT, 'Test error');
      const needsConfirmation = ValidationHelper.failure(
        ValidationCode.ORGANIZER_CONFIRMATION_REQUIRED, 
        'Test error',
        { requiresConfirmation: true }
      );
      
      expect(requiresConfirmation(noConfirmation)).toBe(false);
      expect(requiresConfirmation(needsConfirmation)).toBe(true);
    });
  });

  describe('UI Integration', () => {
    it('should convert validation result to modal props', () => {
      const result = ValidationHelper.transactionValidation.insufficientPot(30, 25, 'Alice');
      const modalProps = validationToModalProps(result);
      
      expect(modalProps).toEqual({
        visible: true,
        title: '💰 Insufficient Pot',
        message: 'Cannot cash out $30.00 for Alice. Only $25.00 remaining in pot.',
        confirmText: 'OK',
        cancelText: undefined,
        confirmStyle: 'default'
      });
    });

    it('should handle confirmation-required results', () => {
      const result = ValidationHelper.transactionValidation.organizerConfirmationRequired(50, 'Charlie', 30);
      const modalProps = validationToModalProps(result);
      
      expect(modalProps?.confirmText).toBe('Confirm');
      expect(modalProps?.cancelText).toBe('Cancel');
      expect(modalProps?.confirmStyle).toBe('destructive');
    });

    it('should return null for valid results', () => {
      const result = ValidationHelper.success();
      const modalProps = validationToModalProps(result);
      
      expect(modalProps).toBeNull();
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle complete cash-out validation workflow', () => {
      // Scenario: Alice tries to cash out $30 from a $25 pot
      const sessionPot = 25.00;
      const attemptedAmount = 30.00;
      const playerName = 'Alice';
      
      // This would be the validation logic
      let result: TransactionValidationResult;
      
      if (attemptedAmount > sessionPot) {
        result = ValidationHelper.transactionValidation.insufficientPot(
          attemptedAmount, sessionPot, playerName
        );
      } else {
        result = ValidationHelper.transactionValidation.success({
          amount: attemptedAmount,
          playerName
        });
      }
      
      expect(result.isValid).toBe(false);
      expect(result.code).toBe(ValidationCode.INSUFFICIENT_SESSION_POT);
      expect(result.message).toContain('Cannot cash out $30.00');
      expect(result.message).toContain('Only $25.00 remaining');
      
      // UI would use this
      const modalProps = validationToModalProps(result);
      expect(modalProps?.title).toBe('💰 Insufficient Pot');
      expect(modalProps?.confirmText).toBe('OK');
    });

    it('should handle last player constraint scenario', () => {
      // Scenario: Last player Bob tries to cash out $20 from $25 pot
      const isLastPlayer = true;
      const sessionPot = 25.00;
      const attemptedAmount = 20.00;
      const playerName = 'Bob';
      const tolerance = 0.01;
      
      let result: TransactionValidationResult;
      
      if (attemptedAmount > sessionPot) {
        result = ValidationHelper.transactionValidation.insufficientPot(
          attemptedAmount, sessionPot, playerName
        );
      } else if (isLastPlayer && Math.abs(attemptedAmount - sessionPot) > tolerance) {
        result = ValidationHelper.transactionValidation.lastPlayerExactAmount(
          attemptedAmount, sessionPot, playerName
        );
      } else {
        result = ValidationHelper.transactionValidation.success({
          amount: attemptedAmount,
          playerName
        });
      }
      
      expect(result.isValid).toBe(false);
      expect(result.code).toBe(ValidationCode.LAST_PLAYER_EXACT_AMOUNT_REQUIRED);
      expect(result.message).toContain('must cash out exactly $25.00');
      expect(result.suggestedAction).toBe('Use exactly $25.00');
    });

    it('should handle successful validation', () => {
      // Scenario: Valid cash-out within pot limits
      const sessionPot = 100.00;
      const attemptedAmount = 50.00;
      const playerBuyIns = 60.00;
      const isLastPlayer = false;
      
      let result: TransactionValidationResult;
      
      if (attemptedAmount > sessionPot) {
        result = ValidationHelper.transactionValidation.insufficientPot(
          attemptedAmount, sessionPot, 'Player'
        );
      } else if (attemptedAmount > playerBuyIns) {
        result = ValidationHelper.transactionValidation.organizerConfirmationRequired(
          attemptedAmount, 'Player', playerBuyIns
        );
      } else {
        result = ValidationHelper.transactionValidation.success({
          amount: attemptedAmount,
          sessionPot,
          playerBuyIns
        });
      }
      
      expect(result.isValid).toBe(true);
      expect(result.data).toEqual({
        amount: attemptedAmount,
        sessionPot,
        playerBuyIns
      });
      expect(result.code).toBeUndefined();
      expect(result.message).toBeUndefined();
    });
  });
});