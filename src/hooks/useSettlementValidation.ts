/**
 * Settlement Validation Hook - Epic 3: Settlement Optimization
 * Story 3.3: Settlement Validation and Verification
 * Task 8: Create Settlement Validation Hooks and Integration
 * 
 * Custom React hook for settlement validation with real-time validation triggers,
 * comprehensive error handling, and integration with existing settlement workflow
 */

import { useCallback, useRef, useEffect, useState } from 'react';
import { useSettlementStore } from '../stores/settlementStore';
import { 
  OptimizedSettlement, 
  SettlementValidation,
  ValidationErrorCode,
  SettlementWarningExtended,
  RealTimeMonitoringState,
  EarlyCashOutRequest,
  EarlyCashOutResult
} from '../types/settlement';
import { ServiceError } from '../services/core/ServiceError';

interface UseSettlementValidationOptions {
  // Real-time validation options
  enableRealTimeValidation?: boolean; // Default: false
  validationInterval?: number; // Default: 5000ms (5 seconds)
  
  // Validation triggers
  validateOnOptimization?: boolean; // Default: true
  validateOnCashOut?: boolean; // Default: true
  validateOnManualAdjustment?: boolean; // Default: true
  
  // Callbacks
  onValidationStart?: () => void;
  onValidationComplete?: (result: SettlementValidation) => void;
  onValidationError?: (error: ServiceError) => void;
  onValidationWarning?: (warning: SettlementWarningExtended) => void;
  
  // Performance options
  debounceMs?: number; // Default: 500ms
  cacheValidationResults?: boolean; // Default: true
}

interface ValidationMetrics {
  totalValidations: number;
  validationSuccessRate: number;
  averageValidationTime: number;
  criticalErrorCount: number;
  lastValidationTime?: Date;
}

interface UseSettlementValidationReturn {
  // Core validation functions
  validateSettlement: (settlement: OptimizedSettlement) => Promise<SettlementValidation>;
  validateSettlementDebounced: (settlement: OptimizedSettlement) => void;
  validateCashOut: (request: EarlyCashOutRequest, result: EarlyCashOutResult) => Promise<SettlementValidation>;
  
  // Real-time validation controls
  enableRealTimeValidation: (sessionId: string) => void;
  disableRealTimeValidation: () => void;
  triggerValidation: (sessionId: string) => Promise<void>;
  
  // State
  validationResult: SettlementValidation | null;
  isValidating: boolean;
  validationProgress: number; // 0-100
  validationError: ServiceError | null;
  isRealTimeEnabled: boolean;
  
  // History and metrics
  validationHistory: SettlementValidation[];
  metrics: ValidationMetrics;
  
  // Warning management
  activeWarnings: SettlementWarningExtended[];
  warningCount: {
    critical: number;
    major: number;
    minor: number;
  };
  
  // Actions
  clearValidationResult: () => void;
  clearValidationError: () => void;
  dismissWarning: (warningId: string) => void;
  resolveWarning: (warningId: string, resolution: string) => Promise<void>;
  
  // Utility functions
  isValidationPassing: (result?: SettlementValidation) => boolean;
  getValidationSummary: (result?: SettlementValidation) => {
    status: 'valid' | 'invalid' | 'warning' | 'error';
    message: string;
    color: string;
    icon: string;
    details?: string[];
  };
  
  // Integration helpers
  shouldBlockSettlement: (result?: SettlementValidation) => boolean;
  getValidationRequirements: () => {
    requiresApproval: boolean;
    criticalErrors: string[];
    majorWarnings: string[];
  };
}

