/**
 * TransactionService - Core business logic for transaction management
 * Implements Story 1.3 requirements for buy-in recording and financial tracking
 */
import { DatabaseService } from '../infrastructure/DatabaseService';
import { SessionService } from './SessionService';
import { 
  Transaction, 
  PlayerBalance, 
  TransactionSummary,
  TRANSACTION_LIMITS 
} from '../../types/transaction';
import { ServiceError } from './ServiceError';
import { CalculationUtils } from '../../utils/calculations';

export class TransactionService {
  private static instance: TransactionService | null = null;
  private dbService: DatabaseService;
  private sessionService: SessionService;

  private constructor() {
    this.dbService = DatabaseService.getInstance();
    this.sessionService = SessionService.getInstance();
  }

  /**
   * Get singleton instance of TransactionService
   */
  public static getInstance(): TransactionService {
    if (!TransactionService.instance) {
      TransactionService.instance = new TransactionService();
    }
    return TransactionService.instance;
  }

  /**
   * Record a buy-in transaction with validation and database integration
   * AC: 1, 2, 3, 5
   */
  public async recordBuyIn(
    sessionId: string,
    playerId: string,
    amount: number,
    method: 'voice' | 'manual' = 'manual',
    createdBy: string = 'user',
    description?: string
  ): Promise<Transaction> {
    try {
      // Input validation
      await this.validateBuyInRequest(sessionId, playerId, amount);

      // Execute buy-in transaction with ACID compliance
      return await this.dbService.executeTransaction(async () => {
        // Record the transaction
        const transaction = await this.dbService.recordTransaction({
          sessionId,
          playerId,
          type: 'buy_in',
          amount,
          method,
          isVoided: false,
          description,
          createdBy,
        });

        // Get current player state
        const players = await this.dbService.getPlayers(sessionId);
        const player = players.find(p => p.id === playerId);
        
        if (!player) {
          throw new ServiceError('PLAYER_NOT_FOUND', `Player ${playerId} not found`);
        }

        // Update player balance and buy-in totals
        await this.dbService.updatePlayer(playerId, {
          currentBalance: player.currentBalance + amount,
          totalBuyIns: player.totalBuyIns + amount,
        });

        // Get current session and update total pot
        const session = await this.dbService.getSession(sessionId);
        if (!session) {
          throw new ServiceError('SESSION_NOT_FOUND', `Session ${sessionId} not found`);
        }

        await this.dbService.updateSession(sessionId, {
          totalPot: session.totalPot + amount,
        });

        return transaction;
      });
    } catch (error) {
      console.error('Buy-in recording failed:', error);
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError('TRANSACTION_FAILED', `Failed to record buy-in transaction: ${error}`);
    }
  }

  /**
   * Record a cash-out transaction with validation and database integration
   * AC: 1, 2, 3, 4, 5, 6
   */
  public async recordCashOut(
    sessionId: string,
    playerId: string,
    amount: number,
    method: 'voice' | 'manual' = 'manual',
    createdBy: string = 'user',
    description?: string,
    organizerConfirmed: boolean = false
  ): Promise<Transaction> {
    try {
      // Input validation
      await this.validateCashOutRequest(sessionId, playerId, amount, organizerConfirmed);

      // Get player's current state to determine if they're cashing out completely
      const players = await this.dbService.getPlayers(sessionId);
      const player = players.find(p => p.id === playerId);
      
      if (!player) {
        throw new ServiceError('PLAYER_NOT_FOUND', `Player ${playerId} not found`);
      }

      const willCashOutCompletely = CalculationUtils.subtractAmounts(player.currentBalance, amount) <= 0;

      // Execute cash-out transaction with ACID compliance
      return await this.dbService.executeTransaction(async () => {
        // Record the transaction
        const transaction = await this.dbService.recordTransaction({
          sessionId,
          playerId,
          type: 'cash_out',
          amount,
          method,
          isVoided: false,
          description,
          createdBy,
        });

        // Update player balance and cash-out totals
        await this.dbService.updatePlayer(playerId, {
          currentBalance: player.currentBalance - amount,
          totalCashOuts: player.totalCashOuts + amount,
          status: willCashOutCompletely ? 'cashed_out' : 'active',
        });

        // Update session total pot (reduce by cash-out amount)
        const session = await this.dbService.getSession(sessionId);
        if (session) {
          await this.dbService.updateSession(sessionId, {
            totalPot: session.totalPot - amount,
          });
        }

        return transaction;
      });
    } catch (error) {
      console.error('Cash-out recording failed:', error);
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError('TRANSACTION_FAILED', `Failed to record cash-out transaction: ${error}`);
    }
  }

