module.exports = {
  preset: 'react-native',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/App.test.{js,tsx}'],
  setupFilesAfterEnv: [],
  cache: false,
  maxWorkers: 1,
  verbose: true,
  testTimeout: 5000,
};
