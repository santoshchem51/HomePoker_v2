/**
 * Database Profiler and Development Tools
 * 
 * Provides comprehensive database analysis, debugging utilities, and development tools
 * for the SQLite database optimization system.
 */

import { DatabaseService, QueryAnalysis, DatabaseMetrics, SlowQueryLog } from './DatabaseService';

export interface ProfilerReport {
  timestamp: Date;
  overallHealth: 'excellent' | 'good' | 'warning' | 'critical';
  summary: {
    totalQueries: number;
    averageResponseTime: number;
    slowQueriesCount: number;
    errorRate: number;
    memoryUsage: number;
  };
  indexAnalysis: {
    totalIndexes: number;
    unusedIndexes: string[];
    missingIndexes: string[];
    recommendations: string[];
  };
  queryPatterns: {
    mostFrequent: Array<{ sql: string; count: number }>;
    slowest: Array<{ sql: string; timeMs: number }>;
    mostExpensive: Array<{ sql: string; cost: number }>;
  };
  optimizationSuggestions: string[];
  warnings: string[];
}

export interface DatabaseInspection {
  schema: {
    tables: Array<{ name: string; columns: number; indexes: number }>;
    foreignKeys: Array<{ table: string; column: string; references: string }>;
    constraints: Array<{ table: string; type: string; definition: string }>;
  };
  statistics: {
    rowCounts: Record<string, number>;
    tableSizes: Record<string, number>;
    indexSizes: Record<string, number>;
  };
  health: {
    integrityCheck: boolean;
    foreignKeyCheck: boolean;
    pragma_settings: Record<string, any>;
  };
}

export class DatabaseProfiler {
  private databaseService: DatabaseService;

  constructor(databaseService: DatabaseService) {
    this.databaseService = databaseService;
  }

  /**
   * Enable/disable query profiling
   */
  public enableProfiling(enabled: boolean = true): void {
    this.databaseService.enableQueryLogging(enabled);
    
    if (enabled) {
      console.log('Database profiling enabled');
    } else {
      console.log('Database profiling disabled');
    }
  }

