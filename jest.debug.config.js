/**
 * Debug Jest Configuration - Minimal setup to isolate hanging issues
 */

module.exports = {
  preset: 'react-native',
  testEnvironment: 'node',
  
  // Minimal module mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // Single test file pattern for debugging
  testMatch: [
    '**/__tests__/App.test.{js,tsx}',
  ],
  
  // Basic transform
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  
  // Minimal transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native)/)',
  ],
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js',
  ],
  
  // Debug settings
  verbose: true,
  testTimeout: 10000,
  clearMocks: true,
  
  // Disable problematic features
  cache: false,
  maxWorkers: 1,
  
  // No reporters that might cause issues
  reporters: ['default'],
  
  // No global setup/teardown
};
