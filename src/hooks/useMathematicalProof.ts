/**
 * Mathematical Proof Hook - Epic 3: Settlement Optimization
 * Story 3.3: Settlement Validation and Verification
 * Task 8: Create Settlement Validation Hooks and Integration
 * 
 * Custom React hook for mathematical proof generation with export capabilities,
 * integrity verification, and comprehensive proof management
 */

import { useCallback, useRef, useEffect, useState } from 'react';
import { useSettlementStore } from '../stores/settlementStore';
import { 
  OptimizedSettlement, 
  MathematicalProof,
  ProofIntegrityResult,
  ExportResult,
  ExportMetadata,
  ExportFormat,
  ExportOptions,
  ProofStep,
  PrecisionReport,
  AlgorithmVerification
} from '../types/settlement';
import { ServiceError } from '../services/core/ServiceError';

interface UseMathematicalProofOptions {
  // Proof generation options
  autoGenerateProof?: boolean; // Default: false
  includeAlgorithmVerification?: boolean; // Default: true
  includePrecisionAnalysis?: boolean; // Default: true
  
  // Export options
  defaultExportFormat?: ExportFormat; // Default: 'json'
  enableAutomaticExport?: boolean; // Default: false
  exportDirectory?: string; // Default: system default
  
  // Performance options
  enableProofCaching?: boolean; // Default: true
  maxProofHistorySize?: number; // Default: 50
  proofGenerationTimeout?: number; // Default: 10000ms (10 seconds)
  
  // Callbacks
  onProofGenerationStart?: () => void;
  onProofGenerationComplete?: (proof: MathematicalProof) => void;
  onProofGenerationError?: (error: ServiceError) => void;
  onProofExported?: (result: ExportResult) => void;
  onIntegrityVerificationComplete?: (result: ProofIntegrityResult) => void;
}

interface ProofMetrics {
  totalProofs: number;
  averageProofTime: number;
  successfulExports: number;
  verificationSuccessRate: number;
  lastProofGeneration?: Date;
}

interface ProofAnalysis {
  stepCount: number;
  verificationSteps: number;
  algorithmConsensus: boolean;
  precisionIssues: number;
  integrityScore: number; // 0-100
  complexityLevel: 'low' | 'medium' | 'high';
}

interface UseMathematicalProofReturn {
  // Core proof functions
  generateProof: (settlement: OptimizedSettlement) => Promise<MathematicalProof>;
  generateProofAsync: (settlement: OptimizedSettlement) => Promise<MathematicalProof>;
  verifyProofIntegrity: (proof: MathematicalProof) => Promise<ProofIntegrityResult>;
  
  // Export functions
  exportProof: (proofId: string, format: ExportFormat, options?: ExportOptions) => Promise<ExportResult>;
  exportCurrentProof: (format: ExportFormat, options?: ExportOptions) => Promise<ExportResult>;
  shareProof: (proofId: string, format?: ExportFormat) => Promise<void>;
  
  // State
  currentProof: MathematicalProof | null;
  isGeneratingProof: boolean;
  proofProgress: number; // 0-100
  proofError: ServiceError | null;
  
  // History and performance
  proofHistory: MathematicalProof[];
  exportHistory: ExportMetadata[];
  metrics: ProofMetrics;
  
  // Analysis helpers
  analyzeProof: (proof?: MathematicalProof) => ProofAnalysis;
  getProofSummary: (proof?: MathematicalProof) => {
    status: 'valid' | 'invalid' | 'warning';
    message: string;
    details: string[];
    score: number;
  };
  
  // Actions
  clearCurrentProof: () => void;
  clearProofError: () => void;
  clearProofHistory: () => void;
  deleteProof: (proofId: string) => void;
  
  // Utility functions
  formatProofForDisplay: (proof: MathematicalProof) => {
    title: string;
    summary: string;
    stepCount: number;
    isValid: boolean;
    verificationStatus: string;
  };
  
  getProofStepDetails: (proof: MathematicalProof, stepNumber: number) => ProofStep | null;
  getAlgorithmVerifications: (proof: MathematicalProof) => AlgorithmVerification[];
  getPrecisionAnalysis: (proof: MathematicalProof) => PrecisionReport;
  
  // Export management
  getAvailableExportFormats: () => ExportFormat[];
  getExportHistory: (proofId?: string) => ExportMetadata[];
  deleteExport: (exportId: string) => Promise<void>;
}

