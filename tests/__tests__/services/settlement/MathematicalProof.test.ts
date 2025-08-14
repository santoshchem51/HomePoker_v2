/**
 * Mathematical Proof System Tests - Story 3.3, Task 2
 * Tests for Advanced Mathematical Proof System with step-by-step audit trails
 */

import { SettlementService } from '../../../../src/services/settlement/SettlementService';
import { DatabaseService } from '../../../../src/services/infrastructure/DatabaseService';
import { TransactionService } from '../../../../src/services/core/TransactionService';
import { 
  OptimizedSettlement, 
  PaymentPlan, 
  BalanceValidation, 
  MathematicalProof,
  ProofStep,
  PrecisionReport,
  AlgorithmVerification,
  ProofExportFormat
} from '../../../../src/types/settlement';

// Mock dependencies
jest.mock('../../../../src/services/infrastructure/DatabaseService');
jest.mock('../../../../src/services/core/TransactionService');
jest.mock('../../../../src/services/monitoring/CrashReportingService');

describe('Mathematical Proof System', () => {
  let settlementService: SettlementService;
  let mockDatabaseService: jest.Mocked<DatabaseService>;
  let mockTransactionService: jest.Mocked<TransactionService>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup mock services
    mockDatabaseService = {
      getInstance: jest.fn().mockReturnThis(),
      initialize: jest.fn().mockResolvedValue(undefined),
      getSession: jest.fn(),
      getPlayers: jest.fn(),
    } as any;

    mockTransactionService = {
      getInstance: jest.fn().mockReturnThis(),
      getTransactionHistory: jest.fn(),
      getSessionTransactions: jest.fn(),
    } as any;

    // Mock static methods
    (DatabaseService.getInstance as jest.Mock).mockReturnValue(mockDatabaseService);
    (TransactionService.getInstance as jest.Mock).mockReturnValue(mockTransactionService);

    settlementService = SettlementService.getInstance();
  });

  describe('generateMathematicalProof', () => {
    it('should generate comprehensive mathematical proof with all required components', async () => {
      // Setup test data
      const testSettlement = createTestOptimizedSettlement();
      setupMockData();

      // Generate mathematical proof
      const proof = await settlementService.generateMathematicalProof(testSettlement);

      // Verify proof structure
      expect(proof).toMatchObject({
        settlementId: testSettlement.sessionId,
        proofId: expect.stringMatching(/^proof_\d+_[a-z0-9]+$/),
        generatedAt: expect.any(Date),
        isValid: true
      });

      // Verify calculation steps
      expect(proof.calculationSteps).toHaveLength(6);
      expect(proof.calculationSteps[0]).toMatchObject({
        stepNumber: 1,
        operation: 'Player Net Position Calculation',
        verification: true,
        tolerance: 0.01
      });

      // Verify precision analysis
      expect(proof.precisionAnalysis).toMatchObject({
        originalPrecision: 2,
        isWithinTolerance: true,
        fractionalCentIssues: []
      });

      // Verify algorithm verifications
      expect(proof.alternativeAlgorithmResults).toHaveLength(3);
      expect(proof.alternativeAlgorithmResults[0].algorithmName).toBe('Direct Settlement');
      expect(proof.alternativeAlgorithmResults[1].algorithmName).toBe('Greedy Debt Reduction');
      expect(proof.alternativeAlgorithmResults[2].algorithmName).toBe('Balanced Flow');

      // Verify export formats
      expect(proof.exportFormats.json).toBeDefined();
      expect(proof.exportFormats.text).toBeDefined();
      expect(proof.exportFormats.json.metadata.proofId).toBe(proof.proofId);

      // Verify human readable summary
      expect(proof.humanReadableSummary).toContain('Mathematical Proof Summary');
      expect(proof.humanReadableSummary).toContain('Optimization Achieved');
      expect(proof.humanReadableSummary).toContain('✓ Verified');

      // Verify checksum and signature
      expect(proof.checksum).toBeDefined();
      expect(proof.signature).toBeDefined();
      expect(proof.checksum).toMatch(/^[a-z0-9]+$/);
    });

    it('should generate detailed step-by-step calculation audit trail', async () => {
      const testSettlement = createTestOptimizedSettlement();
      setupMockData();

      const proof = await settlementService.generateMathematicalProof(testSettlement);

      // Verify calculation steps detail
      const steps = proof.calculationSteps;
      
      // Step 1: Player Net Position Calculation
      expect(steps[0]).toMatchObject({
        stepNumber: 1,
        operation: 'Player Net Position Calculation',
        description: expect.stringContaining('Calculate each player\'s net position'),
        calculation: 'NetPosition = (CurrentChips + CashOuts) - BuyIns',
        precision: 2,
        verification: true
      });

      // Step 2: Settlement Payment Calculation
      expect(steps[1]).toMatchObject({
        stepNumber: 2,
        operation: 'Settlement Payment Calculation',
        description: expect.stringContaining('Calculate total settlement payment amounts'),
        calculation: 'TotalPayments = Σ(PaymentAmounts)',
        verification: true
      });

      // Step 3: Mathematical Balance Verification
      expect(steps[2]).toMatchObject({
        stepNumber: 3,
        operation: 'Mathematical Balance Verification',
        description: expect.stringContaining('Verify total debits equal total credits'),
        calculation: 'NetBalance = TotalCredits - TotalDebits',
        result: 0,
        verification: true
      });

      // Verify each step has required properties
      steps.forEach((step, index) => {
        expect(step.stepNumber).toBe(index + 1);
        expect(step.operation).toBeDefined();
        expect(step.description).toBeDefined();
        expect(step.inputs).toBeDefined();
        expect(step.calculation).toBeDefined();
        expect(step.result).toBeDefined();
        expect(step.precision).toBeGreaterThanOrEqual(0);
        expect(typeof step.verification).toBe('boolean');
        expect(step.tolerance).toBeGreaterThanOrEqual(0);
      });
    });

    it('should perform precision tracking and rounding validation', async () => {
      // Create settlement with fractional amounts
      const testSettlement = createTestOptimizedSettlementWithFractionalAmounts();
      setupMockData();

      const proof = await settlementService.generateMathematicalProof(testSettlement);

      // Verify precision analysis
      const precisionAnalysis = proof.precisionAnalysis;
      expect(precisionAnalysis).toMatchObject({
        originalPrecision: 2,
        calculatedPrecision: expect.any(Number),
        roundingOperations: expect.any(Array),
        precisionLoss: expect.any(Number),
        isWithinTolerance: expect.any(Boolean),
        fractionalCentIssues: expect.any(Array)
      });

      // Verify fractional cent issues are detected
      if (precisionAnalysis.fractionalCentIssues.length > 0) {
        precisionAnalysis.fractionalCentIssues.forEach(issue => {
          expect(issue).toMatchObject({
            playerId: expect.any(String),
            playerName: expect.any(String),
            originalAmount: expect.any(Number),
            adjustedAmount: expect.any(Number),
            adjustmentReason: expect.stringContaining('Fractional cent')
          });
        });
      }

      // Verify rounding operations tracking
      if (precisionAnalysis.roundingOperations.length > 0) {
        precisionAnalysis.roundingOperations.forEach(operation => {
          expect(operation).toMatchObject({
            operation: expect.any(String),
            originalValue: expect.any(Number),
            roundedValue: expect.any(Number),
            roundingMode: 'round',
            precisionLoss: expect.any(Number),
            step: expect.any(Number)
          });
        });
      }
    });

    it('should verify calculations against multiple algorithms', async () => {
      const testSettlement = createTestOptimizedSettlement();
      setupMockData();

      const proof = await settlementService.generateMathematicalProof(testSettlement);

      // Verify algorithm verifications
      const algorithmVerifications = proof.alternativeAlgorithmResults;
      expect(algorithmVerifications).toHaveLength(3);

      // Verify each algorithm verification
      algorithmVerifications.forEach(verification => {
        expect(verification).toMatchObject({
          algorithmName: expect.any(String),
          algorithmType: expect.stringMatching(/^(greedy|direct|minimal_transactions|balanced_flow)$/),
          paymentPlan: expect.any(Array),
          transactionCount: expect.any(Number),
          totalAmount: expect.any(Number),
          isBalanced: true,
          balanceDiscrepancy: expect.any(Number),
          verificationResult: true
        });

        // Verify payment plan structure
        verification.paymentPlan.forEach(payment => {
          expect(payment).toMatchObject({
            fromPlayerId: expect.any(String),
            fromPlayerName: expect.any(String),
            toPlayerId: expect.any(String),
            toPlayerName: expect.any(String),
            amount: expect.any(Number),
            priority: expect.any(Number)
          });
        });
      });

      // Verify algorithm consensus
      const allAlgorithmsVerified = algorithmVerifications.every(v => v.verificationResult);
      expect(allAlgorithmsVerified).toBe(true);
    });

    it('should create exportable mathematical proof documentation', async () => {
      const testSettlement = createTestOptimizedSettlement();
      setupMockData();

      const proof = await settlementService.generateMathematicalProof(testSettlement);

      // Verify JSON export format
      const jsonExport = proof.exportFormats.json;
      expect(jsonExport).toMatchObject({
        metadata: {
          proofId: proof.proofId,
          settlementId: testSettlement.sessionId,
          generatedAt: expect.any(Date),
          version: '1.0'
        },
        playerPositions: expect.any(Array),
        settlements: expect.any(Array),
        balanceVerification: expect.any(Object),
        algorithmComparison: expect.any(Object),
        precisionAnalysis: expect.any(Object)
      });

      // Verify player positions in JSON export
      jsonExport.playerPositions.forEach(playerPos => {
        expect(playerPos).toMatchObject({
          playerId: expect.any(String),
          playerName: expect.any(String),
          buyIns: expect.any(Number),
          cashOuts: expect.any(Number),
          currentChips: expect.any(Number),
          netPosition: expect.any(Number),
          settlementAmount: expect.any(Number),
          settlementType: expect.stringMatching(/^(receive|pay|even)$/),
          verification: expect.any(Boolean)
        });
      });

      // Verify text export format (WhatsApp-friendly)
      const textExport = proof.exportFormats.text;
      expect(textExport).toContain('🏆 POKER SETTLEMENT PROOF');
      expect(textExport).toContain('Session:');
      expect(textExport).toContain('💰 Settlement:');
      expect(textExport).toContain('📊 Optimization:');
      expect(textExport).toContain('✅ Verification:');
      expect(textExport).toContain('Mathematical balance confirmed');

      // Verify technical details
      expect(proof.technicalDetails).toHaveLength(3);
      proof.technicalDetails.forEach(detail => {
        expect(detail).toMatchObject({
          section: expect.any(String),
          title: expect.any(String),
          content: expect.any(String)
        });
      });
    });

    it('should handle calculation errors gracefully', async () => {
      const testSettlement = createTestOptimizedSettlement();
      
      // Mock database error
      mockDatabaseService.getPlayers.mockRejectedValue(new Error('Database connection failed'));

      await expect(settlementService.generateMathematicalProof(testSettlement))
        .rejects.toThrow('Mathematical proof generation failed');
    });

    it('should validate proof integrity and generate checksums', async () => {
      const testSettlement = createTestOptimizedSettlement();
      setupMockData();

      const proof = await settlementService.generateMathematicalProof(testSettlement);

      // Verify proof integrity
      expect(proof.isValid).toBe(true);
      expect(proof.checksum).toBeDefined();
      expect(proof.signature).toBeDefined();

      // Verify checksum format
      expect(proof.checksum).toMatch(/^[a-z0-9]+$/);
      expect(proof.signature).toMatch(/^[a-z0-9]+$/);

      // Verify checksums are different
      expect(proof.checksum).not.toBe(proof.signature);

      // Generate another proof and verify checksums are different
      const proof2 = await settlementService.generateMathematicalProof(testSettlement);
      expect(proof2.checksum).not.toBe(proof.checksum);
      expect(proof2.signature).not.toBe(proof.signature);
    });
  });

  // Helper functions
  function createTestOptimizedSettlement(): OptimizedSettlement {
    const optimizedPayments: PaymentPlan[] = [
      {
        fromPlayerId: 'player2',
        fromPlayerName: 'Alice',
        toPlayerId: 'player1',
        toPlayerName: 'Bob',
        amount: 25.00,
        priority: 1
      },
      {
        fromPlayerId: 'player3',
        fromPlayerName: 'Charlie',
        toPlayerId: 'player1',
        toPlayerName: 'Bob',
        amount: 10.00,
        priority: 2
      }
    ];

    const directPayments: PaymentPlan[] = [
      ...optimizedPayments,
      {
        fromPlayerId: 'player1',
        fromPlayerName: 'Bob',
        toPlayerId: 'player4',
        toPlayerName: 'David',
        amount: 15.00,
        priority: 3
      }
    ];

    const balanceValidation: BalanceValidation = {
      totalDebits: 35.00,
      totalCredits: 35.00,
      netBalance: 0.00,
      isBalanced: true,
      precision: 2,
      validationTimestamp: new Date(),
      auditSteps: []
    };

    return {
      sessionId: 'test-session-123',
      optimizedPayments,
      directPayments,
      optimizationMetrics: {
        originalPaymentCount: 3,
        optimizedPaymentCount: 2,
        reductionPercentage: 33.33,
        totalAmountSettled: 35.00,
        processingTime: 150
      },
      isValid: true,
      validationErrors: [],
      mathematicalProof: balanceValidation
    };
  }

  function createTestOptimizedSettlementWithFractionalAmounts(): OptimizedSettlement {
    const settlement = createTestOptimizedSettlement();
    
    // Add fractional amounts to test precision handling
    settlement.optimizedPayments[0].amount = 25.003; // Fractional cents
    settlement.optimizedPayments[1].amount = 9.997; // Fractional cents
    
    return settlement;
  }

  function setupMockData() {
    // Mock player data
    const mockPlayers = [
      {
        id: 'player1',
        name: 'Bob',
        currentBalance: 135.00,
        status: 'active'
      },
      {
        id: 'player2',
        name: 'Alice',
        currentBalance: 75.00,
        status: 'active'
      },
      {
        id: 'player3',
        name: 'Charlie',
        currentBalance: 90.00,
        status: 'active'
      },
      {
        id: 'player4',
        name: 'David',
        currentBalance: 0,
        status: 'cashed_out'
      }
    ];

    // Mock transaction history
    const mockTransactions = [
      {
        id: 'tx1',
        playerId: 'player1',
        type: 'buy_in',
        amount: 100.00,
        timestamp: new Date(),
        status: 'completed'
      },
      {
        id: 'tx2',
        playerId: 'player2',
        type: 'buy_in',
        amount: 100.00,
        timestamp: new Date(),
        status: 'completed'
      },
      {
        id: 'tx3',
        playerId: 'player3',
        type: 'buy_in',
        amount: 100.00,
        timestamp: new Date(),
        status: 'completed'
      },
      {
        id: 'tx4',
        playerId: 'player4',
        type: 'buy_in',
        amount: 100.00,
        timestamp: new Date(),
        status: 'completed'
      },
      {
        id: 'tx5',
        playerId: 'player4',
        type: 'cash_out',
        amount: 115.00,
        timestamp: new Date(),
        status: 'completed'
      }
    ];

    mockDatabaseService.getPlayers.mockResolvedValue(mockPlayers);
    mockTransactionService.getTransactionHistory.mockResolvedValue(mockTransactions);
    mockTransactionService.getSessionTransactions.mockResolvedValue(mockTransactions);
  }
});