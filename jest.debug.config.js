module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/simple.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/empty-setup.js'],
  testTimeout: 5000,
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,
};