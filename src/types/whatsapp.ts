/**
 * WhatsApp integration type definitions for PokePot
 * Defines message formats, sharing results, and integration interfaces
 */

export type MessageFormat = 'summary' | 'detailed';

export interface ShareResult {
  success: boolean;
  method: 'whatsapp' | 'clipboard' | 'other';
  error?: string;
}

export interface WhatsAppMessage {
  content: string;
  format: MessageFormat;
  sessionId: string;
  characterCount: number;
  timestamp: Date;
}

export interface SettlementSummary {
  sessionName: string;
  totalPot: number;
  duration: number; // in minutes
  playerSummaries: PlayerSettlement[];
  settlements: Settlement[];
}

export interface PlayerSettlement {
  playerId: string;
  playerName: string;
  totalBuyIns: number;
  totalCashOuts: number;
  netPosition: number; // positive = won money, negative = lost money
}

export interface Settlement {
  fromPlayerId: string;
  fromPlayerName: string;
  toPlayerId: string;
  toPlayerName: string;
  amount: number;
}

export interface MessageQueueItem {
  id: string;
  message: string;
  retryCount: number;
  createdAt: Date;
  lastAttempt?: Date;
}

// WhatsApp URL scheme constants
export const WHATSAPP_URL_SCHEME = 'whatsapp://send?text=';
export const WHATSAPP_MESSAGE_LIMIT = 65536; // WhatsApp message character limit
export const MAX_RETRY_ATTEMPTS = 3;
export const RETRY_DELAY_MS = 5000; // 5 seconds