// Comprehensive DatabaseService mock
const mockDatabaseService = {
  // Core database methods
  executeQuery: jest.fn(() => Promise.resolve([])),
  executeTransaction: jest.fn((callback) => {
    const tx = {
      executeSql: jest.fn((sql, params, success, error) => {
        if (success) {
          success(tx, { 
            rows: { 
              length: 0, 
              item: jest.fn(() => ({})),
              raw: jest.fn(() => [])
            },
            rowsAffected: 0,
            insertId: 0
          });
        }
      })
    };
    return Promise.resolve(callback(tx));
  }),
  
  // Player methods
  getPlayers: jest.fn(() => Promise.resolve([])),
  getPlayer: jest.fn(() => Promise.resolve(null)),
  createPlayer: jest.fn(() => Promise.resolve({ id: 'mock-player-id' })),
  updatePlayer: jest.fn(() => Promise.resolve()),
  
  // Session methods
  getSession: jest.fn(() => Promise.resolve(null)),
  getSessions: jest.fn(() => Promise.resolve([])),
  createSession: jest.fn(() => Promise.resolve({ id: 'mock-session-id' })),
  updateSession: jest.fn(() => Promise.resolve()),
  
  // Transaction methods
  getTransactions: jest.fn(() => Promise.resolve([])),
  getTransaction: jest.fn(() => Promise.resolve(null)),
  createTransaction: jest.fn(() => Promise.resolve({ id: 'mock-transaction-id' })),
  updateTransaction: jest.fn(() => Promise.resolve()),
  
  // Health check methods
  getHealthStatus: jest.fn(() => Promise.resolve({
    connected: true,
    version: '3.45.0',
    tablesCount: 3,
    status: 'healthy'
  })),
  
  // Database lifecycle
  initializeDatabase: jest.fn(() => Promise.resolve()),
  closeDatabase: jest.fn(() => Promise.resolve()),
  
  // Singleton pattern
  getInstance: jest.fn(() => mockDatabaseService)
};

// Export as ES module and CommonJS
module.exports = {
  DatabaseService: jest.fn(() => mockDatabaseService),
  default: mockDatabaseService,
  __esModule: true
};

// Also expose the mock instance for direct access
module.exports.mockDatabaseService = mockDatabaseService;