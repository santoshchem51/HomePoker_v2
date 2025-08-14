/**
 * High-Performance Jest Configuration
 * Optimized for speed and reliability
 */

module.exports = {
  preset: 'react-native',
  
  // Test environment optimized for Node.js performance
  testEnvironment: 'node',
  
  // Module paths and aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@stores/(.*)$': '<rootDir>/src/stores/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@styles/(.*)$': '<rootDir>/src/styles/$1',
  },
  
  // Optimized test file patterns - prioritize core tests
  testMatch: [
    '**/tests/__tests__/utils/*.test.{js,ts}',
    '**/tests/__tests__/services/core/*.test.{js,ts}',
    '**/tests/__tests__/stores/*.zustand.test.{js,ts}',
    '**/__tests__/App.test.{js,tsx}',
  ],
  
  // Transform files with caching
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { 
      presets: ['@react-native/babel-preset'],
      cacheDirectory: true
    }],
  },
  
  // Optimized transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-sqlite-storage|react-native-gesture-handler)/)',
  ],
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js',
  ],
  
  // Performance optimizations
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // Coverage configuration - disabled for performance
  collectCoverage: false,
  
  // Reduced timeout for faster feedback
  testTimeout: 15000,
  
  // Performance settings
  clearMocks: true,
  restoreMocks: true,
  
  // Disable fake timers globally for better performance
  fakeTimers: {
    enableGlobally: false,
  },
  
  // Optimized worker configuration
  maxWorkers: '75%', // Use more CPU cores
  workerIdleMemoryLimit: '512MB',
  
  // Test execution optimizations
  bail: false, // Don't stop on first failure for CI
  verbose: false, // Reduce output for performance
  silent: false, // Keep some output for debugging
  
  // Module resolution optimizations
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Test result processor optimizations
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'test-results',
      outputName: 'jest-results.xml',
    }]
  ],
  
  // Global setup for performance monitoring
  globalSetup: '<rootDir>/tests/global-setup.js',
  globalTeardown: '<rootDir>/tests/global-teardown.js',
  
  // Error handling optimizations
  errorOnDeprecated: false,
  
  // Memory management
  logHeapUsage: false,
  
  // Test filtering for performance
  testPathIgnorePatterns: [
    '/node_modules/',
    '/node_modules.old/',
    '/__tests__/.*\\.skip\\.',
    '/tests/__tests__/.*\\.skip\\.',
    '/tests/__tests__/performance/', // Skip heavy performance tests in fast mode
    '/tests/__tests__/integration/', // Skip integration tests in fast mode
  ],
  
  // Module mocking optimizations
  automock: false,
  resetMocks: false,
  resetModules: false,
};