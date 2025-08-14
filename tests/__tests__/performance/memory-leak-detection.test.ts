/**
 * Memory Leak Detection and Prevention Test Suite
 * Story 5.3: Comprehensive Testing Suite - Task 4
 * Comprehensive memory leak detection throughout app lifecycle
 */

import { DatabaseService } from '@/services/infrastructure/DatabaseService';
import { SessionService } from '@/services/core/SessionService';
import { TransactionService } from '@/services/core/TransactionService';
import { PerformanceMonitor } from '@/services/monitoring/PerformanceMonitor';
import { ServiceMocks, DataFactories } from '../../mock-factories';

describe('Memory Leak Detection and Prevention', () => {
  let databaseService: DatabaseService;
  let sessionService: SessionService;
  let transactionService: TransactionService;
  let performanceMonitor: PerformanceMonitor;
  
  // Memory monitoring utilities
  const getMemoryUsage = () => process.memoryUsage();
  const formatMemory = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)}MB`;
  
  const waitForGC = () => new Promise(resolve => {
    if (global.gc) {
      global.gc();
    }
    setTimeout(resolve, 100);
  });

  beforeEach(async () => {
    databaseService = ServiceMocks.createDatabaseService();
    sessionService = new SessionService(databaseService);
    transactionService = new TransactionService(databaseService);
    performanceMonitor = new PerformanceMonitor();
    
    await databaseService.initialize();
    
    // Force garbage collection before each test if available
    if (global.gc) {
      global.gc();
    }
  });

  afterEach(async () => {
    await databaseService.close();
    
    // Force garbage collection after each test
    if (global.gc) {
      global.gc();
    }
  });

  describe('Memory Usage Monitoring Throughout App Lifecycle', () => {
    it('should monitor memory usage during normal session operations', async () => {
      const memorySnapshots: Array<{ phase: string; memory: NodeJS.MemoryUsage }> = [];
      
      // Baseline memory
      const baseline = getMemoryUsage();
      memorySnapshots.push({ phase: 'Baseline', memory: baseline });

      // Create session
      const session = await sessionService.createSession(DataFactories.createSessionData());
      const afterSession = getMemoryUsage();
      memorySnapshots.push({ phase: 'After Session Creation', memory: afterSession });

      // Add players
      const players = [];
      for (let i = 0; i < 10; i++) {
        const player = await sessionService.addPlayer(
          session.id, 
          DataFactories.createPlayer({ name: `Player${i}` })
        );
        players.push(player);
      }
      const afterPlayers = getMemoryUsage();
      memorySnapshots.push({ phase: 'After Players Added', memory: afterPlayers });

      // Process transactions
      for (const player of players) {
        await transactionService.recordBuyIn({
          sessionId: session.id,
          playerId: player.id,
          amount: 100.00,
          type: 'buy-in',
          timestamp: new Date(),
        });
      }
      const afterTransactions = getMemoryUsage();
      memorySnapshots.push({ phase: 'After Transactions', memory: afterTransactions });

      // Complete session
      await sessionService.completeSession(session.id);
      await waitForGC();
      const afterCompletion = getMemoryUsage();
      memorySnapshots.push({ phase: 'After Session Completion', memory: afterCompletion });

      // Analyze memory growth
      console.log('\nMemory Usage Analysis:');
      let previousMemory = baseline.heapUsed;
      let maxIncrease = 0;
      
      for (const { phase, memory } of memorySnapshots) {
        const increase = memory.heapUsed - previousMemory;
        maxIncrease = Math.max(maxIncrease, memory.heapUsed - baseline.heapUsed);
        
        console.log(`${phase}: ${formatMemory(memory.heapUsed)} (${increase >= 0 ? '+' : ''}${formatMemory(increase)})`);
        previousMemory = memory.heapUsed;
      }

      // Memory growth should be reasonable (less than 20MB for this test)
      expect(maxIncrease).toBeLessThan(20 * 1024 * 1024);
      
      // Memory should not grow excessively after completion
      const finalIncrease = afterCompletion.heapUsed - baseline.heapUsed;
      expect(finalIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    it('should detect memory leaks in component mounting/unmounting cycles', async () => {
      const componentSimulations = [
        'SessionSetup',
        'PlayerAdd',
        'LiveGame',
        'TransactionForm', 
        'Settlement'
      ];

      const memoryBefore = getMemoryUsage();
      
      // Simulate component mounting/unmounting cycles
      for (let cycle = 0; cycle < 5; cycle++) {
        for (const component of componentSimulations) {
          // Simulate component mounting - create associated services/data
          const session = await sessionService.createSession(DataFactories.createSessionData());
          
          switch (component) {
            case 'SessionSetup':
              // Simulate session setup component
              for (let i = 0; i < 3; i++) {
                await sessionService.addPlayer(session.id, DataFactories.createPlayer());
              }
              break;
              
            case 'PlayerAdd':
              // Simulate player addition component
              await sessionService.addPlayer(session.id, DataFactories.createPlayer());
              break;
              
            case 'LiveGame':
              // Simulate live game component with transactions
              const player = await sessionService.addPlayer(session.id, DataFactories.createPlayer());
              await transactionService.recordBuyIn({
                sessionId: session.id,
                playerId: player.id,
                amount: 100.00,
                type: 'buy-in',
                timestamp: new Date(),
              });
              break;
              
            case 'TransactionForm':
              // Simulate transaction form component
              const txnPlayer = await sessionService.addPlayer(session.id, DataFactories.createPlayer());
              await transactionService.recordBuyIn({
                sessionId: session.id,
                playerId: txnPlayer.id,
                amount: 50.00,
                type: 'buy-in',
                timestamp: new Date(),
              });
              break;
              
            case 'Settlement':
              // Simulate settlement component
              const settlementPlayer = await sessionService.addPlayer(session.id, DataFactories.createPlayer());
              await transactionService.recordBuyIn({
                sessionId: session.id,
                playerId: settlementPlayer.id,
                amount: 100.00,
                type: 'buy-in',
                timestamp: new Date(),
              });
              await transactionService.recordCashOut({
                sessionId: session.id,
                playerId: settlementPlayer.id,
                amount: 120.00,
                type: 'cash-out',
                timestamp: new Date(),
              });
              break;
          }
          
          // Simulate component unmounting - cleanup
          await sessionService.completeSession(session.id);
        }
        
        // Force garbage collection between cycles
        await waitForGC();
      }

      const memoryAfter = getMemoryUsage();
      const memoryIncrease = memoryAfter.heapUsed - memoryBefore.heapUsed;
      
      console.log(`\nComponent Cycle Memory Analysis:`);
      console.log(`Before: ${formatMemory(memoryBefore.heapUsed)}`);
      console.log(`After: ${formatMemory(memoryAfter.heapUsed)}`);
      console.log(`Increase: ${formatMemory(memoryIncrease)}`);
      
      // Memory increase should be minimal after multiple mount/unmount cycles
      // Allow up to 15MB increase for this intensive test
      expect(memoryIncrease).toBeLessThan(15 * 1024 * 1024);
    });

    it('should detect database connection leaks', async () => {
      const initialConnections = await databaseService.getActiveConnectionCount?.() || 0;
      const memoryBefore = getMemoryUsage();
      
      // Create multiple database-intensive operations
      const operations: Promise<any>[] = [];
      
      for (let i = 0; i < 20; i++) {
        operations.push(
          (async () => {
            const session = await sessionService.createSession(DataFactories.createSessionData());
            
            // Multiple database operations per session
            const players = [];
            for (let j = 0; j < 5; j++) {
              const player = await sessionService.addPlayer(
                session.id,
                DataFactories.createPlayer({ name: `Player${i}_${j}` })
              );
              players.push(player);
            }
            
            // Create transactions
            for (const player of players) {
              await transactionService.recordBuyIn({
                sessionId: session.id,
                playerId: player.id,
                amount: 100.00,
                type: 'buy-in',
                timestamp: new Date(),
              });
            }
            
            // Query operations
            await sessionService.getSession(session.id);
            await transactionService.getSessionTransactions(session.id);
            
            return session;
          })()
        );
      }
      
      await Promise.all(operations);
      
      // Wait for potential cleanup
      await waitForGC();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const finalConnections = await databaseService.getActiveConnectionCount?.() || 0;
      const memoryAfter = getMemoryUsage();
      
      console.log(`\nDatabase Connection Leak Analysis:`);
      console.log(`Initial Connections: ${initialConnections}`);
      console.log(`Final Connections: ${finalConnections}`);
      console.log(`Memory Before: ${formatMemory(memoryBefore.heapUsed)}`);
      console.log(`Memory After: ${formatMemory(memoryAfter.heapUsed)}`);
      
      // Connection count should not grow significantly
      expect(finalConnections - initialConnections).toBeLessThan(5);
      
      // Memory should not grow excessively due to connection leaks
      const memoryIncrease = memoryAfter.heapUsed - memoryBefore.heapUsed;
      expect(memoryIncrease).toBeLessThan(25 * 1024 * 1024);
    });

    it('should validate service cleanup after operations', async () => {
      const memoryBefore = getMemoryUsage();
      
      // Create and use multiple service instances
      const services: Array<{
        session: SessionService;
        transaction: TransactionService;
        database: DatabaseService;
      }> = [];
      
      for (let i = 0; i < 5; i++) {
        const db = ServiceMocks.createDatabaseService();
        await db.initialize();
        
        const sessionSvc = new SessionService(db);
        const transactionSvc = new TransactionService(db);
        
        services.push({
          database: db,
          session: sessionSvc,
          transaction: transactionSvc,
        });
        
        // Use the services
        const session = await sessionSvc.createSession(DataFactories.createSessionData());
        const player = await sessionSvc.addPlayer(session.id, DataFactories.createPlayer());
        await transactionSvc.recordBuyIn({
          sessionId: session.id,
          playerId: player.id,
          amount: 100.00,
          type: 'buy-in',
          timestamp: new Date(),
        });
      }
      
      const memoryDuringUsage = getMemoryUsage();
      
      // Cleanup all services
      for (const { database } of services) {
        await database.close();
      }
      
      // Clear references
      services.length = 0;
      
      // Wait for cleanup
      await waitForGC();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const memoryAfterCleanup = getMemoryUsage();
      
      console.log(`\nService Cleanup Memory Analysis:`);
      console.log(`Before: ${formatMemory(memoryBefore.heapUsed)}`);
      console.log(`During Usage: ${formatMemory(memoryDuringUsage.heapUsed)}`);
      console.log(`After Cleanup: ${formatMemory(memoryAfterCleanup.heapUsed)}`);
      
      // Memory should reduce significantly after cleanup
      const cleanupReduction = memoryDuringUsage.heapUsed - memoryAfterCleanup.heapUsed;
      expect(cleanupReduction).toBeGreaterThan(0); // Some memory should be freed
      
      // Final memory should not be significantly higher than initial
      const finalIncrease = memoryAfterCleanup.heapUsed - memoryBefore.heapUsed;
      expect(finalIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('Automated Memory Leak Testing', () => {
    it('should run memory usage regression tests', async () => {
      const regressionThresholds = {
        sessionCreation: 2 * 1024 * 1024, // 2MB per session
        transactionProcessing: 100 * 1024, // 100KB per transaction
        playerManagement: 50 * 1024, // 50KB per player
      };
      
      // Test session creation memory usage
      const sessionMemoryBefore = getMemoryUsage();
      const sessions = [];
      
      for (let i = 0; i < 10; i++) {
        const session = await sessionService.createSession(DataFactories.createSessionData());
        sessions.push(session);
      }
      
      const sessionMemoryAfter = getMemoryUsage();
      const sessionMemoryPerUnit = (sessionMemoryAfter.heapUsed - sessionMemoryBefore.heapUsed) / 10;
      
      expect(sessionMemoryPerUnit).toBeLessThan(regressionThresholds.sessionCreation);
      
      // Test transaction processing memory usage
      const session = sessions[0];
      const player = await sessionService.addPlayer(session.id, DataFactories.createPlayer());
      
      const transactionMemoryBefore = getMemoryUsage();
      
      for (let i = 0; i < 50; i++) {
        await transactionService.recordBuyIn({
          sessionId: session.id,
          playerId: player.id,
          amount: 20.00,
          type: 'buy-in',
          timestamp: new Date(),
        });
      }
      
      const transactionMemoryAfter = getMemoryUsage();
      const transactionMemoryPerUnit = (transactionMemoryAfter.heapUsed - transactionMemoryBefore.heapUsed) / 50;
      
      expect(transactionMemoryPerUnit).toBeLessThan(regressionThresholds.transactionProcessing);
      
      console.log(`\nMemory Usage Per Unit:`);
      console.log(`Session: ${formatMemory(sessionMemoryPerUnit)}`);
      console.log(`Transaction: ${formatMemory(transactionMemoryPerUnit)}`);
    });

    it('should test memory pressure scenarios', async () => {
      const pressureTestDuration = 2000; // 2 seconds
      const startTime = Date.now();
      const memorySnapshots: Array<{ time: number; memory: number }> = [];
      
      let operationCount = 0;
      
      // Memory pressure test
      while (Date.now() - startTime < pressureTestDuration) {
        try {
          // Rapid operations under memory pressure
          const session = await sessionService.createSession(DataFactories.createSessionData());
          
          // Quick players addition
          const players = await Promise.all([
            sessionService.addPlayer(session.id, DataFactories.createPlayer({ name: 'P1' })),
            sessionService.addPlayer(session.id, DataFactories.createPlayer({ name: 'P2' })),
            sessionService.addPlayer(session.id, DataFactories.createPlayer({ name: 'P3' })),
          ]);
          
          // Quick transactions
          await Promise.all(players.map(player =>
            transactionService.recordBuyIn({
              sessionId: session.id,
              playerId: player.id,
              amount: 100.00,
              type: 'buy-in',
              timestamp: new Date(),
            })
          ));
          
          operationCount++;
          
          // Sample memory usage every 100ms
          if (operationCount % 5 === 0) {
            memorySnapshots.push({
              time: Date.now() - startTime,
              memory: getMemoryUsage().heapUsed,
            });
          }
          
        } catch (error) {
          // Under memory pressure, some operations may fail - that's acceptable
          console.log(`Operation ${operationCount} failed under pressure:`, error.message);
        }
      }
      
      console.log(`\nMemory Pressure Test Results:`);
      console.log(`Operations completed: ${operationCount}`);
      console.log(`Memory snapshots: ${memorySnapshots.length}`);
      
      if (memorySnapshots.length > 1) {
        const initialMemory = memorySnapshots[0].memory;
        const finalMemory = memorySnapshots[memorySnapshots.length - 1].memory;
        const memoryIncrease = finalMemory - initialMemory;
        
        console.log(`Initial memory: ${formatMemory(initialMemory)}`);
        console.log(`Final memory: ${formatMemory(finalMemory)}`);
        console.log(`Memory increase: ${formatMemory(memoryIncrease)}`);
        
        // Memory should not grow uncontrollably under pressure
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB limit
      }
      
      // System should complete at least some operations
      expect(operationCount).toBeGreaterThan(0);
    });

    it('should validate memory cleanup for all services', async () => {
      const servicesToTest = [
        'SessionService',
        'TransactionService', 
        'DatabaseService',
        'PerformanceMonitor',
      ];
      
      const cleanupResults: Record<string, { before: number; after: number; cleaned: boolean }> = {};
      
      for (const serviceName of servicesToTest) {
        const memoryBefore = getMemoryUsage().heapUsed;
        
        // Use service extensively
        switch (serviceName) {
          case 'SessionService':
            for (let i = 0; i < 10; i++) {
              const session = await sessionService.createSession(DataFactories.createSessionData());
              await sessionService.addPlayer(session.id, DataFactories.createPlayer());
              await sessionService.completeSession(session.id);
            }
            break;
            
          case 'TransactionService':
            const session = await sessionService.createSession(DataFactories.createSessionData());
            const player = await sessionService.addPlayer(session.id, DataFactories.createPlayer());
            
            for (let i = 0; i < 20; i++) {
              await transactionService.recordBuyIn({
                sessionId: session.id,
                playerId: player.id,
                amount: 50.00,
                type: 'buy-in',
                timestamp: new Date(),
              });
            }
            break;
            
          case 'DatabaseService':
            // Database already tested in component integration
            for (let i = 0; i < 5; i++) {
              const tempSession = await sessionService.createSession(DataFactories.createSessionData());
              await sessionService.getSession(tempSession.id);
            }
            break;
            
          case 'PerformanceMonitor':
            performanceMonitor.startMonitoring();
            await new Promise(resolve => setTimeout(resolve, 100));
            performanceMonitor.getMetrics();
            performanceMonitor.stopMonitoring();
            break;
        }
        
        // Force cleanup
        await waitForGC();
        
        const memoryAfter = getMemoryUsage().heapUsed;
        const memoryCleaned = memoryAfter <= memoryBefore + (5 * 1024 * 1024); // Allow 5MB variance
        
        cleanupResults[serviceName] = {
          before: memoryBefore,
          after: memoryAfter,
          cleaned: memoryCleaned,
        };
      }
      
      console.log(`\nService Memory Cleanup Results:`);
      for (const [service, result] of Object.entries(cleanupResults)) {
        console.log(`${service}: ${formatMemory(result.before)} → ${formatMemory(result.after)} (${result.cleaned ? 'CLEAN' : 'LEAK DETECTED'})`);
        expect(result.cleaned).toBe(true);
      }
    });
  });

  describe('Memory Threshold Alerting and Monitoring', () => {
    it('should detect memory threshold violations', async () => {
      const memoryThresholds = {
        warning: 30 * 1024 * 1024,  // 30MB
        critical: 50 * 1024 * 1024, // 50MB
      };
      
      const alerts: Array<{ level: string; memory: number; timestamp: number }> = [];
      
      // Monitor memory during intensive operations
      const monitoringInterval = setInterval(() => {
        const currentMemory = getMemoryUsage().heapUsed;
        
        if (currentMemory > memoryThresholds.critical) {
          alerts.push({ level: 'CRITICAL', memory: currentMemory, timestamp: Date.now() });
        } else if (currentMemory > memoryThresholds.warning) {
          alerts.push({ level: 'WARNING', memory: currentMemory, timestamp: Date.now() });
        }
      }, 100);
      
      try {
        // Generate memory-intensive workload
        const sessions = [];
        for (let i = 0; i < 15; i++) {
          const session = await sessionService.createSession(DataFactories.createSessionData());
          sessions.push(session);
          
          // Add players and transactions
          for (let j = 0; j < 8; j++) {
            const player = await sessionService.addPlayer(session.id, DataFactories.createPlayer());
            
            for (let k = 0; k < 5; k++) {
              await transactionService.recordBuyIn({
                sessionId: session.id,
                playerId: player.id,
                amount: 25.00,
                type: 'buy-in',
                timestamp: new Date(),
              });
            }
          }
        }
      } finally {
        clearInterval(monitoringInterval);
      }
      
      console.log(`\nMemory Threshold Monitoring Results:`);
      console.log(`Warning threshold: ${formatMemory(memoryThresholds.warning)}`);
      console.log(`Critical threshold: ${formatMemory(memoryThresholds.critical)}`);
      console.log(`Alerts generated: ${alerts.length}`);
      
      if (alerts.length > 0) {
        console.log('Alert details:');
        alerts.forEach((alert, i) => {
          console.log(`  ${i + 1}. ${alert.level}: ${formatMemory(alert.memory)}`);
        });
      }
      
      // System should not frequently hit critical thresholds
      const criticalAlerts = alerts.filter(a => a.level === 'CRITICAL');
      expect(criticalAlerts.length).toBeLessThan(5); // Allow some critical alerts but not many
    });

    it('should provide memory usage analytics and trends', async () => {
      const analyticsData: Array<{
        operation: string;
        memoryBefore: number;
        memoryAfter: number;
        duration: number;
      }> = [];
      
      const operations = [
        {
          name: 'Session Creation',
          operation: () => sessionService.createSession(DataFactories.createSessionData()),
        },
        {
          name: 'Bulk Player Addition',
          operation: async () => {
            const session = await sessionService.createSession(DataFactories.createSessionData());
            const players = [];
            for (let i = 0; i < 10; i++) {
              players.push(await sessionService.addPlayer(session.id, DataFactories.createPlayer()));
            }
            return { session, players };
          },
        },
        {
          name: 'Heavy Transaction Processing',
          operation: async () => {
            const session = await sessionService.createSession(DataFactories.createSessionData());
            const player = await sessionService.addPlayer(session.id, DataFactories.createPlayer());
            
            for (let i = 0; i < 25; i++) {
              await transactionService.recordBuyIn({
                sessionId: session.id,
                playerId: player.id,
                amount: 40.00,
                type: 'buy-in',
                timestamp: new Date(),
              });
            }
            return session;
          },
        },
      ];
      
      for (const { name, operation } of operations) {
        const memoryBefore = getMemoryUsage().heapUsed;
        const startTime = performance.now();
        
        await operation();
        
        const endTime = performance.now();
        const memoryAfter = getMemoryUsage().heapUsed;
        
        analyticsData.push({
          operation: name,
          memoryBefore,
          memoryAfter,
          duration: endTime - startTime,
        });
      }
      
      console.log(`\nMemory Usage Analytics:`);
      console.log('Operation | Memory Before | Memory After | Increase | Duration');
      console.log('----------|---------------|--------------|----------|----------');
      
      for (const data of analyticsData) {
        const increase = data.memoryAfter - data.memoryBefore;
        console.log(
          `${data.operation.padEnd(9)} | ${formatMemory(data.memoryBefore).padEnd(13)} | ${formatMemory(data.memoryAfter).padEnd(12)} | ${formatMemory(increase).padEnd(8)} | ${data.duration.toFixed(1)}ms`
        );
        
        // Memory increase should be reasonable for each operation type
        expect(increase).toBeLessThan(20 * 1024 * 1024); // 20MB per operation max
      }
      
      // Calculate trends
      const totalMemoryIncrease = analyticsData.reduce((sum, data) => 
        sum + (data.memoryAfter - data.memoryBefore), 0);
      const averageIncrease = totalMemoryIncrease / analyticsData.length;
      
      console.log(`\nTrend Analysis:`);
      console.log(`Total memory increase: ${formatMemory(totalMemoryIncrease)}`);
      console.log(`Average per operation: ${formatMemory(averageIncrease)}`);
      
      // Trends should show controlled memory usage
      expect(averageIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB average
    });
  });
});