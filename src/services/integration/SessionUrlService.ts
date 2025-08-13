/**
 * SessionUrlService - Simple URL generation for QR code session joining
 * Implements simplified scope from Story 2.4 revision
 */
import { SessionService } from '../core/SessionService';
import { ServiceError } from '../core/ServiceError';
import { ErrorCode } from '../../types/errors';

export interface SessionUrl {
  url: string;
  sessionId: string;
  playerId: string;
  createdAt: Date;
  expiresWhenSessionEnds: boolean;
}

export interface SessionViewer {
  id: string;
  sessionId: string;
  playerId: string;
  accessedAt: Date;
  lastRefreshAt: Date;
}

export interface RefreshResponse {
  balance: number;
  sessionActive: boolean;
  lastUpdated: string;
  playerName: string;
  sessionName: string;
}

export class SessionUrlService {
  private static instance: SessionUrlService | null = null;
  private sessionService: SessionService;
  private viewers: Map<string, SessionViewer> = new Map();
  private readonly MAX_CONCURRENT_VIEWERS = 10;

  private constructor() {
    this.sessionService = SessionService.getInstance();
  }

  /**
   * Get singleton instance of SessionUrlService
   */
  public static getInstance(): SessionUrlService {
    if (!SessionUrlService.instance) {
      SessionUrlService.instance = new SessionUrlService();
    }
    return SessionUrlService.instance;
  }

  /**
   * Generate a simple session URL for QR code display
   * AC: 1, 5 - URL expires when organizer ends session
   */
  public async generateSessionUrl(sessionId: string, playerId: string): Promise<SessionUrl> {
    try {
      // Validate session exists and is active
      const session = await this.sessionService.getSession(sessionId);
      if (!session) {
        throw new ServiceError(ErrorCode.SESSION_NOT_FOUND, `Session ${sessionId} not found`);
      }

      if (session.status !== 'active') {
        throw new ServiceError(ErrorCode.VALIDATION_ERROR, 'Can only generate URLs for active sessions');
      }

      // Validate player exists in session
      const sessionState = await this.sessionService.getSessionState(sessionId);
      const player = sessionState?.players.find(p => p.id === playerId);
      if (!player) {
        throw new ServiceError(ErrorCode.VALIDATION_ERROR, `Player ${playerId} not found in session`);
      }

      // Generate simple URL structure
      const url = `pokepot://session/${sessionId}/player/${playerId}`;

      const sessionUrl: SessionUrl = {
        url,
        sessionId,
        playerId,
        createdAt: new Date(),
        expiresWhenSessionEnds: true
      };

      return sessionUrl;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError(ErrorCode.UNKNOWN_ERROR, `Failed to generate session URL: ${error}`);
    }
  }

  /**
   * Validate a session URL and check if session is still active
   * AC: 5 - Session URL expires when organizer ends session
   */
  public async validateSessionUrl(sessionId: string, playerId: string): Promise<boolean> {
    try {
      const session = await this.sessionService.getSession(sessionId);
      if (!session || session.status !== 'active') {
        return false;
      }

      const sessionState = await this.sessionService.getSessionState(sessionId);
      const player = sessionState?.players.find(p => p.id === playerId);
      return !!player;
    } catch (error) {
      console.warn('Session URL validation failed:', error);
      return false;
    }
  }

  /**
   * Get current balance for a player (manual refresh)
   * AC: 3 - Balance updates when organizer manually refreshes
   */
  public async getPlayerBalance(sessionId: string, playerId: string): Promise<RefreshResponse> {
    try {
      // Check concurrent viewer limit
      const currentViewers = Array.from(this.viewers.values()).filter(v => v.sessionId === sessionId);
      const existingViewer = this.viewers.get(`${sessionId}_${playerId}`);
      
      if (!existingViewer && currentViewers.length >= this.MAX_CONCURRENT_VIEWERS) {
        throw new ServiceError(ErrorCode.VALIDATION_ERROR, 'Maximum number of viewers (10) reached for this session');
      }

      // Validate session URL
      const isValid = await this.validateSessionUrl(sessionId, playerId);
      if (!isValid) {
        throw new ServiceError(ErrorCode.SESSION_NOT_FOUND, 'Session has ended or player not found');
      }

      // Get session and player data
      const session = await this.sessionService.getSession(sessionId);
      const sessionState = await this.sessionService.getSessionState(sessionId);
      const player = sessionState?.players.find(p => p.id === playerId);

      if (!session || !player) {
        throw new ServiceError(ErrorCode.SESSION_NOT_FOUND, 'Session or player not found');
      }

      // Track or update viewer
      const viewerId = `${sessionId}_${playerId}`;
      const viewer: SessionViewer = {
        id: viewerId,
        sessionId,
        playerId,
        accessedAt: existingViewer?.accessedAt || new Date(),
        lastRefreshAt: new Date()
      };
      this.viewers.set(viewerId, viewer);

      // Return balance response
      const response: RefreshResponse = {
        balance: player.currentBalance,
        sessionActive: session.status === 'active',
        lastUpdated: new Date().toISOString(),
        playerName: player.name,
        sessionName: session.name
      };

      return response;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError(ErrorCode.UNKNOWN_ERROR, `Failed to get player balance: ${error}`);
    }
  }

  /**
   * Get current viewer count for a session
   * AC: 6 - Maximum 10 concurrent viewers supported
   */
  public getSessionViewerCount(sessionId: string): number {
    return Array.from(this.viewers.values()).filter(v => v.sessionId === sessionId).length;
  }

  /**
   * Cleanup viewers when session ends
   * AC: 5, 6 - Session cleanup when organizer ends session
   */
  public async cleanupSessionViewers(sessionId: string): Promise<void> {
    try {
      // Remove all viewers for the session
      const viewersToRemove = Array.from(this.viewers.entries())
        .filter(([_, viewer]) => viewer.sessionId === sessionId)
        .map(([key, _]) => key);

      viewersToRemove.forEach(key => {
        this.viewers.delete(key);
      });
    } catch (error) {
      throw new ServiceError(ErrorCode.UNKNOWN_ERROR, `Failed to cleanup session viewers: ${error}`);
    }
  }

  /**
   * Generate web-accessible URL for mobile browsers
   * AC: 2, 4 - Mobile-optimized web page that works on iOS Safari and Android Chrome
   */
  public generateWebUrl(sessionId: string, playerId: string): string {
    // For the simplified scope, we'll generate a simple URL structure
    // In a real implementation, this would point to a hosted web page
    return `https://pokepot.local/session/${sessionId}/player/${playerId}`;
  }

  /**
   * Get session information for web display
   */
  public async getSessionWebInfo(sessionId: string): Promise<{sessionName: string, sessionActive: boolean} | null> {
    try {
      const session = await this.sessionService.getSession(sessionId);
      if (!session) {
        return null;
      }

      return {
        sessionName: session.name,
        sessionActive: session.status === 'active'
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Clean up stale viewers (older than 1 hour)
   */
  public cleanupStaleViewers(): void {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const staleViewers = Array.from(this.viewers.entries())
      .filter(([_, viewer]) => viewer.lastRefreshAt < oneHourAgo)
      .map(([key, _]) => key);

    staleViewers.forEach(key => {
      this.viewers.delete(key);
    });
  }
}