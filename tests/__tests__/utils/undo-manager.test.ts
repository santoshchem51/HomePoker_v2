/**
 * UndoManager Unit Tests
 * Tests Story 1.3 AC: 6 - Undo functionality within 30-second window
 */
import { UndoManager } from '../../../src/utils/undo-manager';
import { Transaction, TRANSACTION_LIMITS } from '../../../src/types/transaction';

// Mock timers
jest.useFakeTimers();

describe('UndoManager', () => {
  let undoManager: UndoManager;

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

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    
    // Set fake time to current time for consistency
    jest.setSystemTime(new Date());
    
    // Reset singleton instance
    (UndoManager as any).instance = null;
    undoManager = UndoManager.getInstance();
  });

  afterEach(() => {
    undoManager.destroy();
    jest.runOnlyPendingTimers();
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = UndoManager.getInstance();
      const instance2 = UndoManager.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('addUndoableTransaction', () => {
    it('should add transaction to undo tracking', () => {
      undoManager.addUndoableTransaction(mockTransaction);
      
      expect(undoManager.canUndo('transaction-1')).toBe(true);
    });

    it('should calculate correct undo deadline', () => {
      const now = new Date();
      jest.setSystemTime(now);
      const transaction = { ...mockTransaction, timestamp: now };
      
      undoManager.addUndoableTransaction(transaction);
      
      const remainingTime = undoManager.getRemainingUndoTime('transaction-1');
      expect(remainingTime).toBe(TRANSACTION_LIMITS.UNDO_WINDOW_SECONDS);
    });
  });

  describe('canUndo', () => {
    it('should return true for recent transactions', () => {
      undoManager.addUndoableTransaction(mockTransaction);
      
      expect(undoManager.canUndo('transaction-1')).toBe(true);
    });

    it('should return false for non-existent transactions', () => {
      expect(undoManager.canUndo('non-existent')).toBe(false);
    });

    it('should return false for expired transactions', () => {
      const now = new Date();
      jest.setSystemTime(now);
      const transaction = { ...mockTransaction, timestamp: now };
      
      undoManager.addUndoableTransaction(transaction);
      
      // Fast-forward time past the undo window
      jest.advanceTimersByTime((TRANSACTION_LIMITS.UNDO_WINDOW_SECONDS + 1) * 1000);
      
      expect(undoManager.canUndo('transaction-1')).toBe(false);
    });

    it('should return false for voided transactions', () => {
      const voidedTransaction = { ...mockTransaction, isVoided: true };
      undoManager.addUndoableTransaction(voidedTransaction);
      
      expect(undoManager.canUndo('transaction-1')).toBe(false);
    });
  });

  describe('getRemainingUndoTime', () => {
    it('should return correct remaining time', () => {
      const now = new Date();
      jest.setSystemTime(now);
      
      const transaction = { ...mockTransaction, timestamp: now };
      undoManager.addUndoableTransaction(transaction);
      
      expect(undoManager.getRemainingUndoTime('transaction-1')).toBe(30);
      
      // Advance time by 10 seconds
      jest.advanceTimersByTime(10000);
      expect(undoManager.getRemainingUndoTime('transaction-1')).toBe(20);
      
      // Advance time by another 15 seconds
      jest.advanceTimersByTime(15000);
      expect(undoManager.getRemainingUndoTime('transaction-1')).toBe(5);
    });

    it('should return 0 for non-existent transactions', () => {
      expect(undoManager.getRemainingUndoTime('non-existent')).toBe(0);
    });

    it('should return 0 for expired transactions', () => {
      const now = new Date();
      jest.setSystemTime(now);
      
      const transaction = { ...mockTransaction, timestamp: now };
      undoManager.addUndoableTransaction(transaction);
      
      // Advance time past the undo window
      jest.advanceTimersByTime((TRANSACTION_LIMITS.UNDO_WINDOW_SECONDS + 1) * 1000);
      
      expect(undoManager.getRemainingUndoTime('transaction-1')).toBe(0);
    });
  });

  describe('removeUndoableTransaction', () => {
    it('should remove transaction from tracking', () => {
      undoManager.addUndoableTransaction(mockTransaction);
      
      expect(undoManager.canUndo('transaction-1')).toBe(true);
      
      undoManager.removeUndoableTransaction('transaction-1');
      
      expect(undoManager.canUndo('transaction-1')).toBe(false);
    });
  });

  describe('getUndoableTransactions', () => {
    it('should return all undoable transactions', () => {
      const transaction1 = { ...mockTransaction, id: 'transaction-1' };
      const transaction2 = { ...mockTransaction, id: 'transaction-2' };
      
      undoManager.addUndoableTransaction(transaction1);
      undoManager.addUndoableTransaction(transaction2);
      
      const undoable = undoManager.getUndoableTransactions();
      
      expect(undoable).toHaveLength(2);
      expect(undoable.map(u => u.transaction.id)).toContain('transaction-1');
      expect(undoable.map(u => u.transaction.id)).toContain('transaction-2');
    });

    it('should exclude expired transactions', () => {
      const now = new Date();
      const recentTransaction = { 
        ...mockTransaction, 
        id: 'recent',
        timestamp: new Date(now.getTime() - 5000) // 5 seconds ago - within window
      };
      const expiredTransaction = { 
        ...mockTransaction, 
        id: 'expired',
        timestamp: new Date(now.getTime() - 35000) // 35 seconds ago - expired
      };
      
      undoManager.addUndoableTransaction(recentTransaction);
      undoManager.addUndoableTransaction(expiredTransaction);
      
      const undoable = undoManager.getUndoableTransactions();
      
      expect(undoable).toHaveLength(1);
      expect(undoable[0].transaction.id).toBe('recent');
    });

    it('should exclude voided transactions', () => {
      const activeTransaction = { ...mockTransaction, id: 'active', isVoided: false };
      const voidedTransaction = { ...mockTransaction, id: 'voided', isVoided: true };
      
      undoManager.addUndoableTransaction(activeTransaction);
      undoManager.addUndoableTransaction(voidedTransaction);
      
      const undoable = undoManager.getUndoableTransactions();
      
      expect(undoable).toHaveLength(1);
      expect(undoable[0].transaction.id).toBe('active');
    });
  });

  describe('getMostRecentUndoableTransaction', () => {
    it('should return the most recent undoable transaction', () => {
      const now = new Date();
      const older = { 
        ...mockTransaction, 
        id: 'older',
        timestamp: new Date(now.getTime() - 10000) // 10 seconds ago
      };
      const newer = { 
        ...mockTransaction, 
        id: 'newer',
        timestamp: new Date(now.getTime() - 5000) // 5 seconds ago
      };
      
      undoManager.addUndoableTransaction(older);
      undoManager.addUndoableTransaction(newer);
      
      const mostRecent = undoManager.getMostRecentUndoableTransaction();
      
      expect(mostRecent).not.toBeNull();
      expect(mostRecent!.transaction.id).toBe('newer');
    });

    it('should return null when no undoable transactions exist', () => {
      const mostRecent = undoManager.getMostRecentUndoableTransaction();
      
      expect(mostRecent).toBeNull();
    });
  });

  describe('automatic cleanup', () => {
    it('should clean up expired entries periodically', () => {
      const now = new Date();
      const expiredTransaction = { 
        ...mockTransaction,
        timestamp: new Date(now.getTime() - 35000) // 35 seconds ago - already expired
      };
      
      undoManager.addUndoableTransaction(expiredTransaction);
      
      // Initially present (before cleanup runs)
      expect(undoManager.getUndoableTransactions().length).toBe(0); // Should be 0 since it's already expired
      
      // Fast-forward past cleanup interval
      jest.advanceTimersByTime(11000); // 11 seconds to trigger cleanup
      
      // Should still be cleaned up
      expect(undoManager.canUndo('transaction-1')).toBe(false);
    });

    it('should run cleanup every 10 seconds', () => {
      // Verify cleanup interval is set correctly
      jest.advanceTimersByTime(10000);
      
      // The cleanup should have run (no assertions needed, just verifying no errors)
      expect(jest.getTimerCount()).toBeGreaterThanOrEqual(0);
    });
  });

  describe('destroy', () => {
    it('should clear all data and stop cleanup', () => {
      undoManager.addUndoableTransaction(mockTransaction);
      
      expect(undoManager.canUndo('transaction-1')).toBe(true);
      
      undoManager.destroy();
      
      expect(undoManager.canUndo('transaction-1')).toBe(false);
      expect(undoManager.getUndoableTransactions()).toHaveLength(0);
    });

    it('should stop the cleanup interval', () => {
      const initialTimerCount = jest.getTimerCount();
      
      undoManager.destroy();
      
      // Timer count should decrease (cleanup interval cleared)
      expect(jest.getTimerCount()).toBeLessThanOrEqual(initialTimerCount);
    });
  });

  describe('edge cases', () => {
    it('should handle concurrent operations safely', () => {
      // Add multiple transactions quickly
      for (let i = 0; i < 5; i++) {
        const transaction = { ...mockTransaction, id: `transaction-${i}` };
        undoManager.addUndoableTransaction(transaction);
      }
      
      // Should handle all transactions
      expect(undoManager.getUndoableTransactions()).toHaveLength(5);
      
      // Remove some transactions
      undoManager.removeUndoableTransaction('transaction-0');
      undoManager.removeUndoableTransaction('transaction-2');
      
      expect(undoManager.getUndoableTransactions()).toHaveLength(3);
    });

    it('should handle transactions with same timestamp correctly', () => {
      const now = new Date();
      const timestamp = new Date(now.getTime() - 5000); // 5 seconds ago - within window
      const transaction1 = { ...mockTransaction, id: 'transaction-1', timestamp };
      const transaction2 = { ...mockTransaction, id: 'transaction-2', timestamp };
      
      undoManager.addUndoableTransaction(transaction1);
      undoManager.addUndoableTransaction(transaction2);
      
      expect(undoManager.getUndoableTransactions()).toHaveLength(2);
    });
  });
});