/**
 * SettlementPlanDisplay Component Tests - Epic 3: Settlement Optimization
 * Story 3.2: Settlement Plan Visualization Components
 */

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { SettlementPlanDisplay } from '../../../../src/components/settlement/SettlementPlanDisplay';
import { useSettlementOptimization } from '../../../../src/hooks/useSettlementOptimization';
import { ServiceError } from '../../../../src/services/core/ServiceError';
import { OptimizedSettlement } from '../../../../src/types/settlement';

// Mock the hook
jest.mock('../../../../src/hooks/useSettlementOptimization');
const mockUseSettlementOptimization = useSettlementOptimization as jest.MockedFunction<typeof useSettlementOptimization>;

// Mock React Native Alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

// Mock AccessibilityInfo
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    AccessibilityInfo: {
      announceForAccessibility: jest.fn(),
    },
  };
});

// Mock settlement data
const mockOptimizedSettlement: OptimizedSettlement = {
  sessionId: 'test-session-1',
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
      toPlayerId: 'player2',
      toPlayerName: 'Bob',
      amount: 25.00,
      priority: 2,
    },
  ],
  directPayments: [
    {
      fromPlayerId: 'player1',
      fromPlayerName: 'Alice',
      toPlayerId: 'player2',
      toPlayerName: 'Bob',
      amount: 30.00,
      priority: 1,
    },
    {
      fromPlayerId: 'player1',
      fromPlayerName: 'Alice',
      toPlayerId: 'player3',
      toPlayerName: 'Charlie',
      amount: 20.00,
      priority: 2,
    },
    {
      fromPlayerId: 'player3',
      fromPlayerName: 'Charlie',
      toPlayerId: 'player2',
      toPlayerName: 'Bob',
      amount: 25.00,
      priority: 3,
    },
  ],
  optimizationMetrics: {
    originalPaymentCount: 3,
    optimizedPaymentCount: 2,
    reductionPercentage: 33.33,
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
};

