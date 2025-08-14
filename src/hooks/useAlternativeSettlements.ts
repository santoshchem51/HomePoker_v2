/**
 * Alternative Settlements Hook - Epic 3: Settlement Optimization
 * Story 3.3: Settlement Validation and Verification
 * Task 8: Create Settlement Validation Hooks and Integration
 * 
 * Custom React hook for alternative settlement option management with comparison,
 * selection, recommendation engine, and comprehensive settlement analysis
 */

import { useCallback, useRef, useEffect, useState } from 'react';
import { useSettlementStore } from '../stores/settlementStore';
import { 
  AlternativeSettlement,
  SettlementComparison,
  SettlementAlgorithmType,
  SettlementGenerationOptions,
  SettlementRecommendation,
  SettlementValidation
} from '../types/settlement';
import { ServiceError } from '../services/core/ServiceError';

interface UseAlternativeSettlementsOptions {
  // Generation options
  autoGenerateAlternatives?: boolean; // Default: false
  enabledAlgorithms?: SettlementAlgorithmType[]; // Default: all algorithms
  includeManualOption?: boolean; // Default: true
  maxAlternatives?: number; // Default: 6
  
  // Scoring preferences
  priorityWeights?: {
    simplicity: number;
    fairness: number;
    efficiency: number;
    userFriendliness: number;
  };
  
  // Recommendation options
  enableSmartRecommendations?: boolean; // Default: true
  recommendationThreshold?: number; // Default: 0.7 (confidence threshold)
  
  // Performance options
  generationTimeout?: number; // Default: 15000ms (15 seconds)
  enableCaching?: boolean; // Default: true
  cacheTimeout?: number; // Default: 300000ms (5 minutes)
  
  // Callbacks
  onGenerationStart?: () => void;
  onGenerationComplete?: (comparison: SettlementComparison) => void;
  onGenerationError?: (error: ServiceError) => void;
  onAlternativeSelected?: (alternative: AlternativeSettlement) => void;
  onRecommendationGenerated?: (recommendation: SettlementRecommendation) => void;
}

interface AlternativeMetrics {
  totalComparisons: number;
  averageGenerationTime: number;
  mostSelectedAlgorithm: string;
  averageAlternativeCount: number;
  lastGeneration?: Date;
}

interface AlternativeAnalysis {
  bestOption: AlternativeSettlement | null;
  worstOption: AlternativeSettlement | null;
  averageScore: number;
  scoreRange: { min: number; max: number };
  transactionCountRange: { min: number; max: number };
  optimizationRange: { min: number; max: number };
  algorithmDistribution: Record<SettlementAlgorithmType, number>;
}

interface UseAlternativeSettlementsReturn {
  // Core generation functions
  generateAlternatives: (sessionId: string, options?: Partial<SettlementGenerationOptions>) => Promise<SettlementComparison>;
  regenerateAlternatives: (sessionId: string) => Promise<SettlementComparison>;
  generateSingleAlternative: (sessionId: string, algorithm: SettlementAlgorithmType) => Promise<AlternativeSettlement>;
  
  // Comparison and analysis
  compareAlternatives: (alternativeIds: string[]) => SettlementComparison | null;
  analyzeAlternatives: (comparison?: SettlementComparison) => AlternativeAnalysis;
  rankAlternatives: (comparison?: SettlementComparison) => AlternativeSettlement[];
  
  // Selection and recommendation
  selectAlternative: (alternativeId: string) => void;
  getRecommendation: (comparison?: SettlementComparison) => SettlementRecommendation | null;
  acceptRecommendation: () => void;
  
  // State
  currentComparison: SettlementComparison | null;
  selectedAlternative: AlternativeSettlement | null;
  isGenerating: boolean;
  generationProgress: number; // 0-100
  generationError: ServiceError | null;
  
  // History and performance
  comparisonHistory: SettlementComparison[];
  metrics: AlternativeMetrics;
  
