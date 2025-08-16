/**
 * SessionService - Core business logic for session management
 * Implements Story 1.2 requirements for session creation and player management
 */
import { DatabaseService } from '../infrastructure/DatabaseService';
import { Session, CreateSessionRequest, SessionState } from '../../types/session';
import { Player, PlayerData } from '../../types/player';
import { ServiceError } from './ServiceError';
import { ErrorCode } from '../../types/errors';

export class SessionService {
  private static instance: SessionService | null = null;
  private dbService: DatabaseService;

  private constructor() {
    this.dbService = DatabaseService.getInstance();
  }

  /**
   * Get singleton instance of SessionService
   */
  public static getInstance(): SessionService {
    if (!SessionService.instance) {
      SessionService.instance = new SessionService();
    }
    return SessionService.instance;
  }

  /**
   * Create a new poker session with UUID v4 generation
   * AC: 1, 4, 5, 6
   */
  public async createSession(request: CreateSessionRequest): Promise<Session> {
    try {
      // Input validation
      if (!request.name || request.name.trim().length === 0) {
        throw new ServiceError('VALIDATION_ERROR', 'Session name is required');
      }
      if (request.name.trim().length > 50) {
        throw new ServiceError('VALIDATION_ERROR', 'Session name must be 50 characters or less');
      }
      if (!request.organizerId || request.organizerId.trim().length === 0) {
        throw new ServiceError('VALIDATION_ERROR', 'Organizer ID is required');
      }

      const sessionData = {
        name: request.name.trim(),
        organizerId: request.organizerId,
        status: 'created' as const,
        totalPot: 0,
        playerCount: 0
      };

      const session = await this.dbService.createSession(sessionData);
      return session;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError('SESSION_CREATION_FAILED', `Failed to create session: ${error}`);
    }
  }

  /**
   * Add a player to a session
   * AC: 2, 3
   */
  public async addPlayer(sessionId: string, playerData: PlayerData): Promise<Player> {
    try {
      // Validate inputs
      if (!sessionId) {
        throw new ServiceError('VALIDATION_ERROR', 'Session ID is required');
      }
      if (!playerData.name || playerData.name.trim().length === 0) {
        throw new ServiceError('VALIDATION_ERROR', 'Player name is required');
      }
      if (playerData.name.trim().length > 50) {
        throw new ServiceError('VALIDATION_ERROR', 'Player name must be 50 characters or less');
      }

      // Check if session exists and is in created status
      const session = await this.dbService.getSession(sessionId);
      
      if (!session) {
        throw new ServiceError('SESSION_NOT_FOUND', `Session ${sessionId} not found`);
      }

      if (session.status !== 'created') {
        throw new ServiceError('SESSION_ALREADY_STARTED', 'Cannot add players to a session that has already started');
      }

      // Check player count limits (4-8 players)
      const currentPlayers = await this.dbService.getPlayers(sessionId);
      if (currentPlayers.length >= 8) {
        throw new ServiceError('VALIDATION_ERROR', 'Session already has maximum of 8 players');
      }

      // Check for duplicate player names in this session
      const existingPlayer = currentPlayers.find(p => 
        p.name.toLowerCase() === playerData.name.trim().toLowerCase()
      );

      if (existingPlayer) {
        throw new ServiceError('DUPLICATE_PLAYER_NAME', 'A player with this name already exists in the session');
      }

      // Add player using DatabaseService
      const playerInput = {
        sessionId: sessionId,
        name: playerData.name.trim(),
        isGuest: playerData.isGuest ?? true,
        profileId: playerData.profileId,
        currentBalance: 0,
        totalBuyIns: 0,
        totalCashOuts: 0,
        status: 'active' as const
      };

      return await this.dbService.executeTransaction(async () => {
        // Add the player
        const player = await this.dbService.addPlayer(playerInput);
        
        // Update session player count
        await this.dbService.updateSession(sessionId, {
          playerCount: currentPlayers.length + 1
        });

        // Return player with initialBuyIn info for external transaction handling
        return {
          ...player,
          initialBuyIn: playerData.initialBuyIn
        };
      });
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError('PLAYER_ADDITION_FAILED', `Failed to add player: ${error}`);
    }
  }

  /**
   * Remove a player from a session
   * AC: 3
   */
  public async removePlayer(sessionId: string, playerId: string): Promise<void> {
    try {
      // Validate inputs
      if (!sessionId) {
        throw new ServiceError('VALIDATION_ERROR', 'Session ID is required');
      }
      if (!playerId) {
        throw new ServiceError('VALIDATION_ERROR', 'Player ID is required');
      }

      // Check if session exists and is in created status
      const session = await this.dbService.getSession(sessionId);
      
      if (!session) {
        throw new ServiceError('SESSION_NOT_FOUND', `Session ${sessionId} not found`);
      }

      if (session.status !== 'created') {
        throw new ServiceError('CANNOT_REMOVE_PLAYER', 'Cannot remove players from a session that has already started');
      }

      // Check if player exists in this session
      const currentPlayers = await this.dbService.getPlayers(sessionId);
      const playerExists = currentPlayers.some(p => p.id === playerId);
      
      if (!playerExists) {
        throw new ServiceError('PLAYER_NOT_FOUND', `Player ${playerId} not found in session`);
      }

      // Use transaction to ensure data consistency
      await this.dbService.executeTransaction(async () => {
        // Remove the player
        await this.dbService.removePlayer(playerId);
        
        // Update session player count
        await this.dbService.updateSession(sessionId, {
          playerCount: currentPlayers.length - 1
        });
      });

    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError('PLAYER_REMOVAL_FAILED', `Failed to remove player: ${error}`);
    }
  }