  /**
   * Get transaction by ID
   */
  public async getTransaction(transactionId: string): Promise<Transaction> {
    try {
      const results = await this.dbService.executeQuery(
        `SELECT t.*, p.name as player_name
         FROM transactions t
         JOIN players p ON t.player_id = p.id
         WHERE t.id = ?`,
        [transactionId]
      );

      if (results.rows.length === 0) {
        throw new ServiceError('TRANSACTION_NOT_FOUND', `Transaction ${transactionId} not found`);
      }

      const row = results.rows.item(0);
      return this.mapDatabaseRowToTransaction(row);
    } catch (error) {
      console.error('Failed to get transaction:', error);
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError('TRANSACTION_FETCH_FAILED', `Failed to retrieve transaction: ${error}`);
    }
  }

  /**
   * Get transaction history for a session
   * AC: 4
   */
  public async getTransactionHistory(sessionId: string): Promise<TransactionSummary[]> {
    try {
      const results = await this.dbService.executeQuery(
        `SELECT t.id, t.player_id, t.type, t.amount, t.timestamp, t.method, t.is_voided,
                p.name as player_name
         FROM transactions t
         JOIN players p ON t.player_id = p.id
         WHERE t.session_id = ?
         ORDER BY t.timestamp DESC`,
        [sessionId]
      );

      const transactions: TransactionSummary[] = [];
      for (let i = 0; i < results.rows.length; i++) {
        const row = results.rows.item(i);
        transactions.push({
          id: row.id,
          playerId: row.player_id,
          playerName: row.player_name,
          type: row.type as 'buy_in' | 'cash_out',
          amount: parseFloat(row.amount),
          timestamp: new Date(row.timestamp),
          method: row.method as 'voice' | 'manual',
          isVoided: Boolean(row.is_voided)
        });
      }

      return transactions;
    } catch (error) {
      console.error('Failed to get transaction history:', error);
      throw new ServiceError('TRANSACTION_HISTORY_FAILED', `Failed to retrieve transaction history: ${error}`);
    }
  }

