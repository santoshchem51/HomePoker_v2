/**
 * Crash Reporting and Monitoring Service
 * Production Hardening - Phase 1
 * 
 * Provides crash reporting, performance monitoring, and error analytics
 * for production readiness. Designed to be easily configurable for different
 * monitoring providers (Firebase Crashlytics, Sentry, etc.).
 */

import { ServiceError } from '../core/ServiceError';

// Global declarations for React Native environment
declare const global: any;

export interface CrashReport {
  error: Error;
  context: string;
  userId?: string;
  sessionId?: string;
  customProperties?: Record<string, any>;
  timestamp: Date;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count';
  context?: string;
  timestamp: Date;
}

export interface CrashReportingConfig {
  enabled: boolean;
  provider: 'console' | 'firebase' | 'sentry';
  minimumSeverity: 'debug' | 'info' | 'warning' | 'error' | 'fatal';
  collectDeviceInfo: boolean;
  collectUserInfo: boolean;
}

export class CrashReportingService {
  private static instance: CrashReportingService;
  private config: CrashReportingConfig;
  private isInitialized = false;

  private constructor() {
    this.config = {
      enabled: true,
      provider: 'console', // Default to console logging for development
      minimumSeverity: 'error',
      collectDeviceInfo: true,
      collectUserInfo: false, // Privacy-focused default
    };
  }

  public static getInstance(): CrashReportingService {
    if (!CrashReportingService.instance) {
      CrashReportingService.instance = new CrashReportingService();
    }
    return CrashReportingService.instance;
  }

  public async initialize(config?: Partial<CrashReportingConfig>): Promise<void> {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    if (!this.config.enabled) {
      console.log('CrashReportingService: Disabled by configuration');
      return;
    }

    try {
      switch (this.config.provider) {
        case 'console':
          await this.initializeConsoleProvider();
          break;
        case 'firebase':
          await this.initializeFirebaseProvider();
          break;
        case 'sentry':
          await this.initializeSentryProvider();
          break;
        default:
          throw new Error(`Unsupported crash reporting provider: ${this.config.provider}`);
      }

      this.isInitialized = true;
      this.logInfo('CrashReportingService initialized successfully', {
        provider: this.config.provider,
        minimumSeverity: this.config.minimumSeverity,
      });
    } catch (error) {
      console.error('Failed to initialize CrashReportingService:', error);
      // Don't throw - crash reporting should not prevent app from working
    }
  }

  private async initializeConsoleProvider(): Promise<void> {
    // Console provider is always available - no setup needed
    console.log('CrashReportingService: Using console provider for development');
  }

  private async initializeFirebaseProvider(): Promise<void> {
    // TODO: Initialize Firebase Crashlytics when added to project
    console.log('CrashReportingService: Firebase provider not yet implemented, falling back to console');
    this.config.provider = 'console';
  }

  private async initializeSentryProvider(): Promise<void> {
    // TODO: Initialize Sentry when added to project
    console.log('CrashReportingService: Sentry provider not yet implemented, falling back to console');
    this.config.provider = 'console';
  }

  public reportError(error: Error, context: string, customProperties?: Record<string, any>): void {
    if (!this.config.enabled || !this.shouldReport('error')) {
      return;
    }

    const report: CrashReport = {
      error,
      context,
      customProperties,
      timestamp: new Date(),
    };

    this.submitCrashReport(report);
  }

  public reportServiceError(serviceError: ServiceError, context: string): void {
    if (!this.config.enabled || !this.shouldReport('error')) {
      return;
    }

    const customProperties = {
      serviceErrorCode: serviceError.code,
      serviceErrorDetails: serviceError.details,
    };

    this.reportError(serviceError, context, customProperties);
  }

  public reportPerformanceMetric(metric: PerformanceMetric): void {
    if (!this.config.enabled || !this.shouldReport('info')) {
      return;
    }

    this.submitPerformanceMetric(metric);
  }

  public reportDatabaseInitializationTime(duration: number, successful: boolean): void {
    this.reportPerformanceMetric({
      name: 'database_initialization_time',
      value: duration,
      unit: 'ms',
      context: successful ? 'success' : 'failure',
      timestamp: new Date(),
    });

    if (duration > 5000) {
      this.reportError(
        new Error('Database initialization timeout'),
        'database_initialization',
        { duration, successful }
      );
    }
  }

  public reportServiceInitializationTime(duration: number, successful: boolean): void {
    this.reportPerformanceMetric({
      name: 'service_initialization_time',
      value: duration,
      unit: 'ms',
      context: successful ? 'success' : 'failure',
      timestamp: new Date(),
    });

    if (duration > 2000) {
      this.reportError(
        new Error('Service initialization timeout'),
        'service_initialization',
        { duration, successful }
      );
    }
  }

