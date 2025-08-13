import { DatabaseService } from '../../../src/services/infrastructure/DatabaseService';

describe('Database Migration Tests', () => {
  let dbService: DatabaseService;

  beforeEach(() => {
    jest.clearAllMocks();
    dbService = DatabaseService.getInstance();
  });

  afterEach(async () => {
    // Clean up
    (dbService as any).database = null;
    (dbService as any).isInitializing = false;
    (dbService as any).initPromise = null;
  });

  describe('Initial Migration', () => {
    it('should apply initial schema migration on first run', async () => {
      await dbService.initialize();

      // Verify all tables were created
      const tableChecks = [
        'SELECT name FROM sqlite_master WHERE type="table" AND name="sessions"',
        'SELECT name FROM sqlite_master WHERE type="table" AND name="players"',
        'SELECT name FROM sqlite_master WHERE type="table" AND name="transactions"',
        'SELECT name FROM sqlite_master WHERE type="table" AND name="player_profiles"',
        'SELECT name FROM sqlite_master WHERE type="table" AND name="migrations"',
      ];

      for (const query of tableChecks) {
        const result = await dbService.executeQuery(query);
        expect(result.rows.length).toBeGreaterThan(0);
      }
    });

    it('should create proper indexes', async () => {
      await dbService.initialize();

      const indexQuery = `
        SELECT name FROM sqlite_master 
        WHERE type="index" AND name NOT LIKE "sqlite_%"
        ORDER BY name
      `;

      const result = await dbService.executeQuery(indexQuery);
      const indexNames = [];
      for (let i = 0; i < result.rows.length; i++) {
        indexNames.push(result.rows.item(i).name);
      }

      // Verify expected indexes exist
      const expectedIndexes = [
        'idx_sessions_status',
        'idx_sessions_cleanup',
        'idx_sessions_created',
        'idx_profiles_name',
        'idx_profiles_last_played',
        'idx_players_session',
        'idx_players_profile',
        'idx_players_status',
        'idx_transactions_session',
        'idx_transactions_player',
        'idx_transactions_type',
        'idx_transactions_active',
      ];

      expectedIndexes.forEach(expectedIndex => {
        expect(indexNames).toContain(expectedIndex);
      });
    });

    it('should enforce foreign key constraints', async () => {
      await dbService.initialize();

      // Verify foreign keys are enabled
      const pragmaResult = await dbService.executeQuery('PRAGMA foreign_keys');
      expect(pragmaResult.rows.item(0)).toEqual({ foreign_keys: 1 });
    });

    it('should track migration version', async () => {
      await dbService.initialize();

      // Check migrations table has the initial migration
      const result = await dbService.executeQuery('SELECT * FROM migrations ORDER BY version');
      expect(result.rows.length).toBeGreaterThanOrEqual(1);
      
      const initialMigration = result.rows.item(0);
      expect(initialMigration.version).toBe(1);
      expect(initialMigration.applied_at).toBeDefined();
    });

    it('should not reapply migrations on subsequent initializations', async () => {
      // Initialize twice
      await dbService.initialize();
      await dbService.initialize();

      // Should still only have one migration record
      const result = await dbService.executeQuery('SELECT COUNT(*) as count FROM migrations WHERE version = 1');
      expect(result.rows.item(0).count).toBe(1);
    });
  });

  describe('Schema Validation', () => {
    beforeEach(async () => {
      await dbService.initialize();
    });

    it('should enforce sessions table constraints', async () => {
      // Test status constraint
      await expect(
        dbService.executeQuery(
          'INSERT INTO sessions (id, name, organizer_id, status) VALUES (?, ?, ?, ?)',
          ['test-id', 'Test Session', 'organizer', 'invalid_status']
        )
      ).rejects.toThrow();
    });

    it('should enforce players table constraints', async () => {
      // Create a session first
      await dbService.executeQuery(
        'INSERT INTO sessions (id, name, organizer_id, status) VALUES (?, ?, ?, ?)',
        ['test-session', 'Test Session', 'organizer', 'created']
      );

      // Test status constraint
      await expect(
        dbService.executeQuery(
          'INSERT INTO players (id, session_id, name, status) VALUES (?, ?, ?, ?)',
          ['test-player', 'test-session', 'Test Player', 'invalid_status']
        )
      ).rejects.toThrow();
    });

    it('should enforce transactions table constraints', async () => {
      // Create session and player first
      await dbService.executeQuery(
        'INSERT INTO sessions (id, name, organizer_id, status) VALUES (?, ?, ?, ?)',
        ['test-session', 'Test Session', 'organizer', 'created']
      );
      
      await dbService.executeQuery(
        'INSERT INTO players (id, session_id, name) VALUES (?, ?, ?)',
        ['test-player', 'test-session', 'Test Player']
      );

      // Test type constraint
      await expect(
        dbService.executeQuery(
          'INSERT INTO transactions (id, session_id, player_id, type, amount, created_by) VALUES (?, ?, ?, ?, ?, ?)',
          ['test-transaction', 'test-session', 'test-player', 'invalid_type', 100, 'test']
        )
      ).rejects.toThrow();

      // Test method constraint
      await expect(
        dbService.executeQuery(
          'INSERT INTO transactions (id, session_id, player_id, type, amount, method, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
          ['test-transaction', 'test-session', 'test-player', 'buy_in', 100, 'invalid_method', 'test']
        )
      ).rejects.toThrow();

      // Test positive amount constraint
      await expect(
        dbService.executeQuery(
          'INSERT INTO transactions (id, session_id, player_id, type, amount, created_by) VALUES (?, ?, ?, ?, ?, ?)',
          ['test-transaction', 'test-session', 'test-player', 'buy_in', -100, 'test']
        )
      ).rejects.toThrow();
    });

    it('should maintain referential integrity on cascading deletes', async () => {
      // Create complete hierarchy
      const sessionId = 'cascade-test-session';
      const playerId = 'cascade-test-player';
      const transactionId = 'cascade-test-transaction';

      await dbService.executeQuery(
        'INSERT INTO sessions (id, name, organizer_id, status) VALUES (?, ?, ?, ?)',
        [sessionId, 'Cascade Test Session', 'organizer', 'created']
      );
      
      await dbService.executeQuery(
        'INSERT INTO players (id, session_id, name) VALUES (?, ?, ?)',
        [playerId, sessionId, 'Test Player']
      );
      
      await dbService.executeQuery(
        'INSERT INTO transactions (id, session_id, player_id, type, amount, created_by) VALUES (?, ?, ?, ?, ?, ?)',
        [transactionId, sessionId, playerId, 'buy_in', 100, 'test']
      );

      // Delete session should cascade
      await dbService.executeQuery('DELETE FROM sessions WHERE id = ?', [sessionId]);

      // Verify cascading deletion
      const playerResult = await dbService.executeQuery('SELECT * FROM players WHERE id = ?', [playerId]);
      expect(playerResult.rows.length).toBe(0);

      const transactionResult = await dbService.executeQuery('SELECT * FROM transactions WHERE id = ?', [transactionId]);
      expect(transactionResult.rows.length).toBe(0);
    });
  });

  describe('WAL Mode Configuration', () => {
    beforeEach(async () => {
      await dbService.initialize();
    });

    it('should configure WAL journal mode', async () => {
      const result = await dbService.executeQuery('PRAGMA journal_mode');
      expect(result.rows.item(0).journal_mode).toBe('wal');
    });

    it('should configure synchronous mode', async () => {
      const result = await dbService.executeQuery('PRAGMA synchronous');
      expect(result.rows.item(0).synchronous).toBe(1); // NORMAL = 1
    });

    it('should configure cache size', async () => {
      const result = await dbService.executeQuery('PRAGMA cache_size');
      expect(result.rows.item(0).cache_size).toBe(10000);
    });

    it('should enable foreign keys', async () => {
      const result = await dbService.executeQuery('PRAGMA foreign_keys');
      expect(result.rows.item(0).foreign_keys).toBe(1);
    });
  });
});