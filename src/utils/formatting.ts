/**
 * Message Formatting Utilities - Story 4.1: WhatsApp URL Scheme Integration
 * Provides formatting utilities for WhatsApp messages and settlement data
 */

import { OptimizedSettlement } from '../types/settlement';

/**
 * Format currency amount with proper precision
 */
export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/**
 * Format duration from minutes to human readable format
 */
export function formatDuration(minutes: number): string {
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

/**
 * Format settlement summary for mobile readability
 * Story 4.1: Implements AC: 3
 */
export function formatSettlementSummary(
  settlement: OptimizedSettlement,
  sessionName: string,
  includeEmojis: boolean = true
): string {
  const emojiPrefix = includeEmojis ? '🎯 ' : '';
  const potEmoji = includeEmojis ? '💰 ' : '';
  const playersEmoji = includeEmojis ? '👥 ' : '';
  const settlementsEmoji = includeEmojis ? '💸 ' : '';
  const evenEmoji = includeEmojis ? '🤝 ' : '';
  
  // Calculate total pot
  const totalPot = settlement.playerSettlements.reduce((sum, p) => sum + p.totalBuyIns, 0);

  let message = `${emojiPrefix}${sessionName} - Results\n`;
  message += `${potEmoji}Total Pot: ${formatCurrency(totalPot)}\n\n`;

  // Player summaries
  message += `${playersEmoji}Player Summary:\n`;
  settlement.playerSettlements.forEach(player => {
    const netSign = player.netAmount >= 0 ? '+' : '';
    const cashOuts = player.totalBuyIns + player.netAmount; // Calculate cash outs from buy-ins and net
    message += `• ${player.playerName}: ${formatCurrency(player.totalBuyIns)} in → `;
    message += `${formatCurrency(cashOuts)} out = ${netSign}${formatCurrency(player.netAmount)}\n`;
  });

  message += '\n';

  // Settlement calculations
  if (settlement.paymentPlan.length > 0) {
    message += `${settlementsEmoji}Settlements:\n`;
    settlement.paymentPlan.forEach(payment => {
      message += `• ${payment.fromPlayerName} → ${payment.toPlayerName}: ${formatCurrency(payment.amount)}\n`;
    });
  } else {
    message += `${evenEmoji}Perfect! Everyone broke even!\n`;
  }

  return message;
}

/**
 * Sanitize text for WhatsApp URL encoding
 */
export function sanitizeForWhatsApp(text: string): string {
  return text
    .replace(/[^\w\s\-_.~!*'();:@&=+$,/?%#[\]]/g, '') // Remove special chars that could break URL
    .trim();
}

/**
 * Truncate message to fit WhatsApp limits
 */
export function truncateMessage(message: string, maxLength: number = 65536): string {
  if (message.length <= maxLength) {
    return message;
  }
  
  const truncated = message.substring(0, maxLength - 50);
  const lastNewline = truncated.lastIndexOf('\n');
  
  if (lastNewline > maxLength * 0.8) {
    return truncated.substring(0, lastNewline) + '\n\n... [Message truncated]';
  }
  
  return truncated + '... [Message truncated]';
}