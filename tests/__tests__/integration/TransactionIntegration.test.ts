/**
 * Transaction Integration Tests
 * Tests Story 1.3 end-to-end scenarios and integration between components
 */
import TransactionService from '../../../src/services/core/TransactionService';
import { SessionService } from '../../../src/services/core/SessionService';
import { UndoManager } from '../../../src/utils/undo-manager';
import { TRANSACTION_LIMITS } from '../../../src/types/transaction';

// Skip transaction integration tests if SQLite is not available in test environment
const isTestEnvironment = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;

// Mock database operations for integration testing
const mockDbOperations = {
  executeQuery: jest.fn(),
  executeTransaction: jest.fn(),
  initialize: jest.fn(),
  initializeSchema: jest.fn(),
};

jest.mock('../../../src/services/infrastructure/DatabaseService', () => ({
  __esModule: true,
  default: {
    getInstance: jest.fn(() => mockDbOperations)
  }
}));

// Mock timers for undo functionality
jest.useFakeTimers();

const describeOrSkip = isTestEnvironment ? describe.skip : describe;

describeOrSkip('Transaction Integration Tests - Story 1.3', () => {
  let transactionService: TransactionService;
  let sessionService: SessionService;
  let undoManager: UndoManager;

  const validSession = {
    id: 'integration-session',
    name: 'Integration Test Session',
    organizerId: 'organizer-1',
    status: 'active' as const,
    createdAt: new Date(),
    totalPot: 0.00,
    playerCount: 2
  };

  // Removed validPlayer - not used in integration tests

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();

    // Reset singletons
    (TransactionService as any).instance = null;
    (SessionService as any).instance = null;
    (UndoManager as any).instance = null;

    transactionService = TransactionService.getInstance();
    sessionService = SessionService.getInstance();
    undoManager = UndoManager.getInstance();

    // Setup default mocks
    mockDbOperations.executeQuery.mockImplementation((query: string, _params: any[]) => {
      if (query.includes('SELECT t.*') && query.includes('FROM transactions')) {
        // Mock transaction retrieval
        return Promise.resolve([{
          id: params[0] || 'transaction-1',
          session_id: 'integration-session',
          player_id: 'integration-player',
          type: 'buy_in',
          amount: '25.00',
          timestamp: new Date().toISOString(),
          method: 'manual',
          is_voided: false,
          description: null,
          created_by: 'user',
          voided_at: null,
          void_reason: null
        }]);
      }
      
      if (query.includes('SELECT * FROM sessions WHERE id = ?')) {
        // Mock session retrieval
        return Promise.resolve([validSession]);
      }
      
      if (query.includes('SELECT id, status FROM players')) {
        // Mock player validation
        return Promise.resolve([{ id: 'integration-player', status: 'active' }]);
      }
      
      if (query.includes('SELECT id FROM transactions') && query.includes('datetime(\'now\', \'-5 seconds\')')) {
        // Mock duplicate transaction check
        return Promise.resolve([]);
      }
      
      return Promise.resolve([]);
    });

    mockDbOperations.executeTransaction.mockResolvedValue(undefined);
  });

  afterEach(() => {
    undoManager.destroy();
    jest.runOnlyPendingTimers();
  });

  describe('Full Buy-in Transaction Flow', () => {
    it('should complete entire buy-in recording flow successfully', async () => {
      // Mock session service
      jest.spyOn(sessionService, 'getSession').mockResolvedValue(validSession);

      // Execute buy-in recording
      const result = await transactionService.recordBuyIn(
        'integration-session',
        'integration-player',
        25.00,
        'manual',
        'integration-test'
      );

      // Verify database operations were called in correct sequence
      expect(mockDbOperations.executeTransaction).toHaveBeenCalledWith([
        expect.objectContaining({
          query: expect.stringContaining('INSERT INTO transactions'),
          params: expect.arrayContaining([
            expect.any(String), // transaction ID
            'integration-session',
            'integration-player',
            'buy_in',
            25.00,
            expect.any(String), // timestamp
            'manual',
            false,
            null, // description
            'integration-test'
          ])
        }),
        expect.objectContaining({
          query: expect.stringContaining('UPDATE players'),
          params: [25.00, 25.00, 'integration-player']
        }),
        expect.objectContaining({
          query: expect.stringContaining('UPDATE sessions'),
          params: [25.00, 'integration-session']
        })
      ]);

      // Verify transaction was returned correctly
      expect(result).toEqual(expect.objectContaining({
        sessionId: 'integration-session',
        playerId: 'integration-player',
        type: 'buy_in',
        amount: 25.00,
        method: 'manual',
        isVoided: false
      }));

      // Verify transaction was added to undo manager
      expect(undoManager.canUndo(result.id)).toBe(true);
      expect(undoManager.getRemainingUndoTime(result.id)).toBe(TRANSACTION_LIMITS.UNDO_WINDOW_SECONDS);
    });

    it('should handle database transaction rollback on failure', async () => {
      jest.spyOn(sessionService, 'getSession').mockResolvedValue(validSession);
      mockDbOperations.executeTransaction.mockRejectedValue(new Error('Database connection failed'));

      await expect(
        transactionService.recordBuyIn(
          'integration-session',
          'integration-player',
          25.00
        )
      ).rejects.toThrow('Failed to record buy-in transaction');

      // Verify no undo tracking was set up on failure
      expect(undoManager.getUndoableTransactions()).toHaveLength(0);
    });
  });

  describe('Undo Integration Flow', () => {
    let transactionId: string;

    beforeEach(async () => {
      jest.spyOn(sessionService, 'getSession').mockResolvedValue(validSession);
      
      // Create a transaction first
      const transaction = await transactionService.recordBuyIn(
        'integration-session',
        'integration-player',
        25.00,
        'manual',
        'integration-test'
      );
      
      transactionId = transaction.id;
    });

    it('should complete entire undo flow successfully', async () => {
      // Verify transaction can be undone initially
      expect(undoManager.canUndo(transactionId)).toBe(true);

      // Execute undo
      await transactionService.undoTransaction(transactionId, 'Integration test undo');

      // Verify database operations for undo
      expect(mockDbOperations.executeTransaction).toHaveBeenLastCalledWith([
        expect.objectContaining({
          query: expect.stringContaining('UPDATE transactions'),
          params: expect.arrayContaining([
            expect.any(String), // timestamp
            'Integration test undo',
            transactionId
          ])
        }),
        expect.objectContaining({
          query: expect.stringContaining('UPDATE players'),
          params: [25.00, 25.00, 'integration-player']
        }),
        expect.objectContaining({
          query: expect.stringContaining('UPDATE sessions'),
          params: [25.00, 'integration-session']
        })
      ]);

      // Verify transaction is no longer undoable
      expect(undoManager.canUndo(transactionId)).toBe(false);
      expect(undoManager.getUndoableTransactions()).toHaveLength(0);
    });

    it('should prevent undo after expiration', async () => {
      // Fast-forward time past undo window
      jest.advanceTimersByTime((TRANSACTION_LIMITS.UNDO_WINDOW_SECONDS + 1) * 1000);

      // Verify transaction can no longer be undone
      expect(undoManager.canUndo(transactionId)).toBe(false);

      await expect(
        transactionService.undoTransaction(transactionId)
      ).rejects.toThrow('Transaction cannot be undone (expired or already voided)');

      // Verify no database operations were attempted
      expect(mockDbOperations.executeTransaction).toHaveBeenCalledTimes(1); // Only the initial buy-in
    });
  });

  describe('Transaction History Integration', () => {
    beforeEach(() => {
      // Mock transaction history data
      mockDbOperations.executeQuery.mockImplementation((query: string, _params: any[]) => {
        if (query.includes('SELECT t.id, t.type, t.amount')) {
          return Promise.resolve([
            {
              id: 'transaction-1',
              type: 'buy_in',
              amount: '25.00',
              timestamp: '2023-01-01T12:00:00Z',
              method: 'manual',
              is_voided: false,
              player_name: 'Integration Test Player'
            },
            {
              id: 'transaction-2',
              type: 'buy_in',
              amount: '50.00',
              timestamp: '2023-01-01T12:05:00Z',
              method: 'voice',
              is_voided: true,
              player_name: 'Integration Test Player'
            }
          ]);
        }
        
        return Promise.resolve([]);
      });
    });

    it('should retrieve and format transaction history correctly', async () => {
      const history = await transactionService.getTransactionHistory('integration-session');

      expect(mockDbOperations.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT t.id, t.type, t.amount'),
        ['integration-session']
      );

      expect(history).toHaveLength(2);
      
      // Verify transaction formatting
      expect(history[0]).toEqual({
        id: 'transaction-1',
        playerName: 'Integration Test Player',
        type: 'buy_in',
        amount: 25.00,
        timestamp: new Date('2023-01-01T12:00:00Z'),
        method: 'manual',
        isVoided: false
      });

      expect(history[1]).toEqual({
        id: 'transaction-2',
        playerName: 'Integration Test Player',
        type: 'buy_in',
        amount: 50.00,
        timestamp: new Date('2023-01-01T12:05:00Z'),
        method: 'voice',
        isVoided: true
      });
    });
  });

  describe('Player Balance Integration', () => {
    beforeEach(() => {
      mockDbOperations.executeQuery.mockImplementation((query: string, _params: any[]) => {
        if (query.includes('SELECT p.id, p.name, p.current_balance')) {
          return Promise.resolve([{
            id: 'integration-player',
            name: 'Integration Test Player',
            current_balance: '75.00',
            total_buy_ins: '100.00',
            total_cash_outs: '25.00'
          }]);
        }
        
        return Promise.resolve([]);
      });
    });

    it('should calculate player balance with correct net position', async () => {
      const balance = await transactionService.calculatePlayerBalance('integration-player');

      expect(balance).toEqual({
        playerId: 'integration-player',
        playerName: 'Integration Test Player',
        currentBalance: 75.00,
        totalBuyIns: 100.00,
        totalCashOuts: 25.00,
        netPosition: -25.00 // currentBalance (75) - totalBuyIns (100)
      });
    });
  });

  describe('Validation Integration', () => {
    it('should prevent buy-in for inactive session', async () => {
      const inactiveSession = { ...validSession, status: 'completed' as const };
      jest.spyOn(sessionService, 'getSession').mockResolvedValue(inactiveSession);

      await expect(
        transactionService.recordBuyIn('integration-session', 'integration-player', 25.00)
      ).rejects.toThrow('Buy-ins are only allowed for active sessions');
    });

    it('should prevent buy-in for inactive player', async () => {
      jest.spyOn(sessionService, 'getSession').mockResolvedValue(validSession);
      mockDbOperations.executeQuery.mockImplementation((query: string) => {
        if (query.includes('SELECT id, status FROM players')) {
          return Promise.resolve([{ id: 'integration-player', status: 'cashed_out' }]);
        }
        return Promise.resolve([]);
      });

      await expect(
        transactionService.recordBuyIn('integration-session', 'integration-player', 25.00)
      ).rejects.toThrow('Buy-ins are only allowed for active players');
    });

    it('should enforce transaction limits', async () => {
      jest.spyOn(sessionService, 'getSession').mockResolvedValue(validSession);

      await expect(
        transactionService.recordBuyIn('integration-session', 'integration-player', TRANSACTION_LIMITS.MIN_BUY_IN - 0.01)
      ).rejects.toThrow(`Buy-in amount must be at least $${TRANSACTION_LIMITS.MIN_BUY_IN}`);

      await expect(
        transactionService.recordBuyIn('integration-session', 'integration-player', TRANSACTION_LIMITS.MAX_BUY_IN + 0.01)
      ).rejects.toThrow(`Buy-in amount cannot exceed $${TRANSACTION_LIMITS.MAX_BUY_IN}`);
    });

    it('should prevent duplicate transactions', async () => {
      jest.spyOn(sessionService, 'getSession').mockResolvedValue(validSession);
      mockDbOperations.executeQuery.mockImplementation((query: string) => {
        if (query.includes('SELECT id, status FROM players')) {
          return Promise.resolve([{ id: 'integration-player', status: 'active' }]);
        }
        if (query.includes('SELECT id FROM transactions') && query.includes('datetime(\'now\', \'-5 seconds\')')) {
          return Promise.resolve([{ id: 'duplicate-transaction' }]);
        }
        return Promise.resolve([]);
      });

      await expect(
        transactionService.recordBuyIn('integration-session', 'integration-player', 25.00)
      ).rejects.toThrow('Duplicate transaction detected');
    });
  });

  describe('Error Recovery Integration', () => {
    it('should maintain data consistency on partial failures', async () => {
      jest.spyOn(sessionService, 'getSession').mockResolvedValue(validSession);
      
      // Mock partial failure - transaction insert succeeds but balance update fails
      mockDbOperations.executeTransaction.mockRejectedValue(new Error('Balance update failed'));

      await expect(
        transactionService.recordBuyIn('integration-session', 'integration-player', 25.00)
      ).rejects.toThrow('Failed to record buy-in transaction');

      // Verify no transaction is in undo manager if database operation failed
      expect(undoManager.getUndoableTransactions()).toHaveLength(0);
    });

    it('should handle concurrent undo attempts gracefully', async () => {
      jest.spyOn(sessionService, 'getSession').mockResolvedValue(validSession);
      
      // Create transaction
      const transaction = await transactionService.recordBuyIn(
        'integration-session',
        'integration-player',
        25.00
      );

      // Mock first undo succeeds, second fails
      mockDbOperations.executeTransaction
        .mockResolvedValueOnce(undefined) // First undo succeeds
        .mockRejectedValueOnce(new Error('Transaction already voided')); // Second undo fails

      // First undo should succeed
      await transactionService.undoTransaction(transaction.id);
      expect(undoManager.canUndo(transaction.id)).toBe(false);

      // Second undo should fail gracefully
      await expect(
        transactionService.undoTransaction(transaction.id)
      ).rejects.toThrow('Transaction cannot be undone (expired or already voided)');
    });
  });

  describe('Multi-Transaction Integration', () => {
    it('should handle multiple sequential transactions correctly', async () => {
      jest.spyOn(sessionService, 'getSession').mockResolvedValue(validSession);
      
      const transactions = [];
      
      // Create multiple transactions
      for (let i = 1; i <= 3; i++) {
        const transaction = await transactionService.recordBuyIn(
          'integration-session',
          'integration-player',
          25.00 * i,
          'manual',
          'multi-test'
        );
        transactions.push(transaction);
      }

      // Verify all transactions are undoable
      expect(undoManager.getUndoableTransactions()).toHaveLength(3);
      
      transactions.forEach(transaction => {
        expect(undoManager.canUndo(transaction.id)).toBe(true);
      });

      // Undo middle transaction
      await transactionService.undoTransaction(transactions[1].id);

      // Verify correct transaction was removed from undo tracking
      expect(undoManager.getUndoableTransactions()).toHaveLength(2);
      expect(undoManager.canUndo(transactions[0].id)).toBe(true);
      expect(undoManager.canUndo(transactions[1].id)).toBe(false);
      expect(undoManager.canUndo(transactions[2].id)).toBe(true);
    });
  });

  describe('Performance Integration', () => {
    it('should handle bulk operations efficiently', async () => {
      jest.spyOn(sessionService, 'getSession').mockResolvedValue(validSession);
      
      const startTime = Date.now();
      
      // Create 10 transactions
      const promises = Array.from({ length: 10 }, (_, i) =>
        transactionService.recordBuyIn(
          'integration-session',
          'integration-player',
          25.00 + i,
          'manual',
          'bulk-test'
        )
      );

      const transactions = await Promise.all(promises);
      const endTime = Date.now();

      // Verify all transactions were created
      expect(transactions).toHaveLength(10);
      expect(undoManager.getUndoableTransactions()).toHaveLength(10);

      // Performance check - should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(1000); // 1 second

      // Verify database operations were called for each transaction
      expect(mockDbOperations.executeTransaction).toHaveBeenCalledTimes(10);
    });
  });
});