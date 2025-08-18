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
import { ErrorCode } from '../../types/errors';
import { CalculationUtils } from '../../utils/calculations';
import { 
  ValidationResult, 
  TransactionValidationResult, 
  ValidationHelper 
} from '../../types/validation';

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
      // Input validation (using legacy method during migration)
      await this.validateBuyInRequestLegacy(sessionId, playerId, amount);

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
    console.log('⚠️ recordCashOut called - OLD legacy method with exceptions!');
    try {
      // Input validation (using legacy method during migration)
      await this.validateCashOutRequestLegacy(sessionId, playerId, amount, organizerConfirmed);

      // Get player's current state to determine if they're cashing out completely
      const players = await this.dbService.getPlayers(sessionId);
      const player = players.find(p => p.id === playerId);
      
      if (!player) {
        throw new ServiceError('PLAYER_NOT_FOUND', `Player ${playerId} not found`);
      }

      // In poker, any cash-out typically means the player is leaving the game completely
      const willCashOutCompletely = true;

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
          // Safety check: Ensure session pot doesn't go negative (race condition protection)
          const newPotAmount = session.totalPot - amount;
          if (newPotAmount < 0) {
            throw new ServiceError(
              'SESSION_POT_WOULD_GO_NEGATIVE',
              `Internal error: Session pot would become negative ($${newPotAmount}). This indicates a validation bug or race condition.`
            );
          }

          await this.dbService.updateSession(sessionId, {
            totalPot: newPotAmount,
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
   * Check if a player is the last active player in the session
   * Used for last player cash-out constraint validation
   */
  public async isLastActivePlayer(sessionId: string, playerId: string): Promise<boolean> {
    try {
      const players = await this.dbService.getPlayers(sessionId);
      const activePlayers = players.filter(p => p.status === 'active');
      return activePlayers.length === 1 && activePlayers[0].id === playerId;
    } catch (error) {
      console.error('Failed to check if last active player:', error);
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError('PLAYER_STATUS_CHECK_FAILED', `Failed to check player status: ${error}`);
    }
  }

  /**
   * Get the required cash-out amount for the last active player
   * Returns null if not the last player, or the exact remaining pot amount
   */
  public async getRequiredCashOutAmount(sessionId: string, playerId: string): Promise<number | null> {
    try {
      const isLast = await this.isLastActivePlayer(sessionId, playerId);
      if (!isLast) return null;
      
      const session = await this.sessionService.getSession(sessionId);
      if (!session) {
        throw new ServiceError('SESSION_NOT_FOUND', `Session ${sessionId} not found`);
      }
      
      return session.totalPot;
    } catch (error) {
      console.error('Failed to get required cash-out amount:', error);
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError('REQUIRED_AMOUNT_CHECK_FAILED', `Failed to get required cash-out amount: ${error}`);
    }
  }

  /**
   * NEW PUBLIC API METHODS - Use ValidationResult pattern
   */

  /**
   * Validate and record buy-in transaction (NEW APPROACH)
   * Returns validation result first, then proceeds with transaction if valid
   */
  public async validateAndRecordBuyIn(
    sessionId: string,
    playerId: string,
    amount: number,
    method: 'voice' | 'manual' = 'manual',
    createdBy: string = 'user',
    description?: string
  ): Promise<{ validation: TransactionValidationResult; transaction?: Transaction }> {
    // First validate using new ValidationResult approach
    const validation = await this.validateBuyInRequest(sessionId, playerId, amount);
    
    if (!validation.isValid) {
      return { validation };
    }
    
    // If validation passes, proceed with transaction using existing method
    try {
      const transaction = await this.recordBuyIn(sessionId, playerId, amount, method, createdBy, description);
      return { validation, transaction };
    } catch (error) {
      // System errors should still throw
      throw error;
    }
  }

  /**
   * Validate and record cash-out transaction (NEW APPROACH)
   * Returns validation result first, then proceeds with transaction if valid
   */
  public async validateAndRecordCashOut(
    sessionId: string,
    playerId: string,
    amount: number,
    method: 'voice' | 'manual' = 'manual',
    createdBy: string = 'user',
    description?: string,
    organizerConfirmed: boolean = false
  ): Promise<{ validation: TransactionValidationResult; transaction?: Transaction }> {
    const deploymentVersion = 'ValidationResult-Fix-v2.0-15:10-BUILD';
    console.log(`🚀 DEPLOYMENT VERIFICATION: ${deploymentVersion}`);
    console.log('🎯 validateAndRecordCashOut called - NEW ValidationResult method');
    // First validate using new ValidationResult approach
    const validation = await this.validateCashOutRequest(sessionId, playerId, amount, organizerConfirmed);
    
    if (!validation.isValid) {
      return { validation };
    }
    
    // If validation passes, proceed with transaction recording (skip validation since we already did it)
    try {
      const transaction = await this.recordCashOutWithoutValidation(sessionId, playerId, amount, method, createdBy, description);
      return { validation, transaction };
    } catch (error) {
      // ValidationResult pattern: Convert system errors to validation failures
      console.error('System error during transaction recording:', error);
      const systemErrorValidation = ValidationHelper.failure(
        'SYSTEM_ERROR' as any,
        error instanceof Error ? error.message : 'A system error occurred during transaction recording',
        { title: '🚫 System Error' }
      );
      return { validation: systemErrorValidation };
    }
  }

  /**
   * Record cash-out transaction without validation (for use with ValidationResult pattern)
   * This method assumes validation has already been performed and only records the transaction
   */
  private async recordCashOutWithoutValidation(
    sessionId: string,
    playerId: string,
    amount: number,
    method: 'voice' | 'manual' = 'manual',
    createdBy: string = 'user',
    description?: string
  ): Promise<Transaction> {
    try {
      // Get player's current state (no validation, just data retrieval)
      const players = await this.dbService.getPlayers(sessionId);
      const player = players.find(p => p.id === playerId);
      
      if (!player) {
        throw new ServiceError('PLAYER_NOT_FOUND', `Player ${playerId} not found`);
      }

      // In poker, any cash-out typically means the player is leaving the game completely
      const willCashOutCompletely = true;

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
          const newPotAmount = session.totalPot - amount;
          await this.dbService.updateSession(sessionId, {
            totalPot: Math.max(0, newPotAmount) // Prevent negative pot
          });
        }

        return transaction;
      });

    } catch (error) {
      // Convert database errors to ServiceError for consistent error handling
      if (error instanceof ServiceError) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new ServiceError('DATABASE_QUERY_FAILED', `Failed to record cash-out: ${errorMessage}`);
    }
  }

  /**
   * Validate session mathematical integrity
   * Ensures all buy-ins, cash-outs, and remaining pot balance correctly
   */
  public async validateSessionMathematicalIntegrity(sessionId: string): Promise<{
    isValid: boolean;
    totalBuyIns: number;
    totalCashOuts: number;
    remainingPot: number;
    discrepancy: number;
    details: string;
  }> {
    try {
      // Get session data
      const session = await this.sessionService.getSession(sessionId);
      if (!session) {
        throw new ServiceError('SESSION_NOT_FOUND', `Session ${sessionId} not found`);
      }

      // Get all transactions
      const transactions = await this.getTransactionHistory(sessionId);
      
      // Calculate totals from transactions
      const buyInTransactions = transactions.filter(t => t.type === 'buy_in' && !t.isVoided);
      const cashOutTransactions = transactions.filter(t => t.type === 'cash_out' && !t.isVoided);
      
      const totalBuyIns = buyInTransactions.reduce((sum, t) => sum + t.amount, 0);
      const totalCashOuts = cashOutTransactions.reduce((sum, t) => sum + t.amount, 0);
      const calculatedRemainingPot = totalBuyIns - totalCashOuts;
      
      // Compare with session's tracked pot
      const actualRemainingPot = session.totalPot;
      const discrepancy = Math.abs(calculatedRemainingPot - actualRemainingPot);
      
      // Allow for small rounding errors (1 cent)
      const isValid = discrepancy < 0.01;
      
      const details = isValid 
        ? 'Session mathematical integrity verified'
        : `Discrepancy detected: calculated pot $${calculatedRemainingPot.toFixed(2)} vs tracked pot $${actualRemainingPot.toFixed(2)}`;

      return {
        isValid,
        totalBuyIns,
        totalCashOuts,
        remainingPot: actualRemainingPot,
        discrepancy,
        details
      };
    } catch (error) {
      console.error('Failed to validate session mathematical integrity:', error);
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError('INTEGRITY_CHECK_FAILED', `Failed to validate session integrity: ${error}`);
    }
  }

  /**
   * NEW VALIDATION METHODS - Return ValidationResult instead of throwing exceptions
   */

  /**
   * Validate buy-in request - Returns ValidationResult (NEW APPROACH)
   * AC: 5
   */
  public async validateBuyInRequest(
    sessionId: string, 
    playerId: string, 
    amount: number
  ): Promise<TransactionValidationResult> {
    try {
      // Amount validation
      if (!amount || amount <= 0) {
        return ValidationHelper.transactionValidation.invalidAmount(
          amount, 0.01, TRANSACTION_LIMITS.MAX_BUY_IN, 'buy_in'
        );
      }

      if (amount < TRANSACTION_LIMITS.MIN_BUY_IN) {
        return ValidationHelper.transactionValidation.invalidAmount(
          amount, TRANSACTION_LIMITS.MIN_BUY_IN, TRANSACTION_LIMITS.MAX_BUY_IN, 'buy_in'
        );
      }

      if (amount > TRANSACTION_LIMITS.MAX_BUY_IN) {
        return ValidationHelper.transactionValidation.invalidAmount(
          amount, TRANSACTION_LIMITS.MIN_BUY_IN, TRANSACTION_LIMITS.MAX_BUY_IN, 'buy_in'
        );
      }

      // Session validation
      const session = await this.sessionService.getSession(sessionId);
      if (!session || (session.status !== 'active' && session.status !== 'created')) {
        return ValidationHelper.failure(
          'INVALID_SESSION_STATE' as any,
          'Buy-ins are only allowed for created or active sessions',
          { title: '🎮 Session Not Available' }
        );
      }

      // Player validation
      const players = await this.dbService.getPlayers(sessionId);
      const player = players.find(p => p.id === playerId);
      
      if (!player) {
        return ValidationHelper.failure(
          'INVALID_PLAYER_STATE' as any,
          'Player not found in this session',
          { title: '👤 Player Not Found' }
        );
      }

      if (player.status !== 'active') {
        return ValidationHelper.failure(
          'INVALID_PLAYER_STATE' as any,
          'Buy-ins are only allowed for active players',
          { title: '⚠️ Player Not Active' }
        );
      }

      return ValidationHelper.transactionValidation.success({ sessionId, playerId, amount });
      
    } catch (error) {
      // System errors should still throw
      throw error;
    }
  }

  /**
   * Validate cash-out request - Returns ValidationResult (NEW APPROACH)
   * AC: 4, 5, 6
   */
  public async validateCashOutRequest(
    sessionId: string, 
    playerId: string, 
    amount: number,
    organizerConfirmed: boolean = false
  ): Promise<TransactionValidationResult> {
    try {
      // Amount validation
      if (!amount || amount <= 0) {
        return ValidationHelper.transactionValidation.invalidAmount(
          amount, 0.01, TRANSACTION_LIMITS.MAX_CASH_OUT, 'cash_out'
        );
      }

      if (amount < TRANSACTION_LIMITS.MIN_CASH_OUT) {
        return ValidationHelper.transactionValidation.invalidAmount(
          amount, TRANSACTION_LIMITS.MIN_CASH_OUT, TRANSACTION_LIMITS.MAX_CASH_OUT, 'cash_out'
        );
      }

      if (amount > TRANSACTION_LIMITS.MAX_CASH_OUT) {
        return ValidationHelper.transactionValidation.invalidAmount(
          amount, TRANSACTION_LIMITS.MIN_CASH_OUT, TRANSACTION_LIMITS.MAX_CASH_OUT, 'cash_out'
        );
      }

      // Session validation
      const session = await this.sessionService.getSession(sessionId);
      if (!session || (session.status !== 'active' && session.status !== 'created')) {
        return ValidationHelper.failure(
          'INVALID_SESSION_STATE' as any,
          'Cash-outs are only allowed for created or active sessions',
          { title: '🎮 Session Not Available' }
        );
      }

      // Player validation
      const players = await this.dbService.getPlayers(sessionId);
      const player = players.find(p => p.id === playerId);
      
      if (!player) {
        return ValidationHelper.failure(
          'INVALID_PLAYER_STATE' as any,
          'Player not found in this session',
          { title: '👤 Player Not Found' }
        );
      }

      if (player.status === 'cashed_out') {
        return ValidationHelper.transactionValidation.playerAlreadyCashedOut(player.name);
      }

      if (player.status !== 'active') {
        return ValidationHelper.failure(
          'INVALID_PLAYER_STATE' as any,
          'Cash-outs are only allowed for active players',
          { title: '⚠️ Player Not Active' }
        );
      }

      // CRITICAL VALIDATION: Check if amount exceeds pot for ALL players
      if (amount > session.totalPot) {
        return ValidationHelper.transactionValidation.insufficientPot(
          amount, session.totalPot, player.name
        );
      }
      
      // Last player constraint validation
      const activePlayers = players.filter(p => p.status === 'active');
      
      if (activePlayers.length === 1 && activePlayers[0].id === playerId) {
        // LAST PLAYER CONSTRAINT: Must cash out exactly the remaining pot
        const tolerance = 0.01; // Allow 1 cent tolerance for rounding
        if (Math.abs(amount - session.totalPot) > tolerance && amount < session.totalPot) {
          // Only show this error if amount is LESS than pot (greater than pot already handled above)
          return ValidationHelper.transactionValidation.lastPlayerExactAmount(
            amount, session.totalPot, player.name
          );
        }
      }

      // NOTE: Removed organizer confirmation requirement for normal cash-outs
      // In a real poker game, players can cash out any amount up to the pot limit
      // Organizer confirmation is not needed for basic cash-out transactions

      return ValidationHelper.transactionValidation.success({ 
        sessionId, 
        playerId, 
        amount,
        organizerConfirmed 
      });

    } catch (error) {
      // ValidationResult pattern: Convert system errors to validation failures
      console.error('System error during validation:', error);
      return ValidationHelper.failure(
        'SYSTEM_ERROR' as any,
        error instanceof Error ? error.message : 'A system error occurred during validation',
        { title: '🚫 System Error' }
      );
    }
  }

  /**
   * LEGACY VALIDATION METHODS - Keep for backward compatibility during migration
   * These will be removed in Phase 4
   */

  /**
   * Validate buy-in request (LEGACY - throws exceptions)
   * AC: 5
   */
  private async validateBuyInRequestLegacy(
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

    // Session validation - Allow buy-ins during creation (initial buy-ins) and active gameplay
    const session = await this.sessionService.getSession(sessionId);
    if (!session || (session.status !== 'active' && session.status !== 'created')) {
      throw new ServiceError('VALIDATION_ERROR', 'Buy-ins are only allowed for created or active sessions');
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
   * Validate cash-out request (LEGACY - throws exceptions)
   * AC: 4, 5, 6
   */
  private async validateCashOutRequestLegacy(
    sessionId: string, 
    playerId: string, 
    amount: number,
    organizerConfirmed: boolean = false
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

    // Session validation - Allow cash-outs during creation and active gameplay
    const session = await this.sessionService.getSession(sessionId);
    if (!session || (session.status !== 'active' && session.status !== 'created')) {
      throw new ServiceError('VALIDATION_ERROR', 'Cash-outs are only allowed for created or active sessions');
    }

    // Player validation - get players early for last player check
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

    // First check if amount exceeds pot for ALL players (including last player)
    if (amount > session.totalPot) {
      throw new ServiceError(
        ErrorCode.INSUFFICIENT_SESSION_POT, 
        `Cannot cash out $${amount.toFixed(2)}. Only $${session.totalPot.toFixed(2)} remaining in pot.`
      );
    }
    
    // Then check if this is the last active player - special validation rules apply
    const activePlayers = players.filter(p => p.status === 'active');
    
    if (activePlayers.length === 1 && activePlayers[0].id === playerId) {
      // LAST PLAYER CONSTRAINT: Must cash out exactly the remaining pot
      const tolerance = 0.01; // Allow 1 cent tolerance for rounding
      if (Math.abs(amount - session.totalPot) > tolerance && amount < session.totalPot) {
        // Only show this error if amount is LESS than pot (greater than pot already handled above)
        throw new ServiceError(
          ErrorCode.LAST_PLAYER_EXACT_AMOUNT_REQUIRED,
          `As the last player, you must cash out exactly $${session.totalPot.toFixed(2)} (the remaining pot). You entered $${amount.toFixed(2)}.`
        );
      }
    }

    // Note: Enhanced validation with last player constraint implemented.
    // Organizer is trusted to verify actual chip amounts during gameplay.
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