  /**
   * Update session status (created -> active -> completed)
   * AC: 6
   */
  public async updateSessionStatus(sessionId: string, newStatus: 'created' | 'active' | 'completed'): Promise<void> {
    try {
      if (!sessionId) {
        throw new ServiceError('VALIDATION_ERROR', 'Session ID is required');
      }

      const now = new Date();
      let updateData: any = { status: newStatus };

      switch (newStatus) {
        case 'active':
          updateData.startedAt = now;
          break;
        case 'completed':
          updateData.completedAt = now;
          break;
        case 'created':
          throw new ServiceError('VALIDATION_ERROR', 'Cannot revert session to created status');
        default:
          throw new ServiceError('VALIDATION_ERROR', 'Invalid session status');
      }

      await this.dbService.updateSession(sessionId, updateData);
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError('SESSION_UPDATE_FAILED', `Failed to update session status: ${error}`);
    }
  }

  /**
   * Get a session by ID with basic info
   * AC: 4, 5
   */
  public async getSession(sessionId: string): Promise<Session | null> {
    try {
      if (!sessionId) {
        throw new ServiceError('VALIDATION_ERROR', 'Session ID is required');
      }

      return await this.dbService.getSession(sessionId);
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError('SESSION_FETCH_FAILED', `Failed to get session: ${error}`);
    }
  }

