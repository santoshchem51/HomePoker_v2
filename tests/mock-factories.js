/**
 * Centralized Mock Factories
 * Factory functions for creating consistent, reusable mocks across all tests
 */

/**
 * Service Mock Factories
 */
export const ServiceMocks = {
  /**
   * Create a comprehensive DatabaseService mock
   * @param {Object} overrides - Override specific methods
   * @returns {Object} Complete DatabaseService mock
   */
  createDatabaseService(overrides = {}) {
    const baseMock = {
      // Core database operations
      executeQuery: jest.fn(() => Promise.resolve({
        rows: { 
          length: 0, 
          item: jest.fn(() => ({})),
          raw: jest.fn(() => [])
        },
        rowsAffected: 0,
        insertId: 0
      })),
      executeTransaction: jest.fn((callback) => {
        const tx = {
          executeSql: jest.fn((sql, params, success) => {
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
        return Promise.resolve(callback ? callback(tx) : undefined);
      }),
      
      // CRITICAL: Lifecycle methods expected by tests
      initialize: jest.fn(() => Promise.resolve()),
      close: jest.fn(() => Promise.resolve()),
      
      // Connection monitoring methods
      getActiveConnectionCount: jest.fn(() => Promise.resolve(1)),
      getConnectionPoolStats: jest.fn(() => Promise.resolve({
        totalConnections: 1,
        activeConnections: 1,
        idleConnections: 0,
        preparedStatements: 0
      })),
      
      // Player operations
      getPlayers: jest.fn(() => Promise.resolve([])),
      getPlayer: jest.fn(() => Promise.resolve(null)),
      createPlayer: jest.fn(() => Promise.resolve({ id: 'mock-player-id' })),
      updatePlayer: jest.fn(() => Promise.resolve()),
      
      // Session operations
      getSession: jest.fn(() => Promise.resolve(null)),
      getSessions: jest.fn(() => Promise.resolve([])),
      createSession: jest.fn(() => Promise.resolve({ id: 'mock-session-id' })),
      updateSession: jest.fn(() => Promise.resolve()),
      
      // Transaction operations
      getTransactions: jest.fn(() => Promise.resolve([])),
      getTransaction: jest.fn(() => Promise.resolve(null)),
      createTransaction: jest.fn(() => Promise.resolve({ id: 'mock-transaction-id' })),
      updateTransaction: jest.fn(() => Promise.resolve()),
      
      // Health and maintenance
      getHealthStatus: jest.fn(() => Promise.resolve({
        connected: true,
        version: '3.45.0',
        tablesCount: 3,
        status: 'healthy'
      })),
      // Legacy method names for backward compatibility
      initializeDatabase: jest.fn(() => Promise.resolve()),
      closeDatabase: jest.fn(() => Promise.resolve()),
      
      // Singleton pattern
      getInstance: jest.fn()
    };
    
    const mock = { ...baseMock, ...overrides };
    mock.getInstance.mockReturnValue(mock);
    return mock;
  },

  /**
   * Create SessionService mock
   * @param {Object} overrides - Override specific methods
   */
  createSessionService(overrides = {}) {
    const baseMock = {
      getSession: jest.fn(() => Promise.resolve(null)),
      createSession: jest.fn(() => Promise.resolve({ id: 'mock-session-id' })),
      updateSession: jest.fn(() => Promise.resolve()),
      endSession: jest.fn(() => Promise.resolve()),
      validateSession: jest.fn(() => Promise.resolve(true)),
      getInstance: jest.fn()
    };
    
    const mock = { ...baseMock, ...overrides };
    mock.getInstance.mockReturnValue(mock);
    return mock;
  },

  /**
   * Create TransactionService mock
   * @param {Object} overrides - Override specific methods
   */
  createTransactionService(overrides = {}) {
    const baseMock = {
      recordBuyIn: jest.fn(() => Promise.resolve({ id: 'mock-transaction-id' })),
      recordCashOut: jest.fn(() => Promise.resolve({ id: 'mock-transaction-id' })),
      undoTransaction: jest.fn(() => Promise.resolve()),
      getTransactionHistory: jest.fn(() => Promise.resolve([])),
      calculatePlayerBalance: jest.fn(() => Promise.resolve(0)),
      canUndoTransaction: jest.fn(() => Promise.resolve(false)),
      getRemainingUndoTime: jest.fn(() => Promise.resolve(0)),
      getInstance: jest.fn()
    };
    
    const mock = { ...baseMock, ...overrides };
    mock.getInstance.mockReturnValue(mock);
    return mock;
  },

  /**
   * Create SettlementService mock
   * @param {Object} overrides - Override specific methods
   */
  createSettlementService(overrides = {}) {
    const baseMock = {
      optimizeSettlement: jest.fn(() => Promise.resolve({
        sessionId: 'test-session',
        directPayments: [],
        isValid: true,
        validationErrors: [],
        mathematicalProof: null
      })),
      validateSettlement: jest.fn(() => Promise.resolve({
        isValid: true,
        errors: [],
        warnings: [],
        auditTrail: []
      })),
      generateMathematicalProof: jest.fn(() => Promise.resolve({
        id: 'proof-1',
        isValid: true,
        steps: [],
        timestamp: new Date()
      })),
      exportMathematicalProof: jest.fn(() => Promise.resolve({
        exportId: 'export-1',
        status: 'completed',
        filePath: '/mock/export.pdf'
      })),
      generateAlternativeSettlements: jest.fn(() => Promise.resolve([])),
      verifyProofIntegrity: jest.fn(() => Promise.resolve({ isValid: true })),
      getInstance: jest.fn()
    };
    
    const mock = { ...baseMock, ...overrides };
    mock.getInstance.mockReturnValue(mock);
    return mock;
  },

  /**
   * Create UndoManager mock
   * @param {Object} overrides - Override specific methods
   */
  createUndoManager(overrides = {}) {
    const baseMock = {
      addUndoableTransaction: jest.fn(),
      canUndo: jest.fn(() => false),
      removeUndoableTransaction: jest.fn(),
      getRemainingUndoTime: jest.fn(() => 0),
      getMostRecentUndoableTransaction: jest.fn(() => null),
      getUndoableTransactions: jest.fn(() => []),
      getInstance: jest.fn()
    };
    
    const mock = { ...baseMock, ...overrides };
    mock.getInstance.mockReturnValue(mock);
    return mock;
  }
};

/**
 * Data Factories for creating test data
 */
export const DataFactories = {
  /**
   * Create test session data
   * @param {Object} overrides - Override specific properties
   */
  createSession(overrides = {}) {
    return {
      id: 'session-test-1',
      name: 'Test Session',
      organizerId: 'organizer-1',
      status: 'active',
      createdAt: new Date(),
      totalPot: 0,
      playerCount: 0,
      buyInAmount: 25.00,
      ...overrides
    };
  },

  /**
   * Create test player data
   * @param {Object} overrides - Override specific properties
   */
  createPlayer(overrides = {}) {
    return {
      id: 'player-test-1',
      name: 'Test Player',
      status: 'active',
      buyInAmount: 0,
      cashOutAmount: 0,
      joinedAt: new Date(),
      ...overrides
    };
  },

  /**
   * Create test transaction data
   * @param {Object} overrides - Override specific properties
   */
  createTransaction(overrides = {}) {
    return {
      id: 'transaction-test-1',
      sessionId: 'session-test-1',
      playerId: 'player-test-1',
      type: 'buy_in',
      amount: 25.00,
      timestamp: new Date(),
      method: 'manual',
      isVoided: false,
      createdBy: 'user',
      ...overrides
    };
  },

  /**
   * Create test settlement data
   * @param {Object} overrides - Override specific properties
   */
  createSettlement(overrides = {}) {
    return {
      sessionId: 'session-test-1',
      directPayments: [],
      isValid: true,
      validationErrors: [],
      mathematicalProof: null,
      timestamp: new Date(),
      ...overrides
    };
  },

  /**
   * Create test validation result
   * @param {Object} overrides - Override specific properties
   */
  createValidationResult(overrides = {}) {
    return {
      isValid: true,
      errors: [],
      warnings: [],
      auditTrail: [
        {
          step: 1,
          operation: 'balance_validation',
          input: { totalDebits: 1000, totalCredits: 1000 },
          output: { isBalanced: true },
          timestamp: new Date(),
          validationCheck: true
        }
      ],
      ...overrides
    };
  },

  /**
   * Create test mathematical proof
   * @param {Object} overrides - Override specific properties
   */
  createMathematicalProof(overrides = {}) {
    return {
      id: 'proof-test-1',
      sessionId: 'session-test-1',
      isValid: true,
      steps: [],
      timestamp: new Date(),
      algorithm: 'balance_verification',
      ...overrides
    };
  }
};

/**
 * Complete test scenario factories
 */
export const ScenarioFactories = {
  /**
   * Create a complete test scenario with all mocks and data
   * @param {Object} config - Configuration for the scenario
   */
  createCompleteScenario(config = {}) {
    const {
      sessionOverrides = {},
      playerOverrides = {},
      transactionOverrides = {},
      serviceOverrides = {}
    } = config;

    const session = DataFactories.createSession(sessionOverrides);
    const player = DataFactories.createPlayer({ ...playerOverrides, sessionId: session.id });
    const transaction = DataFactories.createTransaction({
      ...transactionOverrides,
      sessionId: session.id,
      playerId: player.id
    });

    const databaseService = ServiceMocks.createDatabaseService({
      getSession: jest.fn(() => Promise.resolve(session)),
      getPlayers: jest.fn(() => Promise.resolve([player])),
      getPlayer: jest.fn(() => Promise.resolve(player)),
      getTransactions: jest.fn(() => Promise.resolve([transaction])),
      ...serviceOverrides.database
    });

    const sessionService = ServiceMocks.createSessionService({
      getSession: jest.fn(() => Promise.resolve(session)),
      ...serviceOverrides.session
    });

    const transactionService = ServiceMocks.createTransactionService(serviceOverrides.transaction);
    const settlementService = ServiceMocks.createSettlementService(serviceOverrides.settlement);
    const undoManager = ServiceMocks.createUndoManager(serviceOverrides.undo);

    return {
      data: { session, player, transaction },
      mocks: {
        databaseService,
        sessionService,
        transactionService,
        settlementService,
        undoManager
      }
    };
  },

  /**
   * Create an error scenario for testing error handling
   * @param {string} errorType - Type of error to simulate
   * @param {Object} config - Configuration for the error scenario
   */
  createErrorScenario(errorType, config = {}) {
    const baseScenario = this.createCompleteScenario(config);
    
    const errorMap = {
      'database-connection': () => {
        baseScenario.mocks.databaseService.executeQuery.mockRejectedValue(
          new Error('Database connection failed')
        );
      },
      'player-not-found': () => {
        baseScenario.mocks.databaseService.getPlayer.mockResolvedValue(null);
        baseScenario.mocks.databaseService.getPlayers.mockResolvedValue([]);
      },
      'session-not-found': () => {
        baseScenario.mocks.databaseService.getSession.mockResolvedValue(null);
        baseScenario.mocks.sessionService.getSession.mockResolvedValue(null);
      },
      'validation-failed': () => {
        baseScenario.mocks.settlementService.validateSettlement.mockResolvedValue({
          isValid: false,
          errors: ['Balance validation failed'],
          warnings: [],
          auditTrail: []
        });
      }
    };

    if (errorMap[errorType]) {
      errorMap[errorType]();
    }

    return baseScenario;
  }
};

export default {
  ServiceMocks,
  DataFactories,
  ScenarioFactories
};