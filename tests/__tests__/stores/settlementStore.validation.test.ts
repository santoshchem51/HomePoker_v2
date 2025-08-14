/**
 * Settlement Store Validation State Management Tests
 * Story 3.3: Settlement Validation and Verification - Task 7
 * 
 * Comprehensive test suite for enhanced settlement store with validation state management
 */

import { useSettlementStore } from '../../../src/stores/settlementStore';
import { SettlementService } from '../../../src/services/settlement/SettlementService';
import { ServiceError } from '../../../src/services/core/ServiceError';
import {
  SettlementStatus,
  OptimizedSettlement,
  SettlementValidation,
  MathematicalProof,
  SettlementComparison,
  SettlementWarningExtended,
  WarningClassification,
  ExportResult,
  ProofIntegrityResult,
} from '../../../src/types/settlement';

// Mock the SettlementService
jest.mock('../../../src/services/settlement/SettlementService');
const MockedSettlementService = SettlementService as jest.MockedClass<typeof SettlementService>;

describe('SettlementStore - Enhanced Validation State Management', () => {
  let store: ReturnType<typeof useSettlementStore>;
  let mockSettlementService: jest.Mocked<SettlementService>;

  beforeEach(() => {
    // Reset store state
    store = useSettlementStore.getState();
    store.clearCurrentResult();
    store.clearValidationResult();
    store.clearProofResult();
    store.clearAlternativeResults();
    store.clearActiveWarnings();
    store.clearAuditTrail();

    // Setup mock service
    mockSettlementService = {
      getInstance: jest.fn(),
      initialize: jest.fn().mockResolvedValue(undefined),
      validateSettlement: jest.fn(),
      generateMathematicalProof: jest.fn(),
      exportMathematicalProof: jest.fn(),
      verifyProofIntegrity: jest.fn(),
      generateAlternativeSettlements: jest.fn(),
      startRealTimeMonitoring: jest.fn(),
      stopRealTimeMonitoring: jest.fn(),
      recordManualAdjustment: jest.fn(),
      resolveWarning: jest.fn(),
      getActiveWarnings: jest.fn(),
    } as any;

    MockedSettlementService.getInstance.mockReturnValue(mockSettlementService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Validation State Management', () => {
    const mockSettlement: OptimizedSettlement = {
      sessionId: 'test-session',
      optimizedPayments: [],
      directPayments: [],
      optimizationMetrics: {
        originalPaymentCount: 10,
        optimizedPaymentCount: 5,
        reductionPercentage: 50,
        totalAmountSettled: 1000,
        processingTime: 100,
      },
      isValid: true,
      validationErrors: [],
      mathematicalProof: {} as MathematicalProof,
    };

    const mockValidation: SettlementValidation = {
      isValid: true,
      errors: [],
      warnings: [],
      auditTrail: [
        {
          step: 1,
          operation: 'balance_validation',
          input: { totalDebits: 1000, totalCredits: 1000 },
          output: { isBalanced: true },
          timestamp: new Date(),
          validationCheck: true,
        },
      ],
    };

    test('should perform settlement validation and update state', async () => {
      // Setup mock
      mockSettlementService.validateSettlement.mockResolvedValue(mockValidation);

      // Initial state check
      expect(store.validationState.isValidating).toBe(false);
      expect(store.validationState.currentValidation).toBeNull();

      // Perform validation
      const result = await store.validateSettlement(mockSettlement);

      // Verify result
      expect(result).toEqual(mockValidation);
      expect(store.validationState.currentValidation).toEqual(mockValidation);
      expect(store.validationState.isValidating).toBe(false);
      expect(store.validationState.validationProgress).toBe(100);
      expect(store.validationState.validationHistory).toHaveLength(1);
      expect(store.validationState.lastValidationTime).toBeGreaterThan(0);
    });

    test('should handle validation errors gracefully', async () => {
      // Setup mock to throw error
      const validationError = new ServiceError('VALIDATION_FAILED', 'Validation failed');
      mockSettlementService.validateSettlement.mockRejectedValue(validationError);

      // Perform validation and expect error
      await expect(store.validateSettlement(mockSettlement)).rejects.toThrow(validationError);

      // Verify error state
      expect(store.validationState.validationError).toEqual(validationError);
      expect(store.validationState.isValidating).toBe(false);
      expect(store.validationState.validationProgress).toBe(0);
    });

    test('should enable and disable real-time validation', () => {
      // Initially disabled
      expect(store.validationState.realTimeValidationEnabled).toBe(false);

      // Enable real-time validation
      store.enableRealTimeValidation('test-session');
      expect(store.validationState.realTimeValidationEnabled).toBe(true);

      // Disable real-time validation
      store.disableRealTimeValidation();
      expect(store.validationState.realTimeValidationEnabled).toBe(false);
    });

    test('should calculate validation metrics correctly', () => {
      // Add some validation history
      const validations = [
        { ...mockValidation, isValid: true },
        { ...mockValidation, isValid: false, errors: [{ code: 'TEST', message: 'Test', severity: 'critical' as const, affectedPlayers: [] }] },
        { ...mockValidation, isValid: true },
      ];

      // Manually set validation history for testing
      useSettlementStore.setState((state) => ({
        validationState: {
          ...state.validationState,
          validationHistory: validations,
          lastValidationTime: 500,
        },
      }));

      const metrics = store.getValidationMetrics();

      expect(metrics.totalValidations).toBe(3);
      expect(metrics.validationSuccessRate).toBe(66.67); // 2/3 * 100
      expect(metrics.averageValidationTime).toBe(500);
      expect(metrics.criticalErrorCount).toBe(1);
    });
  });

  describe('Warning System State Management', () => {
    const mockWarning: SettlementWarningExtended = {
      warningId: 'warning-1',
      code: 'BALANCE_DISCREPANCY',
      message: 'Balance discrepancy detected',
      severity: WarningClassification.MAJOR,
      affectedPlayers: ['player-1'],
      balanceDiscrepancy: 5.50,
      adjustmentType: 'chip_count_adjustment' as any,
      originalValue: 100,
      adjustedValue: 105.50,
      detectedAt: new Date(),
      detectionMethod: 'real_time',
      canProceed: false,
      requiresApproval: true,
      suggestedActions: ['Review chip count'],
      isResolved: false,
    };

    test('should start and stop warning monitoring', async () => {
      // Setup mock
      mockSettlementService.startRealTimeMonitoring.mockResolvedValue();

      // Initially not monitoring
      expect(store.warningState.isMonitoring).toBe(false);

      // Start monitoring
      await store.startWarningMonitoring('test-session');
      expect(store.warningState.isMonitoring).toBe(true);
      expect(store.warningState.lastWarningCheck).toBeGreaterThan(0);

      // Stop monitoring
      store.stopWarningMonitoring();
      expect(store.warningState.isMonitoring).toBe(false);
    });

    test('should record manual adjustments and update warnings', async () => {
      // Setup mock
      mockSettlementService.recordManualAdjustment.mockResolvedValue();
      mockSettlementService.getActiveWarnings.mockResolvedValue([mockWarning]);

      const adjustment = { playerId: 'player-1', field: 'chipCount', newValue: 105.50 };

      // Record adjustment
      await store.recordManualAdjustment('test-session', adjustment);

      // Verify warning state updated
      expect(store.warningState.activeWarnings).toHaveLength(1);
      expect(store.warningState.majorWarningCount).toBe(1);
      expect(store.warningState.criticalWarningCount).toBe(0);
      expect(store.warningState.minorWarningCount).toBe(0);
      expect(store.warningState.lastWarningCheck).toBeGreaterThan(0);
    });

    test('should resolve warnings correctly', async () => {
      // Setup initial warning state
      useSettlementStore.setState((state) => ({
        warningState: {
          ...state.warningState,
          activeWarnings: [mockWarning],
          majorWarningCount: 1,
        },
      }));

      // Setup mock
      mockSettlementService.resolveWarning.mockResolvedValue();

      // Resolve warning
      await store.resolveWarning('warning-1', 'Manual review completed');

      // Verify warning removed
      expect(store.warningState.activeWarnings).toHaveLength(0);
      expect(store.warningState.majorWarningCount).toBe(0);
    });

    test('should calculate warning metrics correctly', () => {
      // Setup warning state
      const warnings = [
        { ...mockWarning, severity: WarningClassification.CRITICAL, isResolved: true },
        { ...mockWarning, severity: WarningClassification.MAJOR, isResolved: false },
        { ...mockWarning, severity: WarningClassification.MINOR, isResolved: true },
      ];

      useSettlementStore.setState((state) => ({
        warningState: {
          ...state.warningState,
          activeWarnings: warnings.slice(1, 2), // One active major warning
          warningHistory: warnings,
          criticalWarningCount: 0,
          majorWarningCount: 1,
          minorWarningCount: 0,
        },
      }));

      const metrics = store.getWarningMetrics();

      expect(metrics.totalWarnings).toBe(4); // 1 active + 3 history
      expect(metrics.criticalWarnings).toBe(0);
      expect(metrics.majorWarnings).toBe(1);
      expect(metrics.minorWarnings).toBe(0);
      expect(metrics.resolutionRate).toBe(50); // 2 resolved out of 4 total
    });
  });

  describe('Mathematical Proof State Management', () => {
    const mockProof: MathematicalProof = {
      settlementId: 'settlement-1',
      proofId: 'proof-1',
      generatedAt: new Date(),
      calculationSteps: [],
      balanceVerification: {
        totalDebits: 1000,
        totalCredits: 1000,
        netBalance: 0,
        isBalanced: true,
        precision: 2,
        validationTimestamp: new Date(),
        auditSteps: [],
      },
      precisionAnalysis: {
        originalPrecision: 2,
        calculatedPrecision: 2,
        roundingOperations: [],
        precisionLoss: 0,
        isWithinTolerance: true,
        fractionalCentIssues: [],
      },
      alternativeAlgorithmResults: [],
      humanReadableSummary: 'Test proof',
      technicalDetails: [],
      exportFormats: {
        json: {} as any,
        text: 'Test proof text',
      },
      checksum: 'test-checksum',
      signature: 'test-signature',
      isValid: true,
    };

    test('should generate mathematical proof and update state', async () => {
      // Setup mock
      mockSettlementService.generateMathematicalProof.mockResolvedValue(mockProof);

      const mockSettlement: OptimizedSettlement = {
        sessionId: 'test-session',
        optimizedPayments: [],
        directPayments: [],
        optimizationMetrics: {
          originalPaymentCount: 10,
          optimizedPaymentCount: 5,
          reductionPercentage: 50,
          totalAmountSettled: 1000,
          processingTime: 100,
        },
        isValid: true,
        validationErrors: [],
        mathematicalProof: mockProof,
      };

      // Generate proof
      const result = await store.generateMathematicalProof(mockSettlement);

      // Verify result and state
      expect(result).toEqual(mockProof);
      expect(store.proofState.currentProof).toEqual(mockProof);
      expect(store.proofState.isGeneratingProof).toBe(false);
      expect(store.proofState.proofProgress).toBe(100);
      expect(store.proofState.proofHistory).toHaveLength(1);
      expect(store.proofState.lastProofGeneration).toBeGreaterThan(0);
    });

    test('should export mathematical proof and track export history', async () => {
      const mockExportResult: ExportResult = {
        success: true,
        filePath: '/test/proof.pdf',
        fileSize: 1024,
        checksum: 'export-checksum',
        metadata: {
          exportId: 'export-1',
          proofId: 'proof-1',
          format: 'pdf',
          exportedAt: new Date(),
          fileSize: 1024,
          checksum: 'export-checksum',
          status: 'completed',
          processingTime: 200,
        },
      };

      // Setup mock
      mockSettlementService.exportMathematicalProof.mockResolvedValue(mockExportResult);

      // Export proof
      const result = await store.exportMathematicalProof('proof-1', 'pdf');

      // Verify result and export history
      expect(result).toEqual(mockExportResult);
      expect(store.proofState.exportHistory).toHaveLength(1);
      expect(store.proofState.exportHistory[0]).toEqual(mockExportResult.metadata);
    });

    test('should verify proof integrity', async () => {
      const mockIntegrityResult: ProofIntegrityResult = {
        isValid: true,
        checksumValid: true,
        signatureValid: true,
        mathematicallySound: true,
        balanceValid: true,
        algorithmConsensus: true,
        timestampValid: true,
        verifiedAt: new Date(),
        verificationTime: 50,
        warnings: [],
        errors: [],
      };

      // Setup mock
      mockSettlementService.verifyProofIntegrity.mockResolvedValue(mockIntegrityResult);

      // Verify proof
      const result = await store.verifyProofIntegrity(mockProof);

      // Verify result
      expect(result).toEqual(mockIntegrityResult);
    });

    test('should calculate proof metrics correctly', () => {
      // Setup proof state
      const proofs = [
        { ...mockProof, isValid: true },
        { ...mockProof, isValid: false },
        { ...mockProof, isValid: true },
      ];

      const exports = [
        { exportId: '1', status: 'completed' as const },
        { exportId: '2', status: 'failed' as const },
        { exportId: '3', status: 'completed' as const },
      ];

      useSettlementStore.setState((state) => ({
        proofState: {
          ...state.proofState,
          proofHistory: proofs,
          exportHistory: exports as any,
          lastProofGeneration: 300,
        },
      }));

      const metrics = store.getProofMetrics();

      expect(metrics.totalProofs).toBe(3);
      expect(metrics.averageProofTime).toBe(300);
      expect(metrics.successfulExports).toBe(2);
      expect(metrics.verificationSuccessRate).toBe(66.67); // 2/3 * 100
    });
  });

  describe('Alternative Settlement State Management', () => {
    const mockComparison: SettlementComparison = {
      comparisonId: 'comparison-1',
      sessionId: 'test-session',
      generatedAt: new Date(),
      alternatives: [
        {
          optionId: 'greedy-1',
          name: 'Greedy Debt Reduction',
          description: 'Optimized transaction reduction',
          algorithmType: 'greedy_debt_reduction' as any,
          paymentPlan: [],
          transactionCount: 5,
          totalAmountSettled: 1000,
          score: 8.5,
          simplicity: 8,
          fairness: 9,
          efficiency: 8,
          userFriendliness: 9,
          calculationTime: 100,
          optimizationPercentage: 50,
          prosAndCons: {
            pros: ['Fewer transactions'],
            cons: ['Complex calculation'],
          },
          isValid: true,
          validationResults: {
            isValid: true,
            errors: [],
            warnings: [],
            auditTrail: [],
          },
        },
      ],
      recommendedOption: {} as any,
      comparisonMatrix: [],
      summary: {
        transactionCountRange: { min: 5, max: 10 },
        optimizationRange: { min: 30, max: 60 },
        averageScore: 8.5,
        totalOptionsGenerated: 6,
      },
    };

    test('should generate alternative settlements and update state', async () => {
      // Setup mock
      mockSettlementService.generateAlternativeSettlements.mockResolvedValue(mockComparison);

      // Generate alternatives
      const result = await store.generateAlternativeSettlements('test-session');

      // Verify result and state
      expect(result).toEqual(mockComparison);
      expect(store.alternativeState.currentComparison).toEqual(mockComparison);
      expect(store.alternativeState.isGeneratingAlternatives).toBe(false);
      expect(store.alternativeState.alternativeProgress).toBe(100);
      expect(store.alternativeState.comparisonHistory).toHaveLength(1);
      expect(store.alternativeState.lastAlternativeGeneration).toBeGreaterThan(0);
    });

    test('should select alternative settlement', () => {
      // Setup state with comparison
      useSettlementStore.setState((state) => ({
        alternativeState: {
          ...state.alternativeState,
          currentComparison: mockComparison,
        },
      }));

      // Select alternative
      store.selectAlternativeSettlement('greedy-1');

      // Verify selection
      expect(store.alternativeState.selectedAlternative?.optionId).toBe('greedy-1');
    });

    test('should compare specific alternatives', () => {
      // Setup state
      useSettlementStore.setState((state) => ({
        alternativeState: {
          ...state.alternativeState,
          currentComparison: mockComparison,
        },
      }));

      // Compare alternatives
      const comparison = store.compareAlternativeSettlements(['greedy-1']);

      // Verify comparison
      expect(comparison).toBeTruthy();
      expect(comparison?.alternatives).toHaveLength(1);
      expect(comparison?.alternatives[0].optionId).toBe('greedy-1');
    });

    test('should calculate alternative metrics correctly', () => {
      // Setup alternative state
      const comparisons = [mockComparison, mockComparison];

      useSettlementStore.setState((state) => ({
        alternativeState: {
          ...state.alternativeState,
          comparisonHistory: comparisons,
          lastAlternativeGeneration: 250,
        },
      }));

      const metrics = store.getAlternativeMetrics();

      expect(metrics.totalComparisons).toBe(2);
      expect(metrics.averageGenerationTime).toBe(250);
      expect(metrics.mostSelectedAlgorithm).toBe('greedy_debt_reduction');
      expect(metrics.averageAlternativeCount).toBe(1); // 2 alternatives total / 2 comparisons
    });
  });

  describe('Audit Trail State Management', () => {
    const mockAuditStep = {
      step: 1,
      operation: 'validation_start',
      input: { sessionId: 'test-session' },
      output: { status: 'initiated' },
      timestamp: new Date(),
      validationCheck: true,
    };

    test('should manage audit trail lifecycle', () => {
      // Start audit trail
      store.startAuditTrail();
      expect(store.auditState.isTrackingAudit).toBe(true);
      expect(store.auditState.currentAuditTrail).toHaveLength(0);
      expect(store.auditState.auditStepCount).toBe(0);

      // Add audit step
      store.addAuditStep(mockAuditStep);
      expect(store.auditState.currentAuditTrail).toHaveLength(1);
      expect(store.auditState.auditStepCount).toBe(1);
      expect(store.auditState.lastAuditUpdate).toBeGreaterThan(0);

      // Complete audit trail
      store.completeAuditTrail();
      expect(store.auditState.isTrackingAudit).toBe(false);
      expect(store.auditState.auditHistory).toHaveLength(1);

      // Clear audit trail
      store.clearAuditTrail();
      expect(store.auditState.currentAuditTrail).toHaveLength(0);
      expect(store.auditState.auditStepCount).toBe(0);
    });

    test('should calculate audit metrics correctly', () => {
      // Setup audit history
      const auditTrails = [
        [mockAuditStep, mockAuditStep], // 2 steps
        [mockAuditStep], // 1 step
        [mockAuditStep, mockAuditStep, mockAuditStep], // 3 steps
      ];

      useSettlementStore.setState((state) => ({
        auditState: {
          ...state.auditState,
          auditHistory: auditTrails,
        },
      }));

      const metrics = store.getAuditMetrics();

      expect(metrics.totalAuditTrails).toBe(3);
      expect(metrics.averageStepCount).toBe(2); // (2+1+3)/3 = 2
      expect(metrics.auditCompletionRate).toBe(100); // All trails have steps
    });
  });

  describe('State Persistence', () => {
    test('should persist essential validation data', () => {
      // Setup store with validation data
      const mockValidation: SettlementValidation = {
        isValid: true,
        errors: [],
        warnings: [],
        auditTrail: [],
      };

      useSettlementStore.setState((state) => ({
        validationState: {
          ...state.validationState,
          validationHistory: [mockValidation],
          realTimeValidationEnabled: true,
        },
        proofState: {
          ...state.proofState,
          proofHistory: [mockProof],
        },
      }));

      // Get persisted state
      const persistedState = useSettlementStore.persist.getOptions().partialize?.(store);

      // Verify essential data is persisted
      expect(persistedState?.validationState?.validationHistory).toHaveLength(1);
      expect(persistedState?.validationState?.realTimeValidationEnabled).toBe(true);
      expect(persistedState?.proofState?.proofHistory).toHaveLength(1);
      
      // Verify transient data is not persisted
      expect(persistedState?.validationState?.isValidating).toBeUndefined();
      expect(persistedState?.proofState?.isGeneratingProof).toBeUndefined();
    });
  });

  describe('Integration with Existing Store', () => {
    test('should maintain compatibility with existing optimization workflow', async () => {
      // Setup mock
      const mockOptimizedSettlement: OptimizedSettlement = {
        sessionId: 'test-session',
        optimizedPayments: [],
        directPayments: [],
        optimizationMetrics: {
          originalPaymentCount: 10,
          optimizedPaymentCount: 5,
          reductionPercentage: 50,
          totalAmountSettled: 1000,
          processingTime: 100,
        },
        isValid: true,
        validationErrors: [],
        mathematicalProof: mockProof,
      };

      const settlementService = SettlementService.getInstance();
      (settlementService.optimizeSettlement as jest.Mock).mockResolvedValue(mockOptimizedSettlement);
      (settlementService.validateSettlement as jest.Mock).mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
        auditTrail: [],
      });

      // Perform optimization
      const optimizationResult = await store.optimizeSettlement('test-session');

      // Verify optimization completed
      expect(optimizationResult).toEqual(mockOptimizedSettlement);
      expect(store.currentOptimizedSettlement).toEqual(mockOptimizedSettlement);

      // Perform validation on optimized settlement
      const validationResult = await store.validateSettlement(optimizationResult);

      // Verify validation completed
      expect(validationResult.isValid).toBe(true);
      expect(store.validationState.currentValidation).toBeTruthy();
    });
  });
});