  public reportAppStartupTime(duration: number): void {
    this.reportPerformanceMetric({
      name: 'app_startup_time',
      value: duration,
      unit: 'ms',
      timestamp: new Date(),
    });

    // Alert if startup time exceeds 3 seconds (production target)
    if (duration > 3000) {
      this.logWarning('App startup time exceeded target', { duration });
    }
  }

  public reportMemoryUsage(usage: number): void {
    this.reportPerformanceMetric({
      name: 'memory_usage',
      value: usage,
      unit: 'bytes',
      timestamp: new Date(),
    });

    // Alert if memory usage exceeds 150MB (production target)
    if (usage > 150 * 1024 * 1024) {
      this.logWarning('Memory usage exceeded target', { usage });
    }
  }

  private shouldReport(severity: string): boolean {
    const severityLevels = ['debug', 'info', 'warning', 'error', 'fatal'];
    const currentLevel = severityLevels.indexOf(this.config.minimumSeverity);
    const reportLevel = severityLevels.indexOf(severity);
    
    return reportLevel >= currentLevel;
  }

  private submitCrashReport(report: CrashReport): void {
    switch (this.config.provider) {
      case 'console':
        this.logToConsole('ERROR', report.context, {
          error: report.error.message,
          stack: report.error.stack,
          customProperties: report.customProperties,
          timestamp: report.timestamp.toISOString(),
        });
        break;
      
      case 'firebase':
        // TODO: Submit to Firebase Crashlytics
        break;
      
      case 'sentry':
        // TODO: Submit to Sentry
        break;
    }
  }

  private submitPerformanceMetric(metric: PerformanceMetric): void {
    switch (this.config.provider) {
      case 'console':
        this.logToConsole('INFO', 'PERFORMANCE', {
          metric: metric.name,
          value: `${metric.value}${metric.unit}`,
          context: metric.context,
          timestamp: metric.timestamp.toISOString(),
        });
        break;
      
      case 'firebase':
        // TODO: Submit to Firebase Performance Monitoring
        break;
      
      case 'sentry':
        // TODO: Submit to Sentry Performance
        break;
    }
  }

  private logInfo(message: string, data?: any): void {
    if (this.shouldReport('info')) {
      this.logToConsole('INFO', message, data);
    }
  }

  private logWarning(message: string, data?: any): void {
    if (this.shouldReport('warning')) {
      this.logToConsole('WARNING', message, data);
    }
  }

  private logToConsole(level: string, message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;
    
    switch (level) {
      case 'ERROR':
        console.error(logMessage, data || '');
        break;
      case 'WARNING':
        console.warn(logMessage, data || '');
        break;
      default:
        console.log(logMessage, data || '');
    }
  }

  // Production health monitoring methods
  public startSessionMonitoring(sessionId: string): void {
    this.logInfo('Session started', { sessionId });
  }

  public endSessionMonitoring(sessionId: string, duration: number): void {
    this.reportPerformanceMetric({
      name: 'session_duration',
      value: duration,
      unit: 'ms',
      context: sessionId,
      timestamp: new Date(),
    });
  }

  public reportUserAction(action: string, context?: string, properties?: Record<string, any>): void {
    if (this.shouldReport('info')) {
      this.logInfo(`User action: ${action}`, { context, properties });
    }
  }

  // Development and testing utilities
  public getConfiguration(): CrashReportingConfig {
    return { ...this.config };
  }

  public isEnabled(): boolean {
    return this.config.enabled && this.isInitialized;
  }

  public async flush(): Promise<void> {
    // In console mode, no async operations to flush
    // For Firebase/Sentry, this would ensure all pending reports are sent
    this.logInfo('Crash reporting service flushed');
  }
}

// Global error handler setup
export const setupGlobalErrorHandler = (crashReporting: CrashReportingService): void => {
  // React Native global error handler
  const defaultHandler = global.ErrorUtils?.getGlobalHandler?.() || (() => {});
  
  global.ErrorUtils?.setGlobalHandler?.((error: Error, isFatal?: boolean) => {
    crashReporting.reportError(error, 'global_error_handler', { isFatal });
    defaultHandler(error, isFatal);
  });

  // Promise rejection handler
  const originalRejectionHandler = global.onunhandledrejection;
  global.onunhandledrejection = (event: any) => {
    crashReporting.reportError(
      new Error(`Unhandled Promise Rejection: ${event.reason}`),
      'promise_rejection',
      { reason: event.reason }
    );
    
    if (originalRejectionHandler) {
      originalRejectionHandler(event);
    }
  };
};