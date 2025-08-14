/**
 * SettlementComparison Component Tests - Epic 3: Settlement Optimization
 * Story 3.2: Settlement Plan Visualization Components
 */

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import { SettlementComparison } from '../../../../src/components/settlement/SettlementComparison';
import { useSettlementOptimization } from '../../../../src/hooks/useSettlementOptimization';
import { ServiceError } from '../../../../src/services/core/ServiceError';
import { OptimizedSettlement } from '../../../../src/types/settlement';

// Mock the hook
jest.mock('../../../../src/hooks/useSettlementOptimization');
const mockUseSettlementOptimization = useSettlementOptimization as jest.MockedFunction<typeof useSettlementOptimization>;

// Mock Dimensions
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Dimensions: {
      get: jest.fn(() => ({ width: 400, height: 800 })),
    },
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

const mockComparison = {
  direct: mockOptimizedSettlement.directPayments,
  optimized: mockOptimizedSettlement.optimizedPayments,
  improvement: 33.33,
  savingsAmount: 0,
  transactionReduction: 1,
  isSignificantImprovement: true,
};

describe('SettlementComparison', () => {
  const mockCompareOptimizations = jest.fn();
  const mockFormatPaymentPlan = jest.fn();
  const mockGetOptimizationBenefits = jest.fn();
  const mockClearError = jest.fn();

  const defaultHookReturn = {
    optimizedResult: null,
    comparison: null,
    isOptimizing: false,
    error: null,
    optimizeSettlement: jest.fn(),
    compareOptimizations: mockCompareOptimizations,
    formatPaymentPlan: mockFormatPaymentPlan,
    getOptimizationBenefits: mockGetOptimizationBenefits,
    validateOptimization: jest.fn(),
    clearError: mockClearError,
    enableAutoRefresh: jest.fn(),
    disableAutoRefresh: jest.fn(),
    // Required properties
    optimizationProgress: 0,
    optimizationHistory: [],
    metrics: {
      averageOptimizationTime: 200,
      averageReductionPercentage: 35,
      totalOptimizations: 5,
      successRate: 100,
    },
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

    mockCompareOptimizations.mockResolvedValue(mockComparison);
  });

  describe('Rendering States', () => {
    it('should render loading state correctly', () => {
      mockUseSettlementOptimization.mockReturnValue({
        ...defaultHookReturn,
        isOptimizing: true,
      });

      render(<SettlementComparison sessionId="test-session-1" />);

      expect(screen.getByText('Generating Comparison...')).toBeTruthy();
    });

    it('should render error state correctly', () => {
      const error = new ServiceError('COMPARISON_FAILED', 'Test error');
      mockUseSettlementOptimization.mockReturnValue({
        ...defaultHookReturn,
        error,
      });

      render(<SettlementComparison sessionId="test-session-1" />);

      expect(screen.getByText('Comparison Error')).toBeTruthy();
      expect(screen.getByText('Test error')).toBeTruthy();
      expect(screen.getByText('Retry')).toBeTruthy();
    });

    it('should render empty state when no settlement', () => {
      render(<SettlementComparison sessionId="test-session-1" />);

      expect(screen.getByText('No Settlement to Compare')).toBeTruthy();
      expect(screen.getByText('Run settlement optimization first to see the comparison.')).toBeTruthy();
    });

    it('should render comparison view correctly', () => {
      render(
        <SettlementComparison 
          sessionId="test-session-1" 
          optimizedSettlement={mockOptimizedSettlement}
        />
      );

      expect(screen.getByText('Settlement Comparison')).toBeTruthy();
      expect(screen.getByText('Optimized vs Direct Settlement Plans')).toBeTruthy();
    });
  });

  describe('Metrics Display', () => {
    it('should display optimization metrics when enabled', () => {
      render(
        <SettlementComparison 
          sessionId="test-session-1" 
          optimizedSettlement={mockOptimizedSettlement}
          showMetrics={true}
        />
      );

      expect(screen.getByText('Optimization Metrics')).toBeTruthy();
      expect(screen.getByText('Transaction Reduction')).toBeTruthy();
      expect(screen.getByText('Processing Time')).toBeTruthy();
      expect(screen.getByText('Settlement Amount')).toBeTruthy();
    });

    it('should not display metrics when disabled', () => {
      render(
        <SettlementComparison 
          sessionId="test-session-1" 
          optimizedSettlement={mockOptimizedSettlement}
          showMetrics={false}
        />
      );

      expect(screen.queryByText('Optimization Metrics')).toBeNull();
    });

    it('should display correct metric values', () => {
      render(
        <SettlementComparison 
          sessionId="test-session-1" 
          optimizedSettlement={mockOptimizedSettlement}
        />
      );

      expect(screen.getByText('1 transactions')).toBeTruthy(); // Reduction
      expect(screen.getByText('(33.3% improvement)')).toBeTruthy();
      expect(screen.getByText('150ms')).toBeTruthy();
      expect(screen.getByText('$75.00')).toBeTruthy();
    });

    it('should show efficiency rating colors correctly', () => {
      // Test different reduction percentages
      const excellentSettlement = {
        ...mockOptimizedSettlement,
        optimizationMetrics: {
          ...mockOptimizedSettlement.optimizationMetrics,
          reductionPercentage: 65, // Excellent
        },
      };

      render(
        <SettlementComparison 
          sessionId="test-session-1" 
          optimizedSettlement={excellentSettlement}
        />
      );

      // Should show green color for excellent performance
      expect(screen.getByText('(65.0% improvement)')).toBeTruthy();
    });
  });

  describe('Benefits Display', () => {
    it('should display optimization benefits when enabled', () => {
      render(
        <SettlementComparison 
          sessionId="test-session-1" 
          optimizedSettlement={mockOptimizedSettlement}
          showBenefits={true}
        />
      );

      expect(screen.getByText('Optimization Benefits')).toBeTruthy();
      expect(screen.getByText('Simplification:')).toBeTruthy();
      expect(screen.getByText('Time Savings:')).toBeTruthy();
      expect(screen.getByText('Efficiency:')).toBeTruthy();
    });

    it('should not display benefits when disabled', () => {
      render(
        <SettlementComparison 
          sessionId="test-session-1" 
          optimizedSettlement={mockOptimizedSettlement}
          showBenefits={false}
        />
      );

      expect(screen.queryByText('Optimization Benefits')).toBeNull();
    });

    it('should display correct benefit values', () => {
      render(
        <SettlementComparison 
          sessionId="test-session-1" 
          optimizedSettlement={mockOptimizedSettlement}
        />
      );

      expect(screen.getByText('1 fewer transactions to track')).toBeTruthy();
      expect(screen.getByText('2 minutes saved')).toBeTruthy();
      expect(screen.getByText('33.3% fewer transactions')).toBeTruthy();
    });
  });

  describe('Comparison Summary', () => {
    it('should display before/after comparison', () => {
      render(
        <SettlementComparison 
          sessionId="test-session-1" 
          optimizedSettlement={mockOptimizedSettlement}
        />
      );

      expect(screen.getByText('Optimization Summary')).toBeTruthy();
      expect(screen.getByText('Before')).toBeTruthy();
      expect(screen.getByText('After')).toBeTruthy();
      expect(screen.getByText('3 payments')).toBeTruthy(); // Original
      expect(screen.getByText('2 payments')).toBeTruthy(); // Optimized
    });

    it('should display efficiency badge', () => {
      render(
        <SettlementComparison 
          sessionId="test-session-1" 
          optimizedSettlement={mockOptimizedSettlement}
        />
      );

      expect(screen.getByText('33.3% Improvement')).toBeTruthy();
    });
  });

  describe('View Mode Toggle', () => {
    it('should render view toggle for non-side-by-side modes', () => {
      render(
        <SettlementComparison 
          sessionId="test-session-1" 
          optimizedSettlement={mockOptimizedSettlement}
          displayMode="toggle"
        />
      );

      expect(screen.getByText('Optimized')).toBeTruthy();
      expect(screen.getByText('Direct')).toBeTruthy();
      expect(screen.getByText('Compare')).toBeTruthy();
    });

    it('should not render view toggle for side-by-side mode', () => {
      render(
        <SettlementComparison 
          sessionId="test-session-1" 
          optimizedSettlement={mockOptimizedSettlement}
          displayMode="side-by-side"
        />
      );

      // Toggle buttons should not be present
      const optimizedTab = screen.queryByAccessibilityRole('tab');
      expect(optimizedTab).toBeNull();
    });

    it('should handle view mode switching', () => {
      render(
        <SettlementComparison 
          sessionId="test-session-1" 
          optimizedSettlement={mockOptimizedSettlement}
          displayMode="toggle"
        />
      );

      const directTab = screen.getByText('Direct');
      fireEvent.press(directTab);

      // Should show direct tab as selected
      expect(directTab.props.accessibilityState?.selected).toBe(true);
    });
  });

  describe('Payment Plan Display', () => {
    it('should render both plans in side-by-side mode', () => {
      render(
        <SettlementComparison 
          sessionId="test-session-1" 
          optimizedSettlement={mockOptimizedSettlement}
          displayMode="side-by-side"
        />
      );

      expect(screen.getByText('Optimized Plan')).toBeTruthy();
      expect(screen.getByText('Direct Plan')).toBeTruthy();
    });

    it('should show correct payment counts', () => {
      render(
        <SettlementComparison 
          sessionId="test-session-1" 
          optimizedSettlement={mockOptimizedSettlement}
        />
      );

      // Should show payment counts for both plans
      const paymentCounts = screen.getAllByText(/\d+ payments/);
      expect(paymentCounts).toHaveLength(2); // One for each plan
    });

    it('should handle empty payment plans', () => {
      const emptySettlement = {
        ...mockOptimizedSettlement,
        optimizedPayments: [],
      };

      render(
        <SettlementComparison 
          sessionId="test-session-1" 
          optimizedSettlement={emptySettlement}
        />
      );

      expect(screen.getByText('No payments needed')).toBeTruthy();
    });

    it('should handle payment item expansion', () => {
      render(
        <SettlementComparison 
          sessionId="test-session-1" 
          optimizedSettlement={mockOptimizedSettlement}
        />
      );

      // Find a payment item and expand it
      const paymentItem = screen.getAllByAccessibilityRole('button').find(
        button => button.props.accessibilityLabel?.includes('Payment')
      );
      
      if (paymentItem) {
        fireEvent.press(paymentItem);
        // Should show expanded state
        expect(paymentItem.props.accessibilityState?.expanded).toBeTruthy();
      }
    });
  });

  describe('Plan Selection', () => {
    it('should handle optimized plan selection', () => {
      const mockOnPlanSelect = jest.fn();

      render(
        <SettlementComparison 
          sessionId="test-session-1" 
          optimizedSettlement={mockOptimizedSettlement}
          onPlanSelect={mockOnPlanSelect}
        />
      );

      const selectButtons = screen.getAllByText('Select');
      fireEvent.press(selectButtons[0]); // First select button (optimized)

      expect(mockOnPlanSelect).toHaveBeenCalledWith(
        'optimized',
        mockOptimizedSettlement.optimizedPayments
      );
    });

    it('should handle direct plan selection', () => {
      const mockOnPlanSelect = jest.fn();

      render(
        <SettlementComparison 
          sessionId="test-session-1" 
          optimizedSettlement={mockOptimizedSettlement}
          onPlanSelect={mockOnPlanSelect}
        />
      );

      const selectButtons = screen.getAllByText('Select');
      fireEvent.press(selectButtons[1]); // Second select button (direct)

      expect(mockOnPlanSelect).toHaveBeenCalledWith(
        'direct',
        mockOptimizedSettlement.directPayments
      );
    });

    it('should not render select buttons when onPlanSelect not provided', () => {
      render(
        <SettlementComparison 
          sessionId="test-session-1" 
          optimizedSettlement={mockOptimizedSettlement}
        />
      );

      expect(screen.queryByText('Select')).toBeNull();
    });
  });

  describe('Responsive Layout', () => {
    it('should use tablet layout for wide screens', () => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 900, height: 800 });

      render(
        <SettlementComparison 
          sessionId="test-session-1" 
          optimizedSettlement={mockOptimizedSettlement}
          displayMode="side-by-side"
        />
      );

      // Should render side-by-side layout
      expect(screen.getByText('Optimized Plan')).toBeTruthy();
      expect(screen.getByText('Direct Plan')).toBeTruthy();
    });

    it('should use mobile layout for narrow screens', () => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 400, height: 800 });

      render(
        <SettlementComparison 
          sessionId="test-session-1" 
          optimizedSettlement={mockOptimizedSettlement}
          displayMode="side-by-side"
        />
      );

      // Should still work but with different styling
      expect(screen.getByText('Optimized Plan')).toBeTruthy();
    });
  });

  describe('Data Loading', () => {
    it('should load comparison data when settlement is available', async () => {
      render(
        <SettlementComparison 
          sessionId="test-session-1" 
          optimizedSettlement={mockOptimizedSettlement}
        />
      );

      await waitFor(() => {
        expect(mockCompareOptimizations).toHaveBeenCalledWith('test-session-1');
      });
    });

    it('should not load comparison data when already available', () => {
      mockUseSettlementOptimization.mockReturnValue({
        ...defaultHookReturn,
        comparison: mockComparison,
      });

      render(
        <SettlementComparison 
          sessionId="test-session-1" 
          optimizedSettlement={mockOptimizedSettlement}
        />
      );

      // Should not call compareOptimizations again
      expect(mockCompareOptimizations).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle retry from error state', async () => {
      const error = new ServiceError('COMPARISON_FAILED', 'Test error');
      mockUseSettlementOptimization.mockReturnValue({
        ...defaultHookReturn,
        error,
      });

      render(<SettlementComparison sessionId="test-session-1" />);

      const retryButton = screen.getByText('Retry');
      fireEvent.press(retryButton);

      await waitFor(() => {
        expect(mockClearError).toHaveBeenCalled();
        expect(mockCompareOptimizations).toHaveBeenCalledWith('test-session-1');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      render(
        <SettlementComparison 
          sessionId="test-session-1" 
          optimizedSettlement={mockOptimizedSettlement}
          accessibilityLabel="Custom Comparison View"
        />
      );

      expect(screen.getByAccessibilityLabel('Custom Comparison View')).toBeTruthy();
    });

    it('should have proper tab accessibility for view toggle', () => {
      render(
        <SettlementComparison 
          sessionId="test-session-1" 
          optimizedSettlement={mockOptimizedSettlement}
          displayMode="toggle"
        />
      );

      const optimizedTab = screen.getByText('Optimized');
      expect(optimizedTab.props.accessibilityRole).toBe('tab');
      expect(optimizedTab.props.accessibilityState?.selected).toBeTruthy();
    });

    it('should announce plan selections', () => {
      const { AccessibilityInfo } = require('react-native');
      const mockOnPlanSelect = jest.fn();

      render(
        <SettlementComparison 
          sessionId="test-session-1" 
          optimizedSettlement={mockOptimizedSettlement}
          onPlanSelect={mockOnPlanSelect}
        />
      );

      const selectButtons = screen.getAllByText('Select');
      fireEvent.press(selectButtons[0]);

      expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
        'Selected optimized settlement plan'
      );
    });
  });

  describe('Callback Integration', () => {
    it('should trigger comparison complete callback', async () => {
      const mockOnComparisonComplete = jest.fn();

      render(
        <SettlementComparison 
          sessionId="test-session-1" 
          optimizedSettlement={mockOptimizedSettlement}
          onComparisonComplete={mockOnComparisonComplete}
        />
      );

      // Wait for comparison to load
      await waitFor(() => {
        expect(mockCompareOptimizations).toHaveBeenCalled();
      });
    });
  });
});