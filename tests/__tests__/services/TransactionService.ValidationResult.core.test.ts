/**
 * Core ValidationResult Tests - No Database Dependency
 * 
 * Tests the core ValidationResult pattern that fixes the system error issue.
 * These tests focus on the method behavior without database setup.
 */

import TransactionService from '../../../src/services/core/TransactionService';
import { 
  ValidationHelper, 
  isValidationFailure,
  requiresConfirmation,
  ValidationCode 
} from '../../../src/types/validation';
import { ServiceError } from '../../../src/types/errors';

describe('TransactionService ValidationResult Core Tests', () => {
  let transactionService: TransactionService;

  beforeAll(() => {
    transactionService = TransactionService.getInstance();
  });

  describe('CRITICAL FIX: Exception vs ValidationResult Behavior', () => {
    test('validateAndRecordCashOut should NEVER throw ServiceError for invalid scenarios', async () => {
      console.log('\n🎯 CRITICAL TEST: validateAndRecordCashOut never throws exceptions\n');
      
      const invalidScenarios = [
        {
          name: 'Non-existent session',
          sessionId: 'invalid-session-123',
          playerId: 'invalid-player-123',
          amount: 100
        },
        {
          name: 'Null session ID',
          sessionId: null as any,
          playerId: 'test-player',
          amount: 50
        },
        {
          name: 'Empty session ID',
          sessionId: '',
          playerId: 'test-player',
          amount: 50
        },
        {
          name: 'Negative amount',
          sessionId: 'test-session',
          playerId: 'test-player',
          amount: -100
        },
        {
          name: 'Zero amount',
          sessionId: 'test-session',
          playerId: 'test-player',
          amount: 0
        }
      ];
      
      let allTestsPassed = true;
      
      for (const scenario of invalidScenarios) {
        try {
          console.log(`Testing: ${scenario.name}`);
          
          const result = await transactionService.validateAndRecordCashOut(
            scenario.sessionId,
            scenario.playerId,
            scenario.amount,
            'manual',
            'user'
          );
          
          console.log(`  ✅ ${scenario.name} - No exception thrown`);
          console.log(`     Result: isValid=${result.validation.isValid}, code=${result.validation.code}`);
          
          // All invalid scenarios should return validation failures
          expect(result.validation.isValid).toBe(false);
          expect(result.validation.code).toBeDefined();
          expect(result.validation.message).toBeDefined();
          expect(result.validation.title).toBeDefined();
          
          // Verify it's a proper ValidationResult failure
          expect(isValidationFailure(result.validation)).toBe(true);
          
        } catch (error) {
          console.log(`  ❌ ${scenario.name} - EXCEPTION THROWN: ${error.name}: ${error.message}`);
          allTestsPassed = false;
          
          // This should NOT happen with ValidationResult pattern
          expect(error).toBeNull(); // Force test failure with clear message
        }
      }
      
      if (allTestsPassed) {
        console.log('\n✅ CRITICAL FIX VERIFIED: All scenarios return ValidationResult instead of throwing');
      } else {
        console.log('\n❌ CRITICAL BUG: Some scenarios still throw exceptions instead of ValidationResult');
      }
      
      expect(allTestsPassed).toBe(true);
    });

    test('recordCashOut (legacy) should still throw ServiceError for comparison', async () => {
      console.log('\n🔍 LEGACY COMPARISON: recordCashOut throws exceptions\n');
      
      try {
        console.log('Testing legacy recordCashOut with invalid session...');
        
        const result = await transactionService.recordCashOut(
          'invalid-session-123',
          'invalid-player-123',
          100,
          'manual',
          'user'
        );
        
        console.log('❌ Legacy method should have thrown exception but returned:', result);
        // Legacy method should throw, not return
        expect(result).toBeNull(); // Force failure if no exception
        
      } catch (error) {
        console.log('✅ Legacy recordCashOut correctly threw exception:');
        console.log(`   ${error.name}: ${error.message}`);
        
        // Legacy behavior - should throw ServiceError
        expect(error.name).toBe('ServiceError');
        expect(error.code).toBeDefined();
        expect(error.message).toBeDefined();
      }
    });

    test('Debug logging should be present in validateAndRecordCashOut', async () => {
      console.log('\n🔍 DEBUG LOGGING TEST\n');
      
      // Capture console logs
      const originalLog = console.log;
      const logs: string[] = [];
      console.log = (...args: any[]) => {
        logs.push(args.join(' '));
        originalLog(...args);
      };
      
      try {
        await transactionService.validateAndRecordCashOut(
          'test-session',
          'test-player',
          100,
          'manual',
          'user'
        );
        
      } catch (error) {
        // Ignore exceptions for this test - we're just checking logging
      } finally {
        // Restore console
        console.log = originalLog;
      }
      
      // Check for debug logging
      const hasDebugLog = logs.some(log => log.includes('🎯 validateAndRecordCashOut called - NEW ValidationResult method'));
      
      console.log('Debug logs captured:', logs.length);
      if (hasDebugLog) {
        console.log('✅ Debug logging is working');
      } else {
        console.log('❌ Debug logging missing');
        console.log('Recent logs:', logs.slice(-3));
      }
      
      expect(hasDebugLog).toBe(true);
    });
  });

  describe('ValidationResult UI Integration', () => {
    test('ValidationResult objects must have UI-ready properties', () => {
      console.log('\n🎯 UI PROPERTIES TEST\n');
      
      // Test ValidationHelper functions directly
      const insufficientPotResult = ValidationHelper.transactionValidation.insufficientPot(100, 50, 'TestPlayer');
      
      console.log('ValidationResult properties:');
      console.log('  isValid:', insufficientPotResult.isValid);
      console.log('  code:', insufficientPotResult.code);
      console.log('  title:', insufficientPotResult.title);
      console.log('  message:', insufficientPotResult.message);
      
      // UI integration requirements
      expect(insufficientPotResult.isValid).toBe(false);
      expect(insufficientPotResult.code).toBe(ValidationCode.INSUFFICIENT_SESSION_POT);
      expect(insufficientPotResult.title).toContain('💰');
      expect(insufficientPotResult.message).toContain('TestPlayer');
      expect(insufficientPotResult.message).toContain('$100');
      expect(insufficientPotResult.message).toContain('$50');
      
      // Test UI property extraction (like LiveGameScreen does)
      const potValidationTitle = insufficientPotResult.title || '💰 Transaction Error';
      const potValidationMessage = insufficientPotResult.message || 'Please check your input and try again.';
      
      expect(potValidationTitle).toBeDefined();
      expect(potValidationMessage).toBeDefined();
      expect(potValidationTitle.length).toBeGreaterThan(0);
      expect(potValidationMessage.length).toBeGreaterThan(0);
      
      console.log('✅ ValidationResult produces UI-ready properties');
    });

    test('Type guards must work correctly for UI decision logic', () => {
      console.log('\n🔍 TYPE GUARD TESTS\n');
      
      // Test isValidationFailure
      const failureResult = ValidationHelper.transactionValidation.insufficientPot(100, 50, 'TestPlayer');
      const isFailure = isValidationFailure(failureResult);
      
      console.log('isValidationFailure for insufficient pot:', isFailure);
      expect(isFailure).toBe(true);
      
      // Test requiresConfirmation
      const orgConfirmResult = ValidationHelper.transactionValidation.organizerConfirmationRequired(150, 'TestPlayer', 100);
      const needsConfirmation = requiresConfirmation(orgConfirmResult);
      
      console.log('requiresConfirmation for organizer scenario:', needsConfirmation);
      expect(needsConfirmation).toBe(true);
      
      // Test success case
      const successResult = ValidationHelper.transactionValidation.success({ 
        sessionId: 'test', 
        playerId: 'test', 
        amount: 50 
      });
      const isSuccessFailure = isValidationFailure(successResult);
      const successNeedsConfirm = requiresConfirmation(successResult);
      
      console.log('Success case - isFailure:', isSuccessFailure, 'needsConfirm:', successNeedsConfirm);
      expect(isSuccessFailure).toBe(false);
      expect(successNeedsConfirm).toBe(false);
      
      console.log('✅ All type guards working correctly');
    });
  });

  describe('ValidationHelper Functions', () => {
    test('All ValidationHelper functions should return proper ValidationResult objects', () => {
      console.log('\n🔍 VALIDATIONHELPER FUNCTION TESTS\n');
      
      // Test insufficient pot
      const insufficientPot = ValidationHelper.transactionValidation.insufficientPot(100, 50, 'TestPlayer');
      expect(insufficientPot.isValid).toBe(false);
      expect(insufficientPot.code).toBe(ValidationCode.INSUFFICIENT_SESSION_POT);
      expect(insufficientPot.title).toContain('💰');
      console.log('✅ insufficientPot function works');
      
      // Test organizer confirmation
      const orgConfirm = ValidationHelper.transactionValidation.organizerConfirmationRequired(150, 'TestPlayer', 100);
      expect(orgConfirm.isValid).toBe(false);
      expect(orgConfirm.code).toBe(ValidationCode.ORGANIZER_CONFIRMATION_REQUIRED);
      expect(orgConfirm.requiresConfirmation).toBe(true);
      console.log('✅ organizerConfirmationRequired function works');
      
      // Test last player constraint
      const lastPlayer = ValidationHelper.transactionValidation.lastPlayerExactAmount(75, 100, 'TestPlayer');
      expect(lastPlayer.isValid).toBe(false);
      expect(lastPlayer.code).toBe(ValidationCode.LAST_PLAYER_EXACT_AMOUNT_REQUIRED);
      expect(lastPlayer.title).toContain('🎯');
      console.log('✅ lastPlayerExactAmount function works');
      
      // Test invalid amount
      const invalidAmount = ValidationHelper.transactionValidation.invalidAmount(0, 1, 1000, 'cash_out');
      expect(invalidAmount.isValid).toBe(false);
      expect(invalidAmount.code).toBe(ValidationCode.INVALID_AMOUNT);
      expect(invalidAmount.title).toContain('💵');
      console.log('✅ invalidAmount function works');
      
      // Test success
      const success = ValidationHelper.transactionValidation.success({ sessionId: 'test', playerId: 'test', amount: 50 });
      expect(success.isValid).toBe(true);
      expect(success.code).toBeUndefined();
      console.log('✅ success function works');
      
      console.log('✅ All ValidationHelper functions working correctly');
    });
  });

  describe('Regression Prevention', () => {
    test('ValidationResult pattern must be consistent', () => {
      console.log('\n🛡️ CONSISTENCY TEST\n');
      
      // All ValidationResult objects should have consistent structure
      const testResults = [
        ValidationHelper.transactionValidation.insufficientPot(100, 50, 'TestPlayer'),
        ValidationHelper.transactionValidation.organizerConfirmationRequired(150, 'TestPlayer', 100),
        ValidationHelper.transactionValidation.lastPlayerExactAmount(75, 100, 'TestPlayer'),
        ValidationHelper.transactionValidation.invalidAmount(0, 1, 1000, 'cash_out'),
        ValidationHelper.transactionValidation.success({ sessionId: 'test', playerId: 'test', amount: 50 })
      ];
      
      for (const result of testResults) {
        // All must have isValid property
        expect(result.isValid).toBeDefined();
        expect(typeof result.isValid).toBe('boolean');
        
        if (!result.isValid) {
          // Failures must have code, title, and message
          expect(result.code).toBeDefined();
          expect(result.title).toBeDefined();
          expect(result.message).toBeDefined();
          expect(result.title.length).toBeGreaterThan(0);
          expect(result.message.length).toBeGreaterThan(0);
        }
      }
      
      console.log('✅ All ValidationResult objects have consistent structure');
    });
  });
});