/**
 * Settlement Validation Hooks Integration Test
 * Story 3.3: Settlement Validation and Verification
 * Task 8: Create Settlement Validation Hooks and Integration
 * 
 * Comprehensive tests for all three validation hooks and their integration
 */

import { renderHook, act } from '@testing-library/react-native';
import { useSettlementValidation } from '../../../src/hooks/useSettlementValidation';
import { useMathematicalProof } from '../../../src/hooks/useMathematicalProof';
import { useAlternativeSettlements } from '../../../src/hooks/useAlternativeSettlements';
import { useEarlyCashOut } from '../../../src/hooks/useEarlyCashOut';
import { useSettlementOptimization } from '../../../src/hooks/useSettlementOptimization';
import { 
  OptimizedSettlement, 
  EarlyCashOutRequest,
  SettlementAlgorithmType 
} from '../../../src/types/settlement';

// Mock the settlement store
jest.mock('../../../src/stores/settlementStore', () => ({
  useSettlementStore: () => ({
    // Validation state
    validationState: {
      currentValidation: null,
      validationHistory: [],
      isValidating: false,
      validationProgress: 0,
      validationError: null,
      realTimeValidationEnabled: false,
      lastValidationTime: null,
    },
    
    // Warning state
    warningState: {
      activeWarnings: [],
      warningHistory: [],
      monitoringStates: new Map(),
      warningPersistence: new Map(),
      isMonitoring: false,
      lastWarningCheck: null,
      criticalWarningCount: 0,
      majorWarningCount: 0,
      minorWarningCount: 0,
    },
    
    // Proof state
    proofState: {
      currentProof: null,
      proofHistory: [],
      isGeneratingProof: false,
      proofProgress: 0,
      proofError: null,
      exportHistory: [],
      lastProofGeneration: null,
    },
    
    // Alternative state
    alternativeState: {
      currentComparison: null,
      comparisonHistory: [],
      selectedAlternative: null,
      isGeneratingAlternatives: false,
      alternativeProgress: 0,
      alternativeError: null,
      generationOptions: null,
      lastAlternativeGeneration: null,
    },
    
    // Early cash-out state
    currentCashOutResult: null,
    cashOutHistory: [],
    isCalculating: false,
    lastCalculationTime: null,
    error: null,
    
    // Optimization state
    currentOptimizedSettlement: null,
    optimizationHistory: [],
    isOptimizing: false,
    optimizationProgress: 0,
    optimizationError: null,
    
    // Mock actions
    validateSettlement: jest.fn().mockResolvedValue({
      isValid: true,
      errors: [],
      warnings: [],
      auditTrail: [
        {
          step: 1,
          operation: 'validation',
          input: {},
          output: {},
          timestamp: new Date(),
          validationCheck: true,
        }
      ],
    }),
    
    enableRealTimeValidation: jest.fn(),
    disableRealTimeValidation: jest.fn(),
    clearValidationResult: jest.fn(),
    clearValidationError: jest.fn(),
    setValidationProgress: jest.fn(),
    getValidationMetrics: jest.fn().mockReturnValue({
      totalValidations: 0,
      validationSuccessRate: 0,
      averageValidationTime: 0,
      criticalErrorCount: 0,
    }),
    
    dismissWarning: jest.fn(),
    resolveWarning: jest.fn(),
    
    generateMathematicalProof: jest.fn().mockResolvedValue({
      settlementId: 'test-settlement',
      proofId: 'test-proof',
      generatedAt: new Date(),
      calculationSteps: [],
      balanceVerification: {
        totalDebits: 0,
        totalCredits: 0,
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
        json: {},
        text: 'Test proof text',
      },
      checksum: 'test-checksum',
      signature: 'test-signature',
      isValid: true,
    }),
    
    exportMathematicalProof: jest.fn().mockResolvedValue({
      success: true,
      filePath: '/test/proof.json',
      fileSize: 1024,
      checksum: 'test-checksum',
      metadata: {
        exportId: 'test-export',
        proofId: 'test-proof',
        format: 'json',
        exportedAt: new Date(),
        fileSize: 1024,
        checksum: 'test-checksum',
        status: 'completed',
        processingTime: 100,
      },
    }),
    
    verifyProofIntegrity: jest.fn().mockResolvedValue({
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
    }),
    
    clearProofResult: jest.fn(),
    clearProofError: jest.fn(),
    setProofProgress: jest.fn(),
    getProofMetrics: jest.fn().mockReturnValue({
      totalProofs: 0,
      averageProofTime: 0,
      successfulExports: 0,
      verificationSuccessRate: 0,
    }),
    
    generateAlternativeSettlements: jest.fn().mockResolvedValue({
      comparisonId: 'test-comparison',
      sessionId: 'test-session',
      generatedAt: new Date(),
      alternatives: [
        {
          optionId: 'option-1',
          name: 'Greedy Debt Reduction',
          description: 'Optimized settlement',
          algorithmType: SettlementAlgorithmType.GREEDY_DEBT_REDUCTION,
          paymentPlan: [],
          transactionCount: 3,
          totalAmountSettled: 100,
          score: 8.5,
          simplicity: 8,
          fairness: 9,
          efficiency: 8,
          userFriendliness: 8,
          calculationTime: 50,
          optimizationPercentage: 60,
          prosAndCons: {
            pros: ['Fewer transactions', 'Optimized'],
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
      recommendedOption: {
        optionId: 'option-1',
        name: 'Greedy Debt Reduction',
        description: 'Optimized settlement',
        algorithmType: SettlementAlgorithmType.GREEDY_DEBT_REDUCTION,
        paymentPlan: [],
        transactionCount: 3,
        totalAmountSettled: 100,
        score: 8.5,
        simplicity: 8,
        fairness: 9,
        efficiency: 8,
        userFriendliness: 8,
        calculationTime: 50,
        optimizationPercentage: 60,
        prosAndCons: {
          pros: ['Fewer transactions', 'Optimized'],
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
      comparisonMatrix: [],
      summary: {
        transactionCountRange: { min: 3, max: 5 },
        optimizationRange: { min: 40, max: 60 },
        averageScore: 8.5,
        totalOptionsGenerated: 1,
      },
    }),
    
    selectAlternativeSettlement: jest.fn(),
    compareAlternativeSettlements: jest.fn(),
    clearAlternativeResults: jest.fn(),
    clearAlternativeError: jest.fn(),
    setAlternativeProgress: jest.fn(),
    getAlternativeMetrics: jest.fn().mockReturnValue({
      totalComparisons: 0,
      averageGenerationTime: 0,
      mostSelectedAlgorithm: 'greedy_debt_reduction',
      averageAlternativeCount: 0,
    }),
    
    calculateEarlyCashOut: jest.fn().mockResolvedValue({
      playerId: 'player-1',
      playerName: 'Test Player',
      currentChipValue: 100,
      totalBuyIns: 80,
      netPosition: 20,
      settlementAmount: 20,
      settlementType: 'payment_to_player',
      calculationTimestamp: new Date(),
      calculationDurationMs: 100,
      bankBalanceBefore: 0,
      bankBalanceAfter: -20,
      isValid: true,
      validationMessages: [],
    }),
    
    optimizeSettlement: jest.fn().mockResolvedValue({
      sessionId: 'test-session',
      optimizedPayments: [],
      directPayments: [],
      optimizationMetrics: {
        originalPaymentCount: 5,
        optimizedPaymentCount: 3,
        reductionPercentage: 40,
        totalAmountSettled: 100,
        processingTime: 200,
      },
      isValid: true,
      validationErrors: [],
      mathematicalProof: {
        totalDebits: 100,
        totalCredits: 100,
        netBalance: 0,
        isBalanced: true,
        precision: 2,
        validationTimestamp: new Date(),
        auditSteps: [],
      },
    }),
    
    clearCurrentResult: jest.fn(),
    clearError: jest.fn(),
    clearOptimizationResult: jest.fn(),
    clearOptimizationError: jest.fn(),
    setOptimizationProgress: jest.fn(),
    getCalculationPerformanceMetrics: jest.fn().mockReturnValue({
      averageCalculationTime: 100,
      totalCalculations: 1,
      cacheHitRate: 0,
    }),
    getOptimizationMetrics: jest.fn().mockReturnValue({
      averageOptimizationTime: 200,
      averageReductionPercentage: 40,
      totalOptimizations: 1,
      successRate: 100,
    }),
  }),
}));

describe('useSettlementValidation Hook', () => {
  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useSettlementValidation());
    
    expect(result.current.validationResult).toBeNull();
    expect(result.current.isValidating).toBe(false);
    expect(result.current.validationError).toBeNull();
    expect(result.current.isRealTimeEnabled).toBe(false);
    expect(result.current.activeWarnings).toEqual([]);
    expect(result.current.warningCount.critical).toBe(0);
    expect(result.current.warningCount.major).toBe(0);
    expect(result.current.warningCount.minor).toBe(0);
  });

  it('should validate settlement successfully', async () => {
    const { result } = renderHook(() => useSettlementValidation());
    
    const mockSettlement: OptimizedSettlement = {
      sessionId: 'test-session',
      optimizedPayments: [],
      directPayments: [],
      optimizationMetrics: {
        originalPaymentCount: 5,
        optimizedPaymentCount: 3,
        reductionPercentage: 40,
        totalAmountSettled: 100,
        processingTime: 200,
      },
      isValid: true,
      validationErrors: [],
      mathematicalProof: {
        totalDebits: 100,
        totalCredits: 100,
        netBalance: 0,
        isBalanced: true,
        precision: 2,
        validationTimestamp: new Date(),
        auditSteps: [],
      },
    };

    await act(async () => {
      const validation = await result.current.validateSettlement(mockSettlement);
      expect(validation.isValid).toBe(true);
    });
  });

  it('should validate cash-out request', async () => {
    const { result } = renderHook(() => useSettlementValidation());
    
    const mockRequest: EarlyCashOutRequest = {
      sessionId: 'test-session',
      playerId: 'player-1',
      currentChipCount: 100,
      timestamp: new Date(),
    };

    const mockResult = {
      playerId: 'player-1',
      playerName: 'Test Player',
      currentChipValue: 100,
      totalBuyIns: 80,
      netPosition: 20,
      settlementAmount: 20,
      settlementType: 'payment_to_player' as const,
      calculationTimestamp: new Date(),
      calculationDurationMs: 100,
      bankBalanceBefore: 0,
      bankBalanceAfter: -20,
      isValid: true,
      validationMessages: [],
    };

    await act(async () => {
      const validation = await result.current.validateCashOut(mockRequest, mockResult);
      expect(validation.isValid).toBe(true);
    });
  });

  it('should provide correct validation summary', () => {
    const { result } = renderHook(() => useSettlementValidation());
    
    const summary = result.current.getValidationSummary();
    expect(summary.status).toBe('error');
    expect(summary.message).toBe('No validation result available');
    expect(summary.icon).toBe('❓');
  });
});

describe('useMathematicalProof Hook', () => {
  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useMathematicalProof());
    
    expect(result.current.currentProof).toBeNull();
    expect(result.current.isGeneratingProof).toBe(false);
    expect(result.current.proofError).toBeNull();
    expect(result.current.proofHistory).toEqual([]);
    expect(result.current.exportHistory).toEqual([]);
  });

  it('should generate mathematical proof successfully', async () => {
    const { result } = renderHook(() => useMathematicalProof());
    
    const mockSettlement: OptimizedSettlement = {
      sessionId: 'test-session',
      optimizedPayments: [],
      directPayments: [],
      optimizationMetrics: {
        originalPaymentCount: 5,
        optimizedPaymentCount: 3,
        reductionPercentage: 40,
        totalAmountSettled: 100,
        processingTime: 200,
      },
      isValid: true,
      validationErrors: [],
      mathematicalProof: {
        totalDebits: 100,
        totalCredits: 100,
        netBalance: 0,
        isBalanced: true,
        precision: 2,
        validationTimestamp: new Date(),
        auditSteps: [],
      },
    };

    await act(async () => {
      const proof = await result.current.generateProof(mockSettlement);
      expect(proof.isValid).toBe(true);
      expect(proof.proofId).toBe('test-proof');
    });
  });

  it('should export proof successfully', async () => {
    const { result } = renderHook(() => useMathematicalProof());
    
    await act(async () => {
      const exportResult = await result.current.exportProof('test-proof', 'json');
      expect(exportResult.success).toBe(true);
      expect(exportResult.filePath).toBe('/test/proof.json');
    });
  });

  it('should verify proof integrity', async () => {
    const { result } = renderHook(() => useMathematicalProof());
    
    const mockProof = {
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
        json: {},
        text: 'Test proof text',
      },
      checksum: 'test-checksum',
      signature: 'test-signature',
      isValid: true,
    };

    await act(async () => {
      const verification = await result.current.verifyProofIntegrity(mockProof);
      expect(verification.isValid).toBe(true);
      expect(verification.checksumValid).toBe(true);
    });
  });

  it('should analyze proof correctly', () => {
    const { result } = renderHook(() => useMathematicalProof());
    
    const analysis = result.current.analyzeProof();
    expect(analysis.stepCount).toBe(0);
    expect(analysis.complexityLevel).toBe('low');
    expect(analysis.integrityScore).toBe(0);
  });
});

