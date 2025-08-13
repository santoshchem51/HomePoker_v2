# API Specification

Since PokePot uses **direct TypeScript service invocation** instead of traditional REST/GraphQL APIs, all "backend" functionality is implemented as services within the React Native application.

## Internal Service API Definitions

```typescript
interface SessionService {
  // Session management
  createSession(name: string, organizerId: string): Promise<Session>;
  getSession(sessionId: string): Promise<Session | null>;
  updateSessionStatus(sessionId: string, status: Session['status']): Promise<void>;
  deleteSession(sessionId: string): Promise<void>;
  
  // Session lifecycle
  startSession(sessionId: string): Promise<void>;
  completeSession(sessionId: string): Promise<SessionSummary>;
  
  // Validation
  validateSessionBalance(sessionId: string): Promise<BalanceValidation>;
}

interface TransactionService {
  // Transaction recording
  recordBuyIn(request: BuyInRequest): Promise<Transaction>;
  recordCashOut(request: CashOutRequest): Promise<Transaction>;
  voidTransaction(transactionId: string): Promise<void>;
  
  // Transaction queries
  getSessionTransactions(sessionId: string): Promise<Transaction[]>;
  getPlayerTransactions(playerId: string): Promise<Transaction[]>;
  
  // Validation
  validateTransactionAmount(amount: number): ValidationResult;
  canCashOut(playerId: string, amount: number): Promise<CashOutValidation>;
}

interface SettlementService {
  // Settlement calculations
  calculateEarlyCashOut(playerId: string): Promise<EarlyCashOutResult>;
  calculateFinalSettlement(sessionId: string): Promise<SettlementPlan>;
  optimizeSettlement(sessionId: string): Promise<OptimizedSettlementPlan>;
  
  // Settlement validation
  validateSettlement(plan: SettlementPlan): Promise<SettlementValidation>;
  generateSettlementSummary(sessionId: string): Promise<SettlementSummary>;
}

interface VoiceService {
  // Voice recognition
  startListening(): Promise<void>;
  stopListening(): Promise<void>;
  processVoiceCommand(command: string, sessionId: string): Promise<VoiceCommandResult>;
  
  // Command parsing
  parsePlayerName(command: string, sessionPlayers: Player[]): Promise<string | null>;
  parseAmount(command: string): Promise<number | null>;
  validateCommand(command: string): Promise<CommandValidation>;
}

interface WhatsAppService {
  // Message formatting
  formatSettlementMessage(settlement: SettlementSummary, format: 'summary' | 'detailed'): string;
  formatSessionSummary(session: Session): string;
  
  // Sharing
  shareToWhatsApp(message: string): Promise<ShareResult>;
  copyToClipboard(message: string): Promise<void>;
  generateShareableUrl(sessionId: string): Promise<string>;
}
```
