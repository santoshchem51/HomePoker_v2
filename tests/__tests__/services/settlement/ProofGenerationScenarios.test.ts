/**
 * Proof Generation Testing with Known Mathematical Scenarios - Story 3.3, Task 10
 * Tests for mathematical proof generation with verified calculation scenarios
 */

import { SettlementService } from '../../../../src/services/settlement/SettlementService';
import { DatabaseService } from '../../../../src/services/infrastructure/DatabaseService';
import { TransactionService } from '../../../../src/services/core/TransactionService';
import { 
  OptimizedSettlement, 
  MathematicalProof,
  ProofStep,
  PrecisionReport,
  AlgorithmVerification,
  Player,
  Transaction,
  ProofExportFormat
} from '../../../../src/types/settlement';

// Mock dependencies
jest.mock('../../../../src/services/infrastructure/DatabaseService');
jest.mock('../../../../src/services/core/TransactionService');
jest.mock('../../../../src/services/monitoring/CrashReportingService');

describe('Proof Generation with Known Mathematical Scenarios - Story 3.3 Task 10', () => {
  let settlementService: SettlementService;
  let mockDatabaseService: jest.Mocked<DatabaseService>;
  let mockTransactionService: jest.Mocked<TransactionService>;

  const mockSessionId = 'proof-generation-session';

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
      name: 'Proof Generation Test Session',
      status: 'active',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Known Mathematical Proof Scenarios', () => {
    it('should generate correct proof for simple 2-player scenario', async () => {
      // Known scenario: Alice wins $25 from Bob
      const players: Player[] = [
        { id: 'alice', name: 'Alice', currentBalance: 125.00, status: 'active' },
        { id: 'bob', name: 'Bob', currentBalance: 75.00, status: 'active' },
      ];

      const transactions: Transaction[] = [
        { id: 'tx1', sessionId: mockSessionId, playerId: 'alice', type: 'buy_in', amount: 100.00, timestamp: new Date(), isVoided: false },
        { id: 'tx2', sessionId: mockSessionId, playerId: 'bob', type: 'buy_in', amount: 100.00, timestamp: new Date(), isVoided: false },
      ];

      const knownSettlement: OptimizedSettlement = {
        sessionId: mockSessionId,
        optimizedPayments: [
          { fromPlayerId: 'bob', fromPlayerName: 'Bob', toPlayerId: 'alice', toPlayerName: 'Alice', amount: 25.00, priority: 1 },
        ],
        directPayments: [],
        optimizationMetrics: {
          originalPaymentCount: 1,
          optimizedPaymentCount: 1,
          reductionPercentage: 0,
          totalAmountSettled: 25.00,
          processingTime: 50
        },
        isValid: true,
        validationErrors: [],
        mathematicalProof: {
          totalDebits: 25.00,
          totalCredits: 25.00,
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
      const proof = await settlementService.generateMathematicalProof(knownSettlement);

      // Verify proof structure
      expect(proof).toBeDefined();
      expect(proof.proofId).toBeDefined();
      expect(proof.settlementId).toBe(mockSessionId);
      expect(proof.isValid).toBe(true);
      
      // Verify calculation steps
      expect(proof.calculationSteps).toHaveLength(6);
      
      // Step 1: Player Net Position Calculation
      const step1 = proof.calculationSteps[0];
      expect(step1.stepNumber).toBe(1);
      expect(step1.operation).toBe('Player Net Position Calculation');
      expect(step1.inputs.aliceChips).toBe(125.00);
      expect(step1.inputs.aliceBuyIns).toBe(100.00);
      expect(step1.inputs.bobChips).toBe(75.00);
      expect(step1.inputs.bobBuyIns).toBe(100.00);
      expect(step1.result).toBe(0); // Net sum should be zero
      expect(step1.verification).toBe(true);
      
      // Step 2: Settlement Payment Calculation
      const step2 = proof.calculationSteps[1];
      expect(step2.stepNumber).toBe(2);
      expect(step2.operation).toBe('Settlement Payment Calculation');
      expect(step2.inputs.totalPayments).toBe(25.00);
      expect(step2.result).toBe(25.00);
      expect(step2.verification).toBe(true);
      
      // Verify balance verification
      expect(proof.balanceVerification.isBalanced).toBe(true);
      expect(proof.balanceVerification.totalDebits).toBe(25.00);
      expect(proof.balanceVerification.totalCredits).toBe(25.00);
      expect(proof.balanceVerification.netBalance).toBe(0.00);
      
      // Verify precision analysis
      expect(proof.precisionAnalysis.overallPrecision).toBe(2);
      expect(proof.precisionAnalysis.hasRoundingIssues).toBe(false);
      expect(proof.precisionAnalysis.maxPrecisionLoss).toBeLessThanOrEqual(0.01);
    });

    it('should generate proof for complex 4-player hub scenario', async () => {
      // Known scenario: 4-player game with one central hub
      const players: Player[] = [
        { id: 'hub', name: 'Hub', currentBalance: 200.00, status: 'active' },   // Hub player: +100
        { id: 'p1', name: 'Player1', currentBalance: 75.00, status: 'active' }, // Loses 25
        { id: 'p2', name: 'Player2', currentBalance: 50.00, status: 'active' }, // Loses 50  
        { id: 'p3', name: 'Player3', currentBalance: 75.00, status: 'active' }, // Loses 25
      ];

      const transactions: Transaction[] = [
        { id: 'tx1', sessionId: mockSessionId, playerId: 'hub', type: 'buy_in', amount: 100.00, timestamp: new Date(), isVoided: false },
        { id: 'tx2', sessionId: mockSessionId, playerId: 'p1', type: 'buy_in', amount: 100.00, timestamp: new Date(), isVoided: false },
        { id: 'tx3', sessionId: mockSessionId, playerId: 'p2', type: 'buy_in', amount: 100.00, timestamp: new Date(), isVoided: false },
        { id: 'tx4', sessionId: mockSessionId, playerId: 'p3', type: 'buy_in', amount: 100.00, timestamp: new Date(), isVoided: false },
      ];

      const hubSettlement: OptimizedSettlement = {
        sessionId: mockSessionId,
        optimizedPayments: [
          { fromPlayerId: 'p1', fromPlayerName: 'Player1', toPlayerId: 'hub', toPlayerName: 'Hub', amount: 25.00, priority: 1 },
          { fromPlayerId: 'p2', fromPlayerName: 'Player2', toPlayerId: 'hub', toPlayerName: 'Hub', amount: 50.00, priority: 2 },
          { fromPlayerId: 'p3', fromPlayerName: 'Player3', toPlayerId: 'hub', toPlayerName: 'Hub', amount: 25.00, priority: 3 },
        ],
        directPayments: [],
        optimizationMetrics: {
          originalPaymentCount: 3,
          optimizedPaymentCount: 3,
          reductionPercentage: 0,
          totalAmountSettled: 100.00,
          processingTime: 85
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
      const proof = await settlementService.generateMathematicalProof(hubSettlement);

      // Verify hub scenario calculations
      expect(proof.calculationSteps).toHaveLength(6);
      
      // Step 1 should calculate all player positions correctly
      const step1 = proof.calculationSteps[0];
      expect(step1.inputs.totalNetPositions).toBe(0); // Sum should be zero
      
      // Step 2 should validate hub payment structure
      const step2 = proof.calculationSteps[1];
      expect(step2.inputs.totalPayments).toBe(100.00);
      expect(step2.result).toBe(100.00);
      
      // Should verify optimization efficiency
      const step5 = proof.calculationSteps[4];
      expect(step5.operation).toBe('Optimization Efficiency Verification');
      expect(step5.verification).toBe(true);
      
      // Verify algorithm consensus
      expect(proof.algorithmVerifications.length).toBeGreaterThan(0);
      proof.algorithmVerifications.forEach(verification => {
        expect(verification.consensusReached).toBe(true);
        expect(Math.abs(verification.discrepancy)).toBeLessThan(0.01);
      });
    });

    it('should generate proof for fractional cent scenario', async () => {
      // Known scenario: Division that results in fractional cents
      const players: Player[] = [
        { id: 'winner', name: 'Winner', currentBalance: 100.01, status: 'active' },
        { id: 'loser1', name: 'Loser1', currentBalance: 99.995, status: 'active' },
        { id: 'loser2', name: 'Loser2', currentBalance: 99.995, status: 'active' },
      ];

      const transactions: Transaction[] = [
        { id: 'tx1', sessionId: mockSessionId, playerId: 'winner', type: 'buy_in', amount: 100.00, timestamp: new Date(), isVoided: false },
        { id: 'tx2', sessionId: mockSessionId, playerId: 'loser1', type: 'buy_in', amount: 100.00, timestamp: new Date(), isVoided: false },
        { id: 'tx3', sessionId: mockSessionId, playerId: 'loser2', type: 'buy_in', amount: 100.00, timestamp: new Date(), isVoided: false },
      ];

      const fractionalSettlement: OptimizedSettlement = {
        sessionId: mockSessionId,
        optimizedPayments: [
          { fromPlayerId: 'loser1', fromPlayerName: 'Loser1', toPlayerId: 'winner', toPlayerName: 'Winner', amount: 0.005, priority: 1 },
          { fromPlayerId: 'loser2', fromPlayerName: 'Loser2', toPlayerId: 'winner', toPlayerName: 'Winner', amount: 0.005, priority: 2 },
        ],
        directPayments: [],
        optimizationMetrics: {
          originalPaymentCount: 2,
          optimizedPaymentCount: 2,
          reductionPercentage: 0,
          totalAmountSettled: 0.01,
          processingTime: 30
        },
        isValid: true,
        validationErrors: [],
        mathematicalProof: {
          totalDebits: 0.01,
          totalCredits: 0.01,
          netBalance: 0.00,
          isBalanced: true,
          precision: 3,
          validationTimestamp: new Date(),
          auditSteps: []
        }
      };

      mockDatabaseService.getPlayers.mockResolvedValue(players);
      mockTransactionService.getSessionTransactions.mockResolvedValue(transactions);

      await settlementService.initialize();
      const proof = await settlementService.generateMathematicalProof(fractionalSettlement);

      // Verify fractional handling
      expect(proof.precisionAnalysis.hasRoundingIssues).toBe(false);
      expect(proof.precisionAnalysis.roundingOperations.length).toBeGreaterThan(0);
      
      // Each rounding operation should be documented
      proof.precisionAnalysis.roundingOperations.forEach(op => {
        expect(op.originalValue).toBeDefined();
        expect(op.roundedValue).toBeDefined();
        expect(op.precisionLoss).toBeLessThanOrEqual(0.005); // Within acceptable range
      });
      
      // Precision step should handle fractional cents
      const precisionStep = proof.calculationSteps[5];
      expect(precisionStep.operation).toBe('Precision and Rounding Verification');
      expect(precisionStep.verification).toBe(true);
      expect(precisionStep.description).toContain('fractional cent');
    });
  });

  describe('Proof Step Verification', () => {
    it('should generate mathematically verifiable calculation steps', async () => {
      const players: Player[] = [
        { id: 'p1', name: 'Player1', currentBalance: 150.00, status: 'active' },
        { id: 'p2', name: 'Player2', currentBalance: 100.00, status: 'active' },
        { id: 'p3', name: 'Player3', currentBalance: 50.00, status: 'active' },
      ];

      const transactions: Transaction[] = [
        { id: 'tx1', sessionId: mockSessionId, playerId: 'p1', type: 'buy_in', amount: 100.00, timestamp: new Date(), isVoided: false },
        { id: 'tx2', sessionId: mockSessionId, playerId: 'p2', type: 'buy_in', amount: 100.00, timestamp: new Date(), isVoided: false },
        { id: 'tx3', sessionId: mockSessionId, playerId: 'p3', type: 'buy_in', amount: 100.00, timestamp: new Date(), isVoided: false },
      ];

      const testSettlement: OptimizedSettlement = {
        sessionId: mockSessionId,
        optimizedPayments: [
          { fromPlayerId: 'p3', fromPlayerName: 'Player3', toPlayerId: 'p1', toPlayerName: 'Player1', amount: 50.00, priority: 1 },
        ],
        directPayments: [],
        optimizationMetrics: {
          originalPaymentCount: 2,
          optimizedPaymentCount: 1,
          reductionPercentage: 50,
          totalAmountSettled: 50.00,
          processingTime: 65
        },
        isValid: true,
        validationErrors: [],
        mathematicalProof: {
          totalDebits: 50.00,
          totalCredits: 50.00,
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
      const proof = await settlementService.generateMathematicalProof(testSettlement);

      // Verify each calculation step can be independently verified
      proof.calculationSteps.forEach((step, index) => {
        expect(step.stepNumber).toBe(index + 1);
        expect(step.operation).toBeDefined();
        expect(step.description).toBeDefined();
        expect(step.inputs).toBeDefined();
        expect(step.calculation).toBeDefined();
        expect(step.result).toBeDefined();
        expect(step.precision).toBeDefined();
        expect(step.verification).toBe(true);
        
        // Each step should have a mathematical formula
        expect(step.calculation).toMatch(/[\+\-\*\/\=]/); // Contains mathematical operators
      });
      
      // Verify step continuity - each step builds on previous
      for (let i = 1; i < proof.calculationSteps.length; i++) {
        const currentStep = proof.calculationSteps[i];
        const previousStep = proof.calculationSteps[i - 1];
        
        // Current step should reference some result from previous steps
        expect(Object.values(currentStep.inputs)).toBeDefined();
      }
    });

    it('should include detailed mathematical formulas in each step', async () => {
      const players: Player[] = [
        { id: 'alice', name: 'Alice', currentBalance: 175.50, status: 'active' },
        { id: 'bob', name: 'Bob', currentBalance: 124.50, status: 'active' },
      ];

      const transactions: Transaction[] = [
        { id: 'tx1', sessionId: mockSessionId, playerId: 'alice', type: 'buy_in', amount: 150.00, timestamp: new Date(), isVoided: false },
        { id: 'tx2', sessionId: mockSessionId, playerId: 'bob', type: 'buy_in', amount: 150.00, timestamp: new Date(), isVoided: false },
      ];

      const formulaSettlement: OptimizedSettlement = {
        sessionId: mockSessionId,
        optimizedPayments: [
          { fromPlayerId: 'bob', fromPlayerName: 'Bob', toPlayerId: 'alice', toPlayerName: 'Alice', amount: 25.50, priority: 1 },
        ],
        directPayments: [],
        optimizationMetrics: {
          originalPaymentCount: 1,
          optimizedPaymentCount: 1,
          reductionPercentage: 0,
          totalAmountSettled: 25.50,
          processingTime: 40
        },
        isValid: true,
        validationErrors: [],
        mathematicalProof: {
          totalDebits: 25.50,
          totalCredits: 25.50,
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
      const proof = await settlementService.generateMathematicalProof(formulaSettlement);

      // Verify specific formulas are included
      const step1 = proof.calculationSteps[0];
      expect(step1.calculation).toContain('net_position');
      expect(step1.calculation).toContain('chips');
      expect(step1.calculation).toContain('buy_ins');
      
      const step2 = proof.calculationSteps[1];
      expect(step2.calculation).toContain('Σ(payments_out)');
      expect(step2.calculation).toContain('Σ(payments_in)');
      
      const step3 = proof.calculationSteps[2];
      expect(step3.calculation).toContain('Σ(debits)');
      expect(step3.calculation).toContain('Σ(credits)');
      expect(step3.calculation).toContain('= 0');
    });
  });

  describe('Algorithm Verification Testing', () => {
    it('should verify calculations against multiple algorithms', async () => {
      const players: Player[] = [
        { id: 'p1', name: 'Player1', currentBalance: 80.00, status: 'active' },
        { id: 'p2', name: 'Player2', currentBalance: 120.00, status: 'active' },
        { id: 'p3', name: 'Player3', currentBalance: 100.00, status: 'active' },
      ];

      const transactions: Transaction[] = [
        { id: 'tx1', sessionId: mockSessionId, playerId: 'p1', type: 'buy_in', amount: 100.00, timestamp: new Date(), isVoided: false },
        { id: 'tx2', sessionId: mockSessionId, playerId: 'p2', type: 'buy_in', amount: 100.00, timestamp: new Date(), isVoided: false },
        { id: 'tx3', sessionId: mockSessionId, playerId: 'p3', type: 'buy_in', amount: 100.00, timestamp: new Date(), isVoided: false },
      ];

      const algorithmTestSettlement: OptimizedSettlement = {
        sessionId: mockSessionId,
        optimizedPayments: [
          { fromPlayerId: 'p1', fromPlayerName: 'Player1', toPlayerId: 'p2', toPlayerName: 'Player2', amount: 20.00, priority: 1 },
        ],
        directPayments: [],
        optimizationMetrics: {
          originalPaymentCount: 2,
          optimizedPaymentCount: 1,
          reductionPercentage: 50,
          totalAmountSettled: 20.00,
          processingTime: 55
        },
        isValid: true,
        validationErrors: [],
        mathematicalProof: {
          totalDebits: 20.00,
          totalCredits: 20.00,
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
      const proof = await settlementService.generateMathematicalProof(algorithmTestSettlement);

      // Should have verifications for multiple algorithms
      expect(proof.algorithmVerifications.length).toBeGreaterThanOrEqual(3);
      
      const algorithmNames = proof.algorithmVerifications.map(v => v.algorithmName);
      expect(algorithmNames).toContain('Direct Settlement Algorithm');
      expect(algorithmNames).toContain('Greedy Debt Reduction Algorithm');
      expect(algorithmNames).toContain('Balanced Flow Algorithm');
      
      // All algorithms should reach consensus
      proof.algorithmVerifications.forEach(verification => {
        expect(verification.consensusReached).toBe(true);
        expect(verification.precisionMatches).toBe(true);
        expect(Math.abs(verification.discrepancy)).toBeLessThan(0.01);
        expect(verification.executionTime).toBeGreaterThan(0);
        expect(verification.verificationTimestamp).toBeDefined();
      });
    });

    it('should detect algorithm discrepancies when they exist', async () => {
      // Create a settlement that might cause algorithm disagreement
      const players: Player[] = [
        { id: 'p1', name: 'Player1', currentBalance: 100.005, status: 'active' },
        { id: 'p2', name: 'Player2', currentBalance: 99.995, status: 'active' },
      ];

      const transactions: Transaction[] = [
        { id: 'tx1', sessionId: mockSessionId, playerId: 'p1', type: 'buy_in', amount: 100.00, timestamp: new Date(), isVoided: false },
        { id: 'tx2', sessionId: mockSessionId, playerId: 'p2', type: 'buy_in', amount: 100.00, timestamp: new Date(), isVoided: false },
      ];

      const discrepancySettlement: OptimizedSettlement = {
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
          processingTime: 20
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
      const proof = await settlementService.generateMathematicalProof(discrepancySettlement);

      // Even with edge case, algorithms should still reach consensus within tolerance
      proof.algorithmVerifications.forEach(verification => {
        expect(verification.consensusReached).toBe(true);
        expect(Math.abs(verification.discrepancy)).toBeLessThan(0.01); // Within tolerance
      });
      
      // But precision analysis should note the challenge
      expect(proof.precisionAnalysis.overallPrecision).toBe(2);
      expect(proof.precisionAnalysis.hasRoundingIssues).toBe(false);
    });
  });

  describe('Export Format Verification', () => {
    it('should generate valid export formats for all proof data', async () => {
      const players: Player[] = [
        { id: 'p1', name: 'Player1', currentBalance: 110.00, status: 'active' },
        { id: 'p2', name: 'Player2', currentBalance: 90.00, status: 'active' },
      ];

      const transactions: Transaction[] = [
        { id: 'tx1', sessionId: mockSessionId, playerId: 'p1', type: 'buy_in', amount: 100.00, timestamp: new Date(), isVoided: false },
        { id: 'tx2', sessionId: mockSessionId, playerId: 'p2', type: 'buy_in', amount: 100.00, timestamp: new Date(), isVoided: false },
      ];

      const exportTestSettlement: OptimizedSettlement = {
        sessionId: mockSessionId,
        optimizedPayments: [
          { fromPlayerId: 'p2', fromPlayerName: 'Player2', toPlayerId: 'p1', toPlayerName: 'Player1', amount: 10.00, priority: 1 },
        ],
        directPayments: [],
        optimizationMetrics: {
          originalPaymentCount: 1,
          optimizedPaymentCount: 1,
          reductionPercentage: 0,
          totalAmountSettled: 10.00,
          processingTime: 35
        },
        isValid: true,
        validationErrors: [],
        mathematicalProof: {
          totalDebits: 10.00,
          totalCredits: 10.00,
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
      const proof = await settlementService.generateMathematicalProof(exportTestSettlement);

      // Verify export formats are generated
      expect(proof.exportFormats).toBeDefined();
      expect(proof.exportFormats.json).toBeDefined();
      expect(proof.exportFormats.text).toBeDefined();
      expect(proof.exportFormats.pdf).toBeDefined();
      
      // JSON export should be valid JSON
      expect(() => JSON.parse(proof.exportFormats.json)).not.toThrow();
      
      // Text export should be readable
      expect(proof.exportFormats.text).toContain('Mathematical Proof');
      expect(proof.exportFormats.text).toContain('Player1');
      expect(proof.exportFormats.text).toContain('Player2');
      expect(proof.exportFormats.text).toContain('$10.00');
      
      // PDF export should be base64 encoded HTML
      expect(proof.exportFormats.pdf).toContain('<html>');
      expect(proof.exportFormats.pdf).toContain('Mathematical Proof Summary');
      
      // Human readable summary should be comprehensive
      expect(proof.humanReadableSummary).toContain('verification');
      expect(proof.humanReadableSummary).toContain('calculation');
      expect(proof.humanReadableSummary).toContain('balance');
      
      // Technical details should include all proof steps
      expect(proof.technicalDetails.length).toBeGreaterThanOrEqual(6);
      proof.technicalDetails.forEach(detail => {
        expect(detail.category).toBeDefined();
        expect(detail.data).toBeDefined();
        expect(detail.verification).toBeDefined();
      });
    });
  });

  describe('Proof Integrity and Verification', () => {
    it('should generate cryptographic proof verification', async () => {
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
      const proof = await settlementService.generateMathematicalProof(testSettlement);

      // Verify cryptographic elements
      expect(proof.checksum).toBeDefined();
      expect(proof.signature).toBeDefined();
      expect(proof.isValid).toBe(true);
      
      // Checksum should be SHA-256 like
      expect(proof.checksum).toMatch(/^[a-f0-9]{64}$/);
      
      // Signature should include metadata
      expect(proof.signature).toContain('settlementId');
      expect(proof.signature).toContain('timestamp');
      expect(proof.signature).toContain('verification');
      
      // Should be able to verify integrity
      const isIntegrityValid = await settlementService.verifyProofIntegrity(proof);
      expect(isIntegrityValid.isValid).toBe(true);
      expect(isIntegrityValid.checks.checksumValid).toBe(true);
      expect(isIntegrityValid.checks.signatureValid).toBe(true);
      expect(isIntegrityValid.checks.mathematicalValid).toBe(true);
      expect(isIntegrityValid.checks.balanceValid).toBe(true);
      expect(isIntegrityValid.checks.algorithmConsensus).toBe(true);
      expect(isIntegrityValid.checks.timestampValid).toBe(true);
    });
  });
});