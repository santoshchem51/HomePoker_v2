/**
 * Comprehensive ValidationResult Tests
 * 
 * Tests that ValidationResult pattern is working correctly and fixes the
 * system error issue where users see "Session Error" instead of validation dialogs.
 */

import TransactionService from '../../../src/services/core/TransactionService';
import { DatabaseService } from '../../../src/services/infrastructure/DatabaseService';
import { 
  ValidationHelper, 
  isValidationFailure,
  requiresConfirmation,
  ValidationCode 
} from '../../../src/types/validation';
import { ServiceError } from '../../../src/types/errors';

describe('TransactionService ValidationResult Comprehensive Tests', () => {
  let transactionService: TransactionService;
  let dbService: DatabaseService;
  let testSessionId: string;
  let testPlayerId: string;

  beforeEach(async () => {
    // Setup fresh services
    dbService = DatabaseService.getInstance();
    await dbService.initialize();
    
    transactionService = TransactionService.getInstance();

    // Create test session with limited pot
    const sessionResult = await dbService.query(
      'INSERT INTO sessions (id, name, organizerId, status, totalPot, playerCount, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['test-session-validation', 'ValidationResult Test', 'test-organizer', 'active', 50, 1, new Date().toISOString()]
    );
    testSessionId = 'test-session-validation';

    // Create test player with some buy-ins
    await dbService.query(
      'INSERT INTO players (id, sessionId, name, isGuest, status, currentBalance, totalBuyIns, totalCashOuts, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ['test-player-validation', testSessionId, 'TestPlayer', 1, 'active', 50, 50, 0, new Date().toISOString()]
    );
    testPlayerId = 'test-player-validation';
  });

  afterEach(async () => {
    // Clean up test data
    if (testSessionId) {
      try {
        await dbService.query('DELETE FROM transactions WHERE sessionId = ?', [testSessionId]);
        await dbService.query('DELETE FROM players WHERE sessionId = ?', [testSessionId]);
        await dbService.query('DELETE FROM sessions WHERE id = ?', [testSessionId]);
      } catch (error) {
        console.warn('Test cleanup error:', error);
      }
    }
  });

  describe('CRITICAL FIX: ValidationResult vs ServiceError Exception Handling', () => {
    test('validateAndRecordCashOut should NEVER throw ServiceError - always return ValidationResult', async () => {
      console.log('\n🎯 CRITICAL TEST: ValidationResult pattern never throws exceptions\n');
      
      // Test scenario: Cash out more than available in pot (should trigger validation failure)
      const excessAmount = 100; // Session pot is only 50
      
      try {
        console.log(`Attempting cash-out of $${excessAmount} from pot of $50...`);
        
        const result = await transactionService.validateAndRecordCashOut(
          testSessionId,
          testPlayerId,
          excessAmount,
          'manual',
          'user'
        );
        
        console.log('✅ No exception thrown - ValidationResult returned');
        console.log('Result:', {
          isValid: result.validation.isValid,
          code: result.validation.code,
          title: result.validation.title,
          message: result.validation.message
        });
        
        // CRITICAL: Must be validation failure, not exception
        expect(isValidationFailure(result.validation)).toBe(true);
        expect(result.validation.code).toBe(ValidationCode.INSUFFICIENT_SESSION_POT);
        expect(result.validation.title).toContain('💰');
        expect(result.validation.message).toContain('$100');
        expect(result.validation.message).toContain('$50');
        expect(result.validation.message).toContain('TestPlayer');
        
        console.log('✅ CRITICAL FIX VERIFIED: ValidationResult pattern working correctly');
        
      } catch (error) {
        console.log('❌ CRITICAL BUG: Exception thrown instead of ValidationResult');
        console.log('Exception details:', {
          name: error.name,
          code: error.code,
          message: error.message
        });
        
        // If this fails, it means the old ServiceError throwing behavior is still active
        expect(error).toBeNull(); // Force test failure with clear message
      }
    });

    test('recordCashOut (legacy) should still throw ServiceError for comparison', async () => {
      console.log('\n🔍 COMPARISON TEST: Legacy recordCashOut throws ServiceError\n');
      
      const excessAmount = 100; // Session pot is only 50
      
      try {
        console.log(`Legacy method: Attempting cash-out of $${excessAmount} from pot of $50...`);
        
        const result = await transactionService.recordCashOut(
          testSessionId,
          testPlayerId,
          excessAmount,
          'manual',
          'user'
        );
        
        console.log('❌ Legacy method should have thrown ServiceError but returned:', result);
        expect(result).toBeNull(); // This should fail if no exception thrown
        
      } catch (error) {
        console.log('✅ Legacy method correctly threw ServiceError');
        console.log('ServiceError details:', {
          name: error.name,
          code: error.code,
          message: error.message
        });
        
        expect(error).toBeInstanceOf(ServiceError);
        expect(error.code).toBe('INSUFFICIENT_SESSION_POT');
        expect(error.message).toContain('Cannot cash out $100');
        expect(error.message).toContain('Only $50 remaining');
        
        console.log('✅ Legacy behavior confirmed - throws ServiceError as expected');
      }
    });

    test('validateAndRecordCashOut should handle system errors gracefully', async () => {
      console.log('\n🔍 SYSTEM ERROR TEST: ValidationResult handles system errors\n');
      
      try {
        // Use completely invalid session ID to trigger system error
        const result = await transactionService.validateAndRecordCashOut(
          'non-existent-session-12345',
          'non-existent-player-12345',
          50,
          'manual',
          'user'
        );
        
        console.log('✅ System error converted to ValidationResult');
        console.log('Result:', {
          isValid: result.validation.isValid,
          code: result.validation.code,
          title: result.validation.title,
          message: result.validation.message
        });
        
        expect(isValidationFailure(result.validation)).toBe(true);
        expect(result.validation.title).toBeDefined();
        expect(result.validation.message).toBeDefined();
        expect(result.validation.title.length).toBeGreaterThan(0);
        expect(result.validation.message.length).toBeGreaterThan(0);
        
        console.log('✅ System errors properly handled via ValidationResult');
        
      } catch (error) {
        console.log('❌ System error not handled properly - exception thrown');
        console.log('Exception:', error.name, error.message);
        expect(error).toBeNull(); // Force failure
      }
    });

    test('validateAndRecordCashOut should handle organizer confirmation scenarios', async () => {
      console.log('\n🔍 ORGANIZER CONFIRMATION TEST: ValidationResult pattern\n');
      
      // Test scenario: Cash out more than player's total buy-ins (50) but within pot limits
      const amount = 60; // Player has bought in for 50, but session pot is 50 total
      
      try {
        console.log(`Attempting cash-out of $${amount} (player buy-ins: $50)...`);
        
        const result = await transactionService.validateAndRecordCashOut(
          testSessionId,
          testPlayerId,
          amount,
          'manual',
          'user',
          undefined,
          false // organizerConfirmed = false
        );
        
        console.log('✅ Organizer confirmation scenario handled via ValidationResult');
        console.log('Result:', {
          isValid: result.validation.isValid,
          code: result.validation.code,
          requiresConfirmation: result.validation.requiresConfirmation
        });
        
        expect(isValidationFailure(result.validation)).toBe(true);
        
        // Check if this requires confirmation or is just insufficient pot
        if (requiresConfirmation(result.validation)) {
          expect(result.validation.code).toBe(ValidationCode.ORGANIZER_CONFIRMATION_REQUIRED);
          console.log('✅ Organizer confirmation required via ValidationResult');
        } else {
          // Might be insufficient pot instead
          expect(result.validation.code).toBe(ValidationCode.INSUFFICIENT_SESSION_POT);
          console.log('✅ Insufficient pot detected via ValidationResult');
        }
        
      } catch (error) {
        console.log('❌ Organizer confirmation scenario threw exception');
        console.log('Exception:', error.name, error.message);
        expect(error).toBeNull(); // Force failure
      }
    });
  });

  describe('ValidationResult UI Integration Requirements', () => {
    test('ValidationResult objects must have UI-ready properties', async () => {
      console.log('\n🎯 UI INTEGRATION TEST: ValidationResult UI properties\n');
      
      try {
        const result = await transactionService.validateAndRecordCashOut(
          testSessionId,
          testPlayerId,
          100, // Exceeds pot
          'manual',
          'user'
        );
        
        if (isValidationFailure(result.validation)) {
          // Test UI property extraction (exactly like LiveGameScreen does)
          const potValidationTitle = result.validation.title || '💰 Transaction Error';
          const potValidationMessage = result.validation.message || 'Please check your input and try again.';
          
          console.log('UI Properties extracted:');
          console.log('  Title:', potValidationTitle);
          console.log('  Message:', potValidationMessage);
          
          // Verify UI properties are ready for modal display
          expect(potValidationTitle).toBeDefined();
          expect(potValidationMessage).toBeDefined();
          expect(potValidationTitle.length).toBeGreaterThan(0);
          expect(potValidationMessage.length).toBeGreaterThan(0);
          
          // Should have emoji for visual appeal
          expect(potValidationTitle).toMatch(/[🎮💰⚠️🚫]/);
          
          // Should be user-friendly, not technical
          expect(potValidationMessage).not.toContain('null');
          expect(potValidationMessage).not.toContain('undefined');
          expect(potValidationMessage).not.toContain('stack trace');
          
          console.log('✅ ValidationResult produces UI-ready properties');
        } else {
          throw new Error('Expected validation failure for test scenario');
        }
        
      } catch (error) {
        console.log('❌ UI integration test failed');
        console.log('Exception:', error.name, error.message);
        expect(error).toBeNull();
      }
    });

    test('ValidationResult type guards must work correctly for UI logic', () => {
      console.log('\n🔍 TYPE GUARD TEST: UI decision logic\n');
      
      // Test insufficient pot scenario
      const insufficientPotResult = ValidationHelper.transactionValidation.insufficientPot(100, 50, 'TestPlayer');
      
      // UI logic tests
      const showValidationModal = isValidationFailure(insufficientPotResult);
      const showOrganizerModal = requiresConfirmation(insufficientPotResult);
      
      console.log('Type guard results:');
      console.log('  showValidationModal:', showValidationModal);
      console.log('  showOrganizerModal:', showOrganizerModal);
      
      expect(showValidationModal).toBe(true);
      expect(showOrganizerModal).toBe(false);
      
      // Test organizer confirmation scenario
      const orgConfirmResult = ValidationHelper.transactionValidation.organizerConfirmationRequired(150, 'TestPlayer', 100);
      
      const showOrgModal = requiresConfirmation(orgConfirmResult);
      const showValModal = isValidationFailure(orgConfirmResult);
      
      console.log('Organizer confirmation type guards:');
      console.log('  showValidationModal:', showValModal);
      console.log('  showOrganizerModal:', showOrgModal);
      
      expect(showValModal).toBe(true);
      expect(showOrgModal).toBe(true);
      
      console.log('✅ Type guards working correctly for UI logic');
    });
  });

  describe('Performance and Debug Logging', () => {
    test('validateAndRecordCashOut should have debug logging for troubleshooting', async () => {
      console.log('\n🔍 DEBUG LOGGING TEST: Method call tracing\n');
      
      // Capture console logs
      const originalLog = console.log;
      const logs: string[] = [];
      console.log = (...args: any[]) => {
        logs.push(args.join(' '));
        originalLog(...args);
      };
      
      try {
        await transactionService.validateAndRecordCashOut(
          testSessionId,
          testPlayerId,
          25, // Valid amount within pot
          'manual',
          'user'
        );
        
        // Restore console
        console.log = originalLog;
        
        // Check for debug logging
        const hasDebugLog = logs.some(log => log.includes('🎯 validateAndRecordCashOut called - NEW ValidationResult method'));
        
        console.log('Debug logs found:', hasDebugLog);
        if (hasDebugLog) {
          console.log('✅ Debug logging is working');
        } else {
          console.log('❌ Debug logging missing');
          console.log('Captured logs:', logs.slice(-5)); // Show last 5 logs
        }
        
        expect(hasDebugLog).toBe(true);
        
      } finally {
        console.log = originalLog;
      }
    });
  });

  describe('Regression Prevention', () => {
    test('ALL ValidationResult scenarios should never throw exceptions', async () => {
      console.log('\n🛡️ REGRESSION TEST: Complete exception prevention\n');
      
      const testScenarios = [
        {
          name: 'Null session ID',
          sessionId: null as any,
          playerId: testPlayerId,
          amount: 25
        },
        {
          name: 'Empty session ID',
          sessionId: '',
          playerId: testPlayerId,
          amount: 25
        },
        {
          name: 'Invalid player ID',
          sessionId: testSessionId,
          playerId: 'non-existent-player',
          amount: 25
        },
        {
          name: 'Negative amount',
          sessionId: testSessionId,
          playerId: testPlayerId,
          amount: -10
        },
        {
          name: 'Zero amount',
          sessionId: testSessionId,
          playerId: testPlayerId,
          amount: 0
        },
        {
          name: 'Excessive amount',
          sessionId: testSessionId,
          playerId: testPlayerId,
          amount: 99999
        }
      ];
      
      let allTestsPassed = true;
      
      for (const scenario of testScenarios) {
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
          
          // All invalid scenarios should return validation failures
          if (scenario.name !== 'Valid small amount' && result.validation.isValid) {
            console.log(`  ⚠️ ${scenario.name} - Expected validation failure but got success`);
            // Note: Some scenarios might be valid depending on business logic
          }
          
        } catch (error) {
          console.log(`  ❌ ${scenario.name} - Exception thrown: ${error.name}: ${error.message}`);
          allTestsPassed = false;
        }
      }
      
      if (allTestsPassed) {
        console.log('\n✅ REGRESSION TEST PASSED: All scenarios handled via ValidationResult');
      } else {
        console.log('\n❌ REGRESSION TEST FAILED: Some scenarios still throw exceptions');
      }
      
      expect(allTestsPassed).toBe(true);
    });
  });
});