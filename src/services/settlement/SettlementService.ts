/**
 * Settlement Service - Epic 3: Settlement Optimization (Scope Rollback Version)
 * Story 3.1: Early Cash-out Calculator Implementation
 * Story 3.2: Settlement Optimization Algorithm
 * Story 3.3: Basic Settlement Validation (Simplified)
 * 
 * SIMPLIFIED VERSION: Core settlement calculations only, scope creep eliminated.
 * Follows existing service architecture patterns with singleton design.
 */

import { ServiceError } from '../core/ServiceError';
import { DatabaseService } from '../infrastructure/DatabaseService';
import { TransactionService } from '../core/TransactionService';
// Note: CalculationUtils removed during scope rollback - not needed for basic calculations
import {
  EarlyCashOutRequest,
  EarlyCashOutResult,
  OptimizedSettlement,
  PaymentPlan,
  SettlementValidation,
  PlayerSettlement,
  BankBalance,
  SettlementError,
  SettlementErrorCode
} from '../../types/settlement';

export class SettlementService {
  private static instance: SettlementService;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): SettlementService {
    if (!SettlementService.instance) {
      SettlementService.instance = new SettlementService();
    }
    return SettlementService.instance;
  }

  /**
   * Initialize the Settlement Service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Basic initialization only
      this.isInitialized = true;
    } catch (error) {
      throw new ServiceError(
        'Failed to initialize Settlement Service',
        'SETTLEMENT_INIT_FAILED',
        { originalError: error }
      );
    }
  }

  /**
   * Story 3.1: Calculate early cash-out for a player
   * Basic version - chips vs buy-ins calculation only
   */
  public async calculateEarlyCashOut(request: EarlyCashOutRequest): Promise<EarlyCashOutResult> {
    try {
      const { sessionId, playerId } = request;

      // Get player's current chips and total buy-ins
      const transactionService = TransactionService.getInstance();

      // Get player buy-ins total
      const allTransactions = await transactionService.getTransactionHistory(sessionId);
      const playerTransactions = allTransactions.filter(t => t.playerId === playerId && !t.isVoided);
      const buyIns = playerTransactions.filter(t => t.type === 'buy_in');
      const totalBuyIns = buyIns.reduce((sum, t) => sum + t.amount, 0);

      // Get player's current chip count (from last transaction or session state)
      const playerData = await this.getPlayerData(sessionId, playerId);
      const currentChips = playerData.currentBalance || 0;

      // Calculate net position: chips - buy-ins
      const netPosition = currentChips - totalBuyIns;
      
      // Calculate settlement amount (what player owes or is owed)
      const settlementAmount = netPosition >= 0 ? netPosition : Math.abs(netPosition);
      const owesOrOwed = netPosition >= 0 ? 'owed' : 'owes';

      // Get remaining bank balance to ensure sufficient funds
      const bankBalance = await this.calculateBankBalance(sessionId);
      const canPayout = owesOrOwed === 'owed' ? settlementAmount <= bankBalance.availableForCashOut : true;

      const result: EarlyCashOutResult = {
        playerId,
        playerName: playerData.name,
        currentChips,
        totalBuyIns,
        netPosition,
        settlementAmount,
        owesOrOwed,
        canPayout,
        bankBalance: bankBalance.availableForCashOut,
        calculatedAt: new Date().toISOString()
      };

      return result;

    } catch (error) {
      throw new ServiceError(
        'Failed to calculate early cash-out',
        'EARLY_CASHOUT_FAILED',
        { request, originalError: error }
      );
    }
  }

  /**
   * Story 3.2: Calculate optimized settlement to minimize transactions
   * Basic version - simple optimization algorithm only
   */
  public async optimizeSettlement(sessionId: string): Promise<OptimizedSettlement> {
    try {
      // Get all player settlements (net positions)
      const playerSettlements = await this.calculatePlayerSettlements(sessionId);
      
      // Apply basic optimization algorithm to minimize transactions
      const optimizedPlan = await this.optimizeTransactions(playerSettlements);
      
      // Calculate metrics
      const directTransactionCount = playerSettlements.filter(p => p.netAmount !== 0).length;
      const optimizedTransactionCount = optimizedPlan.length;
      const transactionReduction = Math.max(0, directTransactionCount - optimizedTransactionCount);
      const reductionPercentage = directTransactionCount > 0 ? 
        Math.round((transactionReduction / directTransactionCount) * 100) : 0;

      const result: OptimizedSettlement = {
        sessionId,
        playerSettlements,
        paymentPlan: optimizedPlan,
        totalAmount: playerSettlements.reduce((sum, p) => sum + Math.abs(p.netAmount), 0) / 2, // Divide by 2 to avoid double counting
        transactionCount: optimizedTransactionCount,
        directTransactionCount,
        transactionReduction,
        reductionPercentage,
        isBalanced: this.verifyBalance(playerSettlements),
        calculatedAt: new Date().toISOString()
      };

      return result;

    } catch (error) {
      throw new ServiceError(
        'Failed to optimize settlement',
        'OPTIMIZATION_FAILED',
        { sessionId, originalError: error }
      );
    }
  }

  /**
   * Story 3.3: Basic settlement validation (simplified version)
   * Only validates mathematical balance - complex validation removed
   */
  public async validateSettlement(settlement: OptimizedSettlement): Promise<SettlementValidation> {
    try {
      const errors: SettlementError[] = [];
      const warnings: string[] = [];

      // Basic validation 1: Total debits = total credits
      const totalDebits = settlement.paymentPlan
        .reduce((sum, payment) => sum + payment.amount, 0);
      
      const totalCredits = settlement.playerSettlements
        .filter(p => p.netAmount < 0)
        .reduce((sum, p) => sum + Math.abs(p.netAmount), 0);

      if (Math.abs(totalDebits - totalCredits) > 0.01) {
        errors.push({
          code: 'BALANCE_MISMATCH' as SettlementErrorCode,
          message: `Total debits (${totalDebits}) do not equal total credits (${totalCredits})`,
          severity: 'critical'
        });
      }

      // Basic validation 2: Each player's settlement matches their net position
      for (const player of settlement.playerSettlements) {
        const relatedPayments = settlement.paymentPlan.filter(
          p => p.fromPlayerId === player.playerId || p.toPlayerId === player.playerId
        );
        
        let playerNetFromPayments = 0;
        for (const payment of relatedPayments) {
          if (payment.fromPlayerId === player.playerId) {
            playerNetFromPayments -= payment.amount;
          } else if (payment.toPlayerId === player.playerId) {
            playerNetFromPayments += payment.amount;
          }
        }

        if (Math.abs(playerNetFromPayments - player.netAmount) > 0.01) {
          errors.push({
            code: 'PLAYER_POSITION_MISMATCH' as SettlementErrorCode,
            message: `Player ${player.playerName} settlement mismatch: expected ${player.netAmount}, calculated ${playerNetFromPayments}`,
            severity: 'critical'
          });
        }
      }

      // Create simple audit trail (text list only)
      const auditTrail = [
        `Settlement validation started at ${new Date().toISOString()}`,
        `Total debits: $${totalDebits.toFixed(2)}`,
        `Total credits: $${totalCredits.toFixed(2)}`,
        `Balance check: ${errors.length === 0 ? 'PASSED' : 'FAILED'}`,
        `Player position checks: ${errors.filter(e => e.code === 'PLAYER_POSITION_MISMATCH').length === 0 ? 'PASSED' : 'FAILED'}`,
        `Validation completed with ${errors.length} errors and ${warnings.length} warnings`
      ];

      const result: SettlementValidation = {
        isValid: errors.length === 0,
        errors,
        warnings,
        auditTrail,
        validatedAt: new Date().toISOString()
      };

      return result;

    } catch (error) {
      throw new ServiceError(
        'Failed to validate settlement',
        'VALIDATION_FAILED',
        { settlement: settlement.sessionId, originalError: error }
      );
    }
  }

  /**
   * Calculate bank balance for session
   */
  public async calculateBankBalance(sessionId: string): Promise<BankBalance> {
    try {
      const transactionService = TransactionService.getInstance();
      const transactions = await transactionService.getTransactionHistory(sessionId);
      const validTransactions = transactions.filter(t => !t.isVoided);

      const totalBuyIns = validTransactions
        .filter(t => t.type === 'buy_in')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalCashOuts = validTransactions
        .filter(t => t.type === 'cash_out')
        .reduce((sum, t) => sum + t.amount, 0);

      const availableForCashOut = totalBuyIns - totalCashOuts;
      const isBalanced = availableForCashOut >= 0;

      return {
        totalBuyIns,
        totalCashOuts,
        availableForCashOut,
        isBalanced,
        calculatedAt: new Date().toISOString()
      };

    } catch (error) {
      throw new ServiceError(
        'Failed to calculate bank balance',
        'BANK_BALANCE_FAILED',
        { sessionId, originalError: error }
      );
    }
  }

  // Private helper methods

  private async getPlayerData(sessionId: string, playerId: string): Promise<any> {
    const dbService = DatabaseService.getInstance();
    const result = await dbService.executeQuery(
      'SELECT name, currentBalance FROM players WHERE sessionId = ? AND playerId = ?',
      [sessionId, playerId]
    );
    return result.rows.length > 0 ? result.rows.item(0) : { name: 'Unknown Player', currentBalance: 0 };
  }

  private async calculatePlayerSettlements(sessionId: string): Promise<PlayerSettlement[]> {
    try {
      const transactionService = TransactionService.getInstance();
      const dbService = DatabaseService.getInstance();
      
      // Get all players for this session
      const playersResult = await dbService.executeQuery(
        'SELECT playerId, name, currentBalance FROM players WHERE sessionId = ?',
        [sessionId]
      );

      const settlements: PlayerSettlement[] = [];

      const allTransactions = await transactionService.getTransactionHistory(sessionId);
      
      for (let i = 0; i < playersResult.rows.length; i++) {
        const player = playersResult.rows.item(i);
        const playerTransactions = allTransactions.filter(t => t.playerId === player.playerId && !t.isVoided);
        
        const totalBuyIns = playerTransactions
          .filter(t => t.type === 'buy_in')
          .reduce((sum, t) => sum + t.amount, 0);

        const currentChips = player.currentBalance || 0;
        const netAmount = currentChips - totalBuyIns;

        settlements.push({
          playerId: player.playerId,
          playerName: player.name,
          currentChips,
          totalBuyIns,
          netAmount,
          owesOrOwed: netAmount >= 0 ? 'owed' : 'owes'
        });
      }

      return settlements;

    } catch (error) {
      throw new ServiceError(
        'Failed to calculate player settlements',
        'PLAYER_SETTLEMENTS_FAILED',
        { sessionId, originalError: error }
      );
    }
  }

  private async optimizeTransactions(playerSettlements: PlayerSettlement[]): Promise<PaymentPlan[]> {
    // Simple greedy algorithm to minimize transactions
    const paymentPlan: PaymentPlan[] = [];
    
    // Create arrays of debtors and creditors
    const debtors = playerSettlements.filter(p => p.netAmount < 0).map(p => ({
      playerId: p.playerId,
      playerName: p.playerName,
      amount: Math.abs(p.netAmount)
    }));
    
    const creditors = playerSettlements.filter(p => p.netAmount > 0).map(p => ({
      playerId: p.playerId,  
      playerName: p.playerName,
      amount: p.netAmount
    }));

    // Match largest debtor with largest creditor iteratively
    while (debtors.length > 0 && creditors.length > 0) {
      const debtor = debtors[0];
      const creditor = creditors[0];

      const paymentAmount = Math.min(debtor.amount, creditor.amount);

      paymentPlan.push({
        fromPlayerId: debtor.playerId,
        fromPlayerName: debtor.playerName,
        toPlayerId: creditor.playerId,
        toPlayerName: creditor.playerName,
        amount: paymentAmount
      });

      // Update amounts
      debtor.amount -= paymentAmount;
      creditor.amount -= paymentAmount;

      // Remove if fully settled
      if (debtor.amount <= 0.01) debtors.shift();
      if (creditor.amount <= 0.01) creditors.shift();
    }

    return paymentPlan;
  }

  /**
   * Story 4.1: Format settlement for WhatsApp sharing
   * Implements AC: 3 - Include player names, buy-ins, cash-outs, and settlements
   */
  public async formatSettlementForWhatsApp(settlement: OptimizedSettlement): Promise<string> {
    try {
      const sessionId = settlement.sessionId;
      const dbService = DatabaseService.getInstance();
      
      // Get session details
      const sessionResult = await dbService.executeQuery(
        'SELECT name FROM sessions WHERE id = ?',
        [sessionId]
      );
      const sessionName = sessionResult.rows.length > 0 
        ? sessionResult.rows.item(0).name 
        : 'Poker Session';

      // Calculate total pot
      const totalPot = settlement.playerSettlements.reduce((sum, p) => sum + p.totalBuyIns, 0);

      let message = `🎯 ${sessionName} - Results\n`;
      message += `💰 Total Pot: $${totalPot.toFixed(2)}\n\n`;

      // Player summaries with emoji formatting
      message += '👥 Player Summary:\n';
      settlement.playerSettlements.forEach(player => {
        const netSign = player.netAmount >= 0 ? '+' : '';
        const cashOuts = player.totalBuyIns + player.netAmount; // Calculate cash outs from buy-ins and net
        message += `• ${player.playerName}: $${player.totalBuyIns} in → `;
        message += `$${cashOuts.toFixed(0)} out = ${netSign}$${player.netAmount.toFixed(0)}\n`;
      });

      message += '\n';

      // Settlement calculations
      if (settlement.paymentPlan.length > 0) {
        message += '💸 Settlements:\n';
        settlement.paymentPlan.forEach(payment => {
          message += `• ${payment.fromPlayerName} → ${payment.toPlayerName}: $${payment.amount.toFixed(2)}\n`;
        });
      } else {
        message += '🤝 Perfect! Everyone broke even!\n';
      }

      message += '\n📱 Shared via PokePot';
      
      return message;
    } catch (error) {
      throw new ServiceError(
        'WHATSAPP_FORMAT_FAILED',
        'Failed to format settlement for WhatsApp',
        { settlementId: settlement.sessionId, error }
      );
    }
  }

  private verifyBalance(playerSettlements: PlayerSettlement[]): boolean {
    const totalNet = playerSettlements.reduce((sum, p) => sum + p.netAmount, 0);
    return Math.abs(totalNet) < 0.01; // Allow for minor floating point precision
  }
}

export const settlementService = SettlementService.getInstance();