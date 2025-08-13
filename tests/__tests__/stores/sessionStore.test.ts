/**
 * SessionStore tests for Stories 1.2 & 1.3 state management
 */
import { act } from '@testing-library/react-native';
import { useSessionStore } from '../../../src/stores/sessionStore';
import { ServiceError, ErrorCode } from '../../../src/types/errors';
import { Transaction, TransactionSummary } from '../../../src/types/transaction';

// Mock SessionService
const mockSessionService = {
  createSession: jest.fn(),
  addPlayer: jest.fn(),
  removePlayer: jest.fn(),
  getSessionState: jest.fn(),
  updateSessionStatus: jest.fn(),
} as any;

// Mock TransactionService
const mockTransactionService = {
  recordBuyIn: jest.fn(),
  undoTransaction: jest.fn(),
  getTransactionHistory: jest.fn(),
  calculatePlayerBalance: jest.fn(),
  canUndoTransaction: jest.fn(),
  getRemainingUndoTime: jest.fn(),
} as any;

jest.mock('../../../src/services/core/SessionService', () => ({
  SessionService: {
    getInstance: () => mockSessionService
  }
}));

jest.mock('../../../src/services/core/TransactionService', () => ({
  __esModule: true,
  default: {
    getInstance: () => mockTransactionService
  }
}));

