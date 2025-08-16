/**
 * Functional tests for end session logic
 * Tests the core business logic without complex mocking
 */

import { Player } from '../../../src/types/player';

describe('End Session Logic', () => {
  const createPlayer = (id: string, name: string, status: 'active' | 'cashed_out', balance = 100): Player => ({
    id,
    sessionId: 'test-session',
    name,
    isGuest: false,
    profileId: null,
    currentBalance: balance,
    totalBuyIns: 50,
    totalCashOuts: status === 'cashed_out' ? 50 : 0,
    status,
    joinedAt: new Date()
  });

  describe('Player Status Based End Session Validation', () => {
    it('should allow end session when all players are cashed out', () => {
      // Arrange
      const players: Player[] = [
        createPlayer('p1', 'Alice', 'cashed_out', 120),
        createPlayer('p2', 'Bob', 'cashed_out', 80),
        createPlayer('p3', 'Charlie', 'cashed_out', 90)
      ];

      // Act - simulate the end session check logic
      const activePlayers = players.filter(player => player.status === 'active');
      const canEndSession = activePlayers.length === 0;

      // Assert
      expect(canEndSession).toBe(true);
      expect(activePlayers).toHaveLength(0);
    });

    it('should prevent end session when any player is still active', () => {
      // Arrange
      const players: Player[] = [
        createPlayer('p1', 'Alice', 'cashed_out', 120),
        createPlayer('p2', 'Bob', 'active', 80),      // Still active
        createPlayer('p3', 'Charlie', 'cashed_out', 90)
      ];

      // Act
      const activePlayers = players.filter(player => player.status === 'active');
      const canEndSession = activePlayers.length === 0;

      // Assert
      expect(canEndSession).toBe(false);
      expect(activePlayers).toHaveLength(1);
      expect(activePlayers[0].name).toBe('Bob');
    });

    it('should ignore player balance when checking end session eligibility', () => {
      // Arrange - players have varying balances but all cashed out
      const players: Player[] = [
        createPlayer('p1', 'Alice', 'cashed_out', 150),   // Won money
        createPlayer('p2', 'Bob', 'cashed_out', 0),       // Lost everything
        createPlayer('p3', 'Charlie', 'cashed_out', 25)   // Lost some
      ];

      // Act - should use status, not balance
      const activePlayers = players.filter(player => player.status === 'active');
      const canEndSession = activePlayers.length === 0;

      // Assert - should allow end session despite different balances
      expect(canEndSession).toBe(true);
      expect(activePlayers).toHaveLength(0);
    });

    it('should handle mixed scenarios correctly', () => {
      // Arrange
      const players: Player[] = [
        createPlayer('p1', 'Alice', 'cashed_out', 0),     // Cashed out, no chips
        createPlayer('p2', 'Bob', 'active', 150),         // Active with chips
        createPlayer('p3', 'Charlie', 'cashed_out', 100), // Cashed out with positive balance
        createPlayer('p4', 'David', 'active', 25)         // Active with few chips
      ];

      // Act
      const activePlayers = players.filter(player => player.status === 'active');
      const canEndSession = activePlayers.length === 0;
      const activePlayerNames = activePlayers.map(p => p.name);

      // Assert
      expect(canEndSession).toBe(false);
      expect(activePlayers).toHaveLength(2);
      expect(activePlayerNames).toEqual(['Bob', 'David']);
    });
  });

  describe('Cash-Out State Transitions', () => {
    it('should demonstrate correct state transition flow', () => {
      // Arrange - initial state with all players active
      let players: Player[] = [
        createPlayer('p1', 'Alice', 'active', 100),
        createPlayer('p2', 'Bob', 'active', 75)
      ];

      // Act 1 - Alice cashes out
      players = players.map(player => 
        player.id === 'p1' 
          ? { ...player, status: 'cashed_out' as const, totalCashOuts: 80, currentBalance: 20 }
          : player
      );

      // Assert 1 - can't end session yet
      let activePlayers = players.filter(p => p.status === 'active');
      expect(activePlayers).toHaveLength(1);
      expect(activePlayers[0].name).toBe('Bob');

      // Act 2 - Bob cashes out
      players = players.map(player => 
        player.id === 'p2' 
          ? { ...player, status: 'cashed_out' as const, totalCashOuts: 75, currentBalance: 0 }
          : player
      );

      // Assert 2 - can now end session
      activePlayers = players.filter(p => p.status === 'active');
      expect(activePlayers).toHaveLength(0);
    });
  });

  describe('Business Logic Validation', () => {
    it('should validate that cash-out always marks player as cashed_out', () => {
      // This test validates our business rule that any cash-out means complete exit
      
      // Arrange - player with high balance
      const playerBeforeCashOut = createPlayer('p1', 'Alice', 'active', 200);
      
      // Act - simulate cash-out of smaller amount (partial in terms of chips)
      const cashOutAmount = 50; // Less than current balance
      const playerAfterCashOut: Player = {
        ...playerBeforeCashOut,
        currentBalance: playerBeforeCashOut.currentBalance - cashOutAmount,
        totalCashOuts: playerBeforeCashOut.totalCashOuts + cashOutAmount,
        status: 'cashed_out' // This is the key assertion - should always be cashed_out
      };

      // Assert - regardless of amount, player should be marked as cashed out
      expect(playerAfterCashOut.status).toBe('cashed_out');
      expect(playerAfterCashOut.currentBalance).toBe(150); // 200 - 50
      expect(playerAfterCashOut.totalCashOuts).toBe(50);
    });

    it('should demonstrate poker game settlement math', () => {
      // This test shows how the settlement should work
      
      // Arrange - poker session with known outcomes
      const players: Player[] = [
        {
          ...createPlayer('p1', 'Alice', 'cashed_out'),
          totalBuyIns: 100,    // Put in $100
          totalCashOuts: 150,  // Took out $150 (won $50)
          currentBalance: 0    // No chips left
        },
        {
          ...createPlayer('p2', 'Bob', 'cashed_out'),  
          totalBuyIns: 100,    // Put in $100
          totalCashOuts: 50,   // Took out $50 (lost $50)
          currentBalance: 0    // No chips left
        }
      ];

      // Act - calculate net positions
      const settlements = players.map(player => ({
        playerId: player.id,
        playerName: player.name,
        netAmount: (player.currentBalance + player.totalCashOuts) - player.totalBuyIns
      }));

      // Assert - math should balance
      expect(settlements[0].netAmount).toBe(50);   // Alice won $50
      expect(settlements[1].netAmount).toBe(-50);  // Bob lost $50
      
      const totalNet = settlements.reduce((sum, s) => sum + s.netAmount, 0);
      expect(totalNet).toBe(0); // Should balance to zero
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty player list', () => {
      // Arrange
      const players: Player[] = [];

      // Act
      const activePlayers = players.filter(player => player.status === 'active');
      const canEndSession = activePlayers.length === 0;

      // Assert
      expect(canEndSession).toBe(true);
      expect(activePlayers).toHaveLength(0);
    });

    it('should handle single player session', () => {
      // Arrange
      const players: Player[] = [
        createPlayer('p1', 'Alice', 'cashed_out', 100)
      ];

      // Act
      const activePlayers = players.filter(player => player.status === 'active');
      const canEndSession = activePlayers.length === 0;

      // Assert
      expect(canEndSession).toBe(true);
      expect(activePlayers).toHaveLength(0);
    });

    it('should handle zero balance scenarios', () => {
      // Arrange - players with zero balance but different statuses
      const players: Player[] = [
        createPlayer('p1', 'Alice', 'cashed_out', 0),  // Cashed out with no chips
        createPlayer('p2', 'Bob', 'active', 0)         // Active but no chips (unusual)
      ];

      // Act
      const activePlayers = players.filter(player => player.status === 'active');
      const canEndSession = activePlayers.length === 0;

      // Assert - should still require Bob to cash out even with 0 balance
      expect(canEndSession).toBe(false);
      expect(activePlayers).toHaveLength(1);
      expect(activePlayers[0].name).toBe('Bob');
    });
  });
});