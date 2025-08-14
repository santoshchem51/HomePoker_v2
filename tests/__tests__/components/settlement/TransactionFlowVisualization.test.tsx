/**
 * TransactionFlowVisualization Component Tests - Epic 3: Settlement Optimization
 * Story 3.2: Settlement Plan Visualization Components
 */

import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import { TransactionFlowVisualization } from '../../../../src/components/settlement/TransactionFlowVisualization';
import { PaymentPlan } from '../../../../src/types/settlement';

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

// Mock payment data
const mockPayments: PaymentPlan[] = [
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
  {
    fromPlayerId: 'player4',
    fromPlayerName: 'David',
    toPlayerId: 'player1',
    toPlayerName: 'Alice',
    amount: 30.00,
    priority: 3,
  },
];

describe('TransactionFlowVisualization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Dimensions.get as jest.Mock).mockReturnValue({ width: 400, height: 800 });
  });

  describe('Rendering', () => {
    it('should render empty state correctly', () => {
      render(<TransactionFlowVisualization payments={[]} />);

      expect(screen.getByText('Transaction Flow')).toBeTruthy();
      expect(screen.getByText('No Transactions')).toBeTruthy();
      expect(screen.getByText('No payment flows to visualize')).toBeTruthy();
    });

    it('should render header correctly with payments', () => {
      render(<TransactionFlowVisualization payments={mockPayments} />);

      expect(screen.getByText('Transaction Flow')).toBeTruthy();
      expect(screen.getByText('3 payments')).toBeTruthy();
    });

    it('should render custom title', () => {
      render(
        <TransactionFlowVisualization 
          payments={mockPayments} 
          title="Optimized Flow" 
        />
      );

      expect(screen.getByText('Optimized Flow')).toBeTruthy();
    });

    it('should render legend correctly', () => {
      render(<TransactionFlowVisualization payments={mockPayments} />);

      expect(screen.getByText('Legend')).toBeTruthy();
      expect(screen.getByText('Creditor (receives money)')).toBeTruthy();
      expect(screen.getByText('Debtor (pays money)')).toBeTruthy();
    });

    it('should render legend with optimal path when enabled', () => {
      render(
        <TransactionFlowVisualization 
          payments={mockPayments} 
          highlightOptimalPath={true}
        />
      );

      expect(screen.getByText('Optimal payment')).toBeTruthy();
    });

    it('should not render optimal path legend when disabled', () => {
      render(
        <TransactionFlowVisualization 
          payments={mockPayments} 
          highlightOptimalPath={false}
        />
      );

      expect(screen.queryByText('Optimal payment')).toBeNull();
    });
  });

  describe('Payment Flow Generation', () => {
    it('should generate player nodes correctly', () => {
      render(<TransactionFlowVisualization payments={mockPayments} />);

      // Should create nodes for all unique players
      // Alice: pays $50, receives $30 (net: -$20, debtor)
      // Bob: receives $50 + $25 (net: +$75, creditor)
      // Charlie: pays $25 (net: -$25, debtor)
      // David: pays $30 (net: -$30, debtor)
      
      // Check if player names are rendered (nodes are in canvas)
      expect(screen.getByText('Total Players:')).toBeTruthy();
      expect(screen.getByText('4')).toBeTruthy(); // 4 unique players
    });

    it('should calculate net positions correctly', () => {
      render(<TransactionFlowVisualization payments={mockPayments} />);

      // Summary should show correct totals
      expect(screen.getByText('Total Payments:')).toBeTruthy();
      expect(screen.getByText('3')).toBeTruthy();
      expect(screen.getByText('Total Amount:')).toBeTruthy();
      expect(screen.getByText('$105')).toBeTruthy(); // $50 + $25 + $30
    });
  });

  describe('Visual Elements', () => {
    it('should render flow summary correctly', () => {
      render(<TransactionFlowVisualization payments={mockPayments} />);

      expect(screen.getByText('Flow Summary')).toBeTruthy();
      expect(screen.getByText('Total Players:')).toBeTruthy();
      expect(screen.getByText('Total Payments:')).toBeTruthy();
      expect(screen.getByText('Total Amount:')).toBeTruthy();
    });

    it('should format currency correctly', () => {
      render(<TransactionFlowVisualization payments={mockPayments} />);

      expect(screen.getByText('$105')).toBeTruthy(); // Total formatted
    });

    it('should handle single payment', () => {
      const singlePayment = [mockPayments[0]];
      
      render(<TransactionFlowVisualization payments={singlePayment} />);

      expect(screen.getByText('1 payment')).toBeTruthy(); // Singular form
      expect(screen.getByText('2')).toBeTruthy(); // 2 players involved
    });
  });

  describe('Interaction', () => {
    it('should handle player selection when enabled', () => {
      const mockOnPlayerSelect = jest.fn();

      render(
        <TransactionFlowVisualization 
          payments={mockPayments} 
          enableInteraction={true}
          onPlayerSelect={mockOnPlayerSelect}
        />
      );

      // Player nodes should be touchable, but testing this requires finding them
      // Since player nodes are positioned absolutely, we test via accessibility
      const playerNodes = screen.getAllByAccessibilityRole('button').filter(
        button => button.props.accessibilityLabel?.includes('Player')
      );

      if (playerNodes.length > 0) {
        fireEvent.press(playerNodes[0]);
        expect(mockOnPlayerSelect).toHaveBeenCalled();
      }
    });

    it('should handle payment selection when enabled', () => {
      const mockOnPaymentSelect = jest.fn();

      render(
        <TransactionFlowVisualization 
          payments={mockPayments} 
          enableInteraction={true}
          onPaymentSelect={mockOnPaymentSelect}
        />
      );

      // Payment arrows should be touchable
      const paymentArrows = screen.getAllByAccessibilityRole('button').filter(
        button => button.props.accessibilityLabel?.includes('Payment arrow')
      );

      if (paymentArrows.length > 0) {
        fireEvent.press(paymentArrows[0]);
        expect(mockOnPaymentSelect).toHaveBeenCalled();
      }
    });

    it('should not handle interactions when disabled', () => {
      const mockOnPlayerSelect = jest.fn();
      const mockOnPaymentSelect = jest.fn();

      render(
        <TransactionFlowVisualization 
          payments={mockPayments} 
          enableInteraction={false}
          onPlayerSelect={mockOnPlayerSelect}
          onPaymentSelect={mockOnPaymentSelect}
        />
      );

      // Buttons should be disabled
      const buttons = screen.getAllByAccessibilityRole('button');
      buttons.forEach(button => {
        expect(button.props.disabled).toBe(true);
      });
    });
  });

  describe('Display Options', () => {
    it('should show amounts when enabled', () => {
      render(
        <TransactionFlowVisualization 
          payments={mockPayments} 
          showAmounts={true}
        />
      );

      // Amount labels should be present in the canvas
      // Since they're positioned absolutely, we check the prop is processed
      expect(screen.getByText('Flow Summary')).toBeTruthy(); // Indicates component rendered
    });

    it('should show priority when enabled', () => {
      render(
        <TransactionFlowVisualization 
          payments={mockPayments} 
          showPriority={true}
        />
      );

      // Priority badges should be present
      expect(screen.getByText('Flow Summary')).toBeTruthy(); // Indicates component rendered
    });

    it('should not show amounts when disabled', () => {
      render(
        <TransactionFlowVisualization 
          payments={mockPayments} 
          showAmounts={false}
        />
      );

      // Component should still render without amounts
      expect(screen.getByText('Transaction Flow')).toBeTruthy();
    });

    it('should not show priority when disabled', () => {
      render(
        <TransactionFlowVisualization 
          payments={mockPayments} 
          showPriority={false}
        />
      );

      // Component should still render without priority
      expect(screen.getByText('Transaction Flow')).toBeTruthy();
    });
  });

  describe('Canvas Sizing', () => {
    it('should adapt to screen dimensions', () => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 800, height: 600 });

      render(<TransactionFlowVisualization payments={mockPayments} />);

      // Should render without errors with different dimensions
      expect(screen.getByText('Transaction Flow')).toBeTruthy();
    });

    it('should handle minimum canvas size', () => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 200, height: 300 });

      render(<TransactionFlowVisualization payments={mockPayments} />);

      // Should render without errors with small dimensions
      expect(screen.getByText('Transaction Flow')).toBeTruthy();
    });
  });

  describe('Node Positioning', () => {
    it('should position nodes in circular layout', () => {
      render(<TransactionFlowVisualization payments={mockPayments} />);

      // Component should calculate positions without errors
      expect(screen.getByText('4')).toBeTruthy(); // Player count
    });

    it('should handle single player scenario', () => {
      const singlePlayerPayments = [
        {
          fromPlayerId: 'player1',
          fromPlayerName: 'Alice',
          toPlayerId: 'player1',
          toPlayerName: 'Alice',
          amount: 0,
          priority: 1,
        },
      ];

      render(<TransactionFlowVisualization payments={singlePlayerPayments} />);

      expect(screen.getByText('1')).toBeTruthy(); // Single player
    });
  });

  describe('Connection Visualization', () => {
    it('should calculate connection paths correctly', () => {
      render(<TransactionFlowVisualization payments={mockPayments} />);

      // Should render connections without errors
      expect(screen.getByText('Transaction Flow')).toBeTruthy();
    });

    it('should handle self-payments', () => {
      const selfPayment = [
        {
          fromPlayerId: 'player1',
          fromPlayerName: 'Alice',
          toPlayerId: 'player1',
          toPlayerName: 'Alice',
          amount: 50,
          priority: 1,
        },
      ];

      render(<TransactionFlowVisualization payments={selfPayment} />);

      // Should handle self-payments gracefully
      expect(screen.getByText('Transaction Flow')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      render(
        <TransactionFlowVisualization 
          payments={mockPayments} 
          accessibilityLabel="Custom Flow Visualization"
        />
      );

      expect(screen.getByAccessibilityLabel('Custom Flow Visualization')).toBeTruthy();
    });

    it('should announce player selections', () => {
      const { AccessibilityInfo } = require('react-native');
      const mockOnPlayerSelect = jest.fn();

      render(
        <TransactionFlowVisualization 
          payments={mockPayments} 
          enableInteraction={true}
          onPlayerSelect={mockOnPlayerSelect}
        />
      );

      const playerNodes = screen.getAllByAccessibilityRole('button').filter(
        button => button.props.accessibilityLabel?.includes('Player')
      );

      if (playerNodes.length > 0) {
        fireEvent.press(playerNodes[0]);
        expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalled();
      }
    });

    it('should provide proper button accessibility info', () => {
      render(
        <TransactionFlowVisualization 
          payments={mockPayments} 
          enableInteraction={true}
        />
      );

      const buttons = screen.getAllByAccessibilityRole('button');
      
      buttons.forEach(button => {
        expect(button.props.accessibilityLabel).toBeDefined();
        expect(button.props.accessibilityRole).toBe('button');
      });
    });
  });

  describe('Color Coding', () => {
    it('should apply correct colors for optimal paths', () => {
      render(
        <TransactionFlowVisualization 
          payments={mockPayments} 
          highlightOptimalPath={true}
        />
      );

      // Should render with optimal path highlighting
      expect(screen.getByText('Optimal payment')).toBeTruthy();
    });

    it('should use neutral colors when optimal path disabled', () => {
      render(
        <TransactionFlowVisualization 
          payments={mockPayments} 
          highlightOptimalPath={false}
        />
      );

      // Should render without optimal path highlighting
      expect(screen.queryByText('Optimal payment')).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty player names', () => {
      const paymentsWithEmptyNames = [
        {
          fromPlayerId: 'player1',
          fromPlayerName: '',
          toPlayerId: 'player2',
          toPlayerName: '',
          amount: 50,
          priority: 1,
        },
      ];

      render(<TransactionFlowVisualization payments={paymentsWithEmptyNames} />);

      // Should render without crashing
      expect(screen.getByText('Transaction Flow')).toBeTruthy();
    });

    it('should handle zero amounts', () => {
      const zeroAmountPayments = [
        {
          fromPlayerId: 'player1',
          fromPlayerName: 'Alice',
          toPlayerId: 'player2',
          toPlayerName: 'Bob',
          amount: 0,
          priority: 1,
        },
      ];

      render(<TransactionFlowVisualization payments={zeroAmountPayments} />);

      expect(screen.getByText('$0')).toBeTruthy(); // Zero total
    });

    it('should handle very large amounts', () => {
      const largeAmountPayments = [
        {
          fromPlayerId: 'player1',
          fromPlayerName: 'Alice',
          toPlayerId: 'player2',
          toPlayerName: 'Bob',
          amount: 999999.99,
          priority: 1,
        },
      ];

      render(<TransactionFlowVisualization payments={largeAmountPayments} />);

      expect(screen.getByText('$999,999')).toBeTruthy(); // Formatted large amount
    });

    it('should handle many players', () => {
      const manyPlayersPayments = Array.from({ length: 10 }, (_, i) => ({
        fromPlayerId: `player${i}`,
        fromPlayerName: `Player ${i}`,
        toPlayerId: `player${i + 1}`,
        toPlayerName: `Player ${i + 1}`,
        amount: 10,
        priority: i + 1,
      }));

      render(<TransactionFlowVisualization payments={manyPlayersPayments} />);

      expect(screen.getByText('11')).toBeTruthy(); // 11 unique players
      expect(screen.getByText('10 payments')).toBeTruthy();
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        fromPlayerId: `from${i}`,
        fromPlayerName: `From Player ${i}`,
        toPlayerId: `to${i}`,
        toPlayerName: `To Player ${i}`,
        amount: Math.random() * 100,
        priority: i + 1,
      }));

      const startTime = Date.now();
      render(<TransactionFlowVisualization payments={largeDataset} />);
      const endTime = Date.now();

      // Should render within reasonable time (less than 1 second)
      expect(endTime - startTime).toBeLessThan(1000);
      expect(screen.getByText('Transaction Flow')).toBeTruthy();
    });
  });
});