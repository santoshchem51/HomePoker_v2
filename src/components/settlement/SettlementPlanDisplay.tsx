/**
 * Settlement Plan Display Component - Epic 3: Settlement Optimization
 * Story 3.2: Settlement Plan Visualization Components
 * 
 * React Native component for displaying optimized settlement plans with visual flow
 */

import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  AccessibilityInfo,
} from 'react-native';
import { useSettlementOptimization } from '../../hooks/useSettlementOptimization';
import { OptimizedSettlement, PaymentPlan } from '../../types/settlement';

interface SettlementPlanDisplayProps {
  sessionId: string;
  optimizedSettlement?: OptimizedSettlement | null;
  showComparison?: boolean;
  comparisonMode?: 'side-by-side' | 'toggle' | 'overlay';
  onPlanAccept?: (settlement: OptimizedSettlement) => void;
  onPlanReject?: () => void;
  onPaymentSelect?: (payment: PaymentPlan) => void;
  enableRealtimeUpdates?: boolean;
  accessibilityLabel?: string;
}

export const SettlementPlanDisplay: React.FC<SettlementPlanDisplayProps> = ({
  sessionId,
  optimizedSettlement: externalSettlement,
  showComparison: _showComparison = false,
  comparisonMode: _comparisonMode = 'side-by-side',
  onPlanAccept,
  onPlanReject,
  onPaymentSelect,
  enableRealtimeUpdates = false,
  accessibilityLabel = 'Settlement Plan Display',
}) => {
  const {
    optimizedResult: internalResult,
    isOptimizing,
    error,
    optimizeSettlement,
    formatPaymentPlan,
    getOptimizationBenefits,
    validateOptimization,
    clearError,
    enableAutoRefresh,
    disableAutoRefresh,
  } = useSettlementOptimization({
    onOptimizationComplete: (result) => {
      console.log('Settlement optimization completed:', result.optimizationMetrics);
    },
    onOptimizationError: (error) => {
      console.error('Settlement optimization failed:', error.message);
    },
  });

  // Use external settlement if provided, otherwise use internal result
  const settlement = externalSettlement || internalResult;

  // Enable/disable real-time updates
  React.useEffect(() => {
    if (enableRealtimeUpdates) {
      enableAutoRefresh(sessionId);
    } else {
      disableAutoRefresh();
    }
    
    return () => {
      disableAutoRefresh();
    };
  }, [enableRealtimeUpdates, sessionId, enableAutoRefresh, disableAutoRefresh]);

  // Validation result for current settlement
  const validationResult = useMemo(() => {
    return settlement ? validateOptimization(settlement) : null;
  }, [settlement, validateOptimization]);

  // Optimization benefits for display
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

  // Handle manual optimization trigger
  const handleOptimize = useCallback(async () => {
    try {
      await optimizeSettlement(sessionId);
    } catch (error) {
      Alert.alert(
        'Optimization Failed',
        error instanceof Error ? error.message : 'An unknown error occurred',
        [{ text: 'OK', onPress: clearError }]
      );
    }
  }, [optimizeSettlement, sessionId, clearError]);

  // Handle payment plan acceptance
  const handleAcceptPlan = useCallback(() => {
    if (settlement && onPlanAccept) {
      AccessibilityInfo.announceForAccessibility('Settlement plan accepted');
      onPlanAccept(settlement);
    }
  }, [settlement, onPlanAccept]);

  // Handle payment plan rejection
  const handleRejectPlan = useCallback(() => {
    if (onPlanReject) {
      AccessibilityInfo.announceForAccessibility('Settlement plan rejected');
      onPlanReject();
    }
  }, [onPlanReject]);

  // Handle individual payment selection
  const handlePaymentPress = useCallback((payment: PaymentPlan) => {
    if (onPaymentSelect) {
      AccessibilityInfo.announceForAccessibility(
        `Selected payment: ${payment.fromPlayerName} pays ${formatCurrency(payment.amount)} to ${payment.toPlayerName}`
      );
      onPaymentSelect(payment);
    }
  }, [onPaymentSelect, formatCurrency]);

  // Render payment plan item
  const renderPaymentItem = useCallback((payment: PaymentPlan, index: number) => {
    const formatted = formatPaymentPlan(payment);
    const isHighPriority = payment.priority <= 3;
    
    return (
      <TouchableOpacity
        key={`payment-${payment.fromPlayerId}-${payment.toPlayerId}-${index}`}
        style={[
          styles.paymentItem,
          isHighPriority && styles.highPriorityPayment,
          { borderLeftColor: formatted.color },
        ]}
        onPress={() => handlePaymentPress(payment)}
        accessibilityRole="button"
        accessibilityLabel={`Payment ${index + 1}: ${formatted.displayText}, amount ${formatted.amount}, priority ${payment.priority}`}
        accessibilityHint="Tap for payment details"
      >
        <View style={styles.paymentHeader}>
          <Text style={styles.paymentIcon}>{formatted.icon}</Text>
          <View style={styles.paymentFlow}>
            <Text style={styles.playerName}>{payment.fromPlayerName}</Text>
            <Text style={styles.flowArrow}>→</Text>
            <Text style={styles.playerName}>{payment.toPlayerName}</Text>
          </View>
          <Text style={[styles.paymentAmount, { color: formatted.color }]}>
            {formatted.amount}
          </Text>
        </View>
        
        <View style={styles.paymentMeta}>
          <Text style={styles.priorityBadge}>
            Priority {payment.priority}
          </Text>
          {isHighPriority && (
            <Text style={styles.highPriorityLabel}>High Priority</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }, [formatPaymentPlan, handlePaymentPress, formatCurrency]);

  // Render optimization benefits section
  const renderBenefitsSection = useCallback(() => {
    if (!benefits) return null;

    return (
      <View style={styles.benefitsContainer}>
        <Text style={styles.benefitsTitle}>Optimization Benefits</Text>
        
        <View style={styles.benefitsList}>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>📊</Text>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitLabel}>Transaction Reduction</Text>
              <Text style={styles.benefitValue}>
                {benefits.transactionReduction} fewer transactions 
                ({benefits.percentageImprovement.toFixed(1)}% improvement)
              </Text>
            </View>
          </View>
          
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>⏱️</Text>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitLabel}>Time Efficiency</Text>
              <Text style={styles.benefitValue}>{benefits.timeEfficiency}</Text>
            </View>
          </View>
          
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>🎯</Text>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitLabel}>Complexity Reduction</Text>
              <Text style={styles.benefitValue}>{benefits.complexityReduction}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }, [benefits]);

  // Render validation warnings/errors
  const renderValidationSection = useCallback(() => {
    if (!validationResult || (validationResult.warnings.length === 0 && validationResult.errors.length === 0)) {
      return null;
    }

    return (
      <View style={styles.validationContainer}>
        {validationResult.errors.length > 0 && (
          <View style={styles.errorsSection}>
            <Text style={styles.validationTitle}>❌ Errors</Text>
            {validationResult.errors.map((error, index) => (
              <Text key={index} style={styles.errorText}>• {error}</Text>
            ))}
          </View>
        )}
        
        {validationResult.warnings.length > 0 && (
          <View style={styles.warningsSection}>
            <Text style={styles.validationTitle}>⚠️ Warnings</Text>
            {validationResult.warnings.map((warning, index) => (
              <Text key={index} style={styles.warningText}>• {warning}</Text>
            ))}
          </View>
        )}
      </View>
    );
  }, [validationResult]);

  // Render action buttons
  const renderActionButtons = useCallback(() => {
    const canAccept = settlement && validationResult?.isValid;
    
    return (
      <View style={styles.actionContainer}>
        {!settlement && (
          <TouchableOpacity
            style={[styles.actionButton, styles.optimizeButton]}
            onPress={handleOptimize}
            disabled={isOptimizing}
            accessibilityRole="button"
            accessibilityLabel="Start settlement optimization"
          >
            {isOptimizing ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.actionButtonText}>Optimize Settlement</Text>
            )}
          </TouchableOpacity>
        )}
        
        {settlement && (
          <>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.acceptButton,
                !canAccept && styles.disabledButton,
              ]}
              onPress={handleAcceptPlan}
              disabled={!canAccept}
              accessibilityRole="button"
              accessibilityLabel="Accept settlement plan"
              accessibilityState={{ disabled: !canAccept }}
            >
              <Text style={styles.actionButtonText}>Accept Plan</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={handleRejectPlan}
              accessibilityRole="button"
              accessibilityLabel="Reject settlement plan"
            >
              <Text style={styles.actionButtonText}>Try Again</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  }, [settlement, validationResult, isOptimizing, handleOptimize, handleAcceptPlan, handleRejectPlan]);

  if (error) {
    return (
      <View style={styles.container} accessibilityLabel={accessibilityLabel}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Optimization Error</Text>
          <Text style={styles.errorMessage}>{error.message}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleOptimize}
            accessibilityRole="button"
            accessibilityLabel="Retry optimization"
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isOptimizing && !settlement) {
    return (
      <View style={styles.container} accessibilityLabel={accessibilityLabel}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1976D2" />
          <Text style={styles.loadingText}>Optimizing Settlement...</Text>
          <Text style={styles.loadingSubtext}>
            Finding the most efficient payment plan
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
        <Text style={styles.title}>Settlement Plan</Text>
        {settlement && (
          <View style={styles.headerMeta}>
            <Text style={styles.paymentCount}>
              {settlement.optimizedPayments.length} payments
            </Text>
            <Text style={styles.processingTime}>
              {settlement.optimizationMetrics.processingTime}ms
            </Text>
          </View>
        )}
      </View>

      {/* Settlement Plan */}
      {settlement && settlement.optimizedPayments.length > 0 && (
        <View style={styles.planContainer}>
          <Text style={styles.sectionTitle}>Payment Plan</Text>
          {settlement.optimizedPayments
            .sort((a, b) => a.priority - b.priority) // Sort by priority (1 = highest)
            .map(renderPaymentItem)
          }
        </View>
      )}

      {/* Empty State */}
      {settlement && settlement.optimizedPayments.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>🎉</Text>
          <Text style={styles.emptyStateTitle}>No Payments Needed!</Text>
          <Text style={styles.emptyStateText}>
            All players are settled - no money needs to change hands.
          </Text>
        </View>
      )}

      {/* Benefits Section */}
      {renderBenefitsSection()}

      {/* Validation Section */}
      {renderValidationSection()}

      {/* Mathematical Proof Summary */}
      {settlement?.mathematicalProof && (
        <View style={styles.proofContainer}>
          <Text style={styles.proofTitle}>Mathematical Validation</Text>
          <View style={styles.proofRow}>
            <Text style={styles.proofLabel}>Total Amount:</Text>
            <Text style={styles.proofValue}>
              {formatCurrency(settlement.mathematicalProof.totalDebits)}
            </Text>
          </View>
          <View style={styles.proofRow}>
            <Text style={styles.proofLabel}>Balance:</Text>
            <Text style={[
              styles.proofValue,
              { color: settlement.mathematicalProof.isBalanced ? '#4CAF50' : '#F44336' }
            ]}>
              {settlement.mathematicalProof.isBalanced ? 'Balanced ✓' : 'Unbalanced ✗'}
            </Text>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      {renderActionButtons()}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  
  headerMeta: {
    alignItems: 'flex-end',
  },
  
  paymentCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  
  processingTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  
  planContainer: {
    marginBottom: 24,
  },
  
  paymentItem: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  
  highPriorityPayment: {
    backgroundColor: '#FFF8E1',
    borderLeftColor: '#FF9800',
  },
  
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  paymentIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  
  paymentFlow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  
  flowArrow: {
    fontSize: 18,
    color: '#666',
    marginHorizontal: 8,
    fontWeight: 'bold',
  },
  
  paymentAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  
  paymentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  priorityBadge: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  
  highPriorityLabel: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '600',
  },
  
  benefitsContainer: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
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
  
  benefitContent: {
    flex: 1,
  },
  
  benefitLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 2,
  },
  
  benefitValue: {
    fontSize: 14,
    color: '#388E3C',
  },
  
  validationContainer: {
    marginBottom: 24,
  },
  
  errorsSection: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  
  warningsSection: {
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 12,
  },
  
  validationTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  
  errorText: {
    fontSize: 12,
    color: '#C62828',
    lineHeight: 16,
  },
  
  warningText: {
    fontSize: 12,
    color: '#EF6C00',
    lineHeight: 16,
  },
  
  proofContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  
  proofTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  
  proofRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  
  proofLabel: {
    fontSize: 12,
    color: '#666',
  },
  
  proofValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  
  emptyState: {
    alignItems: 'center',
    padding: 32,
    marginBottom: 24,
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
  
  actionContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  
  optimizeButton: {
    backgroundColor: '#1976D2',
  },
  
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  
  rejectButton: {
    backgroundColor: '#37474F',
  },
  
  disabledButton: {
    backgroundColor: '#BDBDBD',
  },
  
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  
  loadingSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
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