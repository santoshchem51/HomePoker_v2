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

export interface DatabaseConfig {
  temp_store: 'DEFAULT' | 'FILE' | 'MEMORY';
  mmap_size: number;
  cache_size: number;
  auto_vacuum: 'NONE' | 'FULL' | 'INCREMENTAL';
  optimize_frequency: number; // in milliseconds
}

export interface PreparedStatement {
  sql: string;
  params: any[];
  cacheKey: string;
}

export interface CachedStatement {
  sql: string;
  parameterCount: number;
  compiledStatement?: any;
  usageCount: number;
  lastUsed: Date;
  createdAt: Date;
}

export interface PreparedStatementStats {
  totalCached: number;
  cacheHits: number;
  cacheMisses: number;
  hitRate: number;
  memoryUsageKB: number;
}

export interface ConnectionPoolStats {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  preparedStatements: number;
}

export interface QueryAnalysis {
  sql: string;
  executionPlan: Array<{
    id: number;
    parent: number;
    notused: number;
    detail: string;
  }>;
  estimatedCost: number;
  indexesUsed: string[];
  recommendations: string[];
  executionTimeMs?: number;
}

export interface SlowQueryLog {
  sql: string;
  params: any[];
  executionTimeMs: number;
  timestamp: Date;
  stackTrace?: string;
}

export interface DatabaseMetrics {
  totalQueries: number;
  averageQueryTimeMs: number;
  slowQueries: number;
  errorRate: number;
  memoryUsageMB: number;
  cacheHitRate: number;
  connectionCount: number;
  lastUpdated: Date;
}

export interface PerformanceResult<T> {
  result: T;
  executionTimeMs: number;
  memoryUsedMB?: number;
  cacheHits?: number;
  cacheMisses?: number;
}

class PreparedStatementCache {
  private cache = new Map<string, CachedStatement>();
  private maxCacheSize = 100;
  private maxAge = 3600000; // 1 hour
  private maxMemoryUsageKB = 1024; // 1MB memory limit
  private stats = {
    hits: 0,
    misses: 0,
  };

  private generateCacheKey(sql: string): string {
    // Normalize SQL by removing extra whitespace and converting to lowercase
    const normalizedSql = sql.trim().replace(/\s+/g, ' ').toLowerCase();
    return `stmt_${this.hashString(normalizedSql)}`;
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  public get(sql: string): CachedStatement | null {
    const key = this.generateCacheKey(sql);
    const cached = this.cache.get(key);
    
    if (!cached) {
      this.stats.misses++;
      return null;
    }

    // Check if cache entry is expired
    if (Date.now() - cached.lastUsed.getTime() > this.maxAge) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update usage statistics
    cached.usageCount++;
    cached.lastUsed = new Date();
    this.stats.hits++;
    
    return cached;
  }

  public set(sql: string, parameterCount: number): CachedStatement {
    const key = this.generateCacheKey(sql);
    
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      this.evictOldestEntries();
    }

    const cached: CachedStatement = {
      sql: sql.trim(),
      parameterCount,
      usageCount: 1,
      lastUsed: new Date(),
      createdAt: new Date(),
    };

    this.cache.set(key, cached);
    return cached;
  }

