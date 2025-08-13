# Coding Standards

Define **MINIMAL but CRITICAL** standards for AI agents focused on project-specific rules:

## Critical Fullstack Rules

- **Type Sharing:** Always define shared types in `src/types/` and import consistently across components and services - prevents runtime type mismatches in financial calculations
- **Service Layer Calls:** Never bypass service layer - all database operations must go through `DatabaseService`, all business logic through core services - maintains data integrity and transaction consistency
- **Financial Precision:** Always use `CalculationUtils.addAmounts()`, `CalculationUtils.subtractAmounts()` for currency math - prevents floating-point precision errors in settlements
- **Transaction Atomicity:** All multi-step database operations must use `DatabaseService.executeTransaction()` with proper rollback - ensures financial data consistency
- **Input Validation:** Every user input must be validated through `ValidationService` before processing - prevents invalid financial data and security vulnerabilities  
- **Error Handling:** All service methods must use consistent `ServiceError` class with proper error codes - enables proper error recovery and user feedback
- **State Updates:** Never mutate Zustand store state directly - use store actions that maintain immutability - prevents state corruption during concurrent operations
- **Voice Command Confirmation:** All voice-initiated financial transactions must show visual confirmation dialog - prevents accidental money movements
- **Settlement Verification:** Every settlement calculation must call `SettlementService.validateSettlement()` to ensure mathematical balance - guarantees accuracy
- **Database Queries:** Use parameterized queries exclusively via `DatabaseService.executeQuery()` - prevents SQL injection and ensures proper escaping

## Naming Conventions

| Element | Frontend | Backend | Example |
|---------|----------|---------|---------|
| Components | PascalCase | - | `PlayerCard.tsx`, `SettlementSummary.tsx` |
| Hooks | camelCase with 'use' | - | `useVoiceCommands.ts`, `useSessionData.ts` |
| Services | PascalCase classes | PascalCase classes | `TransactionService.ts`, `SettlementService.ts` |
| Database Tables | - | snake_case | `sessions`, `players`, `transactions` |
| Database Columns | - | snake_case | `player_id`, `created_at`, `total_buy_ins` |
| Store Actions | camelCase | - | `addTransaction`, `updatePlayerBalance` |
| Error Codes | SCREAMING_SNAKE_CASE | SCREAMING_SNAKE_CASE | `VALIDATION_ERROR`, `SETTLEMENT_CALCULATION_FAILED` |
| Constants | SCREAMING_SNAKE_CASE | SCREAMING_SNAKE_CASE | `MAX_PLAYERS_PER_SESSION`, `MIN_TRANSACTION_AMOUNT` |
