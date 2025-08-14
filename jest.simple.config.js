module.exports = {
  preset: 'react-native',
  testEnvironment: 'node',
  testTimeout: 10000,
  clearMocks: true,
  restoreMocks: true,
  maxWorkers: 1,
  setupFilesAfterEnv: [],
  
  // Minimal mocking to avoid timeout issues
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^react-native-sqlite-storage$': '<rootDir>/tests/__mocks__/sqlite.js',
    '^@react-native-voice/voice$': '<rootDir>/tests/__mocks__/voice.js',
    '^react-native$': '<rootDir>/tests/__mocks__/react-native.js',
  },
  
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native)/)',
  ],
  
  testMatch: [
    '**/__tests__/**/*.{js,jsx,ts,tsx}',
    '**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
  
  // Don't use fake timers
  fakeTimers: {
    enableGlobally: false,
  },
};