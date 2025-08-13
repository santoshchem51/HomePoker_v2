/**
 * UndoManager - Utility for managing transaction undo functionality
 * Implements Story 1.3 AC: 6 - Simple undo functionality for last transaction within 30 seconds
 */
import { Transaction, TRANSACTION_LIMITS } from '../types/transaction';

export interface UndoableTransaction {
  transaction: Transaction;
  undoDeadline: Date;
}

export class UndoManager {
  private static instance: UndoManager | null = null;
  private undoableTransactions: Map<string, UndoableTransaction> = new Map();
  private cleanupInterval: any = null;

  private constructor() {
    this.startCleanupInterval();
  }

  /**
   * Get singleton instance of UndoManager
   */
  public static getInstance(): UndoManager {
    if (!UndoManager.instance) {
      UndoManager.instance = new UndoManager();
    }
    return UndoManager.instance;
  }

  /**
   * Add transaction to undo tracking
   * AC: 6 - Track transactions for 30-second undo window
   */
  public addUndoableTransaction(transaction: Transaction): void {
    const undoDeadline = new Date(
      transaction.timestamp.getTime() + (TRANSACTION_LIMITS.UNDO_WINDOW_SECONDS * 1000)
    );

    this.undoableTransactions.set(transaction.id, {
      transaction,
      undoDeadline
    });
  }

  /**
   * Check if transaction can be undone
   * AC: 6 - Only allow undo within 30-second window
   */
  public canUndo(transactionId: string): boolean {
    const undoable = this.undoableTransactions.get(transactionId);
    if (!undoable) {
      return false;
    }

    const now = new Date();
    return now <= undoable.undoDeadline && !undoable.transaction.isVoided;
  }

  /**
   * Get remaining undo time in seconds
   */
  public getRemainingUndoTime(transactionId: string): number {
    const undoable = this.undoableTransactions.get(transactionId);
    if (!undoable) {
      return 0;
    }

    const now = new Date();
    const remainingMs = undoable.undoDeadline.getTime() - now.getTime();
    return Math.max(0, Math.ceil(remainingMs / 1000));
  }

  /**
   * Remove transaction from undo tracking (after successful undo or expiration)
   */
  public removeUndoableTransaction(transactionId: string): void {
    this.undoableTransactions.delete(transactionId);
  }

  /**
   * Get all currently undoable transactions
   */
  public getUndoableTransactions(): UndoableTransaction[] {
    const now = new Date();
    const undoable: UndoableTransaction[] = [];

    for (const [transactionId, undoableTransaction] of this.undoableTransactions.entries()) {
      if (now <= undoableTransaction.undoDeadline && !undoableTransaction.transaction.isVoided) {
        undoable.push(undoableTransaction);
      } else {
        // Clean up expired entries
        this.undoableTransactions.delete(transactionId);
      }
    }

    return undoable;
  }

  /**
   * Get the most recent undoable transaction
   */
  public getMostRecentUndoableTransaction(): UndoableTransaction | null {
    const undoable = this.getUndoableTransactions();
    if (undoable.length === 0) {
      return null;
    }

    // Sort by timestamp (most recent first)
    undoable.sort((a, b) => 
      b.transaction.timestamp.getTime() - a.transaction.timestamp.getTime()
    );

    return undoable[0];
  }

  /**
   * Start periodic cleanup of expired undo entries
   */
  private startCleanupInterval(): void {
    // Clean up expired entries every 10 seconds
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
    }, 10000);
  }

  /**
   * Clean up expired undo entries
   */
  private cleanupExpiredEntries(): void {
    const now = new Date();
    
    for (const [transactionId, undoable] of this.undoableTransactions.entries()) {
      if (now > undoable.undoDeadline) {
        this.undoableTransactions.delete(transactionId);
      }
    }
  }

  /**
   * Stop cleanup interval (for testing or cleanup)
   */
  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.undoableTransactions.clear();
  }
}