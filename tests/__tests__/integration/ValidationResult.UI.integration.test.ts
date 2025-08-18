/**
 * ValidationResult UI Integration Test
 * 
 * Verifies that ValidationResult objects from TransactionService
 * are properly converted to UI modal props in LiveGameScreen
 */

import TransactionService from '../../../src/services/core/TransactionService';
import { 
  ValidationHelper, 
  isValidationFailure,
  requiresConfirmation,
  TransactionValidationResult 
} from '../../../src/types/validation';

describe('ValidationResult UI Integration', () => {
  let transactionService: TransactionService;

  beforeAll(() => {
    transactionService = TransactionService.getInstance();
  });

  describe('ValidationResult to UI Props Conversion', () => {
    test('should verify insufficient pot error produces correct UI props', async () => {
      console.log('\n🔍 TESTING ValidationResult → UI Props Conversion\n');
      
      try {
        // Call validateAndRecordCashOut with invalid session (should trigger system error)
        const result = await transactionService.validateAndRecordCashOut(
          'non-existent-session',
          'non-existent-player',
          100,
          'manual',
          'test'
        );
        
        console.log('✅ validateAndRecordCashOut returned result (no exception)');
        
        if (isValidationFailure(result.validation)) {
          console.log('✅ ValidationResult failure detected');
          
          // Extract UI props exactly like LiveGameScreen.tsx line 221-222
          const potValidationTitle = result.validation.title || '💰 Transaction Error';
          const potValidationMessage = result.validation.message || 'Please check your input and try again.';
          
          console.log('UI Props extracted:');
          console.log('  Title:', potValidationTitle);
          console.log('  Message:', potValidationMessage);
          
          // Verify UI props are user-friendly
          expect(potValidationTitle).toContain('🚫'); // Should have emoji
          expect(potValidationMessage).toContain('system error'); // Should be user-friendly
          expect(potValidationMessage).not.toContain('null'); // No technical details
          expect(potValidationMessage).not.toContain('undefined');
          
          // Verify ConfirmationDialog would receive proper props
          const modalProps = {
            visible: true, // This would be showPotValidationError state
            title: potValidationTitle,
            message: potValidationMessage,
            confirmText: 'OK',
            cancelText: undefined,
            confirmStyle: 'default'
          };
          
          console.log('✅ Modal props would be:', modalProps);
          
          // Verify modal props are valid
          expect(modalProps.title).toBeDefined();
          expect(modalProps.message).toBeDefined();
          expect(modalProps.title.length).toBeGreaterThan(0);
          expect(modalProps.message.length).toBeGreaterThan(0);
          
        } else {
          console.log('❌ ValidationResult should have returned failure for invalid session');
          expect(result.validation.isValid).toBe(false);
        }
        
      } catch (error) {
        console.log('❌ CRITICAL BUG: Exception thrown instead of ValidationResult');
        console.log('Exception:', error.name, error.message);
        expect(error).toBeNull(); // This should fail if exception thrown
      }
    });

    test('should test organizer confirmation ValidationResult flow', () => {
      console.log('\n🔍 TESTING Organizer Confirmation UI Flow\n');
      
      // Create a validation result that requires confirmation
      const confirmationResult = ValidationHelper.transactionValidation.requiresOrganizerConfirmation(
        150, // amount
        100, // total buy-ins  
        'TestPlayer'
      );
      
      console.log('Organizer confirmation ValidationResult:', {
        isValid: confirmationResult.isValid,
        code: confirmationResult.code,
        title: confirmationResult.title,
        message: confirmationResult.message
      });
      
      // Verify this would trigger organizer confirmation UI
      const needsConfirmation = requiresConfirmation(confirmationResult);
      console.log('requiresConfirmation():', needsConfirmation);
      
      expect(needsConfirmation).toBe(true);
      expect(confirmationResult.code).toBe('REQUIRES_ORGANIZER_CONFIRMATION');
      expect(confirmationResult.title).toContain('🎯'); // Should have emoji
      expect(confirmationResult.message).toContain('TestPlayer');
      expect(confirmationResult.message).toContain('$150');
      expect(confirmationResult.message).toContain('$100');
      
      console.log('✅ Organizer confirmation UI flow validation complete');
    });

    test('should test success ValidationResult produces no modal', () => {
      console.log('\n🔍 TESTING Success ValidationResult (no modal)\n');
      
      const successResult = ValidationHelper.transactionValidation.success({
        sessionId: 'test',
        playerId: 'test', 
        amount: 50
      });
      
      console.log('Success ValidationResult:', {
        isValid: successResult.isValid,
        code: successResult.code
      });
      
      // Success should not trigger modal
      const isFailure = isValidationFailure(successResult);
      const needsConfirmation = requiresConfirmation(successResult);
      
      console.log('isValidationFailure():', isFailure);
      console.log('requiresConfirmation():', needsConfirmation);
      
      expect(isFailure).toBe(false);
      expect(needsConfirmation).toBe(false);
      expect(successResult.isValid).toBe(true);
      
      // UI behavior: No modal should be shown
      const showPotValidationError = isFailure; // This would be false
      const showOrganizerConfirmation = needsConfirmation; // This would be false
      
      console.log('UI state: showPotValidationError =', showPotValidationError);
      console.log('UI state: showOrganizerConfirmation =', showOrganizerConfirmation);
      
      expect(showPotValidationError).toBe(false);
      expect(showOrganizerConfirmation).toBe(false);
      
      console.log('✅ Success ValidationResult correctly produces no modal');
    });
  });

  describe('ValidationResult Type Guard Functions', () => {
    test('should verify all ValidationResult type guards work correctly', () => {
      console.log('\n🔍 TESTING ValidationResult Type Guards\n');
      
      // Test insufficient pot scenario
      const insufficientPot = ValidationHelper.transactionValidation.insufficientPot(100, 50, 'TestPlayer');
      
      expect(isValidationFailure(insufficientPot)).toBe(true);
      expect(requiresConfirmation(insufficientPot)).toBe(false);
      
      console.log('✅ isValidationFailure() works for insufficient pot');
      
      // Test organizer confirmation scenario  
      const orgConfirm = ValidationHelper.transactionValidation.requiresOrganizerConfirmation(150, 100, 'TestPlayer');
      
      expect(isValidationFailure(orgConfirm)).toBe(true);
      expect(requiresConfirmation(orgConfirm)).toBe(true);
      
      console.log('✅ requiresConfirmation() works for organizer confirmation');
      
      // Test success scenario
      const success = ValidationHelper.transactionValidation.success({ sessionId: 'test', playerId: 'test', amount: 50 });
      
      expect(isValidationFailure(success)).toBe(false);
      expect(requiresConfirmation(success)).toBe(false);
      
      console.log('✅ Type guards work correctly for success');
      console.log('✅ All ValidationResult type guards verified');
    });
  });
});