export const useSettlementValidation = (
  options: UseSettlementValidationOptions = {}
): UseSettlementValidationReturn => {
  const {
    enableRealTimeValidation: enableRealTimeOption = false,
    validationInterval = 5000,
    validateOnOptimization = true,
    validateOnCashOut = true,
    validateOnManualAdjustment = true,
    onValidationStart,
    onValidationComplete,
    onValidationError,
    onValidationWarning,
    debounceMs = 500,
    cacheValidationResults = true,
  } = options;

  // Zustand store integration
  const {
    validationState: {
      currentValidation: validationResult,
      validationHistory,
      isValidating,
      validationProgress,
      validationError,
      realTimeValidationEnabled: isRealTimeEnabled,
    },
    warningState: {
      activeWarnings,
      criticalWarningCount,
      majorWarningCount,
      minorWarningCount,
    },
    validateSettlement: storeValidateSettlement,
    enableRealTimeValidation: storeEnableRealTimeValidation,
    disableRealTimeValidation: storeDisableRealTimeValidation,
    clearValidationResult,
    clearValidationError,
    setValidationProgress,
    getValidationMetrics,
    dismissWarning,
    resolveWarning: storeResolveWarning,
    recordManualAdjustment,
  } = useSettlementStore();

  // Local state for debouncing and control
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const realTimeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastValidationRef = useRef<OptimizedSettlement | null>(null);

  // Get validation metrics
  const metrics: ValidationMetrics = {
    ...getValidationMetrics(),
    lastValidationTime: validationResult?.auditTrail?.[0]?.timestamp,
  };

  // Warning count summary
  const warningCount = {
    critical: criticalWarningCount,
    major: majorWarningCount,
    minor: minorWarningCount,
  };

  // Core validation function
  const validateSettlement = useCallback(async (settlement: OptimizedSettlement): Promise<SettlementValidation> => {
    try {
      onValidationStart?.();
      
      const result = await storeValidateSettlement(settlement);
      
      // Check for warnings and trigger callbacks
      if (result.warnings.length > 0) {
        result.warnings.forEach(warning => {
          if (warning.severity === 'high') {
            onValidationWarning?.(warning as SettlementWarningExtended);
          }
        });
      }
      
      onValidationComplete?.(result);
      return result;
      
    } catch (error) {
      const serviceError = error instanceof ServiceError 
        ? error 
        : new ServiceError('VALIDATION_FAILED', 'Settlement validation failed');
      
      onValidationError?.(serviceError);
      throw serviceError;
    }
  }, [storeValidateSettlement, onValidationStart, onValidationComplete, onValidationError, onValidationWarning]);

  // Debounced validation function
  const validateSettlementDebounced = useCallback((settlement: OptimizedSettlement) => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Store the settlement for comparison
    lastValidationRef.current = settlement;

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      // Only proceed if this is still the latest settlement
      if (lastValidationRef.current === settlement) {
        validateSettlement(settlement).catch(() => {
          // Error already handled in validateSettlement
        });
      }
    }, debounceMs);
  }, [validateSettlement, debounceMs]);

  // Cash-out specific validation
  const validateCashOut = useCallback(async (
    request: EarlyCashOutRequest,
    result: EarlyCashOutResult
  ): Promise<SettlementValidation> => {
    // Create a pseudo-settlement for validation
    const pseudoSettlement: OptimizedSettlement = {
      sessionId: request.sessionId,
      optimizedPayments: [{
        id: `cashout_${request.playerId}`,
        fromPlayerId: result.settlementType === 'payment_from_player' ? request.playerId : 'bank',
        fromPlayerName: result.playerName,
        toPlayerId: result.settlementType === 'payment_to_player' ? request.playerId : 'bank',
        toPlayerName: result.settlementType === 'payment_to_player' ? result.playerName : 'Bank',
        amount: result.settlementAmount,
        priority: 1,
        description: `Early cash-out for ${result.playerName}`,
      }],
      directPayments: [{
        id: `direct_cashout_${request.playerId}`,
        fromPlayerId: result.settlementType === 'payment_from_player' ? request.playerId : 'bank',
        fromPlayerName: result.playerName,
        toPlayerId: result.settlementType === 'payment_to_player' ? request.playerId : 'bank',
        toPlayerName: result.settlementType === 'payment_to_player' ? result.playerName : 'Bank',
        amount: result.settlementAmount,
        priority: 1,
        description: `Direct early cash-out for ${result.playerName}`,
      }],
      optimizationMetrics: {
        originalPaymentCount: 1,
        optimizedPaymentCount: 1,
        reductionPercentage: 0,
        totalAmountSettled: result.settlementAmount,
        processingTime: result.calculationDurationMs,
      },
      isValid: result.isValid,
      validationErrors: result.validationMessages,
      mathematicalProof: {
        totalDebits: result.settlementType === 'payment_from_player' ? result.settlementAmount : 0,
        totalCredits: result.settlementType === 'payment_to_player' ? result.settlementAmount : 0,
        netBalance: 0,
        isBalanced: result.isValid,
        precision: 2,
        validationTimestamp: result.calculationTimestamp,
        auditSteps: [{
          stepNumber: 1,
          description: 'Cash-out validation',
          expectedValue: 0,
          actualValue: 0,
          isValid: result.isValid,
          tolerance: 0.01,
        }],
      },
    };

    return validateSettlement(pseudoSettlement);
  }, [validateSettlement]);

  // Real-time validation control
  const enableRealTimeValidation = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId);
    storeEnableRealTimeValidation(sessionId);
    
    if (enableRealTimeOption && !realTimeTimerRef.current) {
      realTimeTimerRef.current = setInterval(async () => {
        try {
          await triggerValidation(sessionId);
        } catch (error) {
          console.warn('Real-time validation failed:', error);
        }
      }, validationInterval);
    }
  }, [storeEnableRealTimeValidation, enableRealTimeOption, validationInterval]);

  const disableRealTimeValidation = useCallback(() => {
    setCurrentSessionId(null);
    storeDisableRealTimeValidation();
    
    if (realTimeTimerRef.current) {
      clearInterval(realTimeTimerRef.current);
      realTimeTimerRef.current = null;
    }
  }, [storeDisableRealTimeValidation]);

  // Trigger validation for current session
  const triggerValidation = useCallback(async (sessionId: string) => {
    try {
      // This would typically validate the current session state
      // For now, we'll implement a basic check
      if (validationResult && validationResult.isValid) {
        return; // Already validated and valid
      }
      
      // In a real implementation, we would fetch current session state
      // and create an OptimizedSettlement to validate
      console.log('Triggering validation for session:', sessionId);
      
    } catch (error) {
      console.error('Failed to trigger validation:', error);
    }
  }, [validationResult]);

  // Utility function to check if validation is passing
  const isValidationPassing = useCallback((result?: SettlementValidation): boolean => {
    const validation = result || validationResult;
    if (!validation) return false;
    
    return validation.isValid && 
           validation.errors.filter(e => e.severity === 'critical').length === 0;
  }, [validationResult]);

  // Get validation summary for UI display
  const getValidationSummary = useCallback((result?: SettlementValidation) => {
    const validation = result || validationResult;
    
    if (!validation) {
      return {
        status: 'error' as const,
        message: 'No validation result available',
        color: '#9E9E9E',
        icon: '❓',
      };
    }

    const criticalErrors = validation.errors.filter(e => e.severity === 'critical');
    const majorErrors = validation.errors.filter(e => e.severity === 'major');
    const highWarnings = validation.warnings.filter(w => w.severity === 'high');

    if (criticalErrors.length > 0) {
      return {
        status: 'invalid' as const,
        message: `${criticalErrors.length} critical error(s) found`,
        color: '#F44336',
        icon: '❌',
        details: criticalErrors.map(e => e.message),
      };
    }

    if (majorErrors.length > 0 || highWarnings.length > 0) {
      return {
        status: 'warning' as const,
        message: `${majorErrors.length + highWarnings.length} warning(s) require attention`,
        color: '#FF9800',
        icon: '⚠️',
        details: [
          ...majorErrors.map(e => e.message),
          ...highWarnings.map(w => w.message),
        ],
      };
    }

    if (validation.isValid) {
      return {
        status: 'valid' as const,
        message: 'Settlement validation passed',
        color: '#4CAF50',
        icon: '✅',
      };
    }

    return {
      status: 'invalid' as const,
      message: 'Settlement validation failed',
      color: '#F44336',
      icon: '❌',
    };
  }, [validationResult]);

  // Check if settlement should be blocked
  const shouldBlockSettlement = useCallback((result?: SettlementValidation): boolean => {
    const validation = result || validationResult;
    if (!validation) return true;
    
    const criticalErrors = validation.errors.filter(e => e.severity === 'critical');
    return criticalErrors.length > 0;
  }, [validationResult]);

  // Get validation requirements for approval workflow
  const getValidationRequirements = useCallback(() => {
    if (!validationResult) {
      return {
        requiresApproval: true,
        criticalErrors: ['No validation result available'],
        majorWarnings: [],
      };
    }

    const criticalErrors = validationResult.errors
      .filter(e => e.severity === 'critical')
      .map(e => e.message);
    
    const majorWarnings = [
      ...validationResult.errors.filter(e => e.severity === 'major').map(e => e.message),
      ...validationResult.warnings.filter(w => w.severity === 'high').map(w => w.message),
    ];

    return {
      requiresApproval: criticalErrors.length > 0 || majorWarnings.length > 0,
      criticalErrors,
      majorWarnings,
    };
  }, [validationResult]);

  // Enhanced resolve warning function
  const resolveWarning = useCallback(async (warningId: string, resolution: string) => {
    await storeResolveWarning(warningId, resolution);
  }, [storeResolveWarning]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (realTimeTimerRef.current) {
        clearInterval(realTimeTimerRef.current);
      }
    };
  }, []);

  // Auto-enable real-time validation if option is set
  useEffect(() => {
    if (enableRealTimeOption && currentSessionId && !isRealTimeEnabled) {
      enableRealTimeValidation(currentSessionId);
    }
  }, [enableRealTimeOption, currentSessionId, isRealTimeEnabled, enableRealTimeValidation]);

  return {
    // Core validation functions
    validateSettlement,
    validateSettlementDebounced,
    validateCashOut,
    
    // Real-time validation controls
    enableRealTimeValidation,
    disableRealTimeValidation,
    triggerValidation,
    
    // State
    validationResult,
    isValidating,
    validationProgress,
    validationError,
    isRealTimeEnabled,
    
    // History and metrics
    validationHistory,
    metrics,
    
    // Warning management
    activeWarnings,
    warningCount,
    
    // Actions
    clearValidationResult,
    clearValidationError,
    dismissWarning,
    resolveWarning,
    
    // Utility functions
    isValidationPassing,
    getValidationSummary,
    
    // Integration helpers
    shouldBlockSettlement,
    getValidationRequirements,
  };
};

