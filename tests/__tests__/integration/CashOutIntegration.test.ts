/**
 * Cash-out Integration Tests
 * Tests Story 1.4 requirements for end-to-end cash-out workflows
 */
import TransactionService from '../../../src/services/core/TransactionService';
import { SessionService } from '../../../src/services/core/SessionService';
import { DatabaseService } from '../../../src/services/infrastructure/DatabaseService';
import { UndoManager } from '../../../src/utils/undo-manager';
import { ServiceError, ErrorCode } from '../../../src/types/errors';

// Mock dependencies
jest.mock('../../../src/services/infrastructure/DatabaseService');
jest.mock('../../../src/services/core/SessionService');
jest.mock('../../../src/utils/undo-manager');

const MockDatabaseService = DatabaseService as jest.MockedClass<typeof DatabaseService>;
const MockSessionService = SessionService as jest.MockedClass<typeof SessionService>;
const MockUndoManager = UndoManager as jest.MockedClass<typeof UndoManager>;

describe('Cash-out Integration Tests - Story 1.4', () => {
  let transactionService: TransactionService;
  let mockDbService: jest.Mocked<DatabaseService>;
  let mockSessionService: jest.Mocked<SessionService>;
  let mockUndoManager: jest.Mocked<UndoManager>;

  const validSession = {
    id: 'session-1',
    name: 'Test Session',
    organizerId: 'organizer-1',
    status: 'active' as const,
    createdAt: new Date(),
    totalPot: 100.00,
    playerCount: 4
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup database service mock
    mockDbService = {
      executeQuery: jest.fn(),
      executeTransaction: jest.fn(),
    } as any;
    MockDatabaseService.getInstance.mockReturnValue(mockDbService);

    // Setup session service mock
    mockSessionService = {
      getSession: jest.fn(),
    } as any;
    MockSessionService.getInstance.mockReturnValue(mockSessionService);

    // Setup undo manager mock
    mockUndoManager = {
      addUndoableTransaction: jest.fn(),
      canUndo: jest.fn(),
      removeUndoableTransaction: jest.fn(),
      getRemainingUndoTime: jest.fn(),
      getMostRecentUndoableTransaction: jest.fn(),
    } as any;
    MockUndoManager.getInstance.mockReturnValue(mockUndoManager);

    transactionService = TransactionService.getInstance();
    mockSessionService.getSession.mockResolvedValue(validSession);
  });

  describe('End-to-end cash-out recording with balance updates', () => {
    it('should complete full cash-out workflow with all database updates', async () => {
      // Setup mocks for successful cash-out
      mockDbService.executeQuery
        .mockResolvedValueOnce([{ id: 'player-1', status: 'active', total_buy_ins: '100.00' }]) // Player validation
        .mockResolvedValueOnce([{ total_buy_ins: '200.00', total_cash_outs: '50.00' }]) // Session balance validation
        .mockResolvedValueOnce([]) // Duplicate check
        .mockResolvedValueOnce([{ current_balance: '75.00', total_buy_ins: '100.00', status: 'active' }]) // Get player state
        .mockResolvedValueOnce([{ // Get created transaction
          id: 'transaction-1',
          session_id: 'session-1',
          player_id: 'player-1',
          type: 'cash_out',
          amount: '50.00',
          timestamp: new Date().toISOString(),
          method: 'manual',
          is_voided: false,
          created_by: 'user',
          player_name: 'John Doe'
        }]);

      mockDbService.executeTransaction.mockResolvedValue(undefined);

      const result = await transactionService.recordCashOut('session-1', 'player-1', 50.00);

      // Verify transaction creation
      expect(result.type).toBe('cash_out');
      expect(result.amount).toBe(50.00);
      expect(result.playerId).toBe('player-1');

      // Verify database transaction with all updates
      expect(mockDbService.executeTransaction).toHaveBeenCalledWith([
        // Insert transaction
        expect.objectContaining({
          query: expect.stringContaining('INSERT INTO transactions'),
          params: expect.arrayContaining(['session-1', 'player-1', 'cash_out', 50.00])
        }),
        // Update player balance and totals
        expect.objectContaining({
          query: expect.stringContaining('UPDATE players'),
          params: expect.arrayContaining([50.00, 50.00, false, 'player-1'])
        }),
        // Update session totals
        expect.objectContaining({
          query: expect.stringContaining('UPDATE sessions'),
          params: [50.00, 'session-1']
        })
      ]);

      // Verify undo manager integration
      expect(mockUndoManager.addUndoableTransaction).toHaveBeenCalledWith(result);
    });

    it('should handle player status change to cashed_out', async () => {
      // Player cashing out their entire balance
      mockDbService.executeQuery
        .mockResolvedValueOnce([{ id: 'player-1', status: 'active', total_buy_ins: '50.00' }])
        .mockResolvedValueOnce([{ total_buy_ins: '200.00', total_cash_outs: '100.00' }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ current_balance: '25.00', total_buy_ins: '50.00', status: 'active' }]) // Exactly 25.00 balance
        .mockResolvedValueOnce([{
          id: 'transaction-1',
          session_id: 'session-1',
          player_id: 'player-1',
          type: 'cash_out',
          amount: '25.00',
          timestamp: new Date().toISOString(),
          method: 'manual',
          is_voided: false,
          created_by: 'user',
          player_name: 'John Doe'
        }]);

      await transactionService.recordCashOut('session-1', 'player-1', 25.00);

      // Verify player status update (willCashOutCompletely = true)
      expect(mockDbService.executeTransaction).toHaveBeenCalledWith([
        expect.any(Object), // INSERT transaction
        expect.objectContaining({
          query: expect.stringContaining('UPDATE players'),
          params: expect.arrayContaining([25.00, 25.00, true, 'player-1']) // willCashOutCompletely = true
        }),
        expect.any(Object) // UPDATE sessions
      ]);
    });
  });

  describe('Session balance validation across multiple cash-outs', () => {
    it('should prevent multiple cash-outs that exceed session total', async () => {
      // Session with 100.00 total buy-ins, 80.00 already cashed out
      mockDbService.executeQuery
        .mockResolvedValueOnce([{ id: 'player-1', status: 'active', total_buy_ins: '50.00' }])
        .mockResolvedValueOnce([{ total_buy_ins: '100.00', total_cash_outs: '80.00' }]); // Would exceed with additional 25.00

      await expect(
        transactionService.recordCashOut('session-1', 'player-1', 25.00) // 80 + 25 = 105 > 100
      ).rejects.toThrow(
        expect.objectContaining({
          code: ErrorCode.SESSION_BALANCE_EXCEEDED
        })
      );
    });

    it('should allow cash-outs up to session limit', async () => {
      // Session with exactly enough balance remaining
      mockDbService.executeQuery
        .mockResolvedValueOnce([{ id: 'player-1', status: 'active', total_buy_ins: '50.00' }])
        .mockResolvedValueOnce([{ total_buy_ins: '100.00', total_cash_outs: '80.00' }]) // Exactly 20.00 remaining
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ current_balance: '25.00', total_buy_ins: '50.00', status: 'active' }])
        .mockResolvedValueOnce([{
          id: 'transaction-1',
          session_id: 'session-1',
          player_id: 'player-1',
          type: 'cash_out',
          amount: '20.00',
          timestamp: new Date().toISOString(),
          method: 'manual',
          is_voided: false,
          created_by: 'user',
          player_name: 'John Doe'
        }]);

      const result = await transactionService.recordCashOut('session-1', 'player-1', 20.00);

      expect(result.amount).toBe(20.00);
      expect(mockDbService.executeTransaction).toHaveBeenCalled();
    });
  });

  describe('Organizer override workflows', () => {
    it('should require organizer confirmation for cash-out exceeding buy-ins', async () => {
      mockDbService.executeQuery.mockResolvedValueOnce([{ 
        id: 'player-1', 
        status: 'active',
        total_buy_ins: '30.00' // Player bought in 30, trying to cash out 50
      }]);

      await expect(
        transactionService.recordCashOut('session-1', 'player-1', 50.00, 'manual', 'user', undefined, false)
      ).rejects.toThrow(
        expect.objectContaining({
          code: ErrorCode.ORGANIZER_CONFIRMATION_REQUIRED,
          details: expect.objectContaining({
            requiresConfirmation: true,
            cashOutAmount: 50.00,
            totalBuyIns: 30.00
          })
        })
      );
    });

    it('should allow organizer-confirmed cash-out exceeding buy-ins', async () => {
      mockDbService.executeQuery
        .mockResolvedValueOnce([{ id: 'player-1', status: 'active', total_buy_ins: '30.00' }])
        .mockResolvedValueOnce([{ total_buy_ins: '200.00', total_cash_outs: '100.00' }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ current_balance: '55.00', total_buy_ins: '30.00', status: 'active' }])
        .mockResolvedValueOnce([{
          id: 'transaction-1',
          session_id: 'session-1',
          player_id: 'player-1',
          type: 'cash_out',
          amount: '50.00',
          timestamp: new Date().toISOString(),
          method: 'manual',
          is_voided: false,
          created_by: 'user',
          player_name: 'John Doe'
        }]);

      const result = await transactionService.recordCashOut(
        'session-1', 'player-1', 50.00, 'manual', 'user', undefined, true // organizerConfirmed = true
      );

      expect(result.amount).toBe(50.00);
      expect(mockDbService.executeTransaction).toHaveBeenCalled();
    });
  });

  describe('Cash-out undo functionality', () => {
    const cashOutTransaction = {
      id: 'transaction-1',
      sessionId: 'session-1',
      playerId: 'player-1',
      type: 'cash_out' as const,
      amount: 30.00,
      timestamp: new Date(),
      method: 'manual' as const,
      isVoided: false,
      createdBy: 'user'
    };

    it('should complete full undo workflow for cash-out', async () => {
      mockUndoManager.canUndo.mockReturnValue(true);
      mockDbService.executeQuery.mockResolvedValue([{
        ...cashOutTransaction,
        timestamp: cashOutTransaction.timestamp.toISOString(),
        session_id: cashOutTransaction.sessionId,
        player_id: cashOutTransaction.playerId,
        is_voided: false,
        created_by: cashOutTransaction.createdBy
      }]);

      await transactionService.undoTransaction('transaction-1');

      // Verify cash-out specific undo logic
      expect(mockDbService.executeTransaction).toHaveBeenCalledWith([
        // Mark transaction as voided
        expect.objectContaining({
          query: expect.stringContaining('UPDATE transactions'),
          params: expect.arrayContaining(['transaction-1'])
        }),
        // Restore player balance and reduce cash-out totals
        expect.objectContaining({
          query: expect.stringContaining('UPDATE players'),
          params: [30.00, 30.00, 'player-1'] // Add back balance, subtract from cash-outs, restore active status
        }),
        // Reduce session cash-out totals
        expect.objectContaining({
          query: expect.stringContaining('UPDATE sessions'),
          params: [30.00, 'session-1']
        })
      ]);

      expect(mockUndoManager.removeUndoableTransaction).toHaveBeenCalledWith('transaction-1');
    });

    it('should prevent undo after 30-second window', async () => {
      mockUndoManager.canUndo.mockReturnValue(false);

      await expect(
        transactionService.undoTransaction('transaction-1')
      ).rejects.toThrow('Transaction cannot be undone (expired or already voided)');

      expect(mockDbService.executeTransaction).not.toHaveBeenCalled();
    });
  });

  describe('Player status transitions and restrictions', () => {
    it('should prevent cash-out for already cashed-out player', async () => {
      mockDbService.executeQuery.mockResolvedValueOnce([{ 
        id: 'player-1', 
        status: 'cashed_out',
        total_buy_ins: '50.00'
      }]);

      await expect(
        transactionService.recordCashOut('session-1', 'player-1', 25.00)
      ).rejects.toThrow(
        expect.objectContaining({
          code: ErrorCode.PLAYER_ALREADY_CASHED_OUT
        })
      );

      expect(mockDbService.executeTransaction).not.toHaveBeenCalled();
    });

    it('should restore player status when undoing cash-out', async () => {
      // This verifies that undo logic includes status restoration
      mockUndoManager.canUndo.mockReturnValue(true);
      mockDbService.executeQuery.mockResolvedValue([{
        id: 'transaction-1',
        sessionId: 'session-1',
        playerId: 'player-1',
        type: 'cash_out',
        amount: 50.00,
        timestamp: new Date().toISOString(),
        session_id: 'session-1',
        player_id: 'player-1',
        is_voided: false,
        created_by: 'user'
      }]);

      await transactionService.undoTransaction('transaction-1');

      // The undo logic includes setting status back to 'active'
      expect(mockDbService.executeTransaction).toHaveBeenCalledWith([
        expect.any(Object), // VOID transaction
        expect.objectContaining({
          query: expect.stringMatching(/UPDATE players.*status = 'active'/)
        }),
        expect.any(Object) // UPDATE sessions
      ]);
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle database failures gracefully', async () => {
      mockDbService.executeQuery.mockResolvedValueOnce([{ 
        id: 'player-1', 
        status: 'active',
        total_buy_ins: '50.00'
      }]);
      mockDbService.executeTransaction.mockRejectedValue(new Error('Database connection lost'));

      await expect(
        transactionService.recordCashOut('session-1', 'player-1', 25.00)
      ).rejects.toThrow('Failed to record cash-out transaction');
    });

    it('should preserve specific ServiceError types', async () => {
      const sessionError = new ServiceError(ErrorCode.SESSION_NOT_FOUND, 'Session not found', {});
      mockSessionService.getSession.mockRejectedValue(sessionError);

      await expect(
        transactionService.recordCashOut('session-1', 'player-1', 25.00)
      ).rejects.toThrow(sessionError);
    });
  });
});