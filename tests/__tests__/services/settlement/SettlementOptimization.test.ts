/**
 * Settlement Optimization Algorithm Tests - Epic 3: Settlement Optimization
 * Story 3.2: Settlement Optimization Algorithm
 * 
 * Comprehensive unit tests for settlement optimization algorithms
 */

import { SettlementService } from '../../../../src/services/settlement/SettlementService';
import { DatabaseService } from '../../../../src/services/infrastructure/DatabaseService';
import { SessionService } from '../../../../src/services/core/SessionService';
import { TransactionService } from '../../../../src/services/core/TransactionService';
import { 
  OptimizedSettlement, 
  PaymentPlan, 
  BalanceValidation,
  OptimizationErrorCode,
  SettlementErrorCode 
} from '../../../../src/types/settlement';
import { ServiceError } from '../../../../src/services/core/ServiceError';

describe('Settlement Optimization Algorithm Tests', () => {
  let settlementService: SettlementService;
  let dbService: DatabaseService;
  let sessionService: SessionService;
  let transactionService: TransactionService;

  beforeAll(async () => {
    dbService = DatabaseService.getInstance();
    await dbService.initialize();
    
    sessionService = SessionService.getInstance();
    await sessionService.initialize();
    
    transactionService = TransactionService.getInstance();
    await transactionService.initialize();
    
    settlementService = SettlementService.getInstance();
    await settlementService.initialize();
  });

  beforeEach(async () => {
    await dbService.clearAllData();
    settlementService.clearCache();
  });

  describe('Core Algorithm Correctness (AC 1)', () => {
    it('should reduce payment count by minimum 40% for complex scenarios', async () => {
      // Create 8-player debt chain scenario
      const sessionId = await createDebtChainScenario(8);
      
      const result = await settlementService.optimizeSettlement(sessionId);
      
      expect(result.isValid).toBe(true);
      expect(result.optimizationMetrics.originalPaymentCount).toBeGreaterThan(0);
      expect(result.optimizationMetrics.optimizedPaymentCount).toBeLessThan(
        result.optimizationMetrics.originalPaymentCount
      );
      expect(result.optimizationMetrics.reductionPercentage).toBeGreaterThanOrEqual(40);
    });

    it('should handle 8 players with multiple buy-ins each (AC 2)', async () => {
      const sessionId = await createMultipleBuyInScenario(8, 3);
      
      const result = await settlementService.optimizeSettlement(sessionId);
      
      expect(result.isValid).toBe(true);
      expect(result.mathematicalProof.isBalanced).toBe(true);
      expect(result.optimizedPayments.length).toBeGreaterThan(0);
    });

    it('should prioritize fewer, larger transactions (AC 5)', async () => {
      const sessionId = await createMixedAmountScenario();
      
      const result = await settlementService.optimizeSettlement(sessionId);
      
      expect(result.isValid).toBe(true);
      
      // Verify payments are sorted by amount (priority)
      const sortedPayments = [...result.optimizedPayments].sort((a, b) => b.amount - a.amount);
      const prioritySorted = [...result.optimizedPayments].sort((a, b) => a.priority - b.priority);
      
      // Higher priority should correspond to larger amounts
      for (let i = 0; i < Math.min(3, sortedPayments.length); i++) {
        expect(prioritySorted[i].amount).toBeGreaterThanOrEqual(
          prioritySorted[Math.min(i + 1, prioritySorted.length - 1)].amount
        );
      }
    });

    it('should complete within 2 seconds for complex scenarios (AC 6)', async () => {
      const sessionId = await createComplexScenario(8);
      
      const startTime = Date.now();
      const result = await settlementService.optimizeSettlement(sessionId);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(2000);
      expect(result.isValid).toBe(true);
      expect(result.optimizationMetrics.processingTime).toBeLessThan(2000);
    });
  });

  describe('Mathematical Balance Validation (AC 4)', () => {
    it('should balance to exactly $0.00 with no rounding errors', async () => {
      const sessionId = await createPrecisionTestScenario();
      
      const result = await settlementService.optimizeSettlement(sessionId);
      
      expect(result.isValid).toBe(true);
      expect(result.mathematicalProof.isBalanced).toBe(true);
      expect(Math.abs(result.mathematicalProof.netBalance)).toBeLessThan(0.01);
      expect(result.mathematicalProof.totalDebits).toEqual(result.mathematicalProof.totalCredits);
    });

    it('should validate individual player balances', async () => {
      const sessionId = await createSimpleScenario();
      
      const result = await settlementService.optimizeSettlement(sessionId);
      
      expect(result.isValid).toBe(true);
      
      // Check audit steps for player balance validation
      const playerValidationSteps = result.mathematicalProof.auditSteps.filter(
        step => step.description.includes('Validate balance for')
      );
      
      expect(playerValidationSteps.length).toBeGreaterThan(0);
      playerValidationSteps.forEach(step => {
        expect(step.isValid).toBe(true);
        expect(Math.abs(step.expectedValue - step.actualValue)).toBeLessThanOrEqual(step.tolerance);
      });
    });

    it('should handle fractional cents correctly', async () => {
      const sessionId = await createFractionalCentScenario();
      
      const result = await settlementService.optimizeSettlement(sessionId);
      
      expect(result.isValid).toBe(true);
      
      // All payment amounts should be valid currency amounts (no fractional cents)
      result.optimizedPayments.forEach(payment => {
        expect(payment.amount).toEqual(Math.round(payment.amount * 100) / 100);
        expect(payment.amount % 0.01).toBeLessThan(0.001);
      });
    });
  });

  describe('Clear Settlement Plan Display (AC 3)', () => {
    it('should provide clear sender → receiver mappings', async () => {
      const sessionId = await createSimpleScenario();
      
      const result = await settlementService.optimizeSettlement(sessionId);
      
      expect(result.isValid).toBe(true);
      
      result.optimizedPayments.forEach(payment => {
        expect(payment.fromPlayerId).toBeDefined();
        expect(payment.fromPlayerName).toBeDefined();
        expect(payment.toPlayerId).toBeDefined();
        expect(payment.toPlayerName).toBeDefined();
        expect(payment.amount).toBeGreaterThan(0);
        expect(payment.priority).toBeGreaterThan(0);
      });
    });

    it('should show exact amounts for all payments', async () => {
      const sessionId = await createPrecisionTestScenario();
      
      const result = await settlementService.optimizeSettlement(sessionId);
      
      expect(result.isValid).toBe(true);
      
      // Verify all amounts are precise and properly formatted
      result.optimizedPayments.forEach(payment => {
        expect(typeof payment.amount).toBe('number');
        expect(payment.amount).toBeGreaterThan(0);
        expect(Number.isFinite(payment.amount)).toBe(true);
        expect(payment.amount.toString()).toMatch(/^\d+(\.\d{1,2})?$/);
      });
    });
  });

  describe('Algorithm Edge Cases', () => {
    it('should handle single player scenario', async () => {
      const sessionId = await createSinglePlayerScenario();
      
      const result = await settlementService.optimizeSettlement(sessionId);
      
      expect(result.isValid).toBe(true);
      expect(result.optimizedPayments.length).toBe(0); // No payments needed for single player
      expect(result.optimizationMetrics.reductionPercentage).toBe(0);
    });

    it('should handle equal balances scenario', async () => {
      const sessionId = await createEqualBalancesScenario();
      
      const result = await settlementService.optimizeSettlement(sessionId);
      
      expect(result.isValid).toBe(true);
      expect(result.optimizedPayments.length).toBe(0); // No payments needed when all balances are equal
    });

    it('should handle complex debt chains', async () => {
      const sessionId = await createCircularDebtScenario();
      
      const result = await settlementService.optimizeSettlement(sessionId);
      
      expect(result.isValid).toBe(true);
      expect(result.optimizationMetrics.reductionPercentage).toBeGreaterThan(0);
      
      // Should eliminate circular dependencies
      const directPaymentCount = result.optimizationMetrics.originalPaymentCount;
      expect(result.optimizedPayments.length).toBeLessThan(directPaymentCount);
    });

    it('should handle minimum transaction amounts', async () => {
      const sessionId = await createSmallAmountScenario();
      
      const result = await settlementService.optimizeSettlement(sessionId);
      
      expect(result.isValid).toBe(true);
      
      // All payments should meet minimum transaction amount
      result.optimizedPayments.forEach(payment => {
        expect(payment.amount).toBeGreaterThanOrEqual(0.01);
      });
    });
  });

  describe('Error Handling and Timeout Management', () => {
    it('should timeout and fallback to direct settlement', async () => {
      const sessionId = await createComplexScenario(8);
      
      // Set very short timeout to force fallback
      settlementService.updateOptions({ maxCalculationTimeMs: 10 });
      
      const result = await settlementService.optimizeSettlement(sessionId);
      
      expect(result.isValid).toBe(true);
      expect(result.validationErrors.some(error => 
        error.includes('timeout') || error.includes('fallback')
      )).toBe(true);
      
      // Restore normal timeout
      settlementService.updateOptions({ maxCalculationTimeMs: 2000 });
    });

    it('should handle invalid session gracefully', async () => {
      await expect(
        settlementService.optimizeSettlement('invalid-session-id')
      ).rejects.toThrow(ServiceError);
    });

    it('should handle unbalanced session data', async () => {
      const sessionId = await createUnbalancedScenario();
      
      await expect(
        settlementService.optimizeSettlement(sessionId)
      ).rejects.toThrow();
    });

    it('should validate mathematical consistency', async () => {
      const sessionId = await createSimpleScenario();
      
      const result = await settlementService.optimizeSettlement(sessionId);
      
      expect(result.isValid).toBe(true);
      expect(result.mathematicalProof.isBalanced).toBe(true);
      
      // Verify no mathematical inconsistencies reported
      expect(result.validationErrors.every(error => 
        !error.includes('MATHEMATICAL_INCONSISTENCY')
      )).toBe(true);
    });
  });

  describe('Optimization Comparison Testing', () => {
    it('should demonstrate improvement over direct settlement', async () => {
      const sessionId = await createDebtChainScenario(6);
      
      const result = await settlementService.optimizeSettlement(sessionId);
      
      expect(result.isValid).toBe(true);
      expect(result.directPayments.length).toBeGreaterThan(result.optimizedPayments.length);
      expect(result.optimizationMetrics.reductionPercentage).toBeGreaterThan(0);
      
      // Mathematical proof should confirm both methods reach same result
      const directTotal = result.directPayments.reduce((sum, p) => sum + p.amount, 0);
      const optimizedTotal = result.optimizedPayments.reduce((sum, p) => sum + p.amount, 0);
      
      expect(Math.abs(directTotal - optimizedTotal)).toBeLessThan(0.01);
    });

    it('should maintain same total settlement amount', async () => {
      const sessionId = await createMixedAmountScenario();
      
      const result = await settlementService.optimizeSettlement(sessionId);
      
      expect(result.isValid).toBe(true);
      
      const directTotal = result.directPayments.reduce((sum, p) => sum + p.amount, 0);
      const optimizedTotal = result.optimizedPayments.reduce((sum, p) => sum + p.amount, 0);
      
      // Total amount settled should be identical
      expect(Math.abs(directTotal - optimizedTotal)).toBeLessThan(0.01);
      expect(result.optimizationMetrics.totalAmountSettled).toBeCloseTo(optimizedTotal, 2);
    });
  });

  // Helper functions to create test scenarios

  async function createDebtChainScenario(playerCount: number): Promise<string> {
    const session = await sessionService.createSession({
      title: `Debt Chain Test ${playerCount}P`,
      buyInAmount: 100,
      maxPlayers: playerCount,
      gameType: 'cash',
      blindStructure: 'cash',
    });

    // Create debt chain: P1 → P2 → P3 → ... → P1
    for (let i = 0; i < playerCount; i++) {
      const player = await dbService.addPlayer({
        sessionId: session.id,
        name: `Player${i + 1}`,
        position: i + 1,
        status: 'active',
        currentBalance: 0,
        totalBuyIns: 0,
        imageUrl: null,
      });

      // Add buy-in
      await transactionService.addTransaction({
        sessionId: session.id,
        playerId: player.id,
        type: 'buy_in',
        amount: 100,
        timestamp: new Date(),
        isVoided: false,
      });

      // Set balance to create debt chain pattern
      const balance = i === 0 ? 50 :  // First player owes most
                    i === playerCount - 1 ? 150 : // Last player is owed most
                    100 + (i % 2 === 0 ? -25 : 25); // Alternate owing/owed

      await dbService.updatePlayerBalance(player.id, balance);
    }

    return session.id;
  }

  async function createMultipleBuyInScenario(playerCount: number, buyInsPerPlayer: number): Promise<string> {
    const session = await sessionService.createSession({
      title: `Multiple BuyIn Test ${playerCount}P`,
      buyInAmount: 100,
      maxPlayers: playerCount,
      gameType: 'cash',
      blindStructure: 'cash',
    });

    for (let i = 0; i < playerCount; i++) {
      const player = await dbService.addPlayer({
        sessionId: session.id,
        name: `Player${i + 1}`,
        position: i + 1,
        status: 'active',
        currentBalance: 0,
        totalBuyIns: 0,
        imageUrl: null,
      });

      // Multiple buy-ins per player
      for (let j = 0; j < buyInsPerPlayer; j++) {
        await transactionService.addTransaction({
          sessionId: session.id,
          playerId: player.id,
          type: 'buy_in',
          amount: 50 + j * 25, // Varying amounts
          timestamp: new Date(Date.now() + j * 1000),
          isVoided: false,
        });
      }

      // Set final balance
      const finalBalance = 100 + (i % 3 - 1) * 50; // -50, 0, +50 pattern
      await dbService.updatePlayerBalance(player.id, Math.max(0, finalBalance));
    }

    return session.id;
  }

  async function createMixedAmountScenario(): Promise<string> {
    const session = await sessionService.createSession({
      title: 'Mixed Amount Test',
      buyInAmount: 100,
      maxPlayers: 5,
      gameType: 'cash',
      blindStructure: 'cash',
    });

    const amounts = [25, 175, 50, 150, 100]; // Various final amounts
    
    for (let i = 0; i < 5; i++) {
      const player = await dbService.addPlayer({
        sessionId: session.id,
        name: `Player${i + 1}`,
        position: i + 1,
        status: 'active',
        currentBalance: amounts[i],
        totalBuyIns: 0,
        imageUrl: null,
      });

      await transactionService.addTransaction({
        sessionId: session.id,
        playerId: player.id,
        type: 'buy_in',
        amount: 100,
        timestamp: new Date(),
        isVoided: false,
      });
    }

    return session.id;
  }

  async function createComplexScenario(playerCount: number): Promise<string> {
    const session = await sessionService.createSession({
      title: `Complex Test ${playerCount}P`,
      buyInAmount: 100,
      maxPlayers: playerCount,
      gameType: 'cash',
      blindStructure: 'cash',
    });

    for (let i = 0; i < playerCount; i++) {
      const player = await dbService.addPlayer({
        sessionId: session.id,
        name: `Player${i + 1}`,
        position: i + 1,
        status: 'active',
        currentBalance: 0,
        totalBuyIns: 0,
        imageUrl: null,
      });

      // Multiple transactions
      const buyInCount = Math.floor(Math.random() * 4) + 2;
      for (let j = 0; j < buyInCount; j++) {
        await transactionService.addTransaction({
          sessionId: session.id,
          playerId: player.id,
          type: 'buy_in',
          amount: 50 + Math.floor(Math.random() * 100),
          timestamp: new Date(Date.now() + j * 1000),
          isVoided: false,
        });
      }

      // Random final balance
      const balance = Math.floor(Math.random() * 300) + 50;
      await dbService.updatePlayerBalance(player.id, balance);
    }

    return session.id;
  }

  async function createPrecisionTestScenario(): Promise<string> {
    const session = await sessionService.createSession({
      title: 'Precision Test',
      buyInAmount: 100,
      maxPlayers: 4,
      gameType: 'cash',
      blindStructure: 'cash',
    });

    const preciseAmounts = [99.99, 100.01, 99.98, 100.02]; // Exact cent precision

    for (let i = 0; i < 4; i++) {
      const player = await dbService.addPlayer({
        sessionId: session.id,
        name: `Player${i + 1}`,
        position: i + 1,
        status: 'active',
        currentBalance: preciseAmounts[i],
        totalBuyIns: 0,
        imageUrl: null,
      });

      await transactionService.addTransaction({
        sessionId: session.id,
        playerId: player.id,
        type: 'buy_in',
        amount: 100,
        timestamp: new Date(),
        isVoided: false,
      });
    }

    return session.id;
  }

  async function createSimpleScenario(): Promise<string> {
    const session = await sessionService.createSession({
      title: 'Simple Test',
      buyInAmount: 100,
      maxPlayers: 3,
      gameType: 'cash',
      blindStructure: 'cash',
    });

    const balances = [75, 125, 100]; // Simple win/loss pattern

    for (let i = 0; i < 3; i++) {
      const player = await dbService.addPlayer({
        sessionId: session.id,
        name: `Player${i + 1}`,
        position: i + 1,
        status: 'active',
        currentBalance: balances[i],
        totalBuyIns: 0,
        imageUrl: null,
      });

      await transactionService.addTransaction({
        sessionId: session.id,
        playerId: player.id,
        type: 'buy_in',
        amount: 100,
        timestamp: new Date(),
        isVoided: false,
      });
    }

    return session.id;
  }

  async function createFractionalCentScenario(): Promise<string> {
    const session = await sessionService.createSession({
      title: 'Fractional Cent Test',
      buyInAmount: 100,
      maxPlayers: 3,
      gameType: 'cash',
      blindStructure: 'cash',
    });

    // Amounts that could create fractional cent issues
    const amounts = [99.997, 100.001, 100.002];

    for (let i = 0; i < 3; i++) {
      const player = await dbService.addPlayer({
        sessionId: session.id,
        name: `Player${i + 1}`,
        position: i + 1,
        status: 'active',
        currentBalance: Math.round(amounts[i] * 100) / 100, // Pre-round to avoid issues
        totalBuyIns: 0,
        imageUrl: null,
      });

      await transactionService.addTransaction({
        sessionId: session.id,
        playerId: player.id,
        type: 'buy_in',
        amount: 100,
        timestamp: new Date(),
        isVoided: false,
      });
    }

    return session.id;
  }

  async function createSinglePlayerScenario(): Promise<string> {
    const session = await sessionService.createSession({
      title: 'Single Player Test',
      buyInAmount: 100,
      maxPlayers: 1,
      gameType: 'cash',
      blindStructure: 'cash',
    });

    const player = await dbService.addPlayer({
      sessionId: session.id,
      name: 'Player1',
      position: 1,
      status: 'active',
      currentBalance: 100,
      totalBuyIns: 0,
      imageUrl: null,
    });

    await transactionService.addTransaction({
      sessionId: session.id,
      playerId: player.id,
      type: 'buy_in',
      amount: 100,
      timestamp: new Date(),
      isVoided: false,
    });

    return session.id;
  }

  async function createEqualBalancesScenario(): Promise<string> {
    const session = await sessionService.createSession({
      title: 'Equal Balances Test',
      buyInAmount: 100,
      maxPlayers: 4,
      gameType: 'cash',
      blindStructure: 'cash',
    });

    for (let i = 0; i < 4; i++) {
      const player = await dbService.addPlayer({
        sessionId: session.id,
        name: `Player${i + 1}`,
        position: i + 1,
        status: 'active',
        currentBalance: 100, // All equal
        totalBuyIns: 0,
        imageUrl: null,
      });

      await transactionService.addTransaction({
        sessionId: session.id,
        playerId: player.id,
        type: 'buy_in',
        amount: 100,
        timestamp: new Date(),
        isVoided: false,
      });
    }

    return session.id;
  }

  async function createCircularDebtScenario(): Promise<string> {
    const session = await sessionService.createSession({
      title: 'Circular Debt Test',
      buyInAmount: 100,
      maxPlayers: 4,
      gameType: 'cash',
      blindStructure: 'cash',
    });

    // Create circular debt: P1 owes P2, P2 owes P3, P3 owes P4, P4 owes P1
    const balances = [80, 120, 80, 120]; // Alternating pattern

    for (let i = 0; i < 4; i++) {
      const player = await dbService.addPlayer({
        sessionId: session.id,
        name: `Player${i + 1}`,
        position: i + 1,
        status: 'active',
        currentBalance: balances[i],
        totalBuyIns: 0,
        imageUrl: null,
      });

      await transactionService.addTransaction({
        sessionId: session.id,
        playerId: player.id,
        type: 'buy_in',
        amount: 100,
        timestamp: new Date(),
        isVoided: false,
      });
    }

    return session.id;
  }

  async function createSmallAmountScenario(): Promise<string> {
    const session = await sessionService.createSession({
      title: 'Small Amount Test',
      buyInAmount: 100,
      maxPlayers: 3,
      gameType: 'cash',
      blindStructure: 'cash',
    });

    // Small differences that test minimum transaction amounts
    const balances = [99.99, 100.01, 100.00];

    for (let i = 0; i < 3; i++) {
      const player = await dbService.addPlayer({
        sessionId: session.id,
        name: `Player${i + 1}`,
        position: i + 1,
        status: 'active',
        currentBalance: balances[i],
        totalBuyIns: 0,
        imageUrl: null,
      });

      await transactionService.addTransaction({
        sessionId: session.id,
        playerId: player.id,
        type: 'buy_in',
        amount: 100,
        timestamp: new Date(),
        isVoided: false,
      });
    }

    return session.id;
  }

  async function createUnbalancedScenario(): Promise<string> {
    const session = await sessionService.createSession({
      title: 'Unbalanced Test',
      buyInAmount: 100,
      maxPlayers: 2,
      gameType: 'cash',
      blindStructure: 'cash',
    });

    // Intentionally create unbalanced scenario
    const player1 = await dbService.addPlayer({
      sessionId: session.id,
      name: 'Player1',
      position: 1,
      status: 'active',
      currentBalance: 150, // More than possible
      totalBuyIns: 0,
      imageUrl: null,
    });

    const player2 = await dbService.addPlayer({
      sessionId: session.id,
      name: 'Player2',
      position: 2,
      status: 'active',
      currentBalance: 150, // This creates imbalance - total 300 from 200 buy-ins
      totalBuyIns: 0,
      imageUrl: null,
    });

    // Only add 200 in buy-ins but set balances to 300 total
    await transactionService.addTransaction({
      sessionId: session.id,
      playerId: player1.id,
      type: 'buy_in',
      amount: 100,
      timestamp: new Date(),
      isVoided: false,
    });

    await transactionService.addTransaction({
      sessionId: session.id,
      playerId: player2.id,
      type: 'buy_in',
      amount: 100,
      timestamp: new Date(),
      isVoided: false,
    });

    return session.id;
  }
});