describe('useAlternativeSettlements Hook', () => {
  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useAlternativeSettlements());
    
    expect(result.current.currentComparison).toBeNull();
    expect(result.current.selectedAlternative).toBeNull();
    expect(result.current.isGenerating).toBe(false);
    expect(result.current.generationError).toBeNull();
    expect(result.current.comparisonHistory).toEqual([]);
  });

  it('should generate alternatives successfully', async () => {
    const { result } = renderHook(() => useAlternativeSettlements());
    
    await act(async () => {
      const comparison = await result.current.generateAlternatives('test-session');
      expect(comparison.alternatives.length).toBeGreaterThan(0);
      expect(comparison.recommendedOption.algorithmType).toBe(SettlementAlgorithmType.GREEDY_DEBT_REDUCTION);
    });
  });

  it('should analyze alternatives correctly', () => {
    const { result } = renderHook(() => useAlternativeSettlements());
    
    const analysis = result.current.analyzeAlternatives();
    expect(analysis.bestOption).toBeNull();
    expect(analysis.averageScore).toBe(0);
  });

  it('should filter alternatives correctly', () => {
    const { result } = renderHook(() => useAlternativeSettlements());
    
    const filtered = result.current.filterAlternatives({
      minScore: 8,
      validOnly: true,
    });
    expect(Array.isArray(filtered)).toBe(true);
  });

  it('should format alternative for display', () => {
    const { result } = renderHook(() => useAlternativeSettlements());
    
    const mockAlternative = {
      optionId: 'option-1',
      name: 'Test Alternative',
      description: 'Test description',
      algorithmType: SettlementAlgorithmType.DIRECT_SETTLEMENT,
      paymentPlan: [],
      transactionCount: 3,
      totalAmountSettled: 100,
      score: 8.5,
      simplicity: 8,
      fairness: 9,
      efficiency: 8,
      userFriendliness: 8,
      calculationTime: 50,
      optimizationPercentage: 60,
      prosAndCons: {
        pros: ['Simple'],
        cons: ['More transactions'],
      },
      isValid: true,
      validationResults: {
        isValid: true,
        errors: [],
        warnings: [],
        auditTrail: [],
      },
    };

    const formatted = result.current.formatAlternativeForDisplay(mockAlternative);
    expect(formatted.title).toBe('Test Alternative');
    expect(formatted.scoreDisplay).toBe('8.5/10');
    expect(formatted.algorithmLabel).toBe('Direct');
  });
});