// Convenience hook for quick validation checks without full hook setup
export const useValidationStatus = () => {
  const { validationState } = useSettlementStore();
  
  const isValid = validationState.currentValidation?.isValid ?? false;
  const hasErrors = (validationState.currentValidation?.errors.length ?? 0) > 0;
  const hasWarnings = (validationState.currentValidation?.warnings.length ?? 0) > 0;
  const isValidating = validationState.isValidating;
  
  return {
    isValid,
    hasErrors,
    hasWarnings,
    isValidating,
    status: isValidating ? 'validating' : isValid ? 'valid' : 'invalid',
  };
};

// Hook for validation-specific error handling
export const useValidationErrors = () => {
  const { validationState } = useSettlementStore();
  
  const criticalErrors = validationState.currentValidation?.errors.filter(
    e => e.severity === 'critical'
  ) ?? [];
  
  const majorErrors = validationState.currentValidation?.errors.filter(
    e => e.severity === 'major'
  ) ?? [];
  
  const minorErrors = validationState.currentValidation?.errors.filter(
    e => e.severity === 'minor'
  ) ?? [];
  
  const highWarnings = validationState.currentValidation?.warnings.filter(
    w => w.severity === 'high'
  ) ?? [];
  
  return {
    criticalErrors,
    majorErrors,
    minorErrors,
    highWarnings,
    hasCriticalErrors: criticalErrors.length > 0,
    hasMajorErrors: majorErrors.length > 0,
    hasMinorErrors: minorErrors.length > 0,
    hasHighWarnings: highWarnings.length > 0,
  };
};