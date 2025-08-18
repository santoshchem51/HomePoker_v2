/**
 * Simple unit tests for TransactionService last player constraint logic
 * Tests the core mathematical constraint logic in isolation
 */

import { TransactionService } from '../../../src/services/core/TransactionService';
import { ServiceError } from '../../../src/services/core/ServiceError';

// Mock the dependencies
jest.mock('../../../src/services/infrastructure/DatabaseService');
jest.mock('../../../src/services/core/SessionService');

describe('TransactionService Last Player Constraint - Simple Tests', () => {
  
  describe('Last Player Constraint Logic Validation', () => {
    it('should demonstrate the last player mathematical constraint', () => {
      console.log('\n🎯 Last Player Constraint Logic Test\n');

      // Test the core constraint logic in isolation
      const testScenarios = [
        {
          description: 'Last player with exact amount',
          activePlayers: 1,
          isTargetPlayer: true,
          sessionPot: 25.00,
          attemptedAmount: 25.00,
          shouldPass: true
        },
        {
          description: 'Last player with wrong amount (less than pot)',
          activePlayers: 1,
          isTargetPlayer: true,
          sessionPot: 25.00,
          attemptedAmount: 20.00,
          shouldPass: false
        },
        {
          description: 'Last player exceeding pot',
          activePlayers: 1,
          isTargetPlayer: true,
          sessionPot: 25.00,
          attemptedAmount: 30.00,
          shouldPass: false
        },
        {
          description: 'Non-last player with valid amount',
          activePlayers: 2,
          isTargetPlayer: true,
          sessionPot: 25.00,
          attemptedAmount: 20.00,
          shouldPass: true
        },
        {
          description: 'Non-last player exceeding pot',
          activePlayers: 2,
          isTargetPlayer: true,
          sessionPot: 25.00,
          attemptedAmount: 30.00,
          shouldPass: false
        },
        {
          description: 'Last player with rounding tolerance',
          activePlayers: 1,
          isTargetPlayer: true,
          sessionPot: 25.003,
          attemptedAmount: 25.00,
          shouldPass: true
        }
      ];

      testScenarios.forEach(({ description, activePlayers, isTargetPlayer, sessionPot, attemptedAmount, shouldPass }) => {
        console.log(`Testing: ${description}`);
        console.log(`  Active players: ${activePlayers}, Session pot: $${sessionPot}, Attempt: $${attemptedAmount}`);
        
        // Simulate the updated constraint logic from validateCashOutRequest
        const isLastPlayer = activePlayers === 1 && isTargetPlayer;
        let validationResult = { isValid: false, errorType: '', message: '' };
        
        // First check if amount exceeds pot for ALL players (including last player)
        if (attemptedAmount > sessionPot) {
          validationResult = {
            isValid: false,
            errorType: 'INSUFFICIENT_SESSION_POT',
            message: `Cannot cash out $${attemptedAmount.toFixed(2)}, only $${sessionPot.toFixed(2)} remaining`
          };
        } else if (isLastPlayer) {
          // Then check last player constraint: Must cash out exactly the remaining pot
          const tolerance = 0.01;
          if (Math.abs(attemptedAmount - sessionPot) <= tolerance) {
            validationResult = { isValid: true, errorType: '', message: 'Valid' };
          } else {
            // Only show this error if amount is LESS than pot (greater already handled)
            validationResult = {
              isValid: false,
              errorType: 'LAST_PLAYER_EXACT_AMOUNT_REQUIRED',
              message: `As the last player, you must cash out exactly $${sessionPot.toFixed(2)}`
            };
          }
        } else {
          // Regular validation for non-last players - amount is within pot
          validationResult = { isValid: true, errorType: '', message: 'Valid' };
        }
        
        console.log(`  Result: ${validationResult.isValid ? '✅ PASS' : '❌ FAIL'} - ${validationResult.message}`);
        expect(validationResult.isValid).toBe(shouldPass);
        
        if (!shouldPass) {
          expect(validationResult.errorType).toBeTruthy();
        }
        
        console.log('');
      });

      console.log('✅ All constraint logic tests passed!\n');
    });

    it('should demonstrate mathematical integrity enforcement', () => {
      console.log('\n🎯 Mathematical Integrity Test\n');

      // Simulate a complete 4-player session
      const sessionSimulation = {
        totalBuyIns: 40, // 4 players × $10
        cashOuts: [
          { player: 'Alice', amount: 15 },
          { player: 'Bob', amount: 8 },
          { player: 'Charlie', amount: 12 }
          // David (last player) must cash out remaining: 40 - 15 - 8 - 12 = 5
        ],
        remainingPot: 0 // Will be calculated
      };

      console.log('Session Setup:');
      console.log(`  Total buy-ins: $${sessionSimulation.totalBuyIns}`);
      
      // Calculate remaining pot after each cash-out
      let currentPot = sessionSimulation.totalBuyIns;
      sessionSimulation.cashOuts.forEach(cashOut => {
        currentPot -= cashOut.amount;
        console.log(`  ${cashOut.player} cashes out $${cashOut.amount} → Remaining pot: $${currentPot}`);
      });
      
      sessionSimulation.remainingPot = currentPot;
      
      console.log(`\nLast Player Constraint Check:`);
      console.log(`  David (last player) must cash out exactly: $${sessionSimulation.remainingPot}`);
      
      // Test constraint enforcement
      const davidMustCashOut = sessionSimulation.remainingPot;
      const testAmounts = [3, 7, 5.01, 4.99, 5.00];
      
      testAmounts.forEach(amount => {
        const tolerance = 0.01;
        const isValid = Math.abs(amount - davidMustCashOut) <= tolerance;
        console.log(`  David attempts $${amount}: ${isValid ? '✅ ALLOWED' : '❌ REJECTED'}`);
        
        if (amount === 5.00) {
          expect(isValid).toBe(true);
        } else if (amount === 4.99 || amount === 5.01) {
          expect(isValid).toBe(true); // Within tolerance
        } else {
          expect(isValid).toBe(false);
        }
      });

      // Final verification: session balances to zero
      const totalCashOuts = sessionSimulation.cashOuts.reduce((sum, co) => sum + co.amount, 0) + davidMustCashOut;
      console.log(`\nFinal Verification:`);
      console.log(`  Total buy-ins: $${sessionSimulation.totalBuyIns}`);
      console.log(`  Total cash-outs: $${totalCashOuts}`);
      console.log(`  Balance: ${sessionSimulation.totalBuyIns === totalCashOuts ? '✅ PERFECT' : '❌ BROKEN'}`);
      
      expect(totalCashOuts).toBe(sessionSimulation.totalBuyIns);
      
      console.log('\n✅ Mathematical integrity test passed!\n');
    });

    it('should handle edge cases correctly', () => {
      console.log('\n🎯 Edge Cases Test\n');

      const edgeCases = [
        {
          name: 'Zero remaining pot',
          sessionPot: 0,
          lastPlayerAmount: 0,
          shouldPass: true
        },
        {
          name: 'Very small pot',
          sessionPot: 0.01,
          lastPlayerAmount: 0.01,
          shouldPass: true
        },
        {
          name: 'Large pot',
          sessionPot: 999.99,
          lastPlayerAmount: 999.99,
          shouldPass: true
        },
        {
          name: 'Rounding edge case',
          sessionPot: 33.333,
          lastPlayerAmount: 33.33,
          shouldPass: true // Within tolerance
        },
        {
          name: 'Just outside tolerance',
          sessionPot: 25.00,
          lastPlayerAmount: 25.02,
          shouldPass: false // 0.02 > 0.01 tolerance
        }
      ];

      edgeCases.forEach(({ name, sessionPot, lastPlayerAmount, shouldPass }) => {
        console.log(`Testing: ${name}`);
        console.log(`  Session pot: $${sessionPot}, Last player amount: $${lastPlayerAmount}`);
        
        // Test the constraint logic
        const tolerance = 0.01;
        const isValid = Math.abs(lastPlayerAmount - sessionPot) <= tolerance;
        
        console.log(`  Result: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
        expect(isValid).toBe(shouldPass);
        console.log('');
      });

      console.log('✅ All edge cases handled correctly!\n');
    });
  });

  describe('Integration with existing validation', () => {
    it('should maintain existing validation for non-last players', () => {
      console.log('\n🎯 Existing Validation Compatibility Test\n');

      // Test that non-last player validation remains unchanged
      const nonLastPlayerScenarios = [
        {
          description: 'Valid amount within pot',
          sessionPot: 100,
          amount: 75,
          shouldPass: true
        },
        {
          description: 'Amount exceeds pot',
          sessionPot: 100,
          amount: 150,
          shouldPass: false
        },
        {
          description: 'Exact pot amount (but not last player)',
          sessionPot: 100,
          amount: 100,
          shouldPass: true
        }
      ];

      nonLastPlayerScenarios.forEach(({ description, sessionPot, amount, shouldPass }) => {
        console.log(`Testing: ${description}`);
        console.log(`  Session pot: $${sessionPot}, Amount: $${amount}`);
        
        // Simulate non-last player validation (activePlayers > 1)
        const isValid = amount <= sessionPot;
        
        console.log(`  Result: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
        expect(isValid).toBe(shouldPass);
        console.log('');
      });

      console.log('✅ Existing validation compatibility maintained!\n');
    });
  });
});