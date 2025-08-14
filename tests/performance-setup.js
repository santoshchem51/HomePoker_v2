/**
 * Performance Test Setup - For isolated performance tests
 * Ensures system resources are available and monitored
 */

const os = require('os');

let performanceStartTime;
let performanceStartMemory;

beforeAll(async () => {
  console.log(`[Performance] Performance test environment initialized`);
  
  // Check system resources before starting
  const freeMemory = os.freemem();
  const totalMemory = os.totalmem();
  const memoryUsagePercent = ((totalMemory - freeMemory) / totalMemory) * 100;
  
  console.log(`[Performance] System memory usage: ${memoryUsagePercent.toFixed(1)}%`);
  
  if (memoryUsagePercent > 80) {
    console.warn('[Performance] WARNING: High memory usage detected before performance tests');
  }
  
  // Configure longer timeouts for performance tests
  jest.setTimeout(120000); // 2 minutes
  
  // Mock heavy dependencies for consistent performance testing
  mockHeavyDependencies();
});

beforeEach(() => {
  // Record performance baseline
  performanceStartTime = Date.now();
  performanceStartMemory = process.memoryUsage();
  
  // Force garbage collection if available (for consistent memory testing)
  if (global.gc) {
    global.gc();
  }
});

afterEach(() => {
  // Log performance metrics
  const endTime = Date.now();
  const endMemory = process.memoryUsage();
  
  const executionTime = endTime - performanceStartTime;
  const memoryDelta = endMemory.heapUsed - performanceStartMemory.heapUsed;
  
  console.log(`[Performance] Test execution time: ${executionTime}ms`);
  console.log(`[Performance] Memory delta: ${(memoryDelta / 1024 / 1024).toFixed(2)}MB`);
  
  // Warning for tests that take too long or use too much memory
  if (executionTime > 30000) { // 30 seconds
    console.warn(`[Performance] WARNING: Test took ${executionTime}ms (>30s)`);
  }
  
  if (memoryDelta > 50 * 1024 * 1024) { // 50MB
    console.warn(`[Performance] WARNING: Test used ${(memoryDelta / 1024 / 1024).toFixed(2)}MB memory`);
  }
});

function mockHeavyDependencies() {
  // Mock settlement calculation for consistent performance testing
  global.mockSettlementCalculation = jest.fn((players) => {
    // Simulate processing time
    const startTime = Date.now();
    
    // Mock heavy calculation
    let result = [];
    for (let i = 0; i < players.length; i++) {
      result.push({
        playerId: players[i].id,
        amount: Math.random() * 1000,
        transactions: []
      });
    }
    
    const processingTime = Date.now() - startTime;
    console.log(`[Performance] Settlement calculation simulated in ${processingTime}ms`);
    
    return result;
  });
  
  // Mock database operations with timing
  global.mockDatabaseOperation = jest.fn(async (operation) => {
    const startTime = Date.now();
    
    // Simulate database processing
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const processingTime = Date.now() - startTime;
    console.log(`[Performance] Database ${operation} simulated in ${processingTime}ms`);
    
    return { success: true, processingTime };
  });
}