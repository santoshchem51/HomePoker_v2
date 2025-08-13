/**
 * useProfileSelection - Custom hook for profile selection and session integration
 * Implements Story 2.5: Player Profile Management (Simplified/PO-Revised Version)
 * 
 * Features:
 * - Profile selection integration with SessionService
 * - Guest vs saved player flow handling
 * - Error handling and loading states
 * - Seamless integration with existing session management
 */

import { useState, useCallback } from 'react';
import { SessionService } from '../services/core/SessionService';
import { Player } from '../types/player';
import { PlayerSelectionOption } from '../types/profile';
import { ServiceError } from '../services/core/ServiceError';

export interface UseProfileSelectionProps {
  sessionId: string;
  onPlayerAdded?: (player: Player) => void;
  onError?: (error: string) => void;
}

export interface UseProfileSelectionReturn {
  loading: boolean;
  addPlayerFromSelection: (selection: PlayerSelectionOption) => Promise<Player | null>;
  addPlayerFromProfile: (profileId: string) => Promise<Player | null>;
  addGuestPlayer: (guestName: string) => Promise<Player | null>;
}

export const useProfileSelection = ({
  sessionId,
  onPlayerAdded,
  onError
}: UseProfileSelectionProps): UseProfileSelectionReturn => {
  const [loading, setLoading] = useState(false);

  /**
   * Handle player addition from profile selection
   * AC: 4, 5 - Profile selection with data pre-fill and guest player flows
   */
  const addPlayerFromSelection = useCallback(async (
    selection: PlayerSelectionOption
  ): Promise<Player | null> => {
    if (!sessionId) {
      const error = 'Session ID is required';
      onError?.(error);
      return null;
    }

    setLoading(true);
    try {
      const sessionService = SessionService.getInstance();
      let player: Player;

      if (selection.type === 'profile' && selection.profile) {
        // Add player from saved profile
        player = await sessionService.addPlayerFromProfile(sessionId, selection.profile.id);
      } else if (selection.type === 'guest' && selection.guestData) {
        // Add guest player
        player = await sessionService.addGuestPlayer(sessionId, selection.guestData.name);
      } else {
        const error = 'Invalid selection data';
        onError?.(error);
        return null;
      }

      onPlayerAdded?.(player);
      return player;
    } catch (error) {
      console.error('Failed to add player from selection:', error);
      
      let errorMessage = 'Failed to add player to session';
      if (error instanceof ServiceError) {
        switch (error.code) {
          case 'DUPLICATE_PLAYER_NAME':
            errorMessage = 'A player with this name is already in the session';
            break;
          case 'VALIDATION_ERROR':
            errorMessage = error.message;
            break;
          case 'SESSION_ALREADY_STARTED':
            errorMessage = 'Cannot add players to a session that has already started';
            break;
          case 'PROFILE_NOT_FOUND':
            errorMessage = 'Selected profile no longer exists';
            break;
          default:
            errorMessage = error.message;
        }
      }

      onError?.(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [sessionId, onPlayerAdded, onError]);

  /**
   * Add player directly from profile ID
   * AC: 4 - Profile selection with profile data pre-fill
   */
  const addPlayerFromProfile = useCallback(async (profileId: string): Promise<Player | null> => {
    if (!sessionId || !profileId) {
      const error = 'Session ID and Profile ID are required';
      onError?.(error);
      return null;
    }

    setLoading(true);
    try {
      const sessionService = SessionService.getInstance();
      const player = await sessionService.addPlayerFromProfile(sessionId, profileId);
      
      onPlayerAdded?.(player);
      return player;
    } catch (error) {
      console.error('Failed to add player from profile:', error);
      
      let errorMessage = 'Failed to add player from profile';
      if (error instanceof ServiceError) {
        switch (error.code) {
          case 'DUPLICATE_PLAYER_NAME':
            errorMessage = 'A player with this name is already in the session';
            break;
          case 'PROFILE_NOT_FOUND':
            errorMessage = 'Profile not found';
            break;
          case 'SESSION_ALREADY_STARTED':
            errorMessage = 'Cannot add players to a session that has already started';
            break;
          case 'VALIDATION_ERROR':
            errorMessage = error.message;
            break;
          default:
            errorMessage = error.message;
        }
      }

      onError?.(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [sessionId, onPlayerAdded, onError]);

  /**
   * Add guest player directly
   * AC: 5 - Guest player quick-add functionality
   */
  const addGuestPlayer = useCallback(async (guestName: string): Promise<Player | null> => {
    if (!sessionId || !guestName?.trim()) {
      const error = 'Session ID and guest name are required';
      onError?.(error);
      return null;
    }

    setLoading(true);
    try {
      const sessionService = SessionService.getInstance();
      const player = await sessionService.addGuestPlayer(sessionId, guestName.trim());
      
      onPlayerAdded?.(player);
      return player;
    } catch (error) {
      console.error('Failed to add guest player:', error);
      
      let errorMessage = 'Failed to add guest player';
      if (error instanceof ServiceError) {
        switch (error.code) {
          case 'DUPLICATE_PLAYER_NAME':
            errorMessage = 'A player with this name is already in the session';
            break;
          case 'SESSION_ALREADY_STARTED':
            errorMessage = 'Cannot add players to a session that has already started';
            break;
          case 'VALIDATION_ERROR':
            errorMessage = error.message;
            break;
          default:
            errorMessage = error.message;
        }
      }

      onError?.(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [sessionId, onPlayerAdded, onError]);

  return {
    loading,
    addPlayerFromSelection,
    addPlayerFromProfile,
    addGuestPlayer
  };
};