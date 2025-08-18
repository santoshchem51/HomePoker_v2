/**
 * TransactionService Method Path Investigation
 * 
 * This test determines exactly which method is being called and why
 * the ValidationResult system isn't working as expected.
 */

import TransactionService from '../../../src/services/core/TransactionService';
import { DatabaseService } from '../../../src/services/infrastructure/DatabaseService';
import { SessionService } from '../../../src/services/core/SessionService';
import { ServiceError } from '../../../src/services/core/ServiceError';
import { ValidationHelper, isValidationFailure } from '../../../src/types/validation';
describe('TransactionService Method Path Investigation', () => {
  let transactionService: TransactionService;
  let dbService: DatabaseService;
  let sessionService: SessionService;
  let testSessionId: string;
  let testPlayerId: string;

  beforeEach(async () => {
    // Setup fresh services
    dbService = DatabaseService.getInstance();
    await dbService.initialize();
    
    sessionService = SessionService.getInstance();
    transactionService = TransactionService.getInstance();

    // Create test session manually
    const sessionResult = await dbService.query(
      'INSERT INTO sessions (id, name, organizerId, status, totalPot, playerCount, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['test-session', 'Method Path Test', 'test-organizer', 'active', 50, 1, new Date().toISOString()]
    );
    testSessionId = 'test-session';

    // Create test player manually
    const playerResult = await dbService.query(
      'INSERT INTO players (id, sessionId, name, isGuest, status, currentBalance, totalBuyIns, totalCashOuts, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ['test-player', testSessionId, 'TestPlayer', 1, 'active', 25, 25, 0, new Date().toISOString()]
    );
    testPlayerId = 'test-player';
  });

  describe('Method Call Path Detection', () => {
    test('should identify which validateAndRecordCashOut vs recordCashOut is being called', async () => {
      console.log('\n🔍 TESTING METHOD CALL PATHS\n');
      
      // Test 1: Direct call to validateAndRecordCashOut (NEW method)
      console.log('=== TEST 1: validateAndRecordCashOut (NEW ValidationResult method) ===');
      try {
        const result = await transactionService.validateAndRecordCashOut(
          testSessionId, 
          testPlayerId, 
          100, // Amount exceeds pot (50) 
          'manual',
          'test',
          undefined,
          false
        );
        
        console.log('✅ validateAndRecordCashOut returned:', {
          isValid: result.validation.isValid,
          code: result.validation.code,
          message: result.validation.message,
          hasTransaction: !!result.transaction
        });
        
        if (isValidationFailure(result.validation)) {
          console.log('✅ ValidationResult pattern working correctly - no exceptions thrown');
        } else {
          console.log('❌ ValidationResult pattern failed - should have returned validation failure');
        }
        
      } catch (error) {
        console.log('❌ validateAndRecordCashOut threw exception (BUG!):', {
          name: error.name,
          code: error.code,
          message: error.message
        });
        
        if (error instanceof ServiceError) {
          console.log('❌ CRITICAL BUG: validateAndRecordCashOut is throwing ServiceError instead of returning ValidationResult');
        }
      }

      console.log('\n=== TEST 2: recordCashOut (OLD legacy method) ===');
      try {
        const transaction = await transactionService.recordCashOut(
          testSessionId,
          testPlayerId,
          100, // Amount exceeds pot
          'manual',
          'test',
          undefined,
          false
        );
        
        console.log('❌ recordCashOut should have thrown exception but returned:', transaction);
        
      } catch (error) {
        console.log('✅ recordCashOut threw expected ServiceError:', {
          name: error.name,
          code: error.code,
          message: error.message
        });
        
        if (error instanceof ServiceError && error.code === 'INSUFFICIENT_SESSION_POT') {
          console.log('✅ Legacy method behaving as expected (throws ServiceError)');
        }
      }
    });

    test('should identify if LiveGameScreen is calling the wrong method', async () => {
      console.log('\n🔍 SIMULATING LIVEGAMESCREEN CALL PATTERN\n');
      
      // Simulate the exact call pattern from LiveGameScreen.tsx line 196-204
      console.log('=== SIMULATING LiveGameScreen handleModalSubmit cash-out ===');
      
      try {
        // This is exactly what LiveGameScreen.tsx line 196-204 does
        const result = await transactionService.validateAndRecordCashOut(
          testSessionId, 
          testPlayerId, 
          100, // exceeds pot
          'manual', // method
          'user',   // createdBy
          undefined, // description
          false     // organizerConfirmed
        );
        
        if (isValidationFailure(result.validation)) {
          console.log('✅ LiveGameScreen pattern should work - ValidationResult returned');
          console.log('Expected UI behavior: Show modal with title:', result.validation.title);
          console.log('Expected UI behavior: Show message:', result.validation.message);
        } else {
          console.log('❌ LiveGameScreen pattern failed - validation should have failed');
        }
        
      } catch (error) {
        console.log('❌ CRITICAL: LiveGameScreen pattern threw exception instead of ValidationResult');
        console.log('This explains why user sees Session Error page instead of validation dialog');
        console.log('Exception details:', {
          name: error.name,
          code: error.code,
          message: error.message
        });
      }
    });

    test('should test the ValidationHelper.insufficientPot function directly', () => {
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
    });
  });

  describe('Method Signature Validation', () => {
    test('should verify both methods exist with correct signatures', () => {
      console.log('\n🔍 VERIFYING METHOD SIGNATURES\n');
      
      // Check if both methods exist
      expect(typeof transactionService.validateAndRecordCashOut).toBe('function');
      expect(typeof transactionService.recordCashOut).toBe('function');
      
      console.log('✅ Both validateAndRecordCashOut and recordCashOut methods exist');
      
      // Check method lengths (parameter count)
      console.log('validateAndRecordCashOut parameter count:', transactionService.validateAndRecordCashOut.length);
      console.log('recordCashOut parameter count:', transactionService.recordCashOut.length);
    });
  });

  afterEach(async () => {
    // Clean up test data
    if (testSessionId) {
      try {
        await dbService.query('DELETE FROM transactions WHERE sessionId = ?', [testSessionId]);
        await dbService.query('DELETE FROM players WHERE sessionId = ?', [testSessionId]);
        await dbService.query('DELETE FROM sessions WHERE id = ?', [testSessionId]);
      } catch (error) {
        console.warn('Cleanup error:', error);
      }
    }
  });
});