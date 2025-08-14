/**
 * Global Jest Setup for Performance Optimization
 */

module.exports = async () => {
  // Performance monitoring
  const startTime = Date.now();
  
  // Set environment variables for test optimization
  process.env.NODE_ENV = 'test';
  process.env.JEST_WORKER_ID = process.env.JEST_WORKER_ID || '1';
  
  // Disable unnecessary services in test environment
  process.env.DISABLE_ANALYTICS = 'true';
  process.env.DISABLE_CRASH_REPORTING = 'true';
  process.env.DISABLE_PERFORMANCE_MONITORING = 'true';
  
  // Memory optimization
  if (global.gc) {
    global.gc();
  }
  
  console.log(`Test environment setup completed in ${Date.now() - startTime}ms`);
};