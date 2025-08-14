/**
 * CalculationUtils Test Suite
 * Story 5.3: Comprehensive Testing Suite - Task 1
 * Critical financial calculations require 95% coverage
 */

import { CalculationUtils } from '@/utils/calculations';

describe('CalculationUtils - Financial Precision Testing', () => {
  describe('addAmounts - Currency Addition', () => {
    it('should add two positive amounts correctly', () => {
      expect(CalculationUtils.addAmounts(10.50, 5.25)).toBe(15.75);
      expect(CalculationUtils.addAmounts(100.00, 200.00)).toBe(300.00);
      expect(CalculationUtils.addAmounts(0.01, 0.01)).toBe(0.02);
    });

    it('should handle floating-point precision issues', () => {
      // Classic floating-point problem: 0.1 + 0.2 = 0.30000000000000004
      expect(CalculationUtils.addAmounts(0.1, 0.2)).toBe(0.3);
      expect(CalculationUtils.addAmounts(0.7, 0.1)).toBe(0.8);
      expect(CalculationUtils.addAmounts(0.6, 0.3)).toBe(0.9);
    });

    it('should add negative amounts correctly', () => {
      expect(CalculationUtils.addAmounts(-10.50, -5.25)).toBe(-15.75);
      expect(CalculationUtils.addAmounts(-100.00, -200.00)).toBe(-300.00);
      expect(CalculationUtils.addAmounts(-0.01, -0.01)).toBe(-0.02);
    });

    it('should handle mixed positive and negative amounts', () => {
      expect(CalculationUtils.addAmounts(10.50, -5.25)).toBe(5.25);
      expect(CalculationUtils.addAmounts(-10.50, 5.25)).toBe(-5.25);
      expect(CalculationUtils.addAmounts(100.00, -100.00)).toBe(0);
    });

    it('should handle zero amounts', () => {
      expect(CalculationUtils.addAmounts(0, 0)).toBe(0);
      expect(CalculationUtils.addAmounts(10.50, 0)).toBe(10.50);
      expect(CalculationUtils.addAmounts(0, 10.50)).toBe(10.50);
    });

    it('should handle large currency amounts', () => {
      expect(CalculationUtils.addAmounts(999999.99, 0.01)).toBe(1000000.00);
      expect(CalculationUtils.addAmounts(1000000.00, 1000000.00)).toBe(2000000.00);
    });

    it('should handle many decimal places with rounding', () => {
      // Values with more than 2 decimal places should be rounded
      expect(CalculationUtils.addAmounts(10.999, 5.001)).toBe(16.00);
      expect(CalculationUtils.addAmounts(10.994, 5.005)).toBe(15.99);
      expect(CalculationUtils.addAmounts(10.995, 5.005)).toBe(16.00);
    });

    it('should maintain precision for poker chip denominations', () => {
      // Common poker chip values
      expect(CalculationUtils.addAmounts(0.25, 0.25)).toBe(0.50); // Quarters
      expect(CalculationUtils.addAmounts(0.50, 0.50)).toBe(1.00); // Half dollars
      expect(CalculationUtils.addAmounts(1.00, 1.00)).toBe(2.00); // Singles
      expect(CalculationUtils.addAmounts(5.00, 5.00)).toBe(10.00); // Fives
      expect(CalculationUtils.addAmounts(25.00, 25.00)).toBe(50.00); // Quarters (25s)
    });
  });

  describe('subtractAmounts - Currency Subtraction', () => {
    it('should subtract two positive amounts correctly', () => {
      expect(CalculationUtils.subtractAmounts(15.75, 5.25)).toBe(10.50);
      expect(CalculationUtils.subtractAmounts(300.00, 200.00)).toBe(100.00);
      expect(CalculationUtils.subtractAmounts(0.02, 0.01)).toBe(0.01);
    });

    it('should handle floating-point precision issues', () => {
      // Classic floating-point problem: 0.3 - 0.2 = 0.09999999999999998
      expect(CalculationUtils.subtractAmounts(0.3, 0.2)).toBe(0.1);
      expect(CalculationUtils.subtractAmounts(0.8, 0.1)).toBe(0.7);
      expect(CalculationUtils.subtractAmounts(0.9, 0.3)).toBe(0.6);
    });

    it('should handle negative results', () => {
      expect(CalculationUtils.subtractAmounts(5.25, 10.50)).toBe(-5.25);
      expect(CalculationUtils.subtractAmounts(100.00, 300.00)).toBe(-200.00);
      expect(CalculationUtils.subtractAmounts(0.01, 0.02)).toBe(-0.01);
    });

    it('should handle negative amounts', () => {
      expect(CalculationUtils.subtractAmounts(-10.50, -5.25)).toBe(-5.25);
      expect(CalculationUtils.subtractAmounts(-5.25, -10.50)).toBe(5.25);
      expect(CalculationUtils.subtractAmounts(-100.00, -100.00)).toBe(0);
    });

    it('should handle zero amounts', () => {
      expect(CalculationUtils.subtractAmounts(0, 0)).toBe(0);
      expect(CalculationUtils.subtractAmounts(10.50, 0)).toBe(10.50);
      expect(CalculationUtils.subtractAmounts(0, 10.50)).toBe(-10.50);
    });

    it('should handle large currency amounts', () => {
      expect(CalculationUtils.subtractAmounts(1000000.00, 0.01)).toBe(999999.99);
      expect(CalculationUtils.subtractAmounts(2000000.00, 1000000.00)).toBe(1000000.00);
    });

    it('should handle many decimal places with rounding', () => {
      // Values with more than 2 decimal places should be rounded
      expect(CalculationUtils.subtractAmounts(16.999, 5.001)).toBe(11.99);
      expect(CalculationUtils.subtractAmounts(16.005, 5.994)).toBe(10.01);
      expect(CalculationUtils.subtractAmounts(16.005, 5.995)).toBe(10.01);
    });

    it('should calculate poker session balances correctly', () => {
      // Common poker session calculations
      expect(CalculationUtils.subtractAmounts(100.00, 50.00)).toBe(50.00); // Buy-in minus cash-out
      expect(CalculationUtils.subtractAmounts(50.00, 100.00)).toBe(-50.00); // Loss scenario
      expect(CalculationUtils.subtractAmounts(200.00, 200.00)).toBe(0); // Break even
    });
  });

  describe('roundToCurrency - Currency Rounding', () => {
    it('should round to 2 decimal places', () => {
      expect(CalculationUtils.roundToCurrency(10.999)).toBe(11.00);
      expect(CalculationUtils.roundToCurrency(10.994)).toBe(10.99);
      expect(CalculationUtils.roundToCurrency(10.995)).toBe(11.00);
      expect(CalculationUtils.roundToCurrency(10.001)).toBe(10.00);
    });

    it('should handle already rounded values', () => {
      expect(CalculationUtils.roundToCurrency(10.00)).toBe(10.00);
      expect(CalculationUtils.roundToCurrency(10.50)).toBe(10.50);
      expect(CalculationUtils.roundToCurrency(10.99)).toBe(10.99);
    });

    it('should handle negative values', () => {
      expect(CalculationUtils.roundToCurrency(-10.999)).toBe(-11.00);
      expect(CalculationUtils.roundToCurrency(-10.994)).toBe(-10.99);
      expect(CalculationUtils.roundToCurrency(-10.995)).toBe(-11.00);
      expect(CalculationUtils.roundToCurrency(-10.001)).toBe(-10.00);
    });

    it('should handle zero', () => {
      expect(CalculationUtils.roundToCurrency(0)).toBe(0);
      expect(CalculationUtils.roundToCurrency(0.001)).toBe(0);
      expect(CalculationUtils.roundToCurrency(-0.001)).toBe(0);
    });

    it('should handle large values', () => {
      expect(CalculationUtils.roundToCurrency(999999.999)).toBe(1000000.00);
      expect(CalculationUtils.roundToCurrency(1000000.001)).toBe(1000000.00);
      expect(CalculationUtils.roundToCurrency(1000000.994)).toBe(1000000.99);
      expect(CalculationUtils.roundToCurrency(1000000.995)).toBe(1000001.00);
    });

    it('should handle small fractional values', () => {
      expect(CalculationUtils.roundToCurrency(0.001)).toBe(0.00);
      expect(CalculationUtils.roundToCurrency(0.004)).toBe(0.00);
      expect(CalculationUtils.roundToCurrency(0.005)).toBe(0.01);
      expect(CalculationUtils.roundToCurrency(0.009)).toBe(0.01);
    });

    it('should handle JavaScript floating-point edge cases', () => {
      // Known problematic values in JavaScript
      expect(CalculationUtils.roundToCurrency(0.1 + 0.2)).toBe(0.30);
      expect(CalculationUtils.roundToCurrency(0.7 * 100 / 100)).toBe(0.70);
      expect(CalculationUtils.roundToCurrency(1.005)).toBe(1.01);
    });
  });

  describe('isValidCurrencyAmount - Currency Validation', () => {
    it('should validate amounts with 0 decimal places', () => {
      expect(CalculationUtils.isValidCurrencyAmount(0)).toBe(true);
      expect(CalculationUtils.isValidCurrencyAmount(1)).toBe(true);
      expect(CalculationUtils.isValidCurrencyAmount(100)).toBe(true);
      expect(CalculationUtils.isValidCurrencyAmount(1000000)).toBe(true);
    });

    it('should validate amounts with 1 decimal place', () => {
      expect(CalculationUtils.isValidCurrencyAmount(0.1)).toBe(true);
      expect(CalculationUtils.isValidCurrencyAmount(1.5)).toBe(true);
      expect(CalculationUtils.isValidCurrencyAmount(100.9)).toBe(true);
      expect(CalculationUtils.isValidCurrencyAmount(1000000.7)).toBe(true);
    });

    it('should validate amounts with 2 decimal places', () => {
      expect(CalculationUtils.isValidCurrencyAmount(0.01)).toBe(true);
      expect(CalculationUtils.isValidCurrencyAmount(1.99)).toBe(true);
      expect(CalculationUtils.isValidCurrencyAmount(100.50)).toBe(true);
      expect(CalculationUtils.isValidCurrencyAmount(1000000.99)).toBe(true);
    });

    it('should reject amounts with more than 2 decimal places', () => {
      expect(CalculationUtils.isValidCurrencyAmount(0.001)).toBe(false);
      expect(CalculationUtils.isValidCurrencyAmount(1.999)).toBe(false);
      expect(CalculationUtils.isValidCurrencyAmount(100.501)).toBe(false);
      expect(CalculationUtils.isValidCurrencyAmount(1000000.999)).toBe(false);
    });

    it('should validate negative amounts', () => {
      expect(CalculationUtils.isValidCurrencyAmount(-1)).toBe(true);
      expect(CalculationUtils.isValidCurrencyAmount(-1.5)).toBe(true);
      expect(CalculationUtils.isValidCurrencyAmount(-1.99)).toBe(true);
      expect(CalculationUtils.isValidCurrencyAmount(-1.999)).toBe(false);
    });

    it('should handle floating-point precision edge cases', () => {
      // These should be valid despite floating-point representation
      expect(CalculationUtils.isValidCurrencyAmount(0.10)).toBe(true);
      expect(CalculationUtils.isValidCurrencyAmount(0.20)).toBe(true);
      expect(CalculationUtils.isValidCurrencyAmount(0.30)).toBe(true);
      
      // Result of 0.1 + 0.2 in JavaScript (0.30000000000000004)
      const problematicSum = 0.1 + 0.2;
      expect(CalculationUtils.isValidCurrencyAmount(problematicSum)).toBe(false);
      
      // After rounding, it should be valid
      const roundedSum = CalculationUtils.roundToCurrency(problematicSum);
      expect(CalculationUtils.isValidCurrencyAmount(roundedSum)).toBe(true);
    });

    it('should validate common poker chip denominations', () => {
      expect(CalculationUtils.isValidCurrencyAmount(0.25)).toBe(true); // Quarter
      expect(CalculationUtils.isValidCurrencyAmount(0.50)).toBe(true); // Half dollar
      expect(CalculationUtils.isValidCurrencyAmount(1.00)).toBe(true); // Single
      expect(CalculationUtils.isValidCurrencyAmount(5.00)).toBe(true); // Five
      expect(CalculationUtils.isValidCurrencyAmount(25.00)).toBe(true); // Twenty-five
      expect(CalculationUtils.isValidCurrencyAmount(100.00)).toBe(true); // Hundred
    });
  });

  describe('formatCurrency - Currency Formatting', () => {
    it('should format positive amounts', () => {
      expect(CalculationUtils.formatCurrency(0)).toBe('0.00');
      expect(CalculationUtils.formatCurrency(1)).toBe('1.00');
      expect(CalculationUtils.formatCurrency(10.5)).toBe('10.50');
      expect(CalculationUtils.formatCurrency(100.99)).toBe('100.99');
      expect(CalculationUtils.formatCurrency(1000000)).toBe('1000000.00');
    });

    it('should format negative amounts as positive (absolute value)', () => {
      expect(CalculationUtils.formatCurrency(-1)).toBe('1.00');
      expect(CalculationUtils.formatCurrency(-10.5)).toBe('10.50');
      expect(CalculationUtils.formatCurrency(-100.99)).toBe('100.99');
      expect(CalculationUtils.formatCurrency(-1000000)).toBe('1000000.00');
    });

    it('should always show 2 decimal places', () => {
      expect(CalculationUtils.formatCurrency(1)).toBe('1.00');
      expect(CalculationUtils.formatCurrency(1.1)).toBe('1.10');
      expect(CalculationUtils.formatCurrency(1.11)).toBe('1.11');
    });

    it('should handle values with more than 2 decimal places', () => {
      expect(CalculationUtils.formatCurrency(1.999)).toBe('2.00');
      expect(CalculationUtils.formatCurrency(1.994)).toBe('1.99');
      expect(CalculationUtils.formatCurrency(1.995)).toBe('2.00');
      expect(CalculationUtils.formatCurrency(1.001)).toBe('1.00');
    });

    it('should handle floating-point precision issues', () => {
      const problematicSum = 0.1 + 0.2; // 0.30000000000000004
      expect(CalculationUtils.formatCurrency(problematicSum)).toBe('0.30');
      
      const problematicDiff = 0.3 - 0.2; // 0.09999999999999998
      expect(CalculationUtils.formatCurrency(problematicDiff)).toBe('0.10');
    });

    it('should format common poker amounts', () => {
      expect(CalculationUtils.formatCurrency(50)).toBe('50.00'); // Common buy-in
      expect(CalculationUtils.formatCurrency(100)).toBe('100.00'); // Common buy-in
      expect(CalculationUtils.formatCurrency(200)).toBe('200.00'); // Common buy-in
      expect(CalculationUtils.formatCurrency(37.50)).toBe('37.50'); // Odd amount
      expect(CalculationUtils.formatCurrency(125.25)).toBe('125.25'); // Odd amount
    });

    it('should handle very small amounts', () => {
      expect(CalculationUtils.formatCurrency(0.01)).toBe('0.01');
      expect(CalculationUtils.formatCurrency(0.02)).toBe('0.02');
      expect(CalculationUtils.formatCurrency(0.05)).toBe('0.05');
      expect(CalculationUtils.formatCurrency(0.10)).toBe('0.10');
    });

    it('should handle very large amounts', () => {
      expect(CalculationUtils.formatCurrency(999999.99)).toBe('999999.99');
      expect(CalculationUtils.formatCurrency(1000000)).toBe('1000000.00');
      expect(CalculationUtils.formatCurrency(9999999.99)).toBe('9999999.99');
    });
  });

  describe('Integration Tests - Combined Operations', () => {
    it('should maintain precision through multiple operations', () => {
      // Simulate a poker session with multiple buy-ins and cash-outs
      let balance = 0;
      
      // Player buys in for $100
      balance = CalculationUtils.addAmounts(balance, 100);
      expect(balance).toBe(100.00);
      expect(CalculationUtils.isValidCurrencyAmount(balance)).toBe(true);
      
      // Player adds on $50
      balance = CalculationUtils.addAmounts(balance, 50);
      expect(balance).toBe(150.00);
      expect(CalculationUtils.isValidCurrencyAmount(balance)).toBe(true);
      
      // Player cashes out $175.50
      const cashOut = 175.50;
      const profit = CalculationUtils.subtractAmounts(cashOut, balance);
      expect(profit).toBe(25.50);
      expect(CalculationUtils.isValidCurrencyAmount(profit)).toBe(true);
      expect(CalculationUtils.formatCurrency(profit)).toBe('25.50');
    });

    it('should handle settlement calculations correctly', () => {
      // Simulate a 4-player poker game settlement
      const players = [
        { buyIn: 100.00, cashOut: 150.00 }, // Winner: +$50
        { buyIn: 100.00, cashOut: 75.00 },  // Loser: -$25
        { buyIn: 100.00, cashOut: 80.00 },  // Loser: -$20
        { buyIn: 100.00, cashOut: 95.00 },  // Loser: -$5
      ];
      
      let totalBuyIns = 0;
      let totalCashOuts = 0;
      const profits = [];
      
      for (const player of players) {
        totalBuyIns = CalculationUtils.addAmounts(totalBuyIns, player.buyIn);
        totalCashOuts = CalculationUtils.addAmounts(totalCashOuts, player.cashOut);
        
        const profit = CalculationUtils.subtractAmounts(player.cashOut, player.buyIn);
        profits.push(profit);
        
        // Validate each calculation
        expect(CalculationUtils.isValidCurrencyAmount(profit)).toBe(true);
      }
      
      // Verify the books balance (total buy-ins should equal total cash-outs)
      expect(totalBuyIns).toBe(400.00);
      expect(totalCashOuts).toBe(400.00);
      expect(CalculationUtils.subtractAmounts(totalCashOuts, totalBuyIns)).toBe(0);
      
      // Verify individual profits
      expect(profits[0]).toBe(50.00);  // Winner
      expect(profits[1]).toBe(-25.00); // Loser
      expect(profits[2]).toBe(-20.00); // Loser
      expect(profits[3]).toBe(-5.00);  // Loser
      
      // Verify sum of profits equals zero (zero-sum game)
      const totalProfit = profits.reduce((sum, profit) => 
        CalculationUtils.addAmounts(sum, profit), 0
      );
      expect(totalProfit).toBe(0);
    });

    it('should handle complex floating-point scenarios', () => {
      // Test problematic JavaScript floating-point calculations
      const amounts = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
      let sum = 0;
      
      for (const amount of amounts) {
        sum = CalculationUtils.addAmounts(sum, amount);
        expect(CalculationUtils.isValidCurrencyAmount(sum)).toBe(true);
      }
      
      // 0.1 + 0.2 + ... + 0.9 = 4.5
      expect(sum).toBe(4.5);
      expect(CalculationUtils.formatCurrency(sum)).toBe('4.50');
      
      // Subtract them all back
      for (const amount of amounts) {
        sum = CalculationUtils.subtractAmounts(sum, amount);
        const rounded = CalculationUtils.roundToCurrency(sum);
        expect(CalculationUtils.isValidCurrencyAmount(rounded)).toBe(true);
      }
      
      expect(CalculationUtils.roundToCurrency(sum)).toBe(0);
    });

    it('should handle percentage calculations for rake/tips', () => {
      const pot = 1000.00;
      const rakePercentage = 0.05; // 5% rake
      const tipPercentage = 0.02; // 2% tip
      
      // Calculate rake (5% of $1000 = $50)
      const rake = CalculationUtils.roundToCurrency(pot * rakePercentage);
      expect(rake).toBe(50.00);
      expect(CalculationUtils.isValidCurrencyAmount(rake)).toBe(true);
      
      // Calculate tip (2% of $1000 = $20)
      const tip = CalculationUtils.roundToCurrency(pot * tipPercentage);
      expect(tip).toBe(20.00);
      expect(CalculationUtils.isValidCurrencyAmount(tip)).toBe(true);
      
      // Calculate remaining pot
      let remaining = pot;
      remaining = CalculationUtils.subtractAmounts(remaining, rake);
      remaining = CalculationUtils.subtractAmounts(remaining, tip);
      
      expect(remaining).toBe(930.00);
      expect(CalculationUtils.formatCurrency(remaining)).toBe('930.00');
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle Infinity and -Infinity', () => {
      expect(CalculationUtils.roundToCurrency(Infinity)).toBe(Infinity);
      expect(CalculationUtils.roundToCurrency(-Infinity)).toBe(-Infinity);
      expect(CalculationUtils.isValidCurrencyAmount(Infinity)).toBe(false);
      expect(CalculationUtils.isValidCurrencyAmount(-Infinity)).toBe(false);
    });

    it('should handle NaN', () => {
      expect(CalculationUtils.roundToCurrency(NaN)).toBe(NaN);
      expect(CalculationUtils.isValidCurrencyAmount(NaN)).toBe(false);
    });

    it('should handle maximum safe integer values', () => {
      const maxSafe = Number.MAX_SAFE_INTEGER;
      const minSafe = Number.MIN_SAFE_INTEGER;
      
      // These should work but may lose precision
      expect(CalculationUtils.addAmounts(maxSafe, 0)).toBe(maxSafe);
      expect(CalculationUtils.subtractAmounts(minSafe, 0)).toBe(minSafe);
    });

    it('should handle very small positive values near zero', () => {
      const verySmall = 0.00001;
      expect(CalculationUtils.roundToCurrency(verySmall)).toBe(0.00);
      expect(CalculationUtils.isValidCurrencyAmount(verySmall)).toBe(false);
      expect(CalculationUtils.formatCurrency(verySmall)).toBe('0.00');
    });

    it('should handle mathematical constants', () => {
      expect(CalculationUtils.roundToCurrency(Math.PI)).toBe(3.14);
      expect(CalculationUtils.roundToCurrency(Math.E)).toBe(2.72);
      expect(CalculationUtils.isValidCurrencyAmount(Math.PI)).toBe(false);
      expect(CalculationUtils.isValidCurrencyAmount(Math.E)).toBe(false);
    });
  });
});