  // Filtering and sorting
  filterAlternatives: (criteria: {
    minScore?: number;
    maxTransactions?: number;
    algorithms?: SettlementAlgorithmType[];
    validOnly?: boolean;
  }) => AlternativeSettlement[];
  
  sortAlternatives: (criteria: 'score' | 'transactions' | 'efficiency' | 'simplicity') => AlternativeSettlement[];
  
  // Actions
  clearAlternatives: () => void;
  clearGenerationError: () => void;
  clearSelection: () => void;
  
  // Utility functions
  formatAlternativeForDisplay: (alternative: AlternativeSettlement) => {
    title: string;
    subtitle: string;
    scoreDisplay: string;
    transactionSummary: string;
    algorithmLabel: string;
    statusColor: string;
  };
  
  getAlternativeDetails: (alternative: AlternativeSettlement) => {
    pros: string[];
    cons: string[];
    paymentSummary: string;
    complexityLevel: string;
    riskLevel: string;
  };
  
  // Validation integration
  validateAlternative: (alternative: AlternativeSettlement) => Promise<SettlementValidation>;
  getValidationStatus: (alternative: AlternativeSettlement) => {
    isValid: boolean;
    hasWarnings: boolean;
    validationSummary: string;
  };
}

export const useAlternativeSettlements = (
  options: UseAlternativeSettlementsOptions = {}
): UseAlternativeSettlementsReturn => {
  const {
    autoGenerateAlternatives = false,
    enabledAlgorithms = [
      SettlementAlgorithmType.GREEDY_DEBT_REDUCTION,
      SettlementAlgorithmType.DIRECT_SETTLEMENT,
      SettlementAlgorithmType.HUB_BASED,
      SettlementAlgorithmType.BALANCED_FLOW,
      SettlementAlgorithmType.MINIMAL_TRANSACTIONS,
      SettlementAlgorithmType.MANUAL_SETTLEMENT,
    ],
    includeManualOption = true,
    maxAlternatives = 6,
    priorityWeights = {
      simplicity: 0.3,
      fairness: 0.25,
      efficiency: 0.3,
      userFriendliness: 0.15,
    },
    enableSmartRecommendations = true,
    recommendationThreshold = 0.7,
    generationTimeout = 15000,
    enableCaching = true,
    cacheTimeout = 300000,
    onGenerationStart,
    onGenerationComplete,
    onGenerationError,
    onAlternativeSelected,
    onRecommendationGenerated,
  } = options;

  // Zustand store integration
  const {
    alternativeState: {
      currentComparison,
      comparisonHistory,
      selectedAlternative,
      isGeneratingAlternatives: isGenerating,
      alternativeProgress: generationProgress,
      alternativeError: generationError,
      generationOptions,
    },
    generateAlternativeSettlements: storeGenerateAlternatives,
    selectAlternativeSettlement,
    compareAlternativeSettlements,
    clearAlternativeResults,
    clearAlternativeError,
    setAlternativeProgress,
    getAlternativeMetrics,
    validateSettlement,
  } = useSettlementStore();

  // Local state for caching and control
  const [lastGenerationTime, setLastGenerationTime] = useState<Date | null>(null);
  const [recommendationCache, setRecommendationCache] = useState<Map<string, SettlementRecommendation>>(new Map());
  const generationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get alternative metrics
  const metrics: AlternativeMetrics = {
    ...getAlternativeMetrics(),
    lastGeneration: lastGenerationTime,
  };

  // Core generation function
  const generateAlternatives = useCallback(async (
    sessionId: string, 
    customOptions?: Partial<SettlementGenerationOptions>
  ): Promise<SettlementComparison> => {
    try {
      onGenerationStart?.();
      
      // Check cache if enabled
      if (enableCaching && lastGenerationTime) {
        const timeSinceLastGeneration = Date.now() - lastGenerationTime.getTime();
        if (timeSinceLastGeneration < cacheTimeout && currentComparison) {
          console.log('Using cached alternatives');
          return currentComparison;
        }
      }
      
      // Set timeout for generation
      const timeoutPromise = new Promise<never>((_, reject) => {
        generationTimeoutRef.current = setTimeout(() => {
          reject(new ServiceError('ALTERNATIVE_GENERATION_TIMEOUT', 'Alternative generation timed out'));
        }, generationTimeout);
      });
      
      // Prepare generation options
      const generationOptionsToUse: Partial<SettlementGenerationOptions> = {
        enabledAlgorithms,
        includeManualOption,
        maxAlternatives,
        priorityWeights,
        timeoutMs: generationTimeout,
        requireMathematicalProof: false,
        minimumOptimizationThreshold: 10,
        ...customOptions,
      };
      
      // Generate alternatives with timeout
      const generationPromise = storeGenerateAlternatives(sessionId, generationOptionsToUse);
      const result = await Promise.race([generationPromise, timeoutPromise]);
      
      // Clear timeout
      if (generationTimeoutRef.current) {
        clearTimeout(generationTimeoutRef.current);
        generationTimeoutRef.current = null;
      }
      
      setLastGenerationTime(new Date());
      
      // Generate recommendation if enabled
      if (enableSmartRecommendations) {
        const recommendation = getRecommendation(result);
        if (recommendation) {
          onRecommendationGenerated?.(recommendation);
        }
      }
      
      onGenerationComplete?.(result);
      return result;
      
    } catch (error) {
      // Clear timeout on error
      if (generationTimeoutRef.current) {
        clearTimeout(generationTimeoutRef.current);
        generationTimeoutRef.current = null;
      }
      
      const serviceError = error instanceof ServiceError 
        ? error 
        : new ServiceError('ALTERNATIVE_GENERATION_FAILED', 'Alternative settlement generation failed');
      
      onGenerationError?.(serviceError);
      throw serviceError;
    }
  }, [
    storeGenerateAlternatives,
    enabledAlgorithms,
    includeManualOption,
    maxAlternatives,
    priorityWeights,
    generationTimeout,
    enableCaching,
    cacheTimeout,
    lastGenerationTime,
    currentComparison,
    enableSmartRecommendations,
    onGenerationStart,
    onGenerationComplete,
    onGenerationError,
    onRecommendationGenerated
  ]);

  // Regenerate alternatives (bypass cache)
  const regenerateAlternatives = useCallback(async (sessionId: string): Promise<SettlementComparison> => {
    setLastGenerationTime(null); // Clear cache
    return generateAlternatives(sessionId);
  }, [generateAlternatives]);

  // Generate single alternative
  const generateSingleAlternative = useCallback(async (
    sessionId: string, 
    algorithm: SettlementAlgorithmType
  ): Promise<AlternativeSettlement> => {
    const comparison = await generateAlternatives(sessionId, {
      enabledAlgorithms: [algorithm],
      maxAlternatives: 1,
    });
    
    if (comparison.alternatives.length === 0) {
      throw new ServiceError('NO_ALTERNATIVE_GENERATED', `Failed to generate ${algorithm} alternative`);
    }
    
    return comparison.alternatives[0];
  }, [generateAlternatives]);

  // Compare specific alternatives
  const compareAlternatives = useCallback((alternativeIds: string[]): SettlementComparison | null => {
    return compareAlternativeSettlements(alternativeIds);
  }, [compareAlternativeSettlements]);

  // Analyze alternatives for insights
  const analyzeAlternatives = useCallback((comparison?: SettlementComparison): AlternativeAnalysis => {
    const comparisonToAnalyze = comparison || currentComparison;
    
    if (!comparisonToAnalyze || comparisonToAnalyze.alternatives.length === 0) {
      return {
        bestOption: null,
        worstOption: null,
        averageScore: 0,
        scoreRange: { min: 0, max: 0 },
        transactionCountRange: { min: 0, max: 0 },
        optimizationRange: { min: 0, max: 0 },
        algorithmDistribution: {} as Record<SettlementAlgorithmType, number>,
      };
    }

    const alternatives = comparisonToAnalyze.alternatives;
    const scores = alternatives.map(a => a.score);
    const transactionCounts = alternatives.map(a => a.transactionCount);
    const optimizationPercentages = alternatives.map(a => a.optimizationPercentage);
    
    const bestOption = alternatives.reduce((best, current) => 
      current.score > best.score ? current : best
    );
    
    const worstOption = alternatives.reduce((worst, current) => 
      current.score < worst.score ? current : worst
    );
    
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    const algorithmDistribution = alternatives.reduce((dist, alt) => {
      dist[alt.algorithmType] = (dist[alt.algorithmType] || 0) + 1;
      return dist;
    }, {} as Record<SettlementAlgorithmType, number>);

    return {
      bestOption,
      worstOption,
      averageScore,
      scoreRange: { min: Math.min(...scores), max: Math.max(...scores) },
      transactionCountRange: { min: Math.min(...transactionCounts), max: Math.max(...transactionCounts) },
      optimizationRange: { min: Math.min(...optimizationPercentages), max: Math.max(...optimizationPercentages) },
      algorithmDistribution,
    };
  }, [currentComparison, compareAlternativeSettlements]);

  // Rank alternatives by score
  const rankAlternatives = useCallback((comparison?: SettlementComparison): AlternativeSettlement[] => {
    const comparisonToRank = comparison || currentComparison;
    
    if (!comparisonToRank) return [];
    
    return [...comparisonToRank.alternatives].sort((a, b) => b.score - a.score);
  }, [currentComparison]);

  // Select alternative
  const selectAlternative = useCallback((alternativeId: string) => {
    selectAlternativeSettlement(alternativeId);
    
    const selected = currentComparison?.alternatives.find(alt => alt.optionId === alternativeId);
    if (selected) {
      onAlternativeSelected?.(selected);
    }
  }, [selectAlternativeSettlement, currentComparison, onAlternativeSelected]);

  // Get smart recommendation
  const getRecommendation = useCallback((comparison?: SettlementComparison): SettlementRecommendation | null => {
    const comparisonToRecommend = comparison || currentComparison;
    
    if (!comparisonToRecommend || comparisonToRecommend.alternatives.length === 0) {
      return null;
    }

    // Check cache first
    const cacheKey = comparisonToRecommend.comparisonId;
    if (recommendationCache.has(cacheKey)) {
      return recommendationCache.get(cacheKey)!;
    }

    const analysis = analyzeAlternatives(comparisonToRecommend);
    const rankedAlternatives = rankAlternatives(comparisonToRecommend);
    
    if (!analysis.bestOption) return null;

    // Calculate confidence based on score differential
    const scoreDifference = rankedAlternatives.length > 1 
      ? rankedAlternatives[0].score - rankedAlternatives[1].score
      : rankedAlternatives[0].score * 0.3;
    
    const confidence = Math.min(0.95, Math.max(0.6, scoreDifference / 10 + 0.6));
    
    // Generate reasoning
    const reasoning: string[] = [];
    if (analysis.bestOption.score >= 8) {
      reasoning.push('High overall score indicates excellent balance of factors');
    }
    if (analysis.bestOption.transactionCount <= 3) {
      reasoning.push('Low transaction count simplifies settlement process');
    }
    if (analysis.bestOption.optimizationPercentage >= 50) {
      reasoning.push('Significant optimization reduces complexity');
    }
    if (analysis.bestOption.fairness >= 8) {
      reasoning.push('Fair distribution of payment obligations');
    }

    // Generate alternative considerations
    const alternativeConsiderations: string[] = [];
    if (rankedAlternatives.length > 1) {
      const secondBest = rankedAlternatives[1];
      if (secondBest.transactionCount < analysis.bestOption.transactionCount) {
        alternativeConsiderations.push(`${secondBest.name} requires fewer transactions`);
      }
      if (secondBest.simplicity > analysis.bestOption.simplicity) {
        alternativeConsiderations.push(`${secondBest.name} may be easier to understand`);
      }
    }

    const recommendation: SettlementRecommendation = {
      recommendedOptionId: analysis.bestOption.optionId,
      confidence,
      reasoning,
      alternativeConsiderations,
      playerCount: comparisonToRecommend.alternatives[0]?.paymentPlan.length || 0,
      complexityLevel: analysis.bestOption.transactionCount <= 3 ? 'low' : 
                     analysis.bestOption.transactionCount <= 6 ? 'medium' : 'high',
      disputeRisk: analysis.bestOption.fairness >= 8 ? 'low' : 
                  analysis.bestOption.fairness >= 6 ? 'medium' : 'high',
      preferredAlgorithm: analysis.bestOption.algorithmType,
      prioritizeSimplicity: priorityWeights.simplicity > 0.4,
      prioritizeOptimization: priorityWeights.efficiency > 0.4,
    };

    // Cache recommendation
    setRecommendationCache(prev => new Map(prev.set(cacheKey, recommendation)));
    
    return recommendation;
  }, [currentComparison, analyzeAlternatives, rankAlternatives, priorityWeights, recommendationCache]);

  // Accept recommendation
  const acceptRecommendation = useCallback(() => {
    const recommendation = getRecommendation();
    if (recommendation) {
      selectAlternative(recommendation.recommendedOptionId);
    }
  }, [getRecommendation, selectAlternative]);

  // Filter alternatives
  const filterAlternatives = useCallback((criteria: {
    minScore?: number;
    maxTransactions?: number;
    algorithms?: SettlementAlgorithmType[];
    validOnly?: boolean;
  }) => {
    if (!currentComparison) return [];
    
    return currentComparison.alternatives.filter(alt => {
      if (criteria.minScore && alt.score < criteria.minScore) return false;
      if (criteria.maxTransactions && alt.transactionCount > criteria.maxTransactions) return false;
      if (criteria.algorithms && !criteria.algorithms.includes(alt.algorithmType)) return false;
      if (criteria.validOnly && !alt.isValid) return false;
      return true;
    });
  }, [currentComparison]);

  // Sort alternatives
  const sortAlternatives = useCallback((criteria: 'score' | 'transactions' | 'efficiency' | 'simplicity') => {
    if (!currentComparison) return [];
    
    const alternatives = [...currentComparison.alternatives];
    
    switch (criteria) {
      case 'score':
        return alternatives.sort((a, b) => b.score - a.score);
      case 'transactions':
        return alternatives.sort((a, b) => a.transactionCount - b.transactionCount);
      case 'efficiency':
        return alternatives.sort((a, b) => b.efficiency - a.efficiency);
      case 'simplicity':
        return alternatives.sort((a, b) => b.simplicity - a.simplicity);
      default:
        return alternatives;
    }
  }, [currentComparison]);

  // Format alternative for display
  const formatAlternativeForDisplay = useCallback((alternative: AlternativeSettlement) => {
    const algorithmLabels: Record<SettlementAlgorithmType, string> = {
      [SettlementAlgorithmType.GREEDY_DEBT_REDUCTION]: 'Optimized',
      [SettlementAlgorithmType.DIRECT_SETTLEMENT]: 'Direct',
      [SettlementAlgorithmType.HUB_BASED]: 'Hub-Based',
      [SettlementAlgorithmType.BALANCED_FLOW]: 'Balanced',
      [SettlementAlgorithmType.MINIMAL_TRANSACTIONS]: 'Minimal',
      [SettlementAlgorithmType.MANUAL_SETTLEMENT]: 'Manual',
    };

    return {
      title: alternative.name,
      subtitle: alternative.description,
      scoreDisplay: `${alternative.score.toFixed(1)}/10`,
      transactionSummary: `${alternative.transactionCount} transaction${alternative.transactionCount !== 1 ? 's' : ''}`,
      algorithmLabel: algorithmLabels[alternative.algorithmType] || 'Unknown',
      statusColor: alternative.isValid ? '#4CAF50' : '#F44336',
    };
  }, []);

  // Get alternative details
  const getAlternativeDetails = useCallback((alternative: AlternativeSettlement) => {
    const paymentTotal = alternative.paymentPlan.reduce((sum, payment) => sum + payment.amount, 0);
    
    return {
      pros: alternative.prosAndCons.pros,
      cons: alternative.prosAndCons.cons,
      paymentSummary: `$${paymentTotal.toFixed(2)} total settlement`,
      complexityLevel: alternative.transactionCount <= 3 ? 'Low' : 
                     alternative.transactionCount <= 6 ? 'Medium' : 'High',
      riskLevel: alternative.fairness >= 8 ? 'Low' : 
                alternative.fairness >= 6 ? 'Medium' : 'High',
    };
  }, []);

  // Validate alternative
  const validateAlternative = useCallback(async (alternative: AlternativeSettlement): Promise<SettlementValidation> => {
    return alternative.validationResults;
  }, []);

  // Get validation status
  const getValidationStatus = useCallback((alternative: AlternativeSettlement) => {
    const validation = alternative.validationResults;
    
    return {
      isValid: validation.isValid,
      hasWarnings: validation.warnings.length > 0,
      validationSummary: validation.isValid 
        ? 'Validation passed' 
        : `${validation.errors.length} error(s) found`,
    };
  }, []);

  // Clear selection
  const clearSelection = useCallback(() => {
    // Would implement clearing selected alternative
    console.log('Clearing alternative selection');
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (generationTimeoutRef.current) {
        clearTimeout(generationTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Core generation functions
    generateAlternatives,
    regenerateAlternatives,
    generateSingleAlternative,
    
    // Comparison and analysis
    compareAlternatives,
    analyzeAlternatives,
    rankAlternatives,
    
    // Selection and recommendation
    selectAlternative,
    getRecommendation,
    acceptRecommendation,
    
    // State
    currentComparison,
    selectedAlternative,
    isGenerating,
    generationProgress,
    generationError,
    
    // History and performance
    comparisonHistory,
    metrics,
    
    // Filtering and sorting
    filterAlternatives,
    sortAlternatives,
    
    // Actions
    clearAlternatives: clearAlternativeResults,
    clearGenerationError,
    clearSelection,
    
    // Utility functions
    formatAlternativeForDisplay,
    getAlternativeDetails,
    
    // Validation integration
    validateAlternative,
    getValidationStatus,
  };
};

// Convenience hook for alternative comparison
export const useAlternativeComparison = () => {
  const { alternativeState } = useSettlementStore();
  
  const hasComparison = !!alternativeState.currentComparison;
  const alternativeCount = alternativeState.currentComparison?.alternatives.length || 0;
  const hasSelection = !!alternativeState.selectedAlternative;
  const isGenerating = alternativeState.isGeneratingAlternatives;
  
  return {
    hasComparison,
    alternativeCount,
    hasSelection,
    isGenerating,
    status: isGenerating ? 'generating' : hasComparison ? 'ready' : 'none',
  };
};

// Hook for recommendation management
export const useSettlementRecommendation = () => {
  const { currentComparison } = useAlternativeSettlements();
  
  const [recommendation, setRecommendation] = useState<SettlementRecommendation | null>(null);
  
  useEffect(() => {
    if (currentComparison) {
      // Would generate recommendation based on current comparison
      setRecommendation(null); // Placeholder
    }
  }, [currentComparison]);
  
  return {
    recommendation,
    hasRecommendation: !!recommendation,
    confidence: recommendation?.confidence || 0,
    isHighConfidence: (recommendation?.confidence || 0) >= 0.8,
  };
};