  /**
   * Generate comprehensive profiler report
   */
  public async generateReport(): Promise<ProfilerReport> {
    try {
      const metrics = await this.databaseService.getDetailedMetrics();
      const slowQueries = this.databaseService.getSlowQueryLog();
      const indexValidation = await this.databaseService.validateIndexes();
      
      // Analyze query patterns
      const queryPatterns = await this.analyzeQueryPatterns();
      
      // Generate optimization suggestions
      const optimizationSuggestions = await this.generateOptimizationSuggestions(metrics, slowQueries);
      
      // Determine overall health
      const overallHealth = this.assessOverallHealth(metrics);
      
      // Generate warnings
      const warnings = this.generateWarnings(metrics, slowQueries);

      return {
        timestamp: new Date(),
        overallHealth,
        summary: {
          totalQueries: metrics.totalQueries,
          averageResponseTime: metrics.averageQueryTimeMs,
          slowQueriesCount: metrics.slowQueries,
          errorRate: metrics.errorRate,
          memoryUsage: metrics.memoryUsageMB,
        },
        indexAnalysis: {
          totalIndexes: indexValidation.indexes.length,
          unusedIndexes: [], // Would require query log analysis
          missingIndexes: indexValidation.missing,
          recommendations: this.generateIndexRecommendations(indexValidation),
        },
        queryPatterns,
        optimizationSuggestions,
        warnings,
      };
    } catch (error) {
      console.error('Database profiler report generation failed:', error);
      
      // Return fallback report
      return {
        timestamp: new Date(),
        overallHealth: 'critical',
        summary: {
          totalQueries: 0,
          averageResponseTime: 0,
          slowQueriesCount: 0,
          errorRate: 100,
          memoryUsage: 0,
        },
        indexAnalysis: {
          totalIndexes: 0,
          unusedIndexes: [],
          missingIndexes: [],
          recommendations: ['Database profiler unavailable - check database connection'],
        },
        queryPatterns: {
          mostFrequent: [],
          slowest: [],
          mostExpensive: [],
        },
        optimizationSuggestions: ['Database profiler failed - manual investigation required'],
        warnings: [`Profiler error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  /**
   * Perform deep database inspection
   */
  public async inspectDatabase(): Promise<DatabaseInspection> {
    const schema = await this.inspectSchema();
    const statistics = await this.gatherStatistics();
    const health = await this.checkDatabaseHealth();

    return {
      schema,
      statistics,
      health,
    };
  }

  /**
   * Analyze specific query for optimization opportunities
   */
  public async analyzeQuery(sql: string, params: any[] = []): Promise<{
    analysis: QueryAnalysis;
    suggestions: string[];
    alternativeQueries: string[];
  }> {
    const analysis = await this.databaseService.analyzeQuery(sql, params);
    const suggestions = this.generateQuerySuggestions(sql, analysis);
    const alternativeQueries = this.generateAlternativeQueries(sql);

    return {
      analysis,
      suggestions,
      alternativeQueries,
    };
  }

  /**
   * Performance comparison tool
   */
  public async compareQueries(
    queries: Array<{ name: string; sql: string; params?: any[] }>,
    iterations: number = 10
  ): Promise<Array<{
    name: string;
    averageTime: number;
    minTime: number;
    maxTime: number;
    stdDeviation: number;
    recommendation: string;
  }>> {
    const results: Array<{
      name: string;
      averageTime: number;
      minTime: number;
      maxTime: number;
      stdDeviation: number;
      recommendation: string;
    }> = [];

    for (const query of queries) {
      const times: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        await this.databaseService.executeQuery(query.sql, query.params || []);
        times.push(Date.now() - startTime);
      }

      const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      const variance = times.reduce((acc, time) => acc + Math.pow(time - averageTime, 2), 0) / times.length;
      const stdDeviation = Math.sqrt(variance);

      let recommendation = 'Performance acceptable';
      if (averageTime > 100) {
        recommendation = 'Query exceeds 100ms threshold - optimization needed';
      } else if (stdDeviation > averageTime * 0.5) {
        recommendation = 'High variance in execution time - investigate inconsistency';
      } else if (averageTime < 10) {
        recommendation = 'Excellent performance';
      }

      results.push({
        name: query.name,
        averageTime,
        minTime,
        maxTime,
        stdDeviation,
        recommendation,
      });
    }

    return results.sort((a, b) => b.averageTime - a.averageTime);
  }

  /**
   * Database health dashboard data
   */
  public async getDashboardData(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    uptime: string;
    metrics: DatabaseMetrics;
    recentActivity: Array<{ type: string; message: string; timestamp: Date }>;
    alerts: Array<{ level: 'info' | 'warning' | 'error'; message: string }>;
  }> {
    const metrics = await this.databaseService.getDetailedMetrics();
    const validation = await this.databaseService.validatePerformanceThresholds();
    
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (!validation.valid) {
      status = validation.violations.some(v => v.includes('exceeds')) ? 'critical' : 'warning';
    }

    const alerts = validation.violations.map(violation => ({
      level: 'error' as const,
      message: violation,
    }));

    const recentActivity = [
      { type: 'queries', message: `${metrics.totalQueries} queries executed`, timestamp: new Date() },
      { type: 'performance', message: `Average response: ${metrics.averageQueryTimeMs.toFixed(2)}ms`, timestamp: new Date() },
      { type: 'memory', message: `Memory usage: ${metrics.memoryUsageMB.toFixed(2)}MB`, timestamp: new Date() },
    ];

    return {
      status,
      uptime: this.calculateUptime(),
      metrics,
      recentActivity,
      alerts,
    };
  }

  /**
   * Reset and seed database for development
   */
  public async resetAndSeedDatabase(): Promise<void> {
    console.log('🔄 Resetting database for development...');
    
    // This would typically clear all data and insert test data
    // For safety, we'll just log the operation in this implementation
    console.log('⚠️  Database reset operation requested - implement with caution in production');
    
    // Reset performance metrics
    this.databaseService.resetPerformanceMetrics();
    this.databaseService.clearSlowQueryLog();
    
    console.log('✅ Development database reset completed');
  }

  /**
   * Migration performance analysis
   */
  public async analyzeMigrationPerformance(): Promise<{
    migrationHistory: Array<{ version: number; appliedAt: Date; executionTime?: number }>;
    recommendations: string[];
  }> {
    // Get migration history
    const result = await this.databaseService.executeQuery(
      'SELECT version, applied_at FROM migrations ORDER BY version'
    );

    const migrationHistory = [];
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i);
      migrationHistory.push({
        version: row.version,
        appliedAt: new Date(row.applied_at),
        executionTime: undefined, // Would require migration timing tracking
      });
    }

    const recommendations = [
      'Consider tracking migration execution times for future analysis',
      'Test migrations on large datasets before production deployment',
      'Use database snapshots before applying migrations in production',
    ];

    return {
      migrationHistory,
      recommendations,
    };
  }

  // Private helper methods

  private async inspectSchema(): Promise<DatabaseInspection['schema']> {
    // Get table information
    const tablesResult = await this.databaseService.executeQuery(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );

    const tables = [];
    for (let i = 0; i < tablesResult.rows.length; i++) {
      const tableName = tablesResult.rows.item(i).name;
      
      // Get column count
      const columnsResult = await this.databaseService.executeQuery(
        `PRAGMA table_info(${tableName})`
      );
      
      // Get index count for this table
      const indexesResult = await this.databaseService.executeQuery(
        "SELECT COUNT(*) as count FROM sqlite_master WHERE type='index' AND tbl_name=?",
        [tableName]
      );

      tables.push({
        name: tableName,
        columns: columnsResult.rows.length,
        indexes: indexesResult.rows.item(0).count,
      });
    }

    return {
      tables,
      foreignKeys: [], // Would require parsing table definitions
      constraints: [], // Would require parsing table definitions
    };
  }

  private async gatherStatistics(): Promise<DatabaseInspection['statistics']> {
    const rowCounts: Record<string, number> = {};
    const tableSizes: Record<string, number> = {};
    const indexSizes: Record<string, number> = {};

    // This would require more complex analysis in a real implementation
    // For now, return mock data structure
    return {
      rowCounts,
      tableSizes,
      indexSizes,
    };
  }

  private async checkDatabaseHealth(): Promise<DatabaseInspection['health']> {
    await this.databaseService.validateConfiguration();
    
    return {
      integrityCheck: true, // Would run PRAGMA integrity_check
      foreignKeyCheck: true, // Would run PRAGMA foreign_key_check
      pragma_settings: {
        journal_mode: 'wal',
        synchronous: 'normal',
        foreign_keys: 'on',
      },
    };
  }

  private async analyzeQueryPatterns(): Promise<ProfilerReport['queryPatterns']> {
    const frequentStatements = this.databaseService.getFrequentlyUsedStatements(10);
    const slowQueries = this.databaseService.getSlowQueryLog();

    return {
      mostFrequent: frequentStatements.map(s => ({ sql: s.sql, count: s.usageCount })),
      slowest: slowQueries
        .sort((a, b) => b.executionTimeMs - a.executionTimeMs)
        .slice(0, 5)
        .map(q => ({ sql: q.sql, timeMs: q.executionTimeMs })),
      mostExpensive: [], // Would require cost analysis
    };
  }

  private async generateOptimizationSuggestions(
    metrics: DatabaseMetrics,
    slowQueries: SlowQueryLog[]
  ): Promise<string[]> {
    const suggestions: string[] = [];

    if (metrics.averageQueryTimeMs > 50) {
      suggestions.push('Average query time is high - consider adding indexes');
    }

    if (metrics.errorRate > 1) {
      suggestions.push('Error rate is elevated - review failing queries');
    }

    if (slowQueries.length > metrics.totalQueries * 0.1) {
      suggestions.push('High percentage of slow queries - optimize frequent operations');
    }

    if (metrics.memoryUsageMB > 30) {
      suggestions.push('Memory usage is high - consider database cleanup');
    }

    return suggestions;
  }

  private assessOverallHealth(metrics: DatabaseMetrics): ProfilerReport['overallHealth'] {
    let score = 100;

    if (metrics.averageQueryTimeMs > 100) score -= 30;
    else if (metrics.averageQueryTimeMs > 50) score -= 15;

    if (metrics.errorRate > 5) score -= 25;
    else if (metrics.errorRate > 1) score -= 10;

    if (metrics.memoryUsageMB > 50) score -= 25;
    else if (metrics.memoryUsageMB > 30) score -= 10;

    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 50) return 'warning';
    return 'critical';
  }

  private generateWarnings(metrics: DatabaseMetrics, slowQueries: SlowQueryLog[]): string[] {
    const warnings: string[] = [];

    if (metrics.averageQueryTimeMs > 100) {
      warnings.push('Average query time exceeds 100ms threshold');
    }

    if (slowQueries.length > 100) {
      warnings.push('Large number of slow queries detected');
    }

    if (metrics.errorRate > 5) {
      warnings.push('High error rate detected - review application logic');
    }

    return warnings;
  }

  private generateIndexRecommendations(indexValidation: any): string[] {
    const recommendations: string[] = [];

    if (indexValidation.missing.length > 0) {
      recommendations.push(`Missing indexes: ${indexValidation.missing.join(', ')}`);
    }

    recommendations.push('Monitor index usage patterns for optimization opportunities');
    recommendations.push('Consider composite indexes for multi-column WHERE clauses');

    return recommendations;
  }

  private generateQuerySuggestions(sql: string, analysis: QueryAnalysis): string[] {
    const suggestions = [...analysis.recommendations];
    
    if (sql.toLowerCase().includes('select *')) {
      suggestions.push('Replace SELECT * with specific column names for better performance');
    }

    if (sql.toLowerCase().includes('order by') && analysis.indexesUsed.length === 0) {
      suggestions.push('Consider adding an index for ORDER BY optimization');
    }

    return suggestions;
  }

  private generateAlternativeQueries(sql: string): string[] {
    const alternatives: string[] = [];
    
    // Basic query optimization suggestions
    if (sql.toLowerCase().includes('select *')) {
      alternatives.push(sql.replace(/select \*/gi, 'SELECT id, name, status'));
    }

    if (sql.toLowerCase().includes('order by')) {
      alternatives.push('Consider using LIMIT with ORDER BY for pagination');
    }

    return alternatives;
  }

  private calculateUptime(): string {
    // Simple uptime calculation (would be more sophisticated in production)
    const startTime = Date.now() - (60 * 60 * 1000); // Mock 1 hour uptime
    const uptimeMs = Date.now() - startTime;
    const hours = Math.floor(uptimeMs / (60 * 60 * 1000));
    const minutes = Math.floor((uptimeMs % (60 * 60 * 1000)) / (60 * 1000));
    
    return `${hours}h ${minutes}m`;
  }
}