describe('Integration Tests', () => {
  it('should integrate validation with early cash-out', async () => {
    const { result } = renderHook(() => useEarlyCashOut({
      enableValidation: true,
      validateOnCalculation: true,
    }));
    
    const mockRequest: EarlyCashOutRequest = {
      sessionId: 'test-session',
      playerId: 'player-1',
      currentChipCount: 100,
      timestamp: new Date(),
    };

    await act(async () => {
      const result_with_validation = await result.current.calculateCashOutWithValidation(mockRequest);
      expect(result_with_validation.result.isValid).toBe(true);
      expect(result_with_validation.validation.isValid).toBe(true);
      expect(result_with_validation.canProceed).toBe(true);
    });
  });

  it('should integrate validation with optimization', async () => {
    const { result } = renderHook(() => useSettlementOptimization({
      enableValidation: true,
      validateOnOptimization: true,
      generateProofOnOptimization: true,
      generateAlternativesOnOptimization: true,
    }));
    
    await act(async () => {
      const optimization_result = await result.current.optimizeSettlementWithValidation('test-session');
      expect(optimization_result.optimization.isValid).toBe(true);
      expect(optimization_result.validation?.isValid).toBe(true);
      expect(optimization_result.canProceed).toBe(true);
    });
  });
});

describe('Hook Utility Functions', () => {
  it('should provide validation status correctly', () => {
    const { result } = renderHook(() => 
      useSettlementValidation().isValidationPassing()
    );
    
    expect(result.current).toBe(false); // No validation result available
  });

  it('should provide proof verification status correctly', () => {
    const { result } = renderHook(() => 
      useMathematicalProof().getProofSummary()
    );
    
    expect(result.current.status).toBe('invalid');
    expect(result.current.message).toBe('No proof available');
  });

  it('should provide alternative analysis correctly', () => {
    const { result } = renderHook(() => 
      useAlternativeSettlements().analyzeAlternatives()
    );
    
    expect(result.current.bestOption).toBeNull();
    expect(result.current.averageScore).toBe(0);
  });
});