  /**
   * Get complete session state including players
   * AC: 3, 6
   */
  public async getSessionState(sessionId: string): Promise<SessionState | null> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        return null;
      }

      // Get all players for this session using DatabaseService
      const players = await this.dbService.getPlayers(sessionId);

      const sessionState: SessionState = {
        session,
        players,
        canStart: session.status === 'created' && players.length >= 4,
        canComplete: session.status === 'active'
      };

      return sessionState;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError('SESSION_STATE_FETCH_FAILED', `Failed to get session state: ${error}`);
    }
  }

  /**
   * Delete a session manually with confirmation
   * Story 1.7: AC 2
   */
  public async deleteSession(sessionId: string): Promise<void> {
    try {
      if (!sessionId) {
        throw new ServiceError('VALIDATION_ERROR', 'Session ID is required');
      }

      const session = await this.getSession(sessionId);
      if (!session) {
        throw new ServiceError('SESSION_NOT_FOUND', `Session ${sessionId} not found`);
      }

      // Use SessionCleanupService for consistent deletion
      const SessionCleanupService = require('./SessionCleanupService').SessionCleanupService;
      const cleanupService = SessionCleanupService.getInstance();
      
      await cleanupService.deleteSessionManually(sessionId);
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError('SESSION_DELETE_FAILED', `Failed to delete session: ${error}`);
    }
  }

  /**
   * Mark session as exported
   * Story 1.7: AC 3
   */
  public async markSessionExported(sessionId: string, format: 'json' | 'csv' | 'whatsapp', filePath?: string): Promise<void> {
    try {
      const exportId = `export_${sessionId}_${Date.now()}`;
      const query = `
        INSERT INTO session_exports (
          id, session_id, export_format, file_path, exported_at
        ) VALUES (?, ?, ?, ?, ?)
      `;
      
      await this.dbService.executeQuery(query, [
        exportId,
        sessionId,
        format,
        filePath || null,
        new Date().toISOString()
      ]);

      // Update session export tracking
      await this.dbService.executeQuery(
        'UPDATE sessions SET exported_at = ?, export_format = ? WHERE id = ?',
        [new Date().toISOString(), format, sessionId]
      );

      // Cancel any cleanup warnings since session was exported
      const SessionCleanupService = require('./SessionCleanupService').SessionCleanupService;
      const cleanupService = SessionCleanupService.getInstance();
      await cleanupService.cancelSessionCleanup(sessionId);
    } catch (error) {
      throw new ServiceError(ErrorCode.EXPORT_MARK_FAILED, `Failed to mark session as exported: ${error}`);
    }
  }

  /**
   * Get session history for completed games
   * Story 1.7: AC 6
   */
  public async getActiveSessions(): Promise<Session[]> {
    try {
      const query = `
        SELECT s.* 
        FROM sessions s
        WHERE s.status IN ('created', 'active')
        ORDER BY s.created_at DESC
      `;
      
      const result = await this.dbService.executeQuery(query, []);
      
      const sessions: Session[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        const row = result.rows.item(i);
        sessions.push({
          id: row.id,
          name: row.name,
          organizerId: row.organizer_id,
          status: row.status,
          createdAt: new Date(row.created_at),
          startedAt: row.started_at ? new Date(row.started_at) : undefined,
          completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
          totalPot: 0, // Will be calculated from transactions
          playerCount: 0 // Will be calculated from players
        });
      }
      
      return sessions;
    } catch (error) {
      throw new ServiceError('FETCH_ACTIVE_SESSIONS_FAILED', `Failed to fetch active sessions: ${error}`, { error });
    }
  }

  public async getSessionHistory(limit: number = 30): Promise<Session[]> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const query = `
        SELECT s.*, 
               CASE WHEN se.id IS NOT NULL THEN 1 ELSE 0 END as has_export
        FROM sessions s
        LEFT JOIN session_exports se ON s.id = se.session_id
        WHERE s.status = 'completed'
        AND s.completed_at >= ?
        ORDER BY s.completed_at DESC
        LIMIT ?
      `;
      
      const result = await this.dbService.executeQuery(query, [
        thirtyDaysAgo.toISOString(),
        limit
      ]);
      
      // Map the raw database rows to proper Session objects
      const sessions = result.rows.raw().map((row: any) => ({
        id: row.id,
        name: row.name,
        organizerId: row.organizer_id,
        status: row.status,
        createdAt: row.created_at ? new Date(row.created_at) : new Date(),
        startedAt: row.started_at ? new Date(row.started_at) : undefined,
        completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
        totalPot: row.total_pot !== null && row.total_pot !== undefined 
          ? parseFloat(row.total_pot) 
          : 0,
        playerCount: row.player_count || 0,
        cleanupAt: row.cleanup_at ? new Date(row.cleanup_at) : undefined,
        has_export: row.has_export === 1
      }));
      
      return sessions;
    } catch (error) {
      throw new ServiceError(ErrorCode.UNKNOWN_ERROR, `Failed to get session history: ${error}`);
    }
  }

  /**
   * Complete a session and schedule cleanup
   * Story 1.7: Updates to handle cleanup scheduling
   */
  public async completeSession(sessionId: string): Promise<void> {
    try {
      await this.updateSessionStatus(sessionId, 'completed');
      
      // Schedule cleanup for 10 hours later
      const SessionCleanupService = require('./SessionCleanupService').SessionCleanupService;
      const cleanupService = SessionCleanupService.getInstance();
      const session = await this.getSession(sessionId);
      
      if (session && session.completedAt) {
        await cleanupService.scheduleSessionCleanup(sessionId, session.completedAt);
      }
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError('SESSION_COMPLETE_FAILED', `Failed to complete session: ${error}`);
    }
  }

  /**
   * Add a player from a saved profile
   * Story 2.5: AC 4, 5 - Profile-based player addition
   */
  public async addPlayerFromProfile(sessionId: string, profileId: string): Promise<Player> {
    try {
      if (!sessionId || !profileId) {
        throw new ServiceError('VALIDATION_ERROR', 'Session ID and Profile ID are required');
      }

      // Get profile data
      const ProfileServiceModule = require('./ProfileService');
      const profileService = ProfileServiceModule.ProfileService.getInstance();
      const profile = await profileService.getProfile(profileId);
      
      if (!profile) {
        throw new ServiceError('PROFILE_NOT_FOUND', `Profile ${profileId} not found`);
      }

      // Create player data from profile
      const playerData: PlayerData = {
        name: profile.name,
        isGuest: false,
        profileId: profile.id
      };

      // Use existing addPlayer method but with profile data
      const player = await this.addPlayer(sessionId, playerData);

      // Mark profile as recently used
      await profileService.markProfileAsUsed(profileId);

      return player;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError('PROFILE_PLAYER_ADDITION_FAILED', `Failed to add player from profile: ${error}`);
    }
  }

  /**
   * Add a guest player (one-time participant)
   * Story 2.5: AC 5 - Guest player quick-add functionality
   */
  public async addGuestPlayer(sessionId: string, guestName: string): Promise<Player> {
    try {
      if (!sessionId || !guestName?.trim()) {
        throw new ServiceError('VALIDATION_ERROR', 'Session ID and guest name are required');
      }

      // Create guest player data
      const playerData: PlayerData = {
        name: guestName.trim(),
        isGuest: true
      };

      // Use existing addPlayer method with guest flag
      return await this.addPlayer(sessionId, playerData);
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError('GUEST_PLAYER_ADDITION_FAILED', `Failed to add guest player: ${error}`);
    }
  }

  /**
   * Get players grouped by type (profile vs guest)
   * Story 2.5: AC 5 - Simple flow distinction between guest and saved players
   */
  public async getPlayersGroupedByType(sessionId: string): Promise<{
    profilePlayers: Player[];
    guestPlayers: Player[];
  }> {
    try {
      const players = await this.dbService.getPlayers(sessionId);
      
      const profilePlayers = players.filter(p => !p.isGuest && p.profileId);
      const guestPlayers = players.filter(p => p.isGuest);

      return {
        profilePlayers,
        guestPlayers
      };
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError('PLAYER_GROUPING_FAILED', `Failed to group players by type: ${error}`);
    }
  }
}