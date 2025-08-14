/**
 * Error Logger Service
 * Story 5.3: Comprehensive Testing Suite - Task 6
 * Comprehensive error logging and crash reporting system
 */

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ErrorCategory {
  DATABASE = 'database',
  NETWORK = 'network',
  VALIDATION = 'validation',
  BUSINESS_LOGIC = 'business_logic',
  UI = 'ui',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  SYSTEM = 'system',
}

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  playerId?: string;
  transactionId?: string;
  component?: string;
  action?: string;
  userAgent?: string;
  url?: string;
  additionalData?: Record<string, any>;
}

export interface LoggedError {
  id: string;
  timestamp: Date;
  severity: ErrorSeverity;
  category: ErrorCategory;
  message: string;
  stack?: string;
  context: ErrorContext;
  resolved: boolean;
  resolutionNotes?: string;
}

export interface CrashReport {
  id: string;
  timestamp: Date;
  errorId: string;
  crashReason: string;
  deviceInfo: {
    platform: string;
    version: string;
    memory?: number;
    storage?: number;
  };
  appState: Record<string, any>;
  steps: string[];
}

export class ErrorLogger {
  private errors: Map<string, LoggedError> = new Map();
  private crashReports: Map<string, CrashReport> = new Map();
  private errorHandlers: Array<(error: LoggedError) => void> = [];
  private crashHandlers: Array<(crash: CrashReport) => void> = [];
  private maxLogSize: number = 1000; // Maximum number of errors to keep
  private logRotationEnabled: boolean = true;

  constructor(maxLogSize?: number) {
    if (maxLogSize !== undefined) {
      this.maxLogSize = maxLogSize;
    }
    
    // Set up global error handlers
    this.setupGlobalErrorHandlers();
  }

  /**
   * Log an error with structured information
   */
  logError(
    message: string,
    severity: ErrorSeverity,
    category: ErrorCategory,
    context: ErrorContext = {},
    error?: Error
  ): string {
    const errorId = this.generateErrorId();
    
    const loggedError: LoggedError = {
      id: errorId,
      timestamp: new Date(),
      severity,
      category,
      message,
      stack: error?.stack,
      context: {
        ...context,
        // Add automatic context enrichment
        userAgent: this.getSafeNavigatorProperty('userAgent') || 'N/A',
        url: this.getSafeWindowProperty('href') || 'N/A',
      },
      resolved: false,
    };

    this.errors.set(errorId, loggedError);
    
    // Trigger error handlers
    this.errorHandlers.forEach(handler => {
      try {
        handler(loggedError);
      } catch (handlerError) {
        console.error('Error handler failed:', handlerError);
      }
    });

    // Log rotation
    if (this.logRotationEnabled && this.errors.size > this.maxLogSize) {
      this.rotateErrorLogs();
    }

    // Auto-escalate critical errors
    if (severity === ErrorSeverity.CRITICAL) {
      this.escalateError(loggedError);
    }

    return errorId;
  }

  /**
   * Record a crash report
   */
  recordCrash(
    errorId: string,
    crashReason: string,
    appState: Record<string, any> = {},
    steps: string[] = []
  ): string {
    const crashId = this.generateCrashId();
    
    const crashReport: CrashReport = {
      id: crashId,
      timestamp: new Date(),
      errorId,
      crashReason,
      deviceInfo: this.getDeviceInfo(),
      appState,
      steps,
    };

    this.crashReports.set(crashId, crashReport);

    // Trigger crash handlers
    this.crashHandlers.forEach(handler => {
      try {
        handler(crashReport);
      } catch (handlerError) {
        console.error('Crash handler failed:', handlerError);
      }
    });

    return crashId;
  }

