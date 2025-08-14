/**
 * Settlement Types - Epic 3: Settlement Optimization (Scope Rollback Version)
 * Story 3.1: Early Cash-out Calculator Implementation
 * Story 3.2: Settlement Optimization Algorithm  
 * Story 3.3: Basic Settlement Validation (Simplified)
 * 
 * SIMPLIFIED VERSION: Core settlement types only, scope creep eliminated.
 */

// Story 3.1: Early Cash-out Types
export interface EarlyCashOutRequest {
  sessionId: string;
  playerId: string;
}

export interface EarlyCashOutResult {
  playerId: string;
  playerName: string;
  currentChips: number;
  totalBuyIns: number;
  netPosition: number;
  settlementAmount: number;
  owesOrOwed: 'owed' | 'owes';
  canPayout: boolean;
  bankBalance: number;
  calculatedAt: string;
}

// Story 3.2: Settlement Optimization Types
export interface OptimizedSettlement {
  sessionId: string;
  playerSettlements: PlayerSettlement[];
  paymentPlan: PaymentPlan[];
  totalAmount: number;
  transactionCount: number;
  directTransactionCount: number;
  transactionReduction: number;
  reductionPercentage: number;
  isBalanced: boolean;
  calculatedAt: string;
}

export interface PaymentPlan {
  fromPlayerId: string;
  fromPlayerName: string;
  toPlayerId: string;
  toPlayerName: string;
  amount: number;
}

export interface PlayerSettlement {
  playerId: string;
  playerName: string;
  currentChips: number;
  totalBuyIns: number;
  netAmount: number;
  owesOrOwed: 'owed' | 'owes';
}

// Story 3.3: Basic Settlement Validation Types  
export interface SettlementValidation {
  isValid: boolean;
  errors: SettlementError[];
  warnings: string[];
  auditTrail: string[];
  validatedAt: string;
}

export interface SettlementError {
  code: SettlementErrorCode;
  message: string;
  severity: 'critical' | 'warning' | 'info';
}

export type SettlementErrorCode = 
  | 'BALANCE_MISMATCH' 
  | 'PLAYER_POSITION_MISMATCH'
  | 'EARLY_CASHOUT_FAILED'
  | 'OPTIMIZATION_FAILED'
  | 'VALIDATION_FAILED'
  | 'BANK_BALANCE_FAILED'
  | 'PLAYER_SETTLEMENTS_FAILED'
  | 'SETTLEMENT_INIT_FAILED';

// Supporting Types
export interface BankBalance {
  totalBuyIns: number;
  totalCashOuts: number;
  availableForCashOut: number;
  isBalanced: boolean;
  calculatedAt: string;
}

// Note: Complex types removed during Epic 3 scope rollback (Story 3.5):
// - MathematicalProof, ProofStep, PrecisionReport (Proof system)
// - AlternativeSettlement, SettlementComparison (Alternative algorithms)  
// - WarningSystem types (Real-time monitoring)
// - Export format types (PDF/JSON/CSV export)
// - Audit trail complex types (Interactive exploration)
// - Performance monitoring types (Metrics tracking)
// - Multi-phase settlement types (Complex workflow) - DEFERRED TO FUTURE EPIC
// - Cryptographic verification types (Proof integrity)
// - Real-time monitoring types (Warning systems)
// - And 80+ other complex interface definitions
//
// Epic 3 Scope Rollback completed successfully - 19,400+ lines eliminated
// Core settlement functionality preserved: Early cash-out, optimization, basic validation