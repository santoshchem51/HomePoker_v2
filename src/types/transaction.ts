/**
 * Transaction-related TypeScript type definitions for PokePot
 * Matches database schema and business logic requirements for Story 1.3
 */

export interface Transaction {
  id: string;
  sessionId: string;
  playerId: string;
  type: 'buy_in' | 'cash_out' | 'chip_adjustment';
  amount: number;
  timestamp: Date;
  method: 'voice' | 'manual';
  isVoided: boolean;
  description?: string;
  createdBy: string;
  voidedAt?: Date;
  voidReason?: string;
}

export interface CreateTransactionRequest {
  sessionId: string;
  playerId: string;
  type: 'buy_in' | 'cash_out';
  amount: number;
  method: 'voice' | 'manual';
  description?: string;
  createdBy: string;
}

export interface TransactionSummary {
  id: string;
  playerId: string;
  playerName: string;
  type: 'buy_in' | 'cash_out';
  amount: number;
  timestamp: Date;
  method: 'voice' | 'manual';
  isVoided: boolean;
}

export interface PlayerBalance {
  playerId: string;
  playerName: string;
  currentBalance: number;
  totalBuyIns: number;
  totalCashOuts: number;
  netPosition: number; // currentBalance - totalBuyIns
}

export interface TransactionValidationError {
  field: 'amount' | 'player' | 'session';
  message: string;
  code: string;
}

export type TransactionMethod = 'voice' | 'manual';
export type TransactionType = 'buy_in' | 'cash_out';

// Constants for validation
export const TRANSACTION_LIMITS = {
  MIN_BUY_IN: 5.00,
  MAX_BUY_IN: 500.00,
  MIN_CASH_OUT: 0.01,
  MAX_CASH_OUT: 1000.00,
  UNDO_WINDOW_SECONDS: 30,
} as const;