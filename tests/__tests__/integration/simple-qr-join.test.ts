/**
 * Simple QR Join Integration Tests
 * Tests the complete flow from QR generation to web view balance display
 * Covers all Story 2.4 acceptance criteria
 */
import { SessionUrlService } from '../../../src/services/integration/SessionUrlService';
import { SessionService } from '../../../src/services/core/SessionService';
import { DatabaseService } from '../../../src/services/infrastructure/DatabaseService';
import { Session } from '../../../src/types/session';
import { Player } from '../../../src/types/player';

// Mock DatabaseService
jest.mock('../../../src/services/infrastructure/DatabaseService');

describe('Simple QR Join Integration', () => {
  let sessionUrlService: SessionUrlService;
  let sessionService: SessionService;
  let mockDatabaseService: jest.Mocked<DatabaseService>;

  const mockSession: Session = {
    id: 'session-123',
    name: 'Friday Night Poker',
    organizerId: 'organizer-123',
    status: 'active',
    createdAt: new Date('2025-01-01T20:00:00Z'),
    startedAt: new Date('2025-01-01T20:05:00Z'),
    totalPot: 800,
    playerCount: 4
  };

  const mockPlayers: Player[] = [
    {
      id: 'player-1',
      sessionId: 'session-123',
      name: 'Alice',
      isGuest: true,
      currentBalance: 150,
      totalBuyIns: 200,
      totalCashOuts: 50,
      status: 'active',
      joinedAt: new Date('2025-01-01T20:00:00Z')
    },
    {
      id: 'player-2',
      sessionId: 'session-123',
      name: 'Bob',
      isGuest: true,
      currentBalance: -50,
      totalBuyIns: 100,
      totalCashOuts: 0,
      status: 'active',
      joinedAt: new Date('2025-01-01T20:01:00Z')
    },
    {
      id: 'player-3',
      sessionId: 'session-123',
      name: 'Charlie',
      isGuest: true,
      currentBalance: 25,
      totalBuyIns: 150,
      totalCashOuts: 125,
      status: 'active',
      joinedAt: new Date('2025-01-01T20:02:00Z')
    },
    {
      id: 'player-4',
      sessionId: 'session-123',
      name: 'Diana',
      isGuest: true,
      currentBalance: -125,
      totalBuyIns: 75,
      totalCashOuts: 0,
      status: 'active',
      joinedAt: new Date('2025-01-01T20:03:00Z')
    }
  ];

  beforeEach(() => {
    // Clear singleton instances
    (SessionUrlService as any).instance = null;
    (SessionService as any).instance = null;
    (DatabaseService as any).instance = null;

    sessionUrlService = SessionUrlService.getInstance();
    sessionService = SessionService.getInstance();

    // Setup mock DatabaseService
    mockDatabaseService = {
      getSession: jest.fn(),
      getPlayers: jest.fn(),
      executeTransaction: jest.fn(),
      getInstance: jest.fn()
    } as any;

    (DatabaseService.getInstance as jest.Mock).mockReturnValue(mockDatabaseService);
    
    // Setup SessionService to use mock data
    jest.spyOn(sessionService, 'getSession').mockResolvedValue(mockSession);
    jest.spyOn(sessionService, 'getSessionState').mockResolvedValue({
      session: mockSession,
      players: mockPlayers,
      canStart: false,
      canComplete: true
    });

    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clear viewers between tests
    (sessionUrlService as any).viewers.clear();
  });

  // Complete QR Join Flow Test
  describe('Complete QR Join Flow', () => {
    // AC: 1, 2, 3, 4, 5, 6 - Complete flow test
    it('should handle complete QR join flow from generation to balance viewing', async () => {
      // Step 1: Generate QR codes for all players (AC: 1)
      const qrCodes = [];
      for (const player of mockPlayers) {
        const sessionUrl = await sessionUrlService.generateSessionUrl(mockSession.id, player.id);
        const webUrl = sessionUrlService.generateWebUrl(mockSession.id, player.id);
        
        qrCodes.push({
          playerId: player.id,
          playerName: player.name,
          sessionUrl: sessionUrl.url,
          webUrl: webUrl
        });
      }

      expect(qrCodes).toHaveLength(4);
      expect(qrCodes[0]).toEqual({
        playerId: 'player-1',
        playerName: 'Alice',
        sessionUrl: 'pokepot://session/session-123/player/player-1',
        webUrl: 'https://pokepot.local/session/session-123/player/player-1'
      });

      // Step 2: Simulate mobile web access (AC: 2, 4)
      const aliceBalance = await sessionUrlService.getPlayerBalance(mockSession.id, 'player-1');
      expect(aliceBalance).toEqual({
        balance: 150,
        sessionActive: true,
        lastUpdated: expect.any(String),
        playerName: 'Alice',
        sessionName: 'Friday Night Poker'
      });

      // Step 3: Test manual refresh functionality (AC: 3)
      const refreshedBalance = await sessionUrlService.getPlayerBalance(mockSession.id, 'player-1');
      expect(refreshedBalance.balance).toBe(150);
      expect(refreshedBalance.sessionActive).toBe(true);

      // Step 4: Test viewer counting (AC: 6)
      expect(sessionUrlService.getSessionViewerCount(mockSession.id)).toBe(1);

      // Add more viewers
      await sessionUrlService.getPlayerBalance(mockSession.id, 'player-2');
      await sessionUrlService.getPlayerBalance(mockSession.id, 'player-3');
      expect(sessionUrlService.getSessionViewerCount(mockSession.id)).toBe(3);

      // Step 5: Test session expiration (AC: 5)
      const completedSession = { ...mockSession, status: 'completed' as const };
      jest.spyOn(sessionService, 'getSession').mockResolvedValue(completedSession);

      const validationResult = await sessionUrlService.validateSessionUrl(mockSession.id, 'player-1');
      expect(validationResult).toBe(false);

      // Cleanup viewers when session ends
      await sessionUrlService.cleanupSessionViewers(mockSession.id);
      expect(sessionUrlService.getSessionViewerCount(mockSession.id)).toBe(0);
    });
  });

  // AC: 6 - Maximum 10 concurrent viewers supported
  describe('Viewer Limit Enforcement', () => {
    it('should enforce maximum 10 concurrent viewers', async () => {
      // Create 10 unique players/viewers
      const viewers = Array.from({ length: 10 }, (_, i) => `player-${i + 1}`);

      // Add 10 viewers - should all succeed
      for (const playerId of viewers) {
        const balance = await sessionUrlService.getPlayerBalance(mockSession.id, playerId);
        expect(balance.sessionActive).toBe(true);
      }

      expect(sessionUrlService.getSessionViewerCount(mockSession.id)).toBe(10);

      // 11th viewer should be rejected
      await expect(
        sessionUrlService.getPlayerBalance(mockSession.id, 'player-11')
      ).rejects.toThrow('Maximum number of viewers (10) reached for this session');

      expect(sessionUrlService.getSessionViewerCount(mockSession.id)).toBe(10);

      // Existing viewer should still be able to refresh
      const refreshedBalance = await sessionUrlService.getPlayerBalance(mockSession.id, 'player-1');
      expect(refreshedBalance.sessionActive).toBe(true);
      expect(sessionUrlService.getSessionViewerCount(mockSession.id)).toBe(10); // Should not increase
    });
  });

  // AC: 2, 4 - Mobile web page works on iOS Safari and Android Chrome
  describe('Cross-Browser Compatibility', () => {
    it('should generate compatible web URLs for mobile browsers', async () => {
      const sessionUrl = await sessionUrlService.generateSessionUrl(mockSession.id, 'player-1');
      const webUrl = sessionUrlService.generateWebUrl(mockSession.id, 'player-1');

      // URL should be properly formatted for mobile browsers
      expect(webUrl).toBe('https://pokepot.local/session/session-123/player/player-1');
      expect(sessionUrl.expiresWhenSessionEnds).toBe(true);

      // Web URL should provide balance data compatible with mobile browsers
      const balanceData = await sessionUrlService.getPlayerBalance(mockSession.id, 'player-1');
      expect(balanceData.playerName).toBe('Alice');
      expect(balanceData.balance).toBe(150);
      expect(balanceData.sessionName).toBe('Friday Night Poker');
    });
  });

  // AC: 3 - Manual refresh functionality
  describe('Manual Refresh Functionality', () => {
    it('should handle multiple manual refreshes correctly', async () => {
      // First access
      const firstAccess = await sessionUrlService.getPlayerBalance(mockSession.id, 'player-1');
      expect(firstAccess.balance).toBe(150);

      // Manual refresh (should work without issues)
      const secondAccess = await sessionUrlService.getPlayerBalance(mockSession.id, 'player-1');
      expect(secondAccess.balance).toBe(150);
      expect(secondAccess.sessionActive).toBe(true);

      // Should not increase viewer count for same player
      expect(sessionUrlService.getSessionViewerCount(mockSession.id)).toBe(1);
    });

    it('should handle concurrent manual refreshes from multiple viewers', async () => {
      const refreshPromises = mockPlayers.map(player => 
        sessionUrlService.getPlayerBalance(mockSession.id, player.id)
      );

      const results = await Promise.all(refreshPromises);

      expect(results).toHaveLength(4);
      expect(results[0].playerName).toBe('Alice');
      expect(results[1].playerName).toBe('Bob');
      expect(results[2].playerName).toBe('Charlie');
      expect(results[3].playerName).toBe('Diana');

      expect(sessionUrlService.getSessionViewerCount(mockSession.id)).toBe(4);
    });
  });

  // AC: 5 - Session URL expires when organizer ends session
  describe('Session Expiration Handling', () => {
    it('should handle graceful session expiration for all viewers', async () => {
      // Add multiple viewers
      await sessionUrlService.getPlayerBalance(mockSession.id, 'player-1');
      await sessionUrlService.getPlayerBalance(mockSession.id, 'player-2');
      await sessionUrlService.getPlayerBalance(mockSession.id, 'player-3');

      expect(sessionUrlService.getSessionViewerCount(mockSession.id)).toBe(3);

      // Session ends
      const completedSession = { ...mockSession, status: 'completed' as const };
      jest.spyOn(sessionService, 'getSession').mockResolvedValue(completedSession);
      jest.spyOn(sessionService, 'getSessionState').mockResolvedValue({
        session: completedSession,
        players: mockPlayers,
        canStart: false,
        canComplete: false
      });

      // All URLs should become invalid
      const validationResults = await Promise.all([
        sessionUrlService.validateSessionUrl(mockSession.id, 'player-1'),
        sessionUrlService.validateSessionUrl(mockSession.id, 'player-2'),
        sessionUrlService.validateSessionUrl(mockSession.id, 'player-3')
      ]);

      expect(validationResults).toEqual([false, false, false]);

      // Cleanup should remove all viewers
      await sessionUrlService.cleanupSessionViewers(mockSession.id);
      expect(sessionUrlService.getSessionViewerCount(mockSession.id)).toBe(0);

      // Attempting to get balance should fail
      await expect(
        sessionUrlService.getPlayerBalance(mockSession.id, 'player-1')
      ).rejects.toThrow('Session has ended or player not found');
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle invalid session gracefully', async () => {
      jest.spyOn(sessionService, 'getSession').mockResolvedValue(null);

      await expect(
        sessionUrlService.generateSessionUrl('invalid-session', 'player-1')
      ).rejects.toThrow('Session invalid-session not found');

      const validationResult = await sessionUrlService.validateSessionUrl('invalid-session', 'player-1');
      expect(validationResult).toBe(false);
    });

    it('should handle invalid player gracefully', async () => {
      await expect(
        sessionUrlService.generateSessionUrl(mockSession.id, 'invalid-player')
      ).rejects.toThrow('Player invalid-player not found in session');

      const validationResult = await sessionUrlService.validateSessionUrl(mockSession.id, 'invalid-player');
      expect(validationResult).toBe(false);
    });
  });

  describe('Stale Viewer Cleanup', () => {
    it('should cleanup viewers that have been inactive for over 1 hour', async () => {
      // Add viewers
      await sessionUrlService.getPlayerBalance(mockSession.id, 'player-1');
      await sessionUrlService.getPlayerBalance(mockSession.id, 'player-2');

      expect(sessionUrlService.getSessionViewerCount(mockSession.id)).toBe(2);

      // Manually set one viewer to be stale (older than 1 hour)
      const viewers = (sessionUrlService as any).viewers;
      const viewer = viewers.get('session-123_player-1');
      if (viewer) {
        viewer.lastRefreshAt = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
      }

      // Cleanup stale viewers
      sessionUrlService.cleanupStaleViewers();

      // Only active viewer should remain
      expect(sessionUrlService.getSessionViewerCount(mockSession.id)).toBe(1);
    });
  });

  describe('Session Web Info', () => {
    it('should provide session information for web display', async () => {
      const webInfo = await sessionUrlService.getSessionWebInfo(mockSession.id);

      expect(webInfo).toEqual({
        sessionName: 'Friday Night Poker',
        sessionActive: true
      });
    });

    it('should return null for non-existent session', async () => {
      jest.spyOn(sessionService, 'getSession').mockResolvedValue(null);

      const webInfo = await sessionUrlService.getSessionWebInfo('invalid-session');
      expect(webInfo).toBeNull();
    });
  });
});