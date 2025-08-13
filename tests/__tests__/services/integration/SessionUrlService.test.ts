/**
 * SessionUrlService tests - Testing QR code session URL functionality
 * Tests all acceptance criteria from Story 2.4
 */
import { SessionUrlService } from '../../../../src/services/integration/SessionUrlService';
import { SessionService } from '../../../../src/services/core/SessionService';
import { ServiceError } from '../../../../src/services/core/ServiceError';
import { ErrorCode } from '../../../../src/types/errors';
import { Session } from '../../../../src/types/session';
import { Player } from '../../../../src/types/player';

// Mock SessionService
jest.mock('../../../../src/services/core/SessionService');

describe('SessionUrlService', () => {
  let sessionUrlService: SessionUrlService;
  let mockSessionService: jest.Mocked<SessionService>;

  const mockSession: Session = {
    id: 'session-123',
    name: 'Test Session',
    organizerId: 'organizer-123',
    status: 'active',
    createdAt: new Date('2025-01-01T10:00:00Z'),
    startedAt: new Date('2025-01-01T10:05:00Z'),
    totalPot: 500,
    playerCount: 4
  };

  const mockPlayers: Player[] = [
    {
      id: 'player-1',
      sessionId: 'session-123',
      name: 'Alice',
      isGuest: true,
      currentBalance: 50,
      totalBuyIns: 100,
      totalCashOuts: 50,
      status: 'active',
      joinedAt: new Date('2025-01-01T10:00:00Z')
    },
    {
      id: 'player-2',
      sessionId: 'session-123',
      name: 'Bob',
      isGuest: true,
      currentBalance: -25,
      totalBuyIns: 75,
      totalCashOuts: 0,
      status: 'active',
      joinedAt: new Date('2025-01-01T10:01:00Z')
    }
  ];

  beforeEach(() => {
    // Clear singleton instance
    (SessionUrlService as any).instance = null;
    sessionUrlService = SessionUrlService.getInstance();

    // Setup mock SessionService
    mockSessionService = {
      getSession: jest.fn(),
      getSessionState: jest.fn(),
      getInstance: jest.fn()
    } as any;

    (SessionService.getInstance as jest.Mock).mockReturnValue(mockSessionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Clear viewers between tests
    (sessionUrlService as any).viewers.clear();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = SessionUrlService.getInstance();
      const instance2 = SessionUrlService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('generateSessionUrl', () => {
    // AC: 1, 5 - QR code displays prominently on session screen with session URL
    // URL expires when organizer ends session
    it('should generate URL for active session with valid player', async () => {
      mockSessionService.getSession.mockResolvedValue(mockSession);
      mockSessionService.getSessionState.mockResolvedValue({
        session: mockSession,
        players: mockPlayers,
        canStart: false,
        canComplete: true
      });

      const result = await sessionUrlService.generateSessionUrl('session-123', 'player-1');

      expect(result).toEqual({
        url: 'pokepot://session/session-123/player/player-1',
        sessionId: 'session-123',
        playerId: 'player-1',
        createdAt: expect.any(Date),
        expiresWhenSessionEnds: true
      });
    });

    it('should throw error for non-existent session', async () => {
      mockSessionService.getSession.mockResolvedValue(null);

      await expect(
        sessionUrlService.generateSessionUrl('invalid-session', 'player-1')
      ).rejects.toThrow(new ServiceError(ErrorCode.SESSION_NOT_FOUND, 'Session invalid-session not found'));
    });

    it('should throw error for inactive session', async () => {
      const inactiveSession = { ...mockSession, status: 'completed' as const };
      mockSessionService.getSession.mockResolvedValue(inactiveSession);

      await expect(
        sessionUrlService.generateSessionUrl('session-123', 'player-1')
      ).rejects.toThrow(new ServiceError(ErrorCode.VALIDATION_ERROR, 'Can only generate URLs for active sessions'));
    });

    it('should throw error for invalid player', async () => {
      mockSessionService.getSession.mockResolvedValue(mockSession);
      mockSessionService.getSessionState.mockResolvedValue({
        session: mockSession,
        players: mockPlayers,
        canStart: false,
        canComplete: true
      });

      await expect(
        sessionUrlService.generateSessionUrl('session-123', 'invalid-player')
      ).rejects.toThrow(new ServiceError(ErrorCode.VALIDATION_ERROR, 'Player invalid-player not found in session'));
    });
  });

  describe('validateSessionUrl', () => {
    // AC: 5 - Session URL expires when organizer ends session
    it('should return true for active session with valid player', async () => {
      mockSessionService.getSession.mockResolvedValue(mockSession);
      mockSessionService.getSessionState.mockResolvedValue({
        session: mockSession,
        players: mockPlayers,
        canStart: false,
        canComplete: true
      });

      const result = await sessionUrlService.validateSessionUrl('session-123', 'player-1');
      expect(result).toBe(true);
    });

    it('should return false for completed session', async () => {
      const completedSession = { ...mockSession, status: 'completed' as const };
      mockSessionService.getSession.mockResolvedValue(completedSession);

      const result = await sessionUrlService.validateSessionUrl('session-123', 'player-1');
      expect(result).toBe(false);
    });

    it('should return false for non-existent session', async () => {
      mockSessionService.getSession.mockResolvedValue(null);

      const result = await sessionUrlService.validateSessionUrl('invalid-session', 'player-1');
      expect(result).toBe(false);
    });

    it('should return false for invalid player', async () => {
      mockSessionService.getSession.mockResolvedValue(mockSession);
      mockSessionService.getSessionState.mockResolvedValue({
        session: mockSession,
        players: mockPlayers,
        canStart: false,
        canComplete: true
      });

      const result = await sessionUrlService.validateSessionUrl('session-123', 'invalid-player');
      expect(result).toBe(false);
    });
  });

  describe('getPlayerBalance', () => {
    // AC: 3 - Balance updates when organizer manually refreshes
    // AC: 6 - Maximum 10 concurrent viewers supported
    it('should return balance for valid session and player', async () => {
      mockSessionService.getSession.mockResolvedValue(mockSession);
      mockSessionService.getSessionState.mockResolvedValue({
        session: mockSession,
        players: mockPlayers,
        canStart: false,
        canComplete: true
      });

      const result = await sessionUrlService.getPlayerBalance('session-123', 'player-1');

      expect(result).toEqual({
        balance: 50,
        sessionActive: true,
        lastUpdated: expect.any(String),
        playerName: 'Alice',
        sessionName: 'Test Session'
      });
    });

    it('should enforce viewer limit of 10', async () => {
      mockSessionService.getSession.mockResolvedValue(mockSession);
      mockSessionService.getSessionState.mockResolvedValue({
        session: mockSession,
        players: mockPlayers,
        canStart: false,
        canComplete: true
      });

      // Add 10 viewers
      for (let i = 0; i < 10; i++) {
        await sessionUrlService.getPlayerBalance('session-123', `player-${i}`);
      }

      // 11th viewer should be rejected
      await expect(
        sessionUrlService.getPlayerBalance('session-123', 'player-11')
      ).rejects.toThrow(new ServiceError(ErrorCode.VALIDATION_ERROR, 'Maximum number of viewers (10) reached for this session'));
    });

    it('should allow existing viewer to refresh without counting against limit', async () => {
      mockSessionService.getSession.mockResolvedValue(mockSession);
      mockSessionService.getSessionState.mockResolvedValue({
        session: mockSession,
        players: mockPlayers,
        canStart: false,
        canComplete: true
      });

      // Add 10 viewers
      for (let i = 0; i < 10; i++) {
        await sessionUrlService.getPlayerBalance('session-123', `player-${i}`);
      }

      // Existing viewer should be able to refresh
      const result = await sessionUrlService.getPlayerBalance('session-123', 'player-1');
      expect(result.playerName).toBe('Alice');
    });

    it('should throw error for expired session', async () => {
      mockSessionService.getSession.mockResolvedValue(null);

      await expect(
        sessionUrlService.getPlayerBalance('session-123', 'player-1')
      ).rejects.toThrow(new ServiceError(ErrorCode.SESSION_NOT_FOUND, 'Session has ended or player not found'));
    });
  });

  describe('getSessionViewerCount', () => {
    // AC: 6 - Maximum 10 concurrent viewers supported
    it('should return correct viewer count', async () => {
      mockSessionService.getSession.mockResolvedValue(mockSession);
      mockSessionService.getSessionState.mockResolvedValue({
        session: mockSession,
        players: mockPlayers,
        canStart: false,
        canComplete: true
      });

      expect(sessionUrlService.getSessionViewerCount('session-123')).toBe(0);

      await sessionUrlService.getPlayerBalance('session-123', 'player-1');
      expect(sessionUrlService.getSessionViewerCount('session-123')).toBe(1);

      await sessionUrlService.getPlayerBalance('session-123', 'player-2');
      expect(sessionUrlService.getSessionViewerCount('session-123')).toBe(2);
    });
  });

  describe('cleanupSessionViewers', () => {
    // AC: 5, 6 - Session cleanup when organizer ends session
    it('should remove all viewers for a session', async () => {
      mockSessionService.getSession.mockResolvedValue(mockSession);
      mockSessionService.getSessionState.mockResolvedValue({
        session: mockSession,
        players: mockPlayers,
        canStart: false,
        canComplete: true
      });

      // Add some viewers
      await sessionUrlService.getPlayerBalance('session-123', 'player-1');
      await sessionUrlService.getPlayerBalance('session-123', 'player-2');
      expect(sessionUrlService.getSessionViewerCount('session-123')).toBe(2);

      // Cleanup session viewers
      await sessionUrlService.cleanupSessionViewers('session-123');
      expect(sessionUrlService.getSessionViewerCount('session-123')).toBe(0);
    });
  });

  describe('generateWebUrl', () => {
    // AC: 2, 4 - Mobile-optimized web page that works on iOS Safari and Android Chrome
    it('should generate web URL for mobile browsers', () => {
      const webUrl = sessionUrlService.generateWebUrl('session-123', 'player-1');
      expect(webUrl).toBe('https://pokepot.local/session/session-123/player/player-1');
    });
  });

  describe('getSessionWebInfo', () => {
    it('should return session info for web display', async () => {
      mockSessionService.getSession.mockResolvedValue(mockSession);

      const result = await sessionUrlService.getSessionWebInfo('session-123');
      expect(result).toEqual({
        sessionName: 'Test Session',
        sessionActive: true
      });
    });

    it('should return null for non-existent session', async () => {
      mockSessionService.getSession.mockResolvedValue(null);

      const result = await sessionUrlService.getSessionWebInfo('invalid-session');
      expect(result).toBeNull();
    });
  });

  describe('cleanupStaleViewers', () => {
    it('should remove viewers older than 1 hour', async () => {
      mockSessionService.getSession.mockResolvedValue(mockSession);
      mockSessionService.getSessionState.mockResolvedValue({
        session: mockSession,
        players: mockPlayers,
        canStart: false,
        canComplete: true
      });

      // Add a viewer
      await sessionUrlService.getPlayerBalance('session-123', 'player-1');
      expect(sessionUrlService.getSessionViewerCount('session-123')).toBe(1);

      // Manually set viewer to be stale (older than 1 hour)
      const viewers = (sessionUrlService as any).viewers;
      const viewer = viewers.get('session-123_player-1');
      viewer.lastRefreshAt = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago

      // Cleanup stale viewers
      sessionUrlService.cleanupStaleViewers();
      expect(sessionUrlService.getSessionViewerCount('session-123')).toBe(0);
    });
  });
});