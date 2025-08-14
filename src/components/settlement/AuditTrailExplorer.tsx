/**
 * Audit Trail Explorer Component - Epic 3: Settlement Optimization
 * Story 3.3: Settlement Validation and Verification - Task 5
 * 
 * React Native component for interactive exploration of settlement audit trails with drill-down capabilities
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  AccessibilityInfo,
  Animated,
} from 'react-native';
import { 
  SettlementAuditEntry, 
  ProofStep,
  MathematicalProof,
  OptimizedSettlement 
} from '../../types/settlement';

interface AuditTrailExplorerProps {
  auditTrail: SettlementAuditEntry[];
  mathematicalProof?: MathematicalProof | null;
  settlement?: OptimizedSettlement | null;
  onStepSelect?: (step: SettlementAuditEntry) => void;
  onProofStepSelect?: (step: ProofStep) => void;
  onExportAuditTrail?: () => void;
  showTechnicalDetails?: boolean;
  enableStepByStep?: boolean;
  accessibilityLabel?: string;
}

export const AuditTrailExplorer: React.FC<AuditTrailExplorerProps> = ({
  auditTrail,
  mathematicalProof,
  onStepSelect,
  onProofStepSelect,
  onExportAuditTrail,
  showTechnicalDetails = false,
  enableStepByStep = true,
  accessibilityLabel = 'Audit Trail Explorer',
}) => {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  const [selectedStep, setSelectedStep] = useState<SettlementAuditEntry | null>(null);
  const [showStepModal, setShowStepModal] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isStepByStepMode, setIsStepByStepMode] = useState(false);
  const [animationValues] = useState(new Map<number, Animated.Value>());

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

  // Format JSON helper
  const formatJSON = useCallback((obj: any): string => {
    if (typeof obj === 'object' && obj !== null) {
      return JSON.stringify(obj, null, 2);
    }
    return String(obj);
  }, []);

  // Get steps up to current index for step-by-step mode
  const visibleSteps = useMemo(() => {
    if (!isStepByStepMode) return auditTrail;
    return auditTrail.slice(0, currentStepIndex + 1);
  }, [auditTrail, isStepByStepMode, currentStepIndex]);

  // Get step validation status
  const getStepStatus = useCallback((step: SettlementAuditEntry): 'success' | 'warning' | 'error' => {
    if (!step.validationCheck) return 'error';
    
    // Check if this step has any concerning outputs
    if (step.output && typeof step.output === 'object') {
      const hasErrors = Object.values(step.output).some(value => 
        typeof value === 'string' && value.toLowerCase().includes('error')
      );
      if (hasErrors) return 'warning';
    }
    
    return 'success';
  }, []);

  // Get step status color
  const getStatusColor = useCallback((status: string): string => {
    switch (status) {
      case 'success': return '#4CAF50';
      case 'warning': return '#FF9800';
      case 'error': return '#F44336';
      default: return '#9E9E9E';
    }
  }, []);

  // Get step status icon
  const getStatusIcon = useCallback((status: string): string => {
    switch (status) {
      case 'success': return '✓';
      case 'warning': return '⚠';
      case 'error': return '✗';
      default: return '?';
    }
  }, []);

  // Toggle step expansion
  const toggleStepExpansion = useCallback((stepNumber: number) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepNumber)) {
        newSet.delete(stepNumber);
      } else {
        newSet.add(stepNumber);
      }
      return newSet;
    });
  }, []);

  // Handle step selection
  const handleStepPress = useCallback((step: SettlementAuditEntry) => {
    setSelectedStep(step);
    setShowStepModal(true);
    if (onStepSelect) {
      AccessibilityInfo.announceForAccessibility(`Selected audit step: ${step.operation}`);
      onStepSelect(step);
    }
  }, [onStepSelect]);

  // Handle step-by-step navigation
  const handleNextStep = useCallback(() => {
    if (currentStepIndex < auditTrail.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      
      // Animate the new step
      if (!animationValues.has(nextIndex)) {
        const animValue = new Animated.Value(0);
        animationValues.set(nextIndex, animValue);
        
        Animated.spring(animValue, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
      }
      
      AccessibilityInfo.announceForAccessibility(`Step ${nextIndex + 1}: ${auditTrail[nextIndex].operation}`);
    }
  }, [currentStepIndex, auditTrail, animationValues]);

  const handlePrevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      AccessibilityInfo.announceForAccessibility(`Step ${prevIndex + 1}: ${auditTrail[prevIndex].operation}`);
    }
  }, [currentStepIndex, auditTrail]);

  // Toggle step-by-step mode
  const toggleStepByStepMode = useCallback(() => {
    setIsStepByStepMode(prev => {
      const newMode = !prev;
      if (newMode) {
        setCurrentStepIndex(0);
        setExpandedSteps(new Set());
        AccessibilityInfo.announceForAccessibility('Step-by-step mode enabled');
      } else {
        AccessibilityInfo.announceForAccessibility('Step-by-step mode disabled');
      }
      return newMode;
    });
  }, []);

  // Handle export
  const handleExport = useCallback(() => {
    if (onExportAuditTrail) {
      onExportAuditTrail();
    } else {
      Alert.alert(
        'Export Audit Trail',
        'Export functionality not implemented in this demo.',
        [{ text: 'OK' }]
      );
    }
  }, [onExportAuditTrail]);

  // Render audit trail header
  const renderAuditHeader = useCallback(() => {
    const validSteps = auditTrail.filter(step => step.validationCheck).length;
    const totalSteps = auditTrail.length;

    return (
      <View style={styles.auditHeader}>
        <View style={styles.headerInfo}>
          <Text style={styles.auditTitle}>Settlement Audit Trail</Text>
          <Text style={styles.auditSummary}>
            {validSteps}/{totalSteps} steps validated
          </Text>
        </View>
        <View style={styles.headerControls}>
          {enableStepByStep && (
            <TouchableOpacity
              style={[
                styles.controlButton,
                isStepByStepMode && styles.controlButtonActive,
              ]}
              onPress={toggleStepByStepMode}
              accessibilityRole="button"
              accessibilityLabel="Toggle step-by-step mode"
            >
              <Text style={[
                styles.controlButtonText,
                isStepByStepMode && styles.controlButtonTextActive,
              ]}>
                Step-by-step
              </Text>
            </TouchableOpacity>
          )}
          {onExportAuditTrail && (
            <TouchableOpacity
              style={styles.controlButton}
              onPress={handleExport}
              accessibilityRole="button"
              accessibilityLabel="Export audit trail"
            >
              <Text style={styles.controlButtonText}>Export</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }, [auditTrail, enableStepByStep, isStepByStepMode, toggleStepByStepMode, onExportAuditTrail, handleExport]);

  // Render step-by-step controls
  const renderStepByStepControls = useCallback(() => {
    if (!isStepByStepMode) return null;

    return (
      <View style={styles.stepByStepControls}>
        <TouchableOpacity
          style={[
            styles.navButton,
            currentStepIndex === 0 && styles.navButtonDisabled,
          ]}
          onPress={handlePrevStep}
          disabled={currentStepIndex === 0}
          accessibilityRole="button"
          accessibilityLabel="Previous step"
        >
          <Text style={[
            styles.navButtonText,
            currentStepIndex === 0 && styles.navButtonTextDisabled,
          ]}>
            ← Previous
          </Text>
        </TouchableOpacity>
        
        <View style={styles.stepCounter}>
          <Text style={styles.stepCounterText}>
            Step {currentStepIndex + 1} of {auditTrail.length}
          </Text>
        </View>
        
        <TouchableOpacity
          style={[
            styles.navButton,
            currentStepIndex === auditTrail.length - 1 && styles.navButtonDisabled,
          ]}
          onPress={handleNextStep}
          disabled={currentStepIndex === auditTrail.length - 1}
          accessibilityRole="button"
          accessibilityLabel="Next step"
        >
          <Text style={[
            styles.navButtonText,
            currentStepIndex === auditTrail.length - 1 && styles.navButtonTextDisabled,
          ]}>
            Next →
          </Text>
        </TouchableOpacity>
      </View>
    );
  }, [isStepByStepMode, currentStepIndex, auditTrail.length, handlePrevStep, handleNextStep]);

  // Render individual audit step
  const renderAuditStep = useCallback((step: SettlementAuditEntry, index: number) => {
    const isExpanded = expandedSteps.has(step.step);
    const stepStatus = getStepStatus(step);
    const statusColor = getStatusColor(stepStatus);
    const statusIcon = getStatusIcon(stepStatus);
    const animValue = animationValues.get(index) || new Animated.Value(1);

    return (
      <Animated.View
        key={`step-${step.step}`}
        style={[
          styles.stepContainer,
          {
            opacity: animValue,
            transform: [{ scale: animValue }],
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.stepHeader,
            { borderLeftColor: statusColor },
          ]}
          onPress={() => toggleStepExpansion(step.step)}
          accessibilityRole="button"
          accessibilityLabel={`Audit step ${step.step}: ${step.operation}`}
          accessibilityHint="Tap to expand or collapse"
        >
          <View style={styles.stepInfo}>
            <View style={styles.stepTitleRow}>
              <Text style={styles.stepNumber}>Step {step.step}</Text>
              <Text style={[styles.stepStatus, { color: statusColor }]}>
                {statusIcon}
              </Text>
            </View>
            <Text style={styles.stepOperation}>{step.operation}</Text>
            <Text style={styles.stepTimestamp}>
              {formatTime(step.timestamp)}
            </Text>
          </View>
          <Text style={styles.expandIcon}>
            {isExpanded ? '▼' : '▶'}
          </Text>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.stepDetails}>
            {/* Input Details */}
            <View style={styles.detailSection}>
              <Text style={styles.detailTitle}>Input</Text>
              <View style={styles.detailContent}>
                {Object.entries(step.input).map(([key, value]) => (
                  <View key={key} style={styles.detailRow}>
                    <Text style={styles.detailKey}>{key}:</Text>
                    <Text style={styles.detailValue}>
                      {typeof value === 'number' && key.toLowerCase().includes('amount') 
                        ? formatCurrency(value as number)
                        : String(value)
                      }
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Output Details */}
            <View style={styles.detailSection}>
              <Text style={styles.detailTitle}>Output</Text>
              <View style={styles.detailContent}>
                {Object.entries(step.output).map(([key, value]) => (
                  <View key={key} style={styles.detailRow}>
                    <Text style={styles.detailKey}>{key}:</Text>
                    <Text style={styles.detailValue}>
                      {typeof value === 'number' && key.toLowerCase().includes('amount') 
                        ? formatCurrency(value as number)
                        : String(value)
                      }
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Validation Status */}
            <View style={styles.validationSection}>
              <Text style={[
                styles.validationText,
                { color: statusColor },
              ]}>
                {statusIcon} Validation {step.validationCheck ? 'Passed' : 'Failed'}
              </Text>
            </View>

            {/* Technical Details */}
            {showTechnicalDetails && (
              <View style={styles.technicalSection}>
                <Text style={styles.technicalTitle}>Technical Details</Text>
                <View style={styles.technicalContent}>
                  <Text style={styles.technicalText}>
                    Input: {formatJSON(step.input)}
                  </Text>
                  <Text style={styles.technicalText}>
                    Output: {formatJSON(step.output)}
                  </Text>
                </View>
              </View>
            )}

            {/* Actions */}
            <View style={styles.stepActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleStepPress(step)}
                accessibilityRole="button"
                accessibilityLabel="View step details"
              >
                <Text style={styles.actionButtonText}>View Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Animated.View>
    );
  }, [
    expandedSteps,
    animationValues,
    getStepStatus,
    getStatusColor,
    getStatusIcon,
    toggleStepExpansion,
    formatTime,
    formatCurrency,
    showTechnicalDetails,
    formatJSON,
    handleStepPress,
  ]);

  // Render mathematical proof correlation
  const renderProofCorrelation = useCallback(() => {
    if (!mathematicalProof?.calculationSteps?.length) return null;

    return (
      <View style={styles.proofSection}>
        <Text style={styles.proofTitle}>🔗 Mathematical Proof Correlation</Text>
        <Text style={styles.proofDescription}>
          This audit trail corresponds to {mathematicalProof.calculationSteps.length} mathematical proof steps.
        </Text>
        <TouchableOpacity
          style={styles.proofButton}
          onPress={() => {
            if (mathematicalProof.calculationSteps[0] && onProofStepSelect) {
              onProofStepSelect(mathematicalProof.calculationSteps[0]);
            }
          }}
          accessibilityRole="button"
          accessibilityLabel="View mathematical proof"
        >
          <Text style={styles.proofButtonText}>View Mathematical Proof</Text>
        </TouchableOpacity>
      </View>
    );
  }, [mathematicalProof, onProofStepSelect]);

  // Render step details modal
  const renderStepModal = useCallback(() => {
    if (!selectedStep) return null;

    return (
      <Modal
        visible={showStepModal}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowStepModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Step {selectedStep.step}: {selectedStep.operation}
            </Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowStepModal(false)}
              accessibilityRole="button"
              accessibilityLabel="Close step details"
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Operation</Text>
              <Text style={styles.modalSectionText}>{selectedStep.operation}</Text>
            </View>
            
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Timestamp</Text>
              <Text style={styles.modalSectionText}>{formatTime(selectedStep.timestamp)}</Text>
            </View>
            
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Input Data</Text>
              <View style={styles.modalDataContainer}>
                <Text style={styles.modalDataText}>{formatJSON(selectedStep.input)}</Text>
              </View>
            </View>
            
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Output Data</Text>
              <View style={styles.modalDataContainer}>
                <Text style={styles.modalDataText}>{formatJSON(selectedStep.output)}</Text>
              </View>
            </View>
            
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Validation Status</Text>
              <Text style={[
                styles.modalValidationText,
                { color: selectedStep.validationCheck ? '#4CAF50' : '#F44336' },
              ]}>
                {selectedStep.validationCheck ? '✓ Passed' : '✗ Failed'}
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  }, [selectedStep, showStepModal, formatTime, formatJSON]);

  // Show empty state if no audit trail
  if (!auditTrail.length) {
    return (
      <View style={styles.container} accessibilityLabel={accessibilityLabel}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>📋</Text>
          <Text style={styles.emptyStateTitle}>No Audit Trail Available</Text>
          <Text style={styles.emptyStateText}>
            Settlement calculations will generate an audit trail for transparency.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container} accessibilityLabel={accessibilityLabel}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Audit Header */}
        {renderAuditHeader()}

        {/* Step-by-Step Controls */}
        {renderStepByStepControls()}

        {/* Mathematical Proof Correlation */}
        {renderProofCorrelation()}

        {/* Audit Steps */}
        <View style={styles.stepsContainer}>
          {visibleSteps.map((step, index) => renderAuditStep(step, index))}
        </View>
      </ScrollView>

      {/* Step Details Modal */}
      {renderStepModal()}
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

  auditHeader: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  headerInfo: {
    flex: 1,
  },

  auditTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },

  auditSummary: {
    fontSize: 14,
    color: '#666',
  },

  headerControls: {
    flexDirection: 'row',
    gap: 8,
  },

  controlButton: {
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  controlButtonActive: {
    backgroundColor: '#1976D2',
  },

  controlButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },

  controlButtonTextActive: {
    color: '#FFFFFF',
  },

  stepByStepControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },

  navButton: {
    backgroundColor: '#1976D2',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  navButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },

  navButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  navButtonTextDisabled: {
    color: '#FFFFFF',
  },

  stepCounter: {
    alignItems: 'center',
  },

  stepCounterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },

  proofSection: {
    backgroundColor: '#E8F5E8',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
  },

  proofTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 8,
  },

  proofDescription: {
    fontSize: 14,
    color: '#388E3C',
    marginBottom: 12,
  },

  proofButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },

  proofButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  stepsContainer: {
    padding: 16,
  },

  stepContainer: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },

  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderLeftWidth: 4,
  },

  stepInfo: {
    flex: 1,
  },

  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },

  stepStatus: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  stepOperation: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },

  stepTimestamp: {
    fontSize: 12,
    color: '#666',
  },

  expandIcon: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },

  stepDetails: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },

  detailSection: {
    marginBottom: 12,
  },

  detailTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },

  detailContent: {
    backgroundColor: '#F8F8F8',
    borderRadius: 6,
    padding: 8,
  },

  detailRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },

  detailKey: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    minWidth: 80,
  },

  detailValue: {
    fontSize: 12,
    color: '#333',
    flex: 1,
  },

  validationSection: {
    alignItems: 'center',
    marginBottom: 12,
  },

  validationText: {
    fontSize: 14,
    fontWeight: '600',
  },

  technicalSection: {
    backgroundColor: '#F0F0F0',
    borderRadius: 6,
    padding: 8,
    marginBottom: 12,
  },

  technicalTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },

  technicalContent: {
    // Technical content styles
  },

  technicalText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#333',
    marginBottom: 4,
  },

  stepActions: {
    alignItems: 'center',
  },

  actionButton: {
    backgroundColor: '#1976D2',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
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

  modalSection: {
    marginBottom: 16,
  },

  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },

  modalSectionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },

  modalDataContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
    padding: 12,
  },

  modalDataText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#333',
    lineHeight: 16,
  },

  modalValidationText: {
    fontSize: 16,
    fontWeight: '600',
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