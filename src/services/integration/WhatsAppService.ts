/**
 * WhatsAppService - Integration service for sharing session results via WhatsApp
 * Implements Story 1.6 requirements for message formatting and sharing
 */
import { Linking } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { DatabaseService } from '../infrastructure/DatabaseService';
import { ServiceError } from '../core/ServiceError';
import {
  MessageFormat,
  ShareResult,
  WhatsAppMessage,
  SettlementSummary,
  PlayerSettlement,
  Settlement,
  WHATSAPP_URL_SCHEME,
  WHATSAPP_MESSAGE_LIMIT
} from '../../types/whatsapp';
import { Session } from '../../types/session';
import { Player } from '../../types/player';
import { Transaction } from '../../types/transaction';
import { CalculationUtils } from '../../utils/calculations';

export class WhatsAppService {
  private static instance: WhatsAppService | null = null;
  private dbService: DatabaseService;

  private constructor() {
    this.dbService = DatabaseService.getInstance();
  }

  /**
   * Get singleton instance of WhatsAppService
   */
  public static getInstance(): WhatsAppService {
    if (!WhatsAppService.instance) {
      WhatsAppService.instance = new WhatsAppService();
    }
    return WhatsAppService.instance;
  }

  /**
   * Generate formatted WhatsApp message for session results
   * AC: 1, 2, 7
   */
  public async generateSessionMessage(
    sessionId: string,
    format: MessageFormat = 'summary'
  ): Promise<WhatsAppMessage> {
    try {
      const settlementData = await this.generateSettlementData(sessionId);
      
      const content = format === 'summary' 
        ? this.formatSummaryMessage(settlementData)
        : this.formatDetailedMessage(settlementData);

      const message: WhatsAppMessage = {
        content,
        format,
        sessionId,
        characterCount: content.length,
        timestamp: new Date()
      };

      // Validate message length
      if (message.characterCount > WHATSAPP_MESSAGE_LIMIT) {
        throw new ServiceError(
          'WHATSAPP_MESSAGE_TOO_LONG',
          `Message exceeds WhatsApp limit of ${WHATSAPP_MESSAGE_LIMIT} characters`,
          { characterCount: message.characterCount, limit: WHATSAPP_MESSAGE_LIMIT }
        );
      }

      return message;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError(
        'WHATSAPP_MESSAGE_GENERATION_FAILED',
        'Failed to generate WhatsApp message',
        { sessionId, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * Share message string to WhatsApp using URL scheme
   * Story 4.1: Implements AC: 2, 4, 5, 8
   */
  public async shareToWhatsApp(message: string): Promise<ShareResult> {
    try {
      // Validate message length
      if (!this.validateMessage(message)) {
        throw new ServiceError(
          'WHATSAPP_MESSAGE_INVALID',
          'Message exceeds WhatsApp character limit',
          { messageLength: message.length, limit: WHATSAPP_MESSAGE_LIMIT }
        );
      }

      // Check if WhatsApp is available
      const isWhatsAppAvailable = await this.isWhatsAppAvailable();
      
      if (!isWhatsAppAvailable) {
        // Fallback to clipboard
        return await this.fallbackToClipboard(message);
      }

      // Encode message for URL scheme
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `${WHATSAPP_URL_SCHEME}${encodedMessage}`;

      // Open WhatsApp with the message
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (!canOpen) {
        return await this.fallbackToClipboard(message);
      }

      await Linking.openURL(whatsappUrl);

      return {
        success: true,
        method: 'whatsapp'
      };
    } catch (error) {
      console.error('WhatsApp sharing failed:', error);
      // Fallback to clipboard on any error
      return await this.fallbackToClipboard(
        message,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Share WhatsApp message object (legacy method)
   * AC: 3, 6
   */
  public async shareWhatsAppMessage(message: WhatsAppMessage): Promise<ShareResult> {
    try {
      // Check if WhatsApp is available
      const isWhatsAppAvailable = await this.isWhatsAppAvailable();
      
      if (!isWhatsAppAvailable) {
        // Fallback to clipboard
        return await this.fallbackToClipboard(message.content);
      }

      // Encode message for URL scheme
      const encodedMessage = encodeURIComponent(message.content);
      const whatsappUrl = `${WHATSAPP_URL_SCHEME}${encodedMessage}`;

      // Open WhatsApp with the message
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (!canOpen) {
        return await this.fallbackToClipboard(message.content);
      }

      await Linking.openURL(whatsappUrl);

      return {
        success: true,
        method: 'whatsapp'
      };
    } catch (error) {
      // Fallback to clipboard on any error
      return await this.fallbackToClipboard(
        message.content,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Validate WhatsApp message
   * Story 4.1: Implements AC: 8
   */
  private validateMessage(message: string): boolean {
    if (!message || typeof message !== 'string') {
      return false;
    }
    
    return message.length <= WHATSAPP_MESSAGE_LIMIT;
  }

  /**
   * Check if WhatsApp is available on the device
   */
  private async isWhatsAppAvailable(): Promise<boolean> {
    try {
      const testUrl = 'whatsapp://send?text=test';
      return await Linking.canOpenURL(testUrl);
    } catch {
      return false;
    }
  }

  /**
   * Fallback to clipboard copy when WhatsApp unavailable
   */
  private async fallbackToClipboard(content: string, error?: string): Promise<ShareResult> {
    try {
      Clipboard.setString(content);
      return {
        success: true,
        method: 'clipboard',
        error
      };
    } catch (clipboardError) {
      return {
        success: false,
        method: 'clipboard',
        error: `Clipboard failed: ${clipboardError instanceof Error ? clipboardError.message : String(clipboardError)}`
      };
    }
  }

  /**
   * Generate settlement data from database
   */
  private async generateSettlementData(sessionId: string): Promise<SettlementSummary> {
    // Get session data
    const sessionResult = await this.dbService.executeQuery(
      'SELECT * FROM sessions WHERE id = ?',
      [sessionId]
    );
    
    if (sessionResult.rows.length === 0) {
      throw new ServiceError('SESSION_NOT_FOUND', 'Session not found', { sessionId });
    }
    
    const session = sessionResult.rows.item(0) as Session;

    // Get players
    const playersResult = await this.dbService.executeQuery(
      'SELECT * FROM players WHERE session_id = ?',
      [sessionId]
    );

    const players: Player[] = [];
    for (let i = 0; i < playersResult.rows.length; i++) {
      players.push(playersResult.rows.item(i) as Player);
    }

    // Get transactions
    const transactionsResult = await this.dbService.executeQuery(
      `SELECT * FROM transactions 
       WHERE session_id = ? AND is_voided = FALSE 
       ORDER BY timestamp ASC`,
      [sessionId]
    );

    const transactions: Transaction[] = [];
    for (let i = 0; i < transactionsResult.rows.length; i++) {
      transactions.push(transactionsResult.rows.item(i) as Transaction);
    }

    // Calculate player settlements
    const playerSummaries = players.map(player => this.calculatePlayerSettlement(player, transactions));
    
    // Calculate settlements (who owes whom)
    const settlements = this.calculateSettlements(playerSummaries);

    // Calculate session duration
    const duration = this.calculateSessionDuration(session);

    return {
      sessionName: session.name,
      totalPot: session.totalPot,
      duration,
      playerSummaries,
      settlements
    };
  }

  /**
   * Calculate individual player settlement
   */
  private calculatePlayerSettlement(player: Player, transactions: Transaction[]): PlayerSettlement {
    const playerTransactions = transactions.filter(t => t.playerId === player.id);
    
    const totalBuyIns = playerTransactions
      .filter(t => t.type === 'buy_in')
      .reduce((sum, t) => CalculationUtils.addAmounts(sum, t.amount), 0);
      
    const totalCashOuts = playerTransactions
      .filter(t => t.type === 'cash_out')
      .reduce((sum, t) => CalculationUtils.addAmounts(sum, t.amount), 0);

    const netPosition = CalculationUtils.subtractAmounts(totalCashOuts, totalBuyIns);

    return {
      playerId: player.id,
      playerName: player.name,
      totalBuyIns,
      totalCashOuts,
      netPosition
    };
  }

  /**
   * Calculate who owes whom (settlement optimization)
   */
  private calculateSettlements(playerSummaries: PlayerSettlement[]): Settlement[] {
    const settlements: Settlement[] = [];
    // Create copies to avoid mutating original data
    const creditors = playerSummaries
      .filter(p => p.netPosition > 0)
      .map(p => ({ ...p }))
      .sort((a, b) => b.netPosition - a.netPosition);
    const debtors = playerSummaries
      .filter(p => p.netPosition < 0)
      .map(p => ({ ...p }))
      .sort((a, b) => a.netPosition - b.netPosition);

    let creditorIndex = 0;
    let debtorIndex = 0;

    while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
      const creditor = creditors[creditorIndex];
      const debtor = debtors[debtorIndex];
      
      const settlementAmount = Math.min(creditor.netPosition, Math.abs(debtor.netPosition));
      
      if (settlementAmount > 0) {
        settlements.push({
          fromPlayerId: debtor.playerId,
          fromPlayerName: debtor.playerName,
          toPlayerId: creditor.playerId,
          toPlayerName: creditor.playerName,
          amount: settlementAmount
        });

        creditor.netPosition = CalculationUtils.subtractAmounts(creditor.netPosition, settlementAmount);
        debtor.netPosition = CalculationUtils.addAmounts(debtor.netPosition, settlementAmount);
      }

      if (creditor.netPosition === 0) creditorIndex++;
      if (debtor.netPosition === 0) debtorIndex++;
    }

    return settlements;
  }

  /**
   * Calculate session duration in minutes
   */
  private calculateSessionDuration(session: Session): number {
    if (!session.startedAt || !session.completedAt) {
      // Use createdAt to current time if session not completed
      const endTime = session.completedAt || new Date();
      const startTime = session.startedAt || session.createdAt;
      return Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60));
    }
    
    return Math.floor((session.completedAt.getTime() - session.startedAt.getTime()) / (1000 * 60));
  }

  /**
   * Format summary message (compact format) - Enhanced for Story 4.2
   * AC: 1, 2, 3, 4, 5, 6 - Mobile-optimized with emoji formatting
   */
  private formatSummaryMessage(data: SettlementSummary): string {
    const durationFormatted = this.formatDuration(data.duration);
    
    // Header with session info (AC: 3, 4)
    let message = `🎯 **POKER NIGHT RESULTS**\n`;
    message += `🏠 ${data.sessionName}\n`;
    message += `💰 Total Pot: $${CalculationUtils.formatCurrency(data.totalPot)}\n`;
    message += `⏱️ Duration: ${durationFormatted}\n`;
    message += `👥 Players: ${data.playerSummaries.length}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (data.settlements.length > 0) {
      // Settlement instructions (AC: 2, 4)
      message += '💸 **WHO PAYS WHOM:**\n';
      data.settlements.forEach(settlement => {
        const amount = CalculationUtils.formatCurrency(settlement.amount);
        message += `💵 ${settlement.fromPlayerName} → ${settlement.toPlayerName}\n`;
        message += `    Amount: $${amount}\n\n`;
      });
      
      // Final positions summary (AC: 2, 5)
      message += '📊 **FINAL POSITIONS:**\n';
      const sortedPlayers = data.playerSummaries
        .sort((a, b) => b.netPosition - a.netPosition);
        
      sortedPlayers.forEach(player => {
        const winnerIcon = player.netPosition > 0 ? '🟢' : player.netPosition < 0 ? '🔴' : '⚪';
        const sign = player.netPosition >= 0 ? '+' : '';
        message += `${winnerIcon} ${player.playerName}: ${sign}$${CalculationUtils.formatCurrency(Math.abs(player.netPosition))}\n`;
      });
    } else {
      message += '🤝 **PERFECT BALANCE!**\n';
      message += 'No settlements needed - everyone broke even!\n';
    }

    message += '\n━━━━━━━━━━━━━━━━━━━━\n';
    message += '🔗 Shared via PokePot App';
    
    return message;
  }

  /**
   * Format detailed message (full breakdown)
   * AC: 2, 7
   */
  private formatDetailedMessage(data: SettlementSummary): string {
    const durationFormatted = this.formatDuration(data.duration);
    
    let message = `🎯 Poker Night Results - ${data.sessionName}\n`;
    message += `💰 Total Pot: $${data.totalPot.toFixed(2)} | ⏱️ Duration: ${durationFormatted}\n\n`;

    // Player summaries
    message += '👥 Player Summary:\n';
    data.playerSummaries.forEach(player => {
      const sign = player.netPosition >= 0 ? '+' : '';
      message += `• ${player.playerName}: $${player.totalBuyIns.toFixed(0)} in → `;
      message += `$${player.totalCashOuts.toFixed(0)} out = ${sign}$${player.netPosition.toFixed(0)}\n`;
    });

    message += '\n';

    if (data.settlements.length > 0) {
      message += '💸 Settlement Optimization:\n';
      data.settlements.forEach(settlement => {
        message += `• ${settlement.fromPlayerName} pays ${settlement.toPlayerName}: $${settlement.amount.toFixed(2)}\n`;
      });
    } else {
      message += '🤝 No settlements needed - everyone broke even!\n';
    }

    message += '\n🔗 Shared via PokePot';
    
    return message;
  }

  /**
   * Format duration in human-readable format
   */
  private formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `${mins}m`;
    } else if (mins === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${mins}m`;
    }
  }
}