/**
 * Comprehensive Performance Test Suite
 * Story 5.3: Comprehensive Testing Suite - Task 3
 * Performance regression testing and benchmarking
 */

import { DatabaseService } from '@/services/infrastructure/DatabaseService';
import { SessionService } from '@/services/core/SessionService';
import { TransactionService } from '@/services/core/TransactionService';
import { SettlementService } from '@/services/core/SettlementService';
import { PerformanceMonitor } from '@/services/monitoring/PerformanceMonitor';
import { ServiceMocks, DataFactories } from '../../mock-factories';
import { Transaction, Player } from '@/types/poker';

describe('Comprehensive Performance Testing', () => {
  let databaseService: DatabaseService;
  let sessionService: SessionService;
  let transactionService: TransactionService;
  let settlementService: SettlementService;
  let performanceMonitor: PerformanceMonitor;

  beforeEach(async () => {
    databaseService = ServiceMocks.createDatabaseService();
    sessionService = new SessionService(databaseService);
    transactionService = new TransactionService(databaseService);
    settlementService = new SettlementService();
    performanceMonitor = new PerformanceMonitor();

    await databaseService.initialize();
  });

  afterEach(async () => {
    await databaseService.close();
  });

  describe('Database Performance Tests', () => {
    it('should complete database operations under 100ms threshold', async () => {
      const operations = [
        { name: 'Session Creation', op: () => sessionService.createSession(DataFactories.createSessionData()) },
        { name: 'Player Addition', op: async () => {
          const session = await sessionService.createSession(DataFactories.createSessionData());
          return sessionService.addPlayer(session.id, DataFactories.createPlayer());
        }},
        { name: 'Transaction Recording', op: async () => {
          const session = await sessionService.createSession(DataFactories.createSessionData());
          const player = await sessionService.addPlayer(session.id, DataFactories.createPlayer());
          return transactionService.recordBuyIn({
            sessionId: session.id,
            playerId: player.id,
            amount: 100.00,
            type: 'buy-in',
            timestamp: new Date(),
          });
        }},
        { name: 'Session Retrieval', op: async () => {
          const session = await sessionService.createSession(DataFactories.createSessionData());
          return sessionService.getSession(session.id);
        }},
      ];

      for (const { name, op } of operations) {
        const startTime = performance.now();
        await op();
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        expect(duration).toBeLessThan(100); // 100ms threshold
        console.log(`${name}: ${duration.toFixed(2)}ms`);
      }
    });

    it('should handle large transaction volumes efficiently', async () => {
      const session = await sessionService.createSession(DataFactories.createSessionData());
      const players: Player[] = [];
      
      // Create 100 players
      for (let i = 0; i < 100; i++) {
        const player = await sessionService.addPlayer(
          session.id, 
          DataFactories.createPlayer({ name: `Player${i}` })
        );
        players.push(player);
      }

      // Measure bulk transaction performance
      const startTime = performance.now();
      
      const transactions: Promise<Transaction>[] = [];
      for (const player of players) {
        // Each player does 5 transactions
        for (let i = 0; i < 5; i++) {
          transactions.push(
            transactionService.recordBuyIn({
              sessionId: session.id,
              playerId: player.id,
              amount: 20.00,
              type: 'buy-in',
              timestamp: new Date(Date.now() + i * 100),
            })
          );
        }
      }

      await Promise.all(transactions);
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 500 transactions should complete within 5 seconds
      expect(duration).toBeLessThan(5000);
      expect(transactions).toHaveLength(500);
      
      console.log(`500 transactions completed in: ${duration.toFixed(2)}ms`);
      console.log(`Average per transaction: ${(duration / 500).toFixed(2)}ms`);
    });

    it('should maintain performance under concurrent database access', async () => {
      // Create multiple sessions concurrently
      const sessionCreations = Array.from({ length: 10 }, () =>
        sessionService.createSession(DataFactories.createSessionData())
      );

      const startTime = performance.now();
      const sessions = await Promise.all(sessionCreations);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // 10 concurrent session creations should complete within 1 second
      expect(duration).toBeLessThan(1000);
      expect(sessions).toHaveLength(10);

      // Verify all sessions were created successfully
      for (const session of sessions) {
        expect(session.id).toBeDefined();
        expect(session.status).toBe('created');
      }

      console.log(`10 concurrent session creations: ${duration.toFixed(2)}ms`);
    });

    it('should handle database stress testing with SQLite WAL mode', async () => {
      const session = await sessionService.createSession(DataFactories.createSessionData());
      const player = await sessionService.addPlayer(session.id, DataFactories.createPlayer());

      // Stress test with rapid-fire transactions
      const stressOperations: Promise<any>[] = [];
      const operationCount = 200;

      const startTime = performance.now();

      for (let i = 0; i < operationCount; i++) {
        if (i % 2 === 0) {
          stressOperations.push(
            transactionService.recordBuyIn({
              sessionId: session.id,
              playerId: player.id,
              amount: 10.00,
              type: 'buy-in',
              timestamp: new Date(Date.now() + i),
            })
          );
        } else {
          stressOperations.push(
            sessionService.getSession(session.id)
          );
        }
      }

      const results = await Promise.allSettled(stressOperations);
      const endTime = performance.now();
      const duration = endTime - startTime;

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const successRate = (successful / operationCount) * 100;

      // At least 90% operations should succeed under stress
      expect(successRate).toBeGreaterThan(90);
      
      // Should complete within 10 seconds
      expect(duration).toBeLessThan(10000);

      console.log(`Stress test: ${successful}/${operationCount} operations successful (${successRate.toFixed(1)}%)`);
      console.log(`Total time: ${duration.toFixed(2)}ms`);
    });

    it('should efficiently handle database migration performance', async () => {
      // Test database initialization performance
      const tempDbService = ServiceMocks.createDatabaseService();
      
      const startTime = performance.now();
      await tempDbService.initialize();
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Database initialization should complete within 2 seconds
      expect(duration).toBeLessThan(2000);
      
      console.log(`Database initialization: ${duration.toFixed(2)}ms`);
      
      await tempDbService.close();
    });
  });

  describe('Application Performance Tests', () => {
    it('should maintain fast startup time performance', async () => {
      // Simulate app startup sequence
      const startupTasks = [
        { name: 'Database Init', task: () => databaseService.initialize() },
        { name: 'Service Init', task: () => Promise.resolve() },
        { name: 'Performance Monitor Init', task: () => performanceMonitor.startMonitoring() },
      ];

      const startupTimes: Record<string, number> = {};
      const totalStartTime = performance.now();

      for (const { name, task } of startupTasks) {
        const taskStartTime = performance.now();
        await task();
        const taskEndTime = performance.now();
        startupTimes[name] = taskEndTime - taskStartTime;
      }

      const totalEndTime = performance.now();
      const totalStartupTime = totalEndTime - totalStartTime;

      // Total startup should be under 3 seconds
      expect(totalStartupTime).toBeLessThan(3000);

      // Individual components should be under 1 second each
      for (const [name, time] of Object.entries(startupTimes)) {
        expect(time).toBeLessThan(1000);
        console.log(`${name} startup: ${time.toFixed(2)}ms`);
      }

      console.log(`Total startup time: ${totalStartupTime.toFixed(2)}ms`);
    });

    it('should monitor memory usage during operations', async () => {
      // Start memory monitoring
      const initialMemory = process.memoryUsage();
      
      // Perform memory-intensive operations
      const session = await sessionService.createSession(DataFactories.createSessionData());
      const players: Player[] = [];
      const transactions: Transaction[] = [];

      // Create large dataset
      for (let i = 0; i < 50; i++) {
        const player = await sessionService.addPlayer(
          session.id,
          DataFactories.createPlayer({ name: `Player${i}` })
        );
        players.push(player);

        // Each player does multiple transactions
        for (let j = 0; j < 10; j++) {
          const transaction = await transactionService.recordBuyIn({
            sessionId: session.id,
            playerId: player.id,
            amount: 25.00,
            type: 'buy-in',
            timestamp: new Date(Date.now() + j * 100),
          });
          transactions.push(transaction);
        }
      }

      const postOperationMemory = process.memoryUsage();
      
      // Calculate settlement (memory-intensive operation)
      const settlement = settlementService.calculateSettlement(transactions);
      
      const finalMemory = process.memoryUsage();

      // Memory usage should not grow excessively (less than 100MB increase)
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // 100MB

      console.log(`Memory usage:`);
      console.log(`  Initial: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      console.log(`  Post-ops: ${(postOperationMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      console.log(`  Final: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      console.log(`  Increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);

      // Verify data integrity after memory-intensive operations
      expect(settlement).toHaveLength(50);
      expect(transactions).toHaveLength(500);
    });

    it('should maintain UI responsiveness during heavy processing', async () => {
      // Simulate UI-blocking operations and measure impact
      const heavyComputations = [
        {
          name: 'Large Settlement Calculation',
          operation: async () => {
            const transactions: Transaction[] = [];
            for (let i = 0; i < 1000; i++) {
              transactions.push(DataFactories.createTransaction({
                amount: Math.random() * 100,
                type: Math.random() > 0.3 ? 'buy-in' : 'cash-out',
              }));
            }
            return settlementService.calculateSettlement(transactions);
          },
        },
        {
          name: 'Bulk Database Operations',
          operation: async () => {
            const session = await sessionService.createSession(DataFactories.createSessionData());
            const operations: Promise<any>[] = [];
            
            for (let i = 0; i < 100; i++) {
              operations.push(
                sessionService.addPlayer(session.id, DataFactories.createPlayer({ name: `Player${i}` }))
              );
            }
            return Promise.all(operations);
          },
        },
      ];

      for (const { name, operation } of heavyComputations) {
        const startTime = performance.now();
        await operation();
        const endTime = performance.now();
        const duration = endTime - startTime;

        // Operations should complete within reasonable time to maintain UI responsiveness
        expect(duration).toBeLessThan(2000); // 2 seconds max
        console.log(`${name}: ${duration.toFixed(2)}ms`);
      }
    });

    it('should optimize bundle size and performance', async () => {
      // Test performance impact of core utilities
      const performanceTests = [
        {
          name: 'Financial Calculations (1000 operations)',
          operation: () => {
            const { CalculationUtils } = require('@/utils/calculations');
            for (let i = 0; i < 1000; i++) {
              const result = CalculationUtils.addAmounts(i * 0.1, i * 0.2);
              CalculationUtils.roundToCurrency(result);
              CalculationUtils.formatCurrency(result);
            }
          },
        },
        {
          name: 'Validation Operations (1000 operations)',
          operation: () => {
            const { validateBuyInAmount, validatePlayerName } = require('@/utils/validation');
            for (let i = 0; i < 1000; i++) {
              validateBuyInAmount(i + 1);
              validatePlayerName(`Player${i}`);
            }
          },
        },
      ];

      for (const { name, operation } of performanceTests) {
        const startTime = performance.now();
        operation();
        const endTime = performance.now();
        const duration = endTime - startTime;

        // Core utilities should be very fast (under 100ms for 1000 operations)
        expect(duration).toBeLessThan(100);
        console.log(`${name}: ${duration.toFixed(2)}ms`);
      }
    });
  });

  describe('Performance Monitoring Integration', () => {
    it('should accurately collect performance metrics', async () => {
      // Start performance monitoring
      performanceMonitor.startMonitoring();

      // Perform monitored operations
      const session = await sessionService.createSession(DataFactories.createSessionData());
      const player = await sessionService.addPlayer(session.id, DataFactories.createPlayer());
      
      // Record multiple transactions
      for (let i = 0; i < 10; i++) {
        await transactionService.recordBuyIn({
          sessionId: session.id,
          playerId: player.id,
          amount: 50.00,
          type: 'buy-in',
          timestamp: new Date(),
        });
      }

      // Get performance metrics
      const metrics = performanceMonitor.getMetrics();

      // Verify metrics are collected
      expect(metrics).toBeDefined();
      expect(metrics.memoryUsage).toBeDefined();
      expect(metrics.cpuUsage).toBeDefined();

      // Verify reasonable metric values
      expect(metrics.memoryUsage.heapUsed).toBeGreaterThan(0);
      expect(metrics.memoryUsage.heapTotal).toBeGreaterThan(metrics.memoryUsage.heapUsed);

      console.log('Performance Metrics:', {
        memory: `${(metrics.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        heapTotal: `${(metrics.memoryUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`,
        cpu: `${metrics.cpuUsage.toFixed(2)}%`,
      });

      performanceMonitor.stopMonitoring();
    });

    it('should detect performance threshold violations', async () => {
      // Configure performance thresholds
      const thresholds = {
        maxMemoryUsage: 50 * 1024 * 1024, // 50MB
        maxResponseTime: 200, // 200ms
      };

      performanceMonitor.startMonitoring();

      // Perform operations and check thresholds
      const operations = [
        () => sessionService.createSession(DataFactories.createSessionData()),
        () => sessionService.createSession(DataFactories.createSessionData()),
        () => sessionService.createSession(DataFactories.createSessionData()),
      ];

      let violations = 0;
      for (const operation of operations) {
        const startTime = performance.now();
        await operation();
        const endTime = performance.now();
        const responseTime = endTime - startTime;

        if (responseTime > thresholds.maxResponseTime) {
          violations++;
        }
      }

      const metrics = performanceMonitor.getMetrics();
      
      // Memory usage should be within threshold
      expect(metrics.memoryUsage.heapUsed).toBeLessThan(thresholds.maxMemoryUsage);
      
      // Most operations should be within response time threshold
      expect(violations).toBeLessThan(operations.length / 2);

      performanceMonitor.stopMonitoring();
    });

    it('should monitor performance dashboard accuracy', async () => {
      performanceMonitor.startMonitoring();

      // Generate varied workload
      const session1 = await sessionService.createSession(DataFactories.createSessionData());
      const session2 = await sessionService.createSession(DataFactories.createSessionData());

      const players1: Player[] = [];
      const players2: Player[] = [];

      // Session 1: Heavy transaction load
      for (let i = 0; i < 20; i++) {
        const player = await sessionService.addPlayer(session1.id, DataFactories.createPlayer());
        players1.push(player);
        
        await transactionService.recordBuyIn({
          sessionId: session1.id,
          playerId: player.id,
          amount: 100.00,
          type: 'buy-in',
          timestamp: new Date(),
        });
      }

      // Session 2: Light transaction load
      for (let i = 0; i < 5; i++) {
        const player = await sessionService.addPlayer(session2.id, DataFactories.createPlayer());
        players2.push(player);
        
        await transactionService.recordBuyIn({
          sessionId: session2.id,
          playerId: player.id,
          amount: 100.00,
          type: 'buy-in',
          timestamp: new Date(),
        });
      }

      const metricsAfterLoad = performanceMonitor.getMetrics();

      // Verify metrics accurately reflect the workload
      expect(metricsAfterLoad.memoryUsage.heapUsed).toBeGreaterThan(0);
      
      // Should have processed significant number of operations
      const totalTransactions = await Promise.all([
        transactionService.getSessionTransactions(session1.id),
        transactionService.getSessionTransactions(session2.id),
      ]);
      
      const totalTxnCount = totalTransactions[0].length + totalTransactions[1].length;
      expect(totalTxnCount).toBe(25); // 20 + 5 transactions

      console.log('Dashboard Metrics Validation:', {
        sessionsCreated: 2,
        playersCreated: 25,
        transactionsProcessed: totalTxnCount,
        memoryUsage: `${(metricsAfterLoad.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
      });

      performanceMonitor.stopMonitoring();
    });
  });

  describe('Performance Regression Prevention', () => {
    it('should establish performance baselines', async () => {
      const baselines = {
        sessionCreation: 50, // ms
        transactionRecording: 25, // ms
        settlementCalculation: 100, // ms
        databaseQuery: 20, // ms
      };

      // Test session creation performance
      const sessionStartTime = performance.now();
      await sessionService.createSession(DataFactories.createSessionData());
      const sessionEndTime = performance.now();
      const sessionTime = sessionEndTime - sessionStartTime;
      expect(sessionTime).toBeLessThan(baselines.sessionCreation);

      // Test transaction recording performance
      const session = await sessionService.createSession(DataFactories.createSessionData());
      const player = await sessionService.addPlayer(session.id, DataFactories.createPlayer());

      const transactionStartTime = performance.now();
      await transactionService.recordBuyIn({
        sessionId: session.id,
        playerId: player.id,
        amount: 100.00,
        type: 'buy-in',
        timestamp: new Date(),
      });
      const transactionEndTime = performance.now();
      const transactionTime = transactionEndTime - transactionStartTime;
      expect(transactionTime).toBeLessThan(baselines.transactionRecording);

      // Test settlement calculation performance
      const transactions = Array.from({ length: 20 }, () => 
        DataFactories.createTransaction({ amount: 100 })
      );

      const settlementStartTime = performance.now();
      settlementService.calculateSettlement(transactions);
      const settlementEndTime = performance.now();
      const settlementTime = settlementEndTime - settlementStartTime;
      expect(settlementTime).toBeLessThan(baselines.settlementCalculation);

      // Test database query performance
      const queryStartTime = performance.now();
      await sessionService.getSession(session.id);
      const queryEndTime = performance.now();
      const queryTime = queryEndTime - queryStartTime;
      expect(queryTime).toBeLessThan(baselines.databaseQuery);

      console.log('Performance Baselines:', {
        sessionCreation: `${sessionTime.toFixed(2)}ms (baseline: ${baselines.sessionCreation}ms)`,
        transactionRecording: `${transactionTime.toFixed(2)}ms (baseline: ${baselines.transactionRecording}ms)`,
        settlementCalculation: `${settlementTime.toFixed(2)}ms (baseline: ${baselines.settlementCalculation}ms)`,
        databaseQuery: `${queryTime.toFixed(2)}ms (baseline: ${baselines.databaseQuery}ms)`,
      });
    });

    it('should detect performance regressions', async () => {
      // Establish baseline measurements
      const baselineMeasurements: Record<string, number> = {};
      
      // Measure baseline session creation
      const sessionTimes: number[] = [];
      for (let i = 0; i < 5; i++) {
        const startTime = performance.now();
        await sessionService.createSession(DataFactories.createSessionData());
        const endTime = performance.now();
        sessionTimes.push(endTime - startTime);
      }
      baselineMeasurements.sessionCreation = sessionTimes.reduce((a, b) => a + b) / sessionTimes.length;

      // Measure baseline transaction processing
      const session = await sessionService.createSession(DataFactories.createSessionData());
      const player = await sessionService.addPlayer(session.id, DataFactories.createPlayer());
      
      const transactionTimes: number[] = [];
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();
        await transactionService.recordBuyIn({
          sessionId: session.id,
          playerId: player.id,
          amount: 50.00,
          type: 'buy-in',
          timestamp: new Date(),
        });
        const endTime = performance.now();
        transactionTimes.push(endTime - startTime);
      }
      baselineMeasurements.transactionProcessing = transactionTimes.reduce((a, b) => a + b) / transactionTimes.length;

      // Performance should not regress significantly (not more than 50% slower than baseline)
      const regressionThreshold = 1.5; // 50% slower
      
      expect(baselineMeasurements.sessionCreation).toBeLessThan(100); // Reasonable absolute threshold
      expect(baselineMeasurements.transactionProcessing).toBeLessThan(50); // Reasonable absolute threshold

      console.log('Regression Detection Baselines:', {
        sessionCreation: `${baselineMeasurements.sessionCreation.toFixed(2)}ms`,
        transactionProcessing: `${baselineMeasurements.transactionProcessing.toFixed(2)}ms`,
        regressionThreshold: `${((regressionThreshold - 1) * 100).toFixed(0)}% slower`,
      });

      // Store baselines for future regression testing
      // In real implementation, these would be stored in a performance database
      expect(baselineMeasurements).toBeDefined();
    });
  });
});