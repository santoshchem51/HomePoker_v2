/**
 * TransactionForm Component Tests
 * Tests Story 1.3 AC: 1, 5 - Buy-in entry interface with validation
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { TransactionForm } from '../../../src/screens/LiveGame/TransactionForm';
import { Player } from '../../../src/types/player';
import { TRANSACTION_LIMITS } from '../../../src/types/transaction';

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

const mockAlert = require('react-native').Alert;

describe('TransactionForm', () => {
  const mockPlayers: Player[] = [
    {
      id: 'player-1',
      sessionId: 'session-1',
      name: 'John Doe',
      isGuest: true,
      currentBalance: 50.00,
      totalBuyIns: 50.00,
      totalCashOuts: 0.00,
      status: 'active',
      joinedAt: new Date()
    },
    {
      id: 'player-2',
      sessionId: 'session-1',
      name: 'Jane Smith',
      isGuest: true,
      currentBalance: 25.00,
      totalBuyIns: 75.00,
      totalCashOuts: 50.00,
      status: 'active',
      joinedAt: new Date()
    },
    {
      id: 'player-3',
      sessionId: 'session-1',
      name: 'Bob Johnson',
      isGuest: true,
      currentBalance: 0.00,
      totalBuyIns: 100.00,
      totalCashOuts: 100.00,
      status: 'cashed_out',
      joinedAt: new Date()
    }
  ];

  const defaultProps = {
    sessionId: 'session-1',
    players: mockPlayers,
    onSubmit: jest.fn(),
    loading: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render form title', () => {
      render(<TransactionForm {...defaultProps} />);
      
      expect(screen.getByText('Record Buy-in')).toBeTruthy();
    });

    it('should render player selection dropdown', () => {
      render(<TransactionForm {...defaultProps} />);
      
      expect(screen.getByText('Player *')).toBeTruthy();
    });

    it('should render amount input with currency limits', () => {
      render(<TransactionForm {...defaultProps} />);
      
      expect(screen.getByText(`Amount * ($${TRANSACTION_LIMITS.MIN_BUY_IN} - $${TRANSACTION_LIMITS.MAX_BUY_IN})`)).toBeTruthy();
      expect(screen.getByDisplayValue('$')).toBeTruthy();
      expect(screen.getByPlaceholderText('0.00')).toBeTruthy();
    });

    it('should render submit button', () => {
      render(<TransactionForm {...defaultProps} />);
      
      expect(screen.getByText('Record Buy-in')).toBeTruthy();
    });

    it('should show only active players in dropdown', () => {
      render(<TransactionForm {...defaultProps} />);
      
      // Should show active players (John Doe, Jane Smith) but not cashed-out player (Bob Johnson)
      expect(screen.getByText('John Doe (Balance: $50.00)')).toBeTruthy();
      expect(screen.getByText('Jane Smith (Balance: $25.00)')).toBeTruthy();
    });
  });

  describe('form validation', () => {
    it('should validate required player selection', async () => {
      render(<TransactionForm {...defaultProps} />);
      
      const amountInput = screen.getByPlaceholderText('0.00');
      const submitButton = screen.getByText('Record Buy-in');
      
      fireEvent.changeText(amountInput, '25.00');
      fireEvent.press(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please select a player')).toBeTruthy();
      });
      
      expect(defaultProps.onSubmit).not.toHaveBeenCalled();
    });

    it('should validate required amount', async () => {
      render(<TransactionForm {...defaultProps} />);
      
      const submitButton = screen.getByText('Record Buy-in');
      
      // Don't set amount
      fireEvent.press(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Amount is required')).toBeTruthy();
      });
      
      expect(defaultProps.onSubmit).not.toHaveBeenCalled();
    });

    it('should validate minimum amount', async () => {
      render(<TransactionForm {...defaultProps} />);
      
      const amountInput = screen.getByPlaceholderText('0.00');
      const submitButton = screen.getByText('Record Buy-in');
      
      fireEvent.changeText(amountInput, '4.99');
      fireEvent.press(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(`Amount must be at least $${TRANSACTION_LIMITS.MIN_BUY_IN}`)).toBeTruthy();
      });
      
      expect(defaultProps.onSubmit).not.toHaveBeenCalled();
    });

    it('should validate maximum amount', async () => {
      render(<TransactionForm {...defaultProps} />);
      
      const amountInput = screen.getByPlaceholderText('0.00');
      const submitButton = screen.getByText('Record Buy-in');
      
      fireEvent.changeText(amountInput, '500.01');
      fireEvent.press(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(`Amount cannot exceed $${TRANSACTION_LIMITS.MAX_BUY_IN}`)).toBeTruthy();
      });
      
      expect(defaultProps.onSubmit).not.toHaveBeenCalled();
    });

    it('should validate positive amounts', async () => {
      render(<TransactionForm {...defaultProps} />);
      
      const amountInput = screen.getByPlaceholderText('0.00');
      const submitButton = screen.getByText('Record Buy-in');
      
      fireEvent.changeText(amountInput, '0');
      fireEvent.press(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Amount must be positive')).toBeTruthy();
      });
      
      expect(defaultProps.onSubmit).not.toHaveBeenCalled();
    });

    it('should validate decimal places', async () => {
      render(<TransactionForm {...defaultProps} />);
      
      const amountInput = screen.getByPlaceholderText('0.00');
      const submitButton = screen.getByText('Record Buy-in');
      
      fireEvent.changeText(amountInput, '25.123');
      fireEvent.press(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Amount cannot have more than 2 decimal places')).toBeTruthy();
      });
      
      expect(defaultProps.onSubmit).not.toHaveBeenCalled();
    });

    it('should validate numeric input', async () => {
      render(<TransactionForm {...defaultProps} />);
      
      const amountInput = screen.getByPlaceholderText('0.00');
      const submitButton = screen.getByText('Record Buy-in');
      
      fireEvent.changeText(amountInput, 'not-a-number');
      fireEvent.press(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Amount must be a valid number')).toBeTruthy();
      });
      
      expect(defaultProps.onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('amount input formatting', () => {
    it('should allow valid decimal amounts', () => {
      render(<TransactionForm {...defaultProps} />);
      
      const amountInput = screen.getByPlaceholderText('0.00');
      
      fireEvent.changeText(amountInput, '25.50');
      
      expect(amountInput.props.value).toBe('25.50');
    });

    it('should filter non-numeric characters', () => {
      render(<TransactionForm {...defaultProps} />);
      
      const amountInput = screen.getByPlaceholderText('0.00');
      
      fireEvent.changeText(amountInput, 'abc25.50def');
      
      expect(amountInput.props.value).toBe('25.50');
    });

    it('should prevent multiple decimal points', () => {
      render(<TransactionForm {...defaultProps} />);
      
      const amountInput = screen.getByPlaceholderText('0.00');
      
      fireEvent.changeText(amountInput, '25.50.75');
      
      // Should not change if multiple decimals attempted
      expect(amountInput.props.value).toBe('');
    });

    it('should limit decimal places to 2', () => {
      render(<TransactionForm {...defaultProps} />);
      
      const amountInput = screen.getByPlaceholderText('0.00');
      
      fireEvent.changeText(amountInput, '25.123');
      
      // Should not accept input with more than 2 decimal places
      expect(amountInput.props.value).toBe('');
    });
  });

  describe('form submission', () => {
    it('should submit valid form data', async () => {
      const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
      
      render(
        <TransactionForm 
          {...defaultProps} 
          onSubmit={mockOnSubmit}
        />
      );
      
      const amountInput = screen.getByPlaceholderText('0.00');
      const submitButton = screen.getByText('Record Buy-in');
      
      // Set valid amount
      fireEvent.changeText(amountInput, '25.00');
      
      // Submit form (first player should be pre-selected)
      fireEvent.press(submitButton);
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('player-1', 25.00);
      });
    });

    it('should show success alert after successful submission', async () => {
      const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
      
      render(
        <TransactionForm 
          {...defaultProps} 
          onSubmit={mockOnSubmit}
        />
      );
      
      const amountInput = screen.getByPlaceholderText('0.00');
      const submitButton = screen.getByText('Record Buy-in');
      
      fireEvent.changeText(amountInput, '25.00');
      fireEvent.press(submitButton);
      
      await waitFor(() => {
        expect(mockAlert.alert).toHaveBeenCalledWith(
          'Success',
          'Buy-in of $25.00 recorded successfully!',
          [{ text: 'OK' }]
        );
      });
    });

    it('should clear form after successful submission', async () => {
      const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
      
      render(
        <TransactionForm 
          {...defaultProps} 
          onSubmit={mockOnSubmit}
        />
      );
      
      const amountInput = screen.getByPlaceholderText('0.00');
      const submitButton = screen.getByText('Record Buy-in');
      
      fireEvent.changeText(amountInput, '25.00');
      fireEvent.press(submitButton);
      
      await waitFor(() => {
        expect(amountInput.props.value).toBe('');
      });
    });

    it('should handle submission errors', async () => {
      const mockOnSubmit = jest.fn().mockRejectedValue(new Error('Network error'));
      
      render(
        <TransactionForm 
          {...defaultProps} 
          onSubmit={mockOnSubmit}
        />
      );
      
      const amountInput = screen.getByPlaceholderText('0.00');
      const submitButton = screen.getByText('Record Buy-in');
      
      fireEvent.changeText(amountInput, '25.00');
      fireEvent.press(submitButton);
      
      await waitFor(() => {
        expect(mockAlert.alert).toHaveBeenCalledWith(
          'Error',
          'Failed to record buy-in. Please try again.',
          [{ text: 'OK' }]
        );
      });
    });
  });

  describe('loading states', () => {
    it('should disable form during loading', () => {
      render(<TransactionForm {...defaultProps} loading={true} />);
      
      const submitButton = screen.getByText('Recording...');
      
      expect(submitButton).toBeDisabled();
    });

    it('should show loading text and spinner', () => {
      render(<TransactionForm {...defaultProps} loading={true} />);
      
      expect(screen.getByText('Recording...')).toBeTruthy();
    });
  });

  describe('no active players', () => {
    it('should show message when no active players', () => {
      const playersWithNoneActive = mockPlayers.map(p => ({ ...p, status: 'cashed_out' as const }));
      
      render(
        <TransactionForm 
          {...defaultProps} 
          players={playersWithNoneActive}
        />
      );
      
      expect(screen.getByText('No active players available for buy-in')).toBeTruthy();
    });

    it('should disable submit button when no active players', () => {
      const playersWithNoneActive = mockPlayers.map(p => ({ ...p, status: 'cashed_out' as const }));
      
      render(
        <TransactionForm 
          {...defaultProps} 
          players={playersWithNoneActive}
        />
      );
      
      const submitButton = screen.getByText('Record Buy-in');
      expect(submitButton).toBeDisabled();
    });
  });

  describe('error state handling', () => {
    it('should clear errors on valid input change', async () => {
      render(<TransactionForm {...defaultProps} />);
      
      const amountInput = screen.getByPlaceholderText('0.00');
      const submitButton = screen.getByText('Record Buy-in');
      
      // Trigger validation error
      fireEvent.changeText(amountInput, '4.99');
      fireEvent.press(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(`Amount must be at least $${TRANSACTION_LIMITS.MIN_BUY_IN}`)).toBeTruthy();
      });
      
      // Fix the error
      fireEvent.changeText(amountInput, '25.00');
      
      // Error should be cleared
      expect(screen.queryByText(`Amount must be at least $${TRANSACTION_LIMITS.MIN_BUY_IN}`)).toBeNull();
    });
  });
});