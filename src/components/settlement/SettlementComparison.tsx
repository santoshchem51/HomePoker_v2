/**
 * Settlement Comparison Component - Epic 3: Settlement Optimization
 * Story 3.2: Settlement Plan Visualization Components
 * 
 * React Native component for comparing optimized vs direct settlement plans
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  AccessibilityInfo,
} from 'react-native';
import { useSettlementOptimization } from '../../hooks/useSettlementOptimization';
import { OptimizedSettlement, PaymentPlan } from '../../types/settlement';

interface SettlementComparisonProps {
  sessionId: string;
  optimizedSettlement?: OptimizedSettlement | null;
  displayMode?: 'side-by-side' | 'toggle' | 'overlay';
  showMetrics?: boolean;
  showBenefits?: boolean;
  onComparisonComplete?: (comparison: any) => void;
  onPlanSelect?: (planType: 'optimized' | 'direct', plan: PaymentPlan[]) => void;
  accessibilityLabel?: string;
}

type ViewMode = 'optimized' | 'direct' | 'comparison';

export const SettlementComparison: React.FC<SettlementComparisonProps> = ({
  sessionId,
  optimizedSettlement: externalSettlement,
  displayMode = 'side-by-side',
  showMetrics = true,
  showBenefits = true,
  onComparisonComplete,
  onPlanSelect,
  accessibilityLabel = 'Settlement Comparison',
}) => {
  const [currentView, setCurrentView] = useState<ViewMode>('comparison');
  const [expandedPayment, setExpandedPayment] = useState<string | null>(null);

  const {
    optimizedResult: internalResult,
    comparison,
    isOptimizing,
    error,
    // optimizeSettlement,
    compareOptimizations,
    formatPaymentPlan,
    getOptimizationBenefits,
    clearError,
  } = useSettlementOptimization({
    onComparisonUpdate: onComparisonComplete,
  });

  // Use external settlement if provided, otherwise use internal result
  const settlement = externalSettlement || internalResult;

  // Screen dimensions for responsive layout
  const { width } = Dimensions.get('window');
  const isTablet = width > 768;

  // Load comparison data
  React.useEffect(() => {
    if (settlement && !comparison) {
      compareOptimizations(sessionId);
    }
  }, [settlement, comparison, sessionId, compareOptimizations]);

  // Optimization benefits
  const benefits = useMemo(() => {
    return settlement ? getOptimizationBenefits(settlement) : null;
  }, [settlement, getOptimizationBenefits]);

  // Format currency helper
  const formatCurrency = useCallback((amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }, []);

  // Handle plan selection
  const handlePlanSelect = useCallback((planType: 'optimized' | 'direct') => {
    if (!settlement || !onPlanSelect) return;
    
    const plan = planType === 'optimized' ? settlement.optimizedPayments : settlement.directPayments;
    AccessibilityInfo.announceForAccessibility(`Selected ${planType} settlement plan`);
    onPlanSelect(planType, plan);
  }, [settlement, onPlanSelect]);

  // Toggle expanded payment details
  const togglePaymentExpansion = useCallback((paymentId: string) => {
    setExpandedPayment(current => current === paymentId ? null : paymentId);
  }, []);

  // Get payment ID for tracking
  const getPaymentId = useCallback((payment: PaymentPlan, index: number) => {
    return `${payment.fromPlayerId}-${payment.toPlayerId}-${index}`;
  }, []);

  // Render comparison metrics
  const renderComparisonMetrics = useCallback(() => {
    if (!settlement || !showMetrics) return null;

    const metrics = settlement.optimizationMetrics;
    const reductionColor = metrics.reductionPercentage >= 40 ? '#4CAF50' : 
                          metrics.reductionPercentage >= 25 ? '#FF9800' : '#F44336';

    return (
      <View style={styles.metricsContainer}>
        <Text style={styles.metricsTitle}>Optimization Metrics</Text>
        
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Transaction Reduction</Text>
            <Text style={[styles.metricValue, { color: reductionColor }]}>
              {metrics.originalPaymentCount - metrics.optimizedPaymentCount} transactions
            </Text>
            <Text style={[styles.metricPercentage, { color: reductionColor }]}>
              ({metrics.reductionPercentage.toFixed(1)}% improvement)
            </Text>
          </View>
          
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Processing Time</Text>
            <Text style={styles.metricValue}>
              {metrics.processingTime}ms
            </Text>
            <Text style={styles.metricPercentage}>
              {metrics.processingTime < 500 ? 'Fast' : 
               metrics.processingTime < 1500 ? 'Good' : 'Slow'}
            </Text>
          </View>
          
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Total Amount</Text>
            <Text style={styles.metricValue}>
              {formatCurrency(metrics.totalAmountSettled)}
            </Text>
            <Text style={styles.metricPercentage}>
              {metrics.optimizedPaymentCount} payments
            </Text>
          </View>
        </View>
      </View>
    );
  }, [settlement, showMetrics, formatCurrency]);

  // Render benefits summary
  const renderBenefitsSummary = useCallback(() => {
    if (!benefits || !showBenefits) return null;

    return (
      <View style={styles.benefitsContainer}>
        <Text style={styles.benefitsTitle}>Optimization Benefits</Text>
        
        <View style={styles.benefitsList}>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>🎯</Text>
            <Text style={styles.benefitText}>
              <Text style={styles.benefitLabel}>Simplification: </Text>
              {benefits.complexityReduction}
            </Text>
          </View>
          
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>⏱️</Text>
            <Text style={styles.benefitText}>
              <Text style={styles.benefitLabel}>Time Savings: </Text>
              {benefits.timeEfficiency}
            </Text>
          </View>
          
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>📊</Text>
            <Text style={styles.benefitText}>
              <Text style={styles.benefitLabel}>Efficiency: </Text>
              {benefits.percentageImprovement.toFixed(1)}% fewer transactions
            </Text>
          </View>
        </View>
      </View>
    );
  }, [benefits, showBenefits]);

  // Render payment plan
  const renderPaymentPlan = useCallback((
    payments: PaymentPlan[], 
    title: string, 
    planType: 'optimized' | 'direct'
  ) => {
    const containerStyle = displayMode === 'side-by-side' && isTablet ? 
      [styles.planContainer, styles.planContainerHalf] : 
      styles.planContainer;

    return (
      <View style={containerStyle}>
        <View style={styles.planHeader}>
          <Text style={styles.planTitle}>{title}</Text>
          <Text style={styles.planCount}>{payments.length} payments</Text>
          {onPlanSelect && (
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => handlePlanSelect(planType)}
              accessibilityRole="button"
              accessibilityLabel={`Select ${planType} plan`}
            >
              <Text style={styles.selectButtonText}>Select</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {payments.length === 0 ? (
          <View style={styles.emptyPlan}>
            <Text style={styles.emptyPlanText}>No payments needed</Text>
          </View>
        ) : (
          <View style={styles.paymentsList}>
            {payments
              .sort((a, b) => a.priority - b.priority)
              .map((payment, index) => {
                const paymentId = getPaymentId(payment, index);
                const isExpanded = expandedPayment === paymentId;
                const formatted = formatPaymentPlan(payment);
                
                return (
                  <TouchableOpacity
                    key={paymentId}
                    style={[
                      styles.paymentItem,
                      planType === 'optimized' && styles.optimizedPaymentItem,
                      isExpanded && styles.expandedPaymentItem,
                    ]}
                    onPress={() => togglePaymentExpansion(paymentId)}
                    accessibilityRole="button"
                    accessibilityLabel={`Payment ${index + 1}: ${formatted.displayText}, ${formatted.amount}`}
                    accessibilityHint="Tap for details"
                    accessibilityState={{ expanded: isExpanded }}
                  >
                    <View style={styles.paymentHeader}>
                      <Text style={styles.paymentIcon}>{formatted.icon}</Text>
                      <View style={styles.paymentFlow}>
                        <Text style={styles.playerName} numberOfLines={1}>
                          {payment.fromPlayerName}
                        </Text>
                        <Text style={styles.flowArrow}>→</Text>
                        <Text style={styles.playerName} numberOfLines={1}>
                          {payment.toPlayerName}
                        </Text>
                      </View>
                      <Text style={[styles.paymentAmount, { color: formatted.color }]}>
                        {formatted.amount}
                      </Text>
                    </View>
                    
                    {isExpanded && (
                      <View style={styles.paymentDetails}>
                        <Text style={styles.paymentDetail}>
                          Priority: {payment.priority}
                        </Text>
                        <Text style={styles.paymentDetail}>
                          From: {payment.fromPlayerName} ({payment.fromPlayerId})
                        </Text>
                        <Text style={styles.paymentDetail}>
                          To: {payment.toPlayerName} ({payment.toPlayerId})
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
          </View>
        )}
      </View>
    );
  }, [
    displayMode, 
    isTablet, 
    onPlanSelect, 
    handlePlanSelect, 
    expandedPayment, 
    togglePaymentExpansion, 
    getPaymentId, 
    formatPaymentPlan
  ]);

  // Render view mode toggle (for non-side-by-side modes)
  const renderViewToggle = useCallback(() => {
    if (displayMode === 'side-by-side') return null;

    return (
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            currentView === 'optimized' && styles.toggleButtonActive,
          ]}
          onPress={() => setCurrentView('optimized')}
          accessibilityRole="tab"
          accessibilityState={{ selected: currentView === 'optimized' }}
        >
          <Text style={[
            styles.toggleButtonText,
            currentView === 'optimized' && styles.toggleButtonTextActive,
          ]}>
            Optimized
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.toggleButton,
            currentView === 'direct' && styles.toggleButtonActive,
          ]}
          onPress={() => setCurrentView('direct')}
          accessibilityRole="tab"
          accessibilityState={{ selected: currentView === 'direct' }}
        >
          <Text style={[
            styles.toggleButtonText,
            currentView === 'direct' && styles.toggleButtonTextActive,
          ]}>
            Direct
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.toggleButton,
            currentView === 'comparison' && styles.toggleButtonActive,
          ]}
          onPress={() => setCurrentView('comparison')}
          accessibilityRole="tab"
          accessibilityState={{ selected: currentView === 'comparison' }}
        >
          <Text style={[
            styles.toggleButtonText,
            currentView === 'comparison' && styles.toggleButtonTextActive,
          ]}>
            Compare
          </Text>
        </TouchableOpacity>
      </View>
    );
  }, [displayMode, currentView]);

  // Handle error state
  if (error) {
    return (
      <View style={styles.container} accessibilityLabel={accessibilityLabel}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Comparison Error</Text>
          <Text style={styles.errorMessage}>{error.message}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              clearError();
              compareOptimizations(sessionId);
            }}
            accessibilityRole="button"
            accessibilityLabel="Retry comparison"
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Handle loading state
  if (isOptimizing && !settlement) {
    return (
      <View style={styles.container} accessibilityLabel={accessibilityLabel}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1976D2" />
          <Text style={styles.loadingText}>Generating Comparison...</Text>
        </View>
      </View>
    );
  }

  // Handle no settlement state
  if (!settlement) {
    return (
      <View style={styles.container} accessibilityLabel={accessibilityLabel}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>📊</Text>
          <Text style={styles.emptyStateTitle}>No Settlement to Compare</Text>
          <Text style={styles.emptyStateText}>
            Run settlement optimization first to see the comparison.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      accessibilityLabel={accessibilityLabel}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Settlement Comparison</Text>
        <Text style={styles.subtitle}>
          Optimized vs Direct Settlement Plans
        </Text>
      </View>

      {/* Metrics */}
      {renderComparisonMetrics()}

      {/* Benefits */}
      {renderBenefitsSummary()}

      {/* View Toggle */}
      {renderViewToggle()}

      {/* Plans Display */}
      <View style={[
        styles.plansContainer,
        displayMode === 'side-by-side' && isTablet && styles.plansContainerRow,
      ]}>
        {(displayMode === 'side-by-side' || currentView === 'optimized' || currentView === 'comparison') && (
          renderPaymentPlan(settlement.optimizedPayments, 'Optimized Plan', 'optimized')
        )}
        
        {(displayMode === 'side-by-side' || currentView === 'direct' || currentView === 'comparison') && (
          renderPaymentPlan(settlement.directPayments, 'Direct Plan', 'direct')
        )}
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
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 4,
  },
  
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  
  metricsContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  
  metricsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  
  metricItem: {
    flex: 1,
    minWidth: 100,
    alignItems: 'center',
  },
  
  metricLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 2,
  },
  
  metricPercentage: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  
  benefitsContainer: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 12,
  },
  
  benefitsList: {
    gap: 8,
  },
  
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  
  benefitIcon: {
    fontSize: 16,
    marginRight: 12,
    marginTop: 2,
  },
  
  benefitText: {
    fontSize: 14,
    color: '#388E3C',
    flex: 1,
    lineHeight: 20,
  },
  
  benefitLabel: {
    fontWeight: '600',
  },
  
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
  },
  
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  
  toggleButtonActive: {
    backgroundColor: '#1976D2',
  },
  
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  
  toggleButtonTextActive: {
    color: '#FFFFFF',
  },
  
  plansContainer: {
    gap: 16,
  },
  
  plansContainerRow: {
    flexDirection: 'row',
    gap: 16,
  },
  
  planContainer: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  
  planContainerHalf: {
    flex: 1,
  },
  
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  
  planTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  
  planCount: {
    fontSize: 12,
    color: '#666',
    marginRight: 12,
  },
  
  selectButton: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  
  selectButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  
  emptyPlan: {
    alignItems: 'center',
    padding: 24,
  },
  
  emptyPlanText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  
  paymentsList: {
    gap: 8,
  },
  
  paymentItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  
  optimizedPaymentItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  
  expandedPaymentItem: {
    backgroundColor: '#F8F9FA',
  },
  
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  paymentIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  
  paymentFlow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  
  playerName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  
  flowArrow: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 8,
  },
  
  paymentAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  paymentDetails: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  
  paymentDetail: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
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
    textAlign: 'center',
  },
  
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  
  loadingText: {
    fontSize: 16,
    color: '#333',
    marginTop: 16,
  },
  
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F44336',
    marginBottom: 12,
  },
  
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  
  retryButton: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});