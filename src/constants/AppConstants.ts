/**
 * Application-wide constants for PokePot
 * 
 * Centralized location for all app constants to maintain consistency
 * and make configuration changes easier across the codebase.
 */

export const APP_CONFIG = {
  name: 'PokePot',
  version: '0.0.1',
  description: 'React Native Poker Session Manager',
} as const;

export const DATABASE_CONFIG = {
  name: 'pokepot.db',
  location: 'default' as const,
  timeout: 30000, // 30 seconds
  cleanupRetentionDays: 30,
  
  // Performance optimization settings
  performance: {
    journalMode: 'WAL',
    synchronous: 'NORMAL',
    cacheSize: 10000,
    foreignKeys: true,
  },
} as const;

export const PERFORMANCE_LIMITS = {
  // As per story requirements
  maxStartupTime: 3000, // 3 seconds
  maxDatabaseInitTime: 100, // 100ms
  maxMemoryFootprint: 150 * 1024 * 1024, // 150MB in bytes
  maxBundleSize: 50 * 1024 * 1024, // 50MB in bytes
} as const;

export const UI_CONSTANTS = {
  colors: {
    primary: '#2196F3',
    secondary: '#4CAF50',
    error: '#F44336',
    warning: '#FF9800',
    background: '#f5f5f5',
    text: '#333',
    textSecondary: '#666',
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
  },
  
  fontSize: {
    small: 14,
    medium: 16,
    large: 18,
    xlarge: 20,
    title: 24,
  },
} as const;

export const HEALTH_CHECK_CONFIG = {
  refreshInterval: 30000, // 30 seconds
  timeout: 10000, // 10 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
} as const;

export const TEST_CONFIG = {
  // Test environment identifiers
  isTestEnvironment: (typeof __DEV__ !== 'undefined' && __DEV__) === false, // Inverted because we want test mode when NOT in dev
  isMockDatabase: false,
  
  // Test timeouts
  defaultTimeout: 30000, // 30 seconds
  databaseTimeout: 5000, // 5 seconds
  uiTimeout: 5000, // 5 seconds
} as const;

export const ERROR_MESSAGES = {
  database: {
    initializationFailed: 'Database initialization failed. Please restart the app.',
    connectionLost: 'Database connection lost. Attempting to reconnect...',
    queryFailed: 'Database query failed. Please try again.',
    transactionFailed: 'Database transaction failed. Changes were not saved.',
  },
  
  health: {
    checkFailed: 'Health check failed. Some features may not work properly.',
    systemUnhealthy: 'System is unhealthy. Please check your connection.',
  },
  
  app: {
    initializationFailed: 'App initialization failed. Please restart the application.',
    unknownError: 'An unexpected error occurred. Please try again.',
  },
} as const;

export const SUCCESS_MESSAGES = {
  database: {
    initialized: 'Database initialized successfully',
    connected: 'Database connection established',
    queryExecuted: 'Query executed successfully',
    schemaUpdated: 'Database schema updated successfully',
  },
  
  app: {
    initialized: 'App initialized successfully',
    ready: 'App is ready for use',
  },
} as const;

// Type exports for better type safety
export type AppConfig = typeof APP_CONFIG;
export type DatabaseConfig = typeof DATABASE_CONFIG;
export type UIConstants = typeof UI_CONSTANTS;
export type HealthCheckConfig = typeof HEALTH_CHECK_CONFIG;
export type PerformanceLimits = typeof PERFORMANCE_LIMITS;