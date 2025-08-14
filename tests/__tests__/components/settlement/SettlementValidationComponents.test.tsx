/**
 * Settlement Validation Components Test Suite - Epic 3: Settlement Optimization
 * Story 3.3: Settlement Validation and Verification - Task 5
 * 
 * Comprehensive tests for all validation UI components
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

// Import all components
import { SettlementValidationDisplay } from '../../../../src/components/settlement/SettlementValidationDisplay';
import { ValidationWarningPanel } from '../../../../src/components/settlement/ValidationWarningPanel';
import { MathematicalProofViewer } from '../../../../src/components/settlement/MathematicalProofViewer';
import { AlternativeSettlementSelector } from '../../../../src/components/settlement/AlternativeSettlementSelector';
import { ValidationStatusIndicator } from '../../../../src/components/settlement/ValidationStatusIndicator';
import { AuditTrailExplorer } from '../../../../src/components/settlement/AuditTrailExplorer';

// Import types
import {
  OptimizedSettlement,
  SettlementValidation,
  SettlementWarningExtended,
  WarningClassification,
  ManualAdjustmentType,
  MathematicalProof,
  AlternativeSettlement,
  SettlementComparison,
  SettlementAlgorithmType,
  SettlementAuditEntry,
  ProofExportFormat,
} from '../../../../src/types/settlement';

// Mock Alert
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Alert: {
      alert: jest.fn(),
    },
  };
});

// Test data generators
const createMockSettlement = (): OptimizedSettlement => ({
  sessionId: 'test-session',
  optimizedPayments: [
    {
      fromPlayerId: 'player1',
      fromPlayerName: 'Alice',
      toPlayerId: 'player2',
      toPlayerName: 'Bob',
      amount: 50.00,
      priority: 1,
    },
    {
      fromPlayerId: 'player3',
      fromPlayerName: 'Charlie',
      toPlayerId: 'player1',
      toPlayerName: 'Alice',
      amount: 25.00,
      priority: 2,
    },
  ],
  directPayments: [],
  optimizationMetrics: {
    originalPaymentCount: 4,
    optimizedPaymentCount: 2,
    reductionPercentage: 50,
    totalAmountSettled: 75.00,
    processingTime: 150,
  },
  isValid: true,
  validationErrors: [],
  mathematicalProof: {
    totalDebits: 75.00,
    totalCredits: 75.00,
    netBalance: 0.00,
    isBalanced: true,
    precision: 2,
    validationTimestamp: new Date(),
    auditSteps: [],
  },
});

const createMockValidation = (isValid: boolean = true): SettlementValidation => ({
  isValid,
  errors: isValid ? [] : [
    {
      code: 'MATHEMATICAL_BALANCE_FAILED',
      message: 'Settlement is not mathematically balanced',
      severity: 'critical' as const,
      affectedPlayers: ['Alice', 'Bob'],
      suggestedFix: 'Check player chip counts and buy-in amounts',
    },
  ],
  warnings: [
    {
      code: 'LARGE_DISCREPANCY',
      message: 'Large balance discrepancy detected',
      affectedPlayers: ['Charlie'],
      canProceed: true,
    },
  ],
  auditTrail: [
    {
      step: 1,
      operation: 'Calculate player net positions',
      input: { playerCount: 3 },
      output: { totalCalculated: 75.00 },
      timestamp: new Date(),
      validationCheck: true,
    },
    {
      step: 2,
      operation: 'Validate mathematical balance',
      input: { totalDebits: 75.00, totalCredits: 75.00 },
      output: { isBalanced: true },
      timestamp: new Date(),
      validationCheck: true,
    },
  ],
});

const createMockWarning = (): SettlementWarningExtended => ({
  warningId: 'warning-1',
  code: 'BALANCE_DISCREPANCY',
  message: 'Balance discrepancy detected after manual adjustment',
  severity: WarningClassification.MAJOR,
  affectedPlayers: ['Alice'],
  balanceDiscrepancy: 5.00,
  adjustmentType: ManualAdjustmentType.CHIP_COUNT_ADJUSTMENT,
  originalValue: 100.00,
  adjustedValue: 105.00,
  detectedAt: new Date(),
  detectionMethod: 'real_time',
  canProceed: true,
  requiresApproval: true,
  suggestedActions: ['Verify chip count accuracy', 'Review transaction history'],
  isResolved: false,
});

const createMockMathematicalProof = (): MathematicalProof => ({
  settlementId: 'settlement-1',
  proofId: 'proof-1',
  generatedAt: new Date(),
  calculationSteps: [
    {
      stepNumber: 1,
      operation: 'Calculate net positions',
      description: 'Calculate each player net position from transactions',
      inputs: { playerCount: 3, totalTransactions: 5 },
      calculation: 'sum(chips) - sum(buyIns)',
      result: 0.00,
      precision: 2,
      verification: true,
      tolerance: 0.01,
    },
  ],
  balanceVerification: {
    totalDebits: 75.00,
    totalCredits: 75.00,
    netBalance: 0.00,
    isBalanced: true,
    precision: 2,
    validationTimestamp: new Date(),
    auditSteps: [],
  },
  precisionAnalysis: {
    originalPrecision: 2,
    calculatedPrecision: 2,
    roundingOperations: [],
    precisionLoss: 0,
    isWithinTolerance: true,
    fractionalCentIssues: [],
  },
  alternativeAlgorithmResults: [
    {
      algorithmName: 'Direct Settlement',
      algorithmType: 'direct',
      paymentPlan: [],
      transactionCount: 3,
      totalAmount: 75.00,
      isBalanced: true,
      balanceDiscrepancy: 0,
      verificationResult: true,
    },
  ],
  humanReadableSummary: 'Settlement is mathematically balanced',
  technicalDetails: [],
  exportFormats: {
    json: {
      metadata: {
        proofId: 'proof-1',
        settlementId: 'settlement-1',
        generatedAt: new Date(),
        version: '1.0',
      },
      playerPositions: [],
      settlements: [],
      balanceVerification: {
        totalDebits: 75.00,
        totalCredits: 75.00,
        netBalance: 0.00,
        isBalanced: true,
        tolerance: 0.01,
        precision: 2,
      },
      algorithmComparison: {
        primaryAlgorithm: {
          algorithmName: 'Greedy',
          algorithmType: 'greedy',
          paymentPlan: [],
          transactionCount: 2,
          totalAmount: 75.00,
          isBalanced: true,
          balanceDiscrepancy: 0,
          verificationResult: true,
        },
        alternativeAlgorithms: [],
        consensusResult: true,
        discrepancies: [],
      },
      precisionAnalysis: {
        decimalPrecision: 2,
        roundingMode: 'round',
        totalRoundingOperations: 0,
        maxPrecisionLoss: 0,
        fractionalCentCount: 0,
        precisionWarnings: [],
      },
    },
    text: 'Settlement is mathematically balanced with 2 payments totaling $75.00',
  },
  checksum: 'abc123',
  signature: 'signature123',
  isValid: true,
});

const createMockAlternativeSettlement = (): AlternativeSettlement => ({
  optionId: 'option-1',
  name: 'Greedy Optimization',
  description: 'Minimizes total number of transactions',
  algorithmType: SettlementAlgorithmType.GREEDY_DEBT_REDUCTION,
  paymentPlan: [
    {
      fromPlayerId: 'player1',
      fromPlayerName: 'Alice',
      toPlayerId: 'player2',
      toPlayerName: 'Bob',
      amount: 50.00,
      priority: 1,
    },
  ],
  transactionCount: 1,
  totalAmountSettled: 50.00,
  score: 8.5,
  simplicity: 9.0,
  fairness: 8.0,
  efficiency: 8.5,
  userFriendliness: 8.0,
  calculationTime: 120,
  optimizationPercentage: 75,
  prosAndCons: {
    pros: ['Minimum transactions', 'Fast calculation'],
    cons: ['May not be most intuitive for users'],
  },
  isValid: true,
  validationResults: createMockValidation(true),
});

const createMockSettlementComparison = (): SettlementComparison => ({
  comparisonId: 'comparison-1',
  sessionId: 'test-session',
  generatedAt: new Date(),
  alternatives: [createMockAlternativeSettlement()],
  recommendedOption: createMockAlternativeSettlement(),
  comparisonMatrix: [
    {
      metricName: 'Transaction Count',
      description: 'Number of required payments',
      values: { 'option-1': 1 },
      weight: 0.3,
      displayFormat: 'number',
    },
    {
      metricName: 'Overall Score',
      description: 'Combined scoring metric',
      values: { 'option-1': 8.5 },
      weight: 0.4,
      displayFormat: 'number',
    },
  ],
  summary: {
    transactionCountRange: { min: 1, max: 3 },
    optimizationRange: { min: 50, max: 85 },
    averageScore: 7.8,
    totalOptionsGenerated: 1,
  },
});

describe('Settlement Validation Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('SettlementValidationDisplay', () => {
    it('should render with valid settlement and validation', () => {
      const settlement = createMockSettlement();
      const validation = createMockValidation(true);

      const { getByText, getByTestId } = render(
        <SettlementValidationDisplay
          settlement={settlement}
          validationResults={validation}
        />
      );

      expect(getByText('Valid Settlement')).toBeTruthy();
      expect(getByText('0 errors, 1 warnings')).toBeTruthy();
      expect(getByText('$75.00')).toBeTruthy(); // Total amount
      expect(getByText('2')).toBeTruthy(); // Number of payments
    });

    it('should render with invalid settlement', () => {
      const settlement = createMockSettlement();
      const validation = createMockValidation(false);

      const { getByText } = render(
        <SettlementValidationDisplay
          settlement={settlement}
          validationResults={validation}
        />
      );

      expect(getByText('Validation Failed')).toBeTruthy();
      expect(getByText('1 errors, 1 warnings')).toBeTruthy();
    });

    it('should render loading state when no settlement', () => {
      const { getByText } = render(
        <SettlementValidationDisplay settlement={null} />
      );

      expect(getByText('Waiting for Settlement...')).toBeTruthy();
    });

    it('should call onValidationComplete when validation changes', () => {
      const onValidationComplete = jest.fn();
      const settlement = createMockSettlement();
      const validation = createMockValidation(true);

      render(
        <SettlementValidationDisplay
          settlement={settlement}
          validationResults={validation}
          onValidationComplete={onValidationComplete}
        />
      );

      expect(onValidationComplete).toHaveBeenCalledWith(true);
    });

    it('should handle error selection', () => {
      const onErrorSelect = jest.fn();
      const settlement = createMockSettlement();
      const validation = createMockValidation(false);

      const { getByText } = render(
        <SettlementValidationDisplay
          settlement={settlement}
          validationResults={validation}
          onErrorSelect={onErrorSelect}
        />
      );

      const errorItem = getByText('Settlement is not mathematically balanced');
      fireEvent.press(errorItem);

      expect(onErrorSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'MATHEMATICAL_BALANCE_FAILED',
          message: 'Settlement is not mathematically balanced',
        })
      );
    });
  });

  describe('ValidationWarningPanel', () => {
    it('should render warning list', () => {
      const warnings = [createMockWarning()];

      const { getByText } = render(
        <ValidationWarningPanel warnings={warnings} />
      );

      expect(getByText('Warning Summary')).toBeTruthy();
      expect(getByText('1')).toBeTruthy(); // Major warning count
      expect(getByText('BALANCE_DISCREPANCY')).toBeTruthy();
      expect(getByText('Balance discrepancy detected after manual adjustment')).toBeTruthy();
    });

    it('should render empty state when no warnings', () => {
      const { getByText } = render(
        <ValidationWarningPanel warnings={[]} />
      );

      expect(getByText('No Active Warnings')).toBeTruthy();
      expect(getByText('All settlement validations are passing.')).toBeTruthy();
    });

    it('should handle warning expansion', () => {
      const warnings = [createMockWarning()];

      const { getByText } = render(
        <ValidationWarningPanel warnings={warnings} />
      );

      const warningItem = getByText('BALANCE_DISCREPANCY');
      fireEvent.press(warningItem);

      // Should show expanded details
      expect(getByText('Affected Players:')).toBeTruthy();
      expect(getByText('Alice')).toBeTruthy();
      expect(getByText('Balance Discrepancy:')).toBeTruthy();
    });

    it('should handle warning resolution', async () => {
      const onWarningResolve = jest.fn();
      const warnings = [createMockWarning()];

      const { getByText } = render(
        <ValidationWarningPanel
          warnings={warnings}
          onWarningResolve={onWarningResolve}
        />
      );

      // Expand warning first
      const warningItem = getByText('BALANCE_DISCREPANCY');
      fireEvent.press(warningItem);

      // Try to resolve
      const resolveButton = getByText('Resolve');
      fireEvent.press(resolveButton);

      // Should show alert
      expect(Alert.alert).toHaveBeenCalledWith(
        'Resolve Warning',
        'How would you like to resolve this warning?',
        expect.any(Array)
      );
    });
  });

  describe('MathematicalProofViewer', () => {
    it('should render mathematical proof', () => {
      const proof = createMockMathematicalProof();

      const { getByText } = render(
        <MathematicalProofViewer proof={proof} />
      );

      expect(getByText('Mathematical Proof')).toBeTruthy();
      expect(getByText('ID: proof-1')).toBeTruthy();
      expect(getByText('VALID')).toBeTruthy();
      expect(getByText('🔢 Balance Verification')).toBeTruthy();
    });

    it('should render empty state when no proof', () => {
      const { getByText } = render(
        <MathematicalProofViewer proof={null} />
      );

      expect(getByText('No Mathematical Proof Available')).toBeTruthy();
      expect(getByText('Generate a settlement to view mathematical proof details.')).toBeTruthy();
    });

    it('should handle section expansion', () => {
      const proof = createMockMathematicalProof();

      const { getByText } = render(
        <MathematicalProofViewer proof={proof} />
      );

      const balanceSection = getByText('🔢 Balance Verification');
      fireEvent.press(balanceSection);

      // Should show expanded balance details
      expect(getByText('Total Debits')).toBeTruthy();
      expect(getByText('Total Credits')).toBeTruthy();
      expect(getByText('$75.00')).toBeTruthy();
    });

    it('should handle export', () => {
      const onExportProof = jest.fn();
      const proof = createMockMathematicalProof();

      const { getByText } = render(
        <MathematicalProofViewer
          proof={proof}
          onExportProof={onExportProof}
          showExportOptions={true}
        />
      );

      const jsonButton = getByText('JSON');
      fireEvent.press(jsonButton);

      expect(onExportProof).toHaveBeenCalledWith(ProofExportFormat.JSON);
    });
  });

  describe('AlternativeSettlementSelector', () => {
    it('should render settlement alternatives', () => {
      const comparison = createMockSettlementComparison();

      const { getByText } = render(
        <AlternativeSettlementSelector comparison={comparison} />
      );

      expect(getByText('Recommended Option')).toBeTruthy();
      expect(getByText('Greedy Optimization')).toBeTruthy();
      expect(getByText('1 transactions')).toBeTruthy();
      expect(getByText('Score: 8.5/10')).toBeTruthy();
    });

    it('should render empty state when no comparison', () => {
      const { getByText } = render(
        <AlternativeSettlementSelector comparison={null} />
      );

      expect(getByText('No Settlement Options Available')).toBeTruthy();
      expect(getByText('Generate settlement alternatives to compare different optimization approaches.')).toBeTruthy();
    });

    it('should handle settlement selection', () => {
      const onSettlementSelect = jest.fn();
      const comparison = createMockSettlementComparison();

      const { getByText } = render(
        <AlternativeSettlementSelector
          comparison={comparison}
          onSettlementSelect={onSettlementSelect}
        />
      );

      const selectButton = getByText('Select');
      fireEvent.press(selectButton);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Select Settlement Option',
        'Use Greedy Optimization for final settlement?',
        expect.any(Array)
      );
    });

    it('should handle sorting', () => {
      const comparison = createMockSettlementComparison();

      const { getByText } = render(
        <AlternativeSettlementSelector comparison={comparison} />
      );

      const transactionCountSort = getByText('Transaction Count');
      fireEvent.press(transactionCountSort);

      // Should update sorting (hard to test visually, but ensures no crash)
      expect(getByText('Greedy Optimization')).toBeTruthy();
    });
  });

  describe('ValidationStatusIndicator', () => {
    it('should render valid status', () => {
      const validation = createMockValidation(true);

      const { getByText } = render(
        <ValidationStatusIndicator validationResults={validation} />
      );

      expect(getByText('Valid')).toBeTruthy();
    });

    it('should render invalid status', () => {
      const validation = createMockValidation(false);

      const { getByText } = render(
        <ValidationStatusIndicator validationResults={validation} />
      );

      expect(getByText('Critical')).toBeTruthy(); // Should show critical due to error severity
    });

    it('should render validating status', () => {
      const { getByText } = render(
        <ValidationStatusIndicator isValidating={true} />
      );

      expect(getByText('Validating')).toBeTruthy();
    });

    it('should render pending status', () => {
      const { getByText } = render(
        <ValidationStatusIndicator validationResults={null} />
      );

      expect(getByText('Pending')).toBeTruthy();
    });

    it('should handle press when onPress provided', () => {
      const onPress = jest.fn();
      const validation = createMockValidation(true);

      const { getByText } = render(
        <ValidationStatusIndicator
          validationResults={validation}
          onPress={onPress}
        />
      );

      const statusElement = getByText('Valid');
      fireEvent.press(statusElement);

      expect(onPress).toHaveBeenCalled();
    });

    it('should show details when enabled', () => {
      const validation = createMockValidation(false);

      const { getByText } = render(
        <ValidationStatusIndicator
          validationResults={validation}
          showDetails={true}
        />
      );

      expect(getByText('1 error')).toBeTruthy();
      expect(getByText('1 warning')).toBeTruthy();
    });
  });

  describe('AuditTrailExplorer', () => {
    const mockAuditTrail: SettlementAuditEntry[] = [
      {
        step: 1,
        operation: 'Calculate player net positions',
        input: { playerCount: 3 },
        output: { totalCalculated: 75.00 },
        timestamp: new Date(),
        validationCheck: true,
      },
      {
        step: 2,
        operation: 'Validate mathematical balance',
        input: { totalDebits: 75.00, totalCredits: 75.00 },
        output: { isBalanced: true },
        timestamp: new Date(),
        validationCheck: true,
      },
    ];

    it('should render audit trail', () => {
      const { getByText } = render(
        <AuditTrailExplorer auditTrail={mockAuditTrail} />
      );

      expect(getByText('Settlement Audit Trail')).toBeTruthy();
      expect(getByText('2/2 steps validated')).toBeTruthy();
      expect(getByText('Step 1')).toBeTruthy();
      expect(getByText('Calculate player net positions')).toBeTruthy();
    });

    it('should render empty state when no audit trail', () => {
      const { getByText } = render(
        <AuditTrailExplorer auditTrail={[]} />
      );

      expect(getByText('No Audit Trail Available')).toBeTruthy();
      expect(getByText('Settlement calculations will generate an audit trail for transparency.')).toBeTruthy();
    });

    it('should handle step expansion', () => {
      const { getByText } = render(
        <AuditTrailExplorer auditTrail={mockAuditTrail} />
      );

      const stepHeader = getByText('Calculate player net positions');
      fireEvent.press(stepHeader);

      // Should show expanded step details
      expect(getByText('Input')).toBeTruthy();
      expect(getByText('Output')).toBeTruthy();
      expect(getByText('playerCount:')).toBeTruthy();
      expect(getByText('3')).toBeTruthy();
    });

    it('should handle step-by-step mode', () => {
      const { getByText } = render(
        <AuditTrailExplorer 
          auditTrail={mockAuditTrail}
          enableStepByStep={true}
        />
      );

      const stepByStepButton = getByText('Step-by-step');
      fireEvent.press(stepByStepButton);

      expect(getByText('Step 1 of 2')).toBeTruthy();
      expect(getByText('Next →')).toBeTruthy();
    });

    it('should handle step navigation in step-by-step mode', () => {
      const { getByText } = render(
        <AuditTrailExplorer 
          auditTrail={mockAuditTrail}
          enableStepByStep={true}
        />
      );

      // Enable step-by-step mode
      const stepByStepButton = getByText('Step-by-step');
      fireEvent.press(stepByStepButton);

      // Navigate to next step
      const nextButton = getByText('Next →');
      fireEvent.press(nextButton);

      expect(getByText('Step 2 of 2')).toBeTruthy();
    });

    it('should handle step selection', () => {
      const onStepSelect = jest.fn();

      const { getByText } = render(
        <AuditTrailExplorer 
          auditTrail={mockAuditTrail}
          onStepSelect={onStepSelect}
        />
      );

      // Expand step first
      const stepHeader = getByText('Calculate player net positions');
      fireEvent.press(stepHeader);

      // Select view details
      const viewDetailsButton = getByText('View Details');
      fireEvent.press(viewDetailsButton);

      expect(onStepSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          step: 1,
          operation: 'Calculate player net positions',
        })
      );
    });

    it('should show mathematical proof correlation when available', () => {
      const proof = createMockMathematicalProof();

      const { getByText } = render(
        <AuditTrailExplorer 
          auditTrail={mockAuditTrail}
          mathematicalProof={proof}
        />
      );

      expect(getByText('🔗 Mathematical Proof Correlation')).toBeTruthy();
      expect(getByText('This audit trail corresponds to 1 mathematical proof steps.')).toBeTruthy();
    });
  });

  describe('Integration Tests', () => {
    it('should work together in a complete validation workflow', () => {
      const settlement = createMockSettlement();
      const validation = createMockValidation(true);
      const warnings = [createMockWarning()];
      const proof = createMockMathematicalProof();
      const comparison = createMockSettlementComparison();

      // Test that all components can render together without conflicts
      const { getByText } = render(
        <>
          <SettlementValidationDisplay
            settlement={settlement}
            validationResults={validation}
          />
          <ValidationWarningPanel warnings={warnings} />
          <MathematicalProofViewer proof={proof} />
          <AlternativeSettlementSelector comparison={comparison} />
          <ValidationStatusIndicator validationResults={validation} />
          <AuditTrailExplorer auditTrail={validation.auditTrail} />
        </>
      );

      // Verify key elements from each component are present
      expect(getByText('Valid Settlement')).toBeTruthy();
      expect(getByText('Warning Summary')).toBeTruthy();
      expect(getByText('Mathematical Proof')).toBeTruthy();
      expect(getByText('Recommended Option')).toBeTruthy();
      expect(getByText('Valid')).toBeTruthy();
      expect(getByText('Settlement Audit Trail')).toBeTruthy();
    });
  });
});

describe('Component Performance', () => {
  it('should handle large audit trails efficiently', () => {
    const largeAuditTrail: SettlementAuditEntry[] = Array.from({ length: 100 }, (_, i) => ({
      step: i + 1,
      operation: `Operation ${i + 1}`,
      input: { value: i },
      output: { result: i * 2 },
      timestamp: new Date(),
      validationCheck: true,
    }));

    const startTime = performance.now();
    
    const { getByText } = render(
      <AuditTrailExplorer auditTrail={largeAuditTrail} />
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should render within reasonable time (less than 500ms)
    expect(renderTime).toBeLessThan(500);
    expect(getByText('Settlement Audit Trail')).toBeTruthy();
  });

  it('should handle many warnings efficiently', () => {
    const manyWarnings: SettlementWarningExtended[] = Array.from({ length: 50 }, (_, i) => ({
      ...createMockWarning(),
      warningId: `warning-${i}`,
      message: `Warning ${i}`,
    }));

    const startTime = performance.now();

    const { getByText } = render(
      <ValidationWarningPanel warnings={manyWarnings} />
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should render within reasonable time (less than 300ms)
    expect(renderTime).toBeLessThan(300);
    expect(getByText('Warning Summary')).toBeTruthy();
  });
});