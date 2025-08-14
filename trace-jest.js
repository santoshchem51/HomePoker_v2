console.log('Starting trace...');

// Trace all requires
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function(id) {
  // Log every module being required
  console.log(`Requiring: ${id}`);
  
  const start = Date.now();
  const result = originalRequire.apply(this, arguments);
  const duration = Date.now() - start;
  
  if (duration > 100) {
    console.log(`  -> SLOW (${duration}ms)`);
  }
  
  return result;
};

// Hard timeout
setTimeout(() => {
  console.log('TIMEOUT - Process hanging');
  process.exit(1);
}, 5000);

// Load Jest
console.log('Loading Jest binary...');
process.argv = ['node', 'jest', 'tests/__tests__/simple.test.js'];
require('./node_modules/.bin/jest');