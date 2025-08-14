/**
 * Jest setup for PokePot React Native application
 * Fixed version - resolves timeout issues
 */

// Mock React Native SQLite - fixed to prevent hangs
jest.mock('react-native-sqlite-storage', () => {
  const mockTx = {
    executeSql: jest.fn((sql, params, success, error) => {
      // Immediately resolve with empty result
      if (success) {
        success(mockTx, { 
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

  return {
    DEBUG: jest.fn(),
    enablePromise: jest.fn(),
    openDatabase: jest.fn(() => ({
      transaction: jest.fn((callback) => {
        // Execute transaction synchronously
        callback(mockTx);
      }),
      close: jest.fn(() => Promise.resolve()),
      executeSql: jest.fn((sql, params) => 
        Promise.resolve([{ 
          rows: { 
            length: 0,
            item: jest.fn(),
            raw: jest.fn(() => [])
          } 
        }])
      )
    }))
  };
});

// Mock Voice recognition module
jest.mock('@react-native-voice/voice', () => ({
  default: {
    start: jest.fn(() => Promise.resolve()),
    stop: jest.fn(() => Promise.resolve()),
    destroy: jest.fn(() => Promise.resolve()),
    isAvailable: jest.fn(() => Promise.resolve(true)),
    isRecognizing: jest.fn(() => Promise.resolve(false)),
    onSpeechStart: jest.fn(),
    onSpeechRecognized: jest.fn(),
    onSpeechEnd: jest.fn(),
    onSpeechError: jest.fn(),
    onSpeechResults: jest.fn(),
    removeAllListeners: jest.fn(),
  },
}));

// Mock React Native Gesture Handler - simplified
jest.mock('react-native-gesture-handler', () => {
  const View = require('react').forwardRef((props, ref) => {
    return require('react').createElement('View', { ...props, ref });
  });
  
  return {
    GestureHandlerRootView: View,
    PanGestureHandler: View,
    TapGestureHandler: View,
    State: {},
    Directions: {},
  };
});

// Mock QRCode SVG
jest.mock('react-native-qrcode-svg', () => 'QRCode');

// Mock React Native FS
jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/mock/documents',
  writeFile: jest.fn(() => Promise.resolve()),
  readFile: jest.fn(() => Promise.resolve('')),
  exists: jest.fn(() => Promise.resolve(false)),
  unlink: jest.fn(() => Promise.resolve()),
}));

// Mock clipboard
jest.mock('@react-native-clipboard/clipboard', () => ({
  setString: jest.fn(),
  getString: jest.fn(() => Promise.resolve('')),
}));

// Mock picker
jest.mock('@react-native-picker/picker', () => ({
  Picker: 'Picker',
}));

// Mock Async Storage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
}));

// Note: PDF export mocks removed during Epic 3 scope rollback
// jest.mock('react-native-share', () => ({ open: jest.fn(() => Promise.resolve()) }));
// jest.mock('react-native-html-to-pdf', () => ({ convert: jest.fn(() => Promise.resolve({ filePath: '/mock/file.pdf' })) }));

// Suppress specific console warnings/errors during tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: An update to') ||
       args[0].includes('Warning: Failed prop type') ||
       args[0].includes('SQLite not available') ||
       args[0].includes('Failed to initialize database') ||
       args[0].includes('Buy-in recording failed') ||
       args[0].includes('Cash-out recording failed') ||
       args[0].includes('Failed to get transaction') ||
       args[0].includes('Failed to undo transaction') ||
       args[0].includes('getPlayers is not a function') ||
       args[0].includes('Cannot read properties of undefined'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Animated') ||
       args[0].includes('componentWillReceiveProps'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Mock DatabaseService globally
jest.mock('../src/services/infrastructure/DatabaseService', () => {
  const mockDbService = {
    executeQuery: jest.fn(() => Promise.resolve({ 
      rows: { 
        length: 0, 
        item: jest.fn(() => ({})),
        raw: jest.fn(() => [])
      },
      rowsAffected: 0,
      insertId: 0
    })),
    initialize: jest.fn(() => Promise.resolve()), // Add the missing initialize method
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
  };
  
  return {
    DatabaseService: {
      getInstance: jest.fn(() => mockDbService)
    },
    default: {
      getInstance: jest.fn(() => mockDbService)
    }
  };
});

// Global test utilities
global.__DEV__ = false;

// IMPORTANT: Do NOT use fake timers globally - this causes timeouts!
// Use them selectively in individual tests if needed with:
// jest.useFakeTimers() and jest.useRealTimers()

// Test utilities
global.createMockDatabase = () => ({
  transaction: jest.fn((callback) => {
    const tx = {
      executeSql: jest.fn((sql, params, success) => {
        if (success) success(tx, { rows: { length: 0, item: () => ({}) } });
      }),
    };
    callback(tx);
  }),
  close: jest.fn(),
  executeSql: jest.fn(() => Promise.resolve([{ rows: { length: 0 } }])),
});

// Add test utilities to global
global.createMockHealthStatus = (overrides = {}) => ({
  app: {
    name: 'PokePot',
    version: '0.0.1',
    status: 'healthy',
    uptime: 100,
    ...overrides?.app,
  },
  database: {
    connected: true,
    version: '3.45.0',
    tablesCount: 3,
    status: 'healthy',
    ...overrides?.database,
  },
  system: {
    platform: 'ios',
    timestamp: new Date().toISOString(),
    ...overrides?.system,
  },
  overall: 'healthy',
});

// Custom matchers
expect.extend({
  toBeHealthyService(received) {
    const pass = 
      received &&
      typeof received === 'object' &&
      typeof received.checkHealth === 'function';
      
    return {
      pass,
      message: pass 
        ? () => 'Expected service not to be healthy'
        : () => 'Expected service to be healthy (have checkHealth method)',
    };
  },
});