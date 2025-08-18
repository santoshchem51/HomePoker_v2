/**
 * Simple TransactionService Method Path Investigation
 * 
 * Focus on identifying which method is being called and why ValidationResult isn't working
 */

import TransactionService from '../../../src/services/core/TransactionService';
import { ValidationHelper, isValidationFailure } from '../../../src/types/validation';

describe('TransactionService Method Path - Simple Investigation', () => {
  let transactionService: TransactionService;

  beforeAll(() => {
    transactionService = TransactionService.getInstance();
  });

  describe('Method Signature Verification', () => {
    test('should verify both methods exist with correct signatures', () => {
      console.log('\n🔍 VERIFYING METHOD SIGNATURES\n');
      
      // Check if both methods exist
      expect(typeof transactionService.validateAndRecordCashOut).toBe('function');
      expect(typeof transactionService.recordCashOut).toBe('function');
      
      console.log('✅ Both validateAndRecordCashOut and recordCashOut methods exist');
      
      // Check method parameter counts
      console.log('validateAndRecordCashOut parameter count:', transactionService.validateAndRecordCashOut.length);
      console.log('recordCashOut parameter count:', transactionService.recordCashOut.length);
      
      // Both should have 7 parameters based on the method signatures
      expect(transactionService.validateAndRecordCashOut.length).toBe(7);
      expect(transactionService.recordCashOut.length).toBe(7);
    });
  });

  describe('ValidationHelper Function Tests', () => {
    test('should test ValidationHelper.insufficientPot function directly', () => {
      console.log('\n🔍 TESTING ValidationHelper FUNCTIONS\n');
      
      const result = ValidationHelper.transactionValidation.insufficientPot(100, 50, 'TestPlayer');
      
      console.log('ValidationHelper.insufficientPot result:', {
        isValid: result.isValid,
        code: result.code,
        title: result.title,
        message: result.message
      });
      
      expect(result.isValid).toBe(false);
      expect(result.code).toBe('INSUFFICIENT_SESSION_POT');
      expect(result.title).toContain('💰');
      expect(result.message).toContain('TestPlayer');
      expect(result.message).toContain('$100');
      expect(result.message).toContain('$50');
      
      console.log('✅ ValidationHelper.insufficientPot works correctly');
    });

    test('should test isValidationFailure type guard', () => {
      console.log('\n🔍 TESTING TYPE GUARDS\n');
      
      // Test with validation failure
      const failureResult = ValidationHelper.transactionValidation.insufficientPot(100, 50, 'TestPlayer');
      const isFailure = isValidationFailure(failureResult);
      
      console.log('isValidationFailure for insufficient pot:', isFailure);
      expect(isFailure).toBe(true);
      
      // Test with success
      const successResult = ValidationHelper.transactionValidation.success({ 
        sessionId: 'test', 
        playerId: 'test', 
        amount: 50 
      });
      const isSuccess = isValidationFailure(successResult);
      
      console.log('isValidationFailure for success:', isSuccess);
      expect(isSuccess).toBe(false);
      
      console.log('✅ isValidationFailure type guard works correctly');
    });
  });

  describe('Direct Method Call Analysis', () => {
    test('should analyze what happens when calling validateAndRecordCashOut with invalid session', async () => {
      console.log('\n🔍 TESTING validateAndRecordCashOut WITH INVALID DATA\n');
      
      try {
        console.log('Calling validateAndRecordCashOut with non-existent session...');
        
        const result = await transactionService.validateAndRecordCashOut(
          'non-existent-session', 
          'non-existent-player', 
          100,
          'manual',
          'test',
          undefined,
          false
        );
        
        console.log('✅ validateAndRecordCashOut returned result (no exception thrown)');
        console.log('Result:', {
          isValid: result.validation.isValid,
          code: result.validation.code,
          title: result.validation.title,
          message: result.validation.message
        });
        
        if (isValidationFailure(result.validation)) {
          console.log('✅ ValidationResult pattern working - validation failure returned properly');
        } else {
          console.log('❌ ValidationResult pattern failed - should have returned validation failure');
        }
        
      } catch (error) {
        console.log('❌ CRITICAL BUG: validateAndRecordCashOut threw exception instead of returning ValidationResult');
        console.log('Exception details:', {
          name: error.name,
          message: error.message,
          code: error.code
        });
        
        // This would explain why we see ServiceError in logs instead of ValidationResult dialogs
        expect(error).toBeNull(); // This should fail if exception is thrown
      }
    });

    test('should analyze what happens when calling recordCashOut with invalid session', async () => {
      console.log('\n🔍 TESTING recordCashOut WITH INVALID DATA\n');
      
      try {
        console.log('Calling recordCashOut with non-existent session...');
        
        const result = await transactionService.recordCashOut(
          'non-existent-session',
          'non-existent-player',
          100,
          'manual',
          'test',
          undefined,
          false
        );
        
        console.log('❌ recordCashOut should have thrown exception but returned:', result);
        expect(result).toBeNull(); // This should fail if no exception is thrown
        
      } catch (error) {
        console.log('✅ recordCashOut threw expected exception (legacy behavior)');
        console.log('Exception details:', {
          name: error.name,
          message: error.message,
          code: error.code
        });
        
        // This is expected behavior for the legacy method
        expect(error).toBeDefined();
      }
    });
  });
});