  private evictOldestEntries(): void {
    // Check memory usage first
    const currentMemoryKB = this.cache.size * 0.5;
    
    if (currentMemoryKB > this.maxMemoryUsageKB) {
      // Aggressive eviction for memory pressure
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => {
          // Prefer removing older, less frequently used entries
          const ageScore = a[1].lastUsed.getTime() - b[1].lastUsed.getTime();
          const usageScore = a[1].usageCount - b[1].usageCount;
          return ageScore + (usageScore * 1000); // Weight usage more heavily
        });
      
      const toRemove = Math.max(1, Math.floor(entries.length * 0.4)); // More aggressive
      
      for (let i = 0; i < toRemove; i++) {
        this.cache.delete(entries[i][0]);
      }
    } else {
      // Standard eviction by age
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].lastUsed.getTime() - b[1].lastUsed.getTime());
      
      const toRemove = Math.max(1, Math.floor(entries.length * 0.2));
      
      for (let i = 0; i < toRemove; i++) {
        this.cache.delete(entries[i][0]);
      }
    }
  }

  public clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
  }

  public getStats(): PreparedStatementStats {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
    
    // Estimate memory usage (rough calculation)
    const memoryUsageKB = this.cache.size * 0.5; // ~0.5KB per cached statement
    
    return {
      totalCached: this.cache.size,
      cacheHits: this.stats.hits,
      cacheMisses: this.stats.misses,
      hitRate,
      memoryUsageKB,
    };
  }

  public getFrequentlyUsedStatements(limit: number = 10): Array<{ sql: string; usageCount: number }> {
    return Array.from(this.cache.values())
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit)
      .map(stmt => ({ sql: stmt.sql, usageCount: stmt.usageCount }));
  }
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
  
  // Connection pooling and caching
  private preparedStatements: Map<string, any> = new Map();
  private statementCache: PreparedStatementCache = new PreparedStatementCache();
  private config: DatabaseConfig = {
    temp_store: 'MEMORY',
    mmap_size: 268435456, // 256MB
    cache_size: -20000, // 20MB cache (negative = KB)
    auto_vacuum: 'INCREMENTAL',
    optimize_frequency: 3600000, // 1 hour
  };
  private optimizeTimer: ReturnType<typeof setTimeout> | null = null;
  
  // Query analysis and monitoring
  private slowQueryThreshold: number = 100; // 100ms threshold
  private slowQueryLog: SlowQueryLog[] = [];
  private queryLoggingEnabled: boolean = false;
  private maxSlowQueryLogSize: number = 1000;
  
  // Performance metrics tracking
  private performanceMetrics: {
    totalQueries: number;
    totalExecutionTime: number;
    slowQueries: number;
    totalErrors: number;
    cacheHits: number;
    cacheMisses: number;
    startTime: Date;
  } = {
    totalQueries: 0,
    totalExecutionTime: 0,
    slowQueries: 0,
    totalErrors: 0,
    cacheHits: 0,
    cacheMisses: 0,
    startTime: new Date(),
  };

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
    this.initPromise = this.performInitializationWithTimeout();
    
    try {
      await this.initPromise;
    } finally {
      this.isInitializing = false;
      this.initPromise = null;
    }
  }

  private async performInitializationWithTimeout(): Promise<void> {
    return new Promise((resolve, reject) => {
      // 5-second timeout to prevent app blocking
      const timeoutId = setTimeout(() => {
        this.database = null;
        reject(new ServiceError('DATABASE_INIT_TIMEOUT', 'Database initialization timed out after 5 seconds'));
      }, 5000);

      this.performInitialization()
        .then(() => {
          clearTimeout(timeoutId);
          resolve();
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          this.database = null;
          reject(error);
        });
    });
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

    // Enhanced PRAGMA configuration for performance
    const pragmas = [
      'PRAGMA journal_mode=WAL',
      'PRAGMA synchronous=NORMAL',
      `PRAGMA cache_size=${this.config.cache_size}`,
      'PRAGMA foreign_keys=ON',
      `PRAGMA temp_store=${this.config.temp_store}`,
      `PRAGMA mmap_size=${this.config.mmap_size}`,
      `PRAGMA auto_vacuum=${this.config.auto_vacuum}`,
      'PRAGMA busy_timeout=30000', // 30 second timeout
      'PRAGMA wal_autocheckpoint=1000',
      'PRAGMA optimize',
    ];

    for (const pragma of pragmas) {
      try {
        await this.database.executeSql(pragma);
      } catch (error) {
        console.warn(`Failed to set pragma: ${pragma}`, error);
        // Continue with other pragmas even if one fails
      }
    }

    // Start automatic optimization timer
    this.startOptimizationTimer();
  }

  private startOptimizationTimer(): void {
    if (this.optimizeTimer) {
      clearTimeout(this.optimizeTimer);
    }
    
    this.optimizeTimer = setTimeout(async () => {
      try {
        if (this.database) {
          await this.database.executeSql('PRAGMA optimize');
          console.log('Database optimization completed');
        }
      } catch (error) {
        console.warn('Database optimization failed:', error);
      }
      
      // Schedule next optimization
      this.startOptimizationTimer();
    }, this.config.optimize_frequency);
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

    const startTime = Date.now();
    
    try {
      const [result] = await this.database.executeSql(query, params);
      const executionTimeMs = Date.now() - startTime;
      
      // Update performance metrics
      this.updatePerformanceMetrics(executionTimeMs, false);
      this.logSlowQuery(query, params, executionTimeMs);
      
      return result as QueryResult;
    } catch (error: any) {
      const executionTimeMs = Date.now() - startTime;
      this.updatePerformanceMetrics(executionTimeMs, true);
      this.logSlowQuery(query, params, executionTimeMs);
      
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
      {
        version: 2,
        sql: this.getIndexOptimizationSql(),
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

  private getIndexOptimizationSql(): string {
    return `
      -- Enhanced indexing strategy for query performance optimization
      
      -- Sessions table optimization
      CREATE INDEX IF NOT EXISTS idx_sessions_status_created ON sessions(status, created_at);
      CREATE INDEX IF NOT EXISTS idx_sessions_organizer_status ON sessions(organizer_id, status);
      
      -- Players table optimization
      CREATE INDEX IF NOT EXISTS idx_players_session_status_joined ON players(session_id, status, joined_at);
      CREATE INDEX IF NOT EXISTS idx_players_balance_status ON players(current_balance, status);
      
      -- Transactions table optimization  
      CREATE INDEX IF NOT EXISTS idx_transactions_session_player_time ON transactions(session_id, player_id, timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_transactions_type_time ON transactions(type, timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_transactions_voided_time ON transactions(is_voided, timestamp DESC);
      
      -- Player profiles table optimization
      CREATE INDEX IF NOT EXISTS idx_profiles_last_played_games ON player_profiles(last_played_at DESC, games_played);
      CREATE INDEX IF NOT EXISTS idx_profiles_name_games ON player_profiles(name, games_played);
      
      -- Composite indexes for common query patterns
      CREATE INDEX IF NOT EXISTS idx_active_players_by_session ON players(session_id, status) WHERE status = 'active';
      CREATE INDEX IF NOT EXISTS idx_recent_transactions ON transactions(timestamp DESC, is_voided) WHERE is_voided = 0;
      CREATE INDEX IF NOT EXISTS idx_session_totals ON transactions(session_id, type, amount) WHERE is_voided = 0;
    `;
  }

  public async close(): Promise<void> {
    // Clear optimization timer
    if (this.optimizeTimer) {
      clearTimeout(this.optimizeTimer);
      this.optimizeTimer = null;
    }

    // Clear prepared statements cache
    this.preparedStatements.clear();
    this.statementCache.clear();

    if (this.database) {
      await this.database.close();
      this.database = null;
    }
  }

  // Configuration management
  public updateConfig(newConfig: Partial<DatabaseConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public getConfig(): DatabaseConfig {
    return { ...this.config };
  }

  public async validateConfiguration(): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      if (!this.database) {
        await this.initialize();
      }

      // Validate PRAGMA settings
      const validations = [
        { pragma: 'PRAGMA journal_mode', expected: 'wal' },
        { pragma: 'PRAGMA synchronous', expected: '1' }, // NORMAL = 1
        { pragma: 'PRAGMA foreign_keys', expected: '1' },
      ];

      for (const { pragma, expected } of validations) {
        try {
          const result = await this.executeQuery(pragma);
          const actual = result.rows.item(0)[pragma.split(' ')[1]];
          if (actual.toString().toLowerCase() !== expected) {
            errors.push(`${pragma}: expected ${expected}, got ${actual}`);
          }
        } catch (error) {
          errors.push(`Failed to validate ${pragma}: ${error}`);
        }
      }

      // Validate memory constraints
      const { sizeInBytes } = await this.getDatabaseSize();
      if (sizeInBytes > 100 * 1024 * 1024) { // 100MB warning
        errors.push(`Database size (${Math.round(sizeInBytes / 1024 / 1024)}MB) exceeds recommended limit`);
      }

    } catch (error) {
      errors.push(`Configuration validation failed: ${error}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Connection pool statistics
  public getConnectionPoolStats(): ConnectionPoolStats {
    return {
      totalConnections: this.database ? 1 : 0,
      activeConnections: this.database ? 1 : 0,
      idleConnections: 0,
      preparedStatements: this.preparedStatements.size,
    };
  }

  public async validateConnectionPool(): Promise<{
    healthy: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Check database connection health
      const isConnected = await this.isConnected();
      if (!isConnected) {
        issues.push('Database connection is not available');
        recommendations.push('Restart database service or check connection configuration');
      }

      // Check prepared statement cache health
      const cacheStats = this.getStatementCacheStats();
      if (cacheStats.memoryUsageKB > 1024) { // 1MB limit
        issues.push(`Prepared statement cache using ${cacheStats.memoryUsageKB}KB (>1MB limit)`);
        recommendations.push('Clear prepared statement cache or reduce cache size');
      }

      if (cacheStats.hitRate < 50) {
        issues.push(`Low cache hit rate: ${cacheStats.hitRate.toFixed(1)}%`);
        recommendations.push('Review query patterns or adjust caching strategy');
      }

      // Check for connection pool exhaustion indicators
      const metrics = await this.getDetailedMetrics();
      if (metrics.errorRate > 10) {
        issues.push(`High error rate detected: ${metrics.errorRate.toFixed(2)}%`);
        recommendations.push('Investigate query failures and connection stability');
      }

      return {
        healthy: issues.length === 0,
        issues,
        recommendations,
      };
    } catch (error) {
      return {
        healthy: false,
        issues: ['Connection pool validation failed'],
        recommendations: ['Check database service health and connectivity'],
      };
    }
  }

  // Index management and validation
  public async validateIndexes(): Promise<{
    valid: boolean;
    indexes: Array<{ name: string; table: string; columns: string; exists: boolean }>;
    missing: string[];
  }> {
    try {
      const result = await this.executeQuery(`
        SELECT name, tbl_name, sql 
        FROM sqlite_master 
        WHERE type = 'index' 
        AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `);

      const indexes: Array<{ name: string; table: string; columns: string; exists: boolean }> = [];
      
      for (let i = 0; i < result.rows.length; i++) {
        const row = result.rows.item(i);
        indexes.push({
          name: row.name,
          table: row.tbl_name,
          columns: row.sql || '',
          exists: true,
        });
      }

      // Check for expected indexes from migration v2
      const expectedIndexes = [
        'idx_sessions_status_created',
        'idx_players_session_status_joined',
        'idx_transactions_session_player_time',
        'idx_profiles_last_played_games',
      ];

      const existingIndexNames = indexes.map(idx => idx.name);
      const missing = expectedIndexes.filter(name => !existingIndexNames.includes(name));

      return {
        valid: missing.length === 0,
        indexes,
        missing,
      };
    } catch (error) {
      console.error('Index validation failed:', error);
      return {
        valid: false,
        indexes: [],
        missing: [],
      };
    }
  }

  public async getIndexStatistics(): Promise<{
    totalIndexes: number;
    indexSizeBytes: number;
    indexUsage: Array<{ name: string; usage: number }>;
  }> {
    try {
      // Get index count
      const indexResult = await this.executeQuery(`
        SELECT COUNT(*) as count 
        FROM sqlite_master 
        WHERE type = 'index' 
        AND name NOT LIKE 'sqlite_%'
      `);
      const totalIndexes = indexResult.rows.item(0)?.count || 0;

      // Estimate index size (simplified calculation)
      const sizeResult = await this.executeQuery('PRAGMA page_count');
      const pageCount = sizeResult.rows.item(0)?.page_count || 0;
      const pageSizeResult = await this.executeQuery('PRAGMA page_size');
      const pageSize = pageSizeResult.rows.item(0)?.page_size || 0;
      
      // Rough estimate: indexes typically use 10-30% of total database size
      const indexSizeBytes = Math.round((pageCount * pageSize) * 0.2);

      return {
        totalIndexes,
        indexSizeBytes,
        indexUsage: [], // Real usage stats would require SQLite with STAT4
      };
    } catch (error) {
      console.error('Index statistics failed:', error);
      return {
        totalIndexes: 0,
        indexSizeBytes: 0,
        indexUsage: [],
      };
    }
  }

  // Query analysis and optimization tools
  public async analyzeQuery(sql: string, params: any[] = []): Promise<QueryAnalysis> {
    try {
      if (!this.database) {
        await this.initialize();
      }

      // Get execution plan
      const explainResult = await this.executeQuery(`EXPLAIN QUERY PLAN ${sql}`, params);
      
      const executionPlan: Array<{
        id: number;
        parent: number;
        notused: number;
        detail: string;
      }> = [];

      for (let i = 0; i < explainResult.rows.length; i++) {
        const row = explainResult.rows.item(i);
        executionPlan.push({
          id: row.id,
          parent: row.parent,
          notused: row.notused,
          detail: row.detail,
        });
      }

      // Analyze execution plan for index usage and recommendations
      const analysis = this.analyzeExecutionPlan(executionPlan, sql);

      // Measure actual execution time
      const startTime = Date.now();
      await this.executeQuery(sql, params);
      const executionTimeMs = Date.now() - startTime;

      return {
        sql,
        executionPlan,
        estimatedCost: analysis.estimatedCost,
        indexesUsed: analysis.indexesUsed,
        recommendations: analysis.recommendations,
        executionTimeMs,
      };
    } catch (error) {
      console.error('Query analysis failed:', error);
      return {
        sql,
        executionPlan: [],
        estimatedCost: 0,
        indexesUsed: [],
        recommendations: ['Query analysis failed - check query syntax'],
      };
    }
  }

  private analyzeExecutionPlan(
    plan: Array<{ id: number; parent: number; notused: number; detail: string }>,
    sql: string
  ): {
    estimatedCost: number;
    indexesUsed: string[];
    recommendations: string[];
  } {
    const indexesUsed: string[] = [];
    const recommendations: string[] = [];
    let estimatedCost = 0;

    for (const step of plan) {
      const detail = step.detail.toLowerCase();
      
      // Extract index usage
      if (detail.includes('using index')) {
        const indexMatch = detail.match(/using index (\w+)/);
        if (indexMatch) {
          indexesUsed.push(indexMatch[1]);
        }
      }

      // Analyze cost indicators
      if (detail.includes('scan table')) {
        estimatedCost += 100; // Full table scan is expensive
        if (!detail.includes('using index')) {
          recommendations.push('Consider adding an index for table scan optimization');
        }
      }

      if (detail.includes('search table')) {
        estimatedCost += 10; // Index search is cheap
      }

      // Specific recommendations
      if (detail.includes('temporary b-tree')) {
        estimatedCost += 50;
        recommendations.push('Query uses temporary storage - consider optimizing ORDER BY or GROUP BY');
      }

      if (detail.includes('nested loop')) {
        estimatedCost += 25;
        if (plan.length > 3) {
          recommendations.push('Complex nested loop detected - consider query restructuring');
        }
      }
    }

    // SQL-specific recommendations
    const sqlLower = sql.toLowerCase();
    if (sqlLower.includes('select *')) {
      recommendations.push('Avoid SELECT * - specify only needed columns');
    }

    if (sqlLower.includes('order by') && !indexesUsed.some(idx => idx.includes('timestamp'))) {
      recommendations.push('Consider adding an index for ORDER BY optimization');
    }

    return {
      estimatedCost,
      indexesUsed,
      recommendations,
    };
  }

  public enableQueryLogging(enable: boolean = true): void {
    this.queryLoggingEnabled = enable;
    if (enable) {
      console.log('Database query logging enabled');
    }
  }

  public setSlowQueryThreshold(thresholdMs: number): void {
    this.slowQueryThreshold = thresholdMs;
  }

  public getSlowQueryLog(): SlowQueryLog[] {
    return [...this.slowQueryLog];
  }

  public clearSlowQueryLog(): void {
    this.slowQueryLog = [];
  }

  private logSlowQuery(sql: string, params: any[], executionTimeMs: number): void {
    if (!this.queryLoggingEnabled || executionTimeMs < this.slowQueryThreshold) {
      return;
    }

    const logEntry: SlowQueryLog = {
      sql,
      params,
      executionTimeMs,
      timestamp: new Date(),
      stackTrace: new Error().stack,
    };

    this.slowQueryLog.push(logEntry);

    // Maintain log size limit
    if (this.slowQueryLog.length > this.maxSlowQueryLogSize) {
      this.slowQueryLog.shift();
    }

    console.warn(`Slow query detected (${executionTimeMs.toFixed(2)}ms):`, sql);
  }

  // Enhanced executeQuery with performance monitoring
  public async executeQueryWithTiming(
    query: string,
    params: any[] = []
  ): Promise<{ result: QueryResult; executionTimeMs: number }> {
    const startTime = Date.now();
    
    try {
      const result = await this.executeQuery(query, params);
      const executionTimeMs = Date.now() - startTime;
      
      this.logSlowQuery(query, params, executionTimeMs);
      
      return { result, executionTimeMs };
    } catch (error) {
      const executionTimeMs = Date.now() - startTime;
      this.logSlowQuery(query, params, executionTimeMs);
      throw error;
    }
  }

  // Performance monitoring and metrics
  public async measureQueryPerformance<T>(
    operation: () => Promise<T>
  ): Promise<PerformanceResult<T>> {
    const startTime = Date.now();
    let memoryBefore = 0;
    let memoryAfter = 0;

    try {
      // Get memory usage before operation (simplified)
      const { sizeInBytes: sizeBefore } = await this.getDatabaseSize();
      memoryBefore = sizeBefore;

      // Execute operation
      const result = await operation();
      
      // Calculate execution time
      const executionTimeMs = Date.now() - startTime;
      
      // Get memory usage after operation
      const { sizeInBytes: sizeAfter } = await this.getDatabaseSize();
      memoryAfter = sizeAfter;
      
      // Update performance metrics
      this.updatePerformanceMetrics(executionTimeMs, false);
      
      return {
        result,
        executionTimeMs,
        memoryUsedMB: (memoryAfter - memoryBefore) / (1024 * 1024),
        cacheHits: this.performanceMetrics.cacheHits,
        cacheMisses: this.performanceMetrics.cacheMisses,
      };
    } catch (error) {
      const executionTimeMs = Date.now() - startTime;
      this.updatePerformanceMetrics(executionTimeMs, true);
      throw error;
    }
  }

  private updatePerformanceMetrics(executionTimeMs: number, isError: boolean): void {
    this.performanceMetrics.totalQueries++;
    this.performanceMetrics.totalExecutionTime += executionTimeMs;
    
    if (isError) {
      this.performanceMetrics.totalErrors++;
    }
    
    if (executionTimeMs > this.slowQueryThreshold) {
      this.performanceMetrics.slowQueries++;
    }
  }

  public getDatabaseMetrics(): DatabaseMetrics {
    const totalQueries = this.performanceMetrics.totalQueries;
    const averageQueryTimeMs = totalQueries > 0 
      ? this.performanceMetrics.totalExecutionTime / totalQueries 
      : 0;
    
    const errorRate = totalQueries > 0 
      ? (this.performanceMetrics.totalErrors / totalQueries) * 100 
      : 0;
    
    const totalCacheRequests = this.performanceMetrics.cacheHits + this.performanceMetrics.cacheMisses;
    const cacheHitRate = totalCacheRequests > 0 
      ? (this.performanceMetrics.cacheHits / totalCacheRequests) * 100 
      : 0;

    return {
      totalQueries,
      averageQueryTimeMs,
      slowQueries: this.performanceMetrics.slowQueries,
      errorRate,
      memoryUsageMB: 0, // Will be populated by getDatabaseSize()
      cacheHitRate,
      connectionCount: this.database ? 1 : 0,
      lastUpdated: new Date(),
    };
  }

  public async getDetailedMetrics(): Promise<DatabaseMetrics> {
    const baseMetrics = this.getDatabaseMetrics();
    
    try {
      const { sizeInBytes } = await this.getDatabaseSize();
      baseMetrics.memoryUsageMB = sizeInBytes / (1024 * 1024);
    } catch (error) {
      console.warn('Failed to get database size for metrics:', error);
    }

    return baseMetrics;
  }

  public resetPerformanceMetrics(): void {
    this.performanceMetrics = {
      totalQueries: 0,
      totalExecutionTime: 0,
      slowQueries: 0,
      totalErrors: 0,
      cacheHits: 0,
      cacheMisses: 0,
      startTime: new Date(),
    };
    this.slowQueryLog = [];
  }

  public async validatePerformanceThresholds(): Promise<{
    valid: boolean;
    violations: string[];
    recommendations: string[];
  }> {
    const violations: string[] = [];
    const recommendations: string[] = [];

    try {
      const metrics = await this.getDetailedMetrics();

      // Check 100ms query time requirement
      if (metrics.averageQueryTimeMs > 100) {
        violations.push(`Average query time (${metrics.averageQueryTimeMs.toFixed(2)}ms) exceeds 100ms threshold`);
        recommendations.push('Consider optimizing slow queries and adding indexes');
      }

      // Check 50MB memory usage requirement
      if (metrics.memoryUsageMB > 50) {
        violations.push(`Database memory usage (${metrics.memoryUsageMB.toFixed(2)}MB) exceeds 50MB threshold`);
        recommendations.push('Consider database cleanup, archiving old data, or VACUUM operations');
      }

      // Check error rate
      if (metrics.errorRate > 1) {
        violations.push(`Error rate (${metrics.errorRate.toFixed(2)}%) is too high`);
        recommendations.push('Review and fix failing queries');
      }

      // Check slow query percentage
      const slowQueryPercentage = metrics.totalQueries > 0 
        ? (metrics.slowQueries / metrics.totalQueries) * 100 
        : 0;
      
      if (slowQueryPercentage > 10) {
        violations.push(`Slow query percentage (${slowQueryPercentage.toFixed(2)}%) exceeds 10% threshold`);
        recommendations.push('Optimize slow queries with better indexing or query restructuring');
      }

      return {
        valid: violations.length === 0,
        violations,
        recommendations,
      };
    } catch (error) {
      return {
        valid: false,
        violations: ['Performance validation failed'],
        recommendations: ['Check database connectivity and basic operations'],
      };
    }
  }

  // Prepared statement optimization
  public async executePreparedQuery(
    sql: string,
    params: any[] = []
  ): Promise<QueryResult> {
    // Check if statement is cached
    const cachedStmt = this.statementCache.get(sql);
    
    if (cachedStmt) {
      // Cache hit - use cached statement metadata for optimization
      this.performanceMetrics.cacheHits++;
    } else {
      // Cache miss - add to cache
      this.statementCache.set(sql, params.length);
      this.performanceMetrics.cacheMisses++;
    }

    // Execute query (React Native SQLite doesn't support true prepared statements,
    // but we can optimize by caching query analysis)
    try {
      const result = await this.executeQuery(sql, params);
      
      // Performance metrics are already handled in executeQuery
      return result;
    } catch (error) {
      throw error;
    }
  }

  public getStatementCacheStats(): PreparedStatementStats {
    return this.statementCache.getStats();
  }

  public getFrequentlyUsedStatements(limit: number = 10): Array<{ sql: string; usageCount: number }> {
    return this.statementCache.getFrequentlyUsedStatements(limit);
  }

  public clearStatementCache(): void {
    this.statementCache.clear();
  }

  // Lifecycle management for prepared statements
  public async invalidateStatementCache(): Promise<void> {
    this.statementCache.clear();
    console.log('Prepared statement cache invalidated');
  }

  public async optimizePreparedStatements(): Promise<{
    analyzed: number;
    optimized: number;
    recommendations: string[];
  }> {
    const frequentStatements = this.getFrequentlyUsedStatements(20);
    const recommendations: string[] = [];
    let analyzed = 0;
    let optimized = 0;

    for (const { sql, usageCount } of frequentStatements) {
      analyzed++;
      
      try {
        // Analyze frequently used statements for optimization opportunities
        const analysis = await this.analyzeQuery(sql);
        
        if (analysis.recommendations.length > 0) {
          recommendations.push(
            `Statement used ${usageCount} times: ${sql.substring(0, 50)}...`
          );
          recommendations.push(...analysis.recommendations.map(r => `  → ${r}`));
          optimized++;
        }
      } catch (error) {
        console.warn('Failed to analyze prepared statement:', sql, error);
      }
    }

    return {
      analyzed,
      optimized,
      recommendations,
    };
  }

  // Performance comparison between prepared and dynamic statements
  public async compareStatementPerformance(
    sql: string,
    params: any[] = [],
    iterations: number = 10
  ): Promise<{
    dynamicAverage: number;
    preparedAverage: number;
    improvement: number;
    recommendation: string;
  }> {
    // Test dynamic execution
    const dynamicTimes: number[] = [];
    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      await this.executeQuery(sql, params);
      dynamicTimes.push(Date.now() - startTime);
    }

    // Test prepared execution (with caching)
    const preparedTimes: number[] = [];
    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      await this.executePreparedQuery(sql, params);
      preparedTimes.push(Date.now() - startTime);
    }

    const dynamicAverage = dynamicTimes.reduce((a, b) => a + b, 0) / iterations;
    const preparedAverage = preparedTimes.reduce((a, b) => a + b, 0) / iterations;
    const improvement = ((dynamicAverage - preparedAverage) / dynamicAverage) * 100;

    let recommendation = '';
    if (improvement > 10) {
      recommendation = 'Use prepared statements for significant performance benefit';
    } else if (improvement > 5) {
      recommendation = 'Prepared statements provide modest improvement';
    } else {
      recommendation = 'Dynamic statements are sufficient for this query';
    }

    return {
      dynamicAverage,
      preparedAverage,
      improvement,
      recommendation,
    };
  }

  // Development tools and debugging
  public createProfiler() {
    const { DatabaseProfiler } = require('./DatabaseProfiler');
    return new DatabaseProfiler(this);
  }

  public async getDevelopmentInfo(): Promise<{
    config: any;
    metrics: DatabaseMetrics;
    health: any;
    recommendations: string[];
  }> {
    const config = this.getConfig();
    const metrics = await this.getDetailedMetrics();
    const health = await this.getHealthStatus();
    const validation = await this.validatePerformanceThresholds();

    return {
      config,
      metrics,
      health,
      recommendations: validation.recommendations,
    };
  }

  public async enableDevelopmentMode(): Promise<void> {
    console.log('🔧 Enabling database development mode...');
    
    this.enableQueryLogging(true);
    this.setSlowQueryThreshold(50); // Lower threshold for development
    
    // Log current configuration
    const info = await this.getDevelopmentInfo();
    console.log('📊 Database Development Info:', {
      queries: info.metrics.totalQueries,
      avgTime: info.metrics.averageQueryTimeMs.toFixed(2) + 'ms',
      memory: info.metrics.memoryUsageMB.toFixed(2) + 'MB',
      connections: info.metrics.connectionCount,
    });

    console.log('✅ Development mode enabled');
  }

  public async disableDevelopmentMode(): Promise<void> {
    console.log('🔧 Disabling database development mode...');
    
    this.enableQueryLogging(false);
    this.setSlowQueryThreshold(100); // Back to production threshold
    this.clearSlowQueryLog();
    
    console.log('✅ Development mode disabled');
  }

  // Database seeding utilities for development
  public async seedDevelopmentData(): Promise<void> {
    console.log('🌱 Seeding development data...');
    
    try {
      // Create sample session
      const sessionId = uuidv4();
      await this.createSession({
        name: 'Development Test Session',
        organizerId: 'dev-organizer',
        status: 'active',
        totalPot: 500.00,
        playerCount: 4,
        startedAt: new Date(),
      });

      // Create sample player profiles
      const profiles = [
        { name: 'Alice Johnson', preferredBuyIn: 100 },
        { name: 'Bob Smith', preferredBuyIn: 150 },
        { name: 'Carol Davis', preferredBuyIn: 75 },
        { name: 'Dave Wilson', preferredBuyIn: 125 },
      ];

      for (const profile of profiles) {
        await this.createProfile({
          ...profile,
          gamesPlayed: Math.floor(Math.random() * 20),
          lastPlayedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
        });
      }

      // Add players to session
      for (let i = 0; i < 4; i++) {
        const playerId = uuidv4();
        await this.addPlayer({
          sessionId,
          name: profiles[i].name,
          isGuest: false,
          currentBalance: profiles[i].preferredBuyIn,
          totalBuyIns: profiles[i].preferredBuyIn,
          totalCashOuts: 0,
          status: 'active',
        });

        // Add some transactions
        await this.recordTransaction({
          sessionId,
          playerId,
          type: 'buy_in',
          amount: profiles[i].preferredBuyIn,
          method: Math.random() > 0.5 ? 'voice' : 'manual',
          isVoided: false,
          createdBy: 'dev-seeder',
        });
      }

      console.log('✅ Development data seeded successfully');
      console.log(`   - Session: ${sessionId}`);
      console.log(`   - Players: ${profiles.length}`);
      console.log(`   - Transactions: ${profiles.length}`);
      
    } catch (error) {
      console.error('❌ Failed to seed development data:', error);
      throw new ServiceError('DEV_SEED_FAILED', 'Failed to seed development data');
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

  // Comprehensive database integrity checks
  public async performIntegrityCheck(): Promise<{
    passed: boolean;
    results: {
      integrityCheck: boolean;
      foreignKeyCheck: boolean;
      quickCheck: boolean;
      schemaValidation: boolean;
    };
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    const results = {
      integrityCheck: false,
      foreignKeyCheck: false,
      quickCheck: false,
      schemaValidation: false,
    };

    try {
      // Full integrity check
      const integrityResult = await this.executeQuery('PRAGMA integrity_check');
      const integrityStatus = integrityResult.rows.item(0)?.integrity_check || 'failed';
      results.integrityCheck = integrityStatus === 'ok';
      
      if (!results.integrityCheck) {
        issues.push(`Database integrity check failed: ${integrityStatus}`);
        recommendations.push('Run database repair or restore from backup');
      }

      // Quick check (faster alternative)
      const quickResult = await this.executeQuery('PRAGMA quick_check');
      const quickStatus = quickResult.rows.item(0)?.quick_check || 'failed';
      results.quickCheck = quickStatus === 'ok';
      
      if (!results.quickCheck) {
        issues.push(`Database quick check failed: ${quickStatus}`);
        recommendations.push('Investigate database corruption');
      }

      // Foreign key check
      const foreignKeyResult = await this.executeQuery('PRAGMA foreign_key_check');
      results.foreignKeyCheck = foreignKeyResult.rows.length === 0;
      
      if (!results.foreignKeyCheck) {
        issues.push('Foreign key constraints violated');
        recommendations.push('Fix orphaned records or disable foreign key constraints');
      }

      // Schema validation
      const expectedTables = ['sessions', 'players', 'transactions', 'player_profiles', 'migrations'];
      const tablesResult = await this.executeQuery(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      );
      
      const existingTables: string[] = [];
      for (let i = 0; i < tablesResult.rows.length; i++) {
        existingTables.push(tablesResult.rows.item(i).name);
      }
      
      const missingTables = expectedTables.filter(table => !existingTables.includes(table));
      results.schemaValidation = missingTables.length === 0;
      
      if (!results.schemaValidation) {
        issues.push(`Missing tables: ${missingTables.join(', ')}`);
        recommendations.push('Run database migrations to create missing tables');
      }

      return {
        passed: Object.values(results).every(Boolean),
        results,
        issues,
        recommendations,
      };
    } catch (error) {
      return {
        passed: false,
        results: {
          integrityCheck: false,
          foreignKeyCheck: false,
          quickCheck: false,
          schemaValidation: false,
        },
        issues: [`Integrity check failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        recommendations: ['Check database connectivity and permissions'],
      };
    }
  }

  // Health status for monitoring and debugging
  public async getHealthStatus(): Promise<{
    connected: boolean;
    version: string;
    tablesCount: number;
    integrity?: {
      passed: boolean;
      issues: string[];
    };
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

      // Optional integrity check for comprehensive health status
      let integrity = undefined;
      try {
        const integrityCheck = await this.performIntegrityCheck();
        integrity = {
          passed: integrityCheck.passed,
          issues: integrityCheck.issues,
        };
      } catch (error) {
        // Don't fail health check if integrity check fails
        console.warn('Integrity check failed during health status:', error);
      }

      return {
        connected,
        version,
        tablesCount,
        integrity,
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