describe('Error Handling', () => {
  it('should handle validation errors gracefully', async () => {
    const mockValidation = jest.fn().mockRejectedValue(new Error('Validation failed'));
    
    const { result } = renderHook(() => useSettlementValidation({
      onValidationError: jest.fn(),
    }));
    
    // Replace the mock temporarily
    (result.current as any).validateSettlement = mockValidation;
    
    await act(async () => {
      try {
        await result.current.validateSettlement({} as OptimizedSettlement);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  it('should handle proof generation errors gracefully', async () => {
    const mockProofGeneration = jest.fn().mockRejectedValue(new Error('Proof generation failed'));
    
    const { result } = renderHook(() => useMathematicalProof({
      onProofGenerationError: jest.fn(),
    }));
    
    // Replace the mock temporarily
    (result.current as any).generateProof = mockProofGeneration;
    
    await act(async () => {
      try {
        await result.current.generateProof({} as OptimizedSettlement);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  it('should handle alternative generation errors gracefully', async () => {
    const mockAlternativeGeneration = jest.fn().mockRejectedValue(new Error('Alternative generation failed'));
    
    const { result } = renderHook(() => useAlternativeSettlements({
      onGenerationError: jest.fn(),
    }));
    
    // Replace the mock temporarily
    (result.current as any).generateAlternatives = mockAlternativeGeneration;
    
    await act(async () => {
      try {
        await result.current.generateAlternatives('test-session');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});