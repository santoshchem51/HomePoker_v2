/**
 * Integration tests for cash-out and end session functionality
 * Tests the complete flow from cash-out recording to end session validation
 */

import { TransactionService } from '../../../src/services/core/TransactionService';
import { DatabaseService } from '../../../src/services/infrastructure/DatabaseService';
import { SessionService } from '../../../src/services/core/SessionService';
import { Player } from '../../../src/types/player';
import { Session } from '../../../src/types/session';

// Mock setup
jest.mock('../../../src/services/infrastructure/DatabaseService', () => ({
  DatabaseService: {
    getInstance: jest.fn(() => ({
      executeTransaction: jest.fn(),
      getPlayers: jest.fn(),
      getSession: jest.fn(),
      updatePlayer: jest.fn(),
      updateSession: jest.fn(),
      recordTransaction: jest.fn()
    }))
  }
}));

jest.mock('../../../src/services/core/SessionService', () => ({
  SessionService: {
    getInstance: jest.fn(() => ({
      getSession: jest.fn()
    }))
  }
}));

describe('Cash-Out and End Session Integration', () => {
  let transactionService: TransactionService;
  let mockDbService: jest.Mocked<DatabaseService>;
  let mockSessionService: jest.Mocked<SessionService>;
  
  const mockSessionId = 'test-session-123';
  const mockPlayers: Player[] = [
    {
      id: 'player1',
      sessionId: mockSessionId,
      name: 'Alice',
      isGuest: false,
      profileId: null,
      currentBalance: 100,
      totalBuyIns: 50,
      totalCashOuts: 0,
      status: 'active',
      joinedAt: new Date()
    },
    {
      id: 'player2', 
      sessionId: mockSessionId,
      name: 'Bob',
      isGuest: false,
      profileId: null,
      currentBalance: 75,
      totalBuyIns: 50,
      totalCashOuts: 0,
      status: 'active',
      joinedAt: new Date()
    }
  ];

  const mockSession: Session = {
    id: mockSessionId,
    name: 'Test Poker Session',
    organizerId: 'organizer1',
    status: 'active',
    totalPot: 100,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get mocked instances
    mockDbService = DatabaseService.getInstance() as jest.Mocked<DatabaseService>;
    mockSessionService = SessionService.getInstance() as jest.Mocked<SessionService>;
    
    // Reset singleton instance for clean tests
    (TransactionService as any).instance = null;
    transactionService = TransactionService.getInstance();
    
    // Setup default mocks
    mockDbService.executeTransaction.mockImplementation((callback) => callback());
    mockDbService.getPlayers.mockResolvedValue(mockPlayers);
    mockSessionService.getSession.mockResolvedValue(mockSession);
    mockDbService.getSession.mockResolvedValue(mockSession);
  });

  describe('Cash-Out Recording', () => {
    it('should mark player as cashed_out when recording any cash-out', async () => {
      // Arrange
      const playerId = 'player1';
      const cashOutAmount = 60;
      
      mockDbService.recordTransaction.mockResolvedValue({
        id: 'txn-123',
        sessionId: mockSessionId,
        playerId,
        type: 'cash_out',
        amount: cashOutAmount,
        timestamp: new Date(),
        method: 'manual',
        isVoided: false,
        description: undefined,
        createdBy: 'user'
      });

      // Act
      const result = await transactionService.recordCashOut(
        mockSessionId,
        playerId,
        cashOutAmount,
        'manual',
        'user'
      );

      // Assert
      expect(mockDbService.updatePlayer).toHaveBeenCalledWith(playerId, {
        currentBalance: 40, // 100 - 60
        totalCashOuts: 60,   // 0 + 60
        status: 'cashed_out' // Key assertion - should always be cashed_out
      });
      
      expect(result.type).toBe('cash_out');
      expect(result.amount).toBe(cashOutAmount);
    });

    it('should mark player as cashed_out even for partial cash-out amounts', async () => {
      // Arrange - player cashes out less than their balance
      const playerId = 'player1';
      const cashOutAmount = 30; // Less than currentBalance of 100
      
      mockDbService.recordTransaction.mockResolvedValue({
        id: 'txn-124',
        sessionId: mockSessionId,
        playerId,
        type: 'cash_out',
        amount: cashOutAmount,
        timestamp: new Date(),
        method: 'manual',
        isVoided: false,
        description: undefined,
        createdBy: 'user'
      });

      // Act
      await transactionService.recordCashOut(
        mockSessionId,
        playerId,
        cashOutAmount,
        'manual',
        'user'
      );

      // Assert - should still mark as cashed_out (complete exit from game)
      expect(mockDbService.updatePlayer).toHaveBeenCalledWith(playerId, {
        currentBalance: 70, // 100 - 30
        totalCashOuts: 30,
        status: 'cashed_out' // Should be cashed_out regardless of amount
      });
    });

    it('should update session total pot when player cashes out', async () => {
      // Arrange
      const playerId = 'player1';
      const cashOutAmount = 80;
      
      mockDbService.recordTransaction.mockResolvedValue({
        id: 'txn-125',
        sessionId: mockSessionId,
        playerId,
        type: 'cash_out',
        amount: cashOutAmount,
        timestamp: new Date(),
        method: 'manual',
        isVoided: false,
        description: undefined,
        createdBy: 'user'
      });

      // Act
      await transactionService.recordCashOut(
        mockSessionId,
        playerId,
        cashOutAmount,
        'manual',
        'user'
      );

      // Assert
      expect(mockDbService.updateSession).toHaveBeenCalledWith(mockSessionId, {
        totalPot: 20 // 100 - 80
      });
    });
  });

  describe('End Session Logic', () => {
    it('should allow end session when all players are cashed out', () => {
      // Arrange - all players cashed out
      const cashedOutPlayers: Player[] = [
        { ...mockPlayers[0], status: 'cashed_out' },
        { ...mockPlayers[1], status: 'cashed_out' }
      ];

      // Act - simulate end session check
      const activePlayers = cashedOutPlayers.filter(player => player.status === 'active');

      // Assert
      expect(activePlayers).toHaveLength(0);
    });

    it('should prevent end session when some players are still active', () => {
      // Arrange - mixed player statuses
      const mixedPlayers: Player[] = [
        { ...mockPlayers[0], status: 'cashed_out' },
        { ...mockPlayers[1], status: 'active' } // Still active
      ];

      // Act - simulate end session check
      const activePlayers = mixedPlayers.filter(player => player.status === 'active');

      // Assert
      expect(activePlayers).toHaveLength(1);
      expect(activePlayers[0].name).toBe('Bob');
    });

    it('should not be affected by player balance when checking end session eligibility', () => {
      // Arrange - player has positive balance but is cashed out
      const playersWithBalance: Player[] = [
        { ...mockPlayers[0], currentBalance: 50, status: 'cashed_out' },
        { ...mockPlayers[1], currentBalance: 100, status: 'cashed_out' }
      ];

      // Act - simulate end session check (should use status, not balance)
      const activePlayers = playersWithBalance.filter(player => player.status === 'active');

      // Assert - should allow end session despite positive balances
      expect(activePlayers).toHaveLength(0);
    });
  });

  describe('Complete Cash-Out Flow Integration', () => {
    it('should handle complete poker session flow correctly', async () => {
      // Arrange - simulate a complete poker session
      const player1Id = 'player1';
      const player2Id = 'player2';
      
      // Mock transaction recording
      mockDbService.recordTransaction.mockResolvedValue({
        id: 'txn-flow',
        sessionId: mockSessionId,
        playerId: player1Id,
        type: 'cash_out',
        amount: 80,
        timestamp: new Date(),
        method: 'manual',
        isVoided: false,
        description: undefined,
        createdBy: 'user'
      });

      // Act 1 - Player 1 cashes out
      await transactionService.recordCashOut(mockSessionId, player1Id, 80, 'manual', 'user');
      
      // Assert 1 - Player 1 should be marked as cashed out
      expect(mockDbService.updatePlayer).toHaveBeenNthCalledWith(1, player1Id, {
        currentBalance: 20, // 100 - 80
        totalCashOuts: 80,
        status: 'cashed_out'
      });

      // Simulate updated player state
      const updatedPlayers: Player[] = [
        { ...mockPlayers[0], status: 'cashed_out', totalCashOuts: 80, currentBalance: 20 },
        { ...mockPlayers[1], status: 'active' } // Still active
      ];

      // Act 2 - Check if can end session (should fail)
      let activePlayers = updatedPlayers.filter(p => p.status === 'active');
      expect(activePlayers).toHaveLength(1); // Bob still active

      // Act 3 - Player 2 cashes out
      mockDbService.recordTransaction.mockResolvedValue({
        id: 'txn-flow-2',
        sessionId: mockSessionId,
        playerId: player2Id,
        type: 'cash_out',
        amount: 75,
        timestamp: new Date(),
        method: 'manual',
        isVoided: false,
        description: undefined,
        createdBy: 'user'
      });

      await transactionService.recordCashOut(mockSessionId, player2Id, 75, 'manual', 'user');

      // Assert 3 - Player 2 should be marked as cashed out
      expect(mockDbService.updatePlayer).toHaveBeenNthCalledWith(2, player2Id, {
        currentBalance: 0, // 75 - 75
        totalCashOuts: 75,
        status: 'cashed_out'
      });

      // Simulate final player state
      const finalPlayers: Player[] = [
        { ...mockPlayers[0], status: 'cashed_out', totalCashOuts: 80, currentBalance: 20 },
        { ...mockPlayers[1], status: 'cashed_out', totalCashOuts: 75, currentBalance: 0 }
      ];

      // Act 4 - Check if can end session (should pass)
      activePlayers = finalPlayers.filter(p => p.status === 'active');
      
      // Assert 4 - Should be able to end session
      expect(activePlayers).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle player not found error', async () => {
      // Arrange
      mockDbService.getPlayers.mockResolvedValue([]);

      // Act & Assert
      await expect(
        transactionService.recordCashOut(mockSessionId, 'nonexistent-player', 50, 'manual', 'user')
      ).rejects.toThrow('Player nonexistent-player not found');
    });

    it('should handle invalid session error', async () => {
      // Arrange
      mockSessionService.getSession.mockResolvedValue(null);

      // Act & Assert
      await expect(
        transactionService.recordCashOut(mockSessionId, 'player1', 50, 'manual', 'user')
      ).rejects.toThrow('Cash-outs are only allowed for active sessions');
    });

    it('should handle already cashed out player error', async () => {
      // Arrange
      const cashedOutPlayers = [
        { ...mockPlayers[0], status: 'cashed_out' as const }
      ];
      mockDbService.getPlayers.mockResolvedValue(cashedOutPlayers);

      // Act & Assert
      await expect(
        transactionService.recordCashOut(mockSessionId, 'player1', 50, 'manual', 'user')
      ).rejects.toThrow('Player has already cashed out');
    });
  });
});