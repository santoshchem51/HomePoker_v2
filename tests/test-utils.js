/**
 * Test Utilities for HomePoker v2
 * Centralized test helpers and mocks
 */

import { ServiceMocks, DataFactories, ScenarioFactories } from './mock-factories';
import { ErrorMatchers, DomainErrorTesters, MockErrors } from './error-testing';
import { createTestStore, testStoreAction } from './zustand-testing';

// ServiceError mock that works with both import styles
class TestServiceError extends Error {
  constructor(code, message, details) {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
    this.details = details;
  }
}

// Export both as named and default for compatibility
module.exports = {
  ServiceError: TestServiceError,
  
  // Re-export all factory functions
  ...ServiceMocks,
  ...DataFactories,
  ...ScenarioFactories,
  
  // Re-export error testing utilities
  ErrorMatchers,
  DomainErrorTesters,
  MockErrors,
  
  // Re-export Zustand testing utilities
  createTestStore,
  testStoreAction,
  
  // Helper to match error messages regardless of error type
  expectErrorMessage: (promise, messagePattern) => {
    return expect(promise).rejects.toThrow(
      expect.objectContaining({
        message: expect.stringContaining(messagePattern)
      })
    );
  },
  
  // Helper to match error codes
  expectErrorCode: (promise, code) => {
    return expect(promise).rejects.toThrow(
      expect.objectContaining({ code })
    );
  },
  
  // Create mock database service with all required methods
  createMockDatabaseService: (overrides = {}) => ({
    executeQuery: jest.fn(() => Promise.resolve([])),
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
    getPlayers: jest.fn(() => Promise.resolve([])),
    getPlayer: jest.fn(() => Promise.resolve(null)),
    createPlayer: jest.fn(() => Promise.resolve({ id: 'mock-player-id' })),
    updatePlayer: jest.fn(() => Promise.resolve()),
    getSession: jest.fn(() => Promise.resolve(null)),
    getSessions: jest.fn(() => Promise.resolve([])),
    createSession: jest.fn(() => Promise.resolve({ id: 'mock-session-id' })),
    updateSession: jest.fn(() => Promise.resolve()),
    getTransactions: jest.fn(() => Promise.resolve([])),
    getTransaction: jest.fn(() => Promise.resolve(null)),
    createTransaction: jest.fn(() => Promise.resolve({ id: 'mock-transaction-id' })),
    updateTransaction: jest.fn(() => Promise.resolve()),
    getHealthStatus: jest.fn(() => Promise.resolve({
      connected: true,
      version: '3.45.0',
      tablesCount: 3,
      status: 'healthy'
    })),
    initializeDatabase: jest.fn(() => Promise.resolve()),
    closeDatabase: jest.fn(() => Promise.resolve()),
    ...overrides
  }),
  
  // Create mock session service
  createMockSessionService: (overrides = {}) => ({
    getSession: jest.fn(() => Promise.resolve(null)),
    createSession: jest.fn(() => Promise.resolve({ id: 'mock-session-id' })),
    updateSession: jest.fn(() => Promise.resolve()),
    endSession: jest.fn(() => Promise.resolve()),
    ...overrides
  }),
  
  // Create mock undo manager
  createMockUndoManager: (overrides = {}) => ({
    addUndoableTransaction: jest.fn(),
    canUndo: jest.fn(() => false),
    removeUndoableTransaction: jest.fn(),
    getRemainingUndoTime: jest.fn(() => 0),
    getMostRecentUndoableTransaction: jest.fn(() => null),
    getUndoableTransactions: jest.fn(() => []),
    ...overrides
  }),
  
  // Test data factories
  createTestSession: (overrides = {}) => ({
    id: 'session-test-1',
    name: 'Test Session',
    organizerId: 'organizer-1',
    status: 'active',
    createdAt: new Date(),
    totalPot: 0,
    playerCount: 0,
    ...overrides
  }),
  
  createTestPlayer: (overrides = {}) => ({
    id: 'player-test-1',
    name: 'Test Player',
    status: 'active',
    buyInAmount: 0,
    cashOutAmount: 0,
    joinedAt: new Date(),
    ...overrides
  }),
  
  createTestTransaction: (overrides = {}) => ({
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
  })
};