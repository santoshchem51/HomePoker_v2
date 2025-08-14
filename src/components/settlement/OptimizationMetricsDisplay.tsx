/**
 * Optimization Metrics Display Component - Epic 3: Settlement Optimization
 * Story 3.2: Settlement Plan Visualization Components
 * 
 * React Native component for displaying visual indicators of payment reduction benefits
 */

import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  AccessibilityInfo,
} from 'react-native';
import { OptimizedSettlement } from '../../types/settlement';

interface MetricData {
  id: string;
  title: string;
  value: string | number;
  secondaryValue?: string;
  icon: string;
  color: string;
  backgroundColor: string;
  improvement?: number; // For showing percentage changes
  trend?: 'up' | 'down' | 'neutral';
  description: string;
}

interface OptimizationMetricsDisplayProps {
  optimizedSettlement: OptimizedSettlement;
  showComparison?: boolean;
  showTrends?: boolean;
  enableInteraction?: boolean;
  onMetricPress?: (metricId: string, metricData: MetricData) => void;
  accessibilityLabel?: string;
}

export const OptimizationMetricsDisplay: React.FC<OptimizationMetricsDisplayProps> = ({
  optimizedSettlement,
  showComparison = true,
  showTrends = true,
  enableInteraction = true,
  onMetricPress,
  accessibilityLabel = 'Optimization Metrics Display',
}) => {
  // Animation values for metric cards
  const animatedValues = useMemo(() => {
    return Array.from({ length: 6 }, () => new Animated.Value(0));
  }, []);

  // Start card animations on mount
  React.useEffect(() => {
    const animations = animatedValues.map((value, index) => 
      Animated.timing(value, {
        toValue: 1,
        duration: 300,
        delay: index * 100,
        useNativeDriver: true,
      })
    );

    Animated.stagger(100, animations).start();
  }, [animatedValues]);

  // Format currency helper
  const formatCurrency = useCallback((amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }, []);

  // Format time helper
  const formatTime = useCallback((milliseconds: number): string => {
    if (milliseconds < 1000) return `${milliseconds}ms`;
    const seconds = (milliseconds / 1000).toFixed(1);
    return `${seconds}s`;
  }, []);

  // Get efficiency rating
  const getEfficiencyRating = useCallback((reductionPercentage: number): {
    rating: string;
    color: string;
    description: string;
  } => {
    if (reductionPercentage >= 60) {
      return {
        rating: 'Excellent',
        color: '#4CAF50',
        description: 'Outstanding optimization achieved',
      };
    } else if (reductionPercentage >= 40) {
      return {
        rating: 'Good',
        color: '#8BC34A',
        description: 'Good optimization results',
      };
    } else if (reductionPercentage >= 25) {
      return {
        rating: 'Fair',
        color: '#FF9800',
        description: 'Moderate optimization achieved',
      };
    } else if (reductionPercentage >= 10) {
      return {
        rating: 'Poor',
        color: '#FF5722',
        description: 'Limited optimization benefit',
      };
    } else {
      return {
        rating: 'Minimal',
        color: '#F44336',
        description: 'Very limited optimization',
      };
    }
  }, []);

  // Generate metric data
  const metricsData = useMemo((): MetricData[] => {
    const { optimizationMetrics, mathematicalProof } = optimizedSettlement;
    const efficiency = getEfficiencyRating(optimizationMetrics.reductionPercentage);
    
    return [
      {
        id: 'transaction_reduction',
        title: 'Transaction Reduction',
        value: optimizationMetrics.originalPaymentCount - optimizationMetrics.optimizedPaymentCount,
        secondaryValue: `${optimizationMetrics.reductionPercentage.toFixed(1)}%`,
        icon: '📊',
        color: efficiency.color,
        backgroundColor: `${efficiency.color}15`,
        improvement: optimizationMetrics.reductionPercentage,
        trend: optimizationMetrics.reductionPercentage > 0 ? 'down' : 'neutral',
        description: `Reduced from ${optimizationMetrics.originalPaymentCount} to ${optimizationMetrics.optimizedPaymentCount} payments`,
      },
      {
        id: 'processing_time',
        title: 'Processing Time',
        value: formatTime(optimizationMetrics.processingTime),
        secondaryValue: optimizationMetrics.processingTime < 1000 ? 'Fast' : 'Good',
        icon: '⚡',
        color: optimizationMetrics.processingTime < 500 ? '#4CAF50' : 
               optimizationMetrics.processingTime < 1500 ? '#FF9800' : '#F44336',
        backgroundColor: optimizationMetrics.processingTime < 500 ? '#4CAF5015' : 
                         optimizationMetrics.processingTime < 1500 ? '#FF980015' : '#F4433615',
        trend: optimizationMetrics.processingTime < 1000 ? 'up' : 'neutral',
        description: `Algorithm completed in ${formatTime(optimizationMetrics.processingTime)}`,
      },
      {
        id: 'total_amount',
        title: 'Settlement Amount',
        value: formatCurrency(optimizationMetrics.totalAmountSettled),
        secondaryValue: `${optimizationMetrics.optimizedPaymentCount} payments`,
        icon: '💰',
        color: '#1976D2',
        backgroundColor: '#1976D215',
        trend: 'neutral',
        description: `Total amount being settled across all payments`,
      },
      {
        id: 'efficiency_rating',
        title: 'Efficiency Rating',
        value: efficiency.rating,
        secondaryValue: `${optimizationMetrics.reductionPercentage.toFixed(1)}% reduction`,
        icon: '🎯',
        color: efficiency.color,
        backgroundColor: `${efficiency.color}15`,
        improvement: optimizationMetrics.reductionPercentage,
        trend: optimizationMetrics.reductionPercentage >= 40 ? 'up' : 
               optimizationMetrics.reductionPercentage >= 25 ? 'neutral' : 'down',
        description: efficiency.description,
      },
      {
        id: 'mathematical_balance',
        title: 'Mathematical Balance',
        value: mathematicalProof.isBalanced ? 'Balanced' : 'Unbalanced',
        secondaryValue: formatCurrency(Math.abs(mathematicalProof.netBalance)),
        icon: mathematicalProof.isBalanced ? '✅' : '❌',
        color: mathematicalProof.isBalanced ? '#4CAF50' : '#F44336',
        backgroundColor: mathematicalProof.isBalanced ? '#4CAF5015' : '#F4433615',
        trend: mathematicalProof.isBalanced ? 'up' : 'down',
        description: mathematicalProof.isBalanced ? 
          'All payments balance perfectly' : 
          `Balance discrepancy of ${formatCurrency(Math.abs(mathematicalProof.netBalance))}`,
      },
      {
        id: 'validation_status',
        title: 'Validation Status',
        value: optimizedSettlement.isValid ? 'Valid' : 'Invalid',
        secondaryValue: optimizedSettlement.validationErrors.length > 0 ? 
          `${optimizedSettlement.validationErrors.length} issues` : 
          'All checks passed',
        icon: optimizedSettlement.isValid ? '🎉' : '⚠️',
        color: optimizedSettlement.isValid ? '#4CAF50' : '#FF9800',
        backgroundColor: optimizedSettlement.isValid ? '#4CAF5015' : '#FF980015',
        trend: optimizedSettlement.isValid ? 'up' : 'down',
        description: optimizedSettlement.isValid ? 
          'Settlement plan passes all validations' : 
          'Settlement plan has validation issues',
      },
    ];
  }, [optimizedSettlement, getEfficiencyRating, formatCurrency, formatTime]);

  // Handle metric press
  const handleMetricPress = useCallback((metric: MetricData) => {
    if (!enableInteraction) return;
    
    AccessibilityInfo.announceForAccessibility(
      `Selected ${metric.title}: ${metric.value}. ${metric.description}`
    );
    
    onMetricPress?.(metric.id, metric);
  }, [enableInteraction, onMetricPress]);

  // Render trend indicator
  const renderTrendIndicator = useCallback((trend?: 'up' | 'down' | 'neutral') => {
    if (!showTrends || !trend || trend === 'neutral') return null;
    
    const trendIcon = trend === 'up' ? '📈' : '📉';
    const trendColor = trend === 'up' ? '#4CAF50' : '#F44336';
    
    return (
      <Text style={[styles.trendIndicator, { color: trendColor }]}>
        {trendIcon}
      </Text>
    );
  }, [showTrends]);

  // Render improvement badge
  const renderImprovementBadge = useCallback((improvement?: number) => {
    if (!improvement || improvement <= 0) return null;
    
    const badgeColor = improvement >= 40 ? '#4CAF50' : 
                      improvement >= 25 ? '#FF9800' : '#F44336';
    
    return (
      <View style={[styles.improvementBadge, { backgroundColor: badgeColor }]}>
        <Text style={styles.improvementText}>
          +{improvement.toFixed(0)}%
        </Text>
      </View>
    );
  }, []);

  // Render metric card
  const renderMetricCard = useCallback((metric: MetricData, index: number) => {
    const animatedStyle = {
      opacity: animatedValues[index],
      transform: [
        {
          translateY: animatedValues[index].interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0],
          }),
        },
      ],
    };

    return (
      <Animated.View key={metric.id} style={animatedStyle}>
        <TouchableOpacity
          style={[
            styles.metricCard,
            { backgroundColor: metric.backgroundColor, borderColor: metric.color },
          ]}
          onPress={() => handleMetricPress(metric)}
          disabled={!enableInteraction}
          accessibilityRole="button"
          accessibilityLabel={`${metric.title}: ${metric.value}${metric.secondaryValue ? `, ${metric.secondaryValue}` : ''}`}
          accessibilityHint={metric.description}
        >
          <View style={styles.metricHeader}>
            <Text style={styles.metricIcon}>{metric.icon}</Text>
            <View style={styles.metricTitleContainer}>
              <Text style={styles.metricTitle}>{metric.title}</Text>
              {renderTrendIndicator(metric.trend)}
            </View>
            {renderImprovementBadge(metric.improvement)}
          </View>
          
          <View style={styles.metricContent}>
            <Text style={[styles.metricValue, { color: metric.color }]}>
              {metric.value}
            </Text>
            {metric.secondaryValue && (
              <Text style={styles.metricSecondary}>
                {metric.secondaryValue}
              </Text>
            )}
          </View>
          
          <Text style={styles.metricDescription} numberOfLines={2}>
            {metric.description}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }, [
    animatedValues, 
    handleMetricPress, 
    enableInteraction, 
    renderTrendIndicator, 
    renderImprovementBadge
  ]);

  // Render comparison summary
  const renderComparisonSummary = useCallback(() => {
    if (!showComparison) return null;
    
    const { optimizationMetrics } = optimizedSettlement;
    const improvement = optimizationMetrics.reductionPercentage;
    const efficiency = getEfficiencyRating(improvement);
    
    return (
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Optimization Summary</Text>
        
        <View style={styles.summaryContent}>
          <View style={styles.beforeAfter}>
            <View style={styles.beforeAfterItem}>
              <Text style={styles.beforeAfterLabel}>Before</Text>
              <Text style={styles.beforeAfterValue}>
                {optimizationMetrics.originalPaymentCount} payments
              </Text>
            </View>
            
            <Text style={styles.beforeAfterArrow}>→</Text>
            
            <View style={styles.beforeAfterItem}>
              <Text style={styles.beforeAfterLabel}>After</Text>
              <Text style={styles.beforeAfterValue}>
                {optimizationMetrics.optimizedPaymentCount} payments
              </Text>
            </View>
          </View>
          
          <View style={[styles.efficiencyBadge, { backgroundColor: efficiency.color }]}>
            <Text style={styles.efficiencyText}>
              {improvement.toFixed(1)}% Improvement
            </Text>
            <Text style={styles.efficiencyRating}>
              {efficiency.rating}
            </Text>
          </View>
        </View>
      </View>
    );
  }, [showComparison, optimizedSettlement, getEfficiencyRating]);

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      accessibilityLabel={accessibilityLabel}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Optimization Metrics</Text>
        <Text style={styles.subtitle}>
          Performance and efficiency indicators
        </Text>
      </View>

      {/* Comparison Summary */}
      {renderComparisonSummary()}

      {/* Metrics Grid */}
      <View style={styles.metricsGrid}>
        {metricsData.map(renderMetricCard)}
      </View>

      {/* Additional Insights */}
      <View style={styles.insightsContainer}>
        <Text style={styles.insightsTitle}>Key Insights</Text>
        
        <View style={styles.insightsList}>
          {optimizedSettlement.optimizationMetrics.reductionPercentage >= 40 && (
            <View style={styles.insightItem}>
              <Text style={styles.insightIcon}>🎯</Text>
              <Text style={styles.insightText}>
                Excellent optimization achieved - significant reduction in payment complexity
              </Text>
            </View>
          )}
          
          {optimizedSettlement.optimizationMetrics.processingTime < 500 && (
            <View style={styles.insightItem}>
              <Text style={styles.insightIcon}>⚡</Text>
              <Text style={styles.insightText}>
                Fast processing time - algorithm completed very efficiently
              </Text>
            </View>
          )}
          
          {optimizedSettlement.mathematicalProof.isBalanced && (
            <View style={styles.insightItem}>
              <Text style={styles.insightIcon}>✅</Text>
              <Text style={styles.insightText}>
                Perfect mathematical balance - all amounts reconcile exactly
              </Text>
            </View>
          )}
          
          {optimizedSettlement.validationErrors.length > 0 && (
            <View style={styles.insightItem}>
              <Text style={styles.insightIcon}>⚠️</Text>
              <Text style={styles.insightText}>
                {optimizedSettlement.validationErrors.length} validation issue{optimizedSettlement.validationErrors.length !== 1 ? 's' : ''} found - review recommended
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  
  scrollContent: {
    padding: 16,
  },
  
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 4,
  },
  
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  
  summaryContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  
  summaryContent: {
    alignItems: 'center',
  },
  
  beforeAfter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  beforeAfterItem: {
    alignItems: 'center',
    flex: 1,
  },
  
  beforeAfterLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  
  beforeAfterValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  
  beforeAfterArrow: {
    fontSize: 20,
    color: '#1976D2',
    marginHorizontal: 16,
  },
  
  efficiencyBadge: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  
  efficiencyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  
  efficiencyRating: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  
  metricsGrid: {
    gap: 12,
  },
  
  metricCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  metricIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  
  metricTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  metricTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  
  trendIndicator: {
    fontSize: 16,
    marginLeft: 8,
  },
  
  improvementBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  
  improvementText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  
  metricContent: {
    marginBottom: 8,
  },
  
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  
  metricSecondary: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  
  metricDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  
  insightsContainer: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  
  insightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1565C0',
    marginBottom: 12,
  },
  
  insightsList: {
    gap: 10,
  },
  
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  
  insightIcon: {
    fontSize: 16,
    marginRight: 12,
    marginTop: 2,
  },
  
  insightText: {
    fontSize: 14,
    color: '#1976D2',
    flex: 1,
    lineHeight: 20,
  },
});