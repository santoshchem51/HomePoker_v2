/**
 * Test to verify ValidationResult pattern never throws exceptions
 */

import TransactionService from '../../../src/services/core/TransactionService';
import { isValidationFailure } from '../../../src/types/validation';

describe('TransactionService ValidationResult Pattern Fix', () => {
  let transactionService: TransactionService;

  beforeAll(() => {
    transactionService = TransactionService.getInstance();
  });

  test('validateAndRecordCashOut should NEVER throw exceptions - always return ValidationResult', async () => {
    console.log('\n🧪 TESTING: ValidationResult pattern never throws exceptions\n');

    // Test with completely invalid data that would cause database/system errors
    const invalidScenarios = [
      {
        name: 'Non-existent session',
        sessionId: 'invalid-session-id',
        playerId: 'invalid-player-id',
        amount: 100
      },
      {
        name: 'Null session ID',
        sessionId: null as any,
        playerId: 'test-player',
        amount: 50
      },
      {
        name: 'Invalid amount',
        sessionId: 'test-session',
        playerId: 'test-player',
        amount: -100 // negative amount
      }
    ];

    let allTestsPassed = true;

    for (const scenario of invalidScenarios) {
      try {
        console.log(`Testing scenario: ${scenario.name}`);
        
        const result = await transactionService.validateAndRecordCashOut(
          scenario.sessionId,
          scenario.playerId,
          scenario.amount,
          'manual',
          'test',
          undefined,
          false
        );

        console.log(`✅ ${scenario.name} - No exception thrown`);
        console.log(`   Result: isValid=${result.validation.isValid}, code=${result.validation.code}`);

        // Verify it's a validation failure
        if (result.validation.isValid) {
          console.log(`❌ ${scenario.name} - Should have returned validation failure`);
          allTestsPassed = false;
        } else {
          console.log(`✅ ${scenario.name} - Correctly returned validation failure`);
        }

        // Verify proper ValidationResult structure
        expect(result).toHaveProperty('validation');
        expect(result.validation).toHaveProperty('isValid');
        expect(result.validation).toHaveProperty('code');
        expect(result.validation).toHaveProperty('message');
        expect(isValidationFailure(result.validation)).toBe(true);

      } catch (error) {
        console.log(`❌ ${scenario.name} - THREW EXCEPTION (BUG!)`);
        console.log(`   Exception: ${error.name}: ${error.message}`);
        allTestsPassed = false;
        
        // This should never happen with the ValidationResult pattern
        expect(error).toBeNull(); // Force test failure
      }
    }

    if (allTestsPassed) {
      console.log('\n✅ ALL TESTS PASSED: ValidationResult pattern working correctly');
      console.log('🎉 No exceptions thrown - validation errors returned as ValidationResult objects');
    } else {
      console.log('\n❌ SOME TESTS FAILED: ValidationResult pattern has bugs');
    }

    expect(allTestsPassed).toBe(true);
  });

  test('validateAndRecordCashOut should have debug logging', async () => {
    console.log('\n🧪 TESTING: Debug logging is present\n');

    // Capture console.log to verify our debug logging is working
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
        'test'
      );

      // Restore console.log
      console.log = originalLog;

      // Verify debug log was captured
      const hasDebugLog = logs.some(log => log.includes('🎯 validateAndRecordCashOut called - NEW ValidationResult method'));
      
      if (hasDebugLog) {
        console.log('✅ Debug logging is working - method call traced');
      } else {
        console.log('❌ Debug logging not found');
        console.log('Captured logs:', logs);
      }

      expect(hasDebugLog).toBe(true);

    } catch (error) {
      console.log = originalLog;
      throw error;
    }
  });
});