export const useMathematicalProof = (
  options: UseMathematicalProofOptions = {}
): UseMathematicalProofReturn => {
  const {
    autoGenerateProof = false,
    includeAlgorithmVerification = true,
    includePrecisionAnalysis = true,
    defaultExportFormat = 'json',
    enableAutomaticExport = false,
    exportDirectory,
    enableProofCaching = true,
    maxProofHistorySize = 50,
    proofGenerationTimeout = 10000,
    onProofGenerationStart,
    onProofGenerationComplete,
    onProofGenerationError,
    onProofExported,
    onIntegrityVerificationComplete,
  } = options;

  // Zustand store integration
  const {
    proofState: {
      currentProof,
      proofHistory,
      isGeneratingProof,
      proofProgress,
      proofError,
      exportHistory,
    },
    generateMathematicalProof: storeGenerateProof,
    exportMathematicalProof: storeExportProof,
    verifyProofIntegrity: storeVerifyIntegrity,
    clearProofResult,
    clearProofError,
    setProofProgress,
    getProofMetrics,
  } = useSettlementStore();

  // Local state for async operations
  const [isExporting, setIsExporting] = useState(false);
  const proofTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get proof metrics
  const metrics: ProofMetrics = {
    ...getProofMetrics(),
    lastProofGeneration: currentProof?.generatedAt,
  };

  // Core proof generation function
  const generateProof = useCallback(async (settlement: OptimizedSettlement): Promise<MathematicalProof> => {
    try {
      onProofGenerationStart?.();
      
      // Set timeout for proof generation
      const timeoutPromise = new Promise<never>((_, reject) => {
        proofTimeoutRef.current = setTimeout(() => {
          reject(new ServiceError('PROOF_GENERATION_TIMEOUT', 'Proof generation timed out'));
        }, proofGenerationTimeout);
      });
      
      // Generate proof with timeout
      const proofPromise = storeGenerateProof(settlement);
      const result = await Promise.race([proofPromise, timeoutPromise]);
      
      // Clear timeout
      if (proofTimeoutRef.current) {
        clearTimeout(proofTimeoutRef.current);
        proofTimeoutRef.current = null;
      }
      
      // Automatic export if enabled
      if (enableAutomaticExport && result.proofId) {
        try {
          await exportProof(result.proofId, defaultExportFormat);
        } catch (exportError) {
          console.warn('Automatic export failed:', exportError);
        }
      }
      
      onProofGenerationComplete?.(result);
      return result;
      
    } catch (error) {
      // Clear timeout on error
      if (proofTimeoutRef.current) {
        clearTimeout(proofTimeoutRef.current);
        proofTimeoutRef.current = null;
      }
      
      const serviceError = error instanceof ServiceError 
        ? error 
        : new ServiceError('PROOF_GENERATION_FAILED', 'Mathematical proof generation failed');
      
      onProofGenerationError?.(serviceError);
      throw serviceError;
    }
  }, [
    storeGenerateProof, 
    proofGenerationTimeout, 
    enableAutomaticExport, 
    defaultExportFormat,
    onProofGenerationStart, 
    onProofGenerationComplete, 
    onProofGenerationError
  ]);

  // Async proof generation with progress tracking
  const generateProofAsync = useCallback(async (settlement: OptimizedSettlement): Promise<MathematicalProof> => {
    setProofProgress(0);
    
    const progressInterval = setInterval(() => {
      setProofProgress(prev => Math.min(prev + 10, 90));
    }, 500);
    
    try {
      const result = await generateProof(settlement);
      setProofProgress(100);
      return result;
    } finally {
      clearInterval(progressInterval);
    }
  }, [generateProof, setProofProgress]);

  // Proof integrity verification
  const verifyProofIntegrity = useCallback(async (proof: MathematicalProof): Promise<ProofIntegrityResult> => {
    try {
      const result = await storeVerifyIntegrity(proof);
      onIntegrityVerificationComplete?.(result);
      return result;
    } catch (error) {
      throw new ServiceError('PROOF_VERIFICATION_FAILED', 'Proof integrity verification failed');
    }
  }, [storeVerifyIntegrity, onIntegrityVerificationComplete]);

  // Export proof functionality
  const exportProof = useCallback(async (
    proofId: string, 
    format: ExportFormat, 
    options?: ExportOptions
  ): Promise<ExportResult> => {
    setIsExporting(true);
    
    try {
      const result = await storeExportProof(proofId, format);
      onProofExported?.(result);
      return result;
    } catch (error) {
      throw new ServiceError('PROOF_EXPORT_FAILED', 'Proof export failed');
    } finally {
      setIsExporting(false);
    }
  }, [storeExportProof, onProofExported]);

  // Export current proof
  const exportCurrentProof = useCallback(async (
    format: ExportFormat, 
    options?: ExportOptions
  ): Promise<ExportResult> => {
    if (!currentProof) {
      throw new ServiceError('NO_PROOF_AVAILABLE', 'No proof available for export');
    }
    
    return exportProof(currentProof.proofId, format, options);
  }, [currentProof, exportProof]);

  // Share proof using native sharing
  const shareProof = useCallback(async (proofId: string, format: ExportFormat = 'text') => {
    try {
      const exportResult = await exportProof(proofId, format);
      
      if (exportResult.filePath) {
        // In a real implementation, would use React Native Share
        console.log('Sharing proof:', exportResult.filePath);
        // Share.open({ url: exportResult.filePath });
      }
    } catch (error) {
      throw new ServiceError('PROOF_SHARING_FAILED', 'Failed to share proof');
    }
  }, [exportProof]);

  // Analyze proof for insights
  const analyzeProof = useCallback((proof?: MathematicalProof): ProofAnalysis => {
    const proofToAnalyze = proof || currentProof;
    
    if (!proofToAnalyze) {
      return {
        stepCount: 0,
        verificationSteps: 0,
        algorithmConsensus: false,
        precisionIssues: 0,
        integrityScore: 0,
        complexityLevel: 'low',
      };
    }

    const stepCount = proofToAnalyze.calculationSteps.length;
    const verificationSteps = proofToAnalyze.calculationSteps.filter(s => s.verification).length;
    const algorithmConsensus = proofToAnalyze.alternativeAlgorithmResults.every(r => r.verificationResult);
    const precisionIssues = proofToAnalyze.precisionAnalysis.fractionalCentIssues.length;
    
    // Calculate integrity score (0-100)
    let integrityScore = 100;
    if (!proofToAnalyze.isValid) integrityScore -= 30;
    if (!algorithmConsensus) integrityScore -= 20;
    if (precisionIssues > 0) integrityScore -= Math.min(precisionIssues * 10, 30);
    if (!proofToAnalyze.balanceVerification.isBalanced) integrityScore -= 20;
    
    // Determine complexity level
    let complexityLevel: 'low' | 'medium' | 'high' = 'low';
    if (stepCount > 20 || precisionIssues > 3) complexityLevel = 'high';
    else if (stepCount > 10 || precisionIssues > 1) complexityLevel = 'medium';

    return {
      stepCount,
      verificationSteps,
      algorithmConsensus,
      precisionIssues,
      integrityScore: Math.max(0, integrityScore),
      complexityLevel,
    };
  }, [currentProof]);

  // Get proof summary for display
  const getProofSummary = useCallback((proof?: MathematicalProof) => {
    const proofToSummarize = proof || currentProof;
    
    if (!proofToSummarize) {
      return {
        status: 'invalid' as const,
        message: 'No proof available',
        details: [],
        score: 0,
      };
    }

    const analysis = analyzeProof(proofToSummarize);
    const details: string[] = [];
    
    if (proofToSummarize.isValid) {
      details.push('Mathematical verification passed');
    } else {
      details.push('Mathematical verification failed');
    }
    
    if (analysis.algorithmConsensus) {
      details.push('Algorithm consensus achieved');
    } else {
      details.push('Algorithm discrepancies detected');
    }
    
    if (analysis.precisionIssues === 0) {
      details.push('No precision issues found');
    } else {
      details.push(`${analysis.precisionIssues} precision issue(s) detected`);
    }

    let status: 'valid' | 'invalid' | 'warning' = 'valid';
    let message = 'Proof verification passed';
    
    if (!proofToSummarize.isValid || analysis.integrityScore < 70) {
      status = 'invalid';
      message = 'Proof verification failed';
    } else if (analysis.integrityScore < 90 || analysis.precisionIssues > 0) {
      status = 'warning';
      message = 'Proof has warnings';
    }

    return {
      status,
      message,
      details,
      score: analysis.integrityScore,
    };
  }, [currentProof, analyzeProof]);

  // Format proof for display
  const formatProofForDisplay = useCallback((proof: MathematicalProof) => {
    const analysis = analyzeProof(proof);
    
    return {
      title: `Mathematical Proof ${proof.proofId.slice(-8)}`,
      summary: `${analysis.stepCount} steps, ${analysis.verificationSteps} verified`,
      stepCount: analysis.stepCount,
      isValid: proof.isValid,
      verificationStatus: analysis.algorithmConsensus ? 'Consensus achieved' : 'Discrepancies found',
    };
  }, [analyzeProof]);

  // Get specific proof step details
  const getProofStepDetails = useCallback((proof: MathematicalProof, stepNumber: number): ProofStep | null => {
    return proof.calculationSteps.find(step => step.stepNumber === stepNumber) || null;
  }, []);

  // Get algorithm verifications
  const getAlgorithmVerifications = useCallback((proof: MathematicalProof): AlgorithmVerification[] => {
    return proof.alternativeAlgorithmResults;
  }, []);

  // Get precision analysis
  const getPrecisionAnalysis = useCallback((proof: MathematicalProof): PrecisionReport => {
    return proof.precisionAnalysis;
  }, []);

  // Clear proof history with size limit
  const clearProofHistory = useCallback(() => {
    // This would typically clear only older proofs, keeping recent ones
    console.log('Clearing proof history - would keep last', maxProofHistorySize, 'proofs');
  }, [maxProofHistorySize]);

  // Delete specific proof
  const deleteProof = useCallback((proofId: string) => {
    // Implementation would remove proof from history
    console.log('Deleting proof:', proofId);
  }, []);

  // Get available export formats
  const getAvailableExportFormats = useCallback((): ExportFormat[] => {
    return ['json', 'pdf', 'text', 'csv'];
  }, []);

  // Get export history
  const getExportHistory = useCallback((proofId?: string): ExportMetadata[] => {
    if (proofId) {
      return exportHistory.filter(exp => exp.proofId === proofId);
    }
    return exportHistory;
  }, [exportHistory]);

  // Delete export
  const deleteExport = useCallback(async (exportId: string) => {
    // Implementation would remove export file and metadata
    console.log('Deleting export:', exportId);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (proofTimeoutRef.current) {
        clearTimeout(proofTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Core proof functions
    generateProof,
    generateProofAsync,
    verifyProofIntegrity,
    
    // Export functions
    exportProof,
    exportCurrentProof,
    shareProof,
    
    // State
    currentProof,
    isGeneratingProof: isGeneratingProof || isExporting,
    proofProgress,
    proofError,
    
    // History and performance
    proofHistory,
    exportHistory,
    metrics,
    
    // Analysis helpers
    analyzeProof,
    getProofSummary,
    
    // Actions
    clearCurrentProof: clearProofResult,
    clearProofError,
    clearProofHistory,
    deleteProof,
    
    // Utility functions
    formatProofForDisplay,
    getProofStepDetails,
    getAlgorithmVerifications,
    getPrecisionAnalysis,
    
    // Export management
    getAvailableExportFormats,
    getExportHistory,
    deleteExport,
  };
};

// Convenience hook for proof verification status
export const useProofVerification = () => {
  const { proofState } = useSettlementStore();
  
  const hasProof = !!proofState.currentProof;
  const isValid = proofState.currentProof?.isValid ?? false;
  const isGenerating = proofState.isGeneratingProof;
  const hasError = !!proofState.proofError;
  
  return {
    hasProof,
    isValid,
    isGenerating,
    hasError,
    status: isGenerating ? 'generating' : hasProof ? (isValid ? 'valid' : 'invalid') : 'none',
  };
};

// Hook for proof export management
export const useProofExports = () => {
  const { proofState } = useSettlementStore();
  
  const exportCount = proofState.exportHistory.length;
  const recentExports = proofState.exportHistory.slice(-5); // Last 5 exports
  const exportsByFormat = proofState.exportHistory.reduce((acc, exp) => {
    acc[exp.format] = (acc[exp.format] || 0) + 1;
    return acc;
  }, {} as Record<ExportFormat, number>);
  
  return {
    exportCount,
    recentExports,
    exportsByFormat,
    hasExports: exportCount > 0,
  };
};