  /**
   * Get errors by various filters
   */
  getErrors(filters: {
    severity?: ErrorSeverity;
    category?: ErrorCategory;
    resolved?: boolean;
    since?: Date;
    sessionId?: string;
  } = {}): LoggedError[] {
    let filteredErrors = Array.from(this.errors.values());

    if (filters.severity) {
      filteredErrors = filteredErrors.filter(e => e.severity === filters.severity);
    }

    if (filters.category) {
      filteredErrors = filteredErrors.filter(e => e.category === filters.category);
    }

    if (filters.resolved !== undefined) {
      filteredErrors = filteredErrors.filter(e => e.resolved === filters.resolved);
    }

    if (filters.since) {
      filteredErrors = filteredErrors.filter(e => e.timestamp >= filters.since!);
    }

    if (filters.sessionId) {
      filteredErrors = filteredErrors.filter(e => e.context.sessionId === filters.sessionId);
    }

    return filteredErrors.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get crash reports
   */
  getCrashReports(since?: Date): CrashReport[] {
    let crashes = Array.from(this.crashReports.values());
    
    if (since) {
      crashes = crashes.filter(c => c.timestamp >= since);
    }

    return crashes.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Mark error as resolved
   */
  resolveError(errorId: string, resolutionNotes?: string): boolean {
    const error = this.errors.get(errorId);
    if (!error) return false;

    error.resolved = true;
    error.resolutionNotes = resolutionNotes;
    this.errors.set(errorId, error);

    return true;
  }

  /**
   * Generate error analytics
   */
  getErrorAnalytics(timeRange?: { start: Date; end: Date }) {
    let errors = Array.from(this.errors.values());
    
    if (timeRange) {
      errors = errors.filter(e => 
        e.timestamp >= timeRange.start && e.timestamp <= timeRange.end
      );
    }

    const analytics = {
      totalErrors: errors.length,
      resolvedErrors: errors.filter(e => e.resolved).length,
      unresolvedErrors: errors.filter(e => !e.resolved).length,
      bySeverity: {} as Record<ErrorSeverity, number>,
      byCategory: {} as Record<ErrorCategory, number>,
      topErrorMessages: {} as Record<string, number>,
      errorTrends: this.calculateErrorTrends(errors),
      crashRate: this.calculateCrashRate(errors),
    };

    // Count by severity
    for (const severity of Object.values(ErrorSeverity)) {
      analytics.bySeverity[severity] = errors.filter(e => e.severity === severity).length;
    }

    // Count by category
    for (const category of Object.values(ErrorCategory)) {
      analytics.byCategory[category] = errors.filter(e => e.category === category).length;
    }

    // Top error messages
    errors.forEach(error => {
      const key = error.message.substring(0, 50); // Truncate for grouping
      analytics.topErrorMessages[key] = (analytics.topErrorMessages[key] || 0) + 1;
    });

    return analytics;
  }

  /**
   * Register error handler
   */
  onError(handler: (error: LoggedError) => void): () => void {
    this.errorHandlers.push(handler);
    
    // Return unsubscribe function
    return () => {
      const index = this.errorHandlers.indexOf(handler);
      if (index > -1) {
        this.errorHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Register crash handler
   */
  onCrash(handler: (crash: CrashReport) => void): () => void {
    this.crashHandlers.push(handler);
    
    // Return unsubscribe function
    return () => {
      const index = this.crashHandlers.indexOf(handler);
      if (index > -1) {
        this.crashHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Export logs for external analysis
   */
  exportLogs(format: 'json' | 'csv' = 'json'): string {
    const errors = Array.from(this.errors.values());
    const crashes = Array.from(this.crashReports.values());

    if (format === 'json') {
      return JSON.stringify({
        errors,
        crashes,
        exportedAt: new Date().toISOString(),
      }, null, 2);
    } else {
      // CSV format
      const csvErrors = errors.map(e => ({
        id: e.id,
        timestamp: e.timestamp.toISOString(),
        severity: e.severity,
        category: e.category,
        message: e.message.replace(/,/g, ';'), // Escape commas
        resolved: e.resolved,
        sessionId: e.context.sessionId || '',
        userId: e.context.userId || '',
      }));

      const headers = Object.keys(csvErrors[0] || {}).join(',');
      const rows = csvErrors.map(row => Object.values(row).join(','));
      
      return [headers, ...rows].join('\n');
    }
  }

  /**
   * Clear all logs (for testing/cleanup)
   */
  clearLogs(): void {
    this.errors.clear();
    this.crashReports.clear();
  }

  // Private methods

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCrashId(): string {
    return `crash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDeviceInfo(): CrashReport['deviceInfo'] {
    return {
      platform: this.getSafeNavigatorProperty('platform') || 'unknown',
      version: this.getSafeNavigatorProperty('appVersion') || 'unknown',
      memory: this.getSafePerformanceMemory(),
      storage: this.getStorageInfo(),
    };
  }

  private getStorageInfo(): number | undefined {
    try {
      const nav = this.getSafeNavigator();
      if (nav && 'storage' in nav) {
        return (nav as any).storage?.estimate?.()?.usage;
      }
    } catch (error) {
      // Storage API not available
    }
    return undefined;
  }

  private getSafeNavigator(): any {
    try {
      return typeof navigator !== 'undefined' ? navigator : undefined;
    } catch {
      return undefined;
    }
  }

  private getSafeNavigatorProperty(property: string): string | undefined {
    try {
      const nav = this.getSafeNavigator();
      return nav ? nav[property] : undefined;
    } catch {
      return undefined;
    }
  }

  private getSafeWindow(): any {
    try {
      return typeof window !== 'undefined' ? window : undefined;
    } catch {
      return undefined;
    }
  }

  private getSafeWindowProperty(property: string): string | undefined {
    try {
      const win = this.getSafeWindow();
      return win?.location?.[property];
    } catch {
      return undefined;
    }
  }

  private getSafePerformanceMemory(): number | undefined {
    try {
      return typeof performance !== 'undefined' ? (performance as any)?.memory?.usedJSHeapSize : undefined;
    } catch {
      return undefined;
    }
  }

  private getSafeProcess(): any {
    try {
      return typeof process !== 'undefined' ? process : undefined;
    } catch {
      return undefined;
    }
  }

  private rotateErrorLogs(): void {
    const sortedErrors = Array.from(this.errors.entries())
      .sort(([, a], [, b]) => a.timestamp.getTime() - b.timestamp.getTime());

    // Keep only the most recent errors
    const toKeep = sortedErrors.slice(-this.maxLogSize);
    
    this.errors.clear();
    toKeep.forEach(([id, error]) => {
      this.errors.set(id, error);
    });
  }

  private escalateError(error: LoggedError): void {
    // In a real implementation, this might send notifications,
    // create incidents in monitoring systems, etc.
    console.error('CRITICAL ERROR ESCALATED:', {
      id: error.id,
      message: error.message,
      context: error.context,
    });

    // Automatically create crash report for critical errors
    if (error.severity === ErrorSeverity.CRITICAL) {
      this.recordCrash(
        error.id,
        `Critical error: ${error.message}`,
        { errorDetails: error },
        ['Critical error occurred', 'System state captured']
      );
    }
  }

  private calculateErrorTrends(errors: LoggedError[]): Record<string, number> {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return {
      last24Hours: errors.filter(e => e.timestamp >= last24Hours).length,
      last7Days: errors.filter(e => e.timestamp >= last7Days).length,
      last30Days: errors.filter(e => e.timestamp >= last30Days).length,
    };
  }

  private calculateCrashRate(errors: LoggedError[]): number {
    const totalErrors = errors.length;
    const crashes = Array.from(this.crashReports.values()).length;
    
    return totalErrors > 0 ? crashes / totalErrors : 0;
  }

  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections (Node.js environment)
    const proc = this.getSafeProcess();
    if (proc) {
      proc.on?.('unhandledRejection', (reason: any, promise: Promise<any>) => {
        this.logError(
          `Unhandled Promise Rejection: ${reason}`,
          ErrorSeverity.HIGH,
          ErrorCategory.SYSTEM,
          { 
            component: 'GlobalErrorHandler',
            action: 'unhandledRejection',
            additionalData: { promise: promise.toString() }
          }
        );
      });

      proc.on?.('uncaughtException', (error: Error) => {
        const errorId = this.logError(
          `Uncaught Exception: ${error.message}`,
          ErrorSeverity.CRITICAL,
          ErrorCategory.SYSTEM,
          { 
            component: 'GlobalErrorHandler',
            action: 'uncaughtException'
          },
          error
        );

        // Record crash for uncaught exceptions
        this.recordCrash(
          errorId,
          'Uncaught Exception',
          { error: error.message, stack: error.stack },
          ['Uncaught exception occurred', 'Application may be unstable']
        );
      });
    }

    // Handle window errors (browser environment)
    const win = this.getSafeWindow();
    if (win) {
      win.addEventListener?.('error', (event: any) => {
        this.logError(
          `Window Error: ${event.error?.message || event.message}`,
          ErrorSeverity.HIGH,
          ErrorCategory.SYSTEM,
          {
            component: 'GlobalErrorHandler',
            action: 'windowError',
            additionalData: {
              filename: event.filename,
              lineno: event.lineno,
              colno: event.colno,
            }
          },
          event.error
        );
      });

      win.addEventListener?.('unhandledrejection', (event: any) => {
        this.logError(
          `Unhandled Promise Rejection: ${event.reason}`,
          ErrorSeverity.HIGH,
          ErrorCategory.SYSTEM,
          {
            component: 'GlobalErrorHandler', 
            action: 'unhandledRejection'
          }
        );
      });
    }
  }
}

// Export singleton instance
export const errorLogger = new ErrorLogger();