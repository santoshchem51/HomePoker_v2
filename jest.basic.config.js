module.exports = {
  // Don't use react-native preset
  testEnvironment: 'node',
  testMatch: ['**/*.test.js'],
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
  testTimeout: 5000,
  setupFilesAfterEnv: [],
};