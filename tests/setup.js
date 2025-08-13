/**
 * Jest setup for PokePot React Native application
 * This file runs before all tests and sets up the testing environment
 */

// Mock React Native animated module if needed (suppress deep import warning)
/* eslint-disable @react-native/no-deep-imports */
try {
  require('react-native/Libraries/Animated/NativeAnimatedHelper');
  jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
} catch (e) {
  // Module doesn't exist in this React Native version, skip mocking
}
/* eslint-enable @react-native/no-deep-imports */

// Mock SQLite for testing environment
jest.mock('react-native-sqlite-storage', () => ({
  DEBUG: jest.fn(),
  enablePromise: jest.fn(),
  openDatabase: jest.fn(() => 
    Promise.reject(new Error('SQLite not available in test environment'))
  ),
}));

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

// Mock specific React Native components that cause issues in tests
jest.mock('react-native', () => {
  // Create a more comprehensive mock to avoid TurboModule issues
  return {
    Platform: {
      OS: 'ios',
      select: jest.fn((obj) => obj.ios),
    },
    Alert: {
      alert: jest.fn(),
    },
    StyleSheet: {
      create: jest.fn((styles) => styles),
      flatten: jest.fn((styles) => styles),
    },
    View: 'View',
    Text: 'Text',
    TouchableOpacity: 'TouchableOpacity',
    ActivityIndicator: 'ActivityIndicator',
    ScrollView: 'ScrollView',
    TextInput: 'TextInput',
    Dimensions: {
      get: jest.fn(() => ({ width: 375, height: 667 })),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
    AccessibilityInfo: {
      announceForAccessibility: jest.fn(),
      isReduceMotionEnabled: jest.fn(() => Promise.resolve(false)),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
    Animated: {
      Value: jest.fn((value) => ({
        setValue: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        removeAllListeners: jest.fn(),
        hasListeners: jest.fn(() => false),
        _value: value,
      })),
      timing: jest.fn((value, config) => ({
        start: jest.fn((callback) => {
          if (callback) callback({ finished: true });
        }),
      })),
      sequence: jest.fn((animations) => ({
        start: jest.fn((callback) => {
          if (callback) callback({ finished: true });
        }),
      })),
      View: 'Animated.View',
    },
    PixelRatio: {
      get: jest.fn(() => 2),
    },
    // Mock TurboModuleRegistry to prevent initialization errors
    TurboModuleRegistry: {
      getEnforcing: jest.fn(() => ({})),
      get: jest.fn(() => ({})),
    },
    // Mock other potentially problematic modules
    DevMenu: {},
    LogBox: {
      ignoreAllLogs: jest.fn(),
      ignoreLogs: jest.fn(),
    },
    AppRegistry: {
      registerComponent: jest.fn(),
    },
  };
});

// Mock console methods for cleaner test output
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  // Suppress expected warnings/errors in tests
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Failed to initialize database') ||
       args[0].includes('App initialization failed') ||
       args[0].includes('SQLite not available'))
    ) {
      return; // Suppress expected database errors
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('componentWillReceiveProps')
    ) {
      return; // Suppress React warnings
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Global test utilities
global.__DEV__ = false;

// Mock timers for testing
jest.useFakeTimers();

// Set up testing library defaults (commented out to avoid module issues)
// import { configure } from '@testing-library/react-native';

// configure({
//   // Default timeout for queries
//   asyncUtilTimeout: 5000,
// });

// Import built-in matchers (commented out for now)
// import '@testing-library/react-native/extend-expect';

// Custom matchers and utilities
expect.extend({
  toBeHealthyService(received) {
    const pass = 
      received &&
      typeof received === 'object' &&
      typeof received.checkHealth === 'function';
      
    if (pass) {
      return {
        message: () => `Expected service not to be healthy`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected service to be healthy (have checkHealth method)`,
        pass: false,
      };
    }
  },
});

// Database test utilities
export const createMockDatabase = () => ({
  transaction: jest.fn((callback) => {
    const tx = {
      executeSql: jest.fn((sql, params, success, error) => {
        // Mock successful transaction
        if (success) success(tx, { rows: { length: 0, item: () => ({}) } });
      }),
    };
    callback(tx);
  }),
  close: jest.fn(),
  executeSql: jest.fn(() => Promise.resolve([{ rows: { length: 0 } }])),
});

// Service test utilities
export const createMockHealthStatus = (overrides = {}) => ({
  app: {
    name: 'PokePot',
    version: '0.0.1',
    status: 'healthy',
    uptime: 100,
    ...overrides.app,
  },
  database: {
    connected: true,
    version: '3.45.0',
    tablesCount: 3,
    status: 'healthy',
    ...overrides.database,
  },
  system: {
    platform: 'ios',
    timestamp: new Date().toISOString(),
    ...overrides.system,
  },
  overall: 'healthy',
  ...overrides,
});

// Component test utilities
export const createMockProps = (overrides = {}) => ({
  testID: 'test-component',
  ...overrides,
});

// Console utilities for test debugging
export const suppressConsoleErrorsDuring = (testFn) => {
  const savedError = console.error;
  console.error = jest.fn();
  
  try {
    return testFn();
  } finally {
    console.error = savedError;
  }
};