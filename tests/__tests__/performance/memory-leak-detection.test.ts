/**
 * Memory Leak Detection - Fixed Implementation
 * Story 5.3: Comprehensive Testing Suite - Task 4
 * WSL-compatible memory monitoring without complex dependencies
 */

describe('Memory Leak Detection - Fixed', () => {
  // Memory monitoring utilities
  const getMemoryUsage = () => process.memoryUsage();
  const formatMemory = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)}MB`;
  
  const waitForGC = () => new Promise<void>(resolve => {
    if (global.gc) {
      global.gc();
    }
    setTimeout(resolve, 50);
  });

  beforeEach(async () => {
    // Force garbage collection before each test if available
    if (global.gc) {
      global.gc();
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  afterEach(async () => {
    // Force garbage collection after each test
    await waitForGC();
  });

  it('should track basic memory allocation and cleanup', async () => {
    const memoryBefore = getMemoryUsage().heapUsed;
    
    // Create test data
    const testData: any[] = [];
    for (let i = 0; i < 1000; i++) {
      testData.push({
        id: `test-${i}`,
        name: `Test Item ${i}`,
        data: new Array(50).fill(i),
        timestamp: new Date()
      });
    }
    
    const memoryDuring = getMemoryUsage().heapUsed;
    
    // Clear references
    testData.length = 0;
    await waitForGC();
    
    const memoryAfter = getMemoryUsage().heapUsed;
    
    console.log(`\nBasic Memory Test:`);
    console.log(`Before: ${formatMemory(memoryBefore)}`);
    console.log(`During: ${formatMemory(memoryDuring)}`);
    console.log(`After:  ${formatMemory(memoryAfter)}`);
    
    // Verify memory patterns
    expect(memoryDuring).toBeGreaterThan(memoryBefore);
    
    const memoryIncrease = memoryAfter - memoryBefore;
    expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024); // 5MB threshold
  }, 15000);

  it('should handle repeated allocations without excessive growth', async () => {
    const baseline = getMemoryUsage().heapUsed;
    const snapshots: number[] = [];
    
    // Perform multiple allocation cycles
    for (let cycle = 0; cycle < 5; cycle++) {
      const cycleData = new Array(500).fill(0).map((_, i) => ({
        cycle,
        index: i,
        data: Math.random(),
        timestamp: Date.now()
      }));
      
      // Process the data
      cycleData.forEach(item => {
        (item as any).processed = true;
        (item as any).hash = `${item.cycle}-${item.index}`;
      });
      
      snapshots.push(getMemoryUsage().heapUsed);
      
      // Clear data for next cycle
      cycleData.length = 0;
      await waitForGC();
    }
    
    const finalMemory = getMemoryUsage().heapUsed;
    
    console.log(`\nRepeated Allocation Test:`);
    console.log(`Baseline: ${formatMemory(baseline)}`);
    snapshots.forEach((memory, i) => {
      console.log(`Cycle ${i}: ${formatMemory(memory)} (+${formatMemory(memory - baseline)})`);
    });
    console.log(`Final: ${formatMemory(finalMemory)}`);
    
    // Memory growth should be controlled
    const totalGrowth = finalMemory - baseline;
    expect(totalGrowth).toBeLessThan(10 * 1024 * 1024); // 10MB threshold
  }, 20000);

  it('should validate memory efficiency of operations', async () => {
    const operations = [
      {
        name: 'Object Creation',
        fn: () => {
          const objects = new Array(100).fill(0).map(i => ({
            id: i,
            value: Math.random(),
            metadata: { created: Date.now() }
          }));
          return objects.length;
        }
      },
      {
        name: 'Array Processing',
        fn: () => {
          const arr = new Array(200).fill(0).map((_, i) => i * 2);
          const processed = arr.filter(x => x % 4 === 0).map(x => x / 2);
          return processed.length;
        }
      }
    ];
    
    console.log(`\nOperation Memory Efficiency:`);
    
    for (const { name, fn } of operations) {
      const memBefore = getMemoryUsage().heapUsed;
      const start = performance.now();
      
      const result = fn();
      
      const end = performance.now();
      const memAfter = getMemoryUsage().heapUsed;
      const increase = memAfter - memBefore;
      
      console.log(`${name}: ${formatMemory(increase)} increase, ${(end - start).toFixed(1)}ms`);
      
      // Each operation should be memory-efficient
      expect(increase).toBeLessThan(3 * 1024 * 1024); // 3MB per operation
      expect(result).toBeGreaterThan(0); // Operation should produce results
    }
  }, 10000);

  it('should handle rapid allocations gracefully', async () => {
    const startMemory = getMemoryUsage().heapUsed;
    let operationCount = 0;
    
    // Rapid allocation test (very short duration for WSL compatibility)
    const testStart = Date.now();
    const testDuration = 300; // 300ms
    
    while (Date.now() - testStart < testDuration) {
      try {
        const quickData = new Array(50).fill(0).map(i => ({
          id: `rapid-${operationCount}-${i}`,
          data: Math.random(),
          timestamp: Date.now()
        }));
        
        // Quick processing
        quickData.forEach(item => {
          (item as any).processed = item.data * 2;
        });
        
        operationCount++;
        
      } catch (error) {
        // Under pressure, some operations may fail
        break;
      }
    }
    
    await waitForGC();
    const endMemory = getMemoryUsage().heapUsed;
    
    console.log(`\nRapid Allocation Test:`);
    console.log(`Operations: ${operationCount}`);
    console.log(`Start:  ${formatMemory(startMemory)}`);
    console.log(`End:    ${formatMemory(endMemory)}`);
    console.log(`Growth: ${formatMemory(endMemory - startMemory)}`);
    
    // Should complete operations without excessive memory growth
    expect(operationCount).toBeGreaterThan(0);
    expect(endMemory - startMemory).toBeLessThan(10 * 1024 * 1024); // 10MB
  }, 8000);
});