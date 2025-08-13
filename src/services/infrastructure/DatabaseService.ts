import SQLite, { SQLiteDatabase } from 'react-native-sqlite-storage';
import { ServiceError } from '../core/ServiceError';
import { v4 as uuidv4 } from 'uuid';

export interface QueryResult {
  rows: {
    raw(): any[];
    item(index: number): any;
    length: number;
  };
  rowsAffected: number;
  insertId?: number;
}

export interface Session {
  id: string;
  name: string;
  organizerId: string;
  status: 'created' | 'active' | 'completed';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  totalPot: number;
  playerCount: number;
  cleanupAt?: Date;
}

export interface Player {
  id: string;
  sessionId: string;
  name: string;
  isGuest: boolean;
  profileId?: string;
  currentBalance: number;
  totalBuyIns: number;
  totalCashOuts: number;
  status: 'active' | 'cashed_out';
  joinedAt: Date;
}

export interface Transaction {
  id: string;
  sessionId: string;
  playerId: string;
  type: 'buy_in' | 'cash_out';
  amount: number;
  timestamp: Date;
  method: 'voice' | 'manual';
  isVoided: boolean;
  description?: string;
  createdBy: string;
  voidedAt?: Date;
  voidReason?: string;
}

export interface PlayerProfile {
  id: string;
  name: string;
  preferredBuyIn: number;
  avatarPath?: string;
  gamesPlayed: number;
  lastPlayedAt?: Date;
  createdAt: Date;
}

export class DatabaseService {
  private static instance: DatabaseService;
  private database: SQLiteDatabase | null = null;
  private isInitializing = false;
  private initPromise: Promise<void> | null = null;

  private constructor() {
    SQLite.DEBUG(false);
    SQLite.enablePromise(true);
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.database) {
      return;
    }

    if (this.isInitializing && this.initPromise) {
      return this.initPromise;
    }

    this.isInitializing = true;
    this.initPromise = this.performInitialization();
    
