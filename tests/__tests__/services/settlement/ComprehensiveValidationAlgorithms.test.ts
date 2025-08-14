/**
 * Comprehensive Validation Algorithm Tests - Story 3.3, Task 10
 * Tests for validation algorithms with comprehensive coverage for AC 1-6
 */

import { SettlementService } from '../../../../src/services/settlement/SettlementService';
import { DatabaseService } from '../../../../src/services/infrastructure/DatabaseService';
import { TransactionService } from '../../../../src/services/core/TransactionService';
import { 
  OptimizedSettlement, 
  SettlementValidation,
  ValidationErrorCode,
  WarningClassification,
  ManualAdjustmentType,
  SettlementWarningExtended,
  Player,
  Transaction
} from '../../../../src/types/settlement';

// Mock dependencies
jest.mock('../../../../src/services/infrastructure/DatabaseService');
jest.mock('../../../../src/services/core/TransactionService');
jest.mock('../../../../src/services/monitoring/CrashReportingService');

describe('Comprehensive Validation Algorithms - Story 3.3 Task 10', () => {
  let settlementService: SettlementService;
  let mockDatabaseService: jest.Mocked<DatabaseService>;
  let mockTransactionService: jest.Mocked<TransactionService>;

  const mockSessionId = 'comprehensive-validation-session';

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
      name: 'Comprehensive Validation Test Session',
      status: 'active',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('AC 1-2: Mathematical Balance and Player Position Validation', () => {
    it('should validate perfect mathematical balance with cent-level precision', async () => {
      // Perfect balance scenario: 4 players, complex transactions
      const players: Player[] = [
        { id: 'player1', name: 'Alice', currentBalance: 247.50, status: 'active' },
        { id: 'player2', name: 'Bob', currentBalance: 152.75, status: 'active' },
        { id: 'player3', name: 'Charlie', currentBalance: 0.00, status: 'active' },
        { id: 'player4', name: 'Diana', currentBalance: 399.75, status: 'active' },
      ];

      const transactions: Transaction[] = [
        { id: 'tx1', sessionId: mockSessionId, playerId: 'player1', type: 'buy_in', amount: 200.00, timestamp: new Date(), isVoided: false },
        { id: 'tx2', sessionId: mockSessionId, playerId: 'player2', type: 'buy_in', amount: 150.00, timestamp: new Date(), isVoided: false },
        { id: 'tx3', sessionId: mockSessionId, playerId: 'player3', type: 'buy_in', amount: 100.00, timestamp: new Date(), isVoided: false },
        { id: 'tx4', sessionId: mockSessionId, playerId: 'player4', type: 'buy_in', amount: 350.00, timestamp: new Date(), isVoided: false },
        { id: 'tx5', sessionId: mockSessionId, playerId: 'player1', type: 'rebuy', amount: 50.00, timestamp: new Date(), isVoided: false },
        { id: 'tx6', sessionId: mockSessionId, playerId: 'player2', type: 'rebuy', amount: 25.00, timestamp: new Date(), isVoided: false },
      ];

      // Net positions: Alice: +(-2.50), Bob: +(-22.25), Charlie: +(-100), Diana: +(+49.75)
      // Total buy-ins: 875, Total chips: 800, Net zero sum
      const balancedSettlement: OptimizedSettlement = {
        sessionId: mockSessionId,
        optimizedPayments: [
          { fromPlayerId: 'player3', fromPlayerName: 'Charlie', toPlayerId: 'player4', toPlayerName: 'Diana', amount: 49.75, priority: 1 },
          { fromPlayerId: 'player3', fromPlayerName: 'Charlie', toPlayerId: 'player1', toPlayerName: 'Alice', amount: 2.50, priority: 2 },
          { fromPlayerId: 'player3', fromPlayerName: 'Charlie', toPlayerId: 'player2', toPlayerName: 'Bob', amount: 22.25, priority: 3 },
          { fromPlayerId: 'player2', fromPlayerName: 'Bob', toPlayerId: 'player4', toPlayerName: 'Diana', amount: 25.50, priority: 4 },
        ],
        directPayments: [],
        optimizationMetrics: {
          originalPaymentCount: 6,
          optimizedPaymentCount: 4,
          reductionPercentage: 33.33,
          totalAmountSettled: 100.00,
          processingTime: 150
        },
        isValid: true,
        validationErrors: [],
        mathematicalProof: {
          totalDebits: 100.00,
          totalCredits: 100.00,
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
      const validation = await settlementService.validateSettlement(balancedSettlement);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.auditTrail.length).toBeGreaterThanOrEqual(6);
      
      // Verify mathematical balance audit step
      const balanceStep = validation.auditTrail.find(step => step.operation === 'Mathematical Balance Validation');
      expect(balanceStep).toBeDefined();
      expect(balanceStep!.validationCheck).toBe(true);
      expect(balanceStep!.description).toContain('cent-level precision');
    });

    it('should detect fractional cent imbalances accurately', async () => {
      const players: Player[] = [
        { id: 'player1', name: 'Alice', currentBalance: 100.33, status: 'active' },
        { id: 'player2', name: 'Bob', currentBalance: 99.67, status: 'active' },
      ];

      const transactions: Transaction[] = [
        { id: 'tx1', sessionId: mockSessionId, playerId: 'player1', type: 'buy_in', amount: 100.00, timestamp: new Date(), isVoided: false },
        { id: 'tx2', sessionId: mockSessionId, playerId: 'player2', type: 'buy_in', amount: 100.00, timestamp: new Date(), isVoided: false },
      ];

      // Intentionally create a fractional cent imbalance (0.01 too much)
      const imbalancedSettlement: OptimizedSettlement = {
        sessionId: mockSessionId,
        optimizedPayments: [
          { fromPlayerId: 'player2', fromPlayerName: 'Bob', toPlayerId: 'player1', toPlayerName: 'Alice', amount: 0.34, priority: 1 }, // Should be 0.33
        ],
        directPayments: [],
        optimizationMetrics: {
          originalPaymentCount: 1,
          optimizedPaymentCount: 1,
          reductionPercentage: 0,
          totalAmountSettled: 0.34,
          processingTime: 50
        },
        isValid: false,
        validationErrors: [],
        mathematicalProof: {
          totalDebits: 0.34,
          totalCredits: 0.34,
          netBalance: 0.01, // 1 cent imbalance
          isBalanced: false,
          precision: 2,
          validationTimestamp: new Date(),
          auditSteps: []
        }
      };

      mockDatabaseService.getPlayers.mockResolvedValue(players);
      mockTransactionService.getSessionTransactions.mockResolvedValue(transactions);

      await settlementService.initialize();
      const validation = await settlementService.validateSettlement(imbalancedSettlement);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      
      // Should detect precision error
      const precisionError = validation.errors.find(error => 
        error.code === ValidationErrorCode.PRECISION_ERROR);
      expect(precisionError).toBeDefined();
      expect(precisionError!.message).toContain('0.01');
    });

    it('should validate complex multi-player position accuracy', async () => {
      // 8-player complex scenario with multiple buy-ins and different positions
      const players: Player[] = [
        { id: 'p1', name: 'Player1', currentBalance: 0, status: 'active' },    // Lost everything
        { id: 'p2', name: 'Player2', currentBalance: 50, status: 'active' },   // Lost 50
        { id: 'p3', name: 'Player3', currentBalance: 150, status: 'active' },  // Won 50
        { id: 'p4', name: 'Player4', currentBalance: 275, status: 'active' },  // Won 75
        { id: 'p5', name: 'Player5', currentBalance: 325, status: 'active' },  // Won 125
        { id: 'p6', name: 'Player6', currentBalance: 180, status: 'active' },  // Lost 20
        { id: 'p7', name: 'Player7', currentBalance: 95, status: 'active' },   // Lost 5
        { id: 'p8', name: 'Player8', currentBalance: 125, status: 'active' },  // Won 25
      ];

      const transactions: Transaction[] = [
        // Initial buy-ins
        ...players.map((player, index) => ({
          id: `tx-initial-${player.id}`,
          sessionId: mockSessionId,
          playerId: player.id,
          type: 'buy_in' as const,
          amount: 100,
          timestamp: new Date(Date.now() - (8 - index) * 60000), // Staggered times
          isVoided: false,
        })),
        // Some rebuys
        { id: 'rebuy1', sessionId: mockSessionId, playerId: 'p1', type: 'buy_in', amount: 100, timestamp: new Date(), isVoided: false },
        { id: 'rebuy2', sessionId: mockSessionId, playerId: 'p4', type: 'buy_in', amount: 100, timestamp: new Date(), isVoided: false },
        { id: 'rebuy3', sessionId: mockSessionId, playerId: 'p6', type: 'buy_in', amount: 100, timestamp: new Date(), isVoided: false },
      ];

      // Settlement should reflect exact net positions
      const complexSettlement: OptimizedSettlement = {
        sessionId: mockSessionId,
        optimizedPayments: [
          { fromPlayerId: 'p1', fromPlayerName: 'Player1', toPlayerId: 'p5', toPlayerName: 'Player5', amount: 125, priority: 1 },
          { fromPlayerId: 'p1', fromPlayerName: 'Player1', toPlayerId: 'p4', toPlayerName: 'Player4', amount: 75, priority: 2 },
          { fromPlayerId: 'p2', fromPlayerName: 'Player2', toPlayerId: 'p3', toPlayerName: 'Player3', amount: 50, priority: 3 },
          { fromPlayerId: 'p6', fromPlayerName: 'Player6', toPlayerId: 'p8', toPlayerName: 'Player8', amount: 20, priority: 4 },
          { fromPlayerId: 'p7', fromPlayerName: 'Player7', toPlayerId: 'p8', toPlayerName: 'Player8', amount: 5, priority: 5 },
        ],
        directPayments: [],
        optimizationMetrics: {
          originalPaymentCount: 8,
          optimizedPaymentCount: 5,
          reductionPercentage: 37.5,
          totalAmountSettled: 275,
          processingTime: 200
        },
        isValid: true,
        validationErrors: [],
        mathematicalProof: {
          totalDebits: 275,
          totalCredits: 275,
          netBalance: 0,
          isBalanced: true,
          precision: 2,
          validationTimestamp: new Date(),
          auditSteps: []
        }
      };

      mockDatabaseService.getPlayers.mockResolvedValue(players);
      mockTransactionService.getSessionTransactions.mockResolvedValue(transactions);

      await settlementService.initialize();
      const validation = await settlementService.validateSettlement(complexSettlement);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      
      // Verify player position validation
      const positionStep = validation.auditTrail.find(step => step.operation === 'Player Position Validation');
      expect(positionStep).toBeDefined();
      expect(positionStep!.validationCheck).toBe(true);
    });

    it('should detect player position discrepancies with detailed error reporting', async () => {
      const players: Player[] = [
        { id: 'player1', name: 'Alice', currentBalance: 150, status: 'active' }, // Net: +50
        { id: 'player2', name: 'Bob', currentBalance: 50, status: 'active' },   // Net: -50
      ];

      const transactions: Transaction[] = [
        { id: 'tx1', sessionId: mockSessionId, playerId: 'player1', type: 'buy_in', amount: 100, timestamp: new Date(), isVoided: false },
        { id: 'tx2', sessionId: mockSessionId, playerId: 'player2', type: 'buy_in', amount: 100, timestamp: new Date(), isVoided: false },
      ];

      // Settlement that contradicts player positions
      const incorrectSettlement: OptimizedSettlement = {
        sessionId: mockSessionId,
        optimizedPayments: [
          // Wrong: Alice should receive 50 from Bob, not pay 25 to Bob
          { fromPlayerId: 'player1', fromPlayerName: 'Alice', toPlayerId: 'player2', toPlayerName: 'Bob', amount: 25, priority: 1 },
        ],
        directPayments: [],
        optimizationMetrics: {
          originalPaymentCount: 1,
          optimizedPaymentCount: 1,
          reductionPercentage: 0,
          totalAmountSettled: 25,
          processingTime: 30
        },
        isValid: false,
        validationErrors: [],
        mathematicalProof: {
          totalDebits: 25,
          totalCredits: 25,
          netBalance: 0,
          isBalanced: true,
          precision: 2,
          validationTimestamp: new Date(),
          auditSteps: []
        }
      };

      mockDatabaseService.getPlayers.mockResolvedValue(players);
      mockTransactionService.getSessionTransactions.mockResolvedValue(transactions);

      await settlementService.initialize();
      const validation = await settlementService.validateSettlement(incorrectSettlement);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      
      // Should detect player position error
      const positionError = validation.errors.find(error => 
        error.code === ValidationErrorCode.INVALID_PLAYER_STATE);
      expect(positionError).toBeDefined();
      expect(positionError!.message).toContain('Player 1'); // Alice
      expect(positionError!.affectedPlayers).toContain('player1');
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle zero-amount settlements correctly', async () => {
      const players: Player[] = [
        { id: 'player1', name: 'Alice', currentBalance: 100, status: 'active' },
        { id: 'player2', name: 'Bob', currentBalance: 100, status: 'active' },
      ];

      const transactions: Transaction[] = [
        { id: 'tx1', sessionId: mockSessionId, playerId: 'player1', type: 'buy_in', amount: 100, timestamp: new Date(), isVoided: false },
        { id: 'tx2', sessionId: mockSessionId, playerId: 'player2', type: 'buy_in', amount: 100, timestamp: new Date(), isVoided: false },
      ];

      const zeroSettlement: OptimizedSettlement = {
        sessionId: mockSessionId,
        optimizedPayments: [],
        directPayments: [],
        optimizationMetrics: {
          originalPaymentCount: 0,
          optimizedPaymentCount: 0,
          reductionPercentage: 0,
          totalAmountSettled: 0,
          processingTime: 10
        },
        isValid: true,
        validationErrors: [],
        mathematicalProof: {
          totalDebits: 0,
          totalCredits: 0,
          netBalance: 0,
          isBalanced: true,
          precision: 2,
          validationTimestamp: new Date(),
          auditSteps: []
        }
      };

      mockDatabaseService.getPlayers.mockResolvedValue(players);
      mockTransactionService.getSessionTransactions.mockResolvedValue(transactions);

      await settlementService.initialize();
      const validation = await settlementService.validateSettlement(zeroSettlement);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should handle very large amounts with precision', async () => {
      const players: Player[] = [
        { id: 'player1', name: 'HighRoller1', currentBalance: 99999.99, status: 'active' },
        { id: 'player2', name: 'HighRoller2', currentBalance: 0.01, status: 'active' },
      ];

      const transactions: Transaction[] = [
        { id: 'tx1', sessionId: mockSessionId, playerId: 'player1', type: 'buy_in', amount: 50000.00, timestamp: new Date(), isVoided: false },
        { id: 'tx2', sessionId: mockSessionId, playerId: 'player2', type: 'buy_in', amount: 50000.00, timestamp: new Date(), isVoided: false },
      ];

      const largeAmountSettlement: OptimizedSettlement = {
        sessionId: mockSessionId,
        optimizedPayments: [
          { fromPlayerId: 'player2', fromPlayerName: 'HighRoller2', toPlayerId: 'player1', toPlayerName: 'HighRoller1', amount: 49999.99, priority: 1 },
        ],
        directPayments: [],
        optimizationMetrics: {
          originalPaymentCount: 1,
          optimizedPaymentCount: 1,
          reductionPercentage: 0,
          totalAmountSettled: 49999.99,
          processingTime: 75
        },
        isValid: true,
        validationErrors: [],
        mathematicalProof: {
          totalDebits: 49999.99,
          totalCredits: 49999.99,
          netBalance: 0,
          isBalanced: true,
          precision: 2,
          validationTimestamp: new Date(),
          auditSteps: []
        }
      };

      mockDatabaseService.getPlayers.mockResolvedValue(players);
      mockTransactionService.getSessionTransactions.mockResolvedValue(transactions);

      await settlementService.initialize();
      const validation = await settlementService.validateSettlement(largeAmountSettlement);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      
      // Verify precision is maintained
      const precisionStep = validation.auditTrail.find(step => step.operation === 'Precision Validation');
      expect(precisionStep).toBeDefined();
      expect(precisionStep!.validationCheck).toBe(true);
    });

    it('should handle single-player edge case', async () => {
      const players: Player[] = [
        { id: 'solo-player', name: 'Solo', currentBalance: 100, status: 'active' },
      ];

      const transactions: Transaction[] = [
        { id: 'tx1', sessionId: mockSessionId, playerId: 'solo-player', type: 'buy_in', amount: 100, timestamp: new Date(), isVoided: false },
      ];

      const soloSettlement: OptimizedSettlement = {
        sessionId: mockSessionId,
        optimizedPayments: [],
        directPayments: [],
        optimizationMetrics: {
          originalPaymentCount: 0,
          optimizedPaymentCount: 0,
          reductionPercentage: 0,
          totalAmountSettled: 0,
          processingTime: 5
        },
        isValid: true,
        validationErrors: [],
        mathematicalProof: {
          totalDebits: 0,
          totalCredits: 0,
          netBalance: 0,
          isBalanced: true,
          precision: 2,
          validationTimestamp: new Date(),
          auditSteps: []
        }
      };

      mockDatabaseService.getPlayers.mockResolvedValue(players);
      mockTransactionService.getSessionTransactions.mockResolvedValue(transactions);

      await settlementService.initialize();
      const validation = await settlementService.validateSettlement(soloSettlement);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe('Audit Trail Completeness', () => {
    it('should generate complete 6-step audit trail for all validations', async () => {
      const testSettlement: OptimizedSettlement = {
        sessionId: mockSessionId,
        optimizedPayments: [
          { fromPlayerId: 'player1', fromPlayerName: 'Alice', toPlayerId: 'player2', toPlayerName: 'Bob', amount: 25, priority: 1 },
        ],
        directPayments: [],
        optimizationMetrics: {
          originalPaymentCount: 1,
          optimizedPaymentCount: 1,
          reductionPercentage: 0,
          totalAmountSettled: 25,
          processingTime: 40
        },
        isValid: true,
        validationErrors: [],
        mathematicalProof: {
          totalDebits: 25,
          totalCredits: 25,
          netBalance: 0,
          isBalanced: true,
          precision: 2,
          validationTimestamp: new Date(),
          auditSteps: []
        }
      };

      mockDatabaseService.getPlayers.mockResolvedValue([
        { id: 'player1', name: 'Alice', currentBalance: 75, status: 'active' },
        { id: 'player2', name: 'Bob', currentBalance: 125, status: 'active' },
      ]);

      mockTransactionService.getSessionTransactions.mockResolvedValue([
        { id: 'tx1', sessionId: mockSessionId, playerId: 'player1', type: 'buy_in', amount: 100, timestamp: new Date(), isVoided: false },
        { id: 'tx2', sessionId: mockSessionId, playerId: 'player2', type: 'buy_in', amount: 100, timestamp: new Date(), isVoided: false },
      ]);

      await settlementService.initialize();
      const validation = await settlementService.validateSettlement(testSettlement);

      expect(validation.auditTrail).toHaveLength(6);
      
      const expectedSteps = [
        'Mathematical Balance Validation',
        'Player Position Validation',
        'Precision Validation',
        'Real-time Validation',
        'Bank Balance Cross-validation',
        'Validation Summary'
      ];

      expectedSteps.forEach((expectedStep, index) => {
        expect(validation.auditTrail[index].operation).toBe(expectedStep);
        expect(validation.auditTrail[index].step).toBe(index + 1);
        expect(validation.auditTrail[index].timestamp).toBeDefined();
        expect(validation.auditTrail[index].details).toBeDefined();
        expect(validation.auditTrail[index].inputs).toBeDefined();
        expect(validation.auditTrail[index].outputs).toBeDefined();
      });
    });

    it('should include performance metrics in audit trail', async () => {
      const testSettlement: OptimizedSettlement = {
        sessionId: mockSessionId,
        optimizedPayments: [],
        directPayments: [],
        optimizationMetrics: {
          originalPaymentCount: 0,
          optimizedPaymentCount: 0,
          reductionPercentage: 0,
          totalAmountSettled: 0,
          processingTime: 15
        },
        isValid: true,
        validationErrors: [],
        mathematicalProof: {
          totalDebits: 0,
          totalCredits: 0,
          netBalance: 0,
          isBalanced: true,
          precision: 2,
          validationTimestamp: new Date(),
          auditSteps: []
        }
      };

      mockDatabaseService.getPlayers.mockResolvedValue([]);
      mockTransactionService.getSessionTransactions.mockResolvedValue([]);

      await settlementService.initialize();
      const validation = await settlementService.validateSettlement(testSettlement);

      // Validation summary should include performance metrics
      const summaryStep = validation.auditTrail.find(step => step.operation === 'Validation Summary');
      expect(summaryStep).toBeDefined();
      expect(summaryStep!.details).toContain('Performance');
      expect(summaryStep!.outputs.validationTime).toBeDefined();
      expect(typeof summaryStep!.outputs.validationTime).toBe('number');
    });
  });

  describe('Error Classification and Recovery', () => {
    it('should classify validation errors by severity correctly', async () => {
      const players: Player[] = [
        { id: 'player1', name: 'Alice', currentBalance: 100, status: 'active' },
        { id: 'player2', name: 'Bob', currentBalance: 50, status: 'active' },
      ];

      const transactions: Transaction[] = [
        { id: 'tx1', sessionId: mockSessionId, playerId: 'player1', type: 'buy_in', amount: 75, timestamp: new Date(), isVoided: false },
        { id: 'tx2', sessionId: mockSessionId, playerId: 'player2', type: 'buy_in', amount: 75, timestamp: new Date(), isVoided: false },
      ];

      // Create settlement with multiple error types
      const errorSettlement: OptimizedSettlement = {
        sessionId: mockSessionId,
        optimizedPayments: [
          // Major discrepancy: should be 25 from Bob to Alice, but showing 100
          { fromPlayerId: 'player2', fromPlayerName: 'Bob', toPlayerId: 'player1', toPlayerName: 'Alice', amount: 100, priority: 1 },
        ],
        directPayments: [],
        optimizationMetrics: {
          originalPaymentCount: 1,
          optimizedPaymentCount: 1,
          reductionPercentage: 0,
          totalAmountSettled: 100,
          processingTime: 60
        },
        isValid: false,
        validationErrors: [],
        mathematicalProof: {
          totalDebits: 100,
          totalCredits: 100,
          netBalance: 75, // Major imbalance
          isBalanced: false,
          precision: 2,
          validationTimestamp: new Date(),
          auditSteps: []
        }
      };

      mockDatabaseService.getPlayers.mockResolvedValue(players);
      mockTransactionService.getSessionTransactions.mockResolvedValue(transactions);

      await settlementService.initialize();
      const validation = await settlementService.validateSettlement(errorSettlement);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      
      // Should have multiple error types
      const balanceError = validation.errors.find(error => 
        error.code === ValidationErrorCode.BALANCE_MISMATCH);
      const positionError = validation.errors.find(error => 
        error.code === ValidationErrorCode.INVALID_PLAYER_STATE);
      
      expect(balanceError || positionError).toBeDefined();
      
      // Each error should have severity classification
      validation.errors.forEach(error => {
        expect(['critical', 'major', 'minor']).toContain(error.severity);
        expect(error.message).toBeDefined();
        expect(error.affectedPlayers).toBeDefined();
      });
    });
  });
});