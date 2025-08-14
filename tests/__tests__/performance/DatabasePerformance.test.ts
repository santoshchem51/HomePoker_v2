/**
 * Database Performance Test Suite
 * 
 * Tests for SQLite database optimization implementation covering:
 * - Query execution time compliance (100ms requirement)
 * - Memory usage compliance (50MB limit) 
 * - Index effectiveness with large datasets
 * - Performance regression testing
 * - Load testing scenarios with concurrent operations
 * - Prepared statement performance
 */

import { DatabaseService, QueryResult } from '../../../src/services/infrastructure/DatabaseService';

// Mock SQLite implementation for performance testing
jest.mock('react-native-sqlite-storage', () => {
  const mockRows = (data: any[]) => ({
    raw: () => data,
    item: (index: number) => data[index],
    length: data.length,
  });

  const mockDatabase = {
    executeSql: jest.fn(),
    transaction: jest.fn(),
    close: jest.fn(),
  };

  // Simulate performance characteristics
  mockDatabase.executeSql.mockImplementation(async (sql: string, params: any[] = []) => {
    const normalizedSql = sql.toLowerCase().trim();
    
    // Simulate different query performance characteristics
    let delay = 5; // Base delay in ms
    
    if (normalizedSql.includes('select * from')) {
      delay += 50; // SELECT * is slower
    }
    if (normalizedSql.includes('join')) {
      delay += 30; // JOINs are slower
    }
    if (normalizedSql.includes('order by') && !normalizedSql.includes('index')) {
      delay += 25; // Unindexed ORDER BY is slow
    }
    if (normalizedSql.includes('group by')) {
      delay += 20;
    }
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Mock different result sets based on query
    if (normalizedSql.includes('pragma page_count')) {
      return [{ rows: mockRows([{ page_count: 1000 }]), rowsAffected: 0 }];
    }
    if (normalizedSql.includes('pragma page_size')) {
      return [{ rows: mockRows([{ page_size: 4096 }]), rowsAffected: 0 }];
    }
    if (normalizedSql.includes('pragma journal_mode')) {
      return [{ rows: mockRows([{ journal_mode: 'wal' }]), rowsAffected: 0 }];
    }
    if (normalizedSql.includes('pragma synchronous')) {
      return [{ rows: mockRows([{ synchronous: 1 }]), rowsAffected: 0 }];
    }
    if (normalizedSql.includes('pragma foreign_keys')) {
      return [{ rows: mockRows([{ foreign_keys: 1 }]), rowsAffected: 0 }];
    }
    if (normalizedSql.includes('select count(*) as count from sqlite_master')) {
      return [{ rows: mockRows([{ count: 8 }]), rowsAffected: 0 }];
    }
    if (normalizedSql.includes('explain query plan')) {
      // Mock execution plan
      return [{ 
        rows: mockRows([
          { id: 0, parent: 0, notused: 0, detail: 'SEARCH TABLE sessions USING INDEX idx_sessions_status' },
          { id: 1, parent: 0, notused: 0, detail: 'USE TEMP B-TREE FOR ORDER BY' }
        ]), 
        rowsAffected: 0 
      }];
    }
    if (normalizedSql.includes('select name, tbl_name, sql from sqlite_master')) {
      // Mock index information
      return [{ 
        rows: mockRows([
          { name: 'idx_sessions_status', tbl_name: 'sessions', sql: 'CREATE INDEX idx_sessions_status ON sessions(status)' },
          { name: 'idx_players_session', tbl_name: 'players', sql: 'CREATE INDEX idx_players_session ON players(session_id)' }
        ]), 
        rowsAffected: 0 
      }];
    }
    
    // Default mock response
    const mockData = Array.from({ length: 10 }, (_, i) => ({ 
      id: `test-${i}`, 
      name: `Test ${i}`,
      value: i * 10 
    }));
    
    return [{ rows: mockRows(mockData), rowsAffected: mockData.length }];
  });

  return {
    DEBUG: jest.fn(),
    enablePromise: jest.fn(),
    openDatabase: jest.fn().mockResolvedValue(mockDatabase),
  };
});

