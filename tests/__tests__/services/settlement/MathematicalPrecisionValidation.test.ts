/**
 * Mathematical Precision and Balance Verification Tests - Story 3.3, Task 10
 * Tests for mathematical precision algorithms and balance verification edge cases
 */

import { SettlementService } from '../../../../src/services/settlement/SettlementService';
import { DatabaseService } from '../../../../src/services/infrastructure/DatabaseService';
import { TransactionService } from '../../../../src/services/core/TransactionService';
import { 
  OptimizedSettlement, 
  SettlementValidation,
  ValidationErrorCode,
  Player,
  Transaction,
  MathematicalProof,
  PrecisionReport,
  AlgorithmVerification
} from '../../../../src/types/settlement';

// Mock dependencies
jest.mock('../../../../src/services/infrastructure/DatabaseService');
jest.mock('../../../../src/services/core/TransactionService');
jest.mock('../../../../src/services/monitoring/CrashReportingService');

describe('Mathematical Precision and Balance Verification - Story 3.3 Task 10', () => {
  let settlementService: SettlementService;
  let mockDatabaseService: jest.Mocked<DatabaseService>;
  let mockTransactionService: jest.Mocked<TransactionService>;

  const mockSessionId = 'precision-test-session';

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
      name: 'Mathematical Precision Test Session',
      status: 'active',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Fractional Cent Precision Testing', () => {
    it('should handle fractional cents correctly in complex calculations', async () => {
      // Scenario: Odd total that requires precise fractional handling
      const players: Player[] = [
        { id: 'p1', name: 'Player1', currentBalance: 33.34, status: 'active' },
        { id: 'p2', name: 'Player2', currentBalance: 33.33, status: 'active' },
        { id: 'p3', name: 'Player3', currentBalance: 33.33, status: 'active' },
      ];

      const transactions: Transaction[] = [
        { id: 'tx1', sessionId: mockSessionId, playerId: 'p1', type: 'buy_in', amount: 33.33, timestamp: new Date(), isVoided: false },
        { id: 'tx2', sessionId: mockSessionId, playerId: 'p2', type: 'buy_in', amount: 33.33, timestamp: new Date(), isVoided: false },
        { id: 'tx3', sessionId: mockSessionId, playerId: 'p3', type: 'buy_in', amount: 33.34, timestamp: new Date(), isVoided: false },
      ];

      // Settlement handles the 1 cent precision correctly
      const precisionSettlement: OptimizedSettlement = {
        sessionId: mockSessionId,
        optimizedPayments: [
          { fromPlayerId: 'p2', fromPlayerName: 'Player2', toPlayerId: 'p1', toPlayerName: 'Player1', amount: 0.01, priority: 1 },
        ],
        directPayments: [],
        optimizationMetrics: {
          originalPaymentCount: 1,
          optimizedPaymentCount: 1,
          reductionPercentage: 0,
          totalAmountSettled: 0.01,
          processingTime: 25
        },
        isValid: true,
        validationErrors: [],
        mathematicalProof: {
          totalDebits: 0.01,
          totalCredits: 0.01,
          netBalance: 0.00,
          isBalanced: true,
          precision: 2,
          validationTimestamp: new Date(),
          auditSteps: []
        }
      };

      mockDatabaseService.getPlayers.mockResolvedValue(players);
      mockTransactionService.getSessionTransactions.mockResolvedValue(transactions);

      await settlementService.initialize();
      const validation = await settlementService.validateSettlement(precisionSettlement);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      
      // Verify precision validation step handles fractional cents
      const precisionStep = validation.auditTrail.find(step => step.operation === 'Precision Validation');
      expect(precisionStep).toBeDefined();
      expect(precisionStep!.validationCheck).toBe(true);
      expect(precisionStep!.details).toContain('fractional cent');
    });

    it('should detect and report precision loss in calculations', async () => {
      // Scenario with rounding that causes precision loss
      const players: Player[] = [
        { id: 'p1', name: 'Player1', currentBalance: 66.67, status: 'active' },
        { id: 'p2', name: 'Player2', currentBalance: 33.33, status: 'active' },
      ];

      const transactions: Transaction[] = [
        { id: 'tx1', sessionId: mockSessionId, playerId: 'p1', type: 'buy_in', amount: 50.00, timestamp: new Date(), isVoided: false },
        { id: 'tx2', sessionId: mockSessionId, playerId: 'p2', type: 'buy_in', amount: 50.00, timestamp: new Date(), isVoided: false },
      ];

      // Settlement that introduces precision error
      const precisionErrorSettlement: OptimizedSettlement = {
        sessionId: mockSessionId,
        optimizedPayments: [
          // Should be 16.67, but using rounded value that causes precision loss
          { fromPlayerId: 'p2', fromPlayerName: 'Player2', toPlayerId: 'p1', toPlayerName: 'Player1', amount: 16.7, priority: 1 },
        ],
        directPayments: [],
        optimizationMetrics: {
          originalPaymentCount: 1,
          optimizedPaymentCount: 1,
          reductionPercentage: 0,
          totalAmountSettled: 16.7,
          processingTime: 35
        },
        isValid: false,
        validationErrors: [],
        mathematicalProof: {
          totalDebits: 16.7,
          totalCredits: 16.7,
          netBalance: 0.03, // Precision loss
          isBalanced: false,
          precision: 2,
          validationTimestamp: new Date(),
          auditSteps: []
        }
      };

      mockDatabaseService.getPlayers.mockResolvedValue(players);
      mockTransactionService.getSessionTransactions.mockResolvedValue(transactions);

      await settlementService.initialize();
      const validation = await settlementService.validateSettlement(precisionErrorSettlement);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      
      // Should detect precision error
      const precisionError = validation.errors.find(error => 
        error.code === ValidationErrorCode.PRECISION_ERROR);
      expect(precisionError).toBeDefined();
      expect(precisionError!.message).toContain('precision loss');
      expect(precisionError!.message).toContain('0.03');
    });

    it('should validate precision with varying decimal places', async () => {
      // Test with different precision requirements
      const testCases = [
        { precision: 0, amount: 100, expectedValid: true },    // Whole dollars
        { precision: 1, amount: 100.5, expectedValid: true },  // One decimal
        { precision: 2, amount: 100.25, expectedValid: true }, // Two decimals (cents)
        { precision: 3, amount: 100.125, expectedValid: false }, // Three decimals (should fail)
      ];

      for (const testCase of testCases) {
        const players: Player[] = [
          { id: 'p1', name: 'Player1', currentBalance: testCase.amount + 100, status: 'active' },
          { id: 'p2', name: 'Player2', currentBalance: 100 - testCase.amount, status: 'active' },
        ];

        const transactions: Transaction[] = [
          { id: 'tx1', sessionId: mockSessionId, playerId: 'p1', type: 'buy_in', amount: 100, timestamp: new Date(), isVoided: false },
          { id: 'tx2', sessionId: mockSessionId, playerId: 'p2', type: 'buy_in', amount: 100, timestamp: new Date(), isVoided: false },
        ];

        const settlement: OptimizedSettlement = {
          sessionId: mockSessionId,
          optimizedPayments: [
            { fromPlayerId: 'p2', fromPlayerName: 'Player2', toPlayerId: 'p1', toPlayerName: 'Player1', amount: testCase.amount, priority: 1 },
          ],
          directPayments: [],
          optimizationMetrics: {
            originalPaymentCount: 1,
            optimizedPaymentCount: 1,
            reductionPercentage: 0,
            totalAmountSettled: testCase.amount,
            processingTime: 20
          },
          isValid: testCase.expectedValid,
          validationErrors: [],
          mathematicalProof: {
            totalDebits: testCase.amount,
            totalCredits: testCase.amount,
            netBalance: 0,
            isBalanced: true,
            precision: testCase.precision,
            validationTimestamp: new Date(),
            auditSteps: []
          }
        };

        mockDatabaseService.getPlayers.mockResolvedValue(players);
        mockTransactionService.getSessionTransactions.mockResolvedValue(transactions);

        await settlementService.initialize();
        const validation = await settlementService.validateSettlement(settlement);

        if (testCase.expectedValid) {
          expect(validation.isValid).toBe(true);
        } else {
          expect(validation.isValid).toBe(false);
          const precisionError = validation.errors.find(error => 
            error.code === ValidationErrorCode.PRECISION_ERROR);
          expect(precisionError).toBeDefined();
        }
      }
    });
  });

  describe('Rounding Operation Validation', () => {
    it('should track and validate all rounding operations', async () => {
      const players: Player[] = [
        { id: 'p1', name: 'Player1', currentBalance: 123.456, status: 'active' }, // Needs rounding
        { id: 'p2', name: 'Player2', currentBalance: 76.544, status: 'active' },  // Needs rounding
      ];

      const transactions: Transaction[] = [
        { id: 'tx1', sessionId: mockSessionId, playerId: 'p1', type: 'buy_in', amount: 100.00, timestamp: new Date(), isVoided: false },
        { id: 'tx2', sessionId: mockSessionId, playerId: 'p2', type: 'buy_in', amount: 100.00, timestamp: new Date(), isVoided: false },
      ];

      const roundingSettlement: OptimizedSettlement = {
        sessionId: mockSessionId,
        optimizedPayments: [
          // Properly rounded to 2 decimal places
          { fromPlayerId: 'p2', fromPlayerName: 'Player2', toPlayerId: 'p1', toPlayerName: 'Player1', amount: 23.46, priority: 1 },
        ],
        directPayments: [],
        optimizationMetrics: {
          originalPaymentCount: 1,
          optimizedPaymentCount: 1,
          reductionPercentage: 0,
          totalAmountSettled: 23.46,
          processingTime: 40
        },
        isValid: true,
        validationErrors: [],
        mathematicalProof: {
          totalDebits: 23.46,
          totalCredits: 23.46,
          netBalance: 0.00,
          isBalanced: true,
          precision: 2,
          validationTimestamp: new Date(),
          auditSteps: []
        }
      };

      mockDatabaseService.getPlayers.mockResolvedValue(players);
      mockTransactionService.getSessionTransactions.mockResolvedValue(transactions);

      await settlementService.initialize();
      
      // Generate mathematical proof to test rounding operation tracking
      const proof = await settlementService.generateMathematicalProof(roundingSettlement);
      
      expect(proof).toBeDefined();
      expect(proof.precisionAnalysis).toBeDefined();
      expect(proof.precisionAnalysis.roundingOperations).toBeDefined();
      expect(proof.precisionAnalysis.roundingOperations.length).toBeGreaterThan(0);
      
      // Each rounding operation should be tracked
      proof.precisionAnalysis.roundingOperations.forEach(op => {
        expect(op.originalValue).toBeDefined();
        expect(op.roundedValue).toBeDefined();
        expect(op.precisionLoss).toBeDefined();
        expect(op.operation).toBeDefined();
      });
    });

    it('should detect excessive rounding errors', async () => {
      const players: Player[] = [
        { id: 'p1', name: 'Player1', currentBalance: 50.999, status: 'active' },
        { id: 'p2', name: 'Player2', currentBalance: 49.001, status: 'active' },
      ];

      const transactions: Transaction[] = [
        { id: 'tx1', sessionId: mockSessionId, playerId: 'p1', type: 'buy_in', amount: 50.00, timestamp: new Date(), isVoided: false },
        { id: 'tx2', sessionId: mockSessionId, playerId: 'p2', type: 'buy_in', amount: 50.00, timestamp: new Date(), isVoided: false },
      ];

      // Settlement with excessive rounding that creates imbalance
      const excessiveRoundingSettlement: OptimizedSettlement = {
        sessionId: mockSessionId,
        optimizedPayments: [
          // Extreme rounding: should be 1.998, but rounded to 2.00
          { fromPlayerId: 'p2', fromPlayerName: 'Player2', toPlayerId: 'p1', toPlayerName: 'Player1', amount: 2.00, priority: 1 },
        ],
        directPayments: [],
        optimizationMetrics: {
          originalPaymentCount: 1,
          optimizedPaymentCount: 1,
          reductionPercentage: 0,
          totalAmountSettled: 2.00,
          processingTime: 30
        },
        isValid: false,
        validationErrors: [],
        mathematicalProof: {
          totalDebits: 2.00,
          totalCredits: 2.00,
          netBalance: 0.002, // Rounding error
          isBalanced: false,
          precision: 2,
          validationTimestamp: new Date(),
          auditSteps: []
        }
      };

      mockDatabaseService.getPlayers.mockResolvedValue(players);
      mockTransactionService.getSessionTransactions.mockResolvedValue(transactions);

      await settlementService.initialize();
      const validation = await settlementService.validateSettlement(excessiveRoundingSettlement);

      expect(validation.isValid).toBe(false);
      
      const roundingError = validation.errors.find(error => 
        error.code === ValidationErrorCode.ROUNDING_ERROR);
      expect(roundingError).toBeDefined();
      expect(roundingError!.message).toContain('excessive rounding');
    });
  });

  describe('Large Scale Precision Testing', () => {
    it('should maintain precision with 100+ players', async () => {
      // Generate 100 players with varied balances
      const players: Player[] = Array.from({ length: 100 }, (_, i) => ({
        id: `player${i + 1}`,
        name: `Player ${i + 1}`,
        currentBalance: Math.round((50 + Math.random() * 100) * 100) / 100, // Random balance 50-150
        status: 'active' as const,
      }));

      // Generate corresponding transactions
      const transactions: Transaction[] = players.map((player, i) => ({
        id: `tx${i + 1}`,
        sessionId: mockSessionId,
        playerId: player.id,
        type: 'buy_in' as const,
        amount: 100.00,
        timestamp: new Date(Date.now() - (100 - i) * 1000),
        isVoided: false,
      }));

      // Calculate total imbalance
      const totalBalance = players.reduce((sum, p) => sum + p.currentBalance, 0);
      const totalBuyIns = transactions.reduce((sum, t) => sum + t.amount, 0);
      const netImbalance = totalBalance - totalBuyIns;

      // Create settlement that handles the large-scale precision
      const largeScaleSettlement: OptimizedSettlement = {
        sessionId: mockSessionId,
        optimizedPayments: [
          // Simplified: one large payment to handle net imbalance
          {
            fromPlayerId: netImbalance > 0 ? 'player1' : 'player100',
            fromPlayerName: netImbalance > 0 ? 'Player 1' : 'Player 100',
            toPlayerId: netImbalance > 0 ? 'player100' : 'Player 1',
            toPlayerName: netImbalance > 0 ? 'Player 100' : 'Player 1',
            amount: Math.abs(netImbalance),
            priority: 1
          }
        ],
        directPayments: [],
        optimizationMetrics: {
          originalPaymentCount: 100,
          optimizedPaymentCount: 1,
          reductionPercentage: 99,
          totalAmountSettled: Math.abs(netImbalance),
          processingTime: 500
        },
        isValid: true,
        validationErrors: [],
        mathematicalProof: {
          totalDebits: Math.abs(netImbalance),
          totalCredits: Math.abs(netImbalance),
          netBalance: 0.00,
          isBalanced: true,
          precision: 2,
          validationTimestamp: new Date(),
          auditSteps: []
        }
      };

      mockDatabaseService.getPlayers.mockResolvedValue(players);
      mockTransactionService.getSessionTransactions.mockResolvedValue(transactions);

      await settlementService.initialize();
      const validation = await settlementService.validateSettlement(largeScaleSettlement);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      
      // Should complete validation in reasonable time
      const summaryStep = validation.auditTrail.find(step => step.operation === 'Validation Summary');
      expect(summaryStep).toBeDefined();
      expect(summaryStep!.outputs.validationTime).toBeLessThan(5000); // Less than 5 seconds
    });

    it('should handle precision with currency values near floating point limits', async () => {
      const players: Player[] = [
        { id: 'p1', name: 'Player1', currentBalance: 999999999.99, status: 'active' },
        { id: 'p2', name: 'Player2', currentBalance: 0.01, status: 'active' },
      ];

      const transactions: Transaction[] = [
        { id: 'tx1', sessionId: mockSessionId, playerId: 'p1', type: 'buy_in', amount: 500000000.00, timestamp: new Date(), isVoided: false },
        { id: 'tx2', sessionId: mockSessionId, playerId: 'p2', type: 'buy_in', amount: 500000000.00, timestamp: new Date(), isVoided: false },
      ];

      const extremeValueSettlement: OptimizedSettlement = {
        sessionId: mockSessionId,
        optimizedPayments: [
          { fromPlayerId: 'p2', fromPlayerName: 'Player2', toPlayerId: 'p1', toPlayerName: 'Player1', amount: 499999999.99, priority: 1 },
        ],
        directPayments: [],
        optimizationMetrics: {
          originalPaymentCount: 1,
          optimizedPaymentCount: 1,
          reductionPercentage: 0,
          totalAmountSettled: 499999999.99,
          processingTime: 100
        },
        isValid: true,
        validationErrors: [],
        mathematicalProof: {
          totalDebits: 499999999.99,
          totalCredits: 499999999.99,
          netBalance: 0.00,
          isBalanced: true,
          precision: 2,
          validationTimestamp: new Date(),
          auditSteps: []
        }
      };

      mockDatabaseService.getPlayers.mockResolvedValue(players);
      mockTransactionService.getSessionTransactions.mockResolvedValue(transactions);

      await settlementService.initialize();
      const validation = await settlementService.validateSettlement(extremeValueSettlement);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      
      // Precision should be maintained even with extreme values
      const precisionStep = validation.auditTrail.find(step => step.operation === 'Precision Validation');
      expect(precisionStep).toBeDefined();
      expect(precisionStep!.validationCheck).toBe(true);
    });
  });

  describe('Cross-Algorithm Precision Verification', () => {
    it('should verify precision consistency across multiple algorithms', async () => {
      const players: Player[] = [
        { id: 'p1', name: 'Player1', currentBalance: 75.33, status: 'active' },
        { id: 'p2', name: 'Player2', currentBalance: 124.67, status: 'active' },
        { id: 'p3', name: 'Player3', currentBalance: 50.00, status: 'active' },
      ];

      const transactions: Transaction[] = [
        { id: 'tx1', sessionId: mockSessionId, playerId: 'p1', type: 'buy_in', amount: 83.33, timestamp: new Date(), isVoided: false },
        { id: 'tx2', sessionId: mockSessionId, playerId: 'p2', type: 'buy_in', amount: 83.34, timestamp: new Date(), isVoided: false },
        { id: 'tx3', sessionId: mockSessionId, playerId: 'p3', type: 'buy_in', amount: 83.33, timestamp: new Date(), isVoided: false },
      ];

      const testSettlement: OptimizedSettlement = {
        sessionId: mockSessionId,
        optimizedPayments: [
          { fromPlayerId: 'p1', fromPlayerName: 'Player1', toPlayerId: 'p2', toPlayerName: 'Player2', amount: 8.00, priority: 1 },
          { fromPlayerId: 'p3', fromPlayerName: 'Player3', toPlayerId: 'p2', toPlayerName: 'Player2', amount: 33.33, priority: 2 },
        ],
        directPayments: [],
        optimizationMetrics: {
          originalPaymentCount: 3,
          optimizedPaymentCount: 2,
          reductionPercentage: 33.33,
          totalAmountSettled: 41.33,
          processingTime: 75
        },
        isValid: true,
        validationErrors: [],
        mathematicalProof: {
          totalDebits: 41.33,
          totalCredits: 41.33,
          netBalance: 0.00,
          isBalanced: true,
          precision: 2,
          validationTimestamp: new Date(),
          auditSteps: []
        }
      };

      mockDatabaseService.getPlayers.mockResolvedValue(players);
      mockTransactionService.getSessionTransactions.mockResolvedValue(transactions);

      await settlementService.initialize();
      
      // Generate mathematical proof with algorithm verification
      const proof = await settlementService.generateMathematicalProof(testSettlement);
      
      expect(proof.algorithmVerifications).toBeDefined();
      expect(proof.algorithmVerifications.length).toBeGreaterThan(0);
      
      // All algorithms should agree on precision
      proof.algorithmVerifications.forEach(verification => {
        expect(verification.precisionMatches).toBe(true);
        expect(verification.consensusReached).toBe(true);
        expect(Math.abs(verification.discrepancy)).toBeLessThan(0.01); // Within tolerance
      });
    });
  });

  describe('Balance Verification Edge Cases', () => {
    it('should detect balance discrepancies at the tolerance boundary', async () => {
      const players: Player[] = [
        { id: 'p1', name: 'Player1', currentBalance: 100.005, status: 'active' },
        { id: 'p2', name: 'Player2', currentBalance: 99.995, status: 'active' },
      ];

      const transactions: Transaction[] = [
        { id: 'tx1', sessionId: mockSessionId, playerId: 'p1', type: 'buy_in', amount: 100.00, timestamp: new Date(), isVoided: false },
        { id: 'tx2', sessionId: mockSessionId, playerId: 'p2', type: 'buy_in', amount: 100.00, timestamp: new Date(), isVoided: false },
      ];

      // Settlement at the edge of tolerance (0.01)
      const boundarySettlement: OptimizedSettlement = {
        sessionId: mockSessionId,
        optimizedPayments: [
          { fromPlayerId: 'p2', fromPlayerName: 'Player2', toPlayerId: 'p1', toPlayerName: 'Player1', amount: 0.01, priority: 1 },
        ],
        directPayments: [],
        optimizationMetrics: {
          originalPaymentCount: 1,
          optimizedPaymentCount: 1,
          reductionPercentage: 0,
          totalAmountSettled: 0.01,
          processingTime: 15
        },
        isValid: true,
        validationErrors: [],
        mathematicalProof: {
          totalDebits: 0.01,
          totalCredits: 0.01,
          netBalance: 0.00,
          isBalanced: true,
          precision: 2,
          validationTimestamp: new Date(),
          auditSteps: []
        }
      };

      mockDatabaseService.getPlayers.mockResolvedValue(players);
      mockTransactionService.getSessionTransactions.mockResolvedValue(transactions);

      await settlementService.initialize();
      const validation = await settlementService.validateSettlement(boundarySettlement);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      
      // Balance step should handle boundary conditions correctly
      const balanceStep = validation.auditTrail.find(step => step.operation === 'Mathematical Balance Validation');
      expect(balanceStep).toBeDefined();
      expect(balanceStep!.validationCheck).toBe(true);
      expect(balanceStep!.details).toContain('tolerance');
    });
  });
});