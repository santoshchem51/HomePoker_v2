/**
 * Settlement Store - Epic 3: Settlement Optimization
 * Story 3.1: Early Cash-out Calculator Implementation
 * 
 * Zustand store for settlement calculations and state management
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { SettlementService } from '../services/settlement/SettlementService';
import { ServiceError } from '../services/core/ServiceError';
import {
  EarlyCashOutRequest,
  EarlyCashOutResult,
  SettlementCalculation,
  BankBalance,
  SettlementStatus,
  SettlementOptions,
  OptimizedSettlement,
  PaymentPlan,
  SettlementValidation,
  SettlementAuditEntry,
  MathematicalProof,
  AlternativeSettlement,
  SettlementComparison,
  SettlementWarningExtended,
  RealTimeMonitoringState,
  WarningPersistence,
  ExportMetadata,
  ExportResult,
  ProofIntegrityResult,
  SettlementGenerationOptions,
} from '../types/settlement';

interface SettlementState {
  // Early cash-out state
  currentCashOutResult: EarlyCashOutResult | null;
  cashOutHistory: EarlyCashOutResult[];
  
  // Settlement calculation state
  currentSettlement: SettlementCalculation | null;
  settlementHistory: SettlementCalculation[];
  
  // Story 3.2 - Optimization state
  currentOptimizedSettlement: OptimizedSettlement | null;
  optimizationHistory: OptimizedSettlement[];
  isOptimizing: boolean;
  optimizationProgress: number; // 0-100
  optimizationError: ServiceError | null;
  
  // Bank balance state
  currentBankBalance: BankBalance | null;
  
  // Operation state
  isCalculating: boolean;
  lastCalculationTime: number | null;
  error: ServiceError | null;
  status: SettlementStatus;
  
  // Performance and options
  calculationCache: Map<string, any>;
  options: SettlementOptions;
  
  // Story 3.3 - Validation state management
  validationState: {
    currentValidation: SettlementValidation | null;
    validationHistory: SettlementValidation[];
    isValidating: boolean;
    validationProgress: number; // 0-100
    validationError: ServiceError | null;
    realTimeValidationEnabled: boolean;
    lastValidationTime: number | null;
  };
  
  // Warning and alert system state
  warningState: {
    activeWarnings: SettlementWarningExtended[];
    warningHistory: SettlementWarningExtended[];
    monitoringStates: Map<string, RealTimeMonitoringState>;
    warningPersistence: Map<string, WarningPersistence>;
    isMonitoring: boolean;
    lastWarningCheck: number | null;
    criticalWarningCount: number;
    majorWarningCount: number;
    minorWarningCount: number;
  };
  
  // Mathematical proof state
  proofState: {
    currentProof: MathematicalProof | null;
    proofHistory: MathematicalProof[];
    isGeneratingProof: boolean;
    proofProgress: number; // 0-100
    proofError: ServiceError | null;
    exportHistory: ExportMetadata[];
    lastProofGeneration: number | null;
  };
  
  // Alternative settlement options state
  alternativeState: {
    currentComparison: SettlementComparison | null;
    comparisonHistory: SettlementComparison[];
    selectedAlternative: AlternativeSettlement | null;
    isGeneratingAlternatives: boolean;
    alternativeProgress: number; // 0-100
    alternativeError: ServiceError | null;
    generationOptions: SettlementGenerationOptions | null;
    lastAlternativeGeneration: number | null;
  };
  
  // Audit trail state
  auditState: {
    currentAuditTrail: SettlementAuditEntry[];
    auditHistory: SettlementAuditEntry[][];
    isTrackingAudit: boolean;
    auditStepCount: number;
    lastAuditUpdate: number | null;
  };
  
  // Actions
  calculateEarlyCashOut: (request: EarlyCashOutRequest) => Promise<EarlyCashOutResult>;
  calculateOptimizedSettlement: (sessionId: string) => Promise<SettlementCalculation>;
  calculateBankBalance: (sessionId: string) => Promise<BankBalance>;
  
  // Story 3.2 - Optimization actions
  optimizeSettlement: (sessionId: string) => Promise<OptimizedSettlement>;
  compareOptimizations: (sessionId: string) => Promise<{
    direct: PaymentPlan[];
    optimized: PaymentPlan[];
    improvement: number;
  }>;
  
  // State management
  clearCurrentResult: () => void;
  clearError: () => void;
  setStatus: (status: SettlementStatus) => void;
  updateOptions: (options: Partial<SettlementOptions>) => void;
  
  // Optimization state management
  clearOptimizationResult: () => void;
  clearOptimizationError: () => void;
  setOptimizationProgress: (progress: number) => void;
  
  // Cache management
  getCachedResult: (key: string) => any | null;
  setCachedResult: (key: string, result: any) => void;
  clearCache: () => void;
  
  // Utility actions
  getCalculationPerformanceMetrics: () => {
    averageCalculationTime: number;
    totalCalculations: number;
    cacheHitRate: number;
  };
  
  // Optimization performance metrics
  getOptimizationMetrics: () => {
    averageOptimizationTime: number;
    averageReductionPercentage: number;
    totalOptimizations: number;
    successRate: number;
  };
  
  // Story 3.3 - Validation actions
  validateSettlement: (settlement: OptimizedSettlement) => Promise<SettlementValidation>;
  enableRealTimeValidation: (sessionId: string) => void;
  disableRealTimeValidation: () => void;
  clearValidationResult: () => void;
  clearValidationError: () => void;
  setValidationProgress: (progress: number) => void;
  getValidationMetrics: () => {
    totalValidations: number;
    validationSuccessRate: number;
    averageValidationTime: number;
    criticalErrorCount: number;
  };
  
  // Warning system actions
  startWarningMonitoring: (sessionId: string) => Promise<void>;
  stopWarningMonitoring: () => void;
  recordManualAdjustment: (sessionId: string, adjustment: any) => Promise<void>;
  resolveWarning: (warningId: string, resolution: string) => Promise<void>;
  dismissWarning: (warningId: string) => void;
  clearActiveWarnings: () => void;
  getWarningMetrics: () => {
    totalWarnings: number;
    criticalWarnings: number;
    majorWarnings: number;
    minorWarnings: number;
    resolutionRate: number;
  };
  
  // Mathematical proof actions
  generateMathematicalProof: (settlement: OptimizedSettlement) => Promise<MathematicalProof>;
  exportMathematicalProof: (proofId: string, format: 'pdf' | 'json' | 'text' | 'csv') => Promise<ExportResult>;
  verifyProofIntegrity: (proof: MathematicalProof) => Promise<ProofIntegrityResult>;
  clearProofResult: () => void;
  clearProofError: () => void;
  setProofProgress: (progress: number) => void;
  getProofMetrics: () => {
    totalProofs: number;
    averageProofTime: number;
    successfulExports: number;
    verificationSuccessRate: number;
  };
  
  // Alternative settlement actions
  generateAlternativeSettlements: (sessionId: string, options?: Partial<SettlementGenerationOptions>) => Promise<SettlementComparison>;
  selectAlternativeSettlement: (alternativeId: string) => void;
  compareAlternativeSettlements: (alternativeIds: string[]) => SettlementComparison | null;
  clearAlternativeResults: () => void;
  clearAlternativeError: () => void;
  setAlternativeProgress: (progress: number) => void;
  getAlternativeMetrics: () => {
    totalComparisons: number;
    averageGenerationTime: number;
    mostSelectedAlgorithm: string;
    averageAlternativeCount: number;
  };
  
  // Audit trail actions
  startAuditTrail: () => void;
  addAuditStep: (step: SettlementAuditEntry) => void;
  completeAuditTrail: () => void;
  clearAuditTrail: () => void;
  getAuditMetrics: () => {
    totalAuditTrails: number;
    averageStepCount: number;
    auditCompletionRate: number;
  };
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL

export const useSettlementStore = create<SettlementState>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentCashOutResult: null,
      cashOutHistory: [],
      currentSettlement: null,
      settlementHistory: [],
      
      // Optimization state
      currentOptimizedSettlement: null,
      optimizationHistory: [],
      isOptimizing: false,
      optimizationProgress: 0,
      optimizationError: null,
      
      currentBankBalance: null,
      isCalculating: false,
      lastCalculationTime: null,
      error: null,
      status: SettlementStatus.PENDING,
      calculationCache: new Map(),
      
      // Story 3.3 - Validation state initialization
      validationState: {
        currentValidation: null,
        validationHistory: [],
        isValidating: false,
        validationProgress: 0,
        validationError: null,
        realTimeValidationEnabled: false,
        lastValidationTime: null,
      },
      
      // Warning and alert system state initialization
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
      
      // Mathematical proof state initialization
      proofState: {
        currentProof: null,
        proofHistory: [],
        isGeneratingProof: false,
        proofProgress: 0,
        proofError: null,
        exportHistory: [],
        lastProofGeneration: null,
      },
      
      // Alternative settlement options state initialization
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
      
      // Audit trail state initialization
      auditState: {
        currentAuditTrail: [],
        auditHistory: [],
        isTrackingAudit: false,
        auditStepCount: 0,
        lastAuditUpdate: null,
      },
      options: {
        maxCalculationTimeMs: 1000,
        enableOptimization: true,
        enableCaching: true,
        decimalPrecision: 2,
        roundingMode: 'round',
        requireBalancedSettlement: true,
        allowNegativeBank: false,
        maxDiscrepancyAmount: 0.01,
        handleFractionalCents: true,
        minimumTransactionAmount: 0.01,
        enableAuditTrail: true,
        logPerformanceMetrics: true,
      },

      // Early cash-out calculation
      calculateEarlyCashOut: async (request: EarlyCashOutRequest): Promise<EarlyCashOutResult> => {
        const startTime = Date.now();
        const cacheKey = `cashout_${request.sessionId}_${request.playerId}_${request.currentChipCount}`;
        
        set({ isCalculating: true, error: null, status: SettlementStatus.CALCULATING });
        
        try {
          // Check cache first
          const state = get();
          const cachedResult = state.getCachedResult(cacheKey);
          if (cachedResult && state.options.enableCaching) {
            set({
              currentCashOutResult: cachedResult,
              isCalculating: false,
              status: SettlementStatus.COMPLETED,
              lastCalculationTime: Date.now() - startTime,
            });
            return cachedResult;
          }

          // Initialize settlement service
          const settlementService = SettlementService.getInstance();
          await settlementService.initialize();
          
          // Perform calculation
          const result = await settlementService.calculateEarlyCashOut(request);
          
          const calculationTime = Date.now() - startTime;
          
          // Update state
          set((state) => ({
            currentCashOutResult: result,
            cashOutHistory: [...state.cashOutHistory, result],
            isCalculating: false,
            status: SettlementStatus.COMPLETED,
            lastCalculationTime: calculationTime,
          }));
          
          // Cache result
          get().setCachedResult(cacheKey, result);
          
          return result;
          
        } catch (error) {
          const serviceError = error instanceof ServiceError 
            ? error 
            : new ServiceError('CASH_OUT_CALCULATION_FAILED', 'Cash-out calculation failed');
          
          set({
            error: serviceError,
            isCalculating: false,
            status: SettlementStatus.FAILED,
            lastCalculationTime: Date.now() - startTime,
          });
          
          throw serviceError;
        }
      },

      // Optimized settlement calculation  
      calculateOptimizedSettlement: async (sessionId: string): Promise<SettlementCalculation> => {
        const startTime = Date.now();
        const cacheKey = `settlement_${sessionId}`;
        
        set({ isCalculating: true, error: null, status: SettlementStatus.CALCULATING });
        
        try {
          // Check cache first
          const state = get();
          const cachedResult = state.getCachedResult(cacheKey);
          if (cachedResult && state.options.enableCaching) {
            set({
              currentSettlement: cachedResult,
              isCalculating: false,
              status: SettlementStatus.COMPLETED,
              lastCalculationTime: Date.now() - startTime,
            });
            return cachedResult;
          }

          // Initialize settlement service
          const settlementService = SettlementService.getInstance();
          await settlementService.initialize();
          
          // Perform calculation
          const result = await settlementService.calculateOptimizedSettlement(sessionId);
          
          const calculationTime = Date.now() - startTime;
          
          // Update state
          set((state) => ({
            currentSettlement: result,
            settlementHistory: [...state.settlementHistory, result],
            isCalculating: false,
            status: SettlementStatus.COMPLETED,
            lastCalculationTime: calculationTime,
          }));
          
          // Cache result
          get().setCachedResult(cacheKey, result);
          
          return result;
          
        } catch (error) {
          const serviceError = error instanceof ServiceError 
            ? error 
            : new ServiceError('SETTLEMENT_OPTIMIZATION_FAILED', 'Settlement optimization failed');
          
          set({
            error: serviceError,
            isCalculating: false,
            status: SettlementStatus.FAILED,
            lastCalculationTime: Date.now() - startTime,
          });
          
          throw serviceError;
        }
      },

      // Bank balance calculation
      calculateBankBalance: async (sessionId: string): Promise<BankBalance> => {
        const cacheKey = `bank_${sessionId}`;
        
        try {
          // Check cache first
          const state = get();
          const cachedResult = state.getCachedResult(cacheKey);
          if (cachedResult && state.options.enableCaching) {
            set({ currentBankBalance: cachedResult });
            return cachedResult;
          }

          // Initialize settlement service
          const settlementService = SettlementService.getInstance();
          await settlementService.initialize();
          
          // Perform calculation
          const result = await settlementService.calculateBankBalance(sessionId);
          
          // Update state
          set({ currentBankBalance: result });
          
          // Cache result with shorter TTL for bank balance
          get().setCachedResult(cacheKey, result);
          
          return result;
          
        } catch (error) {
          const serviceError = error instanceof ServiceError 
            ? error 
            : new ServiceError('BANK_BALANCE_CALCULATION_FAILED', 'Bank balance calculation failed');
          
          set({ error: serviceError });
          throw serviceError;
        }
      },

      // Story 3.2 - Settlement optimization action
      optimizeSettlement: async (sessionId: string): Promise<OptimizedSettlement> => {
        const startTime = Date.now();
        const cacheKey = `optimization_${sessionId}`;
        
        set({ 
          isOptimizing: true, 
          optimizationError: null, 
          optimizationProgress: 10,
          status: SettlementStatus.CALCULATING 
        });
        
        try {
          // Check cache first
          const state = get();
          const cachedResult = state.getCachedResult(cacheKey);
          if (cachedResult && state.options.enableCaching) {
            set({
              currentOptimizedSettlement: cachedResult,
              isOptimizing: false,
              optimizationProgress: 100,
              status: SettlementStatus.COMPLETED,
              lastCalculationTime: Date.now() - startTime,
            });
            return cachedResult;
          }

          // Initialize settlement service
          const settlementService = SettlementService.getInstance();
          await settlementService.initialize();
          
          // Update optimization options to match store settings
          settlementService.updateOptions(state.options);
          
          set({ optimizationProgress: 50 });
          
          // Perform optimization
          const result = await settlementService.optimizeSettlement(sessionId);
          
          const calculationTime = Date.now() - startTime;
          
          // Update state
          set((state) => ({
            currentOptimizedSettlement: result,
            optimizationHistory: [...state.optimizationHistory, result],
            isOptimizing: false,
            optimizationProgress: 100,
            status: SettlementStatus.COMPLETED,
            lastCalculationTime: calculationTime,
          }));
          
          // Cache result
          get().setCachedResult(cacheKey, result);
          
          return result;
          
        } catch (error) {
          const serviceError = error instanceof ServiceError 
            ? error 
            : new ServiceError('OPTIMIZATION_FAILED', 'Settlement optimization failed');
          
          set({
            optimizationError: serviceError,
            isOptimizing: false,
            optimizationProgress: 0,
            status: SettlementStatus.FAILED,
            lastCalculationTime: Date.now() - startTime,
          });
          
          throw serviceError;
        }
      },

      // Compare optimization results
      compareOptimizations: async (sessionId: string): Promise<{
        direct: PaymentPlan[];
        optimized: PaymentPlan[];
        improvement: number;
      }> => {
        try {
          const optimization = await get().optimizeSettlement(sessionId);
          
          return {
            direct: optimization.directPayments,
            optimized: optimization.optimizedPayments,
            improvement: optimization.optimizationMetrics.reductionPercentage
          };
          
        } catch (error) {
          throw new ServiceError('COMPARISON_FAILED', 'Settlement comparison failed');
        }
      },

      // State management actions
      clearCurrentResult: () => {
        set({
          currentCashOutResult: null,
          currentSettlement: null,
          currentOptimizedSettlement: null,
          error: null,
          optimizationError: null,
          status: SettlementStatus.PENDING,
        });
      },

      clearError: () => {
        set({ error: null });
      },

      setStatus: (status: SettlementStatus) => {
        set({ status });
      },

      // Optimization state management
      clearOptimizationResult: () => {
        set({
          currentOptimizedSettlement: null,
          optimizationError: null,
          optimizationProgress: 0,
          isOptimizing: false,
        });
      },

      clearOptimizationError: () => {
        set({ optimizationError: null });
      },

      setOptimizationProgress: (progress: number) => {
        set({ optimizationProgress: Math.min(100, Math.max(0, progress)) });
      },

      updateOptions: (newOptions: Partial<SettlementOptions>) => {
        set((state) => ({
          options: { ...state.options, ...newOptions },
        }));
        
        // Update service options
        const settlementService = SettlementService.getInstance();
        settlementService.updateOptions(newOptions);
      },

      // Cache management
      getCachedResult: (key: string) => {
        const state = get();
        const cached = state.calculationCache.get(key);
        
        if (!cached) return null;
        
        // Check TTL
        if (Date.now() - cached.timestamp > CACHE_TTL) {
          state.calculationCache.delete(key);
          return null;
        }
        
        return cached.result;
      },

      setCachedResult: (key: string, result: any) => {
        const state = get();
        state.calculationCache.set(key, {
          result,
          timestamp: Date.now(),
        });
      },

      clearCache: () => {
        set({ calculationCache: new Map() });
        
        // Clear service cache too
        const settlementService = SettlementService.getInstance();
        settlementService.clearCache();
      },

      // Performance metrics
      getCalculationPerformanceMetrics: () => {
        const state = get();
        const totalCalculations = state.cashOutHistory.length + state.settlementHistory.length;
        
        const totalTime = state.cashOutHistory.reduce(
          (sum, result) => sum + result.calculationDurationMs, 
          0
        );
        
        const averageCalculationTime = totalCalculations > 0 ? totalTime / totalCalculations : 0;
        
        // Simple cache hit rate calculation
        const cacheSize = state.calculationCache.size;
        const cacheHitRate = cacheSize > 0 ? (cacheSize / Math.max(totalCalculations, 1)) * 100 : 0;
        
        return {
          averageCalculationTime,
          totalCalculations,
          cacheHitRate,
        };
      },

      // Optimization performance metrics
      getOptimizationMetrics: () => {
        const state = get();
        const optimizations = state.optimizationHistory;
        
        if (optimizations.length === 0) {
          return {
            averageOptimizationTime: 0,
            averageReductionPercentage: 0,
            totalOptimizations: 0,
            successRate: 0,
          };
        }
        
        const totalTime = optimizations.reduce(
          (sum, opt) => sum + opt.optimizationMetrics.processingTime, 
          0
        );
        
        const totalReduction = optimizations.reduce(
          (sum, opt) => sum + opt.optimizationMetrics.reductionPercentage, 
          0
        );
        
        const successfulOptimizations = optimizations.filter(opt => opt.isValid).length;
        
        return {
          averageOptimizationTime: totalTime / optimizations.length,
          averageReductionPercentage: totalReduction / optimizations.length,
          totalOptimizations: optimizations.length,
          successRate: (successfulOptimizations / optimizations.length) * 100,
        };
      },
      
      // Story 3.3 - Validation actions implementation
      validateSettlement: async (settlement: OptimizedSettlement): Promise<SettlementValidation> => {
        const startTime = Date.now();
        
        set((state) => ({
          validationState: {
            ...state.validationState,
            isValidating: true,
            validationError: null,
            validationProgress: 10,
          },
        }));
        
        try {
          // Initialize settlement service
          const settlementService = SettlementService.getInstance();
          await settlementService.initialize();
          
          set((state) => ({
            validationState: {
              ...state.validationState,
              validationProgress: 50,
            },
          }));
          
          // Perform validation
          const result = await settlementService.validateSettlement(settlement);
          
          const validationTime = Date.now() - startTime;
          
          // Update state
          set((state) => ({
            validationState: {
              ...state.validationState,
              currentValidation: result,
              validationHistory: [...state.validationState.validationHistory, result],
              isValidating: false,
              validationProgress: 100,
              lastValidationTime: validationTime,
            },
          }));
          
          return result;
          
        } catch (error) {
          const serviceError = error instanceof ServiceError 
            ? error 
            : new ServiceError('VALIDATION_FAILED', 'Settlement validation failed');
          
          set((state) => ({
            validationState: {
              ...state.validationState,
              validationError: serviceError,
              isValidating: false,
              validationProgress: 0,
              lastValidationTime: Date.now() - startTime,
            },
          }));
          
          throw serviceError;
        }
      },
      
      enableRealTimeValidation: (_sessionId: string) => {
        set((state) => ({
          validationState: {
            ...state.validationState,
            realTimeValidationEnabled: true,
          },
        }));
      },
      
      disableRealTimeValidation: () => {
        set((state) => ({
          validationState: {
            ...state.validationState,
            realTimeValidationEnabled: false,
          },
        }));
      },
      
      clearValidationResult: () => {
        set((state) => ({
          validationState: {
            ...state.validationState,
            currentValidation: null,
            validationError: null,
            validationProgress: 0,
          },
        }));
      },
      
      clearValidationError: () => {
        set((state) => ({
          validationState: {
            ...state.validationState,
            validationError: null,
          },
        }));
      },
      
      setValidationProgress: (progress: number) => {
        set((state) => ({
          validationState: {
            ...state.validationState,
            validationProgress: Math.min(100, Math.max(0, progress)),
          },
        }));
      },
      
      getValidationMetrics: () => {
        const state = get();
        const validations = state.validationState.validationHistory;
        
        if (validations.length === 0) {
          return {
            totalValidations: 0,
            validationSuccessRate: 0,
            averageValidationTime: 0,
            criticalErrorCount: 0,
          };
        }
        
        const successfulValidations = validations.filter(v => v.isValid).length;
        const criticalErrors = validations.reduce(
          (sum, v) => sum + v.errors.filter(e => e.severity === 'critical').length,
          0
        );
        
        return {
          totalValidations: validations.length,
          validationSuccessRate: (successfulValidations / validations.length) * 100,
          averageValidationTime: state.validationState.lastValidationTime || 0,
          criticalErrorCount: criticalErrors,
        };
      },
      
      // Warning system actions implementation
      startWarningMonitoring: async (sessionId: string): Promise<void> => {
        try {
          const settlementService = SettlementService.getInstance();
          await settlementService.startRealTimeMonitoring(sessionId);
          
          set((state) => ({
            warningState: {
              ...state.warningState,
              isMonitoring: true,
              lastWarningCheck: Date.now(),
            },
          }));
        } catch (error) {
          throw new ServiceError('WARNING_MONITORING_FAILED', 'Failed to start warning monitoring');
        }
      },
      
      stopWarningMonitoring: () => {
        const settlementService = SettlementService.getInstance();
        settlementService.stopRealTimeMonitoring();
        
        set((state) => ({
          warningState: {
            ...state.warningState,
            isMonitoring: false,
          },
        }));
      },
      
      recordManualAdjustment: async (sessionId: string, adjustment: any): Promise<void> => {
        try {
          const settlementService = SettlementService.getInstance();
          await settlementService.recordManualAdjustment(sessionId, adjustment);
          
          // Update active warnings
          const activeWarnings = await settlementService.getActiveWarnings(sessionId);
          
          set((state) => ({
            warningState: {
              ...state.warningState,
              activeWarnings,
              criticalWarningCount: activeWarnings.filter(w => w.severity === 'critical').length,
              majorWarningCount: activeWarnings.filter(w => w.severity === 'major').length,
              minorWarningCount: activeWarnings.filter(w => w.severity === 'minor').length,
              lastWarningCheck: Date.now(),
            },
          }));
        } catch (error) {
          throw new ServiceError('MANUAL_ADJUSTMENT_FAILED', 'Failed to record manual adjustment');
        }
      },
      
      resolveWarning: async (warningId: string, resolution: string): Promise<void> => {
        try {
          const settlementService = SettlementService.getInstance();
          await settlementService.resolveWarning(warningId, resolution);
          
          set((state) => {
            const updatedWarnings = state.warningState.activeWarnings.filter(w => w.warningId !== warningId);
            return {
              warningState: {
                ...state.warningState,
                activeWarnings: updatedWarnings,
                criticalWarningCount: updatedWarnings.filter(w => w.severity === 'critical').length,
                majorWarningCount: updatedWarnings.filter(w => w.severity === 'major').length,
                minorWarningCount: updatedWarnings.filter(w => w.severity === 'minor').length,
              },
            };
          });
        } catch (error) {
          throw new ServiceError('WARNING_RESOLUTION_FAILED', 'Failed to resolve warning');
        }
      },
      
      dismissWarning: (warningId: string) => {
        set((state) => {
          const updatedWarnings = state.warningState.activeWarnings.filter(w => w.warningId !== warningId);
          return {
            warningState: {
              ...state.warningState,
              activeWarnings: updatedWarnings,
              criticalWarningCount: updatedWarnings.filter(w => w.severity === 'critical').length,
              majorWarningCount: updatedWarnings.filter(w => w.severity === 'major').length,
              minorWarningCount: updatedWarnings.filter(w => w.severity === 'minor').length,
            },
          };
        });
      },
      
      clearActiveWarnings: () => {
        set((state) => ({
          warningState: {
            ...state.warningState,
            activeWarnings: [],
            criticalWarningCount: 0,
            majorWarningCount: 0,
            minorWarningCount: 0,
          },
        }));
      },
      
      getWarningMetrics: () => {
        const state = get();
        const allWarnings = [
          ...state.warningState.activeWarnings,
          ...state.warningState.warningHistory,
        ];
        
        const resolvedWarnings = allWarnings.filter(w => w.isResolved).length;
        
        return {
          totalWarnings: allWarnings.length,
          criticalWarnings: state.warningState.criticalWarningCount,
          majorWarnings: state.warningState.majorWarningCount,
          minorWarnings: state.warningState.minorWarningCount,
          resolutionRate: allWarnings.length > 0 ? (resolvedWarnings / allWarnings.length) * 100 : 0,
        };
      },
      
      // Mathematical proof actions implementation
      generateMathematicalProof: async (settlement: OptimizedSettlement): Promise<MathematicalProof> => {
        const startTime = Date.now();
        
        set((state) => ({
          proofState: {
            ...state.proofState,
            isGeneratingProof: true,
            proofError: null,
            proofProgress: 10,
          },
        }));
        
        try {
          const settlementService = SettlementService.getInstance();
          await settlementService.initialize();
          
          set((state) => ({
            proofState: {
              ...state.proofState,
              proofProgress: 50,
            },
          }));
          
          const result = await settlementService.generateMathematicalProof(settlement);
          
          const proofTime = Date.now() - startTime;
          
          set((state) => ({
            proofState: {
              ...state.proofState,
              currentProof: result,
              proofHistory: [...state.proofState.proofHistory, result],
              isGeneratingProof: false,
              proofProgress: 100,
              lastProofGeneration: proofTime,
            },
          }));
          
          return result;
          
        } catch (error) {
          const serviceError = error instanceof ServiceError 
            ? error 
            : new ServiceError('PROOF_GENERATION_FAILED', 'Mathematical proof generation failed');
          
          set((state) => ({
            proofState: {
              ...state.proofState,
              proofError: serviceError,
              isGeneratingProof: false,
              proofProgress: 0,
              lastProofGeneration: Date.now() - startTime,
            },
          }));
          
          throw serviceError;
        }
      },
      
      exportMathematicalProof: async (proofId: string, format: 'pdf' | 'json' | 'text' | 'csv'): Promise<ExportResult> => {
        try {
          const state = get();
          const proof = state.proofState.proofHistory.find(p => p.proofId === proofId);
          if (!proof) {
            throw new ServiceError('PROOF_NOT_FOUND', 'Mathematical proof not found');
          }
          const settlementService = SettlementService.getInstance();
          const result = await settlementService.exportMathematicalProof(proof, { format });
          
          // Update export history
          set((state) => ({
            proofState: {
              ...state.proofState,
              exportHistory: [...state.proofState.exportHistory, result.metadata],
            },
          }));
          
          return result;
        } catch (error) {
          throw new ServiceError('PROOF_EXPORT_FAILED', 'Mathematical proof export failed');
        }
      },
      
      verifyProofIntegrity: async (proof: MathematicalProof): Promise<ProofIntegrityResult> => {
        try {
          const settlementService = SettlementService.getInstance();
          return await settlementService.verifyProofIntegrity(proof);
        } catch (error) {
          throw new ServiceError('PROOF_VERIFICATION_FAILED', 'Proof integrity verification failed');
        }
      },
      
      clearProofResult: () => {
        set((state) => ({
          proofState: {
            ...state.proofState,
            currentProof: null,
            proofError: null,
            proofProgress: 0,
          },
        }));
      },
      
      clearProofError: () => {
        set((state) => ({
          proofState: {
            ...state.proofState,
            proofError: null,
          },
        }));
      },
      
      setProofProgress: (progress: number) => {
        set((state) => ({
          proofState: {
            ...state.proofState,
            proofProgress: Math.min(100, Math.max(0, progress)),
          },
        }));
      },
      
      getProofMetrics: () => {
        const state = get();
        const proofs = state.proofState.proofHistory;
        const exports = state.proofState.exportHistory;
        
        const validProofs = proofs.filter(p => p.isValid).length;
        const successfulExports = exports.filter(e => e.status === 'completed').length;
        
        return {
          totalProofs: proofs.length,
          averageProofTime: state.proofState.lastProofGeneration || 0,
          successfulExports,
          verificationSuccessRate: proofs.length > 0 ? (validProofs / proofs.length) * 100 : 0,
        };
      },
      
      // Alternative settlement actions implementation
      generateAlternativeSettlements: async (
        sessionId: string, 
        options?: Partial<SettlementGenerationOptions>
      ): Promise<SettlementComparison> => {
        const startTime = Date.now();
        
        set((state) => ({
          alternativeState: {
            ...state.alternativeState,
            isGeneratingAlternatives: true,
            alternativeError: null,
            alternativeProgress: 10,
            generationOptions: options ? {
              enabledAlgorithms: options.enabledAlgorithms || ['greedy_debt_reduction'],
              maxAlternatives: options.maxAlternatives || 3,
              includePerformanceMetrics: options.includePerformanceMetrics || false,
              enableOptimizationComparison: options.enableOptimizationComparison || true,
              filterCriteria: options.filterCriteria || {
                minImprovement: 10,
                maxComplexity: 0.8,
                preferredTransactionCount: 'minimize'
              }
            } : null,
          },
        }));
        
        try {
          const settlementService = SettlementService.getInstance();
          await settlementService.initialize();
          
          set((state) => ({
            alternativeState: {
              ...state.alternativeState,
              alternativeProgress: 50,
            },
          }));
          
          const result = await settlementService.generateAlternativeSettlements(sessionId, options);
          
          const generationTime = Date.now() - startTime;
          
          set((state) => ({
            alternativeState: {
              ...state.alternativeState,
              currentComparison: result,
              comparisonHistory: [...state.alternativeState.comparisonHistory, result],
              isGeneratingAlternatives: false,
              alternativeProgress: 100,
              lastAlternativeGeneration: generationTime,
            },
          }));
          
          return result;
          
        } catch (error) {
          const serviceError = error instanceof ServiceError 
            ? error 
            : new ServiceError('ALTERNATIVE_GENERATION_FAILED', 'Alternative settlement generation failed');
          
          set((state) => ({
            alternativeState: {
              ...state.alternativeState,
              alternativeError: serviceError,
              isGeneratingAlternatives: false,
              alternativeProgress: 0,
              lastAlternativeGeneration: Date.now() - startTime,
            },
          }));
          
          throw serviceError;
        }
      },
      
      selectAlternativeSettlement: (alternativeId: string) => {
        set((state) => {
          const selected = state.alternativeState.currentComparison?.alternatives.find(
            alt => alt.optionId === alternativeId
          );
          
          return {
            alternativeState: {
              ...state.alternativeState,
              selectedAlternative: selected || null,
            },
          };
        });
      },
      
      compareAlternativeSettlements: (alternativeIds: string[]): SettlementComparison | null => {
        const state = get();
        const currentComparison = state.alternativeState.currentComparison;
        
        if (!currentComparison) return null;
        
        const filteredAlternatives = currentComparison.alternatives.filter(
          alt => alternativeIds.includes(alt.optionId)
        );
        
        return {
          ...currentComparison,
          alternatives: filteredAlternatives,
        };
      },
      
      clearAlternativeResults: () => {
        set((state) => ({
          alternativeState: {
            ...state.alternativeState,
            currentComparison: null,
            selectedAlternative: null,
            alternativeError: null,
            alternativeProgress: 0,
          },
        }));
      },
      
      clearAlternativeError: () => {
        set((state) => ({
          alternativeState: {
            ...state.alternativeState,
            alternativeError: null,
          },
        }));
      },
      
      setAlternativeProgress: (progress: number) => {
        set((state) => ({
          alternativeState: {
            ...state.alternativeState,
            alternativeProgress: Math.min(100, Math.max(0, progress)),
          },
        }));
      },
      
      getAlternativeMetrics: () => {
        const state = get();
        const comparisons = state.alternativeState.comparisonHistory;
        
        if (comparisons.length === 0) {
          return {
            totalComparisons: 0,
            averageGenerationTime: 0,
            mostSelectedAlgorithm: 'none',
            averageAlternativeCount: 0,
          };
        }
        
        const totalAlternatives = comparisons.reduce(
          (sum, comp) => sum + comp.alternatives.length,
          0
        );
        
        return {
          totalComparisons: comparisons.length,
          averageGenerationTime: state.alternativeState.lastAlternativeGeneration || 0,
          mostSelectedAlgorithm: 'greedy_debt_reduction', // Could be calculated based on selection history
          averageAlternativeCount: totalAlternatives / comparisons.length,
        };
      },
      
      // Audit trail actions implementation
      startAuditTrail: () => {
        set((state) => ({
          auditState: {
            ...state.auditState,
            currentAuditTrail: [],
            isTrackingAudit: true,
            auditStepCount: 0,
            lastAuditUpdate: Date.now(),
          },
        }));
      },
      
      addAuditStep: (step: SettlementAuditEntry) => {
        set((state) => ({
          auditState: {
            ...state.auditState,
            currentAuditTrail: [...state.auditState.currentAuditTrail, step],
            auditStepCount: state.auditState.auditStepCount + 1,
            lastAuditUpdate: Date.now(),
          },
        }));
      },
      
      completeAuditTrail: () => {
        set((state) => ({
          auditState: {
            ...state.auditState,
            auditHistory: [...state.auditState.auditHistory, state.auditState.currentAuditTrail],
            isTrackingAudit: false,
          },
        }));
      },
      
      clearAuditTrail: () => {
        set((state) => ({
          auditState: {
            ...state.auditState,
            currentAuditTrail: [],
            isTrackingAudit: false,
            auditStepCount: 0,
          },
        }));
      },
      
      getAuditMetrics: () => {
        const state = get();
        const auditTrails = state.auditState.auditHistory;
        
        if (auditTrails.length === 0) {
          return {
            totalAuditTrails: 0,
            averageStepCount: 0,
            auditCompletionRate: 0,
          };
        }
        
        const totalSteps = auditTrails.reduce((sum, trail) => sum + trail.length, 0);
        const completedTrails = auditTrails.filter(trail => trail.length > 0).length;
        
        return {
          totalAuditTrails: auditTrails.length,
          averageStepCount: totalSteps / auditTrails.length,
          auditCompletionRate: (completedTrails / auditTrails.length) * 100,
        };
      },
    }),
    {
      name: 'settlement-store', // For Redux DevTools
    }
  )
);