  /**
   * Get paginated transaction history for a session with virtualization support
   * Implements Story 5.2 AC: 5 - Lazy loading for large transaction lists
   */
  public async getTransactionHistoryPaginated(
    sessionId: string,
    page: number = 0,
    limit: number = 50,
    filter?: 'all' | 'buy_in' | 'cash_out',
    searchTerm?: string
  ): Promise<{
    transactions: TransactionSummary[];
    totalCount: number;
    hasMore: boolean;
    page: number;
    limit: number;
  }> {
    try {
      const offset = page * limit;
      
      // Build WHERE clause with filters
      let whereClause = 't.session_id = ?';
      const params: any[] = [sessionId];
      
      if (filter && filter !== 'all') {
        whereClause += ' AND t.type = ?';
        params.push(filter);
      }
      
      if (searchTerm) {
        whereClause += ' AND (p.name LIKE ? OR t.amount LIKE ?)';
        const searchPattern = `%${searchTerm}%`;
        params.push(searchPattern, searchPattern);
      }

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM transactions t
        JOIN players p ON t.player_id = p.id
        WHERE ${whereClause}
      `;
      
      const countResults = await this.dbService.executeQuery(countQuery, params);
      const totalCount = countResults.rows.item(0).total;

      // Get paginated results
      const query = `
        SELECT t.id, t.player_id, t.type, t.amount, t.timestamp, t.method, t.is_voided,
               p.name as player_name
        FROM transactions t
        JOIN players p ON t.player_id = p.id
        WHERE ${whereClause}
        ORDER BY t.timestamp DESC
        LIMIT ? OFFSET ?
      `;
      
      const queryParams = [...params, limit, offset];
      const results = await this.dbService.executeQuery(query, queryParams);

      const transactions: TransactionSummary[] = [];
      for (let i = 0; i < results.rows.length; i++) {
        const row = results.rows.item(i);
        transactions.push({
          id: row.id,
          playerId: row.player_id,
          playerName: row.player_name,
          type: row.type as 'buy_in' | 'cash_out',
          amount: parseFloat(row.amount),
          timestamp: new Date(row.timestamp),
          method: row.method as 'voice' | 'manual',
          isVoided: Boolean(row.is_voided)
        });
      }

      const hasMore = offset + transactions.length < totalCount;

      return {
        transactions,
        totalCount,
        hasMore,
        page,
        limit
      };
    } catch (error) {
      console.error('Failed to get paginated transaction history:', error);
      throw new ServiceError('TRANSACTION_HISTORY_FAILED', `Failed to retrieve paginated transaction history: ${error}`);
    }
  }

  /**
   * Search transactions across all sessions (for global transaction search)
   */
  public async searchTransactions(
    searchTerm: string,
    limit: number = 100
  ): Promise<TransactionSummary[]> {
    try {
      const searchPattern = `%${searchTerm}%`;
      const results = await this.dbService.executeQuery(
        `SELECT t.id, t.player_id, t.type, t.amount, t.timestamp, t.method, t.is_voided,
                p.name as player_name, s.name as session_name
         FROM transactions t
         JOIN players p ON t.player_id = p.id
         JOIN sessions s ON t.session_id = s.id
         WHERE p.name LIKE ? OR t.amount LIKE ? OR s.name LIKE ?
         ORDER BY t.timestamp DESC
         LIMIT ?`,
        [searchPattern, searchPattern, searchPattern, limit]
      );

      const transactions: TransactionSummary[] = [];
      for (let i = 0; i < results.rows.length; i++) {
        const row = results.rows.item(i);
        transactions.push({
          id: row.id,
          playerId: row.player_id,
          playerName: row.player_name,
          type: row.type as 'buy_in' | 'cash_out',
          amount: parseFloat(row.amount),
          timestamp: new Date(row.timestamp),
          method: row.method as 'voice' | 'manual',
          isVoided: Boolean(row.is_voided)
        });
      }

      return transactions;
    } catch (error) {
      console.error('Failed to search transactions:', error);
      throw new ServiceError('TRANSACTION_SEARCH_FAILED', `Failed to search transactions: ${error}`);
    }
  }

  /**
   * Calculate current player balance
   * AC: 3
   */
  public async calculatePlayerBalance(playerId: string): Promise<PlayerBalance> {
    try {
      const results = await this.dbService.executeQuery(
        `SELECT p.id, p.name, p.current_balance, p.total_buy_ins, p.total_cash_outs
         FROM players p
         WHERE p.id = ?`,
        [playerId]
      );

      if (results.rows.length === 0) {
        throw new ServiceError('PLAYER_NOT_FOUND', `Player ${playerId} not found`);
      }

      const player = results.rows.item(0);
      const currentBalance = parseFloat(player.current_balance);
      const totalBuyIns = parseFloat(player.total_buy_ins);
      const totalCashOuts = parseFloat(player.total_cash_outs);

      return {
        playerId: player.id,
        playerName: player.name,
        currentBalance,
        totalBuyIns,
        totalCashOuts,
        netPosition: currentBalance - totalBuyIns
      };
    } catch (error) {
      console.error('Failed to calculate player balance:', error);
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError('BALANCE_CALCULATION_FAILED', `Failed to calculate player balance: ${error}`);
    }
  }

  /**
   * Undo a transaction
   * AC: 6 - Undo functionality within 30-second window
   */
  public async undoTransaction(transactionId: string, reason: string): Promise<void> {
    try {
      // Get the transaction details first
      const transaction = await this.getTransaction(transactionId);
      
      if (transaction.isVoided) {
        throw new ServiceError('TRANSACTION_ALREADY_VOIDED', 'Transaction is already voided');
      }

      // Check if within undo window (30 seconds)
      const thirtySecondsAgo = new Date();
      thirtySecondsAgo.setSeconds(thirtySecondsAgo.getSeconds() - 30);
      
      if (transaction.timestamp < thirtySecondsAgo) {
        throw new ServiceError('UNDO_WINDOW_EXPIRED', 'Transaction can only be undone within 30 seconds');
      }

      // Execute undo in transaction
      await this.dbService.executeTransaction(async () => {
        // Mark transaction as voided
        await this.dbService.voidTransaction(transactionId, reason);

        // Reverse the transaction effects
        const players = await this.dbService.getPlayers(transaction.sessionId);
        const player = players.find(p => p.id === transaction.playerId);
        
        if (player) {
          if (transaction.type === 'buy_in') {
            // Reverse buy-in: reduce balance and buy-ins
            await this.dbService.updatePlayer(transaction.playerId, {
              currentBalance: player.currentBalance - transaction.amount,
              totalBuyIns: player.totalBuyIns - transaction.amount,
            });

            // Reduce session total pot
            const session = await this.dbService.getSession(transaction.sessionId);
            if (session) {
              await this.dbService.updateSession(transaction.sessionId, {
                totalPot: session.totalPot - transaction.amount,
              });
            }
          } else {
            // Reverse cash-out: increase balance and reduce cash-outs
            await this.dbService.updatePlayer(transaction.playerId, {
              currentBalance: player.currentBalance + transaction.amount,
              totalCashOuts: player.totalCashOuts - transaction.amount,
              status: 'active', // Reactivate player if they were cashed out
            });

            // Increase session total pot
            const session = await this.dbService.getSession(transaction.sessionId);
            if (session) {
              await this.dbService.updateSession(transaction.sessionId, {
                totalPot: session.totalPot + transaction.amount,
              });
            }
          }
        }
      });
    } catch (error) {
      console.error('Failed to undo transaction:', error);
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError('UNDO_FAILED', `Failed to undo transaction: ${error}`);
    }
  }

  /**
   * Check if transaction can be undone (within 30-second window)
   */
  public canUndoTransaction(_transactionId: string): boolean {
    // This would need to check the timestamp, simplified for now
    return true;
  }

  /**
   * Get remaining undo time in seconds
   */
  public getRemainingUndoTime(_transactionId: string): number {
    // Simplified implementation
    return 30;
  }

  /**
   * Validate buy-in request
   * AC: 5
   */
  private async validateBuyInRequest(
    sessionId: string, 
    playerId: string, 
    amount: number
  ): Promise<void> {
    // Amount validation
    if (!amount || amount <= 0) {
      throw new ServiceError('VALIDATION_ERROR', 'Buy-in amount must be positive');
    }

    if (amount < TRANSACTION_LIMITS.MIN_BUY_IN) {
      throw new ServiceError('VALIDATION_ERROR', `Buy-in amount must be at least $${TRANSACTION_LIMITS.MIN_BUY_IN}`);
    }

    if (amount > TRANSACTION_LIMITS.MAX_BUY_IN) {
      throw new ServiceError('VALIDATION_ERROR', `Buy-in amount cannot exceed $${TRANSACTION_LIMITS.MAX_BUY_IN}`);
    }

    // Session validation
    const session = await this.sessionService.getSession(sessionId);
    if (!session || session.status !== 'active') {
      throw new ServiceError('VALIDATION_ERROR', 'Buy-ins are only allowed for active sessions');
    }

    // Player validation
    const players = await this.dbService.getPlayers(sessionId);
    const player = players.find(p => p.id === playerId);
    
    if (!player) {
      throw new ServiceError('VALIDATION_ERROR', 'Player not found in this session');
    }

    if (player.status !== 'active') {
      throw new ServiceError('VALIDATION_ERROR', 'Buy-ins are only allowed for active players');
    }
  }

  /**
   * Validate cash-out request
   * AC: 4, 5, 6
   */
  private async validateCashOutRequest(
    sessionId: string, 
    playerId: string, 
    amount: number,
    _organizerConfirmed: boolean = false
  ): Promise<void> {
    // Amount validation
    if (!amount || amount <= 0) {
      throw new ServiceError('VALIDATION_ERROR', 'Cash-out amount must be positive');
    }

    if (amount < TRANSACTION_LIMITS.MIN_CASH_OUT) {
      throw new ServiceError('VALIDATION_ERROR', `Cash-out amount must be at least $${TRANSACTION_LIMITS.MIN_CASH_OUT}`);
    }

    if (amount > TRANSACTION_LIMITS.MAX_CASH_OUT) {
      throw new ServiceError('VALIDATION_ERROR', `Cash-out amount cannot exceed $${TRANSACTION_LIMITS.MAX_CASH_OUT}`);
    }

    // Session validation
    const session = await this.sessionService.getSession(sessionId);
    if (!session || session.status !== 'active') {
      throw new ServiceError('VALIDATION_ERROR', 'Cash-outs are only allowed for active sessions');
    }

    // Player validation
    const players = await this.dbService.getPlayers(sessionId);
    const player = players.find(p => p.id === playerId);
    
    if (!player) {
      throw new ServiceError('VALIDATION_ERROR', 'Player not found in this session');
    }

    if (player.status === 'cashed_out') {
      throw new ServiceError('PLAYER_ALREADY_CASHED_OUT', 'Player has already cashed out');
    }

    if (player.status !== 'active') {
      throw new ServiceError('VALIDATION_ERROR', 'Cash-outs are only allowed for active players');
    }

    // Validate sufficient balance
    if (amount > player.currentBalance) {
      throw new ServiceError('INSUFFICIENT_BALANCE', 'Cash-out amount exceeds current balance');
    }
  }

  /**
   * Map database row to Transaction object
   */
  private mapDatabaseRowToTransaction(row: any): Transaction {
    return {
      id: row.id,
      sessionId: row.session_id,
      playerId: row.player_id,
      type: row.type,
      amount: parseFloat(row.amount),
      timestamp: new Date(row.timestamp),
      method: row.method,
      isVoided: Boolean(row.is_voided),
      description: row.description,
      createdBy: row.created_by,
      voidedAt: row.voided_at ? new Date(row.voided_at) : undefined,
      voidReason: row.void_reason
    };
  }
}

export default TransactionService;