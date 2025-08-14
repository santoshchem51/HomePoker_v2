/**
 * Global Jest Teardown for Performance Optimization
 */

module.exports = async () => {
  // Clean up any global resources
  if (global.gc) {
    global.gc();
  }
  
  console.log('Test environment cleanup completed');
};