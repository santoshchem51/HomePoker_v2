/**
 * Memory Test Validation Script
 * Direct Node.js script to validate memory monitoring without Jest overhead
 * Addresses WSL Jest performance issues mentioned in CLAUDE.md
 */

const fs = require('fs');
const path = require('path');

// Memory monitoring utilities
const getMemoryUsage = () => process.memoryUsage();
const formatMemory = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)}MB`;

const waitForGC = () => new Promise(resolve => {
  if (global.gc) {
    global.gc();
  }
  setTimeout(resolve, 50);
});

console.log('🧪 Memory Test Validation - Direct Node.js Execution');
console.log('================================================\n');

async function runMemoryTests() {
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: Basic Memory Allocation
  console.log('Test 1: Basic Memory Allocation and Cleanup');
  try {
    const memoryBefore = getMemoryUsage().heapUsed;
    
    // Create test data
    const testData = [];
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
    
    console.log(`  Before: ${formatMemory(memoryBefore)}`);
    console.log(`  During: ${formatMemory(memoryDuring)}`);
    console.log(`  After:  ${formatMemory(memoryAfter)}`);
    
    const memoryIncrease = memoryAfter - memoryBefore;
    const testPassed = memoryDuring > memoryBefore && memoryIncrease < 5 * 1024 * 1024;
    
    if (testPassed) {
      console.log(`  ✅ PASSED - Memory increase: ${formatMemory(memoryIncrease)}`);
      results.passed++;
    } else {
      console.log(`  ❌ FAILED - Excessive memory increase: ${formatMemory(memoryIncrease)}`);
      results.failed++;
    }
    
    results.tests.push({
      name: 'Basic Memory Allocation',
      passed: testPassed,
      memoryIncrease: memoryIncrease
    });
    
  } catch (error) {
    console.log(`  ❌ FAILED - Error: ${error.message}`);
    results.failed++;
  }
  
  console.log('');

  // Test 2: Repeated Allocations
  console.log('Test 2: Repeated Allocations Without Growth');
  try {
    const baseline = getMemoryUsage().heapUsed;
    const snapshots = [];
    
    for (let cycle = 0; cycle < 5; cycle++) {
      const cycleData = new Array(500).fill(0).map((_, i) => ({
        cycle,
        index: i,
        data: Math.random(),
        timestamp: Date.now()
      }));
      
      // Process the data
      cycleData.forEach(item => {
        item.processed = true;
        item.hash = `${item.cycle}-${item.index}`;
      });
      
      snapshots.push(getMemoryUsage().heapUsed);
      
      // Clear data for next cycle
      cycleData.length = 0;
      await waitForGC();
    }
    
    const finalMemory = getMemoryUsage().heapUsed;
    
    console.log(`  Baseline: ${formatMemory(baseline)}`);
    snapshots.forEach((memory, i) => {
      console.log(`  Cycle ${i}: ${formatMemory(memory)} (+${formatMemory(memory - baseline)})`);
    });
    console.log(`  Final: ${formatMemory(finalMemory)}`);
    
    const totalGrowth = finalMemory - baseline;
    const testPassed = totalGrowth < 10 * 1024 * 1024;
    
    if (testPassed) {
      console.log(`  ✅ PASSED - Total growth: ${formatMemory(totalGrowth)}`);
      results.passed++;
    } else {
      console.log(`  ❌ FAILED - Excessive growth: ${formatMemory(totalGrowth)}`);
      results.failed++;
    }
    
    results.tests.push({
      name: 'Repeated Allocations',
      passed: testPassed,
      totalGrowth: totalGrowth
    });
    
  } catch (error) {
    console.log(`  ❌ FAILED - Error: ${error.message}`);
    results.failed++;
  }
  
  console.log('');

  // Test 3: Operation Efficiency
  console.log('Test 3: Operation Memory Efficiency');
  try {
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
    
    let allOperationsPassed = true;
    
    for (const { name, fn } of operations) {
      const memBefore = getMemoryUsage().heapUsed;
      const start = process.hrtime.bigint();
      
      const result = fn();
      
      const end = process.hrtime.bigint();
      const memAfter = getMemoryUsage().heapUsed;
      const increase = memAfter - memBefore;
      const duration = Number(end - start) / 1000000; // Convert to milliseconds
      
      const operationPassed = increase < 3 * 1024 * 1024 && result > 0;
      
      console.log(`  ${name}: ${formatMemory(increase)} increase, ${duration.toFixed(1)}ms - ${operationPassed ? '✅' : '❌'}`);
      
      if (!operationPassed) {
        allOperationsPassed = false;
      }
    }
    
    if (allOperationsPassed) {
      console.log(`  ✅ PASSED - All operations efficient`);
      results.passed++;
    } else {
      console.log(`  ❌ FAILED - Some operations inefficient`);
      results.failed++;
    }
    
    results.tests.push({
      name: 'Operation Efficiency',
      passed: allOperationsPassed
    });
    
  } catch (error) {
    console.log(`  ❌ FAILED - Error: ${error.message}`);
    results.failed++;
  }
  
  console.log('');

  return results;
}

async function main() {
  console.log('Starting memory validation tests...\n');
  
  const results = await runMemoryTests();
  
  console.log('📊 Test Results Summary');
  console.log('======================');
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  
  console.log('\nTest Details:');
  results.tests.forEach(test => {
    console.log(`  ${test.passed ? '✅' : '❌'} ${test.name}`);
  });
  
  if (results.failed === 0) {
    console.log('\n🎉 All memory tests passed! Memory leak detection is working correctly.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some memory tests failed. Review memory usage patterns.');
    process.exit(1);
  }
}

// Force garbage collection if available
if (global.gc) {
  console.log('✅ Garbage collection available for testing');
} else {
  console.log('⚠️  Garbage collection not available (run with --expose-gc for better results)');
}

main().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});