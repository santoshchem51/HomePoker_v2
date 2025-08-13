import { DatabaseService } from '../../../../src/services/infrastructure/DatabaseService';
import SQLite from 'react-native-sqlite-storage';

jest.mock('react-native-sqlite-storage', () => ({
  openDatabase: jest.fn(),
  enablePromise: jest.fn(),
  DEBUG: jest.fn(),
}));

describe('DatabaseService', () => {
  let mockDatabase: any;
  let service: DatabaseService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockDatabase = {
      executeSql: jest.fn().mockResolvedValue([{ 
        rows: { 
          raw: () => [], 
          item: () => null,
          length: 0 
        },
        rowsAffected: 0 
      }]),
      transaction: jest.fn((callback, _errorCallback) => {
        callback({
          executeSql: mockDatabase.executeSql
        });
      }),
      close: jest.fn().mockResolvedValue(undefined),
    };

    (SQLite.openDatabase as jest.Mock).mockResolvedValue(mockDatabase);
    
    service = DatabaseService.getInstance();
  });

  afterEach(() => {
    (service as any).database = null;
    (service as any).isInitializing = false;
    (service as any).initPromise = null;
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = DatabaseService.getInstance();
      const instance2 = DatabaseService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('initialize', () => {
    it('should open database connection', async () => {
      await service.initialize();
      
      expect(SQLite.openDatabase).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'pokepot.db',
          location: 'default',
        }),
        expect.any(Function),
        expect.any(Function)
      );
    });

    it('should configure pragmas', async () => {
      await service.initialize();
      
      expect(mockDatabase.executeSql).toHaveBeenCalledWith('PRAGMA journal_mode=WAL');
      expect(mockDatabase.executeSql).toHaveBeenCalledWith('PRAGMA synchronous=NORMAL');
      expect(mockDatabase.executeSql).toHaveBeenCalledWith('PRAGMA cache_size=10000');
      expect(mockDatabase.executeSql).toHaveBeenCalledWith('PRAGMA foreign_keys=ON');
    });

    it('should run migrations on initialization', async () => {
      await service.initialize();
      
      expect(mockDatabase.executeSql).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS migrations'),
        expect.any(Array)
      );
    });

    it('should handle initialization errors', async () => {
      (SQLite.openDatabase as jest.Mock).mockRejectedValue(new Error('Connection failed'));
      
      await expect(service.initialize()).rejects.toThrow('Failed to initialize database');
    });

    it('should prevent multiple simultaneous initializations', async () => {
      const promise1 = service.initialize();
      const promise2 = service.initialize();
      
      await Promise.all([promise1, promise2]);
      
      expect(SQLite.openDatabase).toHaveBeenCalledTimes(1);
    });
  });

  describe('executeQuery', () => {
    it('should execute parameterized query', async () => {
      await service.initialize();
      
      const query = 'SELECT * FROM sessions WHERE id = ?';
      const params = ['test-id'];
      
      await service.executeQuery(query, params);
      
      expect(mockDatabase.executeSql).toHaveBeenCalledWith(query, params);
    });

    it('should initialize database if not already initialized', async () => {
      const query = 'SELECT 1';
      await service.executeQuery(query);
      
      expect(SQLite.openDatabase).toHaveBeenCalled();
    });

    it('should handle query execution errors', async () => {
      await service.initialize();
      mockDatabase.executeSql.mockRejectedValue(new Error('Query failed'));
      
      await expect(service.executeQuery('SELECT 1')).rejects.toThrow('Query failed');
    });
  });

  describe('executeTransaction', () => {
    it('should execute operations in transaction', async () => {
      await service.initialize();
      
      const result = await service.executeTransaction(async (_tx) => {
        return 'success';
      });
      
      expect(result).toBe('success');
      expect(mockDatabase.transaction).toHaveBeenCalled();
    });

    it('should handle transaction errors', async () => {
      await service.initialize();
      
      mockDatabase.transaction.mockImplementation((callback, errorCallback) => {
        errorCallback(new Error('Transaction failed'));
      });
      
      await expect(service.executeTransaction(async () => {})).rejects.toThrow('Transaction failed');
    });
  });

  describe('isConnected', () => {
    it('should return true when connected', async () => {
      await service.initialize();
      
      mockDatabase.executeSql.mockResolvedValue([{ 
        rows: { length: 1 } 
      }]);
      
      const connected = await service.isConnected();
      expect(connected).toBe(true);
    });

    it('should return false when not connected', async () => {
      const connected = await service.isConnected();
      expect(connected).toBe(false);
    });

    it('should return false on query error', async () => {
      await service.initialize();
      mockDatabase.executeSql.mockRejectedValue(new Error('Query failed'));
      
      const connected = await service.isConnected();
      expect(connected).toBe(false);
    });
  });

  describe('close', () => {
    it('should close database connection', async () => {
      await service.initialize();
      await service.close();
      
      expect(mockDatabase.close).toHaveBeenCalled();
    });

    it('should handle close when not initialized', async () => {
      await expect(service.close()).resolves.not.toThrow();
    });
  });

  describe('Session CRUD operations', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    describe('createSession', () => {
      it('should create session with generated id and timestamp', async () => {
        const sessionData = {
          name: 'Friday Night Poker',
          organizerId: 'organizer-1',
          status: 'created' as const,
          totalPot: 0,
          playerCount: 0,
        };

        const session = await service.createSession(sessionData);

        expect(session.id).toBeDefined();
        expect(session.createdAt).toBeInstanceOf(Date);
        expect(session.name).toBe(sessionData.name);
        expect(mockDatabase.executeSql).toHaveBeenCalledWith(
          expect.stringContaining('INSERT INTO sessions'),
          expect.arrayContaining([
            expect.any(String), // id
            sessionData.name,
            sessionData.organizerId,
            sessionData.status,
            expect.any(String), // createdAt ISO string
          ])
        );
      });
    });

    describe('getSession', () => {
      it('should return session by id', async () => {
        const mockRow = {
          id: 'session-1',
          name: 'Test Session',
          organizer_id: 'organizer-1',
          status: 'active',
          created_at: '2023-01-01T00:00:00.000Z',
          started_at: '2023-01-01T01:00:00.000Z',
          completed_at: null,
          total_pot: '250.00',
          player_count: 5,
          cleanup_at: null,
        };

        mockDatabase.executeSql.mockResolvedValueOnce([{
          rows: {
            length: 1,
            item: () => mockRow,
          }
        }]);

        const session = await service.getSession('session-1');

        expect(session).toEqual({
          id: 'session-1',
          name: 'Test Session',
          organizerId: 'organizer-1',
          status: 'active',
          createdAt: new Date('2023-01-01T00:00:00.000Z'),
          startedAt: new Date('2023-01-01T01:00:00.000Z'),
          completedAt: undefined,
          totalPot: 250.00,
          playerCount: 5,
          cleanupAt: undefined,
        });
      });

      it('should return null when session not found', async () => {
        mockDatabase.executeSql.mockResolvedValueOnce([{
          rows: { length: 0 }
        }]);

        const session = await service.getSession('nonexistent');
        expect(session).toBeNull();
      });
    });

    describe('updateSession', () => {
      it('should update session fields', async () => {
        await service.updateSession('session-1', {
          status: 'completed',
          totalPot: 500,
        });

        expect(mockDatabase.executeSql).toHaveBeenCalledWith(
          'UPDATE sessions SET status = ?, total_pot = ? WHERE id = ?',
          ['completed', 500, 'session-1']
        );
      });

      it('should handle empty updates', async () => {
        await service.updateSession('session-1', {});
        
        expect(mockDatabase.executeSql).not.toHaveBeenCalledWith(
          expect.stringContaining('UPDATE'),
          expect.any(Array)
        );
      });
    });

    describe('deleteSession', () => {
      it('should delete session by id', async () => {
        await service.deleteSession('session-1');

        expect(mockDatabase.executeSql).toHaveBeenCalledWith(
          'DELETE FROM sessions WHERE id = ?',
          ['session-1']
        );
      });
    });
  });

  describe('Player CRUD operations', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    describe('addPlayer', () => {
      it('should add player with generated id and timestamp', async () => {
        const playerData = {
          sessionId: 'session-1',
          name: 'John Doe',
          isGuest: true,
          currentBalance: 100,
          totalBuyIns: 100,
          totalCashOuts: 0,
          status: 'active' as const,
        };

        const player = await service.addPlayer(playerData);

        expect(player.id).toBeDefined();
        expect(player.joinedAt).toBeInstanceOf(Date);
        expect(player.name).toBe(playerData.name);
        expect(mockDatabase.executeSql).toHaveBeenCalledWith(
          expect.stringContaining('INSERT INTO players'),
          expect.arrayContaining([
            expect.any(String), // id
            playerData.sessionId,
            playerData.name,
            1, // isGuest as 1
          ])
        );
      });
    });

    describe('getPlayers', () => {
      it('should return players for session', async () => {
        const mockRows = [
          {
            id: 'player-1',
            session_id: 'session-1',
            name: 'John Doe',
            is_guest: 1,
            profile_id: null,
            current_balance: '100.00',
            total_buy_ins: '100.00',
            total_cash_outs: '0.00',
            status: 'active',
            joined_at: '2023-01-01T00:00:00.000Z',
          }
        ];

        mockDatabase.executeSql.mockResolvedValueOnce([{
          rows: {
            length: 1,
            item: (index: number) => mockRows[index],
          }
        }]);

        const players = await service.getPlayers('session-1');

        expect(players).toHaveLength(1);
        expect(players[0]).toEqual({
          id: 'player-1',
          sessionId: 'session-1',
          name: 'John Doe',
          isGuest: true,
          profileId: null,
          currentBalance: 100.00,
          totalBuyIns: 100.00,
          totalCashOuts: 0.00,
          status: 'active',
          joinedAt: new Date('2023-01-01T00:00:00.000Z'),
        });
      });
    });

    describe('updatePlayer', () => {
      it('should update player balance', async () => {
        await service.updatePlayer('player-1', {
          currentBalance: 150,
          totalBuyIns: 200,
        });

        expect(mockDatabase.executeSql).toHaveBeenCalledWith(
          'UPDATE players SET current_balance = ?, total_buy_ins = ? WHERE id = ?',
          [150, 200, 'player-1']
        );
      });
    });

    describe('removePlayer', () => {
      it('should remove player by id', async () => {
        await service.removePlayer('player-1');

        expect(mockDatabase.executeSql).toHaveBeenCalledWith(
          'DELETE FROM players WHERE id = ?',
          ['player-1']
        );
      });
    });
  });

  describe('Transaction CRUD operations', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    describe('recordTransaction', () => {
      it('should record transaction with generated id and timestamp', async () => {
        const transactionData = {
          sessionId: 'session-1',
          playerId: 'player-1',
          type: 'buy_in' as const,
          amount: 100,
          method: 'manual' as const,
          isVoided: false,
          createdBy: 'organizer',
        };

        const transaction = await service.recordTransaction(transactionData);

        expect(transaction.id).toBeDefined();
        expect(transaction.timestamp).toBeInstanceOf(Date);
        expect(transaction.type).toBe(transactionData.type);
        expect(mockDatabase.executeSql).toHaveBeenCalledWith(
          expect.stringContaining('INSERT INTO transactions'),
          expect.arrayContaining([
            expect.any(String), // id
            transactionData.sessionId,
            transactionData.playerId,
            transactionData.type,
            transactionData.amount,
          ])
        );
      });
    });

    describe('getTransactions', () => {
      it('should return transactions for session', async () => {
        const mockRows = [
          {
            id: 'transaction-1',
            session_id: 'session-1',
            player_id: 'player-1',
            type: 'buy_in',
            amount: '100.00',
            timestamp: '2023-01-01T00:00:00.000Z',
            method: 'manual',
            is_voided: 0,
            description: null,
            created_by: 'organizer',
            voided_at: null,
            void_reason: null,
          }
        ];

        mockDatabase.executeSql.mockResolvedValueOnce([{
          rows: {
            length: 1,
            item: (index: number) => mockRows[index],
          }
        }]);

        const transactions = await service.getTransactions('session-1');

        expect(transactions).toHaveLength(1);
        expect(transactions[0]).toEqual({
          id: 'transaction-1',
          sessionId: 'session-1',
          playerId: 'player-1',
          type: 'buy_in',
          amount: 100.00,
          timestamp: new Date('2023-01-01T00:00:00.000Z'),
          method: 'manual',
          isVoided: false,
          description: null,
          createdBy: 'organizer',
          voidedAt: undefined,
          voidReason: null,
        });
      });

      it('should filter transactions by player', async () => {
        mockDatabase.executeSql.mockResolvedValueOnce([{
          rows: { length: 0 }
        }]);

        await service.getTransactions('session-1', 'player-1');

        expect(mockDatabase.executeSql).toHaveBeenCalledWith(
          'SELECT * FROM transactions WHERE session_id = ? AND player_id = ? ORDER BY timestamp DESC',
          ['session-1', 'player-1']
        );
      });
    });

    describe('voidTransaction', () => {
      it('should void transaction with reason', async () => {
        await service.voidTransaction('transaction-1', 'Accidental entry');

        expect(mockDatabase.executeSql).toHaveBeenCalledWith(
          'UPDATE transactions SET is_voided = 1, voided_at = ?, void_reason = ? WHERE id = ?',
          [expect.any(String), 'Accidental entry', 'transaction-1']
        );
      });
    });
  });

  describe('PlayerProfile CRUD operations', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    describe('createProfile', () => {
      it('should create profile with generated id and timestamp', async () => {
        const profileData = {
          name: 'John Doe',
          preferredBuyIn: 100,
          gamesPlayed: 0,
        };

        const profile = await service.createProfile(profileData);

        expect(profile.id).toBeDefined();
        expect(profile.createdAt).toBeInstanceOf(Date);
        expect(profile.name).toBe(profileData.name);
        expect(mockDatabase.executeSql).toHaveBeenCalledWith(
          expect.stringContaining('INSERT INTO player_profiles'),
          expect.arrayContaining([
            expect.any(String), // id
            profileData.name,
            profileData.preferredBuyIn,
          ])
        );
      });
    });

    describe('getProfiles', () => {
      it('should return all profiles', async () => {
        const mockRows = [
          {
            id: 'profile-1',
            name: 'John Doe',
            preferred_buy_in: '100.00',
            avatar_path: null,
            games_played: 5,
            last_played_at: '2023-01-01T00:00:00.000Z',
            created_at: '2023-01-01T00:00:00.000Z',
          }
        ];

        mockDatabase.executeSql.mockResolvedValueOnce([{
          rows: {
            length: 1,
            item: (index: number) => mockRows[index],
          }
        }]);

        const profiles = await service.getProfiles();

        expect(profiles).toHaveLength(1);
        expect(profiles[0]).toEqual({
          id: 'profile-1',
          name: 'John Doe',
          preferredBuyIn: 100.00,
          avatarPath: null,
          gamesPlayed: 5,
          lastPlayedAt: new Date('2023-01-01T00:00:00.000Z'),
          createdAt: new Date('2023-01-01T00:00:00.000Z'),
        });
      });
    });

    describe('updateProfile', () => {
      it('should update profile fields', async () => {
        await service.updateProfile('profile-1', {
          preferredBuyIn: 150,
          gamesPlayed: 10,
        });

        expect(mockDatabase.executeSql).toHaveBeenCalledWith(
          'UPDATE player_profiles SET preferred_buy_in = ?, games_played = ? WHERE id = ?',
          [150, 10, 'profile-1']
        );
      });
    });
  });
});