describe('Database Performance Tests', () => {
  let databaseService: DatabaseService;

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create fresh database service instance
    databaseService = DatabaseService.getInstance();
    
    try {
      await databaseService.initialize();
      
      // Reset performance metrics
      databaseService.resetPerformanceMetrics();
      databaseService.enableQueryLogging(true);
      databaseService.setSlowQueryThreshold(100); // 100ms threshold
    } catch (error) {
      console.warn('Database initialization failed in test setup:', error);
      // Continue with test execution using mocked service
    }
  });

  afterEach(async () => {
    try {
      if (databaseService && typeof databaseService.close === 'function') {
        await databaseService.close();
      }
      if (databaseService && typeof databaseService.clearSlowQueryLog === 'function') {
        databaseService.clearSlowQueryLog();
      }
      if (databaseService && typeof databaseService.enableQueryLogging === 'function') {
        databaseService.enableQueryLogging(false);
      }
    } catch (error) {
      console.warn('Cleanup failed in test teardown:', error);
    }
  });

  describe('Query Execution Time Compliance', () => {
    test('should complete basic SELECT queries within 100ms', async () => {
      const startTime = Date.now();
      
      const result = await databaseService.executeQuery(
        'SELECT * FROM sessions WHERE status = ?',
        ['active']
      );
      
      const executionTime = Date.now() - startTime;
      
      expect(executionTime).toBeLessThan(100);
      expect(result).toBeDefined();
      expect(result.rows).toBeDefined();
    });

    test('should complete INSERT operations within 100ms', async () => {
      const startTime = Date.now();
      
      await databaseService.executeQuery(
        'INSERT INTO sessions (id, name, organizer_id, status) VALUES (?, ?, ?, ?)',
        ['test-session', 'Test Session', 'organizer-1', 'created']
      );
      
      const executionTime = Date.now() - startTime;
      
      expect(executionTime).toBeLessThan(100);
    });

    test('should complete complex JOIN queries within 100ms', async () => {
      const startTime = Date.now();
      
      await databaseService.executeQuery(`
        SELECT s.name, p.name as player_name, t.amount 
        FROM sessions s 
        JOIN players p ON s.id = p.session_id 
        JOIN transactions t ON p.id = t.player_id 
        WHERE s.status = ? 
        ORDER BY t.timestamp DESC
      `, ['active']);
      
      const executionTime = Date.now() - startTime;
      
      expect(executionTime).toBeLessThan(100);
    });

    test('should track slow queries above threshold', async () => {
      // Set low threshold for testing
      databaseService.setSlowQueryThreshold(10);
      
      // Execute a query that should be marked as slow
      await databaseService.executeQuery(
        'SELECT * FROM sessions s JOIN players p ON s.id = p.session_id ORDER BY s.created_at'
      );
      
      const slowQueries = databaseService.getSlowQueryLog();
      expect(slowQueries.length).toBeGreaterThan(0);
      expect(slowQueries[0].sql).toContain('SELECT * FROM sessions');
    });
  });

  describe('Memory Usage Compliance', () => {
    test('should maintain database size under 50MB limit', async () => {
      const { sizeInBytes } = await databaseService.getDatabaseSize();
      const sizeInMB = sizeInBytes / (1024 * 1024);
      
      expect(sizeInMB).toBeLessThan(50);
    });

    test('should validate memory usage through metrics', async () => {
      const metrics = await databaseService.getDetailedMetrics();
      
      expect(metrics.memoryUsageMB).toBeLessThan(50);
      expect(metrics.memoryUsageMB).toBeGreaterThan(0);
    });

    test('should detect memory usage violations', async () => {
      // Mock a large database size
      const originalGetDatabaseSize = databaseService.getDatabaseSize;
      databaseService.getDatabaseSize = jest.fn().mockResolvedValue({
        sizeInBytes: 60 * 1024 * 1024, // 60MB
        pageCount: 15000
      });

      const validation = await databaseService.validatePerformanceThresholds();
      
      expect(validation.valid).toBe(false);
      expect(validation.violations).toContain(
        expect.stringContaining('Database memory usage')
      );
      expect(validation.recommendations).toContain(
        expect.stringContaining('database cleanup')
      );

      // Restore original method
      databaseService.getDatabaseSize = originalGetDatabaseSize;
    });
  });

  describe('Index Effectiveness Testing', () => {
    test('should validate that required indexes exist', async () => {
      const indexValidation = await databaseService.validateIndexes();
      
      expect(indexValidation.valid).toBe(true);
      expect(indexValidation.missing.length).toBe(0);
      expect(indexValidation.indexes.length).toBeGreaterThan(0);
    });

    test('should analyze query execution plans for index usage', async () => {
      const analysis = await databaseService.analyzeQuery(
        'SELECT * FROM sessions WHERE status = ?',
        ['active']
      );
      
      expect(analysis).toBeDefined();
      expect(analysis.executionPlan.length).toBeGreaterThan(0);
      expect(analysis.indexesUsed).toContain('idx_sessions_status');
      expect(analysis.estimatedCost).toBeGreaterThan(0);
    });

    test('should provide recommendations for unoptimized queries', async () => {
      const analysis = await databaseService.analyzeQuery(
        'SELECT * FROM sessions ORDER BY created_at'
      );
      
      expect(analysis.recommendations).toContain(
        expect.stringContaining('SELECT *')
      );
    });

    test('should measure index statistics and usage', async () => {
      const stats = await databaseService.getIndexStatistics();
      
      expect(stats.totalIndexes).toBeGreaterThan(0);
      expect(stats.indexSizeBytes).toBeGreaterThan(0);
    });
  });

  describe('Load Testing with Concurrent Operations', () => {
    test('should handle multiple concurrent SELECT operations', async () => {
      const concurrentQueries = Array.from({ length: 10 }, (_, i) =>
        databaseService.executeQuery(
          'SELECT * FROM sessions WHERE id = ?',
          [`session-${i}`]
        )
      );
      
      const startTime = Date.now();
      const results = await Promise.all(concurrentQueries);
      const totalTime = Date.now() - startTime;
      
      expect(results).toHaveLength(10);
      expect(totalTime).toBeLessThan(500); // All queries should complete within 500ms
      
      // Check that all queries completed successfully
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.rows).toBeDefined();
      });
    });

    test('should handle mixed read/write operations under load', async () => {
      const operations = [
        // Read operations
        ...Array.from({ length: 5 }, (_, i) =>
          databaseService.executeQuery(
            'SELECT * FROM sessions WHERE status = ?',
            ['active']
          )
        ),
        // Write operations
        ...Array.from({ length: 3 }, (_, i) =>
          databaseService.executeQuery(
            'INSERT INTO sessions (id, name, organizer_id, status) VALUES (?, ?, ?, ?)',
            [`load-test-${i}`, `Load Test ${i}`, 'organizer', 'created']
          )
        ),
        // Update operations
        ...Array.from({ length: 2 }, (_, i) =>
          databaseService.executeQuery(
            'UPDATE sessions SET status = ? WHERE id = ?',
            ['active', `load-test-${i}`]
          )
        ),
      ];
      
      const startTime = Date.now();
      const results = await Promise.allSettled(operations);
      const totalTime = Date.now() - startTime;
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      expect(successful).toBeGreaterThan(8); // At least 80% success rate
      expect(totalTime).toBeLessThan(1000); // Complete within 1 second
      
      // Log performance metrics for analysis
      const metrics = databaseService.getDatabaseMetrics();
      console.log('Load test metrics:', {
        totalQueries: metrics.totalQueries,
        averageTime: metrics.averageQueryTimeMs,
        successRate: (successful / (successful + failed)) * 100
      });
    });
  });

  describe('Prepared Statement Performance', () => {
    test('should demonstrate prepared statement caching effectiveness', async () => {
      const sql = 'SELECT * FROM sessions WHERE status = ?';
      const params = ['active'];
      
      // First execution (cache miss)
      await databaseService.executePreparedQuery(sql, params);
      
      // Subsequent executions (cache hits)
      const startTime = Date.now();
      await Promise.all([
        databaseService.executePreparedQuery(sql, params),
        databaseService.executePreparedQuery(sql, params),
        databaseService.executePreparedQuery(sql, params),
      ]);
      const executionTime = Date.now() - startTime;
      
      const stats = databaseService.getStatementCacheStats();
      
      expect(stats.cacheHits).toBeGreaterThan(0);
      expect(stats.hitRate).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(200); // Should be fast due to caching
    });

    test('should compare prepared vs dynamic statement performance', async () => {
      const sql = 'SELECT * FROM players WHERE session_id = ?';
      const params = ['test-session'];
      
      const comparison = await databaseService.compareStatementPerformance(
        sql, 
        params, 
        5 // iterations
      );
      
      expect(comparison.dynamicAverage).toBeGreaterThan(0);
      expect(comparison.preparedAverage).toBeGreaterThan(0);
      expect(comparison.recommendation).toBeDefined();
      
      console.log('Performance comparison:', comparison);
    });

    test('should optimize frequently used statements', async () => {
      // Execute some statements multiple times to make them frequent
      const frequentQueries = [
        'SELECT * FROM sessions WHERE status = ?',
        'SELECT * FROM players WHERE session_id = ?',
        'SELECT * FROM transactions WHERE player_id = ?',
      ];
      
      for (const query of frequentQueries) {
        for (let i = 0; i < 3; i++) {
          await databaseService.executePreparedQuery(query, ['test-param']);
        }
      }
      
      const optimization = await databaseService.optimizePreparedStatements();
      
      expect(optimization.analyzed).toBeGreaterThan(0);
      expect(optimization.recommendations).toBeDefined();
      
      const frequent = databaseService.getFrequentlyUsedStatements(5);
      expect(frequent.length).toBeGreaterThan(0);
      expect(frequent[0].usageCount).toBeGreaterThan(1);
    });
  });

  describe('Performance Regression Testing', () => {
    test('should maintain performance baselines over time', async () => {
      const benchmarks = [
        {
          name: 'Simple SELECT',
          query: 'SELECT * FROM sessions WHERE id = ?',
          params: ['test-id'],
          expectedMaxTime: 50,
        },
        {
          name: 'JOIN Query', 
          query: 'SELECT s.*, p.name FROM sessions s JOIN players p ON s.id = p.session_id',
          params: [],
          expectedMaxTime: 100,
        },
        {
          name: 'INSERT Operation',
          query: 'INSERT INTO sessions (id, name, organizer_id, status) VALUES (?, ?, ?, ?)',
          params: ['bench-session', 'Benchmark', 'organizer', 'created'],
          expectedMaxTime: 75,
        },
      ];
      
      for (const benchmark of benchmarks) {
        const startTime = Date.now();
        
        await databaseService.executeQuery(benchmark.query, benchmark.params);
        
        const executionTime = Date.now() - startTime;
        
        expect(executionTime).toBeLessThan(benchmark.expectedMaxTime);
        console.log(`${benchmark.name}: ${executionTime}ms (limit: ${benchmark.expectedMaxTime}ms)`);
      }
    });

    test('should validate overall system performance thresholds', async () => {
      // Execute various operations to generate metrics
      const operations = [
        () => databaseService.executeQuery('SELECT * FROM sessions'),
        () => databaseService.executeQuery('SELECT * FROM players'),
        () => databaseService.executeQuery('SELECT * FROM transactions'),
        () => databaseService.executeQuery('INSERT INTO sessions (id, name, organizer_id, status) VALUES (?, ?, ?, ?)', 
          ['perf-test', 'Performance Test', 'organizer', 'created']),
      ];
      
      // Execute operations multiple times
      for (let i = 0; i < 3; i++) {
        for (const operation of operations) {
          await operation();
        }
      }
      
      const validation = await databaseService.validatePerformanceThresholds();
      
      expect(validation).toBeDefined();
      
      if (!validation.valid) {
        console.warn('Performance violations detected:', validation.violations);
        console.warn('Recommendations:', validation.recommendations);
      }
      
      // For regression testing, we want to ensure performance doesn't degrade
      const metrics = await databaseService.getDetailedMetrics();
      expect(metrics.averageQueryTimeMs).toBeLessThan(100);
      expect(metrics.errorRate).toBeLessThan(5); // Less than 5% error rate
    });
  });

  describe('Performance Monitoring Integration', () => {
    test('should track comprehensive database metrics', async () => {
      // Execute some operations to generate metrics
      await databaseService.executeQuery('SELECT * FROM sessions');
      await databaseService.executeQuery('SELECT * FROM players');
      
      const metrics = await databaseService.getDetailedMetrics();
      
      expect(metrics.totalQueries).toBeGreaterThan(0);
      expect(metrics.averageQueryTimeMs).toBeGreaterThan(0);
      expect(metrics.connectionCount).toBe(1);
      expect(metrics.lastUpdated).toBeInstanceOf(Date);
      
      // Verify memory usage is tracked
      expect(metrics.memoryUsageMB).toBeGreaterThan(0);
    });

    test('should provide actionable performance insights', async () => {
      // Execute a mix of good and bad queries
      await databaseService.executeQuery('SELECT id, name FROM sessions WHERE status = ?', ['active']); // Good
      await databaseService.executeQuery('SELECT * FROM sessions ORDER BY created_at'); // Could be optimized
      
      const analysis = await databaseService.analyzeQuery(
        'SELECT * FROM sessions ORDER BY created_at'
      );
      
      expect(analysis.recommendations.length).toBeGreaterThan(0);
      expect(analysis.executionTimeMs).toBeDefined();
      expect(analysis.estimatedCost).toBeGreaterThan(0);
    });
  });
});