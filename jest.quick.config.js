// Quick test configuration - minimal setup for fast testing
module.exports = {
  preset: 'react-native',
  testEnvironment: 'node',
  
  // Only test our simple tests
  testMatch: [
    '**/__tests__/App.test.{js,jsx,ts,tsx}',
    '**/SettlementServiceSimple.test.{js,jsx,ts,tsx}',
    '**/TransactionService.test.{js,jsx,ts,tsx}',
  ],
  
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
  
  // Transform files
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['@react-native/babel-preset'] }],
  },
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-sqlite-storage|react-native-gesture-handler|@react-native-voice|react-native-qrcode-svg|react-native-fs|@react-native-clipboard|@react-native-picker|@react-native-async-storage)/)',
  ],
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js',
  ],
  
  // Test configuration
  testTimeout: 10000, // 10 seconds
  clearMocks: true,
  restoreMocks: true,
  maxWorkers: 1,
  bail: true, // Stop on first test failure
  forceExit: true, // Force exit after tests complete
  detectOpenHandles: false, // Don't detect open handles
  
  // Disable coverage for quick tests
  collectCoverage: false,
};