/**
 * Validation Warning Panel Component - Epic 3: Settlement Optimization
 * Story 3.3: Settlement Validation and Verification - Task 5
 * 
 * React Native component for displaying real-time settlement warnings and alerts
 */

import React, { useCallback, useMemo, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  AccessibilityInfo,
  Animated,
} from 'react-native';
import { 
  SettlementWarningExtended, 
  WarningClassification,
  ManualAdjustmentType,
  SettlementCorrection,
  RealTimeMonitoringState 
} from '../../types/settlement';

interface ValidationWarningPanelProps {
  warnings: SettlementWarningExtended[];
  monitoringState?: RealTimeMonitoringState;
  onWarningSelect?: (warning: SettlementWarningExtended) => void;
  onWarningResolve?: (warningId: string, resolution: string) => void;
  onWarningDismiss?: (warningId: string) => void;
  onCorrectionAccept?: (correction: SettlementCorrection) => void;
  onCorrectionReject?: (correctionId: string) => void;
  enableRealTimeMonitoring?: boolean;
  showResolvedWarnings?: boolean;
  accessibilityLabel?: string;
}

export const ValidationWarningPanel: React.FC<ValidationWarningPanelProps> = ({
  warnings,
  monitoringState,
  onWarningSelect,
  onWarningResolve,
  onWarningDismiss,
  onCorrectionAccept,
  onCorrectionReject,
  enableRealTimeMonitoring = true,
  showResolvedWarnings = false,
  accessibilityLabel = 'Validation Warning Panel',
}) => {
  const [expandedWarnings, setExpandedWarnings] = useState<Set<string>>(new Set());
  const [animationValues] = useState(new Map<string, Animated.Value>());
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Filter warnings based on resolved status
  const filteredWarnings = useMemo(() => {
    return warnings.filter(warning => showResolvedWarnings || !warning.isResolved);
  }, [warnings, showResolvedWarnings]);

  // Categorize warnings by severity
  const categorizedWarnings = useMemo(() => {
    const critical = filteredWarnings.filter(w => w.severity === WarningClassification.CRITICAL);
    const major = filteredWarnings.filter(w => w.severity === WarningClassification.MAJOR);
    const minor = filteredWarnings.filter(w => w.severity === WarningClassification.MINOR);
    
    return { critical, major, minor };
  }, [filteredWarnings]);

  // Get active warning count
  const activeWarningCount = useMemo(() => {
    return filteredWarnings.filter(w => !w.isResolved).length;
  }, [filteredWarnings]);

  // Update monitoring state
  useEffect(() => {
    setIsMonitoring(monitoringState?.isMonitoring || false);
  }, [monitoringState]);

  // Animate new warnings
  useEffect(() => {
    warnings.forEach(warning => {
      if (!animationValues.has(warning.warningId)) {
        const animValue = new Animated.Value(0);
        animationValues.set(warning.warningId, animValue);
        
        Animated.spring(animValue, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
      }
    });
  }, [warnings, animationValues]);

  // Format currency helper
  const formatCurrency = useCallback((amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }, []);

  // Format time helper
  const formatTime = useCallback((date: Date): string => {
    return new Date(date).toLocaleTimeString();
  }, []);

  // Toggle warning expansion
  const toggleWarningExpansion = useCallback((warningId: string) => {
    setExpandedWarnings(prev => {
      const newSet = new Set(prev);
      if (newSet.has(warningId)) {
        newSet.delete(warningId);
      } else {
        newSet.add(warningId);
      }
      return newSet;
    });
  }, []);

  // Handle warning selection
  const handleWarningPress = useCallback((warning: SettlementWarningExtended) => {
    toggleWarningExpansion(warning.warningId);
    if (onWarningSelect) {
      AccessibilityInfo.announceForAccessibility(`Selected warning: ${warning.message}`);
      onWarningSelect(warning);
    }
  }, [toggleWarningExpansion, onWarningSelect]);

  // Handle warning resolution
  const handleResolveWarning = useCallback((warningId: string) => {
    Alert.alert(
      'Resolve Warning',
      'How would you like to resolve this warning?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Mark as Resolved', onPress: () => {
          if (onWarningResolve) {
            onWarningResolve(warningId, 'manually_resolved');
            AccessibilityInfo.announceForAccessibility('Warning marked as resolved');
          }
        }},
      ]
    );
  }, [onWarningResolve]);

  // Handle warning dismissal
  const handleDismissWarning = useCallback((warningId: string) => {
    Alert.alert(
      'Dismiss Warning',
      'Are you sure you want to dismiss this warning? It will still appear in the history.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Dismiss', style: 'destructive', onPress: () => {
          if (onWarningDismiss) {
            onWarningDismiss(warningId);
            AccessibilityInfo.announceForAccessibility('Warning dismissed');
          }
        }},
      ]
    );
  }, [onWarningDismiss]);

  // Handle correction acceptance
  const handleAcceptCorrection = useCallback((correction: SettlementCorrection) => {
    Alert.alert(
      'Accept Correction',
      `Apply automatic correction: ${correction.description}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Accept', onPress: () => {
          if (onCorrectionAccept) {
            onCorrectionAccept(correction);
            AccessibilityInfo.announceForAccessibility('Correction accepted');
          }
        }},
      ]
    );
  }, [onCorrectionAccept]);

  // Handle correction rejection
  const handleRejectCorrection = useCallback((correctionId: string) => {
    if (onCorrectionReject) {
      onCorrectionReject(correctionId);
      AccessibilityInfo.announceForAccessibility('Correction rejected');
    }
  }, [onCorrectionReject]);

  // Get severity color
  const getSeverityColor = useCallback((severity: WarningClassification): string => {
    switch (severity) {
      case WarningClassification.CRITICAL: return '#D32F2F';
      case WarningClassification.MAJOR: return '#F57C00';
      case WarningClassification.MINOR: return '#1976D2';
      default: return '#9E9E9E';
    }
  }, []);

  // Get severity icon
  const getSeverityIcon = useCallback((severity: WarningClassification): string => {
    switch (severity) {
      case WarningClassification.CRITICAL: return '🚨';
      case WarningClassification.MAJOR: return '⚠️';
      case WarningClassification.MINOR: return 'ℹ️';
      default: return '❓';
    }
  }, []);

  // Get adjustment type label
  const getAdjustmentTypeLabel = useCallback((type: ManualAdjustmentType): string => {
    switch (type) {
      case ManualAdjustmentType.CHIP_COUNT_ADJUSTMENT: return 'Chip Count';
      case ManualAdjustmentType.BUY_IN_ADJUSTMENT: return 'Buy-in';
      case ManualAdjustmentType.CASH_OUT_ADJUSTMENT: return 'Cash-out';
      case ManualAdjustmentType.PLAYER_REMOVAL: return 'Player Removal';
      case ManualAdjustmentType.TRANSACTION_VOID: return 'Transaction Void';
      case ManualAdjustmentType.SETTLEMENT_OVERRIDE: return 'Settlement Override';
      default: return 'Unknown';
    }
  }, []);

  // Render monitoring status
  const renderMonitoringStatus = useCallback(() => {
    if (!enableRealTimeMonitoring) return null;

    return (
      <View style={styles.monitoringHeader}>
        <View style={styles.monitoringStatus}>
          <View style={[
            styles.monitoringIndicator,
            isMonitoring ? styles.monitoringActive : styles.monitoringInactive,
          ]} />
          <Text style={styles.monitoringText}>
            {isMonitoring ? 'Real-time Monitoring Active' : 'Monitoring Offline'}
          </Text>
        </View>
        {monitoringState?.lastCheckAt && (
          <Text style={styles.lastCheckText}>
            Last check: {formatTime(monitoringState.lastCheckAt)}
          </Text>
        )}
      </View>
    );
  }, [enableRealTimeMonitoring, isMonitoring, monitoringState, formatTime]);

  // Render warning summary
  const renderWarningSummary = useCallback(() => {
    if (filteredWarnings.length === 0) return null;

    return (
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Warning Summary</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryCount, { color: getSeverityColor(WarningClassification.CRITICAL) }]}>
              {categorizedWarnings.critical.length}
            </Text>
            <Text style={styles.summaryLabel}>Critical</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryCount, { color: getSeverityColor(WarningClassification.MAJOR) }]}>
              {categorizedWarnings.major.length}
            </Text>
            <Text style={styles.summaryLabel}>Major</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryCount, { color: getSeverityColor(WarningClassification.MINOR) }]}>
              {categorizedWarnings.minor.length}
            </Text>
            <Text style={styles.summaryLabel}>Minor</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryCount}>{activeWarningCount}</Text>
            <Text style={styles.summaryLabel}>Active</Text>
          </View>
        </View>
      </View>
    );
  }, [filteredWarnings, categorizedWarnings, activeWarningCount, getSeverityColor]);

  // Render individual warning
  const renderWarning = useCallback((warning: SettlementWarningExtended) => {
    const isExpanded = expandedWarnings.has(warning.warningId);
    const severityColor = getSeverityColor(warning.severity);
    const severityIcon = getSeverityIcon(warning.severity);
    const animValue = animationValues.get(warning.warningId) || new Animated.Value(1);

    return (
      <Animated.View
        key={warning.warningId}
        style={[
          styles.warningContainer,
          {
            borderLeftColor: severityColor,
            opacity: animValue,
            transform: [{ scale: animValue }],
          },
          warning.isResolved && styles.resolvedWarning,
        ]}
      >
        <TouchableOpacity
          onPress={() => handleWarningPress(warning)}
          accessibilityRole="button"
          accessibilityLabel={`${warning.severity} warning: ${warning.message}`}
          accessibilityHint="Tap to expand warning details"
        >
          <View style={styles.warningHeader}>
            <View style={styles.warningInfo}>
              <Text style={styles.warningIcon}>{severityIcon}</Text>
              <View style={styles.warningContent}>
                <View style={styles.warningTitleRow}>
                  <Text style={[styles.warningCode, { color: severityColor }]}>
                    {warning.code}
                  </Text>
                  <Text style={[
                    styles.severityBadge,
                    { backgroundColor: severityColor },
                  ]}>
                    {warning.severity.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.warningMessage}>{warning.message}</Text>
                <Text style={styles.warningTimestamp}>
                  {formatTime(warning.detectedAt)}
                </Text>
              </View>
            </View>
            <Text style={styles.expandIcon}>
              {isExpanded ? '▼' : '▶'}
            </Text>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.warningDetails}>
            {/* Affected Players */}
            {warning.affectedPlayers.length > 0 && (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Affected Players:</Text>
                <Text style={styles.detailValue}>
                  {warning.affectedPlayers.join(', ')}
                </Text>
              </View>
            )}

            {/* Balance Discrepancy */}
            {warning.balanceDiscrepancy !== 0 && (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Balance Discrepancy:</Text>
                <Text style={[
                  styles.detailValue,
                  { color: warning.balanceDiscrepancy > 0 ? '#4CAF50' : '#F44336' },
                ]}>
                  {formatCurrency(warning.balanceDiscrepancy)}
                </Text>
              </View>
            )}

            {/* Adjustment Details */}
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Adjustment Type:</Text>
              <Text style={styles.detailValue}>
                {getAdjustmentTypeLabel(warning.adjustmentType)}
              </Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Value Change:</Text>
              <Text style={styles.detailValue}>
                {formatCurrency(warning.originalValue)} → {formatCurrency(warning.adjustedValue)}
              </Text>
            </View>

            {/* Detection Method */}
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Detection Method:</Text>
              <Text style={styles.detailValue}>
                {warning.detectionMethod.replace('_', ' ').toUpperCase()}
              </Text>
            </View>

            {/* Auto Correction */}
            {warning.autoCorrection && (
              <View style={styles.correctionContainer}>
                <Text style={styles.correctionTitle}>🔧 Automatic Correction Available</Text>
                <Text style={styles.correctionDescription}>
                  {warning.autoCorrection.description}
                </Text>
                <Text style={styles.correctionImpact}>
                  Estimated Impact: {formatCurrency(warning.autoCorrection.estimatedImpact)}
                </Text>
                <View style={styles.correctionActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.acceptButton]}
                    onPress={() => handleAcceptCorrection(warning.autoCorrection!)}
                    accessibilityRole="button"
                    accessibilityLabel="Accept automatic correction"
                  >
                    <Text style={styles.actionButtonText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleRejectCorrection(warning.autoCorrection!.correctionId)}
                    accessibilityRole="button"
                    accessibilityLabel="Reject automatic correction"
                  >
                    <Text style={styles.actionButtonText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Suggested Actions */}
            {warning.suggestedActions.length > 0 && (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Suggested Actions:</Text>
                {warning.suggestedActions.map((action, index) => (
                  <Text key={index} style={styles.suggestionText}>
                    • {action}
                  </Text>
                ))}
              </View>
            )}

            {/* Warning Actions */}
            <View style={styles.warningActions}>
              {!warning.isResolved && warning.canProceed && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.resolveButton]}
                  onPress={() => handleResolveWarning(warning.warningId)}
                  accessibilityRole="button"
                  accessibilityLabel="Resolve warning"
                >
                  <Text style={styles.actionButtonText}>Resolve</Text>
                </TouchableOpacity>
              )}
              {!warning.isResolved && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.dismissButton]}
                  onPress={() => handleDismissWarning(warning.warningId)}
                  accessibilityRole="button"
                  accessibilityLabel="Dismiss warning"
                >
                  <Text style={styles.actionButtonText}>Dismiss</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </Animated.View>
    );
  }, [
    expandedWarnings,
    animationValues,
    getSeverityColor,
    getSeverityIcon,
    handleWarningPress,
    formatTime,
    formatCurrency,
    getAdjustmentTypeLabel,
    handleAcceptCorrection,
    handleRejectCorrection,
    handleResolveWarning,
    handleDismissWarning,
  ]);

  // Render empty state
  const renderEmptyState = useCallback(() => {
    if (filteredWarnings.length > 0) return null;

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateIcon}>✅</Text>
        <Text style={styles.emptyStateTitle}>No Active Warnings</Text>
        <Text style={styles.emptyStateText}>
          All settlement validations are passing. 
          {enableRealTimeMonitoring && isMonitoring && (
            '\nReal-time monitoring is active.'
          )}
        </Text>
      </View>
    );
  }, [filteredWarnings, enableRealTimeMonitoring, isMonitoring]);

  return (
    <View style={styles.container} accessibilityLabel={accessibilityLabel}>
      {/* Monitoring Status */}
      {renderMonitoringStatus()}

      {/* Warning Summary */}
      {renderWarningSummary()}

      {/* Warnings List */}
      <ScrollView style={styles.warningsScroll} showsVerticalScrollIndicator={false}>
        {/* Critical Warnings */}
        {categorizedWarnings.critical.map(renderWarning)}
        
        {/* Major Warnings */}
        {categorizedWarnings.major.map(renderWarning)}
        
        {/* Minor Warnings */}
        {categorizedWarnings.minor.map(renderWarning)}
        
        {/* Empty State */}
        {renderEmptyState()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  monitoringHeader: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },

  monitoringStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  monitoringIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },

  monitoringActive: {
    backgroundColor: '#4CAF50',
  },

  monitoringInactive: {
    backgroundColor: '#F44336',
  },

  monitoringText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },

  lastCheckText: {
    fontSize: 12,
    color: '#666',
  },

  summaryContainer: {
    backgroundColor: '#FAFAFA',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },

  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },

  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  summaryItem: {
    alignItems: 'center',
  },

  summaryCount: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },

  summaryLabel: {
    fontSize: 12,
    color: '#666',
  },

  warningsScroll: {
    flex: 1,
  },

  warningContainer: {
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 4,
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },

  resolvedWarning: {
    opacity: 0.6,
  },

  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },

  warningInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },

  warningIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },

  warningContent: {
    flex: 1,
  },

  warningTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  warningCode: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'monospace',
    marginRight: 8,
  },

  severityBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },

  warningMessage: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
    lineHeight: 18,
  },

  warningTimestamp: {
    fontSize: 12,
    color: '#666',
  },

  expandIcon: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },

  warningDetails: {
    padding: 12,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },

  detailSection: {
    marginBottom: 8,
  },

  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 2,
  },

  detailValue: {
    fontSize: 14,
    color: '#333',
  },

  suggestionText: {
    fontSize: 12,
    color: '#2E7D32',
    marginLeft: 8,
    lineHeight: 16,
  },

  correctionContainer: {
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },

  correctionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 4,
  },

  correctionDescription: {
    fontSize: 12,
    color: '#388E3C',
    marginBottom: 4,
  },

  correctionImpact: {
    fontSize: 12,
    color: '#1B5E20',
    fontWeight: '500',
    marginBottom: 8,
  },

  correctionActions: {
    flexDirection: 'row',
    gap: 8,
  },

  warningActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },

  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },

  acceptButton: {
    backgroundColor: '#4CAF50',
  },

  rejectButton: {
    backgroundColor: '#F44336',
  },

  resolveButton: {
    backgroundColor: '#1976D2',
  },

  dismissButton: {
    backgroundColor: '#757575',
  },

  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  emptyState: {
    alignItems: 'center',
    padding: 48,
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