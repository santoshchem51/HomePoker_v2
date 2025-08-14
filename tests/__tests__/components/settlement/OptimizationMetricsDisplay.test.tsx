/**
 * OptimizationMetricsDisplay Component Tests - Epic 3: Settlement Optimization
 * Story 3.2: Settlement Plan Visualization Components
 */

import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Animated } from 'react-native';
import { OptimizationMetricsDisplay } from '../../../../src/components/settlement/OptimizationMetricsDisplay';
import { OptimizedSettlement } from '../../../../src/types/settlement';

// Mock Animated
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Animated: {
      ...RN.Animated,
      Value: jest.fn(() => ({
        interpolate: jest.fn(() => 0),
      })),
      timing: jest.fn(() => ({
        start: jest.fn(),
      })),
      stagger: jest.fn(() => ({
        start: jest.fn(),
      })),
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

describe('OptimizationMetricsDisplay', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render header correctly', () => {
      render(<OptimizationMetricsDisplay optimizedSettlement={mockOptimizedSettlement} />);

      expect(screen.getByText('Optimization Metrics')).toBeTruthy();
      expect(screen.getByText('Performance and efficiency indicators')).toBeTruthy();
    });

    it('should render comparison summary when enabled', () => {
      render(
        <OptimizationMetricsDisplay 
          optimizedSettlement={mockOptimizedSettlement}
          showComparison={true}
        />
      );

      expect(screen.getByText('Optimization Summary')).toBeTruthy();
      expect(screen.getByText('Before')).toBeTruthy();
      expect(screen.getByText('After')).toBeTruthy();
      expect(screen.getByText('3 payments')).toBeTruthy(); // Original
      expect(screen.getByText('2 payments')).toBeTruthy(); // Optimized
    });

    it('should not render comparison summary when disabled', () => {
      render(
        <OptimizationMetricsDisplay 
          optimizedSettlement={mockOptimizedSettlement}
          showComparison={false}
        />
      );

      expect(screen.queryByText('Optimization Summary')).toBeNull();
    });

    it('should render all metric cards', () => {
      render(<OptimizationMetricsDisplay optimizedSettlement={mockOptimizedSettlement} />);

      expect(screen.getByText('Transaction Reduction')).toBeTruthy();
      expect(screen.getByText('Processing Time')).toBeTruthy();
      expect(screen.getByText('Settlement Amount')).toBeTruthy();
      expect(screen.getByText('Efficiency Rating')).toBeTruthy();
      expect(screen.getByText('Mathematical Balance')).toBeTruthy();
      expect(screen.getByText('Validation Status')).toBeTruthy();
    });
  });

  describe('Metric Calculations', () => {
    it('should display correct transaction reduction metrics', () => {
      render(<OptimizationMetricsDisplay optimizedSettlement={mockOptimizedSettlement} />);

      expect(screen.getByText('1')).toBeTruthy(); // 3 - 2 = 1 reduction
      expect(screen.getByText('(33.3% improvement)')).toBeTruthy();
    });

    it('should display correct processing time', () => {
      render(<OptimizationMetricsDisplay optimizedSettlement={mockOptimizedSettlement} />);

      expect(screen.getByText('150ms')).toBeTruthy();
      expect(screen.getByText('Fast')).toBeTruthy(); // < 500ms
    });

    it('should display correct settlement amount', () => {
      render(<OptimizationMetricsDisplay optimizedSettlement={mockOptimizedSettlement} />);

      expect(screen.getByText('$75.00')).toBeTruthy();
      expect(screen.getByText('2 payments')).toBeTruthy();
    });

    it('should display correct efficiency rating', () => {
      render(<OptimizationMetricsDisplay optimizedSettlement={mockOptimizedSettlement} />);

      expect(screen.getByText('Fair')).toBeTruthy(); // 33.33% is in Fair range (25-40%)
      expect(screen.getByText('(33.3% reduction)')).toBeTruthy();
    });

    it('should display correct mathematical balance status', () => {
      render(<OptimizationMetricsDisplay optimizedSettlement={mockOptimizedSettlement} />);

      expect(screen.getByText('Balanced')).toBeTruthy();
      expect(screen.getByText('$0.00')).toBeTruthy(); // Net balance
    });

    it('should display correct validation status', () => {
      render(<OptimizationMetricsDisplay optimizedSettlement={mockOptimizedSettlement} />);

      expect(screen.getByText('Valid')).toBeTruthy();
      expect(screen.getByText('All checks passed')).toBeTruthy();
    });
  });

  describe('Efficiency Rating Categories', () => {
    it('should show Excellent rating for high reduction', () => {
      const excellentSettlement = {
        ...mockOptimizedSettlement,
        optimizationMetrics: {
          ...mockOptimizedSettlement.optimizationMetrics,
          reductionPercentage: 65,
        },
      };

      render(<OptimizationMetricsDisplay optimizedSettlement={excellentSettlement} />);

      expect(screen.getByText('Excellent')).toBeTruthy();
    });

    it('should show Good rating for good reduction', () => {
      const goodSettlement = {
        ...mockOptimizedSettlement,
        optimizationMetrics: {
          ...mockOptimizedSettlement.optimizationMetrics,
          reductionPercentage: 45,
        },
      };

      render(<OptimizationMetricsDisplay optimizedSettlement={goodSettlement} />);

      expect(screen.getByText('Good')).toBeTruthy();
    });

    it('should show Poor rating for low reduction', () => {
      const poorSettlement = {
        ...mockOptimizedSettlement,
        optimizationMetrics: {
          ...mockOptimizedSettlement.optimizationMetrics,
          reductionPercentage: 15,
        },
      };

      render(<OptimizationMetricsDisplay optimizedSettlement={poorSettlement} />);

      expect(screen.getByText('Poor')).toBeTruthy();
    });

    it('should show Minimal rating for very low reduction', () => {
      const minimalSettlement = {
        ...mockOptimizedSettlement,
        optimizationMetrics: {
          ...mockOptimizedSettlement.optimizationMetrics,
          reductionPercentage: 5,
        },
      };

      render(<OptimizationMetricsDisplay optimizedSettlement={minimalSettlement} />);

      expect(screen.getByText('Minimal')).toBeTruthy();
    });
  });

  describe('Processing Time Categories', () => {
    it('should show Fast for quick processing', () => {
      const fastSettlement = {
        ...mockOptimizedSettlement,
        optimizationMetrics: {
          ...mockOptimizedSettlement.optimizationMetrics,
          processingTime: 300,
        },
      };

      render(<OptimizationMetricsDisplay optimizedSettlement={fastSettlement} />);

      expect(screen.getByText('Fast')).toBeTruthy();
    });

    it('should show Good for moderate processing', () => {
      const moderateSettlement = {
        ...mockOptimizedSettlement,
        optimizationMetrics: {
          ...mockOptimizedSettlement.optimizationMetrics,
          processingTime: 800,
        },
      };

      render(<OptimizationMetricsDisplay optimizedSettlement={moderateSettlement} />);

      expect(screen.getByText('Good')).toBeTruthy();
    });

    it('should show Slow for long processing', () => {
      const slowSettlement = {
        ...mockOptimizedSettlement,
        optimizationMetrics: {
          ...mockOptimizedSettlement.optimizationMetrics,
          processingTime: 1800,
        },
      };

      render(<OptimizationMetricsDisplay optimizedSettlement={slowSettlement} />);

      expect(screen.getByText('Slow')).toBeTruthy();
    });

    it('should format time in seconds for large values', () => {
      const longProcessingSettlement = {
        ...mockOptimizedSettlement,
        optimizationMetrics: {
          ...mockOptimizedSettlement.optimizationMetrics,
          processingTime: 2500,
        },
      };

      render(<OptimizationMetricsDisplay optimizedSettlement={longProcessingSettlement} />);

      expect(screen.getByText('2.5s')).toBeTruthy(); // > 1000ms shown in seconds
    });
  });

  describe('Validation Status Display', () => {
    it('should show invalid status correctly', () => {
      const invalidSettlement = {
        ...mockOptimizedSettlement,
        isValid: false,
        validationErrors: ['Balance error', 'Timeout error'],
      };

      render(<OptimizationMetricsDisplay optimizedSettlement={invalidSettlement} />);

      expect(screen.getByText('Invalid')).toBeTruthy();
      expect(screen.getByText('2 issues')).toBeTruthy();
    });

    it('should show unbalanced mathematical status', () => {
      const unbalancedSettlement = {
        ...mockOptimizedSettlement,
        mathematicalProof: {
          ...mockOptimizedSettlement.mathematicalProof,
          isBalanced: false,
          netBalance: 5.50,
        },
      };

      render(<OptimizationMetricsDisplay optimizedSettlement={unbalancedSettlement} />);

      expect(screen.getByText('Unbalanced')).toBeTruthy();
      expect(screen.getByText('$5.50')).toBeTruthy(); // Discrepancy amount
    });
  });

  describe('Trends and Improvements', () => {
    it('should show trend indicators when enabled', () => {
      render(
        <OptimizationMetricsDisplay 
          optimizedSettlement={mockOptimizedSettlement}
          showTrends={true}
        />
      );

      // Trends are shown as icons in the metric cards
      expect(screen.getByText('Transaction Reduction')).toBeTruthy();
    });

    it('should not show trend indicators when disabled', () => {
      render(
        <OptimizationMetricsDisplay 
          optimizedSettlement={mockOptimizedSettlement}
          showTrends={false}
        />
      );

      // Should still render metrics without trends
      expect(screen.getByText('Transaction Reduction')).toBeTruthy();
    });

    it('should show improvement badges for significant improvements', () => {
      const highImprovementSettlement = {
        ...mockOptimizedSettlement,
        optimizationMetrics: {
          ...mockOptimizedSettlement.optimizationMetrics,
          reductionPercentage: 55,
        },
      };

      render(<OptimizationMetricsDisplay optimizedSettlement={highImprovementSettlement} />);

      // Should show improvement percentage
      expect(screen.getByText('+55%')).toBeTruthy();
    });
  });

  describe('Interaction', () => {
    it('should handle metric card press when enabled', () => {
      const mockOnMetricPress = jest.fn();

      render(
        <OptimizationMetricsDisplay 
          optimizedSettlement={mockOptimizedSettlement}
          enableInteraction={true}
          onMetricPress={mockOnMetricPress}
        />
      );

      // Find and press a metric card
      const transactionReductionCard = screen.getByAccessibilityLabel(/Transaction Reduction:/);
      fireEvent.press(transactionReductionCard);

      expect(mockOnMetricPress).toHaveBeenCalledWith(
        'transaction_reduction',
        expect.objectContaining({
          id: 'transaction_reduction',
          title: 'Transaction Reduction',
        })
      );
    });

    it('should not handle interaction when disabled', () => {
      const mockOnMetricPress = jest.fn();

      render(
        <OptimizationMetricsDisplay 
          optimizedSettlement={mockOptimizedSettlement}
          enableInteraction={false}
          onMetricPress={mockOnMetricPress}
        />
      );

      // Cards should be disabled
      const metricCards = screen.getAllByAccessibilityRole('button');
      metricCards.forEach(card => {
        expect(card.props.disabled).toBe(true);
      });
    });
  });

  describe('Key Insights', () => {
    it('should show excellent optimization insight', () => {
      const excellentSettlement = {
        ...mockOptimizedSettlement,
        optimizationMetrics: {
          ...mockOptimizedSettlement.optimizationMetrics,
          reductionPercentage: 50,
        },
      };

      render(<OptimizationMetricsDisplay optimizedSettlement={excellentSettlement} />);

      expect(screen.getByText('Key Insights')).toBeTruthy();
      expect(screen.getByText(/Excellent optimization achieved/)).toBeTruthy();
    });

    it('should show fast processing insight', () => {
      const fastSettlement = {
        ...mockOptimizedSettlement,
        optimizationMetrics: {
          ...mockOptimizedSettlement.optimizationMetrics,
          processingTime: 300,
        },
      };

      render(<OptimizationMetricsDisplay optimizedSettlement={fastSettlement} />);

      expect(screen.getByText(/Fast processing time/)).toBeTruthy();
    });

    it('should show balanced insight', () => {
      render(<OptimizationMetricsDisplay optimizedSettlement={mockOptimizedSettlement} />);

      expect(screen.getByText(/Perfect mathematical balance/)).toBeTruthy();
    });

    it('should show validation issues insight', () => {
      const invalidSettlement = {
        ...mockOptimizedSettlement,
        validationErrors: ['Error 1', 'Error 2'],
      };

      render(<OptimizationMetricsDisplay optimizedSettlement={invalidSettlement} />);

      expect(screen.getByText(/2 validation issues found/)).toBeTruthy();
    });
  });

  describe('Animation', () => {
    it('should initialize animations on mount', () => {
      render(<OptimizationMetricsDisplay optimizedSettlement={mockOptimizedSettlement} />);

      // Verify Animated.timing was called for metric cards
      expect(Animated.timing).toHaveBeenCalled();
      expect(Animated.stagger).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      render(
        <OptimizationMetricsDisplay 
          optimizedSettlement={mockOptimizedSettlement}
          accessibilityLabel="Custom Metrics Display"
        />
      );

      expect(screen.getByAccessibilityLabel('Custom Metrics Display')).toBeTruthy();
    });

    it('should announce metric selections', () => {
      const { AccessibilityInfo } = require('react-native');
      const mockOnMetricPress = jest.fn();

      render(
        <OptimizationMetricsDisplay 
          optimizedSettlement={mockOptimizedSettlement}
          enableInteraction={true}
          onMetricPress={mockOnMetricPress}
        />
      );

      const transactionReductionCard = screen.getByAccessibilityLabel(/Transaction Reduction:/);
      fireEvent.press(transactionReductionCard);

      expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
        expect.stringContaining('Selected Transaction Reduction')
      );
    });

    it('should have proper button accessibility attributes', () => {
      render(
        <OptimizationMetricsDisplay 
          optimizedSettlement={mockOptimizedSettlement}
          enableInteraction={true}
        />
      );

      const metricCards = screen.getAllByAccessibilityRole('button');
      
      metricCards.forEach(card => {
        expect(card.props.accessibilityRole).toBe('button');
        expect(card.props.accessibilityLabel).toBeDefined();
        expect(card.props.accessibilityHint).toBeDefined();
      });
    });
  });

  describe('Currency Formatting', () => {
    it('should format currency correctly', () => {
      render(<OptimizationMetricsDisplay optimizedSettlement={mockOptimizedSettlement} />);

      expect(screen.getByText('$75.00')).toBeTruthy();
      expect(screen.getByText('$0.00')).toBeTruthy(); // Net balance
    });

    it('should handle large amounts', () => {
      const largeAmountSettlement = {
        ...mockOptimizedSettlement,
        optimizationMetrics: {
          ...mockOptimizedSettlement.optimizationMetrics,
          totalAmountSettled: 1234567.89,
        },
      };

      render(<OptimizationMetricsDisplay optimizedSettlement={largeAmountSettlement} />);

      expect(screen.getByText('$1,234,567.89')).toBeTruthy();
    });

    it('should handle negative amounts', () => {
      const negativeBalanceSettlement = {
        ...mockOptimizedSettlement,
        mathematicalProof: {
          ...mockOptimizedSettlement.mathematicalProof,
          netBalance: -5.25,
        },
      };

      render(<OptimizationMetricsDisplay optimizedSettlement={negativeBalanceSettlement} />);

      expect(screen.getByText('$5.25')).toBeTruthy(); // Absolute value displayed
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero reduction percentage', () => {
      const zeroReductionSettlement = {
        ...mockOptimizedSettlement,
        optimizationMetrics: {
          ...mockOptimizedSettlement.optimizationMetrics,
          reductionPercentage: 0,
        },
      };

      render(<OptimizationMetricsDisplay optimizedSettlement={zeroReductionSettlement} />);

      expect(screen.getByText('0')).toBeTruthy(); // Zero reduction
      expect(screen.getByText('(0.0% improvement)')).toBeTruthy();
    });

    it('should handle zero processing time', () => {
      const zeroTimeSettlement = {
        ...mockOptimizedSettlement,
        optimizationMetrics: {
          ...mockOptimizedSettlement.optimizationMetrics,
          processingTime: 0,
        },
      };

      render(<OptimizationMetricsDisplay optimizedSettlement={zeroTimeSettlement} />);

      expect(screen.getByText('0ms')).toBeTruthy();
    });

    it('should handle empty validation errors array', () => {
      const noErrorsSettlement = {
        ...mockOptimizedSettlement,
        validationErrors: [],
      };

      render(<OptimizationMetricsDisplay optimizedSettlement={noErrorsSettlement} />);

      expect(screen.getByText('All checks passed')).toBeTruthy();
    });
  });
});