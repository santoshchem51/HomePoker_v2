/**
 * usePlayerSelection Hook
 * Story 2.3: Enhanced Touch Interface for Buy-ins - Custom hook for player selection
 * 
 * Manages player selection state with gesture support and swipe navigation
 */
import { useState, useEffect, useCallback } from 'react';
import { SessionService } from '../services/core/SessionService';
import { HapticService } from '../services/integration/HapticService';
import { Player } from '../types/player';

interface UsePlayerSelectionProps {
  sessionId: string;
  onError?: (error: string) => void;
}

interface UsePlayerSelectionReturn {
  players: Player[];
  selectedPlayerId: string | null;
  selectedPlayerIndex: number;
  loading: boolean;
  refreshing: boolean;
  selectPlayer: (playerId: string) => void;
  selectPlayerByIndex: (index: number) => void;
  navigateToNext: () => void;
  navigateToPrevious: () => void;
  refreshPlayers: () => Promise<void>;
  getPlayerById: (playerId: string) => Player | undefined;
  canNavigateNext: boolean;
  canNavigatePrevious: boolean;
}

export const usePlayerSelection = ({
  sessionId,
  onError,
}: UsePlayerSelectionProps): UsePlayerSelectionReturn => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const sessionService = SessionService.getInstance();
  const hapticService = HapticService.getInstance();

  /**
   * Load players from session
   */
  const loadPlayers = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      }
      
      const sessionState = await sessionService.getSessionState(sessionId);
      if (sessionState) {
        // Filter out cashed out players for easier navigation
        const activePlayers = sessionState.players.filter(p => p.status === 'active');
        setPlayers(activePlayers);
        
        // If current selection is no longer valid, clear it
        if (selectedPlayerId && !activePlayers.find(p => p.id === selectedPlayerId)) {
          setSelectedPlayerId(null);
        }
      } else {
        setPlayers([]);
        setSelectedPlayerId(null);
        onError?.('Session not found');
      }
    } catch (error) {
      console.error('Failed to load players:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load players';
      onError?.(errorMessage);
      setPlayers([]);
      setSelectedPlayerId(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sessionId, selectedPlayerId, sessionService, onError]);

  /**
   * Initial load
   */
  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  /**
   * Get selected player index
   */
  const selectedPlayerIndex = selectedPlayerId 
    ? players.findIndex(p => p.id === selectedPlayerId)
    : -1;

  /**
   * Select player by ID
   */
  const selectPlayer = useCallback((playerId: string) => {
    if (players.find(p => p.id === playerId)) {
      setSelectedPlayerId(playerId);
      hapticService.light(); // Light haptic feedback
    }
  }, [players, hapticService]);

  /**
   * Select player by index
   */
  const selectPlayerByIndex = useCallback((index: number) => {
    if (index >= 0 && index < players.length) {
      setSelectedPlayerId(players[index].id);
      hapticService.light(); // Light haptic feedback
    }
  }, [players, hapticService]);

  /**
   * Navigate to next player
   */
  const navigateToNext = useCallback(() => {
    if (players.length === 0) return;
    
    const currentIndex = selectedPlayerIndex;
    const nextIndex = currentIndex >= players.length - 1 ? 0 : currentIndex + 1;
    
    selectPlayerByIndex(nextIndex);
    hapticService.medium(); // Medium feedback for navigation
  }, [players.length, selectedPlayerIndex, selectPlayerByIndex, hapticService]);

  /**
   * Navigate to previous player
   */
  const navigateToPrevious = useCallback(() => {
    if (players.length === 0) return;
    
    const currentIndex = selectedPlayerIndex;
    const previousIndex = currentIndex <= 0 ? players.length - 1 : currentIndex - 1;
    
    selectPlayerByIndex(previousIndex);
    hapticService.medium(); // Medium feedback for navigation
  }, [players.length, selectedPlayerIndex, selectPlayerByIndex, hapticService]);

  /**
   * Refresh players
   */
  const refreshPlayers = useCallback(() => loadPlayers(true), [loadPlayers]);

  /**
   * Get player by ID
   */
  const getPlayerById = useCallback((playerId: string): Player | undefined => {
    return players.find(p => p.id === playerId);
  }, [players]);

  /**
   * Navigation capabilities
   */
  const canNavigateNext = players.length > 1;
  const canNavigatePrevious = players.length > 1;

  return {
    players,
    selectedPlayerId,
    selectedPlayerIndex,
    loading,
    refreshing,
    selectPlayer,
    selectPlayerByIndex,
    navigateToNext,
    navigateToPrevious,
    refreshPlayers,
    getPlayerById,
    canNavigateNext,
    canNavigatePrevious,
  };
};