/**
 * Settlement Validation Tests - Story 3.3, Task 1
 * Tests for comprehensive settlement validation engine
 */

import { SettlementService } from '../../../../src/services/settlement/SettlementService';
import { DatabaseService } from '../../../../src/services/infrastructure/DatabaseService';
import { TransactionService } from '../../../../src/services/core/TransactionService';
import { OptimizedSettlement, SettlementValidation } from '../../../../src/types/settlement';

// Mock dependencies
jest.mock('../../../../src/services/infrastructure/DatabaseService', () => ({
  DatabaseService: {
    getInstance: jest.fn()
  }
}));
jest.mock('../../../../src/services/core/TransactionService', () => ({
  TransactionService: {
    getInstance: jest.fn()
  }
}));
jest.mock('../../../../src/services/monitoring/CrashReportingService', () => ({
  CrashReportingService: {
    getInstance: jest.fn(() => ({
      reportServiceError: jest.fn(),
      reportPerformanceMetric: jest.fn(),
    }))
  }
}));

describe('SettlementValidation - Story 3.3 Task 1', () => {
  let settlementService: SettlementService;
  let mockDatabaseService: jest.Mocked<DatabaseService>;
  let mockTransactionService: jest.Mocked<TransactionService>;

  const mockSessionId = 'test-session-123';

  beforeEach(() => {
    // Clear singleton instance
    (SettlementService as any).instance = undefined;
    
    // Create mock instances
    mockDatabaseService = {
      initialize: jest.fn(),
      getSession: jest.fn(),
      getPlayers: jest.fn(),
    } as any;
    
    mockTransactionService = {
      getSessionTransactions: jest.fn(),
    } as any;
    
    // Setup getInstance mocks
    (DatabaseService.getInstance as jest.Mock).mockReturnValue(mockDatabaseService);
    (TransactionService.getInstance as jest.Mock).mockReturnValue(mockTransactionService);
    
    settlementService = SettlementService.getInstance();
    
    // Setup basic mocks
    mockDatabaseService.initialize.mockResolvedValue();
    mockDatabaseService.getSession.mockResolvedValue({
      id: mockSessionId,
      name: 'Test Session',
      status: 'active',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateSettlement method', () => {
    it('should validate a balanced settlement successfully', async () => {
      // Setup mock data for balanced settlement
      mockDatabaseService.getPlayers.mockResolvedValue([
        {
          id: 'player1',
          name: 'Player 1',
          currentBalance: 150,
          status: 'active',
        },
        {
          id: 'player2', 
          name: 'Player 2',
          currentBalance: 50,
          status: 'active',
        },
      ]);

      mockTransactionService.getSessionTransactions.mockResolvedValue([
        {
          id: 'tx1',
          sessionId: mockSessionId,
          playerId: 'player1',
          type: 'buy_in',
          amount: 100,
          timestamp: new Date(),
          isVoided: false,
        },
        {
          id: 'tx2',
          sessionId: mockSessionId,
          playerId: 'player2',
          type: 'buy_in',
          amount: 100,
          timestamp: new Date(),
          isVoided: false,
        },
      ]);

      // Create a simple balanced settlement
      const testSettlement: OptimizedSettlement = {
        sessionId: mockSessionId,
        optimizedPayments: [
          {
            fromPlayerId: 'player2',
            fromPlayerName: 'Player 2',
            toPlayerId: 'player1',
            toPlayerName: 'Player 1',
            amount: 50,
            priority: 1
          }
        ],
        directPayments: [],
        optimizationMetrics: {
          originalPaymentCount: 2,
          optimizedPaymentCount: 1,
          reductionPercentage: 50,
          totalAmountSettled: 50,
          processingTime: 100
        },
        isValid: true,
        validationErrors: [],
        mathematicalProof: {
          totalDebits: 50,
          totalCredits: 50,
          netBalance: 0,
          isBalanced: true,
          precision: 2,
          validationTimestamp: new Date(),
          auditSteps: []
        }
      };

      await settlementService.initialize();
      const validation: SettlementValidation = await settlementService.validateSettlement(testSettlement);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.auditTrail.length).toBeGreaterThan(0);
      
      // Check that all validation steps completed successfully
      const failedSteps = validation.auditTrail.filter(step => !step.validationCheck);
      expect(failedSteps).toHaveLength(0);
    });

    it('should detect mathematical balance issues', async () => {
      // Create a scenario where player positions don't match the settlement
      mockDatabaseService.getPlayers.mockResolvedValue([
        {
          id: 'player1',
          name: 'Player 1', 
          currentBalance: 150, // Player has 150 chips
          status: 'active',
        },
        {
          id: 'player2',
          name: 'Player 2',
          currentBalance: 50, // Player has 50 chips
          status: 'active',
        },
      ]);

      mockTransactionService.getSessionTransactions.mockResolvedValue([
        {
          id: 'tx1',
          sessionId: mockSessionId,
          playerId: 'player1',
          type: 'buy_in',
          amount: 100,
          timestamp: new Date(),
          isVoided: false,
        },
        {
          id: 'tx2',
          sessionId: mockSessionId,
          playerId: 'player2',
          type: 'buy_in',
          amount: 100,
          timestamp: new Date(),
          isVoided: false,
        },
      ]);

      // Settlement that doesn't match player positions
      // Player1: 150 chips - 100 buy-in = +50 net (should receive 50)
      // Player2: 50 chips - 100 buy-in = -50 net (should pay 50)  
      // But settlement says player1 pays player2 100 (wrong direction and amount)
      const unbalancedSettlement: OptimizedSettlement = {
        sessionId: mockSessionId,
        optimizedPayments: [
          {
            fromPlayerId: 'player1',
            fromPlayerName: 'Player 1',
            toPlayerId: 'player2',
            toPlayerName: 'Player 2',
            amount: 100, // Wrong - should be player2 paying player1 50
            priority: 1
          }
        ],
        directPayments: [],
        optimizationMetrics: {
          originalPaymentCount: 1,
          optimizedPaymentCount: 1,
          reductionPercentage: 0,
          totalAmountSettled: 100,
          processingTime: 50
        },
        isValid: false,
        validationErrors: [],
        mathematicalProof: {
          totalDebits: 100,
          totalCredits: 100,
          netBalance: 0,
          isBalanced: true,
          precision: 2,
          validationTimestamp: new Date(),
          auditSteps: []
        }
      };

      await settlementService.initialize();
      const validation = await settlementService.validateSettlement(unbalancedSettlement);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      
      // Should have player position validation error  
      const positionError = validation.errors.find(error => 
        error.code === 'INVALID_PLAYER_STATE');
      expect(positionError).toBeDefined();
    });

    it('should validate audit trail creation', async () => {
      // Simple settlement for audit trail testing
      const testSettlement: OptimizedSettlement = {
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

      mockDatabaseService.getPlayers.mockResolvedValue([]);
      mockTransactionService.getSessionTransactions.mockResolvedValue([]);

      await settlementService.initialize();
      const validation = await settlementService.validateSettlement(testSettlement);

      // Check audit trail structure
      expect(validation.auditTrail).toBeDefined();
      expect(validation.auditTrail.length).toBeGreaterThan(5); // Should have multiple validation steps
      
      // Check audit trail contains required steps
      const stepOperations = validation.auditTrail.map(step => step.operation);
      expect(stepOperations).toContain('Mathematical Balance Validation');
      expect(stepOperations).toContain('Player Position Validation');
      expect(stepOperations).toContain('Precision Validation');
      expect(stepOperations).toContain('Real-time Validation');
      expect(stepOperations).toContain('Bank Balance Cross-validation');
      expect(stepOperations).toContain('Validation Summary');
    });
  });

  describe('validation caching', () => {
    it('should cache validation results for performance', async () => {
      const testSettlement: OptimizedSettlement = {
        sessionId: mockSessionId,
        optimizedPayments: [
          {
            fromPlayerId: 'player1',
            fromPlayerName: 'Player 1',
            toPlayerId: 'player2',
            toPlayerName: 'Player 2',
            amount: 50,
            priority: 1
          }
        ],
        directPayments: [],
        optimizationMetrics: {
          originalPaymentCount: 1,
          optimizedPaymentCount: 1,
          reductionPercentage: 0,
          totalAmountSettled: 50,
          processingTime: 25
        },
        isValid: true,
        validationErrors: [],
        mathematicalProof: {
          totalDebits: 50,
          totalCredits: 50,
          netBalance: 0,
          isBalanced: true,
          precision: 2,
          validationTimestamp: new Date(),
          auditSteps: []
        }
      };

      mockDatabaseService.getPlayers.mockResolvedValue([
        {
          id: 'player1',
          name: 'Player 1',
          currentBalance: 50,
          status: 'active',
        },
        {
          id: 'player2',
          name: 'Player 2',
          currentBalance: 150,
          status: 'active',
        },
      ]);

      mockTransactionService.getSessionTransactions.mockResolvedValue([
        {
          id: 'tx1',
          sessionId: mockSessionId,
          playerId: 'player1',
          type: 'buy_in',
          amount: 100,
          timestamp: new Date(),
          isVoided: false,
        },
        {
          id: 'tx2',
          sessionId: mockSessionId,
          playerId: 'player2',
          type: 'buy_in',
          amount: 100,
          timestamp: new Date(),
          isVoided: false,
        },
      ]);

      await settlementService.initialize();
      
      // First validation call
      const validation1 = await settlementService.validateSettlement(testSettlement);
      
      // Second validation call - should use cache
      const validation2 = await settlementService.validateSettlement(testSettlement);

      expect(validation1.isValid).toBe(validation2.isValid);
      expect(validation1.errors.length).toBe(validation2.errors.length);
      expect(validation1.auditTrail.length).toBe(validation2.auditTrail.length);
    });
  });
});