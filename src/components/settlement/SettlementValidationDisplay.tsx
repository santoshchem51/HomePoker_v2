/**
 * Settlement Validation Display Component - Epic 3: Settlement Optimization
 * Story 3.3: Settlement Validation and Verification - Task 5
 * 
 * React Native component for displaying settlement validation results with real-time status
 */

import React, { useCallback, useMemo, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  AccessibilityInfo,
  RefreshControl,
} from 'react-native';
import { 
  OptimizedSettlement, 
  SettlementValidation, 
  SettlementError, 
  SettlementWarning,
  ValidationErrorCode,
  SettlementAuditEntry 
} from '../../types/settlement';

interface SettlementValidationDisplayProps {
  settlement: OptimizedSettlement | null;
  validationResults?: SettlementValidation | null;
  onValidationComplete?: (isValid: boolean) => void;
  onErrorSelect?: (error: SettlementError) => void;
  onWarningSelect?: (warning: SettlementWarning) => void;
  onAuditStepSelect?: (step: SettlementAuditEntry) => void;
  enableRealTimeValidation?: boolean;
  showDetailedBreakdown?: boolean;
  accessibilityLabel?: string;
}

export const SettlementValidationDisplay: React.FC<SettlementValidationDisplayProps> = ({
  settlement,
  validationResults,
  onValidationComplete,
  onErrorSelect,
  onWarningSelect,
  onAuditStepSelect,
  enableRealTimeValidation = true,
  showDetailedBreakdown = false,
  accessibilityLabel = 'Settlement Validation Display',
}) => {
  const [isValidating, setIsValidating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'pending' | 'valid' | 'invalid' | 'error'>('pending');

  // Format currency helper
  const formatCurrency = useCallback((amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }, []);

  // Update validation status when results change
  useEffect(() => {
    if (!validationResults) {
      setValidationStatus('pending');
      return;
    }

    if (validationResults.isValid) {
      setValidationStatus('valid');
    } else if (validationResults.errors.length > 0) {
      setValidationStatus('invalid');
    } else {
      setValidationStatus('error');
    }

    if (onValidationComplete) {
      onValidationComplete(validationResults.isValid);
    }
  }, [validationResults, onValidationComplete]);

  // Simulate validation refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    // In real implementation, this would trigger settlement re-validation
    setTimeout(() => {
      setIsRefreshing(false);
      AccessibilityInfo.announceForAccessibility('Validation refreshed');
    }, 1000);
  }, []);

  // Handle error selection
  const handleErrorPress = useCallback((error: SettlementError) => {
    if (onErrorSelect) {
      AccessibilityInfo.announceForAccessibility(`Selected error: ${error.message}`);
      onErrorSelect(error);
    }
  }, [onErrorSelect]);

  // Handle warning selection
  const handleWarningPress = useCallback((warning: SettlementWarning) => {
    if (onWarningSelect) {
      AccessibilityInfo.announceForAccessibility(`Selected warning: ${warning.message}`);
      onWarningSelect(warning);
    }
  }, [onWarningSelect]);

  // Handle audit step selection
  const handleAuditStepPress = useCallback((step: SettlementAuditEntry) => {
    if (onAuditStepSelect) {
      AccessibilityInfo.announceForAccessibility(`Selected audit step: ${step.operation}`);
      onAuditStepSelect(step);
    }
  }, [onAuditStepSelect]);

  // Get validation status color
  const getStatusColor = useCallback((status: string): string => {
    switch (status) {
      case 'valid': return '#4CAF50';
      case 'invalid': return '#F44336';
      case 'error': return '#FF9800';
      default: return '#9E9E9E';
    }
  }, []);

  // Get validation status icon
  const getStatusIcon = useCallback((status: string): string => {
    switch (status) {
      case 'valid': return '✓';
      case 'invalid': return '✗';
      case 'error': return '⚠';
      default: return '⏳';
    }
  }, []);

  // Get validation status text
  const getStatusText = useCallback((status: string): string => {
    switch (status) {
      case 'valid': return 'Valid Settlement';
      case 'invalid': return 'Validation Failed';
      case 'error': return 'Validation Error';
      default: return 'Validation Pending';
    }
  }, []);

  // Render validation status header
  const renderStatusHeader = useCallback(() => {
    const statusColor = getStatusColor(validationStatus);
    const statusIcon = getStatusIcon(validationStatus);
    const statusText = getStatusText(validationStatus);

    return (
      <View style={[styles.statusHeader, { borderLeftColor: statusColor }]}>
        <View style={styles.statusInfo}>
          <Text style={[styles.statusIcon, { color: statusColor }]}>{statusIcon}</Text>
          <View style={styles.statusContent}>
            <Text style={[styles.statusTitle, { color: statusColor }]}>{statusText}</Text>
            {validationResults && (
              <Text style={styles.statusSubtitle}>
                {validationResults.errors.length} errors, {validationResults.warnings.length} warnings
              </Text>
            )}
          </View>
        </View>
        {isValidating && (
          <ActivityIndicator color={statusColor} size="small" />
        )}
      </View>
    );
  }, [validationStatus, validationResults, isValidating, getStatusColor, getStatusIcon, getStatusText]);

  // Render validation summary
  const renderValidationSummary = useCallback(() => {
    if (!settlement || !validationResults) return null;

    const totalAmount = settlement.optimizedPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const auditStepCount = validationResults.auditTrail?.length || 0;

    return (
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Validation Summary</Text>
        
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Amount</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalAmount)}</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Payments</Text>
            <Text style={styles.summaryValue}>{settlement.optimizedPayments.length}</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Processing Time</Text>
            <Text style={styles.summaryValue}>{settlement.optimizationMetrics.processingTime}ms</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Audit Steps</Text>
            <Text style={styles.summaryValue}>{auditStepCount}</Text>
          </View>
        </View>
      </View>
    );
  }, [settlement, validationResults, formatCurrency]);

  // Render errors section
  const renderErrorsSection = useCallback(() => {
    if (!validationResults?.errors.length) return null;

    return (
      <View style={styles.errorsContainer}>
        <Text style={styles.sectionTitle}>❌ Validation Errors</Text>
        {validationResults.errors.map((error, index) => (
          <TouchableOpacity
            key={`error-${index}`}
            style={[
              styles.errorItem,
              error.severity === 'critical' && styles.criticalError,
              error.severity === 'major' && styles.majorError,
            ]}
            onPress={() => handleErrorPress(error)}
            accessibilityRole="button"
            accessibilityLabel={`Error: ${error.message}`}
            accessibilityHint="Tap for error details"
          >
            <View style={styles.errorHeader}>
              <Text style={styles.errorCode}>{error.code}</Text>
              <Text style={[
                styles.errorSeverity,
                error.severity === 'critical' && styles.criticalSeverityText,
                error.severity === 'major' && styles.majorSeverityText,
              ]}>
                {error.severity.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.errorMessage}>{error.message}</Text>
            {error.affectedPlayers.length > 0 && (
              <Text style={styles.affectedPlayers}>
                Affects: {error.affectedPlayers.join(', ')}
              </Text>
            )}
            {error.suggestedFix && (
              <Text style={styles.suggestedFix}>💡 {error.suggestedFix}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  }, [validationResults, handleErrorPress]);

  // Render warnings section
  const renderWarningsSection = useCallback(() => {
    if (!validationResults?.warnings.length) return null;

    return (
      <View style={styles.warningsContainer}>
        <Text style={styles.sectionTitle}>⚠️ Validation Warnings</Text>
        {validationResults.warnings.map((warning, index) => (
          <TouchableOpacity
            key={`warning-${index}`}
            style={styles.warningItem}
            onPress={() => handleWarningPress(warning)}
            accessibilityRole="button"
            accessibilityLabel={`Warning: ${warning.message}`}
            accessibilityHint="Tap for warning details"
          >
            <View style={styles.warningHeader}>
              <Text style={styles.warningCode}>{warning.code}</Text>
              <Text style={[
                styles.canProceedBadge,
                warning.canProceed ? styles.canProceedTrue : styles.canProceedFalse,
              ]}>
                {warning.canProceed ? 'CAN PROCEED' : 'BLOCKS SETTLEMENT'}
              </Text>
            </View>
            <Text style={styles.warningMessage}>{warning.message}</Text>
            {warning.affectedPlayers.length > 0 && (
              <Text style={styles.affectedPlayers}>
                Affects: {warning.affectedPlayers.join(', ')}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  }, [validationResults, handleWarningPress]);

  // Render audit trail section
  const renderAuditTrailSection = useCallback(() => {
    if (!showDetailedBreakdown || !validationResults?.auditTrail?.length) return null;

    return (
      <View style={styles.auditContainer}>
        <Text style={styles.sectionTitle}>📋 Validation Audit Trail</Text>
        {validationResults.auditTrail.map((step, index) => (
          <TouchableOpacity
            key={`audit-${step.step}`}
            style={[
              styles.auditItem,
              step.validationCheck ? styles.validAuditItem : styles.invalidAuditItem,
            ]}
            onPress={() => handleAuditStepPress(step)}
            accessibilityRole="button"
            accessibilityLabel={`Audit step ${step.step}: ${step.operation}`}
            accessibilityHint="Tap for step details"
          >
            <View style={styles.auditHeader}>
              <Text style={styles.auditStepNumber}>Step {step.step}</Text>
              <Text style={[
                styles.auditValidation,
                step.validationCheck ? styles.validCheck : styles.invalidCheck,
              ]}>
                {step.validationCheck ? '✓' : '✗'}
              </Text>
            </View>
            <Text style={styles.auditOperation}>{step.operation}</Text>
            <Text style={styles.auditTimestamp}>
              {new Date(step.timestamp).toLocaleTimeString()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }, [showDetailedBreakdown, validationResults, handleAuditStepPress]);

  // Render mathematical balance section
  const renderMathematicalBalance = useCallback(() => {
    if (!settlement?.mathematicalProof || !showDetailedBreakdown) return null;

    const proof = settlement.mathematicalProof;

    return (
      <View style={styles.balanceContainer}>
        <Text style={styles.sectionTitle}>🔢 Mathematical Balance</Text>
        
        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>Total Debits:</Text>
          <Text style={styles.balanceValue}>
            {formatCurrency(proof.totalDebits)}
          </Text>
        </View>
        
        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>Total Credits:</Text>
          <Text style={styles.balanceValue}>
            {formatCurrency(proof.totalCredits)}
          </Text>
        </View>
        
        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>Net Balance:</Text>
          <Text style={[
            styles.balanceValue,
            { color: proof.isBalanced ? '#4CAF50' : '#F44336' }
          ]}>
            {formatCurrency(proof.netBalance)}
          </Text>
        </View>
        
        <View style={styles.balanceStatus}>
          <Text style={[
            styles.balanceStatusText,
            { color: proof.isBalanced ? '#4CAF50' : '#F44336' }
          ]}>
            {proof.isBalanced ? '✓ Mathematically Balanced' : '✗ Mathematical Imbalance Detected'}
          </Text>
        </View>
      </View>
    );
  }, [settlement, showDetailedBreakdown, formatCurrency]);

  // Show loading state if no settlement
  if (!settlement) {
    return (
      <View style={styles.container} accessibilityLabel={accessibilityLabel}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1976D2" />
          <Text style={styles.loadingText}>Waiting for Settlement...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      accessibilityLabel={accessibilityLabel}
      refreshControl={
        enableRealTimeValidation ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#1976D2']}
            tintColor="#1976D2"
          />
        ) : undefined
      }
    >
      {/* Status Header */}
      {renderStatusHeader()}

      {/* Validation Summary */}
      {renderValidationSummary()}

      {/* Mathematical Balance */}
      {renderMathematicalBalance()}

      {/* Errors Section */}
      {renderErrorsSection()}

      {/* Warnings Section */}
      {renderWarningsSection()}

      {/* Audit Trail Section */}
      {renderAuditTrailSection()}

      {/* Empty State */}
      {!validationResults && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>⏳</Text>
          <Text style={styles.emptyStateTitle}>Validation in Progress</Text>
          <Text style={styles.emptyStateText}>
            Settlement validation is being performed to ensure mathematical accuracy.
          </Text>
        </View>
      )}
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

  statusHeader: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  statusIcon: {
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 12,
  },

  statusContent: {
    flex: 1,
  },

  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },

  statusSubtitle: {
    fontSize: 14,
    color: '#666',
  },

  summaryContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
    marginBottom: 8,
  },

  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },

  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },

  errorsContainer: {
    marginBottom: 16,
  },

  errorItem: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },

  criticalError: {
    backgroundColor: '#FFCDD2',
    borderLeftColor: '#D32F2F',
  },

  majorError: {
    backgroundColor: '#FFE0B2',
    borderLeftColor: '#F57C00',
  },

  errorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },

  errorCode: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'monospace',
  },

  errorSeverity: {
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    color: '#FFFFFF',
    backgroundColor: '#F44336',
  },

  criticalSeverityText: {
    backgroundColor: '#D32F2F',
  },

  majorSeverityText: {
    backgroundColor: '#F57C00',
  },

  errorMessage: {
    fontSize: 14,
    color: '#C62828',
    marginBottom: 4,
    lineHeight: 18,
  },

  affectedPlayers: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },

  suggestedFix: {
    fontSize: 12,
    color: '#2E7D32',
    fontStyle: 'italic',
  },

  warningsContainer: {
    marginBottom: 16,
  },

  warningItem: {
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },

  warningHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },

  warningCode: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'monospace',
  },

  canProceedBadge: {
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    color: '#FFFFFF',
  },

  canProceedTrue: {
    backgroundColor: '#4CAF50',
  },

  canProceedFalse: {
    backgroundColor: '#F44336',
  },

  warningMessage: {
    fontSize: 14,
    color: '#E65100',
    marginBottom: 4,
    lineHeight: 18,
  },

  auditContainer: {
    marginBottom: 16,
  },

  auditItem: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
  },

  validAuditItem: {
    borderLeftColor: '#4CAF50',
  },

  invalidAuditItem: {
    borderLeftColor: '#F44336',
  },

  auditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },

  auditStepNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },

  auditValidation: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  validCheck: {
    color: '#4CAF50',
  },

  invalidCheck: {
    color: '#F44336',
  },

  auditOperation: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },

  auditTimestamp: {
    fontSize: 12,
    color: '#666',
  },

  balanceContainer: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },

  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  balanceLabel: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
  },

  balanceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B5E20',
  },

  balanceStatus: {
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#C8E6C9',
  },

  balanceStatusText: {
    fontSize: 14,
    fontWeight: '600',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },

  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },

  emptyState: {
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