describe('SettlementPlanDisplay', () => {
  const mockOptimizeSettlement = jest.fn();
  const mockFormatPaymentPlan = jest.fn();
  const mockGetOptimizationBenefits = jest.fn();
  const mockValidateOptimization = jest.fn();
  const mockClearError = jest.fn();
  const mockEnableAutoRefresh = jest.fn();
  const mockDisableAutoRefresh = jest.fn();

  const defaultHookReturn = {
    optimizedResult: null,
    isOptimizing: false,
    error: null,
    optimizeSettlement: mockOptimizeSettlement,
    formatPaymentPlan: mockFormatPaymentPlan,
    getOptimizationBenefits: mockGetOptimizationBenefits,
    validateOptimization: mockValidateOptimization,
    clearError: mockClearError,
    enableAutoRefresh: mockEnableAutoRefresh,
    disableAutoRefresh: mockDisableAutoRefresh,
    // Add required properties
    comparison: null,
    optimizationProgress: 0,
    optimizationHistory: [],
    metrics: {
      averageOptimizationTime: 200,
      averageReductionPercentage: 35,
      totalOptimizations: 5,
      successRate: 100,
    },
    compareOptimizations: jest.fn(),
    clearOptimizationResult: jest.fn(),
    setOptimizationProgress: jest.fn(),
    getPerformanceMetrics: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseSettlementOptimization.mockReturnValue(defaultHookReturn);
    
    mockFormatPaymentPlan.mockReturnValue({
      displayText: 'Alice → Bob',
      amount: '$50.00',
      direction: 'send',
      color: '#4CAF50',
      icon: '💰',
    });

    mockGetOptimizationBenefits.mockReturnValue({
      transactionReduction: 1,
      percentageImprovement: 33.33,
      timeEfficiency: '2 minutes saved',
      costSavings: 'No direct cost savings',
      complexityReduction: '1 fewer transactions to track',
    });

    mockValidateOptimization.mockReturnValue({
      isValid: true,
      warnings: [],
      errors: [],
    });
  });

  describe('Rendering', () => {
    it('should render loading state correctly', () => {
      mockUseSettlementOptimization.mockReturnValue({
        ...defaultHookReturn,
        isOptimizing: true,
      });

      render(<SettlementPlanDisplay sessionId="test-session-1" />);

      expect(screen.getByText('Optimizing Settlement...')).toBeTruthy();
      expect(screen.getByText('Finding the most efficient payment plan')).toBeTruthy();
    });

    it('should render error state correctly', () => {
      const error = new ServiceError('OPTIMIZATION_FAILED', 'Test error message');
      mockUseSettlementOptimization.mockReturnValue({
        ...defaultHookReturn,
        error,
      });

      render(<SettlementPlanDisplay sessionId="test-session-1" />);

      expect(screen.getByText('Optimization Error')).toBeTruthy();
      expect(screen.getByText('Test error message')).toBeTruthy();
      expect(screen.getByText('Retry')).toBeTruthy();
    });

    it('should render settlement plan correctly', () => {
      render(
        <SettlementPlanDisplay 
          sessionId="test-session-1" 
          optimizedSettlement={mockOptimizedSettlement}
        />
      );

      expect(screen.getByText('Settlement Plan')).toBeTruthy();
      expect(screen.getByText('2 payments')).toBeTruthy();
      expect(screen.getByText('150ms')).toBeTruthy();
      expect(screen.getByText('Payment Plan')).toBeTruthy();
    });

    it('should render empty state when no payments needed', () => {
      const emptySettlement = {
        ...mockOptimizedSettlement,
        optimizedPayments: [],
      };

      render(
        <SettlementPlanDisplay 
          sessionId="test-session-1" 
          optimizedSettlement={emptySettlement}
        />
      );

      expect(screen.getByText('No Payments Needed!')).toBeTruthy();
      expect(screen.getByText('All players are settled - no money needs to change hands.')).toBeTruthy();
    });

    it('should render payment items correctly', () => {
      render(
        <SettlementPlanDisplay 
          sessionId="test-session-1" 
          optimizedSettlement={mockOptimizedSettlement}
        />
      );

      // Should format and display each payment
      expect(mockFormatPaymentPlan).toHaveBeenCalledTimes(2);
      expect(screen.getByText('Priority 1')).toBeTruthy();
      expect(screen.getByText('Priority 2')).toBeTruthy();
    });
  });

  describe('Interaction', () => {
    it('should handle optimize button press', async () => {
      mockOptimizeSettlement.mockResolvedValue(mockOptimizedSettlement);

      render(<SettlementPlanDisplay sessionId="test-session-1" />);

      const optimizeButton = screen.getByText('Optimize Settlement');
      fireEvent.press(optimizeButton);

      await waitFor(() => {
        expect(mockOptimizeSettlement).toHaveBeenCalledWith('test-session-1');
      });
    });

    it('should handle payment selection', () => {
      const mockOnPaymentSelect = jest.fn();

      render(
        <SettlementPlanDisplay 
          sessionId="test-session-1" 
          optimizedSettlement={mockOptimizedSettlement}
          onPaymentSelect={mockOnPaymentSelect}
        />
      );

      // Find and press a payment item
      const paymentItem = screen.getByAccessibilityLabel(/Payment 1:/);
      fireEvent.press(paymentItem);

      expect(mockOnPaymentSelect).toHaveBeenCalledWith(
        mockOptimizedSettlement.optimizedPayments[0]
      );
    });

    it('should handle plan acceptance', () => {
      const mockOnPlanAccept = jest.fn();

      render(
        <SettlementPlanDisplay 
          sessionId="test-session-1" 
          optimizedSettlement={mockOptimizedSettlement}
          onPlanAccept={mockOnPlanAccept}
        />
      );

      const acceptButton = screen.getByText('Accept Plan');
      fireEvent.press(acceptButton);

      expect(mockOnPlanAccept).toHaveBeenCalledWith(mockOptimizedSettlement);
    });

    it('should handle plan rejection', () => {
      const mockOnPlanReject = jest.fn();

      render(
        <SettlementPlanDisplay 
          sessionId="test-session-1" 
          optimizedSettlement={mockOptimizedSettlement}
          onPlanReject={mockOnPlanReject}
        />
      );

      const rejectButton = screen.getByText('Try Again');
      fireEvent.press(rejectButton);

      expect(mockOnPlanReject).toHaveBeenCalled();
    });

    it('should disable accept button for invalid settlements', () => {
      mockValidateOptimization.mockReturnValue({
        isValid: false,
        warnings: [],
        errors: ['Mathematical balance failed'],
      });

      const invalidSettlement = {
        ...mockOptimizedSettlement,
        isValid: false,
      };

      render(
        <SettlementPlanDisplay 
          sessionId="test-session-1" 
          optimizedSettlement={invalidSettlement}
        />
      );

      const acceptButton = screen.getByText('Accept Plan');
      expect(acceptButton.props.accessibilityState?.disabled).toBe(true);
    });
  });

  describe('Benefits Display', () => {
    it('should render optimization benefits', () => {
      render(
        <SettlementPlanDisplay 
          sessionId="test-session-1" 
          optimizedSettlement={mockOptimizedSettlement}
        />
      );

      expect(screen.getByText('Optimization Benefits')).toBeTruthy();
      expect(screen.getByText('Transaction Reduction')).toBeTruthy();
      expect(screen.getByText('Time Efficiency')).toBeTruthy();
      expect(screen.getByText('Complexity Reduction')).toBeTruthy();
    });

    it('should display correct benefit calculations', () => {
      render(
        <SettlementPlanDisplay 
          sessionId="test-session-1" 
          optimizedSettlement={mockOptimizedSettlement}
        />
      );

      expect(screen.getByText('1 fewer transactions (33.3% improvement)')).toBeTruthy();
      expect(screen.getByText('2 minutes saved')).toBeTruthy();
      expect(screen.getByText('1 fewer transactions to track')).toBeTruthy();
    });
  });

  describe('Validation Display', () => {
    it('should display validation errors', () => {
      mockValidateOptimization.mockReturnValue({
        isValid: false,
        warnings: ['Low optimization benefit'],
        errors: ['Mathematical balance failed'],
      });

      render(
        <SettlementPlanDisplay 
          sessionId="test-session-1" 
          optimizedSettlement={mockOptimizedSettlement}
        />
      );

      expect(screen.getByText('❌ Errors')).toBeTruthy();
      expect(screen.getByText('• Mathematical balance failed')).toBeTruthy();
      expect(screen.getByText('⚠️ Warnings')).toBeTruthy();
      expect(screen.getByText('• Low optimization benefit')).toBeTruthy();
    });

    it('should not display validation section when no issues', () => {
      render(
        <SettlementPlanDisplay 
          sessionId="test-session-1" 
          optimizedSettlement={mockOptimizedSettlement}
        />
      );

      expect(screen.queryByText('❌ Errors')).toBeNull();
      expect(screen.queryByText('⚠️ Warnings')).toBeNull();
    });
  });

  describe('Mathematical Proof Display', () => {
    it('should display mathematical validation summary', () => {
      render(
        <SettlementPlanDisplay 
          sessionId="test-session-1" 
          optimizedSettlement={mockOptimizedSettlement}
        />
      );

      expect(screen.getByText('Mathematical Validation')).toBeTruthy();
      expect(screen.getByText('Total Amount:')).toBeTruthy();
      expect(screen.getByText('$75.00')).toBeTruthy();
      expect(screen.getByText('Balance:')).toBeTruthy();
      expect(screen.getByText('Balanced ✓')).toBeTruthy();
    });

    it('should show unbalanced state correctly', () => {
      const unbalancedSettlement = {
        ...mockOptimizedSettlement,
        mathematicalProof: {
          ...mockOptimizedSettlement.mathematicalProof,
          isBalanced: false,
        },
      };

      render(
        <SettlementPlanDisplay 
          sessionId="test-session-1" 
          optimizedSettlement={unbalancedSettlement}
        />
      );

      expect(screen.getByText('Unbalanced ✗')).toBeTruthy();
    });
  });

  describe('Real-time Updates', () => {
    it('should enable auto-refresh when requested', () => {
      render(
        <SettlementPlanDisplay 
          sessionId="test-session-1"
          enableRealtimeUpdates={true}
        />
      );

      expect(mockEnableAutoRefresh).toHaveBeenCalledWith('test-session-1');
    });

    it('should disable auto-refresh when not needed', () => {
      render(
        <SettlementPlanDisplay 
          sessionId="test-session-1"
          enableRealtimeUpdates={false}
        />
      );

      expect(mockDisableAutoRefresh).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle optimization errors with alert', async () => {
      const error = new ServiceError('OPTIMIZATION_FAILED', 'Test error');
      mockOptimizeSettlement.mockRejectedValue(error);

      render(<SettlementPlanDisplay sessionId="test-session-1" />);

      const optimizeButton = screen.getByText('Optimize Settlement');
      fireEvent.press(optimizeButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Optimization Failed',
          'Test error',
          [{ text: 'OK', onPress: mockClearError }]
        );
      });
    });

    it('should handle retry from error state', async () => {
      const error = new ServiceError('OPTIMIZATION_FAILED', 'Test error');
      mockUseSettlementOptimization.mockReturnValue({
        ...defaultHookReturn,
        error,
      });

      render(<SettlementPlanDisplay sessionId="test-session-1" />);

      const retryButton = screen.getByText('Retry');
      fireEvent.press(retryButton);

      await waitFor(() => {
        expect(mockOptimizeSettlement).toHaveBeenCalledWith('test-session-1');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      render(
        <SettlementPlanDisplay 
          sessionId="test-session-1" 
          optimizedSettlement={mockOptimizedSettlement}
          accessibilityLabel="Custom Settlement Display"
        />
      );

      expect(screen.getByAccessibilityLabel('Custom Settlement Display')).toBeTruthy();
    });

    it('should announce payment selections', () => {
      const { AccessibilityInfo } = require('react-native');
      const mockOnPaymentSelect = jest.fn();

      render(
        <SettlementPlanDisplay 
          sessionId="test-session-1" 
          optimizedSettlement={mockOptimizedSettlement}
          onPaymentSelect={mockOnPaymentSelect}
        />
      );

      const paymentItem = screen.getByAccessibilityLabel(/Payment 1:/);
      fireEvent.press(paymentItem);

      expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
        expect.stringContaining('Selected payment')
      );
    });

    it('should have proper button roles and states', () => {
      render(
        <SettlementPlanDisplay 
          sessionId="test-session-1" 
          optimizedSettlement={mockOptimizedSettlement}
        />
      );

      const acceptButton = screen.getByText('Accept Plan');
      expect(acceptButton.props.accessibilityRole).toBe('button');
      expect(acceptButton.props.accessibilityLabel).toBe('Accept settlement plan');
    });
  });

  describe('Props Handling', () => {
    it('should use external settlement when provided', () => {
      render(
        <SettlementPlanDisplay 
          sessionId="test-session-1" 
          optimizedSettlement={mockOptimizedSettlement}
        />
      );

      // Should use the external settlement instead of hook result
      expect(screen.getByText('2 payments')).toBeTruthy();
    });

    it('should fallback to hook result when no external settlement', () => {
      mockUseSettlementOptimization.mockReturnValue({
        ...defaultHookReturn,
        optimizedResult: mockOptimizedSettlement,
      });

      render(<SettlementPlanDisplay sessionId="test-session-1" />);

      expect(screen.getByText('2 payments')).toBeTruthy();
    });

    it('should handle missing optional callbacks gracefully', () => {
      render(
        <SettlementPlanDisplay 
          sessionId="test-session-1" 
          optimizedSettlement={mockOptimizedSettlement}
        />
      );

      // Should not crash when pressing buttons without callbacks
      const paymentItem = screen.getByAccessibilityLabel(/Payment 1:/);
      expect(() => fireEvent.press(paymentItem)).not.toThrow();
    });
  });
});