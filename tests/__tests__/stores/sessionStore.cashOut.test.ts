/**
 * Unit tests for sessionStore recordCashOut functionality
 * Tests the optimistic updates and error handling in the store
 */

import { useSessionStore } from '../../../src/stores/sessionStore';
import { TransactionService } from '../../../src/services/core/TransactionService';
import { ServiceError } from '../../../src/services/core/ServiceError';
import { Player } from '../../../src/types/player';
import { Transaction } from '../../../src/types/transaction';

// Mock dependencies
jest.mock('../../../src/services/core/TransactionService');
jest.mock('../../../src/utils/ui-responsiveness', () => ({
  responsiveAsync: jest.fn((operation, options) => {
    return operation().then(
      (result: any) => {
        if (options.successCallback) options.successCallback(result);
        return result;
      },
      (error: any) => {
        if (options.errorCallback) options.errorCallback(error);
        throw error;
      }
    );
  })
}));

describe('SessionStore recordCashOut', () => {
  let mockTransactionService: jest.Mocked<TransactionService>;
  
  const mockSessionId = 'test-session-123';
  const mockPlayer: Player = {
    id: 'player1',
    sessionId: mockSessionId,
    name: 'Alice',
    isGuest: false,
    profileId: null,
    currentBalance: 100,
    totalBuyIns: 50,
    totalCashOuts: 0,
    status: 'active',
    joinedAt: new Date()
  };

  beforeEach(() => {
    // Clear all store state
    useSessionStore.setState({
      currentSession: {
        id: mockSessionId,
        name: 'Test Session',
        organizerId: 'organizer1',
        status: 'active',
        totalPot: 100,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      players: [mockPlayer],
      transactions: [],
      loading: false,
      error: null,
      activeSessions: [],
      activeSessionsLoading: false,
      playerBalances: {},
      transactionLoading: false,
      mostRecentTransaction: null,
      canStartGame: false,
      canCompleteGame: false,
      operationLoading: {},
      optimisticUpdates: {}
    });

    // Setup mocks
    mockTransactionService = TransactionService.getInstance() as jest.Mocked<TransactionService>;
    jest.clearAllMocks();
  });

  describe('Optimistic Updates', () => {
    it('should apply optimistic updates immediately', async () => {
      // Arrange
      const cashOutAmount = 60;
      const mockTransaction: Transaction = {
        id: 'real-txn-123',
        sessionId: mockSessionId,
        playerId: 'player1',
        type: 'cash_out',
        amount: cashOutAmount,
        timestamp: new Date(),
        method: 'manual',
        isVoided: false,
        description: undefined,
        createdBy: 'user'
      };

      mockTransactionService.recordCashOut.mockResolvedValue(mockTransaction);

      // Act
      const recordCashOutPromise = useSessionStore.getState().actions.recordCashOut(
        mockSessionId, 
        'player1', 
        cashOutAmount
      );

      // Assert - check immediate optimistic updates
      const stateAfterOptimistic = useSessionStore.getState();
      
      // Should have optimistic transaction
      expect(stateAfterOptimistic.transactions).toHaveLength(1);
      expect(stateAfterOptimistic.transactions[0].type).toBe('cash_out');
      expect(stateAfterOptimistic.transactions[0].amount).toBe(cashOutAmount);
      expect(stateAfterOptimistic.transactions[0].playerName).toBe('Alice');
      
      // Should update player optimistically
      const updatedPlayer = stateAfterOptimistic.players.find(p => p.id === 'player1');
      expect(updatedPlayer).toMatchObject({
        currentBalance: 40, // 100 - 60
        totalCashOuts: 60,  // 0 + 60
        status: 'cashed_out' // Should be marked as cashed out
      });

      // Should update session pot optimistically
      expect(stateAfterOptimistic.currentSession?.totalPot).toBe(40); // 100 - 60

      // Wait for completion
      await recordCashOutPromise;
    });

    it('should replace optimistic transaction with real one on success', async () => {
      // Arrange
      const cashOutAmount = 75;
      const realTimestamp = new Date('2024-01-01T12:00:00Z');
      const mockTransaction: Transaction = {
        id: 'real-txn-456',
        sessionId: mockSessionId,
        playerId: 'player1',
        type: 'cash_out',
        amount: cashOutAmount,
        timestamp: realTimestamp,
        method: 'manual',
        isVoided: false,
        description: undefined,
        createdBy: 'user'
      };

      mockTransactionService.recordCashOut.mockResolvedValue(mockTransaction);

      // Act
      await useSessionStore.getState().actions.recordCashOut(
        mockSessionId, 
        'player1', 
        cashOutAmount
      );

      // Assert
      const finalState = useSessionStore.getState();
      
      // Should have real transaction
      expect(finalState.transactions).toHaveLength(1);
      const transaction = finalState.transactions[0];
      expect(transaction.id).toBe('real-txn-456');
      expect(transaction.timestamp).toEqual(realTimestamp);
      
      // Should set mostRecentTransaction
      expect(finalState.mostRecentTransaction).toEqual(mockTransaction);
      
      // Should clear optimistic updates
      expect(finalState.optimisticUpdates).toEqual({});
    });

    it('should rollback optimistic updates on error', async () => {
      // Arrange
      const cashOutAmount = 50;
      const error = new ServiceError('VALIDATION_ERROR', 'Test error');
      
      mockTransactionService.recordCashOut.mockRejectedValue(error);

      // Act
      try {
        await useSessionStore.getState().actions.recordCashOut(
          mockSessionId, 
          'player1', 
          cashOutAmount
        );
      } catch (e) {
        // Expected to throw
      }

      // Assert - should rollback to original state
      const finalState = useSessionStore.getState();
      
      // Should have no transactions
      expect(finalState.transactions).toHaveLength(0);
      
      // Player should be back to original state
      const player = finalState.players.find(p => p.id === 'player1');
      expect(player).toMatchObject({
        currentBalance: 100, // Original balance
        totalCashOuts: 0,    // Original cash outs
        status: 'active'     // Back to active
      });

      // Session pot should be restored
      expect(finalState.currentSession?.totalPot).toBe(100); // Original pot
      
      // Should set error message
      expect(finalState.error).toBe('Test error');
      
      // Should clear optimistic updates
      expect(finalState.optimisticUpdates).toEqual({});
    });
  });

  describe('Integration with TransactionService', () => {
    it('should call TransactionService with correct parameters', async () => {
      // Arrange
      const cashOutAmount = 80;
      const organizerConfirmed = true;
      const mockTransaction: Transaction = {
        id: 'txn-123',
        sessionId: mockSessionId,
        playerId: 'player1',
        type: 'cash_out',
        amount: cashOutAmount,
        timestamp: new Date(),
        method: 'manual',
        isVoided: false,
        description: undefined,
        createdBy: 'user'
      };

      mockTransactionService.recordCashOut.mockResolvedValue(mockTransaction);

      // Act
      await useSessionStore.getState().actions.recordCashOut(
        mockSessionId, 
        'player1', 
        cashOutAmount,
        organizerConfirmed
      );

      // Assert
      expect(mockTransactionService.recordCashOut).toHaveBeenCalledWith(
        mockSessionId,
        'player1',
        cashOutAmount,
        'manual',
        'user',
        undefined,
        organizerConfirmed
      );
    });

    it('should handle ServiceError correctly', async () => {
      // Arrange
      const serviceError = new ServiceError('PLAYER_ALREADY_CASHED_OUT', 'Player has already cashed out');
      mockTransactionService.recordCashOut.mockRejectedValue(serviceError);

      // Act & Assert
      await expect(
        useSessionStore.getState().actions.recordCashOut(mockSessionId, 'player1', 50)
      ).rejects.toThrow('Player has already cashed out');

      const finalState = useSessionStore.getState();
      expect(finalState.error).toBe('Player has already cashed out');
    });

    it('should handle generic errors correctly', async () => {
      // Arrange
      const genericError = new Error('Network error');
      mockTransactionService.recordCashOut.mockRejectedValue(genericError);

      // Act & Assert
      await expect(
        useSessionStore.getState().actions.recordCashOut(mockSessionId, 'player1', 50)
      ).rejects.toThrow('Network error');

      const finalState = useSessionStore.getState();
      expect(finalState.error).toBe('Failed to record cash-out');
    });
  });

  describe('Edge Cases', () => {
    it('should handle unknown player gracefully', async () => {
      // Arrange
      const mockTransaction: Transaction = {
        id: 'txn-123',
        sessionId: mockSessionId,
        playerId: 'unknown-player',
        type: 'cash_out',
        amount: 50,
        timestamp: new Date(),
        method: 'manual',
        isVoided: false,
        description: undefined,
        createdBy: 'user'
      };

      mockTransactionService.recordCashOut.mockResolvedValue(mockTransaction);

      // Act
      await useSessionStore.getState().actions.recordCashOut(
        mockSessionId, 
        'unknown-player', 
        50
      );

      // Assert - should use 'Unknown' as fallback name
      const finalState = useSessionStore.getState();
      const transaction = finalState.transactions[0];
      expect(transaction.playerName).toBe('Unknown');
    });

    it('should handle zero cash-out amount', async () => {
      // Arrange
      const mockTransaction: Transaction = {
        id: 'txn-zero',
        sessionId: mockSessionId,
        playerId: 'player1',
        type: 'cash_out',
        amount: 0,
        timestamp: new Date(),
        method: 'manual',
        isVoided: false,
        description: undefined,
        createdBy: 'user'
      };

      mockTransactionService.recordCashOut.mockResolvedValue(mockTransaction);

      // Act
      await useSessionStore.getState().actions.recordCashOut(
        mockSessionId, 
        'player1', 
        0
      );

      // Assert
      const finalState = useSessionStore.getState();
      const player = finalState.players.find(p => p.id === 'player1');
      expect(player).toMatchObject({
        currentBalance: 100, // 100 - 0
        totalCashOuts: 0,    // 0 + 0
        status: 'cashed_out' // Still marked as cashed out
      });
    });

    it('should handle multiple concurrent cash-outs', async () => {
      // Arrange
      const player2: Player = {
        id: 'player2',
        sessionId: mockSessionId,
        name: 'Bob',
        isGuest: false,
        profileId: null,
        currentBalance: 75,
        totalBuyIns: 50,
        totalCashOuts: 0,
        status: 'active',
        joinedAt: new Date()
      };

      useSessionStore.setState(state => ({
        ...state,
        players: [mockPlayer, player2]
      }));

      const mockTransaction1: Transaction = {
        id: 'txn-1',
        sessionId: mockSessionId,
        playerId: 'player1',
        type: 'cash_out',
        amount: 60,
        timestamp: new Date(),
        method: 'manual',
        isVoided: false,
        description: undefined,
        createdBy: 'user'
      };

      const mockTransaction2: Transaction = {
        id: 'txn-2',
        sessionId: mockSessionId,
        playerId: 'player2',
        type: 'cash_out',
        amount: 75,
        timestamp: new Date(),
        method: 'manual',
        isVoided: false,
        description: undefined,
        createdBy: 'user'
      };

      mockTransactionService.recordCashOut
        .mockResolvedValueOnce(mockTransaction1)
        .mockResolvedValueOnce(mockTransaction2);

      // Act
      const promises = [
        useSessionStore.getState().actions.recordCashOut(mockSessionId, 'player1', 60),
        useSessionStore.getState().actions.recordCashOut(mockSessionId, 'player2', 75)
      ];

      await Promise.all(promises);

      // Assert
      const finalState = useSessionStore.getState();
      expect(finalState.transactions).toHaveLength(2);
      
      const player1Final = finalState.players.find(p => p.id === 'player1');
      const player2Final = finalState.players.find(p => p.id === 'player2');
      
      expect(player1Final?.status).toBe('cashed_out');
      expect(player2Final?.status).toBe('cashed_out');
    });
  });
});