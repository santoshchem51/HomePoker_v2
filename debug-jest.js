console.log('Starting Jest debug...');
process.env.NODE_ENV = 'test';

// Monitor requires
const Module = require('module');
const originalRequire = Module.prototype.require;
let requireCount = 0;

Module.prototype.require = function(id) {
  requireCount++;
  if (requireCount % 100 === 0) {
    console.log(`Required ${requireCount} modules, last: ${id}`);
  }
  
  // Track potentially problematic modules
  if (id.includes('react-native') || id.includes('metro')) {
    console.log(`Loading: ${id}`);
  }
  
  try {
    return originalRequire.apply(this, arguments);
  } catch (err) {
    console.error(`Error loading ${id}:`, err.message);
    throw err;
  }
};

// Set a hard timeout
setTimeout(() => {
  console.error('Hard timeout reached - Jest is hanging!');
  console.log(`Total modules required: ${requireCount}`);
  process.exit(1);
}, 8000);

// Try to run Jest
try {
  console.log('Loading Jest...');
  require('jest/bin/jest');
} catch (err) {
  console.error('Failed to run Jest:', err);
  process.exit(1);
}