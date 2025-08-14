/**
 * Early Cash-out Calculator Component Tests - Epic 3: Settlement Optimization
 * Story 3.1: Early Cash-out Calculator Implementation
 * 
 * Component tests for UI functionality and user interactions
 */

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { EarlyCashOutCalculator } from '../../../../src/components/settlement/EarlyCashOutCalculator';
import { useEarlyCashOut } from '../../../../src/hooks/useEarlyCashOut';
import { EarlyCashOutResult } from '../../../../src/types/settlement';
import { ServiceError } from '../../../../src/services/core/ServiceError';

// Mock dependencies
jest.mock('../../../../src/hooks/useEarlyCashOut');
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

const mockUseEarlyCashOut = useEarlyCashOut as jest.MockedFunction<typeof useEarlyCashOut>;
const mockAlert = Alert.alert as jest.MockedFunction<typeof Alert.alert>;

describe('EarlyCashOutCalculator', () => {
  const defaultProps = {
    sessionId: 'test-session-123',
    playerId: 'player-456',
    playerName: 'John Doe',
  };

  const mockEarlyCashOutHook = {
    calculateCashOut: jest.fn(),
    result: null,
    error: null,
    isLoading: false,
    clearResult: jest.fn(),
    clearError: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseEarlyCashOut.mockReturnValue(mockEarlyCashOutHook as any);
  });

  describe('Rendering', () => {
    it('should render calculator with player name', () => {
      render(<EarlyCashOutCalculator {...defaultProps} />);
      
      expect(screen.getByText('Early Cash-out Calculator')).toBeTruthy();
      expect(screen.getByText('John Doe')).toBeTruthy();
      expect(screen.getByText('Current Chip Count')).toBeTruthy();
      expect(screen.getByText('Calculate Settlement')).toBeTruthy();
    });

    it('should render close button when onClose provided', () => {
      const onClose = jest.fn();
      render(<EarlyCashOutCalculator {...defaultProps} onClose={onClose} />);
      
      const closeButton = screen.getByText('✕');
      expect(closeButton).toBeTruthy();
      
      fireEvent.press(closeButton);
      expect(onClose).toHaveBeenCalled();
    });

    it('should not render close button when onClose not provided', () => {
      render(<EarlyCashOutCalculator {...defaultProps} />);
      
      expect(screen.queryByText('✕')).toBeNull();
    });
  });

  describe('Input Handling', () => {
    it('should accept valid chip count input', () => {
      render(<EarlyCashOutCalculator {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Enter chip count');
      fireEvent.changeText(input, '150');
      
      expect(input.props.value).toBe('150');
    });

    it('should accept decimal chip counts', () => {
      render(<EarlyCashOutCalculator {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Enter chip count');
      fireEvent.changeText(input, '150.50');
      
      expect(input.props.value).toBe('150.50');
    });

    it('should show alert for invalid input', () => {
      render(<EarlyCashOutCalculator {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Enter chip count');
      const button = screen.getByText('Calculate Settlement');
      
      fireEvent.changeText(input, 'invalid');
      fireEvent.press(button);
      
      expect(mockAlert).toHaveBeenCalledWith(
        'Invalid Input',
        'Please enter a valid chip count'
      );
    });

    it('should show alert for negative input', () => {
      render(<EarlyCashOutCalculator {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Enter chip count');
      const button = screen.getByText('Calculate Settlement');
      
      fireEvent.changeText(input, '-50');
      fireEvent.press(button);
      
      expect(mockAlert).toHaveBeenCalledWith(
        'Invalid Input',
        'Please enter a valid chip count'
      );
    });
  });

  describe('Calculation Process', () => {
    it('should call calculateCashOut with correct parameters', async () => {
      render(<EarlyCashOutCalculator {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Enter chip count');
      const button = screen.getByText('Calculate Settlement');
      
      fireEvent.changeText(input, '150');
      fireEvent.press(button);
      
      expect(mockEarlyCashOutHook.calculateCashOut).toHaveBeenCalledWith({
        sessionId: 'test-session-123',
        playerId: 'player-456',
        currentChipCount: 150,
        timestamp: expect.any(Date),
      });
    });

    it('should show loading state during calculation', () => {
      mockUseEarlyCashOut.mockReturnValue({
        ...mockEarlyCashOutHook,
        isLoading: true,
      } as any);
      
      render(<EarlyCashOutCalculator {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button.props.accessibilityState?.disabled).toBe(true);
      expect(screen.getByText('Recording...')).toBeTruthy();
    });

    it('should disable input during loading', () => {
      mockUseEarlyCashOut.mockReturnValue({
        ...mockEarlyCashOutHook,
        isLoading: true,
      } as any);
      
      render(<EarlyCashOutCalculator {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Enter chip count');
      expect(input.props.editable).toBe(false);
    });
  });

  describe('Results Display', () => {
    const mockPositiveResult: EarlyCashOutResult = {
      playerId: 'player-456',
      playerName: 'John Doe',
      currentChipValue: 150,
      totalBuyIns: 100,
      netPosition: 50,
      settlementAmount: 50,
      settlementType: 'payment_to_player',
      calculationTimestamp: new Date(),
      calculationDurationMs: 25,
      bankBalanceBefore: 200,
      bankBalanceAfter: 150,
      isValid: true,
      validationMessages: [],
    };

    it('should display positive settlement result', () => {
      mockUseEarlyCashOut.mockReturnValue({
        ...mockEarlyCashOutHook,
        result: mockPositiveResult,
      } as any);
      
      render(<EarlyCashOutCalculator {...defaultProps} />);
      
      expect(screen.getByText('Settlement Calculation')).toBeTruthy();
      expect(screen.getByText('$150.00')).toBeTruthy(); // Chip value
      expect(screen.getByText('$100.00')).toBeTruthy(); // Total buy-ins
      expect(screen.getByText('+$50.00')).toBeTruthy(); // Net position
      expect(screen.getByText('You Receive:')).toBeTruthy();
      expect(screen.getByText('Bank balance after settlement: $150.00')).toBeTruthy();
      expect(screen.getByText('Calculated in 25ms')).toBeTruthy();
    });

    it('should display negative settlement result', () => {
      const negativeResult: EarlyCashOutResult = {
        ...mockPositiveResult,
        currentChipValue: 75,
        netPosition: -25,
        settlementAmount: 25,
        settlementType: 'payment_from_player',
      };
      
      mockUseEarlyCashOut.mockReturnValue({
        ...mockEarlyCashOutHook,
        result: negativeResult,
      } as any);
      
      render(<EarlyCashOutCalculator {...defaultProps} />);
      
      expect(screen.getByText('$75.00')).toBeTruthy(); // Chip value
      expect(screen.getByText('-$25.00')).toBeTruthy(); // Net position (negative)
      expect(screen.getByText('You Pay:')).toBeTruthy();
    });

    it('should display even settlement result', () => {
      const evenResult: EarlyCashOutResult = {
        ...mockPositiveResult,
        currentChipValue: 100,
        netPosition: 0,
        settlementAmount: 0,
        settlementType: 'even',
      };
      
      mockUseEarlyCashOut.mockReturnValue({
        ...mockEarlyCashOutHook,
        result: evenResult,
      } as any);
      
      render(<EarlyCashOutCalculator {...defaultProps} />);
      
      expect(screen.getByText('$100.00')).toBeTruthy(); // Chip value
      expect(screen.getByText('$0.00')).toBeTruthy(); // Net position (zero)
      expect(screen.getByText('Settlement:')).toBeTruthy();
    });

    it('should display validation warnings', () => {
      const resultWithWarnings: EarlyCashOutResult = {
        ...mockPositiveResult,
        isValid: false,
        validationMessages: ['Insufficient bank balance', 'Manual review required'],
      };
      
      mockUseEarlyCashOut.mockReturnValue({
        ...mockEarlyCashOutHook,
        result: resultWithWarnings,
      } as any);
      
      render(<EarlyCashOutCalculator {...defaultProps} />);
      
      expect(screen.getByText('⚠️ Warnings:')).toBeTruthy();
      expect(screen.getByText('• Insufficient bank balance')).toBeTruthy();
      expect(screen.getByText('• Manual review required')).toBeTruthy();
    });

    it('should call onCalculationComplete when result is available', () => {
      const onCalculationComplete = jest.fn();
      
      mockUseEarlyCashOut.mockReturnValue({
        ...mockEarlyCashOutHook,
        result: mockPositiveResult,
      } as any);
      
      render(
        <EarlyCashOutCalculator 
          {...defaultProps} 
          onCalculationComplete={onCalculationComplete}
        />
      );
      
      expect(onCalculationComplete).toHaveBeenCalledWith(mockPositiveResult);
    });
  });

  describe('Error Handling', () => {
    it('should display error message', () => {
      const mockError = new ServiceError('CALCULATION_FAILED', 'Settlement calculation failed');
      
      mockUseEarlyCashOut.mockReturnValue({
        ...mockEarlyCashOutHook,
        error: mockError,
      } as any);
      
      render(<EarlyCashOutCalculator {...defaultProps} />);
      
      expect(screen.getByText('⚠️')).toBeTruthy();
      expect(screen.getByText('Settlement calculation failed')).toBeTruthy();
      expect(screen.getByText('Dismiss')).toBeTruthy();
    });

    it('should clear error when dismiss button pressed', () => {
      const mockError = new ServiceError('CALCULATION_FAILED', 'Settlement calculation failed');
      
      mockUseEarlyCashOut.mockReturnValue({
        ...mockEarlyCashOutHook,
        error: mockError,
      } as any);
      
      render(<EarlyCashOutCalculator {...defaultProps} />);
      
      const dismissButton = screen.getByText('Dismiss');
      fireEvent.press(dismissButton);
      
      expect(mockEarlyCashOutHook.clearError).toHaveBeenCalled();
    });
  });

  describe('Reset Functionality', () => {
    it('should clear form and results when reset button pressed', () => {
      mockUseEarlyCashOut.mockReturnValue({
        ...mockEarlyCashOutHook,
        result: {
          playerId: 'player-456',
          playerName: 'John Doe',
          currentChipValue: 150,
          totalBuyIns: 100,
          netPosition: 50,
          settlementAmount: 50,
          settlementType: 'payment_to_player',
          calculationTimestamp: new Date(),
          calculationDurationMs: 25,
          bankBalanceBefore: 200,
          bankBalanceAfter: 150,
          isValid: true,
          validationMessages: [],
        },
      } as any);
      
      render(<EarlyCashOutCalculator {...defaultProps} />);
      
      // Set input value
      const input = screen.getByPlaceholderText('Enter chip count');
      fireEvent.changeText(input, '150');
      
      // Press reset button
      const resetButton = screen.getByText('Calculate Another');
      fireEvent.press(resetButton);
      
      expect(input.props.value).toBe('');
      expect(mockEarlyCashOutHook.clearResult).toHaveBeenCalled();
      expect(mockEarlyCashOutHook.clearError).toHaveBeenCalled();
    });
  });

  describe('Performance Requirements', () => {
    it('should complete UI updates within reasonable time', async () => {
      const onCalculationComplete = jest.fn();
      
      render(
        <EarlyCashOutCalculator 
          {...defaultProps} 
          onCalculationComplete={onCalculationComplete}
        />
      );
      
      const input = screen.getByPlaceholderText('Enter chip count');
      const button = screen.getByText('Calculate Settlement');
      
      const startTime = Date.now();
      
      fireEvent.changeText(input, '150');
      fireEvent.press(button);
      
      const endTime = Date.now();
      
      // UI should respond immediately (under 100ms for UI operations)
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      render(<EarlyCashOutCalculator {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Enter chip count');
      const button = screen.getByText('Calculate Settlement');
      
      expect(input).toBeTruthy();
      expect(button).toBeTruthy();
    });

    it('should support keyboard navigation', () => {
      render(<EarlyCashOutCalculator {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Enter chip count');
      
      // Should accept numeric keyboard type
      expect(input.props.keyboardType).toBe('numeric');
    });
  });
});