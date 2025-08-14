/**
 * Mathematical Proof Viewer Component - Epic 3: Settlement Optimization
 * Story 3.3: Settlement Validation and Verification - Task 5
 * 
 * React Native component for viewing mathematical settlement proofs with interactive exploration
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  AccessibilityInfo,
  Modal,
} from 'react-native';
import { 
  MathematicalProof, 
  ProofStep, 
  AlgorithmVerification,
  ProofExportFormat 
} from '../../types/settlement';

interface MathematicalProofViewerProps {
  proof: MathematicalProof | null;
  onExportProof?: (format: ProofExportFormat) => void;
  onStepSelect?: (step: ProofStep) => void;
  onAlgorithmSelect?: (algorithm: AlgorithmVerification) => void;
  showExportOptions?: boolean;
  showTechnicalDetails?: boolean;
  accessibilityLabel?: string;
}

export const MathematicalProofViewer: React.FC<MathematicalProofViewerProps> = ({
  proof,
  onExportProof,
  onStepSelect,
  onAlgorithmSelect,
  showExportOptions = true,
  showTechnicalDetails = false,
  accessibilityLabel = 'Mathematical Proof Viewer',
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [selectedExportFormat] = useState<ProofExportFormat | null>(null);
  const [showExportModal] = useState(false);
  const [showStepDetails, setShowStepDetails] = useState<ProofStep | null>(null);

  // Format currency helper
  const formatCurrency = useCallback((amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }, []);

  // Format time helper
  const formatTime = useCallback((date: Date): string => {
    return new Date(date).toLocaleString();
  }, []);

  // Toggle section expansion
  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  // Handle step selection
  const handleStepPress = useCallback((step: ProofStep) => {
    setShowStepDetails(step);
    if (onStepSelect) {
      AccessibilityInfo.announceForAccessibility(`Selected calculation step: ${step.operation}`);
      onStepSelect(step);
    }
  }, [onStepSelect]);

  // Handle algorithm selection
  const handleAlgorithmPress = useCallback((algorithm: AlgorithmVerification) => {
    if (onAlgorithmSelect) {
      AccessibilityInfo.announceForAccessibility(`Selected algorithm: ${algorithm.algorithmName}`);
      onAlgorithmSelect(algorithm);
    }
  }, [onAlgorithmSelect]);

  // Handle export
  const handleExport = useCallback((format: ProofExportFormat) => {
    if (onExportProof) {
      onExportProof(format);
      // setShowExportModal(false); // Modal state removed
      AccessibilityInfo.announceForAccessibility(`Exporting proof in ${format} format`);
    }
  }, [onExportProof]);

  // Handle share
  const handleShare = useCallback(async () => {
    if (!proof) return;

    try {
      await Share.share({
        title: 'Settlement Mathematical Proof',
        message: proof.exportFormats.text,
      });
    } catch (error) {
      Alert.alert('Share Error', 'Unable to share the proof.');
    }
  }, [proof]);

  // Get verification status color
  const getVerificationColor = useCallback((isValid: boolean): string => {
    return isValid ? '#4CAF50' : '#F44336';
  }, []);

  // Get verification icon
  const getVerificationIcon = useCallback((isValid: boolean): string => {
    return isValid ? '✓' : '✗';
  }, []);

  // Render proof header
  const renderProofHeader = useCallback(() => {
    if (!proof) return null;

    return (
      <View style={styles.proofHeader}>
        <View style={styles.headerInfo}>
          <Text style={styles.proofTitle}>Mathematical Proof</Text>
          <Text style={styles.proofId}>ID: {proof.proofId}</Text>
          <Text style={styles.proofTimestamp}>
            Generated: {formatTime(proof.generatedAt)}
          </Text>
        </View>
        <View style={[
          styles.validityBadge,
          { backgroundColor: getVerificationColor(proof.isValid) },
        ]}>
          <Text style={styles.validityIcon}>
            {getVerificationIcon(proof.isValid)}
          </Text>
          <Text style={styles.validityText}>
            {proof.isValid ? 'VALID' : 'INVALID'}
          </Text>
        </View>
      </View>
    );
  }, [proof, formatTime, getVerificationColor, getVerificationIcon]);

  // Render balance verification
  const renderBalanceVerification = useCallback(() => {
    if (!proof?.balanceVerification) return null;

    const balance = proof.balanceVerification;
    const isExpanded = expandedSections.has('balance');

    return (
      <View style={styles.sectionContainer}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection('balance')}
          accessibilityRole="button"
          accessibilityLabel="Balance verification section"
          accessibilityHint="Tap to expand or collapse"
        >
          <Text style={styles.sectionTitle}>🔢 Balance Verification</Text>
          <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.sectionContent}>
            <View style={styles.balanceGrid}>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceLabel}>Total Debits</Text>
                <Text style={styles.balanceValue}>
                  {formatCurrency(balance.totalDebits)}
                </Text>
              </View>
              
              <View style={styles.balanceItem}>
                <Text style={styles.balanceLabel}>Total Credits</Text>
                <Text style={styles.balanceValue}>
                  {formatCurrency(balance.totalCredits)}
                </Text>
              </View>
              
              <View style={styles.balanceItem}>
                <Text style={styles.balanceLabel}>Net Balance</Text>
                <Text style={[
                  styles.balanceValue,
                  { color: getVerificationColor(balance.isBalanced) },
                ]}>
                  {formatCurrency(balance.netBalance)}
                </Text>
              </View>
              
              <View style={styles.balanceItem}>
                <Text style={styles.balanceLabel}>Precision</Text>
                <Text style={styles.balanceValue}>
                  {balance.precision} decimals
                </Text>
              </View>
            </View>
            
            <View style={styles.balanceStatus}>
              <Text style={[
                styles.balanceStatusText,
                { color: getVerificationColor(balance.isBalanced) },
              ]}>
                {getVerificationIcon(balance.isBalanced)} {balance.isBalanced ? 'Balanced' : 'Imbalanced'}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  }, [proof, expandedSections, toggleSection, formatCurrency, getVerificationColor, getVerificationIcon]);

  // Render calculation steps
  const renderCalculationSteps = useCallback(() => {
    if (!proof?.calculationSteps?.length) return null;

    const isExpanded = expandedSections.has('steps');

    return (
      <View style={styles.sectionContainer}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection('steps')}
          accessibilityRole="button"
          accessibilityLabel="Calculation steps section"
          accessibilityHint="Tap to expand or collapse"
        >
          <Text style={styles.sectionTitle}>📊 Calculation Steps</Text>
          <Text style={styles.sectionSubtitle}>({proof.calculationSteps.length} steps)</Text>
          <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.sectionContent}>
            {proof.calculationSteps.map((step) => (
              <TouchableOpacity
                key={`step-${step.stepNumber}`}
                style={[
                  styles.stepItem,
                  step.verification ? styles.validStep : styles.invalidStep,
                ]}
                onPress={() => handleStepPress(step)}
                accessibilityRole="button"
                accessibilityLabel={`Step ${step.stepNumber}: ${step.operation}`}
                accessibilityHint="Tap for step details"
              >
                <View style={styles.stepHeader}>
                  <Text style={styles.stepNumber}>Step {step.stepNumber}</Text>
                  <Text style={[
                    styles.stepVerification,
                    { color: getVerificationColor(step.verification) },
                  ]}>
                    {getVerificationIcon(step.verification)}
                  </Text>
                </View>
                
                <Text style={styles.stepOperation}>{step.operation}</Text>
                <Text style={styles.stepDescription}>{step.description}</Text>
                
                {showTechnicalDetails && (
                  <View style={styles.stepTechnical}>
                    <Text style={styles.stepFormula}>{step.calculation}</Text>
                    <Text style={styles.stepResult}>
                      Result: {formatCurrency(step.result)} (±{step.tolerance})
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  }, [proof, expandedSections, toggleSection, handleStepPress, showTechnicalDetails, getVerificationColor, getVerificationIcon, formatCurrency]);

  // Render precision analysis
  const renderPrecisionAnalysis = useCallback(() => {
    if (!proof?.precisionAnalysis) return null;

    const precision = proof.precisionAnalysis;
    const isExpanded = expandedSections.has('precision');

    return (
      <View style={styles.sectionContainer}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection('precision')}
          accessibilityRole="button"
          accessibilityLabel="Precision analysis section"
          accessibilityHint="Tap to expand or collapse"
        >
          <Text style={styles.sectionTitle}>🎯 Precision Analysis</Text>
          <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.sectionContent}>
            <View style={styles.precisionGrid}>
              <View style={styles.precisionItem}>
                <Text style={styles.precisionLabel}>Original Precision</Text>
                <Text style={styles.precisionValue}>{precision.originalPrecision}</Text>
              </View>
              
              <View style={styles.precisionItem}>
                <Text style={styles.precisionLabel}>Calculated Precision</Text>
                <Text style={styles.precisionValue}>{precision.calculatedPrecision}</Text>
              </View>
              
              <View style={styles.precisionItem}>
                <Text style={styles.precisionLabel}>Precision Loss</Text>
                <Text style={styles.precisionValue}>{precision.precisionLoss.toFixed(6)}</Text>
              </View>
              
              <View style={styles.precisionItem}>
                <Text style={styles.precisionLabel}>Within Tolerance</Text>
                <Text style={[
                  styles.precisionValue,
                  { color: getVerificationColor(precision.isWithinTolerance) },
                ]}>
                  {getVerificationIcon(precision.isWithinTolerance)}
                </Text>
              </View>
            </View>
            
            {precision.roundingOperations.length > 0 && (
              <View style={styles.roundingContainer}>
                <Text style={styles.roundingTitle}>Rounding Operations</Text>
                {precision.roundingOperations.slice(0, 3).map((operation, index) => (
                  <View key={index} style={styles.roundingItem}>
                    <Text style={styles.roundingOperation}>{operation.operation}</Text>
                    <Text style={styles.roundingValues}>
                      {formatCurrency(operation.originalValue)} → {formatCurrency(operation.roundedValue)}
                    </Text>
                  </View>
                ))}
                {precision.roundingOperations.length > 3 && (
                  <Text style={styles.roundingMore}>
                    +{precision.roundingOperations.length - 3} more operations
                  </Text>
                )}
              </View>
            )}
            
            {precision.fractionalCentIssues.length > 0 && (
              <View style={styles.fractionalContainer}>
                <Text style={styles.fractionalTitle}>⚠️ Fractional Cent Issues</Text>
                {precision.fractionalCentIssues.map((issue, index) => (
                  <View key={index} style={styles.fractionalItem}>
                    <Text style={styles.fractionalPlayer}>{issue.playerName}</Text>
                    <Text style={styles.fractionalAmount}>
                      {formatCurrency(issue.originalAmount)} → {formatCurrency(issue.adjustedAmount)}
                    </Text>
                    <Text style={styles.fractionalReason}>{issue.adjustmentReason}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    );
  }, [proof, expandedSections, toggleSection, getVerificationColor, getVerificationIcon, formatCurrency]);

  // Render algorithm verification
  const renderAlgorithmVerification = useCallback(() => {
    if (!proof?.alternativeAlgorithmResults?.length) return null;

    const isExpanded = expandedSections.has('algorithms');

    return (
      <View style={styles.sectionContainer}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection('algorithms')}
          accessibilityRole="button"
          accessibilityLabel="Algorithm verification section"
          accessibilityHint="Tap to expand or collapse"
        >
          <Text style={styles.sectionTitle}>🧮 Algorithm Verification</Text>
          <Text style={styles.sectionSubtitle}>({proof.alternativeAlgorithmResults.length} algorithms)</Text>
          <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.sectionContent}>
            {proof.alternativeAlgorithmResults.map((algorithm, index) => (
              <TouchableOpacity
                key={`algorithm-${index}`}
                style={[
                  styles.algorithmItem,
                  algorithm.verificationResult ? styles.validAlgorithm : styles.invalidAlgorithm,
                ]}
                onPress={() => handleAlgorithmPress(algorithm)}
                accessibilityRole="button"
                accessibilityLabel={`Algorithm: ${algorithm.algorithmName}`}
                accessibilityHint="Tap for algorithm details"
              >
                <View style={styles.algorithmHeader}>
                  <Text style={styles.algorithmName}>{algorithm.algorithmName}</Text>
                  <Text style={[
                    styles.algorithmVerification,
                    { color: getVerificationColor(algorithm.verificationResult) },
                  ]}>
                    {getVerificationIcon(algorithm.verificationResult)}
                  </Text>
                </View>
                
                <Text style={styles.algorithmType}>{algorithm.algorithmType}</Text>
                
                <View style={styles.algorithmStats}>
                  <Text style={styles.algorithmStat}>
                    Transactions: {algorithm.transactionCount}
                  </Text>
                  <Text style={styles.algorithmStat}>
                    Total: {formatCurrency(algorithm.totalAmount)}
                  </Text>
                  <Text style={styles.algorithmStat}>
                    Balanced: {getVerificationIcon(algorithm.isBalanced)}
                  </Text>
                </View>
                
                {algorithm.balanceDiscrepancy !== 0 && (
                  <Text style={styles.algorithmDiscrepancy}>
                    Discrepancy: {formatCurrency(algorithm.balanceDiscrepancy)}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  }, [proof, expandedSections, toggleSection, handleAlgorithmPress, getVerificationColor, getVerificationIcon, formatCurrency]);

  // Render export options
  const renderExportOptions = useCallback(() => {
    if (!showExportOptions || !proof) return null;

    return (
      <View style={styles.exportContainer}>
        <Text style={styles.exportTitle}>Export Options</Text>
        <View style={styles.exportButtons}>
          <TouchableOpacity
            style={[styles.exportButton, styles.jsonButton]}
            onPress={() => handleExport(ProofExportFormat.JSON)}
            accessibilityRole="button"
            accessibilityLabel="Export as JSON"
          >
            <Text style={styles.exportButtonText}>JSON</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.exportButton, styles.textButton]}
            onPress={() => handleExport(ProofExportFormat.TEXT)}
            accessibilityRole="button"
            accessibilityLabel="Export as text"
          >
            <Text style={styles.exportButtonText}>Text</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.exportButton, styles.pdfButton]}
            onPress={() => handleExport(ProofExportFormat.PDF)}
            accessibilityRole="button"
            accessibilityLabel="Export as PDF"
          >
            <Text style={styles.exportButtonText}>PDF</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.exportButton, styles.shareButton]}
            onPress={handleShare}
            accessibilityRole="button"
            accessibilityLabel="Share proof"
          >
            <Text style={styles.exportButtonText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [showExportOptions, proof, handleExport, handleShare]);

  // Render step details modal
  const renderStepDetailsModal = useCallback(() => {
    if (!showStepDetails) return null;

    return (
      <Modal
        visible={!!showStepDetails}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowStepDetails(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Step {showStepDetails.stepNumber}: {showStepDetails.operation}
            </Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowStepDetails(null)}
              accessibilityRole="button"
              accessibilityLabel="Close step details"
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Description</Text>
              <Text style={styles.modalSectionText}>{showStepDetails.description}</Text>
            </View>
            
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Mathematical Formula</Text>
              <Text style={styles.modalFormula}>{showStepDetails.calculation}</Text>
            </View>
            
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Inputs</Text>
              {Object.entries(showStepDetails.inputs).map(([key, value]) => (
                <View key={key} style={styles.modalInputRow}>
                  <Text style={styles.modalInputKey}>{key}:</Text>
                  <Text style={styles.modalInputValue}>{formatCurrency(value)}</Text>
                </View>
              ))}
            </View>
            
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Result</Text>
              <Text style={styles.modalResult}>
                {formatCurrency(showStepDetails.result)}
              </Text>
              <Text style={styles.modalTolerance}>
                Precision: {showStepDetails.precision} decimals (±{showStepDetails.tolerance})
              </Text>
              <Text style={[
                styles.modalVerification,
                { color: getVerificationColor(showStepDetails.verification) },
              ]}>
                {getVerificationIcon(showStepDetails.verification)} Verification {showStepDetails.verification ? 'Passed' : 'Failed'}
              </Text>
            </View>
            
            {showStepDetails.roundingApplied && (
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Rounding Applied</Text>
                <Text style={styles.modalRoundingText}>
                  {formatCurrency(showStepDetails.roundingApplied.originalValue)} → {formatCurrency(showStepDetails.roundingApplied.roundedValue)}
                </Text>
                <Text style={styles.modalRoundingMode}>
                  Mode: {showStepDetails.roundingApplied.roundingMode}
                </Text>
                <Text style={styles.modalRoundingLoss}>
                  Precision Loss: {showStepDetails.roundingApplied.precisionLoss.toFixed(6)}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    );
  }, [showStepDetails, formatCurrency, getVerificationColor, getVerificationIcon]);

  // Show loading state if no proof
  if (!proof) {
    return (
      <View style={styles.container} accessibilityLabel={accessibilityLabel}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>📋</Text>
          <Text style={styles.emptyStateTitle}>No Mathematical Proof Available</Text>
          <Text style={styles.emptyStateText}>
            Generate a settlement to view mathematical proof details.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container} accessibilityLabel={accessibilityLabel}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Proof Header */}
        {renderProofHeader()}

        {/* Balance Verification */}
        {renderBalanceVerification()}

        {/* Calculation Steps */}
        {renderCalculationSteps()}

        {/* Precision Analysis */}
        {renderPrecisionAnalysis()}

        {/* Algorithm Verification */}
        {renderAlgorithmVerification()}

        {/* Export Options */}
        {renderExportOptions()}
      </ScrollView>

      {/* Step Details Modal */}
      {renderStepDetailsModal()}
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
    padding: 16,
  },

  proofHeader: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  headerInfo: {
    flex: 1,
  },

  proofTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },

  proofId: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    marginBottom: 2,
  },

  proofTimestamp: {
    fontSize: 12,
    color: '#666',
  },

  validityBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },

  validityIcon: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 4,
  },

  validityText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  sectionContainer: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F0F0F0',
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },

  sectionSubtitle: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },

  expandIcon: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },

  sectionContent: {
    padding: 16,
  },

  balanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  balanceItem: {
    width: '48%',
    marginBottom: 8,
  },

  balanceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },

  balanceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },

  balanceStatus: {
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },

  balanceStatusText: {
    fontSize: 16,
    fontWeight: '600',
  },

  stepItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
  },

  validStep: {
    borderLeftColor: '#4CAF50',
  },

  invalidStep: {
    borderLeftColor: '#F44336',
  },

  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },

  stepNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },

  stepVerification: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  stepOperation: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },

  stepDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },

  stepTechnical: {
    backgroundColor: '#F8F8F8',
    borderRadius: 4,
    padding: 8,
    marginTop: 4,
  },

  stepFormula: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#333',
    marginBottom: 2,
  },

  stepResult: {
    fontSize: 12,
    color: '#666',
  },

  precisionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  precisionItem: {
    width: '48%',
    marginBottom: 8,
  },

  precisionLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },

  precisionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },

  roundingContainer: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },

  roundingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },

  roundingItem: {
    marginBottom: 4,
  },

  roundingOperation: {
    fontSize: 12,
    color: '#666',
  },

  roundingValues: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#333',
  },

  roundingMore: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },

  fractionalContainer: {
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },

  fractionalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F57C00',
    marginBottom: 8,
  },

  fractionalItem: {
    marginBottom: 6,
  },

  fractionalPlayer: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },

  fractionalAmount: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#E65100',
  },

  fractionalReason: {
    fontSize: 10,
    color: '#666',
    fontStyle: 'italic',
  },

  algorithmItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
  },

  validAlgorithm: {
    borderLeftColor: '#4CAF50',
  },

  invalidAlgorithm: {
    borderLeftColor: '#F44336',
  },

  algorithmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },

  algorithmName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },

  algorithmVerification: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  algorithmType: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },

  algorithmStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  algorithmStat: {
    fontSize: 11,
    color: '#666',
    marginRight: 12,
    marginBottom: 2,
  },

  algorithmDiscrepancy: {
    fontSize: 12,
    color: '#F44336',
    fontWeight: '500',
    marginTop: 4,
  },

  exportContainer: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },

  exportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 12,
  },

  exportButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  exportButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    minWidth: 70,
  },

  jsonButton: {
    backgroundColor: '#1976D2',
  },

  textButton: {
    backgroundColor: '#388E3C',
  },

  pdfButton: {
    backgroundColor: '#D32F2F',
  },

  shareButton: {
    backgroundColor: '#F57C00',
  },

  exportButtonText: {
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

  modalFormula: {
    fontSize: 14,
    fontFamily: 'monospace',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 6,
    color: '#333',
  },

  modalInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },

  modalInputKey: {
    fontSize: 14,
    color: '#666',
  },

  modalInputValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },

  modalResult: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 4,
  },

  modalTolerance: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },

  modalVerification: {
    fontSize: 14,
    fontWeight: '600',
  },

  modalRoundingText: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#333',
    marginBottom: 2,
  },

  modalRoundingMode: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },

  modalRoundingLoss: {
    fontSize: 12,
    color: '#666',
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