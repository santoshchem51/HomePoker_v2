module.exports = {
  preset: 'react-native',
  
  // Test environment
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
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.{js,jsx,ts,tsx}',
    '**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
  
  // Transform files
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['@react-native/babel-preset'] }],
  },
  
  // Transform ignore patterns - updated to include all necessary RN packages
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-sqlite-storage|react-native-gesture-handler|@react-native-voice|react-native-qrcode-svg|react-native-fs|@react-native-clipboard|@react-native-picker|@react-native-async-storage)/)',
  ],
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js',
  ],
  
  // Coverage configuration
  collectCoverage: false,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.{js,ts}',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
  ],
  
  // Coverage reporting
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary',
  ],
  
  // Verbose output for debugging
  verbose: false, // Reduce verbosity to prevent hanging
  
  // Test timeout - increased to 30s to prevent timeout errors
  testTimeout: 30000,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Disable fake timers globally
  fakeTimers: {
    enableGlobally: false,
  },
  
  // Optimize for WSL performance
  maxWorkers: 1, // Use single worker in WSL to prevent resource conflicts
  cache: false, // Disable cache to prevent WSL file system issues
  forceExit: true, // Force exit to prevent hanging processes
  detectOpenHandles: true, // Detect what's keeping Jest alive
};