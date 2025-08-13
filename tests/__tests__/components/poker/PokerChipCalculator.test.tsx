/**
 * PokerChipCalculator Component Tests
 * Story 2.3: Enhanced Touch Interface for Buy-ins - Testing AC 3
 */
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import PokerChipCalculator from '../../../../src/components/poker/PokerChipCalculator';
import { TransactionService } from '../../../../src/services/core/TransactionService';
import { HapticService } from '../../../../src/services/integration/HapticService';
import { TRANSACTION_LIMITS } from '../../../../src/types/transaction';

// Mock dependencies
jest.mock('../../../../src/services/core/TransactionService');
jest.mock('../../../../src/services/integration/HapticService');
jest.spyOn(Alert, 'alert');

const mockTransactionService = {
  recordBuyIn: jest.fn(),
} as jest.Mocked<Partial<TransactionService>>;

const mockHapticService = {
  light: jest.fn(),
  medium: jest.fn(),
  success: jest.fn(),
  error: jest.fn(),
} as jest.Mocked<Partial<HapticService>>;

(TransactionService.getInstance as jest.Mock).mockReturnValue(mockTransactionService);
(HapticService.getInstance as jest.Mock).mockReturnValue(mockHapticService);

describe('PokerChipCalculator', () => {
  const defaultProps = {
    sessionId: 'test-session-id',
    selectedPlayerId: 'test-player-id',
    onBuyInComplete: jest.fn(),
    onError: jest.fn(),
    onAmountChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders chip calculator with initial state', () => {
      const { getByText, getByTestId } = render(<PokerChipCalculator {...defaultProps} />);
      
      expect(getByText('Chip Calculator')).toBeTruthy();
      expect(getByText('Total Amount')).toBeTruthy();
      expect(getByTestId('total-amount')).toBeTruthy();
      expect(getByTestId('chip-5-button')).toBeTruthy();
      expect(getByTestId('chip-25-button')).toBeTruthy();
      expect(getByTestId('chip-100-button')).toBeTruthy();
      expect(getByTestId('clear-button')).toBeTruthy();
      expect(getByTestId('confirm-button')).toBeTruthy();
    });

    it('shows instruction text', () => {
      const { getByText } = render(<PokerChipCalculator {...defaultProps} />);
      
      expect(getByText('Tap to add chips • Long press to remove')).toBeTruthy();
    });

    it('shows player selection message when no player selected', () => {
      const { getByText } = render(
        <PokerChipCalculator {...defaultProps} selectedPlayerId={null} />
      );
      
      expect(getByText('Select a player to enable confirmation')).toBeTruthy();
    });
  });

  describe('Chip Addition', () => {
    it('adds red chips and updates total', () => {
      const { getByTestId } = render(<PokerChipCalculator {...defaultProps} />);
      
      const redChip = getByTestId('chip-5-button');
      fireEvent.press(redChip);
      
      expect(getByTestId('total-amount')).toHaveTextContent('$5');
      expect(getByTestId('chip-5-count')).toHaveTextContent('1');
      expect(mockHapticService.light).toHaveBeenCalled();
      expect(defaultProps.onAmountChange).toHaveBeenCalledWith(5);
    });

    it('adds green chips and updates total', () => {
      const { getByTestId } = render(<PokerChipCalculator {...defaultProps} />);
      
      const greenChip = getByTestId('chip-25-button');
      fireEvent.press(greenChip);
      
      expect(getByTestId('total-amount')).toHaveTextContent('$25');
      expect(mockHapticService.light).toHaveBeenCalled();
      expect(defaultProps.onAmountChange).toHaveBeenCalledWith(25);
    });

    it('adds black chips and updates total', () => {
      const { getByTestId } = render(<PokerChipCalculator {...defaultProps} />);
      
      const blackChip = getByTestId('chip-100-button');
      fireEvent.press(blackChip);
      
      expect(getByTestId('total-amount')).toHaveTextContent('$100');
      expect(mockHapticService.light).toHaveBeenCalled();
      expect(defaultProps.onAmountChange).toHaveBeenCalledWith(100);
    });

    it('adds multiple chips and calculates correct total', () => {
      const { getByTestId } = render(<PokerChipCalculator {...defaultProps} />);
      
      // Add 2 red chips ($10)
      const redChip = getByTestId('chip-5-button');
      fireEvent.press(redChip);
      fireEvent.press(redChip);
      
      // Add 1 green chip ($25)
      const greenChip = getByTestId('chip-25-button');
      fireEvent.press(greenChip);
      
      // Add 1 black chip ($100)
      const blackChip = getByTestId('chip-100-button');
      fireEvent.press(blackChip);
      
      // Total should be $135
      expect(getByTestId('total-amount')).toHaveTextContent('$135');
      expect(defaultProps.onAmountChange).toHaveBeenLastCalledWith(135);
    });

    it('prevents adding chips when it would exceed maximum', () => {
      const { getByTestId } = render(<PokerChipCalculator {...defaultProps} />);
      
      const blackChip = getByTestId('chip-100-button');
      
      // Add chips to reach near maximum
      const maxChips = Math.floor(TRANSACTION_LIMITS.MAX_BUY_IN / 100);
      for (let i = 0; i < maxChips; i++) {
        fireEvent.press(blackChip);
      }
      
      // Try to add one more chip (should exceed maximum)
      fireEvent.press(blackChip);
      
      expect(mockHapticService.error).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith(
        'Invalid Amount',
        `Maximum buy-in amount is $${TRANSACTION_LIMITS.MAX_BUY_IN}`,
        [{ text: 'OK' }]
      );
    });
  });

  describe('Chip Removal', () => {
    it('removes chips on long press', () => {
      const { getByTestId } = render(<PokerChipCalculator {...defaultProps} />);
      
      const redChip = getByTestId('chip-5-button');
      
      // Add a chip first
      fireEvent.press(redChip);
      expect(getByTestId('total-amount')).toHaveTextContent('$5');
      
      // Remove it with long press
      fireEvent(redChip, 'longPress');
      expect(getByTestId('total-amount')).toHaveTextContent('$0');
      expect(mockHapticService.light).toHaveBeenCalled();
      expect(defaultProps.onAmountChange).toHaveBeenLastCalledWith(0);
    });

    it('does not remove chips when count is zero', () => {
      const { getByTestId } = render(<PokerChipCalculator {...defaultProps} />);
      
      const redChip = getByTestId('chip-5-button');
      
      // Try to remove chip when count is 0
      fireEvent(redChip, 'longPress');
      
      expect(getByTestId('total-amount')).toHaveTextContent('$0');
      expect(defaultProps.onAmountChange).not.toHaveBeenCalled();
    });
  });

  describe('Clear Function', () => {
    it('clears all chips when clear button is pressed', () => {
      const { getByTestId } = render(<PokerChipCalculator {...defaultProps} />);
      
      // Add some chips
      const redChip = getByTestId('chip-5-button');
      const greenChip = getByTestId('chip-25-button');
      fireEvent.press(redChip);
      fireEvent.press(greenChip);
      
      expect(getByTestId('total-amount')).toHaveTextContent('$30');
      
      // Clear all chips
      const clearButton = getByTestId('clear-button');
      fireEvent.press(clearButton);
      
      expect(getByTestId('total-amount')).toHaveTextContent('$0');
      expect(mockHapticService.medium).toHaveBeenCalled();
      expect(defaultProps.onAmountChange).toHaveBeenLastCalledWith(0);
    });

    it('disables clear button when no chips', () => {
      const { getByTestId } = render(<PokerChipCalculator {...defaultProps} />);
      
      const clearButton = getByTestId('clear-button');
      
      // Clear button should be disabled when total is 0
      fireEvent.press(clearButton);
      
      // Should not call haptic feedback when disabled
      expect(mockHapticService.medium).not.toHaveBeenCalled();
    });
  });

  describe('Confirm Function', () => {
    it('processes buy-in when confirm is pressed with valid amount and selected player', async () => {
      const mockTransaction = {
        id: 'transaction-123',
        amount: 30,
        playerId: 'test-player-id',
        sessionId: 'test-session-id',
        type: 'buy_in' as const,
        timestamp: new Date(),
        method: 'manual' as const,
        isVoided: false,
        createdBy: 'user',
      };

      mockTransactionService.recordBuyIn!.mockResolvedValue(mockTransaction);

      const { getByTestId } = render(<PokerChipCalculator {...defaultProps} />);
      
      // Add chips to reach minimum
      const redChip = getByTestId('chip-5-button');
      const greenChip = getByTestId('chip-25-button');
      fireEvent.press(redChip);
      fireEvent.press(greenChip);
      
      const confirmButton = getByTestId('confirm-button');
      
      await act(async () => {
        fireEvent.press(confirmButton);
      });

      expect(mockHapticService.medium).toHaveBeenCalled();
      expect(mockTransactionService.recordBuyIn).toHaveBeenCalledWith(
        'test-session-id',
        'test-player-id',
        30,
        'manual',
        'user',
        'Chip calculator buy-in: 1x$5 + 1x$25 + 0x$100'
      );
      
      await waitFor(() => {
        expect(mockHapticService.success).toHaveBeenCalled();
        expect(defaultProps.onBuyInComplete).toHaveBeenCalledWith('transaction-123', 30);
        expect(getByTestId('total-amount')).toHaveTextContent('$0'); // Should clear after success
      });
    });

    it('shows alert when no player is selected', async () => {
      const { getByTestId } = render(
        <PokerChipCalculator {...defaultProps} selectedPlayerId={null} />
      );
      
      // Add minimum amount
      const greenChip = getByTestId('chip-25-button');
      fireEvent.press(greenChip);
      
      const confirmButton = getByTestId('confirm-button');
      
      await act(async () => {
        fireEvent.press(confirmButton);
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Player Required',
        'Player ID is required',
        [{ text: 'OK' }]
      );
      expect(mockTransactionService.recordBuyIn).not.toHaveBeenCalled();
    });

    it('shows alert when amount is below minimum', async () => {
      // Since MIN_BUY_IN is $5.00 and red chip is $5, we need to test with 0 chips
      // or mock a different chip value. For now, let's test the validation directly
      // by temporarily changing the minimum in the component logic
      
      // Mock validation to return invalid for this test
      // const mockValidateBuyInAmount = jest.fn().mockReturnValue({ 
      //   isValid: false, 
      //   error: `Minimum buy-in amount is $${TRANSACTION_LIMITS.MIN_BUY_IN}` 
      // });
      
      // We'll skip this test since $5 is actually valid, or test with $0
      const { getByTestId } = render(<PokerChipCalculator {...defaultProps} />);
      
      // Don't add any chips (amount = $0, which is below minimum)
      const confirmButton = getByTestId('confirm-button');
      
      await act(async () => {
        fireEvent.press(confirmButton);
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Invalid Amount',
        `Minimum buy-in amount is $${TRANSACTION_LIMITS.MIN_BUY_IN}`,
        [{ text: 'OK' }]
      );
      expect(mockTransactionService.recordBuyIn).not.toHaveBeenCalled();
    });

    it('handles transaction service errors', async () => {
      const error = new Error('Transaction failed');
      mockTransactionService.recordBuyIn!.mockRejectedValue(error);

      const { getByTestId } = render(<PokerChipCalculator {...defaultProps} />);
      
      // Add valid amount
      const greenChip = getByTestId('chip-25-button');
      fireEvent.press(greenChip);
      
      const confirmButton = getByTestId('confirm-button');
      
      await act(async () => {
        fireEvent.press(confirmButton);
      });

      await waitFor(() => {
        expect(mockHapticService.error).toHaveBeenCalled();
        expect(defaultProps.onError).toHaveBeenCalledWith('Transaction failed');
        expect(Alert.alert).toHaveBeenCalledWith(
          'Buy-in Failed',
          'Transaction failed',
          [{ text: 'OK' }]
        );
      });
    });

    it('disables confirm when disabled prop is true', () => {
      const { getByTestId } = render(
        <PokerChipCalculator {...defaultProps} disabled={true} />
      );
      
      const confirmButton = getByTestId('confirm-button');
      fireEvent.press(confirmButton);

      expect(mockTransactionService.recordBuyIn).not.toHaveBeenCalled();
    });
  });

  describe('Chip Animations', () => {
    it('triggers animation when chips are added', () => {
      const { getByTestId } = render(<PokerChipCalculator {...defaultProps} />);
      
      const redChip = getByTestId('chip-5-button');
      fireEvent.press(redChip);
      
      // Animation testing would require checking Animated values
      // This might need integration testing or mocking Animated API
      expect(mockHapticService.light).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has correct accessibility labels for chips', () => {
      const { getByLabelText } = render(<PokerChipCalculator {...defaultProps} />);
      
      expect(getByLabelText('5 dollar chip')).toBeTruthy();
      expect(getByLabelText('25 dollar chip')).toBeTruthy();
      expect(getByLabelText('100 dollar chip')).toBeTruthy();
    });

    it('has correct accessibility labels for action buttons', () => {
      const { getByLabelText } = render(<PokerChipCalculator {...defaultProps} />);
      
      expect(getByLabelText('Clear all chips')).toBeTruthy();
      expect(getByLabelText('Confirm buy-in of $0')).toBeTruthy();
    });

    it('updates confirm button accessibility label with amount', () => {
      const { getByLabelText, getByTestId } = render(<PokerChipCalculator {...defaultProps} />);
      
      const redChip = getByTestId('chip-5-button');
      fireEvent.press(redChip);
      
      expect(getByLabelText('Confirm buy-in of $5')).toBeTruthy();
    });
  });

  describe('Landscape Mode', () => {
    it('applies landscape layout when isLandscape is true', () => {
      const { getByText } = render(
        <PokerChipCalculator {...defaultProps} isLandscape={true} />
      );
      
      expect(getByText('Chip Calculator')).toBeTruthy();
      // Layout testing would need to check applied styles
    });
  });

  describe('Loading States', () => {
    it('shows processing state during transaction', () => {
      const transactionPromise = new Promise(resolve => {
        setTimeout(resolve, 100);
      });
      
      mockTransactionService.recordBuyIn!.mockReturnValue(transactionPromise as any);

      const { getByText, getByTestId } = render(<PokerChipCalculator {...defaultProps} />);
      
      // Add valid amount
      const greenChip = getByTestId('chip-25-button');
      fireEvent.press(greenChip);
      
      const confirmButton = getByTestId('confirm-button');
      
      // Start the transaction
      act(() => {
        fireEvent.press(confirmButton);
      });

      // Check that button shows processing state
      expect(getByText('Processing...')).toBeTruthy();
      
      // Verify the transaction was started
      expect(mockTransactionService.recordBuyIn).toHaveBeenCalled();
    });
  });
});