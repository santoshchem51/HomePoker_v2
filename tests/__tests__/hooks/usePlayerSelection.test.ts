/**
 * usePlayerSelection Hook Tests
 * Story 2.3: Enhanced Touch Interface for Buy-ins - Testing custom hook
 */
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { usePlayerSelection } from '../../../src/hooks/usePlayerSelection';
import { SessionService } from '../../../src/services/core/SessionService';
import { HapticService } from '../../../src/services/integration/HapticService';

// Mock dependencies
jest.mock('../../../src/services/core/SessionService');
jest.mock('../../../src/services/integration/HapticService');

const mockSessionService = {
  getSessionState: jest.fn(),
} as jest.Mocked<Partial<SessionService>>;

const mockHapticService = {
  light: jest.fn(),
  medium: jest.fn(),
} as jest.Mocked<Partial<HapticService>>;

(SessionService.getInstance as jest.Mock).mockReturnValue(mockSessionService);
(HapticService.getInstance as jest.Mock).mockReturnValue(mockHapticService);

describe('usePlayerSelection', () => {
  const mockPlayers = [
    {
      id: 'player-1',
      sessionId: 'test-session',
      name: 'John Doe',
      isGuest: true,
      currentBalance: 100,
      totalBuyIns: 100,
      totalCashOuts: 0,
      status: 'active' as const,
      joinedAt: new Date(),
    },
    {
      id: 'player-2',
      sessionId: 'test-session',
      name: 'Jane Smith',
      isGuest: true,
      currentBalance: 75,
      totalBuyIns: 75,
      totalCashOuts: 0,
      status: 'active' as const,
      joinedAt: new Date(),
    },
    {
      id: 'player-3',
      sessionId: 'test-session',
      name: 'Bob Johnson',
      isGuest: true,
      currentBalance: 0,
      totalBuyIns: 50,
      totalCashOuts: 50,
      status: 'cashed_out' as const,
      joinedAt: new Date(),
    },
  ];

  const mockSessionState = {
    session: {
      id: 'test-session',
      name: 'Test Session',
      organizerId: 'organizer-1',
      status: 'active' as const,
      totalPot: 225,
      playerCount: 3,
      createdAt: new Date(),
    },
    players: mockPlayers,
    canStart: true,
    canComplete: true,
  };

  const defaultProps = {
    sessionId: 'test-session',
    onError: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSessionService.getSessionState!.mockResolvedValue(mockSessionState);
  });

  describe('Initialization', () => {
    it('loads players on mount', async () => {
      const { result } = renderHook(() => usePlayerSelection(defaultProps));

      expect(result.current.loading).toBe(true);
      expect(result.current.players).toEqual([]);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockSessionService.getSessionState).toHaveBeenCalledWith('test-session');
      expect(result.current.players).toEqual([mockPlayers[0], mockPlayers[1]]); // Only active players
    });

    it('filters out cashed out players', async () => {
      const { result } = renderHook(() => usePlayerSelection(defaultProps));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.players).toHaveLength(2);
      expect(result.current.players.every(p => p.status === 'active')).toBe(true);
    });

    it('handles session not found', async () => {
      mockSessionService.getSessionState!.mockResolvedValue(null);

      const { result } = renderHook(() => usePlayerSelection(defaultProps));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.players).toEqual([]);
      expect(defaultProps.onError).toHaveBeenCalledWith('Session not found');
    });

    it('handles service errors', async () => {
      const error = new Error('Service error');
      mockSessionService.getSessionState!.mockRejectedValue(error);

      const { result } = renderHook(() => usePlayerSelection(defaultProps));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.players).toEqual([]);
      expect(defaultProps.onError).toHaveBeenCalledWith('Service error');
    });
  });

  describe('Player Selection', () => {
    it('selects player by ID', async () => {
      const { result } = renderHook(() => usePlayerSelection(defaultProps));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.selectPlayer('player-2');
      });

      expect(result.current.selectedPlayerId).toBe('player-2');
      expect(result.current.selectedPlayerIndex).toBe(1);
      expect(mockHapticService.light).toHaveBeenCalled();
    });

    it('does not select invalid player ID', async () => {
      const { result } = renderHook(() => usePlayerSelection(defaultProps));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.selectPlayer('invalid-player');
      });

      expect(result.current.selectedPlayerId).toBe(null);
      expect(mockHapticService.light).not.toHaveBeenCalled();
    });

    it('selects player by index', async () => {
      const { result } = renderHook(() => usePlayerSelection(defaultProps));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.selectPlayerByIndex(1);
      });

      expect(result.current.selectedPlayerId).toBe('player-2');
      expect(result.current.selectedPlayerIndex).toBe(1);
      expect(mockHapticService.light).toHaveBeenCalled();
    });

    it('does not select invalid index', async () => {
      const { result } = renderHook(() => usePlayerSelection(defaultProps));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.selectPlayerByIndex(5); // Invalid index
      });

      expect(result.current.selectedPlayerId).toBe(null);
      expect(mockHapticService.light).not.toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    it('navigates to next player', async () => {
      const { result } = renderHook(() => usePlayerSelection(defaultProps));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Select first player
      act(() => {
        result.current.selectPlayerByIndex(0);
      });

      // Navigate to next
      act(() => {
        result.current.navigateToNext();
      });

      expect(result.current.selectedPlayerId).toBe('player-2');
      expect(result.current.selectedPlayerIndex).toBe(1);
      expect(mockHapticService.medium).toHaveBeenCalled();
    });

    it('wraps to first player when navigating next from last', async () => {
      const { result } = renderHook(() => usePlayerSelection(defaultProps));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Select last player
      act(() => {
        result.current.selectPlayerByIndex(1);
      });

      // Navigate to next (should wrap to first)
      act(() => {
        result.current.navigateToNext();
      });

      expect(result.current.selectedPlayerId).toBe('player-1');
      expect(result.current.selectedPlayerIndex).toBe(0);
    });

    it('navigates to previous player', async () => {
      const { result } = renderHook(() => usePlayerSelection(defaultProps));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Select second player
      act(() => {
        result.current.selectPlayerByIndex(1);
      });

      // Navigate to previous
      act(() => {
        result.current.navigateToPrevious();
      });

      expect(result.current.selectedPlayerId).toBe('player-1');
      expect(result.current.selectedPlayerIndex).toBe(0);
      expect(mockHapticService.medium).toHaveBeenCalled();
    });

    it('wraps to last player when navigating previous from first', async () => {
      const { result } = renderHook(() => usePlayerSelection(defaultProps));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Select first player
      act(() => {
        result.current.selectPlayerByIndex(0);
      });

      // Navigate to previous (should wrap to last)
      act(() => {
        result.current.navigateToPrevious();
      });

      expect(result.current.selectedPlayerId).toBe('player-2');
      expect(result.current.selectedPlayerIndex).toBe(1);
    });

    it('does not navigate when no players', async () => {
      mockSessionService.getSessionState!.mockResolvedValue({
        ...mockSessionState,
        players: [],
      });

      const { result } = renderHook(() => usePlayerSelection(defaultProps));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.navigateToNext();
      });

      expect(result.current.selectedPlayerId).toBe(null);
      expect(mockHapticService.medium).not.toHaveBeenCalled();
    });
  });

  describe('Navigation Capabilities', () => {
    it('indicates navigation capabilities with multiple players', async () => {
      const { result } = renderHook(() => usePlayerSelection(defaultProps));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.canNavigateNext).toBe(true);
      expect(result.current.canNavigatePrevious).toBe(true);
    });

    it('indicates no navigation with single player', async () => {
      mockSessionService.getSessionState!.mockResolvedValue({
        ...mockSessionState,
        players: [mockPlayers[0]], // Only one active player
      });

      const { result } = renderHook(() => usePlayerSelection(defaultProps));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.canNavigateNext).toBe(false);
      expect(result.current.canNavigatePrevious).toBe(false);
    });

    it('indicates no navigation with no players', async () => {
      mockSessionService.getSessionState!.mockResolvedValue({
        ...mockSessionState,
        players: [],
      });

      const { result } = renderHook(() => usePlayerSelection(defaultProps));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.canNavigateNext).toBe(false);
      expect(result.current.canNavigatePrevious).toBe(false);
    });
  });

  describe('Utility Functions', () => {
    it('gets player by ID', async () => {
      const { result } = renderHook(() => usePlayerSelection(defaultProps));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const player = result.current.getPlayerById('player-1');
      expect(player).toEqual(mockPlayers[0]);
    });

    it('returns undefined for invalid player ID', async () => {
      const { result } = renderHook(() => usePlayerSelection(defaultProps));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const player = result.current.getPlayerById('invalid-id');
      expect(player).toBeUndefined();
    });

    it('refreshes players', async () => {
      const { result } = renderHook(() => usePlayerSelection(defaultProps));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Clear mock calls
      mockSessionService.getSessionState!.mockClear();

      act(() => {
        result.current.refreshPlayers();
      });

      expect(result.current.refreshing).toBe(true);
      
      await waitFor(() => {
        expect(result.current.refreshing).toBe(false);
      });

      expect(mockSessionService.getSessionState).toHaveBeenCalledTimes(1);
    });
  });

  describe('Selection State Management', () => {
    it('clears selection when selected player becomes invalid', async () => {
      const { result } = renderHook(() => usePlayerSelection(defaultProps));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Select a player
      act(() => {
        result.current.selectPlayer('player-1');
      });

      expect(result.current.selectedPlayerId).toBe('player-1');

      // Mock new session state without the selected player
      mockSessionService.getSessionState!.mockResolvedValue({
        ...mockSessionState,
        players: [mockPlayers[1]], // Only player-2
      });

      // Trigger refresh
      act(() => {
        result.current.refreshPlayers();
      });

      await waitFor(() => {
        expect(result.current.refreshing).toBe(false);
      });

      expect(result.current.selectedPlayerId).toBe(null);
    });

    it('maintains selection when player is still valid', async () => {
      const { result } = renderHook(() => usePlayerSelection(defaultProps));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Select a player
      act(() => {
        result.current.selectPlayer('player-1');
      });

      expect(result.current.selectedPlayerId).toBe('player-1');

      // Refresh with same players
      act(() => {
        result.current.refreshPlayers();
      });

      await waitFor(() => {
        expect(result.current.refreshing).toBe(false);
      });

      expect(result.current.selectedPlayerId).toBe('player-1');
    });
  });
});