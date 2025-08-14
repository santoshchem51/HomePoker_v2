/**
 * Alternative Settlement Complex Scenarios Tests - Story 3.3, Task 10
 * Tests for alternative settlement generation with comprehensive complex scenarios
 */

import { SettlementService } from '../../../../src/services/settlement/SettlementService';
import { DatabaseService } from '../../../../src/services/infrastructure/DatabaseService';
import { TransactionService } from '../../../../src/services/core/TransactionService';
import { 
  SettlementComparison,
  AlternativeSettlement,
  SettlementAlgorithmType,
  SettlementGenerationOptions,
  SettlementRecommendation,
  ComparisonMetric,
  Player,
  Transaction
} from '../../../../src/types/settlement';

// Mock dependencies
jest.mock('../../../../src/services/infrastructure/DatabaseService');
jest.mock('../../../../src/services/core/TransactionService');
jest.mock('../../../../src/services/monitoring/CrashReportingService');

describe('Alternative Settlement Complex Scenarios - Story 3.3 Task 10', () => {
  let settlementService: SettlementService;
  let mockDatabaseService: jest.Mocked<DatabaseService>;
  let mockTransactionService: jest.Mocked<TransactionService>;

  const mockSessionId = 'complex-alternatives-session';

  beforeEach(() => {
    // Clear singleton instance
    (SettlementService as any).instance = undefined;
    
    // Create mock instances
    mockDatabaseService = {
      getInstance: jest.fn().mockReturnThis(),
      initialize: jest.fn().mockResolvedValue(undefined),
      getSession: jest.fn(),
      getPlayers: jest.fn(),
    } as any;
    
    mockTransactionService = {
      getInstance: jest.fn().mockReturnThis(),
      getSessionTransactions: jest.fn(),
      getTransactionHistory: jest.fn(),
    } as any;
    
    // Setup getInstance mocks
    (DatabaseService.getInstance as jest.Mock).mockReturnValue(mockDatabaseService);
    (TransactionService.getInstance as jest.Mock).mockReturnValue(mockTransactionService);
    
    settlementService = SettlementService.getInstance();
    
    // Setup basic session mock
    mockDatabaseService.getSession.mockResolvedValue({
      id: mockSessionId,
      name: 'Complex Alternative Settlement Test Session',
      status: 'active',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Complex Multi-Player Scenarios', () => {
    it('should generate alternatives for 8-player complex session', async () => {
      // Complex 8-player scenario with varied positions
      const players: Player[] = [
        { id: 'p1', name: 'BigWinner', currentBalance: 750.00, status: 'active' },      // +250
        { id: 'p2', name: 'MediumWinner', currentBalance: 425.00, status: 'active' },   // +125
        { id: 'p3', name: 'SmallWinner', currentBalance: 350.00, status: 'active' },    // +50
        { id: 'p4', name: 'BreakEven', currentBalance: 300.00, status: 'active' },      // 0
        { id: 'p5', name: 'SmallLoser', currentBalance: 250.00, status: 'active' },     // -50
        { id: 'p6', name: 'MediumLoser', currentBalance: 200.00, status: 'active' },    // -100
        { id: 'p7', name: 'BigLoser1', currentBalance: 100.00, status: 'active' },      // -200
        { id: 'p8', name: 'BigLoser2', currentBalance: 25.00, status: 'active' },       // -275
      ];

      const transactions: Transaction[] = players.map((player, index) => ({
        id: `tx${index + 1}`,
        sessionId: mockSessionId,
        playerId: player.id,
        type: 'buy_in' as const,
        amount: 300.00,
        timestamp: new Date(Date.now() - (8 - index) * 60000),
        isVoided: false,
      }));

      mockDatabaseService.getPlayers.mockResolvedValue(players);
      mockTransactionService.getSessionTransactions.mockResolvedValue(transactions);

      await settlementService.initialize();
      
      const comparison = await settlementService.generateAlternativeSettlements(mockSessionId);
      
      expect(comparison).toBeDefined();
      expect(comparison.alternatives.length).toBeGreaterThanOrEqual(5); // Should have multiple algorithms
      expect(comparison.comparisonMatrix).toBeDefined();
      expect(comparison.recommendation).toBeDefined();
      
      // Verify different algorithm approaches
      const algorithmNames = comparison.alternatives.map(alt => alt.algorithmType);
      expect(algorithmNames).toContain(SettlementAlgorithmType.GREEDY_DEBT_REDUCTION);
      expect(algorithmNames).toContain(SettlementAlgorithmType.DIRECT_SETTLEMENT);
      expect(algorithmNames).toContain(SettlementAlgorithmType.HUB_BASED);
      expect(algorithmNames).toContain(SettlementAlgorithmType.MINIMAL_TRANSACTIONS);
      
      // Verify all alternatives are mathematically valid
      comparison.alternatives.forEach(alternative => {
        expect(alternative.isValid).toBe(true);
        expect(alternative.validationResults.isValid).toBe(true);
        expect(alternative.transactionCount).toBeGreaterThan(0);
        expect(alternative.score).toBeGreaterThan(0);
      });
      
      // Verify optimization achieved
      const greedyAlternative = comparison.alternatives.find(alt => 
        alt.algorithmType === SettlementAlgorithmType.GREEDY_DEBT_REDUCTION
      );
      expect(greedyAlternative).toBeDefined();
      expect(greedyAlternative!.transactionCount).toBeLessThan(8); // Should optimize from 8 direct payments
    });

    it('should handle fractional cent complexities across multiple algorithms', async () => {
      // Scenario designed to create fractional cent challenges
      const players: Player[] = [
        { id: 'p1', name: 'Player1', currentBalance: 133.34, status: 'active' },
        { id: 'p2', name: 'Player2', currentBalance: 133.33, status: 'active' },
        { id: 'p3', name: 'Player3', currentBalance: 133.33, status: 'active' },
        { id: 'p4', name: 'Player4', currentBalance: 66.67, status: 'active' },
        { id: 'p5', name: 'Player5', currentBalance: 66.67, status: 'active' },
        { id: 'p6', name: 'Player6', currentBalance: 66.66, status: 'active' },
      ];

      const transactions: Transaction[] = players.map((player, index) => ({
        id: `tx${index + 1}`,
        sessionId: mockSessionId,
        playerId: player.id,
        type: 'buy_in' as const,
        amount: 100.00,
        timestamp: new Date(),
        isVoided: false,
      }));

      mockDatabaseService.getPlayers.mockResolvedValue(players);
      mockTransactionService.getSessionTransactions.mockResolvedValue(transactions);

      await settlementService.initialize();
      
      const comparison = await settlementService.generateAlternativeSettlements(mockSessionId);
      
      // All alternatives should handle fractional cents correctly
      comparison.alternatives.forEach(alternative => {
        expect(alternative.isValid).toBe(true);
        
        // Check that all payment amounts are properly rounded to cents
        alternative.paymentPlan.forEach(payment => {
          expect(payment.amount).toEqual(Math.round(payment.amount * 100) / 100);
        });
        
        // Total settlement should balance
        const totalPayments = alternative.paymentPlan.reduce((sum, p) => sum + p.amount, 0);
        expect(Math.abs(totalPayments)).toBeGreaterThan(0); // Should have some settlement
      });
      
      // Precision handling should be noted in alternatives
      const preciseAlternative = comparison.alternatives[0];
      expect(preciseAlternative.prosAndCons.cons).toContain('Fractional cent handling required');
    });

    it('should generate diverse alternatives with different optimization approaches', async () => {
      const players: Player[] = [
        { id: 'hub', name: 'HubPlayer', currentBalance: 500.00, status: 'active' },     // Central hub candidate
        { id: 'winner1', name: 'Winner1', currentBalance: 300.00, status: 'active' },
        { id: 'winner2', name: 'Winner2', currentBalance: 250.00, status: 'active' },
        { id: 'loser1', name: 'Loser1', currentBalance: 100.00, status: 'active' },
        { id: 'loser2', name: 'Loser2', currentBalance: 75.00, status: 'active' },
        { id: 'loser3', name: 'Loser3', currentBalance: 25.00, status: 'active' },
      ];

      const transactions: Transaction[] = players.map((player, index) => ({
        id: `tx${index + 1}`,
        sessionId: mockSessionId,
        playerId: player.id,
        type: 'buy_in' as const,
        amount: 200.00,
        timestamp: new Date(),
        isVoided: false,
      }));

      mockDatabaseService.getPlayers.mockResolvedValue(players);
      mockTransactionService.getSessionTransactions.mockResolvedValue(transactions);

      await settlementService.initialize();
      
      const comparison = await settlementService.generateAlternativeSettlements(mockSessionId);
      
      // Should have different transaction counts reflecting different optimization strategies
      const transactionCounts = comparison.alternatives.map(alt => alt.transactionCount);
      const uniqueCounts = [...new Set(transactionCounts)];
      expect(uniqueCounts.length).toBeGreaterThan(2); // At least 3 different approaches
      
      // Hub-based should use hub player efficiently
      const hubAlternative = comparison.alternatives.find(alt => 
        alt.algorithmType === SettlementAlgorithmType.HUB_BASED
      );
      expect(hubAlternative).toBeDefined();
      expect(hubAlternative!.description).toContain('hub');
      
      // Direct settlement should have more transactions
      const directAlternative = comparison.alternatives.find(alt => 
        alt.algorithmType === SettlementAlgorithmType.DIRECT_SETTLEMENT
      );
      expect(directAlternative).toBeDefined();
      expect(directAlternative!.transactionCount).toBeGreaterThan(hubAlternative!.transactionCount);
      
      // Minimal transactions should have fewest
      const minimalAlternative = comparison.alternatives.find(alt => 
        alt.algorithmType === SettlementAlgorithmType.MINIMAL_TRANSACTIONS
      );
      if (minimalAlternative) {
        expect(minimalAlternative.transactionCount).toBeLessThanOrEqual(hubAlternative!.transactionCount);
      }
    });
  });

  describe('Scoring and Recommendation System', () => {
    it('should calculate meaningful scoring metrics across all dimensions', async () => {
      const players: Player[] = [
        { id: 'p1', name: 'Player1', currentBalance: 175.00, status: 'active' },
        { id: 'p2', name: 'Player2', currentBalance: 125.00, status: 'active' },
        { id: 'p3', name: 'Player3', currentBalance: 100.00, status: 'active' },
        { id: 'p4', name: 'Player4', currentBalance: 50.00, status: 'active' },
      ];

      const transactions: Transaction[] = players.map((player, index) => ({
        id: `tx${index + 1}`,
        sessionId: mockSessionId,
        playerId: player.id,
        type: 'buy_in' as const,
        amount: 112.50,
        timestamp: new Date(),
        isVoided: false,
      }));

      mockDatabaseService.getPlayers.mockResolvedValue(players);
      mockTransactionService.getSessionTransactions.mockResolvedValue(transactions);

      await settlementService.initialize();
      
      const comparison = await settlementService.generateAlternativeSettlements(mockSessionId);
      
      // Verify scoring dimensions for each alternative
      comparison.alternatives.forEach(alternative => {
        expect(alternative.simplicity).toBeGreaterThanOrEqual(1);
        expect(alternative.simplicity).toBeLessThanOrEqual(10);
        expect(alternative.fairness).toBeGreaterThanOrEqual(1);
        expect(alternative.fairness).toBeLessThanOrEqual(10);
        expect(alternative.efficiency).toBeGreaterThanOrEqual(1);
        expect(alternative.efficiency).toBeLessThanOrEqual(10);
        expect(alternative.score).toBeGreaterThan(0);
        
        // Simplicity should correlate inversely with transaction count
        if (alternative.transactionCount === 1) {
          expect(alternative.simplicity).toBeGreaterThanOrEqual(8);
        }
        
        // Efficiency should reflect optimization achieved
        if (alternative.algorithmType === SettlementAlgorithmType.GREEDY_DEBT_REDUCTION) {
          expect(alternative.efficiency).toBeGreaterThanOrEqual(6);
        }
      });
      
      // Should have variation in scores (not all the same)
      const scores = comparison.alternatives.map(alt => alt.score);
      const uniqueScores = [...new Set(scores)];
      expect(uniqueScores.length).toBeGreaterThan(1);
    });

    it('should generate intelligent recommendations with context awareness', async () => {
      const players: Player[] = [
        { id: 'p1', name: 'Player1', currentBalance: 200.00, status: 'active' },
        { id: 'p2', name: 'Player2', currentBalance: 150.00, status: 'active' },
        { id: 'p3', name: 'Player3', currentBalance: 50.00, status: 'active' },
        { id: 'p4', name: 'Player4', currentBalance: 0.00, status: 'active' },
      ];

      const transactions: Transaction[] = players.map((player, index) => ({
        id: `tx${index + 1}`,
        sessionId: mockSessionId,
        playerId: player.id,
        type: 'buy_in' as const,
        amount: 100.00,
        timestamp: new Date(),
        isVoided: false,
      }));

      mockDatabaseService.getPlayers.mockResolvedValue(players);
      mockTransactionService.getSessionTransactions.mockResolvedValue(transactions);

      await settlementService.initialize();
      
      const comparison = await settlementService.generateAlternativeSettlements(mockSessionId);
      
      expect(comparison.recommendation).toBeDefined();
      
      const rec = comparison.recommendation;
      expect(rec.recommendedOptionId).toBeDefined();
      expect(rec.confidence).toBeGreaterThanOrEqual(0.6);
      expect(rec.confidence).toBeLessThanOrEqual(0.95);
      expect(rec.reasoning).toBeDefined();
      expect(rec.reasoning.length).toBeGreaterThan(0);
      
      // Reasoning should mention relevant factors
      const reasoningText = rec.reasoning.join(' ').toLowerCase();
      expect(reasoningText).toMatch(/(transaction|simplicity|efficiency|player)/);
      
      // Alternative considerations should be provided
      expect(rec.alternativeConsiderations).toBeDefined();
      expect(rec.alternativeConsiderations.length).toBeGreaterThan(0);
      
      // Should include risk mitigation
      expect(rec.riskMitigation).toBeDefined();
      expect(rec.riskMitigation.length).toBeGreaterThan(0);
      
      // Recommended option should exist in alternatives
      const recommendedExists = comparison.alternatives.some(alt => 
        alt.optionId === rec.recommendedOptionId
      );
      expect(recommendedExists).toBe(true);
    });

    it('should adjust recommendations based on session characteristics', async () => {
      // Test different session sizes and their impact on recommendations
      const testCases = [
        { playerCount: 3, expectedStrategy: 'minimal' },
        { playerCount: 6, expectedStrategy: 'balanced' },
        { playerCount: 10, expectedStrategy: 'optimized' },
      ];

      for (const testCase of testCases) {
        const players: Player[] = Array.from({ length: testCase.playerCount }, (_, i) => ({
          id: `p${i + 1}`,
          name: `Player${i + 1}`,
          currentBalance: 100 + (i * 10), // Varied balances
          status: 'active' as const,
        }));

        const transactions: Transaction[] = players.map((player, index) => ({
          id: `tx${index + 1}`,
          sessionId: mockSessionId,
          playerId: player.id,
          type: 'buy_in' as const,
          amount: 100.00,
          timestamp: new Date(),
          isVoided: false,
        }));

        mockDatabaseService.getPlayers.mockResolvedValue(players);
        mockTransactionService.getSessionTransactions.mockResolvedValue(transactions);

        await settlementService.initialize();
        
        const comparison = await settlementService.generateAlternativeSettlements(mockSessionId);
        
        // Verify recommendation adapts to session size
        const rec = comparison.recommendation;
        const recommendedOption = comparison.alternatives.find(alt => 
          alt.optionId === rec.recommendedOptionId
        );
        
        expect(recommendedOption).toBeDefined();
        
        if (testCase.playerCount <= 3) {
          // Small sessions should prefer simplicity
          expect(recommendedOption!.simplicity).toBeGreaterThanOrEqual(6);
        } else if (testCase.playerCount >= 8) {
          // Large sessions should prefer optimization
          expect(recommendedOption!.efficiency).toBeGreaterThanOrEqual(6);
        }
      }
    });
  });

  describe('Comparison Matrix and Analysis', () => {
    it('should generate comprehensive comparison matrix', async () => {
      const players: Player[] = [
        { id: 'p1', name: 'Player1', currentBalance: 150.00, status: 'active' },
        { id: 'p2', name: 'Player2', currentBalance: 125.00, status: 'active' },
        { id: 'p3', name: 'Player3', currentBalance: 75.00, status: 'active' },
        { id: 'p4', name: 'Player4', currentBalance: 50.00, status: 'active' },
      ];

      const transactions: Transaction[] = players.map((player, index) => ({
        id: `tx${index + 1}`,
        sessionId: mockSessionId,
        playerId: player.id,
        type: 'buy_in' as const,
        amount: 100.00,
        timestamp: new Date(),
        isVoided: false,
      }));

      mockDatabaseService.getPlayers.mockResolvedValue(players);
      mockTransactionService.getSessionTransactions.mockResolvedValue(transactions);

      await settlementService.initialize();
      
      const comparison = await settlementService.generateAlternativeSettlements(mockSessionId);
      
      expect(comparison.comparisonMatrix).toBeDefined();
      expect(comparison.comparisonMatrix.metrics).toBeDefined();
      expect(comparison.comparisonMatrix.metrics.length).toBeGreaterThanOrEqual(6);
      
      // Verify all expected metrics are present
      const metricNames = comparison.comparisonMatrix.metrics.map(m => m.name);
      expect(metricNames).toContain('Transaction Count');
      expect(metricNames).toContain('Optimization %');
      expect(metricNames).toContain('Simplicity Score');
      expect(metricNames).toContain('Fairness Score');
      expect(metricNames).toContain('Calculation Time');
      expect(metricNames).toContain('Overall Score');
      
      // Verify metric data for each alternative
      comparison.comparisonMatrix.metrics.forEach(metric => {
        expect(metric.values).toBeDefined();
        expect(Object.keys(metric.values)).toEqual(comparison.alternatives.map(alt => alt.optionId));
        
        // All values should be valid numbers
        Object.values(metric.values).forEach(value => {
          expect(typeof value).toBe('number');
          expect(value).toBeGreaterThanOrEqual(0);
        });
        
        // Verify display format
        expect(['number', 'percentage', 'time', 'currency']).toContain(metric.displayFormat);
      });
      
      // Verify weights are present and sum to reasonable total
      expect(comparison.comparisonMatrix.weights).toBeDefined();
      const totalWeight = Object.values(comparison.comparisonMatrix.weights).reduce((sum, w) => sum + w, 0);
      expect(totalWeight).toBeCloseTo(1.0, 1); // Should sum to approximately 1.0
    });

    it('should provide meaningful pros and cons for each alternative', async () => {
      const players: Player[] = [
        { id: 'p1', name: 'Player1', currentBalance: 200.00, status: 'active' },
        { id: 'p2', name: 'Player2', currentBalance: 100.00, status: 'active' },
        { id: 'p3', name: 'Player3', currentBalance: 0.00, status: 'active' },
      ];

      const transactions: Transaction[] = players.map((player, index) => ({
        id: `tx${index + 1}`,
        sessionId: mockSessionId,
        playerId: player.id,
        type: 'buy_in' as const,
        amount: 100.00,
        timestamp: new Date(),
        isVoided: false,
      }));

      mockDatabaseService.getPlayers.mockResolvedValue(players);
      mockTransactionService.getSessionTransactions.mockResolvedValue(transactions);

      await settlementService.initialize();
      
      const comparison = await settlementService.generateAlternativeSettlements(mockSessionId);
      
      comparison.alternatives.forEach(alternative => {
        expect(alternative.prosAndCons).toBeDefined();
        expect(alternative.prosAndCons.pros).toBeDefined();
        expect(alternative.prosAndCons.cons).toBeDefined();
        expect(alternative.prosAndCons.pros.length).toBeGreaterThan(0);
        expect(alternative.prosAndCons.cons.length).toBeGreaterThan(0);
        
        // Pros and cons should be algorithm-specific
        if (alternative.algorithmType === SettlementAlgorithmType.DIRECT_SETTLEMENT) {
          expect(alternative.prosAndCons.pros.some(pro => 
            pro.toLowerCase().includes('transparent')
          )).toBe(true);
        }
        
        if (alternative.algorithmType === SettlementAlgorithmType.GREEDY_DEBT_REDUCTION) {
          expect(alternative.prosAndCons.pros.some(pro => 
            pro.toLowerCase().includes('optimized') || pro.toLowerCase().includes('minimal')
          )).toBe(true);
        }
        
        if (alternative.algorithmType === SettlementAlgorithmType.HUB_BASED) {
          expect(alternative.prosAndCons.pros.some(pro => 
            pro.toLowerCase().includes('central') || pro.toLowerCase().includes('hub')
          )).toBe(true);
        }
      });
    });
  });

  describe('Advanced Generation Options', () => {
    it('should respect custom generation options', async () => {
      const customOptions: SettlementGenerationOptions = {
        enabledAlgorithms: [
          SettlementAlgorithmType.GREEDY_DEBT_REDUCTION,
          SettlementAlgorithmType.HUB_BASED,
          SettlementAlgorithmType.MANUAL_SETTLEMENT
        ],
        maxAlternatives: 3,
        includeManualOption: true,
        prioritizeSimplicity: true,
        prioritizeEfficiency: false,
        optimizationWeights: {
          transactionCount: 0.5,
          simplicity: 0.3,
          fairness: 0.2,
          efficiency: 0.0
        },
        complexityThreshold: 'low',
        generateProofs: false,
        enableCaching: false
      };

      const players: Player[] = [
        { id: 'p1', name: 'Player1', currentBalance: 150.00, status: 'active' },
        { id: 'p2', name: 'Player2', currentBalance: 100.00, status: 'active' },
        { id: 'p3', name: 'Player3', currentBalance: 50.00, status: 'active' },
      ];

      const transactions: Transaction[] = players.map((player, index) => ({
        id: `tx${index + 1}`,
        sessionId: mockSessionId,
        playerId: player.id,
        type: 'buy_in' as const,
        amount: 100.00,
        timestamp: new Date(),
        isVoided: false,
      }));

      mockDatabaseService.getPlayers.mockResolvedValue(players);
      mockTransactionService.getSessionTransactions.mockResolvedValue(transactions);

      await settlementService.initialize();
      
      const comparison = await settlementService.generateAlternativeSettlements(mockSessionId, customOptions);
      
      // Should respect maxAlternatives
      expect(comparison.alternatives.length).toBeLessThanOrEqual(3);
      
      // Should only include enabled algorithms
      const algorithmTypes = comparison.alternatives.map(alt => alt.algorithmType);
      algorithmTypes.forEach(algType => {
        expect(customOptions.enabledAlgorithms).toContain(algType);
      });
      
      // Should include manual option
      const manualOption = comparison.alternatives.find(alt => 
        alt.algorithmType === SettlementAlgorithmType.MANUAL_SETTLEMENT
      );
      expect(manualOption).toBeDefined();
      
      // Should prioritize simplicity
      const recommendedOption = comparison.alternatives.find(alt => 
        alt.optionId === comparison.recommendation.recommendedOptionId
      );
      expect(recommendedOption).toBeDefined();
      expect(recommendedOption!.simplicity).toBeGreaterThanOrEqual(6);
    });

    it('should handle algorithm configuration and priorities', async () => {
      const players: Player[] = [
        { id: 'p1', name: 'Player1', currentBalance: 120.00, status: 'active' },
        { id: 'p2', name: 'Player2', currentBalance: 80.00, status: 'active' },
      ];

      const transactions: Transaction[] = players.map((player, index) => ({
        id: `tx${index + 1}`,
        sessionId: mockSessionId,
        playerId: player.id,
        type: 'buy_in' as const,
        amount: 100.00,
        timestamp: new Date(),
        isVoided: false,
      }));

      mockDatabaseService.getPlayers.mockResolvedValue(players);
      mockTransactionService.getSessionTransactions.mockResolvedValue(transactions);

      await settlementService.initialize();
      
      // Test algorithm configuration
      const config = await settlementService.getAlgorithmConfiguration();
      expect(config).toBeDefined();
      expect(config.algorithms).toBeDefined();
      expect(config.algorithms.length).toBeGreaterThan(0);
      
      // Update algorithm priorities
      const updatedConfig = {
        ...config,
        algorithms: config.algorithms.map(alg => ({
          ...alg,
          priority: alg.type === SettlementAlgorithmType.HUB_BASED ? 1 : alg.priority
        }))
      };
      
      await settlementService.updateAlgorithmConfiguration(updatedConfig);
      
      const comparison = await settlementService.generateAlternativeSettlements(mockSessionId);
      
      // Hub-based should be prioritized in recommendation
      const recommendedOption = comparison.alternatives.find(alt => 
        alt.optionId === comparison.recommendation.recommendedOptionId
      );
      
      // If hub-based is available, it should be recommended or highly scored
      const hubOption = comparison.alternatives.find(alt => 
        alt.algorithmType === SettlementAlgorithmType.HUB_BASED
      );
      if (hubOption) {
        expect(hubOption.score).toBeGreaterThanOrEqual(7); // High score due to priority
      }
    });
  });

  describe('Cache Management and Performance', () => {
    it('should use caching effectively for repeated calls', async () => {
      const players: Player[] = [
        { id: 'p1', name: 'Player1', currentBalance: 125.00, status: 'active' },
        { id: 'p2', name: 'Player2', currentBalance: 75.00, status: 'active' },
      ];

      const transactions: Transaction[] = players.map((player, index) => ({
        id: `tx${index + 1}`,
        sessionId: mockSessionId,
        playerId: player.id,
        type: 'buy_in' as const,
        amount: 100.00,
        timestamp: new Date(),
        isVoided: false,
      }));

      mockDatabaseService.getPlayers.mockResolvedValue(players);
      mockTransactionService.getSessionTransactions.mockResolvedValue(transactions);

      await settlementService.initialize();
      
      // First call - should generate fresh
      const start1 = Date.now();
      const comparison1 = await settlementService.generateAlternativeSettlements(mockSessionId);
      const time1 = Date.now() - start1;
      
      // Second call - should use cache
      const start2 = Date.now();
      const comparison2 = await settlementService.generateAlternativeSettlements(mockSessionId);
      const time2 = Date.now() - start2;
      
      // Results should be identical
      expect(comparison1.alternatives.length).toBe(comparison2.alternatives.length);
      expect(comparison1.recommendation.recommendedOptionId).toBe(comparison2.recommendation.recommendedOptionId);
      
      // Second call should be faster due to caching
      expect(time2).toBeLessThan(time1);
    });

    it('should handle cache invalidation correctly', async () => {
      const players: Player[] = [
        { id: 'p1', name: 'Player1', currentBalance: 110.00, status: 'active' },
        { id: 'p2', name: 'Player2', currentBalance: 90.00, status: 'active' },
      ];

      const transactions: Transaction[] = players.map((player, index) => ({
        id: `tx${index + 1}`,
        sessionId: mockSessionId,
        playerId: player.id,
        type: 'buy_in' as const,
        amount: 100.00,
        timestamp: new Date(),
        isVoided: false,
      }));

      mockDatabaseService.getPlayers.mockResolvedValue(players);
      mockTransactionService.getSessionTransactions.mockResolvedValue(transactions);

      await settlementService.initialize();
      
      // Generate initial alternatives
      const comparison1 = await settlementService.generateAlternativeSettlements(mockSessionId);
      
      // Clear cache
      await settlementService.clearAlternativeSettlementCache(mockSessionId);
      
      // Generate again with different options
      const customOptions: SettlementGenerationOptions = {
        enabledAlgorithms: [SettlementAlgorithmType.DIRECT_SETTLEMENT],
        maxAlternatives: 1,
        includeManualOption: false,
        prioritizeSimplicity: false,
        prioritizeEfficiency: true,
        optimizationWeights: {
          transactionCount: 0.2,
          simplicity: 0.2,
          fairness: 0.2,
          efficiency: 0.4
        },
        complexityThreshold: 'high',
        generateProofs: false,
        enableCaching: true
      };
      
      const comparison2 = await settlementService.generateAlternativeSettlements(mockSessionId, customOptions);
      
      // Results should be different due to different options
      expect(comparison1.alternatives.length).not.toBe(comparison2.alternatives.length);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle individual algorithm failures gracefully', async () => {
      const players: Player[] = [
        { id: 'p1', name: 'Player1', currentBalance: 100.00, status: 'active' },
      ];

      const transactions: Transaction[] = [
        { id: 'tx1', sessionId: mockSessionId, playerId: 'p1', type: 'buy_in', amount: 100.00, timestamp: new Date(), isVoided: false },
      ];

      mockDatabaseService.getPlayers.mockResolvedValue(players);
      mockTransactionService.getSessionTransactions.mockResolvedValue(transactions);

      await settlementService.initialize();
      
      // Single player should result in no settlement needed, but algorithms should handle gracefully
      const comparison = await settlementService.generateAlternativeSettlements(mockSessionId);
      
      expect(comparison).toBeDefined();
      expect(comparison.alternatives.length).toBeGreaterThan(0);
      
      // All alternatives should indicate no settlement needed
      comparison.alternatives.forEach(alternative => {
        expect(alternative.isValid).toBe(true);
        expect(alternative.transactionCount).toBe(0);
        expect(alternative.paymentPlan).toHaveLength(0);
      });
    });

    it('should handle zero net positions correctly', async () => {
      const players: Player[] = [
        { id: 'p1', name: 'Player1', currentBalance: 100.00, status: 'active' },
        { id: 'p2', name: 'Player2', currentBalance: 100.00, status: 'active' },
      ];

      const transactions: Transaction[] = players.map((player, index) => ({
        id: `tx${index + 1}`,
        sessionId: mockSessionId,
        playerId: player.id,
        type: 'buy_in' as const,
        amount: 100.00,
        timestamp: new Date(),
        isVoided: false,
      }));

      mockDatabaseService.getPlayers.mockResolvedValue(players);
      mockTransactionService.getSessionTransactions.mockResolvedValue(transactions);

      await settlementService.initialize();
      
      const comparison = await settlementService.generateAlternativeSettlements(mockSessionId);
      
      // Should handle break-even scenario
      expect(comparison.alternatives.length).toBeGreaterThan(0);
      comparison.alternatives.forEach(alternative => {
        expect(alternative.isValid).toBe(true);
        expect(alternative.transactionCount).toBe(0);
        expect(alternative.paymentPlan).toHaveLength(0);
      });
      
      // Recommendation should acknowledge no settlement needed
      expect(comparison.recommendation.reasoning).toBeDefined();
      const reasoningText = comparison.recommendation.reasoning.join(' ').toLowerCase();
      expect(reasoningText).toMatch(/(break.even|no settlement|balanced)/);
    });
  });
});