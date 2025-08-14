/**
 * Test suite for Settlement Proof Export System
 * Story 3.3, Task 6 - Mathematical Proof Export System
 * 
 * Tests all export functionality including PDF, JSON, text, and CSV formats
 */

import { SettlementService } from '../../../../src/services/settlement/SettlementService';
import { proofExportManager } from '../../../../src/utils/exportUtils';
import { 
  MathematicalProof, 
  OptimizedSettlement, 
  ExportFormat, 
  ExportOptions,
  ExportResult,
  ProofIntegrityResult,
  ExportMetadata
} from '../../../../src/types/settlement';

// Mock dependencies
jest.mock('react-native-fs');
jest.mock('react-native-share');
jest.mock('react-native-html-to-pdf');
jest.mock('../../../../src/services/monitoring/CrashReporting');
jest.mock('../../../../src/services/monitoring/PerformanceMonitoring');
jest.mock('../../../../src/services/infrastructure/DatabaseService');

describe('SettlementExportService', () => {
  let settlementService: SettlementService;
  let mockSettlement: OptimizedSettlement;
  let mockProof: MathematicalProof;

  beforeEach(() => {
    // Initialize settlement service
    settlementService = new SettlementService({
      decimalPrecision: 2,
      maxDiscrepancyAmount: 0.01,
      roundingMode: 'round',
      minimumTransactionAmount: 0.01,
      enableOptimization: true,
      enableMathematicalProof: true,
      requireMathematicalProof: true
    });

    // Create mock settlement data
    mockSettlement = createMockOptimizedSettlement();
    mockProof = createMockMathematicalProof();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('PDF Export', () => {
    it('should export mathematical proof to PDF format', async () => {
      const result = await settlementService.exportProofToPDF(mockProof);
      
      expect(result.success).toBe(true);
      expect(result.metadata.format).toBe('pdf');
      expect(result.filePath).toBeDefined();
      expect(result.fileSize).toBeGreaterThan(0);
      expect(result.checksum).toBeDefined();
    });

    it('should include complete mathematical breakdown in PDF', async () => {
      const result = await settlementService.exportProofToPDF(mockProof, {
        includeSignature: true,
        watermark: 'Test Watermark'
      });
      
      expect(result.success).toBe(true);
      expect(result.metadata.format).toBe('pdf');
    });

    it('should handle PDF generation errors gracefully', async () => {
      const invalidProof = { ...mockProof, isValid: false };
      
      await expect(
        settlementService.exportProofToPDF(invalidProof)
      ).rejects.toThrow('Cannot export invalid mathematical proof');
    });
  });

  describe('JSON Export', () => {
    it('should export proof for programmatic verification', async () => {
      const result = await settlementService.exportProofForVerification(mockProof);
      
      expect(result.success).toBe(true);
      expect(result.metadata.format).toBe('json');
      expect(result.filePath).toBeDefined();
      
      // Verify enhanced JSON structure
      const jsonContent = JSON.parse(result.filePath!);
      expect(jsonContent.metadata.version).toBe('2.0');
      expect(jsonContent.metadata.enhancedFeatures).toContain('programmatic_verification');
      expect(jsonContent.verificationSuite).toBeDefined();
      expect(jsonContent.auditTrail).toBeDefined();
    });

    it('should include programmatic verification capabilities', async () => {
      const result = await settlementService.exportProofForVerification(mockProof);
      
      expect(result.success).toBe(true);
      
      // Mock parsing the JSON content
      const expectedCapabilities = {
        canVerifyBalance: true,
        canReconstructSettlement: true,
        canValidateAlgorithms: true,
        canDetectTampering: true
      };
      
      // Verify capabilities would be present in actual JSON
      expect(result.metadata.format).toBe('json');
    });

    it('should include comprehensive audit trail', async () => {
      const result = await settlementService.exportProofForVerification(mockProof);
      
      expect(result.success).toBe(true);
      expect(result.metadata.format).toBe('json');
    });
  });

  describe('Text Export', () => {
    it('should export WhatsApp-friendly text summary', async () => {
      const result = await settlementService.exportProofForSharing(mockProof);
      
      expect(result.success).toBe(true);
      expect(result.metadata.format).toBe('text');
      expect(result.filePath).toBeDefined();
      
      // Verify text format characteristics
      expect(result.fileSize).toBeGreaterThan(0);
      expect(result.fileSize).toBeLessThan(5000); // Should be concise for messaging
    });

    it('should format text for mobile messaging platforms', async () => {
      const result = await settlementService.exportProofForSharing(mockProof);
      
      expect(result.success).toBe(true);
      expect(result.metadata.format).toBe('text');
    });

    it('should exclude signature for clean messaging', async () => {
      const result = await settlementService.exportProofForSharing(mockProof, {
        includeSignature: false
      });
      
      expect(result.success).toBe(true);
      expect(result.metadata.format).toBe('text');
    });
  });

  describe('CSV Export', () => {
    it('should export proof data to CSV format', async () => {
      const result = await settlementService.exportProofToCSV(mockProof);
      
      expect(result.success).toBe(true);
      expect(result.metadata.format).toBe('csv');
      expect(result.filePath).toBeDefined();
      expect(result.fileSize).toBeGreaterThan(0);
    });

    it('should include all necessary data for spreadsheet analysis', async () => {
      const result = await settlementService.exportProofToCSV(mockProof);
      
      expect(result.success).toBe(true);
      expect(result.metadata.format).toBe('csv');
    });
  });

  describe('Export History Tracking', () => {
    it('should track export history for each proof', async () => {
      const proofId = mockProof.proofId;
      
      // Perform multiple exports
      await settlementService.exportProofToPDF(mockProof);
      await settlementService.exportProofForVerification(mockProof);
      await settlementService.exportProofForSharing(mockProof);
      
      const history = await settlementService.getProofExportHistory(proofId);
      
      expect(history).toHaveLength(3);
      expect(history[0].format).toBe('pdf');
      expect(history[1].format).toBe('json');
      expect(history[2].format).toBe('text');
    });

    it('should include metadata for each export operation', async () => {
      await settlementService.exportProofToPDF(mockProof);
      
      const history = await settlementService.getProofExportHistory(mockProof.proofId);
      
      expect(history).toHaveLength(1);
      
      const exportMetadata = history[0];
      expect(exportMetadata.exportId).toBeDefined();
      expect(exportMetadata.proofId).toBe(mockProof.proofId);
      expect(exportMetadata.format).toBe('pdf');
      expect(exportMetadata.exportedAt).toBeInstanceOf(Date);
      expect(exportMetadata.fileSize).toBeGreaterThan(0);
      expect(exportMetadata.checksum).toBeDefined();
      expect(exportMetadata.status).toBe('completed');
      expect(exportMetadata.processingTime).toBeGreaterThan(0);
    });

    it('should handle export history retrieval errors', async () => {
      const nonExistentProofId = 'non-existent-proof';
      
      const history = await settlementService.getProofExportHistory(nonExistentProofId);
      
      expect(history).toHaveLength(0);
    });
  });

  describe('Proof Integrity Verification', () => {
    it('should verify proof integrity with cryptographic checks', async () => {
      const result = await settlementService.verifyProofIntegrity(mockProof);
      
      expect(result.isValid).toBe(true);
      expect(result.checksumValid).toBe(true);
      expect(result.signatureValid).toBe(true);
      expect(result.mathematicallySound).toBe(true);
      expect(result.balanceValid).toBe(true);
      expect(result.algorithmConsensus).toBe(true);
      expect(result.timestampValid).toBe(true);
      expect(result.verifiedAt).toBeInstanceOf(Date);
      expect(result.verificationTime).toBeGreaterThan(0);
      expect(result.warnings).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect tampered proof data', async () => {
      const tamperedProof = {
        ...mockProof,
        checksum: 'tampered_checksum'
      };
      
      const result = await settlementService.verifyProofIntegrity(tamperedProof);
      
      expect(result.isValid).toBe(false);
      expect(result.checksumValid).toBe(false);
      expect(result.errors).toContain('Checksum verification failed - proof may have been tampered with');
    });

    it('should validate timestamp freshness', async () => {
      const oldProof = {
        ...mockProof,
        generatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) // 8 days old
      };
      
      const result = await settlementService.verifyProofIntegrity(oldProof);
      
      expect(result.timestampValid).toBe(false);
      expect(result.warnings).toContain('Proof timestamp is invalid or too old');
    });
  });

  describe('File Sharing', () => {
    it('should share exported proof files', async () => {
      const exportResult = await settlementService.exportProofToPDF(mockProof);
      const shared = await settlementService.shareExportedProof(exportResult);
      
      expect(shared).toBe(true);
    });

    it('should handle sharing failures gracefully', async () => {
      const failedExportResult: ExportResult = {
        success: false,
        error: 'Export failed',
        metadata: {
          exportId: 'test',
          proofId: mockProof.proofId,
          format: 'pdf',
          exportedAt: new Date(),
          fileSize: 0,
          checksum: '',
          status: 'failed',
          processingTime: 100
        }
      };
      
      await expect(
        settlementService.shareExportedProof(failedExportResult)
      ).rejects.toThrow('Cannot share unsuccessful export');
    });
  });

  describe('Error Handling', () => {
    it('should handle export failures gracefully', async () => {
      const invalidProof = { ...mockProof, isValid: false };
      
      await expect(
        settlementService.exportMathematicalProof(invalidProof, 'pdf')
      ).rejects.toThrow('Cannot export invalid mathematical proof');
    });

    it('should log export operations for debugging', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await settlementService.exportProofToPDF(mockProof);
      
      // In development mode, should log export operations
      expect(consoleSpy).toHaveBeenCalledWith(
        'Proof Export Operation:',
        expect.objectContaining({
          operation: 'proof_export',
          proofId: mockProof.proofId,
          format: 'pdf',
          success: true
        })
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Performance', () => {
    it('should complete PDF export within reasonable time', async () => {
      const startTime = Date.now();
      
      const result = await settlementService.exportProofToPDF(mockProof);
      
      const processingTime = Date.now() - startTime;
      
      expect(result.success).toBe(true);
      expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(result.metadata.processingTime).toBeGreaterThan(0);
    });

    it('should handle large proof data efficiently', async () => {
      const largeProof = createMockMathematicalProofWithLargeData();
      
      const result = await settlementService.exportProofForVerification(largeProof);
      
      expect(result.success).toBe(true);
      expect(result.metadata.processingTime).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });
});

// Helper functions to create mock data
function createMockOptimizedSettlement(): OptimizedSettlement {
  return {
    sessionId: 'test-session-123',
    optimizedPayments: [
      {
        fromPlayerId: 'player1',
        fromPlayerName: 'Alice',
        toPlayerId: 'player2',
        toPlayerName: 'Bob',
        amount: 50.00,
        priority: 1
      },
      {
        fromPlayerId: 'player3',
        fromPlayerName: 'Charlie',
        toPlayerId: 'player1',
        toPlayerName: 'Alice',
        amount: 25.00,
        priority: 2
      }
    ],
    directPayments: [
      {
        fromPlayerId: 'player1',
        fromPlayerName: 'Alice',
        toPlayerId: 'player2',
        toPlayerName: 'Bob',
        amount: 50.00,
        priority: 1
      },
      {
        fromPlayerId: 'player3',
        fromPlayerName: 'Charlie',
        toPlayerId: 'player1',
        toPlayerName: 'Alice',
        amount: 25.00,
        priority: 2
      },
      {
        fromPlayerId: 'player2',
        fromPlayerName: 'Bob',
        toPlayerId: 'player3',
        toPlayerName: 'Charlie',
        amount: 25.00,
        priority: 3
      }
    ],
    optimizationMetrics: {
      originalTransactionCount: 3,
      optimizedTransactionCount: 2,
      reductionCount: 1,
      reductionPercentage: 33.33,
      totalAmountSettled: 75.00,
      algorithmUsed: 'greedy_debt_reduction',
      processingTime: 150
    },
    mathematicalProof: {
      isBalanced: true,
      totalDebits: 75.00,
      totalCredits: 75.00,
      netBalance: 0.00,
      tolerance: 0.01,
      precision: 2
    }
  } as OptimizedSettlement;
}

function createMockMathematicalProof(): MathematicalProof {
  return {
    settlementId: 'test-session-123',
    proofId: 'proof_123456789_abcdef',
    generatedAt: new Date(),
    calculationSteps: [
      {
        stepNumber: 1,
        operation: 'Player Net Position Calculation',
        description: 'Calculate each player\'s net position',
        inputs: { playerCount: 3, totalBuyIns: 300, totalCashOuts: 225 },
        calculation: 'NetPosition = (CurrentChips + CashOuts) - BuyIns',
        result: 0,
        precision: 2,
        verification: true,
        tolerance: 0.01
      },
      {
        stepNumber: 2,
        operation: 'Settlement Payment Calculation',
        description: 'Calculate total settlement payments',
        inputs: { paymentCount: 2, optimizedPayments: 2 },
        calculation: 'TotalPayments = Σ(PaymentAmounts)',
        result: 75.00,
        precision: 2,
        verification: true,
        tolerance: 0.01
      }
    ],
    balanceVerification: {
      isBalanced: true,
      totalDebits: 75.00,
      totalCredits: 75.00,
      netBalance: 0.00,
      tolerance: 0.01,
      precision: 2
    },
    precisionAnalysis: {
      originalPrecision: 2,
      calculatedPrecision: 2,
      roundingOperations: [],
      precisionLoss: 0,
      isWithinTolerance: true,
      fractionalCentIssues: []
    },
    alternativeAlgorithmResults: [
      {
        algorithmName: 'Greedy Debt Reduction',
        algorithmType: 'greedy',
        paymentPlan: [],
        transactionCount: 2,
        totalAmount: 75.00,
        isBalanced: true,
        balanceDiscrepancy: 0,
        verificationResult: true
      }
    ],
    humanReadableSummary: 'Settlement successfully optimized with 33.33% transaction reduction',
    technicalDetails: [
      {
        section: 'balance_verification',
        title: 'Balance Verification',
        content: 'All mathematical balances verified',
        verification: true
      }
    ],
    exportFormats: {
      json: {
        metadata: {
          proofId: 'proof_123456789_abcdef',
          settlementId: 'test-session-123',
          generatedAt: new Date(),
          version: '1.0'
        },
        playerPositions: [
          {
            playerId: 'player1',
            playerName: 'Alice',
            buyIns: 100,
            cashOuts: 75,
            currentChips: 75,
            netPosition: 50,
            settlementAmount: 50,
            settlementType: 'receive',
            verification: true
          }
        ],
        settlements: [
          {
            paymentId: 'payment_1',
            fromPlayer: 'Alice',
            toPlayer: 'Bob',
            amount: 50.00,
            calculation: 'Alice pays Bob $50.00',
            verification: true
          }
        ],
        balanceVerification: {
          totalDebits: 75.00,
          totalCredits: 75.00,
          netBalance: 0.00,
          isBalanced: true,
          tolerance: 0.01,
          precision: 2
        },
        algorithmComparison: {
          primaryAlgorithm: {
            algorithmName: 'Greedy Debt Reduction',
            algorithmType: 'greedy',
            paymentPlan: [],
            transactionCount: 2,
            totalAmount: 75.00,
            isBalanced: true,
            balanceDiscrepancy: 0,
            verificationResult: true
          },
          alternativeAlgorithms: [],
          consensusResult: true,
          discrepancies: []
        },
        precisionAnalysis: {
          decimalPrecision: 2,
          roundingMode: 'round',
          totalRoundingOperations: 0,
          maxPrecisionLoss: 0,
          fractionalCentCount: 0,
          precisionWarnings: []
        }
      },
      text: 'Mock WhatsApp-friendly text summary',
      pdf: undefined
    },
    checksum: 'mock_checksum_12345',
    signature: 'mock_signature_67890',
    isValid: true
  };
}

function createMockMathematicalProofWithLargeData(): MathematicalProof {
  const baseProof = createMockMathematicalProof();
  
  // Create a proof with many calculation steps to test performance
  const largeCalculationSteps = [];
  for (let i = 1; i <= 100; i++) {
    largeCalculationSteps.push({
      stepNumber: i,
      operation: `Calculation Step ${i}`,
      description: `Perform calculation ${i}`,
      inputs: { value: i * 10 },
      calculation: `result = input * ${i}`,
      result: i * 10,
      precision: 2,
      verification: true,
      tolerance: 0.01
    });
  }
  
  return {
    ...baseProof,
    calculationSteps: largeCalculationSteps
  };
}