/**
 * useQRGeneration hook tests - Testing QR code generation hook functionality
 * Tests all acceptance criteria from Story 2.4
 */
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useQRGeneration } from '../../../src/hooks/useQRGeneration';
import { SessionUrlService } from '../../../src/services/integration/SessionUrlService';
import { SessionService } from '../../../src/services/core/SessionService';
import { Session } from '../../../src/types/session';
import { Player } from '../../../src/types/player';

// Mock services
jest.mock('../../../src/services/integration/SessionUrlService');
jest.mock('../../../src/services/core/SessionService');

describe('useQRGeneration', () => {
  let mockSessionUrlService: jest.Mocked<SessionUrlService>;
  let mockSessionService: jest.Mocked<SessionService>;

  const mockSession: Session = {
    id: 'session-123',
    name: 'Test Session',
    organizerId: 'organizer-123',
    status: 'active',
    createdAt: new Date('2025-01-01T10:00:00Z'),
    startedAt: new Date('2025-01-01T10:05:00Z'),
    totalPot: 500,
    playerCount: 2
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

  const defaultOptions = {
    session: mockSession,
    players: mockPlayers,
    onSessionExpired: jest.fn(),
    onError: jest.fn()
  };

  beforeEach(() => {
    mockSessionUrlService = {
      generateSessionUrl: jest.fn(),
      generateWebUrl: jest.fn(),
      getSessionViewerCount: jest.fn(),
      cleanupSessionViewers: jest.fn(),
      cleanupStaleViewers: jest.fn(),
      getInstance: jest.fn()
    } as any;

    mockSessionService = {
      getSession: jest.fn(),
      getInstance: jest.fn()
    } as any;

    (SessionUrlService.getInstance as jest.Mock).mockReturnValue(mockSessionUrlService);
    (SessionService.getInstance as jest.Mock).mockReturnValue(mockSessionService);

    jest.clearAllMocks();
  });

  // AC: 1 - QR code displays prominently on session screen with session URL
  describe('QR Code Generation', () => {
    it('should generate QR codes for active session with players', async () => {
      mockSessionUrlService.generateSessionUrl.mockResolvedValue({
        url: 'pokepot://session/session-123/player/player-1',
        sessionId: 'session-123',
        playerId: 'player-1',
        createdAt: new Date(),
        expiresWhenSessionEnds: true
      });
      mockSessionUrlService.generateWebUrl.mockReturnValue('https://pokepot.local/session/session-123/player/player-1');
      mockSessionUrlService.getSessionViewerCount.mockReturnValue(0);

      const { result } = renderHook(() => useQRGeneration(defaultOptions));

      await waitFor(() => {
        expect(result.current.qrCodes).toHaveLength(2);
      });

      expect(result.current.qrCodes[0]).toEqual({
        playerId: 'player-1',
        playerName: 'Alice',
        qrValue: 'https://pokepot.local/session/session-123/player/player-1',
        webUrl: 'https://pokepot.local/session/session-123/player/player-1'
      });

      expect(mockSessionUrlService.generateSessionUrl).toHaveBeenCalledTimes(2);
    });

    it('should not generate QR codes for inactive session', async () => {
      const inactiveSession = { ...mockSession, status: 'completed' as const };
      const options = { ...defaultOptions, session: inactiveSession };

      const { result } = renderHook(() => useQRGeneration(options));

      await waitFor(() => {
        expect(result.current.sessionActive).toBe(false);
      });

      expect(result.current.qrCodes).toHaveLength(0);
      expect(result.current.error).toBe('Cannot generate QR codes for inactive session');
    });

    it('should handle QR generation errors gracefully', async () => {
      mockSessionUrlService.generateSessionUrl.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useQRGeneration(defaultOptions));

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to generate QR codes');
      });

      expect(defaultOptions.onError).toHaveBeenCalledWith('Failed to generate QR codes');
    });
  });

  // AC: 6 - Maximum 10 concurrent viewers supported
  describe('Viewer Count Management', () => {
    it('should track viewer count', async () => {
      mockSessionUrlService.getSessionViewerCount.mockReturnValue(5);

      const { result } = renderHook(() => useQRGeneration(defaultOptions));

      await act(async () => {
        result.current.updateViewerCount();
      });

      expect(result.current.viewerCount).toBe(5);
    });

    it('should update viewer count periodically', async () => {
      jest.useFakeTimers();
      mockSessionUrlService.generateSessionUrl.mockResolvedValue({
        url: 'pokepot://session/session-123/player/player-1',
        sessionId: 'session-123',
        playerId: 'player-1',
        createdAt: new Date(),
        expiresWhenSessionEnds: true
      });
      mockSessionUrlService.generateWebUrl.mockReturnValue('https://pokepot.local/session/session-123/player/player-1');
      mockSessionUrlService.getSessionViewerCount.mockReturnValue(3);
      mockSessionService.getSession.mockResolvedValue(mockSession);

      renderHook(() => useQRGeneration(defaultOptions));

      // Fast-forward 30 seconds
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      await waitFor(() => {
        expect(mockSessionUrlService.cleanupStaleViewers).toHaveBeenCalled();
      });

      jest.useRealTimers();
    });
  });

  // AC: 5 - Session URL expires when organizer ends session
  describe('Session Expiration Handling', () => {
    it('should handle session expiration when status changes', async () => {
      const { result, rerender } = renderHook(
        (props) => useQRGeneration(props),
        { initialProps: defaultOptions }
      );

      // Session becomes completed
      const expiredOptions = {
        ...defaultOptions,
        session: { ...mockSession, status: 'completed' as const }
      };

      rerender(expiredOptions);

      await waitFor(() => {
        expect(result.current.sessionActive).toBe(false);
      });

      expect(mockSessionUrlService.cleanupSessionViewers).toHaveBeenCalledWith('session-123');
      expect(defaultOptions.onSessionExpired).toHaveBeenCalled();
    });

    it('should monitor session status and handle expiration', async () => {
      jest.useFakeTimers();
      mockSessionService.getSession.mockResolvedValue(mockSession);
      mockSessionUrlService.generateSessionUrl.mockResolvedValue({
        url: 'pokepot://session/session-123/player/player-1',
        sessionId: 'session-123',
        playerId: 'player-1',
        createdAt: new Date(),
        expiresWhenSessionEnds: true
      });
      mockSessionUrlService.generateWebUrl.mockReturnValue('https://pokepot.local/session/session-123/player/player-1');

      renderHook(() => useQRGeneration(defaultOptions));

      // Mock session becoming completed
      mockSessionService.getSession.mockResolvedValue({
        ...mockSession,
        status: 'completed'
      });

      // Fast-forward 30 seconds to trigger status check
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      await waitFor(() => {
        expect(mockSessionService.getSession).toHaveBeenCalledWith('session-123');
      });

      jest.useRealTimers();
    });

    it('should cleanup session viewers on expiration', async () => {
      const { result } = renderHook(() => useQRGeneration(defaultOptions));

      await act(async () => {
        await result.current.handleSessionExpiration();
      });

      expect(mockSessionUrlService.cleanupSessionViewers).toHaveBeenCalledWith('session-123');
      expect(result.current.sessionActive).toBe(false);
      expect(result.current.qrCodes).toHaveLength(0);
      expect(defaultOptions.onSessionExpired).toHaveBeenCalled();
    });
  });

  describe('Refresh Functionality', () => {
    it('should refresh QR codes', async () => {
      mockSessionUrlService.generateSessionUrl.mockResolvedValue({
        url: 'pokepot://session/session-123/player/player-1',
        sessionId: 'session-123',
        playerId: 'player-1',
        createdAt: new Date(),
        expiresWhenSessionEnds: true
      });
      mockSessionUrlService.generateWebUrl.mockReturnValue('https://pokepot.local/session/session-123/player/player-1');

      const { result } = renderHook(() => useQRGeneration(defaultOptions));

      await act(async () => {
        await result.current.refreshQRCodes();
      });

      expect(mockSessionUrlService.generateSessionUrl).toHaveBeenCalled();
    });
  });

  describe('Stale Viewer Cleanup', () => {
    it('should cleanup stale viewers', async () => {
      const { result } = renderHook(() => useQRGeneration(defaultOptions));

      await act(async () => {
        result.current.cleanupStaleViewers();
      });

      expect(mockSessionUrlService.cleanupStaleViewers).toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('should show loading state during QR generation', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      mockSessionUrlService.generateSessionUrl.mockReturnValue(promise);

      const { result } = renderHook(() => useQRGeneration(defaultOptions));

      expect(result.current.loading).toBe(true);

      act(() => {
        resolvePromise!({
          url: 'pokepot://session/session-123/player/player-1',
          sessionId: 'session-123',
          playerId: 'player-1',
          createdAt: new Date(),
          expiresWhenSessionEnds: true
        });
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('Player Changes', () => {
    it('should regenerate QR codes when players change', async () => {
      mockSessionUrlService.generateSessionUrl.mockResolvedValue({
        url: 'pokepot://session/session-123/player/player-1',
        sessionId: 'session-123',
        playerId: 'player-1',
        createdAt: new Date(),
        expiresWhenSessionEnds: true
      });
      mockSessionUrlService.generateWebUrl.mockReturnValue('https://pokepot.local/session/session-123/player/player-1');

      const { rerender } = renderHook(
        (props) => useQRGeneration(props),
        { initialProps: defaultOptions }
      );

      // Change players
      const newPlayers = [...mockPlayers, {
        id: 'player-3',
        sessionId: 'session-123',
        name: 'Charlie',
        isGuest: true,
        currentBalance: 0,
        totalBuyIns: 50,
        totalCashOuts: 0,
        status: 'active' as const,
        joinedAt: new Date()
      }];

      rerender({ ...defaultOptions, players: newPlayers });

      await waitFor(() => {
        expect(mockSessionUrlService.generateSessionUrl).toHaveBeenCalledWith('session-123', 'player-3');
      });
    });
  });
});