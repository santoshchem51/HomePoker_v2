/**
 * Alternative Settlement Options Generator Tests - Story 3.3, Task 4
 * 
 * Tests for generating multiple settlement options with different algorithms,
 * comparison matrix, scoring system, and recommendation engine.
 */

import { SettlementService } from '../../../../src/services/settlement/SettlementService';
import {
  SettlementComparison,
  AlternativeSettlement,
  SettlementAlgorithmType,
  SettlementGenerationOptions,
  PlayerSettlement
} from '../../../../src/types/settlement';

// Mock dependencies
jest.mock('../../../../src/services/infrastructure/DatabaseService');
jest.mock('../../../../src/services/core/TransactionService');
jest.mock('../../../../src/services/monitoring/CrashReportingService');

describe('Alternative Settlement Options Generator', () => {
  let settlementService: SettlementService;

  // Test data for a 4-player poker session
  const mockPlayerSettlements: PlayerSettlement[] = [
    {
      playerId: 'player1',
      playerName: 'Alice',
      totalBuyIns: 200,
      totalCashOuts: 0,
      currentChips: 150,
      netPosition: -50, // owes $50
      isActive: true
    },
    {
      playerId: 'player2', 
      playerName: 'Bob',
      totalBuyIns: 100,
      totalCashOuts: 0,
      currentChips: 200,
      netPosition: 100, // receives $100
      isActive: true
    },
    {
      playerId: 'player3',
      playerName: 'Charlie',
      totalBuyIns: 150,
      totalCashOuts: 0,
      currentChips: 100,
      netPosition: -50, // owes $50
      isActive: true
    },
    {
      playerId: 'player4',
      playerName: 'David',
      totalBuyIns: 50,
      totalCashOuts: 0,
      currentChips: 50,
      netPosition: 0, // even
      isActive: true
    }
  ];

  beforeEach(async () => {
    settlementService = SettlementService.getInstance();
    await settlementService.initialize();

    // Mock the calculatePlayerSettlements method to return our test data
    jest.spyOn(settlementService as any, 'calculatePlayerSettlements')
      .mockResolvedValue(mockPlayerSettlements);

    // Mock validation to always pass
    jest.spyOn(settlementService, 'validateSettlement')
      .mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
        auditTrail: []
      });

    // Mock mathematical proof generation
    jest.spyOn(settlementService, 'generateMathematicalProof')
      .mockResolvedValue({
        settlementId: 'test-settlement',
        proofId: 'test-proof',
        generatedAt: new Date(),
        calculationSteps: [],
        balanceVerification: {
          totalDebits: 100,
          totalCredits: 100,
          netBalance: 0,
          isBalanced: true,
          precision: 2,
          validationTimestamp: new Date(),
          auditSteps: []
        },
        precisionAnalysis: {
          originalPrecision: 2,
          calculatedPrecision: 2,
          roundingOperations: [],
          precisionLoss: 0,
          isWithinTolerance: true,
          fractionalCentIssues: []
        },
        alternativeAlgorithmResults: [],
        humanReadableSummary: 'Test proof summary',
        technicalDetails: [],
        exportFormats: {
          json: {} as any,
          text: 'Test proof text'
        },
        checksum: 'test-checksum',
        signature: 'test-signature',
        isValid: true
      });
  });

  afterEach(() => {
    jest.clearAllMocks();
    settlementService.clearAlternativeSettlementCache();
  });

  describe('generateAlternativeSettlements', () => {
    it('should generate multiple settlement alternatives with default options', async () => {
      const sessionId = 'test-session-1';
      
      const comparison = await settlementService.generateAlternativeSettlements(sessionId);

      expect(comparison).toBeDefined();
      expect(comparison.sessionId).toBe(sessionId);
      expect(comparison.alternatives).toHaveLength(5); // 4 algorithms + 1 manual
      expect(comparison.recommendedOption).toBeDefined();
      expect(comparison.comparisonMatrix).toHaveLength(6); // 6 metrics
      expect(comparison.summary).toBeDefined();
    });

    it('should generate alternatives with custom algorithm selection', async () => {
      const sessionId = 'test-session-2';
      const options: Partial<SettlementGenerationOptions> = {
        enabledAlgorithms: [
          SettlementAlgorithmType.GREEDY_DEBT_REDUCTION,
          SettlementAlgorithmType.DIRECT_SETTLEMENT
        ],
        includeManualOption: false
      };

      const comparison = await settlementService.generateAlternativeSettlements(sessionId, options);

      expect(comparison.alternatives).toHaveLength(2);
      expect(comparison.alternatives.map(alt => alt.algorithmType)).toEqual([
        SettlementAlgorithmType.GREEDY_DEBT_REDUCTION,
        SettlementAlgorithmType.DIRECT_SETTLEMENT
      ]);
    });

    it('should include manual settlement option when requested', async () => {
      const sessionId = 'test-session-3';
      const options: Partial<SettlementGenerationOptions> = {
        enabledAlgorithms: [SettlementAlgorithmType.GREEDY_DEBT_REDUCTION],
        includeManualOption: true
      };

      const comparison = await settlementService.generateAlternativeSettlements(sessionId, options);

      expect(comparison.alternatives).toHaveLength(2);
      const manualOption = comparison.alternatives.find(
        alt => alt.algorithmType === SettlementAlgorithmType.MANUAL_SETTLEMENT
      );
      expect(manualOption).toBeDefined();
      expect(manualOption!.name).toBe('Manual Settlement');
    });

    it('should generate proper comparison matrix with all metrics', async () => {
      const sessionId = 'test-session-4';
      
      const comparison = await settlementService.generateAlternativeSettlements(sessionId);

      expect(comparison.comparisonMatrix).toHaveLength(6);
      
      const metricNames = comparison.comparisonMatrix.map(m => m.metricName);
      expect(metricNames).toContain('Transaction Count');
      expect(metricNames).toContain('Optimization %');
      expect(metricNames).toContain('Simplicity Score');
      expect(metricNames).toContain('Fairness Score');
      expect(metricNames).toContain('Calculation Time');
      expect(metricNames).toContain('Overall Score');

      // Verify each metric has values for all alternatives
      comparison.comparisonMatrix.forEach(metric => {
        comparison.alternatives.forEach(alternative => {
          expect(metric.values[alternative.optionId]).toBeDefined();
        });
      });
    });

    it('should generate valid settlement recommendation', async () => {
      const sessionId = 'test-session-5';
      
      const comparison = await settlementService.generateAlternativeSettlements(sessionId);

      expect(comparison.recommendedOption).toBeDefined();
      expect(comparison.recommendedOption.optionId).toBeTruthy();
      expect(comparison.recommendedOption.score).toBeGreaterThan(0);
      expect(comparison.recommendedOption.score).toBeLessThanOrEqual(10);

      // Recommended option should be in the alternatives list
      const recommendedExists = comparison.alternatives.some(
        alt => alt.optionId === comparison.recommendedOption.optionId
      );
      expect(recommendedExists).toBe(true);
    });

    it('should cache results and return cached version on subsequent calls', async () => {
      const sessionId = 'test-session-6';
      
      const firstCall = await settlementService.generateAlternativeSettlements(sessionId);
      const secondCall = await settlementService.generateAlternativeSettlements(sessionId);

      expect(firstCall).toBe(secondCall); // Should be the exact same object from cache
    });

    it('should calculate proper summary statistics', async () => {
      const sessionId = 'test-session-7';
      
      const comparison = await settlementService.generateAlternativeSettlements(sessionId);

      expect(comparison.summary.totalOptionsGenerated).toBe(comparison.alternatives.length);
      expect(comparison.summary.transactionCountRange.min).toBeLessThanOrEqual(
        comparison.summary.transactionCountRange.max
      );
      expect(comparison.summary.optimizationRange.min).toBeLessThanOrEqual(
        comparison.summary.optimizationRange.max
      );
      expect(comparison.summary.averageScore).toBeGreaterThan(0);
      expect(comparison.summary.averageScore).toBeLessThanOrEqual(10);
    });
  });

  describe('Algorithm-specific alternatives', () => {
    it('should generate greedy debt reduction alternative', async () => {
      const sessionId = 'test-session-8';
      const options: Partial<SettlementGenerationOptions> = {
        enabledAlgorithms: [SettlementAlgorithmType.GREEDY_DEBT_REDUCTION],
        includeManualOption: false
      };

      const comparison = await settlementService.generateAlternativeSettlements(sessionId, options);
      const greedyOption = comparison.alternatives[0];

      expect(greedyOption.algorithmType).toBe(SettlementAlgorithmType.GREEDY_DEBT_REDUCTION);
      expect(greedyOption.name).toBe('Optimized Settlement');
      expect(greedyOption.description).toContain('greedy debt reduction');
      expect(greedyOption.paymentPlan).toBeDefined();
      expect(greedyOption.transactionCount).toBeGreaterThan(0);
    });

    it('should generate direct settlement alternative', async () => {
      const sessionId = 'test-session-9';
      const options: Partial<SettlementGenerationOptions> = {
        enabledAlgorithms: [SettlementAlgorithmType.DIRECT_SETTLEMENT],
        includeManualOption: false
      };

      const comparison = await settlementService.generateAlternativeSettlements(sessionId, options);
      const directOption = comparison.alternatives[0];

      expect(directOption.algorithmType).toBe(SettlementAlgorithmType.DIRECT_SETTLEMENT);
      expect(directOption.name).toBe('Direct Settlement');
      expect(directOption.description).toContain('directly based on their net position');
      expect(directOption.optimizationPercentage).toBe(0); // Direct settlement has no optimization
    });

    it('should generate hub-based settlement alternative', async () => {
      const sessionId = 'test-session-10';
      const options: Partial<SettlementGenerationOptions> = {
        enabledAlgorithms: [SettlementAlgorithmType.HUB_BASED],
        includeManualOption: false
      };

      const comparison = await settlementService.generateAlternativeSettlements(sessionId, options);
      const hubOption = comparison.alternatives[0];

      expect(hubOption.algorithmType).toBe(SettlementAlgorithmType.HUB_BASED);
      expect(hubOption.name).toBe('Hub-Based Settlement');
      expect(hubOption.description).toContain('central player as hub');
      expect(hubOption.prosAndCons.pros).toContain('Centralizes transactions through one player');
    });

    it('should generate balanced flow settlement alternative', async () => {
      const sessionId = 'test-session-11';
      const options: Partial<SettlementGenerationOptions> = {
        enabledAlgorithms: [SettlementAlgorithmType.BALANCED_FLOW],
        includeManualOption: false
      };

      const comparison = await settlementService.generateAlternativeSettlements(sessionId, options);
      const balancedOption = comparison.alternatives[0];

      expect(balancedOption.algorithmType).toBe(SettlementAlgorithmType.BALANCED_FLOW);
      expect(balancedOption.name).toBe('Balanced Flow');
      expect(balancedOption.description).toContain('fair transaction distribution');
    });

    it('should generate minimal transactions settlement alternative', async () => {
      const sessionId = 'test-session-12';
      const options: Partial<SettlementGenerationOptions> = {
        enabledAlgorithms: [SettlementAlgorithmType.MINIMAL_TRANSACTIONS],
        includeManualOption: false
      };

      const comparison = await settlementService.generateAlternativeSettlements(sessionId, options);
      const minimalOption = comparison.alternatives[0];

      expect(minimalOption.algorithmType).toBe(SettlementAlgorithmType.MINIMAL_TRANSACTIONS);
      expect(minimalOption.name).toBe('Minimal Transactions');
      expect(minimalOption.description).toContain('mathematical optimization');
      expect(minimalOption.prosAndCons.pros).toContain('Absolute minimum number of transactions');
    });
  });

  describe('Scoring system', () => {
    it('should calculate valid scoring metrics for all alternatives', async () => {
      const sessionId = 'test-session-13';
      
      const comparison = await settlementService.generateAlternativeSettlements(sessionId);

      comparison.alternatives.forEach(alternative => {
        expect(alternative.score).toBeGreaterThan(0);
        expect(alternative.score).toBeLessThanOrEqual(10);
        expect(alternative.simplicity).toBeGreaterThan(0);
        expect(alternative.simplicity).toBeLessThanOrEqual(10);
        expect(alternative.fairness).toBeGreaterThan(0);
        expect(alternative.fairness).toBeLessThanOrEqual(10);
        expect(alternative.efficiency).toBeGreaterThan(0);
        expect(alternative.efficiency).toBeLessThanOrEqual(10);
        expect(alternative.userFriendliness).toBeGreaterThan(0);
        expect(alternative.userFriendliness).toBeLessThanOrEqual(10);
      });
    });

    it('should generate pros and cons for each alternative', async () => {
      const sessionId = 'test-session-14';
      
      const comparison = await settlementService.generateAlternativeSettlements(sessionId);

      comparison.alternatives.forEach(alternative => {
        expect(alternative.prosAndCons.pros).toHaveLength(
          expect.any(Number)
        );
        expect(alternative.prosAndCons.cons).toHaveLength(
          expect.any(Number)
        );
        expect(alternative.prosAndCons.pros.length).toBeGreaterThan(0);
        expect(alternative.prosAndCons.cons.length).toBeGreaterThan(0);
      });
    });

    it('should use custom priority weights in scoring', async () => {
      const sessionId = 'test-session-15';
      const options: Partial<SettlementGenerationOptions> = {
        priorityWeights: {
          simplicity: 0.7, // High weight on simplicity
          fairness: 0.1,
          efficiency: 0.1,
          userFriendliness: 0.1
        }
      };

      const comparison = await settlementService.generateAlternativeSettlements(sessionId, options);

      // Manual settlement should score higher with high simplicity weight
      const manualOption = comparison.alternatives.find(
        alt => alt.algorithmType === SettlementAlgorithmType.MANUAL_SETTLEMENT
      );
      expect(manualOption).toBeDefined();
      expect(manualOption!.simplicity).toBeGreaterThan(8); // Should have high simplicity score
    });
  });

  describe('Validation and mathematical proof integration', () => {
    it('should validate all generated alternatives', async () => {
      const sessionId = 'test-session-16';
      
      const comparison = await settlementService.generateAlternativeSettlements(sessionId);

      comparison.alternatives.forEach(alternative => {
        expect(alternative.isValid).toBe(true);
        expect(alternative.validationResults).toBeDefined();
        expect(alternative.validationResults.isValid).toBe(true);
      });
    });

    it('should generate mathematical proof when requested', async () => {
      const sessionId = 'test-session-17';
      const options: Partial<SettlementGenerationOptions> = {
        requireMathematicalProof: true,
        enabledAlgorithms: [SettlementAlgorithmType.GREEDY_DEBT_REDUCTION]
      };

      const comparison = await settlementService.generateAlternativeSettlements(sessionId, options);

      comparison.alternatives.forEach(alternative => {
        expect(alternative.mathematicalProof).toBeDefined();
        expect(alternative.mathematicalProof!.isValid).toBe(true);
      });
    });

    it('should handle algorithm failures gracefully', async () => {
      const sessionId = 'test-session-18';
      
      // Mock one algorithm to fail
      const originalOptimizeTransactions = (settlementService as any).optimizeTransactions;
      (settlementService as any).optimizeTransactions = jest.fn()
        .mockRejectedValue(new Error('Algorithm failed'));

      const comparison = await settlementService.generateAlternativeSettlements(sessionId);

      // Should still generate other alternatives
      expect(comparison.alternatives.length).toBeGreaterThan(0);
      
      // Restore original method
      (settlementService as any).optimizeTransactions = originalOptimizeTransactions;
    });
  });

  describe('Cache management', () => {
    it('should clear cache when requested', async () => {
      const sessionId = 'test-session-19';
      
      // Generate initial result
      await settlementService.generateAlternativeSettlements(sessionId);
      
      // Clear cache
      settlementService.clearAlternativeSettlementCache();
      
      // Mock to verify fresh calculation
      const calculateSpy = jest.spyOn(settlementService as any, 'calculatePlayerSettlements');
      
      // Generate again - should recalculate
      await settlementService.generateAlternativeSettlements(sessionId);
      
      expect(calculateSpy).toHaveBeenCalled();
    });

    it('should use different cache keys for different options', async () => {
      const sessionId = 'test-session-20';
      
      const options1: Partial<SettlementGenerationOptions> = {
        enabledAlgorithms: [SettlementAlgorithmType.GREEDY_DEBT_REDUCTION]
      };
      
      const options2: Partial<SettlementGenerationOptions> = {
        enabledAlgorithms: [SettlementAlgorithmType.DIRECT_SETTLEMENT]
      };

      const result1 = await settlementService.generateAlternativeSettlements(sessionId, options1);
      const result2 = await settlementService.generateAlternativeSettlements(sessionId, options2);

      expect(result1).not.toBe(result2);
      expect(result1.alternatives.length).not.toBe(result2.alternatives.length);
    });
  });

  describe('Algorithm configuration management', () => {
    it('should get algorithm configuration', () => {
      const config = settlementService.getAlgorithmConfiguration(
        SettlementAlgorithmType.GREEDY_DEBT_REDUCTION
      );

      expect(config).toBeDefined();
      expect(config!.algorithmType).toBe(SettlementAlgorithmType.GREEDY_DEBT_REDUCTION);
      expect(config!.enabled).toBe(true);
      expect(config!.priority).toBeDefined();
    });

    it('should update algorithm configuration', () => {
      const newConfig = {
        enabled: false,
        priority: 10,
        parameters: { customParam: 'test' }
      };

      settlementService.updateAlgorithmConfiguration(
        SettlementAlgorithmType.GREEDY_DEBT_REDUCTION,
        newConfig
      );

      const updatedConfig = settlementService.getAlgorithmConfiguration(
        SettlementAlgorithmType.GREEDY_DEBT_REDUCTION
      );

      expect(updatedConfig!.enabled).toBe(false);
      expect(updatedConfig!.priority).toBe(10);
      expect(updatedConfig!.parameters.customParam).toBe('test');
    });
  });

  describe('Error handling', () => {
    it('should handle session data retrieval errors', async () => {
      const sessionId = 'invalid-session';
      
      // Mock to throw error
      jest.spyOn(settlementService as any, 'calculatePlayerSettlements')
        .mockRejectedValue(new Error('Session not found'));

      await expect(
        settlementService.generateAlternativeSettlements(sessionId)
      ).rejects.toThrow('Failed to generate alternative settlements');
    });

    it('should handle unsupported algorithm types', async () => {
      const sessionId = 'test-session-21';
      const options: Partial<SettlementGenerationOptions> = {
        enabledAlgorithms: ['UNSUPPORTED_ALGORITHM' as any],
        includeManualOption: false
      };

      const comparison = await settlementService.generateAlternativeSettlements(sessionId, options);

      // Should handle gracefully and not include the failed algorithm
      expect(comparison.alternatives.length).toBe(0);
    });
  });
});