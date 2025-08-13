/**
 * SessionService tests for Story 1.2 implementation
 */
import { SessionService } from '../../../src/services/core/SessionService';

// Mock the DatabaseService
const mockDbService = {
  executeQuery: jest.fn(),
  executeTransaction: jest.fn(),
} as any;

// Mock the DatabaseService singleton
jest.mock('../../../src/services/infrastructure/DatabaseService', () => ({
  DatabaseService: {
    getInstance: () => mockDbService
  }
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-123')
}));

describe('SessionService - Story 1.2', () => {
  let sessionService: SessionService;

  beforeEach(() => {
    sessionService = SessionService.getInstance();
    jest.clearAllMocks();
  });

  describe('createSession', () => {
    it('should create a session with valid data (AC: 1, 4, 5, 6)', async () => {
      const request = {
        name: 'Friday Night Poker',
        organizerId: 'organizer-123'
      };

      mockDbService.executeQuery.mockResolvedValue([]);

      const result = await sessionService.createSession(request);

      expect(result).toMatchObject({
        id: 'test-uuid-123',
        name: 'Friday Night Poker',
        organizerId: 'organizer-123',
        status: 'created',
        totalPot: 0,
        playerCount: 0
      });

      expect(mockDbService.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO sessions'),
        ['test-uuid-123', 'Friday Night Poker', 'organizer-123', expect.any(String)]
      );
    });

    it('should validate session name is required', async () => {
      const request = { name: '', organizerId: 'organizer-123' };

      await expect(sessionService.createSession(request))
        .rejects.toThrow('Session name is required');
    });

    it('should validate organizer ID is required', async () => {
      const request = { name: 'Test Session', organizerId: '' };

      await expect(sessionService.createSession(request))
        .rejects.toThrow('Organizer ID is required');
    });
  });

  describe('addPlayer', () => {
    it('should add a player to a session (AC: 2, 3)', async () => {
      // Mock session exists and is in created status with 2 players
      mockDbService.executeQuery
        .mockResolvedValueOnce([{ id: 'session-123', status: 'created', player_count: 2 }])
        .mockResolvedValueOnce([]); // No duplicate names
      
      mockDbService.executeTransaction.mockResolvedValue(undefined);
      
      const playerData = { name: 'John Doe', isGuest: true };

      const result = await sessionService.addPlayer('session-123', playerData);

      expect(result).toMatchObject({
        id: 'test-uuid-123',
        sessionId: 'session-123',
        name: 'John Doe',
        isGuest: true,
        status: 'active'
      });
    });

    it('should prevent adding players to non-existent session', async () => {
      mockDbService.executeQuery.mockResolvedValueOnce([]); // Session not found

      const playerData = { name: 'John Doe', isGuest: true };

      await expect(sessionService.addPlayer('nonexistent', playerData))
        .rejects.toThrow('session with id nonexistent not found');
    });

    it('should prevent adding more than 8 players', async () => {
      mockDbService.executeQuery.mockResolvedValueOnce([
        { id: 'session-123', status: 'created', player_count: 8 }
      ]);

      const playerData = { name: 'John Doe', isGuest: true };

      await expect(sessionService.addPlayer('session-123', playerData))
        .rejects.toThrow('Session already has maximum of 8 players');
    });
  });

  describe('getSession', () => {
    it('should retrieve a session by ID (AC: 4, 5)', async () => {
      const mockSessionData = {
        id: 'session-123',
        name: 'Friday Night Poker',
        organizer_id: 'organizer-123',
        status: 'created',
        created_at: '2025-08-11T10:00:00.000Z',
        started_at: null,
        completed_at: null,
        total_pot: 0,
        player_count: 3
      };

      mockDbService.executeQuery.mockResolvedValue([mockSessionData]);

      const result = await sessionService.getSession('session-123');

      expect(result).toMatchObject({
        id: 'session-123',
        name: 'Friday Night Poker',
        organizerId: 'organizer-123',
        status: 'created',
        totalPot: 0,
        playerCount: 3
      });
    });

    it('should return null for non-existent session', async () => {
      mockDbService.executeQuery.mockResolvedValue([]);

      const result = await sessionService.getSession('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('Business Logic Validation', () => {
    it('should validate 4-8 players requirement', async () => {
      // Test minimum player validation
      mockDbService.executeQuery
        .mockResolvedValueOnce([{ id: 'session-123', status: 'created', player_count: 0 }])
        .mockResolvedValueOnce([]); // No duplicate names
      
      mockDbService.executeTransaction.mockResolvedValue(undefined);

      const playerData = { name: 'Player 1' };
      const result = await sessionService.addPlayer('session-123', playerData);
      
      expect(result.sessionId).toBe('session-123');
    });

    it('should handle player name trimming', async () => {
      mockDbService.executeQuery
        .mockResolvedValueOnce([{ id: 'session-123', status: 'created', player_count: 2 }])
        .mockResolvedValueOnce([]); // No duplicate names
      
      mockDbService.executeTransaction.mockResolvedValue(undefined);

      const playerData = { name: '  John Doe  ' };
      const result = await sessionService.addPlayer('session-123', playerData);
      
      expect(result.name).toBe('John Doe');
    });

    it('should prevent duplicate player names (case insensitive)', async () => {
      mockDbService.executeQuery
        .mockResolvedValueOnce([{ id: 'session-123', status: 'created', player_count: 2 }])
        .mockResolvedValueOnce([{ name: 'john doe' }]); // Duplicate found

      const playerData = { name: 'John Doe' };

      await expect(sessionService.addPlayer('session-123', playerData))
        .rejects.toThrow('A player with this name already exists in the session');
    });
  });
});