    try {
      await this.initPromise;
    } finally {
      this.isInitializing = false;
      this.initPromise = null;
    }
  }

  private async performInitialization(): Promise<void> {
    try {
      this.database = await SQLite.openDatabase(
        {
          name: 'pokepot.db',
          location: 'default',
        },
        () => console.log('Database opened successfully'),
        (error) => {
          console.error('Failed to open database:', error);
          throw new ServiceError('DATABASE_CONNECTION_FAILED', 'Failed to open database');
        }
      );

      await this.configurePragmas();
      await this.runMigrations();
    } catch (error) {
      this.database = null;
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError('DATABASE_INIT_FAILED', 'Failed to initialize database');
    }
  }

  private async configurePragmas(): Promise<void> {
    if (!this.database) {
      throw new ServiceError('DATABASE_NOT_INITIALIZED', 'Database not initialized');
    }

    const pragmas = [
      'PRAGMA journal_mode=WAL',
      'PRAGMA synchronous=NORMAL',
      'PRAGMA cache_size=10000',
      'PRAGMA foreign_keys=ON',
    ];

    for (const pragma of pragmas) {
      await this.database.executeSql(pragma);
    }
  }

  public async executeQuery(
    query: string,
    params: any[] = []
  ): Promise<QueryResult> {
    if (!this.database) {
      await this.initialize();
    }

    if (!this.database) {
      throw new ServiceError('DATABASE_NOT_INITIALIZED', 'Database not initialized');
    }

    try {
      const [result] = await this.database.executeSql(query, params);
      return result as QueryResult;
    } catch (error: any) {
      console.error('Query execution failed:', error);
      throw new ServiceError('QUERY_EXECUTION_FAILED', error.message || 'Query execution failed');
    }
  }

  public async executeTransaction<T>(
    operations: (tx: SQLiteDatabase) => Promise<T>
  ): Promise<T> {
    if (!this.database) {
      await this.initialize();
    }

    if (!this.database) {
      throw new ServiceError('DATABASE_NOT_INITIALIZED', 'Database not initialized');
    }

    return new Promise((resolve, reject) => {
      this.database!.transaction(
        async (tx) => {
          try {
            const result = await operations(tx as any);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        },
        (error) => {
          console.error('Transaction failed:', error);
          reject(new ServiceError('TRANSACTION_FAILED', error.message || 'Transaction failed'));
        }
      );
    });
  }

  private async runMigrations(): Promise<void> {
    if (!this.database) {
      throw new ServiceError('DATABASE_NOT_INITIALIZED', 'Database not initialized');
    }

    try {
      await this.executeQuery(`
        CREATE TABLE IF NOT EXISTS migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          version INTEGER UNIQUE NOT NULL,
          applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      const result = await this.executeQuery('SELECT MAX(version) as current_version FROM migrations');
      const currentVersion = result.rows.item(0)?.current_version || 0;

      const migrations = await this.getMigrations();
      
      for (const migration of migrations) {
        if (migration.version > currentVersion) {
          await this.applyMigration(migration);
        }
      }
    } catch (error) {
      console.error('Migration failed:', error);
      throw new ServiceError('MIGRATION_FAILED', 'Database migration failed');
    }
  }

  private async getMigrations(): Promise<Array<{ version: number; sql: string }>> {
    return [
      {
        version: 1,
        sql: this.getInitialSchemaSql(),
      },
    ];
  }

  private async applyMigration(migration: { version: number; sql: string }): Promise<void> {
    await this.executeTransaction(async () => {
      const statements = migration.sql.split(';').filter(s => s.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          await this.executeQuery(statement);
        }
      }

      await this.executeQuery(
        'INSERT INTO migrations (version) VALUES (?)',
        [migration.version]
      );

      console.log(`Migration ${migration.version} applied successfully`);
    });
  }

  private getInitialSchemaSql(): string {
    return `
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        organizer_id TEXT NOT NULL,
        status TEXT CHECK(status IN ('created', 'active', 'completed')) NOT NULL DEFAULT 'created',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        started_at DATETIME,
        completed_at DATETIME,
        total_pot DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        player_count INTEGER NOT NULL DEFAULT 0,
        cleanup_at DATETIME
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
      CREATE INDEX IF NOT EXISTS idx_sessions_cleanup ON sessions(cleanup_at);
      CREATE INDEX IF NOT EXISTS idx_sessions_created ON sessions(created_at);

      CREATE TABLE IF NOT EXISTS player_profiles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        preferred_buy_in DECIMAL(10,2) NOT NULL DEFAULT 50.00,
        avatar_path TEXT,
        games_played INTEGER NOT NULL DEFAULT 0,
        last_played_at DATETIME,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_profiles_name ON player_profiles(name);
      CREATE INDEX IF NOT EXISTS idx_profiles_last_played ON player_profiles(last_played_at);

      CREATE TABLE IF NOT EXISTS players (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        is_guest BOOLEAN NOT NULL DEFAULT 1,
        profile_id TEXT REFERENCES player_profiles(id),
        current_balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        total_buy_ins DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        total_cash_outs DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        status TEXT CHECK(status IN ('active', 'cashed_out')) NOT NULL DEFAULT 'active',
        joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_players_session ON players(session_id);
      CREATE INDEX IF NOT EXISTS idx_players_profile ON players(profile_id);
      CREATE INDEX IF NOT EXISTS idx_players_status ON players(session_id, status);

      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
        type TEXT CHECK(type IN ('buy_in', 'cash_out')) NOT NULL,
        amount DECIMAL(10,2) NOT NULL CHECK(amount > 0),
        timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        method TEXT CHECK(method IN ('voice', 'manual')) NOT NULL,
        is_voided BOOLEAN NOT NULL DEFAULT 0,
        description TEXT,
        created_by TEXT NOT NULL,
        voided_at DATETIME,
        void_reason TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_transactions_session ON transactions(session_id, timestamp);
      CREATE INDEX IF NOT EXISTS idx_transactions_player ON transactions(player_id, timestamp);
      CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(session_id, type);
      CREATE INDEX IF NOT EXISTS idx_transactions_active ON transactions(session_id, is_voided, timestamp);
    `;
  }

  public async close(): Promise<void> {
    if (this.database) {
      await this.database.close();
      this.database = null;
    }
  }

  public async isConnected(): Promise<boolean> {
    try {
      if (!this.database) {
        await this.initialize();
      }
      
      const result = await this.executeQuery('SELECT 1');
      return result.rows.length >= 0;
    } catch {
      return false;
    }
  }

  // Session CRUD Operations
  public async createSession(session: Omit<Session, 'id' | 'createdAt'>): Promise<Session> {
    const id = uuidv4();
    const createdAt = new Date();
    
    await this.executeQuery(
      `INSERT INTO sessions (id, name, organizer_id, status, created_at, started_at, completed_at, total_pot, player_count, cleanup_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        session.name,
        session.organizerId,
        session.status,
        createdAt.toISOString(),
        session.startedAt?.toISOString() || null,
        session.completedAt?.toISOString() || null,
        session.totalPot,
        session.playerCount,
        session.cleanupAt?.toISOString() || null,
      ]
    );

    return { ...session, id, createdAt };
  }

  public async getSession(id: string): Promise<Session | null> {
    const result = await this.executeQuery(
      'SELECT * FROM sessions WHERE id = ?',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows.item(0);
    return this.mapRowToSession(row);
  }

  public async updateSession(id: string, updates: Partial<Omit<Session, 'id'>>): Promise<void> {
    const updateFields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      updateFields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.status !== undefined) {
      updateFields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.startedAt !== undefined) {
      updateFields.push('started_at = ?');
      values.push(updates.startedAt?.toISOString());
    }
    if (updates.completedAt !== undefined) {
      updateFields.push('completed_at = ?');
      values.push(updates.completedAt?.toISOString());
    }
    if (updates.totalPot !== undefined) {
      updateFields.push('total_pot = ?');
      values.push(updates.totalPot);
    }
    if (updates.playerCount !== undefined) {
      updateFields.push('player_count = ?');
      values.push(updates.playerCount);
    }

    if (updateFields.length === 0) {
      return;
    }

    values.push(id);
    await this.executeQuery(
      `UPDATE sessions SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );
  }

  public async deleteSession(id: string): Promise<void> {
    await this.executeQuery('DELETE FROM sessions WHERE id = ?', [id]);
  }

  // Player CRUD Operations
  public async addPlayer(player: Omit<Player, 'id' | 'joinedAt'>): Promise<Player> {
    const id = uuidv4();
    const joinedAt = new Date();

    await this.executeQuery(
      `INSERT INTO players (id, session_id, name, is_guest, profile_id, current_balance, total_buy_ins, total_cash_outs, status, joined_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        player.sessionId,
        player.name,
        player.isGuest ? 1 : 0,
        player.profileId || null,
        player.currentBalance,
        player.totalBuyIns,
        player.totalCashOuts,
        player.status,
        joinedAt.toISOString(),
      ]
    );

    return { ...player, id, joinedAt };
  }

  public async getPlayers(sessionId: string): Promise<Player[]> {
    const result = await this.executeQuery(
      'SELECT * FROM players WHERE session_id = ? ORDER BY joined_at',
      [sessionId]
    );

    const players: Player[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      players.push(this.mapRowToPlayer(result.rows.item(i)));
    }
    return players;
  }

  public async updatePlayer(id: string, updates: Partial<Omit<Player, 'id' | 'sessionId' | 'joinedAt'>>): Promise<void> {
    const updateFields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      updateFields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.currentBalance !== undefined) {
      updateFields.push('current_balance = ?');
      values.push(updates.currentBalance);
    }
    if (updates.totalBuyIns !== undefined) {
      updateFields.push('total_buy_ins = ?');
      values.push(updates.totalBuyIns);
    }
    if (updates.totalCashOuts !== undefined) {
      updateFields.push('total_cash_outs = ?');
      values.push(updates.totalCashOuts);
    }
    if (updates.status !== undefined) {
      updateFields.push('status = ?');
      values.push(updates.status);
    }

    if (updateFields.length === 0) {
      return;
    }

    values.push(id);
    await this.executeQuery(
      `UPDATE players SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );
  }

  public async removePlayer(id: string): Promise<void> {
    await this.executeQuery('DELETE FROM players WHERE id = ?', [id]);
  }

  // Transaction CRUD Operations
  public async recordTransaction(transaction: Omit<Transaction, 'id' | 'timestamp'>): Promise<Transaction> {
    const id = uuidv4();
    const timestamp = new Date();

    await this.executeQuery(
      `INSERT INTO transactions (id, session_id, player_id, type, amount, timestamp, method, is_voided, description, created_by, voided_at, void_reason)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        transaction.sessionId,
        transaction.playerId,
        transaction.type,
        transaction.amount,
        timestamp.toISOString(),
        transaction.method,
        transaction.isVoided ? 1 : 0,
        transaction.description || null,
        transaction.createdBy,
        transaction.voidedAt?.toISOString() || null,
        transaction.voidReason || null,
      ]
    );

    return { ...transaction, id, timestamp };
  }

  public async getTransactions(sessionId: string, playerId?: string): Promise<Transaction[]> {
    let query = 'SELECT * FROM transactions WHERE session_id = ?';
    const params: any[] = [sessionId];

    if (playerId) {
      query += ' AND player_id = ?';
      params.push(playerId);
    }

    query += ' ORDER BY timestamp DESC';

    const result = await this.executeQuery(query, params);

    const transactions: Transaction[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      transactions.push(this.mapRowToTransaction(result.rows.item(i)));
    }
    return transactions;
  }

  public async voidTransaction(id: string, reason: string): Promise<void> {
    await this.executeQuery(
      'UPDATE transactions SET is_voided = 1, voided_at = ?, void_reason = ? WHERE id = ?',
      [new Date().toISOString(), reason, id]
    );
  }

  // PlayerProfile CRUD Operations
  public async createProfile(profile: Omit<PlayerProfile, 'id' | 'createdAt'>): Promise<PlayerProfile> {
    const id = uuidv4();
    const createdAt = new Date();

    await this.executeQuery(
      `INSERT INTO player_profiles (id, name, preferred_buy_in, avatar_path, games_played, last_played_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        profile.name,
        profile.preferredBuyIn,
        profile.avatarPath || null,
        profile.gamesPlayed,
        profile.lastPlayedAt?.toISOString() || null,
        createdAt.toISOString(),
      ]
    );

    return { ...profile, id, createdAt };
  }

  public async getProfiles(): Promise<PlayerProfile[]> {
    const result = await this.executeQuery(
      'SELECT * FROM player_profiles ORDER BY name'
    );

    const profiles: PlayerProfile[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      profiles.push(this.mapRowToPlayerProfile(result.rows.item(i)));
    }
    return profiles;
  }

  public async updateProfile(id: string, updates: Partial<Omit<PlayerProfile, 'id' | 'createdAt'>>): Promise<void> {
    const updateFields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      updateFields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.preferredBuyIn !== undefined) {
      updateFields.push('preferred_buy_in = ?');
      values.push(updates.preferredBuyIn);
    }
    if (updates.avatarPath !== undefined) {
      updateFields.push('avatar_path = ?');
      values.push(updates.avatarPath);
    }
    if (updates.gamesPlayed !== undefined) {
      updateFields.push('games_played = ?');
      values.push(updates.gamesPlayed);
    }
    if (updates.lastPlayedAt !== undefined) {
      updateFields.push('last_played_at = ?');
      values.push(updates.lastPlayedAt?.toISOString());
    }

    if (updateFields.length === 0) {
      return;
    }

    values.push(id);
    await this.executeQuery(
      `UPDATE player_profiles SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );
  }

  // Database cleanup and maintenance utilities
  public async cleanupOldSessions(olderThanHours: number = 10): Promise<number> {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - olderThanHours);

    const result = await this.executeQuery(
      'DELETE FROM sessions WHERE status = ? AND completed_at < ?',
      ['completed', cutoffTime.toISOString()]
    );

    return result.rowsAffected;
  }

  public async vacuumDatabase(): Promise<void> {
    await this.executeQuery('VACUUM');
  }

  public async getDatabaseSize(): Promise<{ sizeInBytes: number; pageCount: number }> {
    const result = await this.executeQuery('PRAGMA page_count');
    const pageCount = result.rows.item(0)?.page_count || 0;
    
    const pageSizeResult = await this.executeQuery('PRAGMA page_size');
    const pageSize = pageSizeResult.rows.item(0)?.page_size || 0;
    
    return {
      sizeInBytes: pageCount * pageSize,
      pageCount: pageCount
    };
  }

  public async scheduleCleanup(): Promise<void> {
    const tenHoursAgo = new Date();
    tenHoursAgo.setHours(tenHoursAgo.getHours() - 10);
    
    await this.executeQuery(
      'UPDATE sessions SET cleanup_at = ? WHERE status = ? AND completed_at IS NOT NULL AND completed_at < ?',
      [new Date().toISOString(), 'completed', tenHoursAgo.toISOString()]
    );
  }

  // Helper methods for mapping database rows to TypeScript objects
  private mapRowToSession(row: any): Session {
    return {
      id: row.id,
      name: row.name,
      organizerId: row.organizer_id,
      status: row.status,
      createdAt: new Date(row.created_at),
      startedAt: row.started_at ? new Date(row.started_at) : undefined,
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      totalPot: parseFloat(row.total_pot),
      playerCount: row.player_count,
      cleanupAt: row.cleanup_at ? new Date(row.cleanup_at) : undefined,
    };
  }

  private mapRowToPlayer(row: any): Player {
    return {
      id: row.id,
      sessionId: row.session_id,
      name: row.name,
      isGuest: row.is_guest === 1,
      profileId: row.profile_id,
      currentBalance: parseFloat(row.current_balance),
      totalBuyIns: parseFloat(row.total_buy_ins),
      totalCashOuts: parseFloat(row.total_cash_outs),
      status: row.status,
      joinedAt: new Date(row.joined_at),
    };
  }

  private mapRowToTransaction(row: any): Transaction {
    return {
      id: row.id,
      sessionId: row.session_id,
      playerId: row.player_id,
      type: row.type,
      amount: parseFloat(row.amount),
      timestamp: new Date(row.timestamp),
      method: row.method,
      isVoided: row.is_voided === 1,
      description: row.description,
      createdBy: row.created_by,
      voidedAt: row.voided_at ? new Date(row.voided_at) : undefined,
      voidReason: row.void_reason,
    };
  }

  private mapRowToPlayerProfile(row: any): PlayerProfile {
    return {
      id: row.id,
      name: row.name,
      preferredBuyIn: parseFloat(row.preferred_buy_in),
      avatarPath: row.avatar_path,
      gamesPlayed: row.games_played,
      lastPlayedAt: row.last_played_at ? new Date(row.last_played_at) : undefined,
      createdAt: new Date(row.created_at),
    };
  }

  // Health status for monitoring and debugging
  public async getHealthStatus(): Promise<{
    connected: boolean;
    version: string;
    tablesCount: number;
  }> {
    try {
      if (!this.database) {
        return {
          connected: false,
          version: '',
          tablesCount: 0,
        };
      }

      // Check connection by running a simple query
      const connected = await this.isConnected();
      
      // Get SQLite version
      let version = '';
      try {
        const versionResult = await this.executeQuery('SELECT sqlite_version() as version');
        version = versionResult.rows.item(0)?.version || '';
      } catch {
        // Ignore version check errors
      }

      // Count tables
      let tablesCount = 0;
      try {
        const tablesResult = await this.executeQuery(
          "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
        );
        tablesCount = tablesResult.rows.item(0)?.count || 0;
      } catch {
        // Ignore table count errors
      }

      return {
        connected,
        version,
        tablesCount,
      };
    } catch (error) {
      console.error('Database health check failed:', error);
      return {
        connected: false,
        version: '',
        tablesCount: 0,
      };
    }
  }
}