describe('SessionStore - Stories 1.2 & 1.3', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    useSessionStore.getState().actions.clearSession();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useSessionStore.getState();
      
      expect(state.currentSession).toBeNull();
      expect(state.players).toEqual([]);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.canStartGame).toBe(false);
      expect(state.canCompleteGame).toBe(false);
    });
  });

  describe('Session Creation', () => {
    it('should create session successfully (AC: 1, 4, 5, 6)', async () => {
      const mockSession = {
        id: 'session-123',
        name: 'Friday Night Poker',
        organizerId: 'organizer-123',
        status: 'created' as const,
        createdAt: new Date(),
        totalPot: 0,
        playerCount: 0
      };

      mockSessionService.createSession.mockResolvedValue(mockSession);

      await act(async () => {
        await useSessionStore.getState().actions.createSession('Friday Night Poker', 'organizer-123');
      });

      const state = useSessionStore.getState();
      expect(state.currentSession).toEqual(mockSession);
      expect(state.players).toEqual([]);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.canStartGame).toBe(false);
    });

    it('should handle session creation error', async () => {
      const error = new ServiceError(ErrorCode.VALIDATION_ERROR, 'Session name is required');
      mockSessionService.createSession.mockRejectedValue(error);

      await act(async () => {
        try {
          await useSessionStore.getState().actions.createSession('', 'organizer-123');
        } catch (e) {
          // Expected to throw
        }
      });

      const state = useSessionStore.getState();
      expect(state.currentSession).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Session name is required');
    });
  });

  describe('Player Management', () => {
    it('should add player to session (AC: 2, 3)', async () => {
      const mockSession = {
        id: 'session-123',
        name: 'Friday Night Poker',
        organizerId: 'organizer-123',
        status: 'created' as const,
        createdAt: new Date(),
        totalPot: 0,
        playerCount: 0
      };

      const mockPlayer = {
        id: 'player-1',
        sessionId: 'session-123',
        name: 'Alice',
        isGuest: true,
        currentBalance: 0,
        totalBuyIns: 0,
        totalCashOuts: 0,
        status: 'active' as const,
        joinedAt: new Date()
      };

      mockSessionService.createSession.mockResolvedValue(mockSession);
      mockSessionService.addPlayer.mockResolvedValue(mockPlayer);

      // Create session first
      await act(async () => {
        await useSessionStore.getState().actions.createSession('Friday Night Poker', 'organizer-123');
      });

      // Add player
      await act(async () => {
        await useSessionStore.getState().actions.addPlayer('session-123', 'Alice');
      });

      const state = useSessionStore.getState();
      expect(state.players).toEqual([mockPlayer]);
      expect(state.currentSession?.playerCount).toBe(1);
      expect(state.canStartGame).toBe(false); // Need 4+ players
    });
  });

  describe('Utility Functions', () => {
    it('should provide player count getter', () => {
      const count = useSessionStore.getState().actions.getPlayerCount();
      expect(count).toBe(0);
    });

    it('should check if more players can be added', () => {
      const canAdd = useSessionStore.getState().actions.canAddMorePlayers();
      expect(canAdd).toBe(false); // No session
    });
  });

  describe('Error Handling', () => {
    it('should handle and clear errors', () => {
      // Set error
      act(() => {
        useSessionStore.setState({ error: 'Test error' });
      });
      
      expect(useSessionStore.getState().error).toBe('Test error');
      
      // Clear error
      act(() => {
        useSessionStore.getState().actions.clearError();
      });
      
      expect(useSessionStore.getState().error).toBeNull();
    });
  });

  // Story 1.3 Transaction Tests
  describe('Transaction Management - Story 1.3', () => {
    const mockTransaction: Transaction = {
      id: 'transaction-1',
      sessionId: 'session-1',
      playerId: 'player-1',
      type: 'buy_in',
      amount: 25.00,
      timestamp: new Date(),
      method: 'manual',
      isVoided: false,
      createdBy: 'user'
    };

    const mockTransactionSummary: TransactionSummary = {
      id: 'transaction-1',
      playerName: 'John Doe',
      type: 'buy_in',
      amount: 25.00,
      timestamp: new Date(),
      method: 'manual',
      isVoided: false
    };

    beforeEach(() => {
      // Set up initial state with session and players
      act(() => {
        useSessionStore.setState({
          currentSession: {
            id: 'session-1',
            name: 'Test Session',
            organizerId: 'organizer-1',
            status: 'active',
            createdAt: new Date(),
            totalPot: 100.00,
            playerCount: 2
          },
          players: [
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
            }
          ]
        });
      });
    });

    describe('Initial Transaction State', () => {
      it('should have correct initial transaction state', () => {
        const state = useSessionStore.getState();
        
        expect(state.transactions).toEqual([]);
        expect(state.playerBalances).toEqual({});
        expect(state.transactionLoading).toBe(false);
        expect(state.mostRecentTransaction).toBeNull();
      });
    });

    describe('recordBuyIn - AC: 1, 2, 3', () => {
      it('should record buy-in successfully with optimistic updates', async () => {
        mockTransactionService.recordBuyIn.mockResolvedValue(mockTransaction);

        await act(async () => {
          await useSessionStore.getState().actions.recordBuyIn('session-1', 'player-1', 25.00);
        });

        const state = useSessionStore.getState();

        // Check service was called
        expect(mockTransactionService.recordBuyIn).toHaveBeenCalledWith(
          'session-1',
          'player-1',
          25.00,
          'manual',
          'user'
        );

        // Check optimistic updates
        expect(state.transactions).toHaveLength(1);
        expect(state.transactions[0]).toEqual({
          id: 'transaction-1',
          playerName: 'John Doe',
          type: 'buy_in',
          amount: 25.00,
          timestamp: mockTransaction.timestamp,
          method: 'manual',
          isVoided: false
        });

        // Check session total pot updated
        expect(state.currentSession?.totalPot).toBe(125.00);

        // Check player balance updated
        expect(state.players[0].currentBalance).toBe(75.00);
        expect(state.players[0].totalBuyIns).toBe(75.00);

        // Check most recent transaction
        expect(state.mostRecentTransaction).toEqual(mockTransaction);
        expect(state.transactionLoading).toBe(false);
      });

      it('should handle buy-in errors', async () => {
        const error = new ServiceError(ErrorCode.VALIDATION_ERROR, 'Invalid amount', 'amount');
        mockTransactionService.recordBuyIn.mockRejectedValue(error);

        await act(async () => {
          try {
            await useSessionStore.getState().actions.recordBuyIn('session-1', 'player-1', 0);
          } catch (e) {
            // Expected to throw
          }
        });

        const state = useSessionStore.getState();

        expect(state.error).toBe('Invalid amount');
        expect(state.transactionLoading).toBe(false);
        expect(state.transactions).toHaveLength(0);
      });
    });

    describe('undoTransaction - AC: 6', () => {
      beforeEach(() => {
        // Set up state with existing transaction
        act(() => {
          useSessionStore.setState({
            transactions: [mockTransactionSummary],
            currentSession: {
              id: 'session-1',
              name: 'Test Session',
              organizerId: 'organizer-1',
              status: 'active',
              createdAt: new Date(),
              totalPot: 125.00,
              playerCount: 2
            },
            players: [
              {
                id: 'player-1',
                sessionId: 'session-1',
                name: 'John Doe',
                isGuest: true,
                currentBalance: 75.00,
                totalBuyIns: 75.00,
                totalCashOuts: 0.00,
                status: 'active',
                joinedAt: new Date()
              }
            ]
          });
        });
      });

      it('should undo transaction successfully', async () => {
        mockTransactionService.undoTransaction.mockResolvedValue(undefined);

        await act(async () => {
          await useSessionStore.getState().actions.undoTransaction('transaction-1');
        });

        const state = useSessionStore.getState();

        // Check service was called
        expect(mockTransactionService.undoTransaction).toHaveBeenCalledWith(
          'transaction-1',
          'User undo request'
        );

        // Check transaction marked as voided
        expect(state.transactions[0].isVoided).toBe(true);

        // Check session total pot updated
        expect(state.currentSession?.totalPot).toBe(100.00);

        // Check player balance reverted
        expect(state.players[0].currentBalance).toBe(50.00);
        expect(state.players[0].totalBuyIns).toBe(50.00);

        expect(state.transactionLoading).toBe(false);
      });

      it('should handle undo errors', async () => {
        const error = new ServiceError(ErrorCode.VALIDATION_ERROR, 'Transaction expired', 'transaction');
        mockTransactionService.undoTransaction.mockRejectedValue(error);

        await act(async () => {
          try {
            await useSessionStore.getState().actions.undoTransaction('transaction-1');
          } catch (e) {
            // Expected to throw
          }
        });

        const state = useSessionStore.getState();

        expect(state.error).toBe('Transaction expired');
        expect(state.transactionLoading).toBe(false);
      });
    });

    describe('loadTransactionHistory - AC: 4', () => {
      it('should load transaction history successfully', async () => {
        const mockHistory = [mockTransactionSummary];
        mockTransactionService.getTransactionHistory.mockResolvedValue(mockHistory);

        await act(async () => {
          await useSessionStore.getState().actions.loadTransactionHistory('session-1');
        });

        const state = useSessionStore.getState();

        expect(mockTransactionService.getTransactionHistory).toHaveBeenCalledWith('session-1');
        expect(state.transactions).toEqual(mockHistory);
        expect(state.transactionLoading).toBe(false);
      });

      it('should handle history loading errors', async () => {
        const error = new Error('Network error');
        mockTransactionService.getTransactionHistory.mockRejectedValue(error);

        await act(async () => {
          await useSessionStore.getState().actions.loadTransactionHistory('session-1');
        });

        const state = useSessionStore.getState();

        expect(state.error).toBe('Failed to load transaction history');
        expect(state.transactionLoading).toBe(false);
      });
    });

    describe('refreshPlayerBalances - AC: 3', () => {
      it('should refresh player balances successfully', async () => {
        const mockBalance = {
          playerId: 'player-1',
          playerName: 'John Doe',
          currentBalance: 75.00,
          totalBuyIns: 100.00,
          totalCashOuts: 25.00,
          netPosition: -25.00
        };

        mockTransactionService.calculatePlayerBalance.mockResolvedValue(mockBalance);

        await act(async () => {
          await useSessionStore.getState().actions.refreshPlayerBalances('session-1');
        });

        const state = useSessionStore.getState();

        expect(mockTransactionService.calculatePlayerBalance).toHaveBeenCalledWith('player-1');
        expect(state.playerBalances['player-1']).toEqual(mockBalance);
      });

      it('should handle balance calculation errors gracefully', async () => {
        mockTransactionService.calculatePlayerBalance.mockRejectedValue(new Error('Player not found'));

        await act(async () => {
          await useSessionStore.getState().actions.refreshPlayerBalances('session-1');
        });

        // Should not crash, error logged but not set in state
        const state = useSessionStore.getState();
        expect(state.playerBalances).toEqual({});
      });
    });

    describe('Transaction Getters', () => {
      beforeEach(() => {
        act(() => {
          useSessionStore.setState({
            transactions: [mockTransactionSummary]
          });
        });
      });

      it('should get transaction by ID', () => {
        const transaction = useSessionStore.getState().actions.getTransactionById('transaction-1');
        expect(transaction).toEqual(mockTransactionSummary);
      });

      it('should return undefined for non-existent transaction', () => {
        const transaction = useSessionStore.getState().actions.getTransactionById('non-existent');
        expect(transaction).toBeUndefined();
      });

      it('should check if transaction can be undone', () => {
        mockTransactionService.canUndoTransaction.mockReturnValue(true);

        const canUndo = useSessionStore.getState().actions.canUndoTransaction('transaction-1');

        expect(canUndo).toBe(true);
        expect(mockTransactionService.canUndoTransaction).toHaveBeenCalledWith('transaction-1');
      });

      it('should get remaining undo time', () => {
        mockTransactionService.getRemainingUndoTime.mockReturnValue(15);

        const remainingTime = useSessionStore.getState().actions.getRemainingUndoTime('transaction-1');

        expect(remainingTime).toBe(15);
        expect(mockTransactionService.getRemainingUndoTime).toHaveBeenCalledWith('transaction-1');
      });
    });

    describe('Clear Session', () => {
      it('should clear transaction state when session is cleared', () => {
        // Set up state with transaction data
        act(() => {
          useSessionStore.setState({
            transactions: [mockTransactionSummary],
            playerBalances: { 'player-1': {} as any },
            transactionLoading: true,
            mostRecentTransaction: mockTransaction
          });
        });

        // Clear session
        act(() => {
          useSessionStore.getState().actions.clearSession();
        });

        const state = useSessionStore.getState();

        expect(state.transactions).toEqual([]);
        expect(state.playerBalances).toEqual({});
        expect(state.transactionLoading).toBe(false);
        expect(state.mostRecentTransaction).toBeNull();
      });
    });
  });
});