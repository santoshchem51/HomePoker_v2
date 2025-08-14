/**
 * Database Isolation Setup - For sequential database tests
 * Ensures database operations don't conflict
 */

const path = require('path');
const fs = require('fs');

let testDbPath = null;

beforeAll(async () => {
  console.log(`[Database] Database isolation setup started`);
  
  // Create unique test database for this test run
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(7);
  testDbPath = path.join(__dirname, '..', 'temp', `test-db-${timestamp}-${randomId}.db`);
  
  // Ensure temp directory exists
  const tempDir = path.dirname(testDbPath);
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  // Mock SQLite to use test database
  mockSQLiteStorage();
  
  // Set test database environment
  process.env.TEST_DB_PATH = testDbPath;
  process.env.NODE_ENV = 'test';
  
  console.log(`[Database] Test database: ${testDbPath}`);
});

afterAll(async () => {
  // Close any open database connections
  if (global.mockDbConnection) {
    try {
      await global.mockDbConnection.close();
    } catch (error) {
      console.warn('[Database] Connection close warning:', error.message);
    }
  }
  
  // Clean up test database file
  try {
    if (testDbPath && fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
      console.log(`[Database] Test database cleaned up: ${testDbPath}`);
    }
  } catch (error) {
    console.warn('[Database] Cleanup warning:', error.message);
  }
});

beforeEach(async () => {
  // Reset database state before each test
  if (global.mockDbConnection) {
    try {
      // Clear all tables for clean state
      await resetDatabaseTables();
    } catch (error) {
      console.warn('[Database] Reset warning:', error.message);
    }
  }
});

function mockSQLiteStorage() {
  // Mock react-native-sqlite-storage with test database
  const mockDb = {
    transaction: jest.fn((callback) => {
      const tx = {
        executeSql: jest.fn((sql, params, successCallback, errorCallback) => {
          // Simulate successful execution
          if (successCallback) {
            successCallback(tx, { rows: { length: 0, item: () => ({}) } });
          }
        }),
      };
      callback(tx);
    }),
    close: jest.fn(() => Promise.resolve()),
    executeSql: jest.fn(() => Promise.resolve({ rows: { length: 0 } })),
  };
  
  global.mockDbConnection = mockDb;
  
  jest.mock('react-native-sqlite-storage', () => ({
    DEBUG: jest.fn(),
    enablePromise: jest.fn(),
    openDatabase: jest.fn(() => Promise.resolve(mockDb)),
  }));
}

async function resetDatabaseTables() {
  // Mock database reset - implement actual reset logic here
  console.log('[Database] Resetting database state for next test');
  
  // Clear mock call history
  if (global.mockDbConnection) {
    global.mockDbConnection.transaction.mockClear();
    global.mockDbConnection.executeSql.mockClear();
  }
}