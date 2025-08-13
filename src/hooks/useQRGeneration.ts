/**
 * useQRGeneration - Hook for managing QR code generation and session lifecycle
 * Implements Story 2.4 requirements for session expiration and viewer management
 */
import { useState, useEffect, useCallback } from 'react';
import { SessionUrlService } from '../services/integration/SessionUrlService';
import { SessionService } from '../services/core/SessionService';
import { Session } from '../types/session';
import { Player } from '../types/player';
import { ServiceError } from '../services/core/ServiceError';

export interface QRGenerationState {
  qrCodes: QRCodeData[];
  loading: boolean;
  error: string | null;
  viewerCount: number;
  sessionActive: boolean;
}

export interface QRCodeData {
  playerId: string;
  playerName: string;
  qrValue: string;
  webUrl: string;
}

export interface UseQRGenerationOptions {
  session: Session;
  players: Player[];
  onSessionExpired?: () => void;
  onError?: (error: string) => void;
}

export function useQRGeneration({
  session,
  players,
  onSessionExpired,
  onError
}: UseQRGenerationOptions) {
  const [state, setState] = useState<QRGenerationState>({
    qrCodes: [],
    loading: false,
    error: null,
    viewerCount: 0,
    sessionActive: session.status === 'active'
  });

  const sessionUrlService = SessionUrlService.getInstance();
  const sessionService = SessionService.getInstance();

  /**
   * Generate QR codes for all players
   * AC: 1 - QR code displays prominently on session screen with session URL
   */
  const generateQRCodes = useCallback(async () => {
    if (!state.sessionActive) {
      setState(prev => ({
        ...prev,
        error: 'Cannot generate QR codes for inactive session',
        qrCodes: []
      }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const codes: QRCodeData[] = [];

      for (const player of players) {
        try {
          await sessionUrlService.generateSessionUrl(session.id, player.id);
          const webUrl = sessionUrlService.generateWebUrl(session.id, player.id);
          
          codes.push({
            playerId: player.id,
            playerName: player.name,
            qrValue: webUrl,
            webUrl: webUrl
          });
        } catch (error) {
          console.warn(`Failed to generate QR code for player ${player.name}:`, error);
          if (error instanceof ServiceError) {
            onError?.(`QR generation failed for ${player.name}: ${error.message}`);
          }
        }
      }

      setState(prev => ({
        ...prev,
        qrCodes: codes,
        loading: false,
        viewerCount: sessionUrlService.getSessionViewerCount(session.id)
      }));
    } catch (error) {
      const errorMessage = error instanceof ServiceError 
        ? error.message 
        : 'Failed to generate QR codes';
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      
      onError?.(errorMessage);
    }
  }, [session.id, players, state.sessionActive, sessionUrlService, onError]);

  /**
   * Update viewer count
   * AC: 6 - Maximum 10 concurrent viewers supported
   */
  const updateViewerCount = useCallback(() => {
    const count = sessionUrlService.getSessionViewerCount(session.id);
    setState(prev => ({ ...prev, viewerCount: count }));
  }, [session.id, sessionUrlService]);

  /**
   * Handle session expiration
   * AC: 5 - Session URL expires when organizer ends session
   */
  const handleSessionExpiration = useCallback(async () => {
    try {
      await sessionUrlService.cleanupSessionViewers(session.id);
      setState(prev => ({
        ...prev,
        sessionActive: false,
        qrCodes: [],
        viewerCount: 0,
        error: 'Session has ended - QR codes are no longer valid'
      }));
      onSessionExpired?.();
    } catch (error) {
      console.warn('Failed to cleanup session viewers:', error);
    }
  }, [session.id, sessionUrlService, onSessionExpired]);

  /**
   * Refresh QR codes and viewer count
   */
  const refreshQRCodes = useCallback(async () => {
    await generateQRCodes();
  }, [generateQRCodes]);

  /**
   * Check if session is still active
   */
  const checkSessionStatus = useCallback(async () => {
    try {
      const currentSession = await sessionService.getSession(session.id);
      const isActive = currentSession?.status === 'active';
      
      if (state.sessionActive && !isActive) {
        handleSessionExpiration();
      }
      
      setState(prev => ({ ...prev, sessionActive: isActive }));
    } catch (error) {
      console.warn('Failed to check session status:', error);
    }
  }, [session.id, sessionService, state.sessionActive, handleSessionExpiration]);

  /**
   * Clean up stale viewers
   */
  const cleanupStaleViewers = useCallback(() => {
    sessionUrlService.cleanupStaleViewers();
    updateViewerCount();
  }, [sessionUrlService, updateViewerCount]);

  // Monitor session status changes
  useEffect(() => {
    setState(prev => ({
      ...prev,
      sessionActive: session.status === 'active'
    }));

    if (session.status !== 'active') {
      handleSessionExpiration();
    }
  }, [session.status, handleSessionExpiration]);

  // Generate QR codes when session becomes active or players change
  useEffect(() => {
    if (state.sessionActive && players.length > 0) {
      generateQRCodes();
    }
  }, [state.sessionActive, players.length, generateQRCodes]);

  // Set up periodic tasks
  useEffect(() => {
    if (!state.sessionActive) return;

    const interval = setInterval(() => {
      // Check session status every 30 seconds
      checkSessionStatus();
      
      // Update viewer count
      updateViewerCount();
      
      // Clean up stale viewers
      cleanupStaleViewers();
    }, 30000);

    return () => clearInterval(interval);
  }, [state.sessionActive, checkSessionStatus, updateViewerCount, cleanupStaleViewers]);

  // Initial viewer count update
  useEffect(() => {
    if (state.sessionActive) {
      updateViewerCount();
    }
  }, [state.sessionActive, updateViewerCount]);

  return {
    ...state,
    generateQRCodes,
    refreshQRCodes,
    updateViewerCount,
    cleanupStaleViewers,
    handleSessionExpiration
  };
}