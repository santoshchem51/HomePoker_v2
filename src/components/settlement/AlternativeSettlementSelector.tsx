/**
 * Alternative Settlement Selector Component - Epic 3: Settlement Optimization
 * Story 3.3: Settlement Validation and Verification - Task 5
 * 
 * React Native component for selecting between different settlement algorithm options
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  AccessibilityInfo,
  Modal,
} from 'react-native';
import { 
  AlternativeSettlement, 
  SettlementComparison,
  SettlementAlgorithmType
} from '../../types/settlement';

interface AlternativeSettlementSelectorProps {
  comparison: SettlementComparison | null;
  onSettlementSelect?: (settlement: AlternativeSettlement) => void;
  onCompareSettlements?: (settlementIds: string[]) => void;
  onViewSettlementDetails?: (settlement: AlternativeSettlement) => void;
  showRecommendation?: boolean;
  enableComparison?: boolean;
  maxSelections?: number;
  accessibilityLabel?: string;
}

export const AlternativeSettlementSelector: React.FC<AlternativeSettlementSelectorProps> = ({
  comparison,
  onSettlementSelect,
  onCompareSettlements,
  onViewSettlementDetails,
  showRecommendation = true,
  enableComparison = true,
  maxSelections = 3,
  accessibilityLabel = 'Alternative Settlement Selector',
}) => {
  const [selectedSettlements, setSelectedSettlements] = useState<Set<string>>(new Set());
  const [showComparisonMatrix, setShowComparisonMatrix] = useState(false);
  const [expandedSettlement, setExpandedSettlement] = useState<string | null>(null);
  const [sortMetric, setSortMetric] = useState<string>('Overall Score');

  // Format currency helper
  const formatCurrency = useCallback((amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }, []);

  // Format percentage helper
  const formatPercentage = useCallback((value: number): string => {
    return `${value.toFixed(1)}%`;
  }, []);

  // Format time helper
  const formatTime = useCallback((ms: number): string => {
    return `${ms}ms`;
  }, []);

  // Sort alternatives by selected metric
  const sortedAlternatives = useMemo(() => {
    if (!comparison?.alternatives) return [];

    return [...comparison.alternatives].sort((a, b) => {
      switch (sortMetric) {
        case 'Transaction Count':
          return a.transactionCount - b.transactionCount;
        case 'Optimization %':
          return b.optimizationPercentage - a.optimizationPercentage;
        case 'Simplicity':
          return b.simplicity - a.simplicity;
        case 'Fairness':
          return b.fairness - a.fairness;
        case 'Efficiency':
          return b.efficiency - a.efficiency;
        case 'User Friendliness':
          return b.userFriendliness - a.userFriendliness;
        case 'Overall Score':
        default:
          return b.score - a.score;
      }
    });
  }, [comparison?.alternatives, sortMetric]);

  // Get algorithm type display name
  const getAlgorithmDisplayName = useCallback((type: SettlementAlgorithmType): string => {
    switch (type) {
      case SettlementAlgorithmType.GREEDY_DEBT_REDUCTION:
        return 'Greedy Optimization';
      case SettlementAlgorithmType.DIRECT_SETTLEMENT:
        return 'Direct Settlement';
      case SettlementAlgorithmType.HUB_BASED:
        return 'Hub-Based';
      case SettlementAlgorithmType.BALANCED_FLOW:
        return 'Balanced Flow';
      case SettlementAlgorithmType.MINIMAL_TRANSACTIONS:
        return 'Minimal Transactions';
      case SettlementAlgorithmType.MANUAL_SETTLEMENT:
        return 'Manual Settlement';
      default:
        return 'Unknown Algorithm';
    }
  }, []);

  // Get score color
  const getScoreColor = useCallback((score: number): string => {
    if (score >= 8) return '#4CAF50';
    if (score >= 6) return '#FF9800';
    if (score >= 4) return '#F57C00';
    return '#F44336';
  }, []);

  // Handle settlement selection
  const handleSettlementSelect = useCallback((settlement: AlternativeSettlement) => {
    if (onSettlementSelect) {
      Alert.alert(
        'Select Settlement Option',
        `Use ${settlement.name} for final settlement?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Select', onPress: () => {
            onSettlementSelect(settlement);
            AccessibilityInfo.announceForAccessibility(`Selected settlement: ${settlement.name}`);
          }},
        ]
      );
    }
  }, [onSettlementSelect]);

  // Handle comparison toggle
  const handleComparisonToggle = useCallback((optionId: string) => {
    if (!enableComparison) return;

    setSelectedSettlements(prev => {
      const newSet = new Set(prev);
      if (newSet.has(optionId)) {
        newSet.delete(optionId);
      } else if (newSet.size < maxSelections) {
        newSet.add(optionId);
      } else {
        Alert.alert('Selection Limit', `You can only compare up to ${maxSelections} options at once.`);
        return prev;
      }
      return newSet;
    });
  }, [enableComparison, maxSelections]);

  // Handle view comparison
  const handleViewComparison = useCallback(() => {
    if (selectedSettlements.size < 2) {
      Alert.alert('Comparison Error', 'Select at least 2 options to compare.');
      return;
    }

    if (onCompareSettlements) {
      onCompareSettlements(Array.from(selectedSettlements));
    } else {
      setShowComparisonMatrix(true);
    }
  }, [selectedSettlements, onCompareSettlements]);

  // Handle settlement details
  const handleViewDetails = useCallback((settlement: AlternativeSettlement) => {
    if (onViewSettlementDetails) {
      onViewSettlementDetails(settlement);
    } else {
      setExpandedSettlement(expandedSettlement === settlement.optionId ? null : settlement.optionId);
    }
  }, [onViewSettlementDetails, expandedSettlement]);

  // Render recommendation banner
  const renderRecommendationBanner = useCallback(() => {
    if (!showRecommendation || !comparison?.recommendedOption) return null;

    const recommended = comparison.recommendedOption;

    return (
      <View style={styles.recommendationBanner}>
        <View style={styles.recommendationHeader}>
          <Text style={styles.recommendationIcon}>⭐</Text>
          <Text style={styles.recommendationTitle}>Recommended Option</Text>
        </View>
        <Text style={styles.recommendationName}>{recommended.name}</Text>
        <Text style={styles.recommendationDescription}>{recommended.description}</Text>
        <View style={styles.recommendationStats}>
          <Text style={styles.recommendationStat}>
            {recommended.transactionCount} transactions
          </Text>
          <Text style={styles.recommendationStat}>
            Score: {recommended.score.toFixed(1)}/10
          </Text>
          <Text style={styles.recommendationStat}>
            {formatPercentage(recommended.optimizationPercentage)} optimized
          </Text>
        </View>
        <TouchableOpacity
          style={styles.selectRecommendedButton}
          onPress={() => handleSettlementSelect(recommended)}
          accessibilityRole="button"
          accessibilityLabel="Select recommended settlement option"
        >
          <Text style={styles.selectRecommendedText}>Use Recommended</Text>
        </TouchableOpacity>
      </View>
    );
  }, [showRecommendation, comparison, handleSettlementSelect, formatPercentage]);

  // Render summary statistics
  const renderSummaryStats = useCallback(() => {
    if (!comparison?.summary) return null;

    const summary = comparison.summary;

    return (
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Settlement Options Summary</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{summary.totalOptionsGenerated}</Text>
            <Text style={styles.summaryLabel}>Options Generated</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {summary.transactionCountRange.min}-{summary.transactionCountRange.max}
            </Text>
            <Text style={styles.summaryLabel}>Transaction Range</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {formatPercentage(summary.optimizationRange.min)}-{formatPercentage(summary.optimizationRange.max)}
            </Text>
            <Text style={styles.summaryLabel}>Optimization Range</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{summary.averageScore.toFixed(1)}/10</Text>
            <Text style={styles.summaryLabel}>Average Score</Text>
          </View>
        </View>
      </View>
    );
  }, [comparison, formatPercentage]);

  // Render sort controls
  const renderSortControls = useCallback(() => {
    const sortOptions = [
      'Overall Score',
      'Transaction Count',
      'Optimization %',
      'Simplicity',
      'Fairness',
      'Efficiency',
      'User Friendliness',
    ];

    return (
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortScroll}>
          {sortOptions.map(option => (
            <TouchableOpacity
              key={option}
              style={[
                styles.sortButton,
                sortMetric === option && styles.sortButtonActive,
              ]}
              onPress={() => setSortMetric(option)}
              accessibilityRole="button"
              accessibilityLabel={`Sort by ${option}`}
            >
              <Text style={[
                styles.sortButtonText,
                sortMetric === option && styles.sortButtonTextActive,
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }, [sortMetric]);

  // Render comparison controls
  const renderComparisonControls = useCallback(() => {
    if (!enableComparison) return null;

    return (
      <View style={styles.comparisonControls}>
        <Text style={styles.comparisonLabel}>
          Selected: {selectedSettlements.size}/{maxSelections}
        </Text>
        <TouchableOpacity
          style={[
            styles.compareButton,
            selectedSettlements.size < 2 && styles.compareButtonDisabled,
          ]}
          onPress={handleViewComparison}
          disabled={selectedSettlements.size < 2}
          accessibilityRole="button"
          accessibilityLabel="Compare selected settlements"
        >
          <Text style={[
            styles.compareButtonText,
            selectedSettlements.size < 2 && styles.compareButtonTextDisabled,
          ]}>
            Compare ({selectedSettlements.size})
          </Text>
        </TouchableOpacity>
      </View>
    );
  }, [enableComparison, selectedSettlements, maxSelections, handleViewComparison]);

  // Render individual settlement option
  const renderSettlementOption = useCallback((settlement: AlternativeSettlement) => {
    const isSelected = selectedSettlements.has(settlement.optionId);
    const isExpanded = expandedSettlement === settlement.optionId;
    const isRecommended = comparison?.recommendedOption?.optionId === settlement.optionId;

    return (
      <View
        key={settlement.optionId}
        style={[
          styles.settlementContainer,
          isRecommended && styles.recommendedContainer,
        ]}
      >
        <TouchableOpacity
          style={styles.settlementHeader}
          onPress={() => handleViewDetails(settlement)}
          accessibilityRole="button"
          accessibilityLabel={`Settlement option: ${settlement.name}`}
          accessibilityHint="Tap for details"
        >
          <View style={styles.settlementInfo}>
            <View style={styles.settlementTitleRow}>
              <Text style={styles.settlementName}>{settlement.name}</Text>
              {isRecommended && (
                <Text style={styles.recommendedBadge}>RECOMMENDED</Text>
              )}
            </View>
            <Text style={styles.settlementAlgorithm}>
              {getAlgorithmDisplayName(settlement.algorithmType)}
            </Text>
            <Text style={styles.settlementDescription}>{settlement.description}</Text>
          </View>
          <View style={styles.settlementScore}>
            <Text style={[
              styles.scoreValue,
              { color: getScoreColor(settlement.score) },
            ]}>
              {settlement.score.toFixed(1)}
            </Text>
            <Text style={styles.scoreLabel}>Score</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.settlementStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{settlement.transactionCount}</Text>
            <Text style={styles.statLabel}>Transactions</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {formatPercentage(settlement.optimizationPercentage)}
            </Text>
            <Text style={styles.statLabel}>Optimized</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatTime(settlement.calculationTime)}</Text>
            <Text style={styles.statLabel}>Calc Time</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {formatCurrency(settlement.totalAmountSettled)}
            </Text>
            <Text style={styles.statLabel}>Total Amount</Text>
          </View>
        </View>

        <View style={styles.scoreBreakdown}>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreMetricLabel}>Simplicity</Text>
            <View style={styles.scoreBar}>
              <View style={[
                styles.scoreBarFill,
                { width: `${settlement.simplicity * 10}%` },
              ]} />
            </View>
            <Text style={styles.scoreMetricValue}>{settlement.simplicity.toFixed(1)}</Text>
          </View>
          
          <View style={styles.scoreItem}>
            <Text style={styles.scoreMetricLabel}>Fairness</Text>
            <View style={styles.scoreBar}>
              <View style={[
                styles.scoreBarFill,
                { width: `${settlement.fairness * 10}%` },
              ]} />
            </View>
            <Text style={styles.scoreMetricValue}>{settlement.fairness.toFixed(1)}</Text>
          </View>
          
          <View style={styles.scoreItem}>
            <Text style={styles.scoreMetricLabel}>Efficiency</Text>
            <View style={styles.scoreBar}>
              <View style={[
                styles.scoreBarFill,
                { width: `${settlement.efficiency * 10}%` },
              ]} />
            </View>
            <Text style={styles.scoreMetricValue}>{settlement.efficiency.toFixed(1)}</Text>
          </View>
          
          <View style={styles.scoreItem}>
            <Text style={styles.scoreMetricLabel}>User Friendly</Text>
            <View style={styles.scoreBar}>
              <View style={[
                styles.scoreBarFill,
                { width: `${settlement.userFriendliness * 10}%` },
              ]} />
            </View>
            <Text style={styles.scoreMetricValue}>{settlement.userFriendliness.toFixed(1)}</Text>
          </View>
        </View>

        {isExpanded && (
          <View style={styles.settlementDetails}>
            {/* Pros and Cons */}
            <View style={styles.prosConsContainer}>
              <View style={styles.prosContainer}>
                <Text style={styles.prosTitle}>✓ Pros</Text>
                {settlement.prosAndCons.pros.map((pro, index) => (
                  <Text key={index} style={styles.proText}>• {pro}</Text>
                ))}
              </View>
              <View style={styles.consContainer}>
                <Text style={styles.consTitle}>✗ Cons</Text>
                {settlement.prosAndCons.cons.map((con, index) => (
                  <Text key={index} style={styles.conText}>• {con}</Text>
                ))}
              </View>
            </View>

            {/* Payment Plan Preview */}
            <View style={styles.paymentPreview}>
              <Text style={styles.paymentPreviewTitle}>Payment Plan Preview</Text>
              {settlement.paymentPlan.slice(0, 3).map((payment, index) => (
                <View key={index} style={styles.paymentItem}>
                  <Text style={styles.paymentText}>
                    {payment.fromPlayerName} → {payment.toPlayerName}
                  </Text>
                  <Text style={styles.paymentAmount}>
                    {formatCurrency(payment.amount)}
                  </Text>
                </View>
              ))}
              {settlement.paymentPlan.length > 3 && (
                <Text style={styles.paymentMore}>
                  +{settlement.paymentPlan.length - 3} more payments
                </Text>
              )}
            </View>

            {/* Validation Status */}
            <View style={styles.validationStatus}>
              <Text style={[
                styles.validationText,
                { color: settlement.isValid ? '#4CAF50' : '#F44336' },
              ]}>
                {settlement.isValid ? '✓ Validation Passed' : '✗ Validation Failed'}
              </Text>
              {!settlement.isValid && (
                <Text style={styles.validationErrors}>
                  {settlement.validationResults.errors.length} errors, {settlement.validationResults.warnings.length} warnings
                </Text>
              )}
            </View>
          </View>
        )}

        <View style={styles.settlementActions}>
          {enableComparison && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.compareToggleButton,
                isSelected && styles.compareToggleButtonSelected,
              ]}
              onPress={() => handleComparisonToggle(settlement.optionId)}
              accessibilityRole="button"
              accessibilityLabel={isSelected ? 'Remove from comparison' : 'Add to comparison'}
            >
              <Text style={[
                styles.actionButtonText,
                isSelected && styles.compareToggleTextSelected,
              ]}>
                {isSelected ? 'Remove' : 'Compare'}
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.actionButton, styles.selectButton]}
            onPress={() => handleSettlementSelect(settlement)}
            accessibilityRole="button"
            accessibilityLabel="Select this settlement option"
          >
            <Text style={styles.actionButtonText}>Select</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [
    selectedSettlements,
    expandedSettlement,
    comparison,
    handleViewDetails,
    getAlgorithmDisplayName,
    getScoreColor,
    formatPercentage,
    formatTime,
    formatCurrency,
    enableComparison,
    handleComparisonToggle,
    handleSettlementSelect,
  ]);

  // Render comparison matrix modal
  const renderComparisonMatrix = useCallback(() => {
    if (!showComparisonMatrix || !comparison) return null;

    const selectedOptions = comparison.alternatives.filter(alt => 
      selectedSettlements.has(alt.optionId)
    );

    return (
      <Modal
        visible={showComparisonMatrix}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowComparisonMatrix(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Settlement Comparison</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowComparisonMatrix(false)}
              accessibilityRole="button"
              accessibilityLabel="Close comparison"
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.comparisonTable}>
                {/* Header Row */}
                <View style={styles.comparisonHeaderRow}>
                  <View style={styles.comparisonHeaderCell}>
                    <Text style={styles.comparisonHeaderText}>Metric</Text>
                  </View>
                  {selectedOptions.map(option => (
                    <View key={option.optionId} style={styles.comparisonHeaderCell}>
                      <Text style={styles.comparisonHeaderText}>{option.name}</Text>
                    </View>
                  ))}
                </View>
                
                {/* Data Rows */}
                {comparison.comparisonMatrix.map(metric => (
                  <View key={metric.metricName} style={styles.comparisonDataRow}>
                    <View style={styles.comparisonDataCell}>
                      <Text style={styles.comparisonMetricName}>{metric.metricName}</Text>
                    </View>
                    {selectedOptions.map(option => (
                      <View key={option.optionId} style={styles.comparisonDataCell}>
                        <Text style={styles.comparisonDataValue}>
                          {metric.displayFormat === 'percentage' 
                            ? formatPercentage(metric.values[option.optionId])
                            : metric.displayFormat === 'currency'
                            ? formatCurrency(metric.values[option.optionId])
                            : metric.displayFormat === 'time'
                            ? formatTime(metric.values[option.optionId])
                            : metric.values[option.optionId].toFixed(1)
                          }
                        </Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>
          </ScrollView>
        </View>
      </Modal>
    );
  }, [showComparisonMatrix, comparison, selectedSettlements, formatPercentage, formatCurrency, formatTime]);

  // Show empty state if no comparison data
  if (!comparison || !comparison.alternatives.length) {
    return (
      <View style={styles.container} accessibilityLabel={accessibilityLabel}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>⚖️</Text>
          <Text style={styles.emptyStateTitle}>No Settlement Options Available</Text>
          <Text style={styles.emptyStateText}>
            Generate settlement alternatives to compare different optimization approaches.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container} accessibilityLabel={accessibilityLabel}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Recommendation Banner */}
        {renderRecommendationBanner()}

        {/* Summary Statistics */}
        {renderSummaryStats()}

        {/* Sort Controls */}
        {renderSortControls()}

        {/* Comparison Controls */}
        {renderComparisonControls()}

        {/* Settlement Options */}
        <View style={styles.optionsContainer}>
          {sortedAlternatives.map(renderSettlementOption)}
        </View>
      </ScrollView>

      {/* Comparison Matrix Modal */}
      {renderComparisonMatrix()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  scrollContainer: {
    flex: 1,
  },

  recommendationBanner: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },

  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  recommendationIcon: {
    fontSize: 20,
    marginRight: 8,
  },

  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
  },

  recommendationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 4,
  },

  recommendationDescription: {
    fontSize: 14,
    color: '#388E3C',
    marginBottom: 8,
  },

  recommendationStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },

  recommendationStat: {
    fontSize: 12,
    color: '#2E7D32',
    marginRight: 12,
    marginBottom: 2,
  },

  selectRecommendedButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },

  selectRecommendedText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  summaryContainer: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
  },

  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },

  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  summaryItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 8,
  },

  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 2,
  },

  summaryLabel: {
    fontSize: 12,
    color: '#666',
  },

  sortContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },

  sortLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },

  sortScroll: {
    flexDirection: 'row',
  },

  sortButton: {
    backgroundColor: '#F0F0F0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },

  sortButtonActive: {
    backgroundColor: '#1976D2',
  },

  sortButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },

  sortButtonTextActive: {
    color: '#FFFFFF',
  },

  comparisonControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },

  comparisonLabel: {
    fontSize: 14,
    color: '#666',
  },

  compareButton: {
    backgroundColor: '#1976D2',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  compareButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },

  compareButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  compareButtonTextDisabled: {
    color: '#FFFFFF',
  },

  optionsContainer: {
    paddingHorizontal: 16,
  },

  settlementContainer: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },

  recommendedContainer: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },

  settlementHeader: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#F5F5F5',
  },

  settlementInfo: {
    flex: 1,
  },

  settlementTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  settlementName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },

  recommendedBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },

  settlementAlgorithm: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },

  settlementDescription: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
  },

  settlementScore: {
    alignItems: 'center',
    marginLeft: 16,
  },

  scoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2,
  },

  scoreLabel: {
    fontSize: 12,
    color: '#666',
  },

  settlementStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: '#F8F8F8',
  },

  statItem: {
    alignItems: 'center',
  },

  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },

  statLabel: {
    fontSize: 10,
    color: '#666',
  },

  scoreBreakdown: {
    padding: 16,
  },

  scoreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  scoreMetricLabel: {
    fontSize: 12,
    color: '#666',
    width: 80,
  },

  scoreBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginHorizontal: 8,
    overflow: 'hidden',
  },

  scoreBarFill: {
    height: '100%',
    backgroundColor: '#1976D2',
  },

  scoreMetricValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    width: 30,
    textAlign: 'right',
  },

  settlementDetails: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },

  prosConsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },

  prosContainer: {
    flex: 1,
    marginRight: 8,
  },

  consContainer: {
    flex: 1,
    marginLeft: 8,
  },

  prosTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 8,
  },

  consTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F44336',
    marginBottom: 8,
  },

  proText: {
    fontSize: 12,
    color: '#2E7D32',
    marginBottom: 4,
    lineHeight: 16,
  },

  conText: {
    fontSize: 12,
    color: '#C62828',
    marginBottom: 4,
    lineHeight: 16,
  },

  paymentPreview: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },

  paymentPreviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },

  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },

  paymentText: {
    fontSize: 12,
    color: '#666',
  },

  paymentAmount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },

  paymentMore: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
  },

  validationStatus: {
    alignItems: 'center',
  },

  validationText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },

  validationErrors: {
    fontSize: 12,
    color: '#F44336',
  },

  settlementActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    backgroundColor: '#F5F5F5',
  },

  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },

  compareToggleButton: {
    backgroundColor: '#757575',
    flex: 1,
  },

  compareToggleButtonSelected: {
    backgroundColor: '#1976D2',
  },

  selectButton: {
    backgroundColor: '#4CAF50',
    flex: 2,
  },

  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  compareToggleTextSelected: {
    color: '#FFFFFF',
  },

  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },

  modalCloseButton: {
    padding: 8,
  },

  modalCloseText: {
    fontSize: 18,
    color: '#666',
  },

  modalContent: {
    flex: 1,
    padding: 16,
  },

  comparisonTable: {
    minWidth: 400,
  },

  comparisonHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
  },

  comparisonDataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },

  comparisonHeaderCell: {
    padding: 12,
    minWidth: 100,
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
  },

  comparisonDataCell: {
    padding: 12,
    minWidth: 100,
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
  },

  comparisonHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },

  comparisonMetricName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },

  comparisonDataValue: {
    fontSize: 12,
    color: '#333',
  },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },

  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },

  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },

  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});