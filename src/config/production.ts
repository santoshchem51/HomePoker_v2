/**
 * Production Environment Configuration
 * Story 5.4 - Production Deployment Preparation
 * Secure, optimized configuration for production deployment
 */

export interface ProductionConfig {
  environment: 'production';
  debug: boolean;
  logging: {
    level: 'error' | 'warn' | 'info' | 'debug';
    enableConsole: boolean;
    enableRemote: boolean;
    maxLogSize: number;
  };
  performance: {
    enableMonitoring: boolean;
    enableProfiling: boolean;
    maxMetricsHistory: number;
    alertThresholds: {
      startupTime: number;
      memoryUsage: number;
      frameRate: number;
    };
  };
  security: {
    enableSecurityHeaders: boolean;
    certificatePinning: boolean;
    dataEncryption: boolean;
    biometricAuth: boolean;
  };
  features: {
    enableAnalytics: boolean;
    enableCrashReporting: boolean;
    enableUserFeedback: boolean;
    enableBetaFeatures: boolean;
  };
  api: {
    timeout: number;
    retryAttempts: number;
    enableCaching: boolean;
  };
}

export const productionConfig: ProductionConfig = {
  environment: 'production',
  debug: false,
  
  logging: {
    level: 'warn',
    enableConsole: false,
    enableRemote: true,
    maxLogSize: 1000,
  },
  
  performance: {
    enableMonitoring: true,
    enableProfiling: false, // Disabled in production for performance
    maxMetricsHistory: 50,
    alertThresholds: {
      startupTime: 3000, // 3 seconds
      memoryUsage: 150 * 1024 * 1024, // 150MB
      frameRate: 30, // 30fps minimum
    },
  },
  
  security: {
    enableSecurityHeaders: true,
    certificatePinning: true,
    dataEncryption: true,
    biometricAuth: true,
  },
  
  features: {
    enableAnalytics: true,
    enableCrashReporting: true,
    enableUserFeedback: true,
    enableBetaFeatures: false,
  },
  
  api: {
    timeout: 10000, // 10 seconds
    retryAttempts: 3,
    enableCaching: true,
  },
};

// Environment detection
export const isProduction = (): boolean => {
  return !__DEV__ && (typeof process !== 'undefined' ? process.env.NODE_ENV === 'production' : false);
};

// Configuration getter with environment detection
export const getConfig = (): ProductionConfig => {
  if (isProduction()) {
    return productionConfig;
  }
  
  // Development overrides for testing production features
  return {
    ...productionConfig,
    debug: true,
    logging: {
      ...productionConfig.logging,
      level: 'debug',
      enableConsole: true,
    },
    performance: {
      ...productionConfig.performance,
      enableProfiling: true,
    },
  };
};