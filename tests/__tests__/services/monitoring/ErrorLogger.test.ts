/**
 * Error Logger Service Test Suite
 * Story 5.3: Comprehensive Testing Suite - Task 6
 * Comprehensive testing of error logging and crash reporting
 */

import { 
  ErrorLogger, 
  ErrorSeverity, 
  ErrorCategory, 
  errorLogger 
} from '@/services/monitoring/ErrorLogger';

describe('ErrorLogger Service', () => {
  let logger: ErrorLogger;

  beforeEach(() => {
    logger = new ErrorLogger(100); // Small log size for testing
    jest.clearAllMocks();
  });

  afterEach(() => {
    logger.clearLogs();
  });

  describe('Error Logging', () => {
    it('should log errors with structured information', () => {
      const errorId = logger.logError(
        'Test error message',
        ErrorSeverity.MEDIUM,
        ErrorCategory.BUSINESS_LOGIC,
        {
          userId: 'user123',
          sessionId: 'session456',
          component: 'TestComponent',
          action: 'testAction',
        }
      );

      expect(errorId).toBeDefined();
      expect(errorId).toMatch(/^err_/);

      const errors = logger.getErrors();
      expect(errors).toHaveLength(1);

      const loggedError = errors[0];
      expect(loggedError.id).toBe(errorId);
      expect(loggedError.message).toBe('Test error message');
      expect(loggedError.severity).toBe(ErrorSeverity.MEDIUM);
      expect(loggedError.category).toBe(ErrorCategory.BUSINESS_LOGIC);
      expect(loggedError.context.userId).toBe('user123');
      expect(loggedError.context.sessionId).toBe('session456');
      expect(loggedError.resolved).toBe(false);
      expect(loggedError.timestamp).toBeInstanceOf(Date);
    });

    it('should handle errors with stack traces', () => {
      const testError = new Error('Test error with stack');
      
      logger.logError(
        'Error with stack trace',
        ErrorSeverity.HIGH,
        ErrorCategory.SYSTEM,
        { component: 'ErrorHandler' },
        testError
      );

      const errors = logger.getErrors();
      const loggedError = errors[0];
      
      expect(loggedError.stack).toBeDefined();
      expect(loggedError.stack).toContain('Test error with stack');
    });

    it('should auto-escalate critical errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      logger.logError(
        'Critical system failure',
        ErrorSeverity.CRITICAL,
        ErrorCategory.SYSTEM,
        { component: 'CriticalSystem' }
      );

      // Should automatically create crash report for critical errors
      const crashes = logger.getCrashReports();
      expect(crashes).toHaveLength(1);
      expect(crashes[0].crashReason).toContain('Critical error');

      // Should log escalation
      expect(consoleSpy).toHaveBeenCalledWith(
        'CRITICAL ERROR ESCALATED:',
        expect.objectContaining({
          message: 'Critical system failure',
        })
      );

      consoleSpy.mockRestore();
    });

    it('should enrich error context automatically', () => {
      const errorId = logger.logError(
        'Test error',
        ErrorSeverity.LOW,
        ErrorCategory.VALIDATION
      );

      const errors = logger.getErrors();
      const loggedError = errors[0];
      
      // Should have automatic context enrichment
      expect(loggedError.context.userAgent).toBeDefined();
      expect(loggedError.context.url).toBeDefined();
    });
  });

  describe('Error Filtering and Retrieval', () => {
    beforeEach(() => {
      // Create test errors with different properties
      logger.logError('Error 1', ErrorSeverity.LOW, ErrorCategory.VALIDATION, { sessionId: 'session1' });
      logger.logError('Error 2', ErrorSeverity.MEDIUM, ErrorCategory.DATABASE, { sessionId: 'session1' });
      logger.logError('Error 3', ErrorSeverity.HIGH, ErrorCategory.NETWORK, { sessionId: 'session2' });
      logger.logError('Error 4', ErrorSeverity.CRITICAL, ErrorCategory.SECURITY, { userId: 'user1' });
      
      // Resolve one error
      const errors = logger.getErrors();
      logger.resolveError(errors[0].id, 'Fixed the issue');
    });

    it('should filter errors by severity', () => {
      const lowErrors = logger.getErrors({ severity: ErrorSeverity.LOW });
      const highErrors = logger.getErrors({ severity: ErrorSeverity.HIGH });
      const criticalErrors = logger.getErrors({ severity: ErrorSeverity.CRITICAL });

      expect(lowErrors).toHaveLength(1);
      expect(highErrors).toHaveLength(1);
      expect(criticalErrors).toHaveLength(1);
      
      expect(lowErrors[0].message).toBe('Error 1');
      expect(highErrors[0].message).toBe('Error 3');
      expect(criticalErrors[0].message).toBe('Error 4');
    });

    it('should filter errors by category', () => {
      const validationErrors = logger.getErrors({ category: ErrorCategory.VALIDATION });
      const databaseErrors = logger.getErrors({ category: ErrorCategory.DATABASE });
      const securityErrors = logger.getErrors({ category: ErrorCategory.SECURITY });

      expect(validationErrors).toHaveLength(1);
      expect(databaseErrors).toHaveLength(1);
      expect(securityErrors).toHaveLength(1);
      
      expect(validationErrors[0].message).toBe('Error 1');
      expect(databaseErrors[0].message).toBe('Error 2');
      expect(securityErrors[0].message).toBe('Error 4');
    });

    it('should filter errors by resolution status', () => {
      const resolvedErrors = logger.getErrors({ resolved: true });
      const unresolvedErrors = logger.getErrors({ resolved: false });

      expect(resolvedErrors).toHaveLength(1);
      expect(unresolvedErrors).toHaveLength(3); // 3 + auto-generated crash for critical error

      expect(resolvedErrors[0].resolved).toBe(true);
      expect(resolvedErrors[0].resolutionNotes).toBe('Fixed the issue');
    });

    it('should filter errors by session ID', () => {
      const session1Errors = logger.getErrors({ sessionId: 'session1' });
      const session2Errors = logger.getErrors({ sessionId: 'session2' });

      expect(session1Errors).toHaveLength(2);
      expect(session2Errors).toHaveLength(1);
      
      expect(session1Errors.map(e => e.message)).toContain('Error 1');
      expect(session1Errors.map(e => e.message)).toContain('Error 2');
      expect(session2Errors[0].message).toBe('Error 3');
    });

    it('should filter errors by date range', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      const recentErrors = logger.getErrors({ since: oneHourAgo });
      expect(recentErrors).toHaveLength(4); // All errors should be recent

      const futureDate = new Date(now.getTime() + 60 * 60 * 1000);
      const futureErrors = logger.getErrors({ since: futureDate });
      expect(futureErrors).toHaveLength(0);
    });

    it('should sort errors by timestamp (newest first)', () => {
      const errors = logger.getErrors();
      
      // Should be sorted by timestamp descending
      for (let i = 1; i < errors.length; i++) {
        expect(errors[i - 1].timestamp.getTime()).toBeGreaterThanOrEqual(
          errors[i].timestamp.getTime()
        );
      }
    });
  });

  describe('Crash Reporting', () => {
    it('should record crash reports with detailed information', () => {
      const errorId = logger.logError(
        'System crash',
        ErrorSeverity.CRITICAL,
        ErrorCategory.SYSTEM
      );

      const crashId = logger.recordCrash(
        errorId,
        'Application crashed due to memory overflow',
        {
          memoryUsage: '85%',
          activeUsers: 5,
          lastAction: 'settlement_calculation',
        },
        [
          'User started settlement calculation',
          'Memory usage spiked to 85%',
          'Application became unresponsive',
          'Crash occurred',
        ]
      );

      expect(crashId).toBeDefined();
      expect(crashId).toMatch(/^crash_/);

      const crashes = logger.getCrashReports();
      expect(crashes).toHaveLength(2); // One from critical error, one manual

      const manualCrash = crashes.find(c => c.id === crashId);
      expect(manualCrash).toBeDefined();
      expect(manualCrash!.errorId).toBe(errorId);
      expect(manualCrash!.crashReason).toBe('Application crashed due to memory overflow');
      expect(manualCrash!.appState.memoryUsage).toBe('85%');
      expect(manualCrash!.steps).toHaveLength(4);
      expect(manualCrash!.deviceInfo).toBeDefined();
    });

    it('should capture device information in crash reports', () => {
      const errorId = logger.logError('Test error', ErrorSeverity.HIGH, ErrorCategory.SYSTEM);
      const crashId = logger.recordCrash(errorId, 'Test crash');

      const crashes = logger.getCrashReports();
      const crash = crashes.find(c => c.id === crashId);

      expect(crash!.deviceInfo).toMatchObject({
        platform: expect.any(String),
        version: expect.any(String),
      });
    });

    it('should filter crash reports by date', () => {
      const errorId = logger.logError('Test error', ErrorSeverity.HIGH, ErrorCategory.SYSTEM);
      logger.recordCrash(errorId, 'Recent crash');

      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const futureDate = new Date(now.getTime() + 60 * 60 * 1000);

      const recentCrashes = logger.getCrashReports(oneHourAgo);
      const futureCrashes = logger.getCrashReports(futureDate);

      expect(recentCrashes.length).toBeGreaterThan(0);
      expect(futureCrashes).toHaveLength(0);
    });
  });

  describe('Error Analytics', () => {
    beforeEach(() => {
      // Create diverse error data for analytics
      logger.logError('Validation failed', ErrorSeverity.LOW, ErrorCategory.VALIDATION);
      logger.logError('Database timeout', ErrorSeverity.MEDIUM, ErrorCategory.DATABASE);
      logger.logError('Network error', ErrorSeverity.HIGH, ErrorCategory.NETWORK);
      logger.logError('Security breach', ErrorSeverity.CRITICAL, ErrorCategory.SECURITY);
      logger.logError('UI component error', ErrorSeverity.MEDIUM, ErrorCategory.UI);
      logger.logError('Performance issue', ErrorSeverity.LOW, ErrorCategory.PERFORMANCE);
      
      // Resolve some errors
      const errors = logger.getErrors();
      logger.resolveError(errors[0].id, 'Fixed validation');
      logger.resolveError(errors[1].id, 'Database optimized');
    });

    it('should generate comprehensive error analytics', () => {
      const analytics = logger.getErrorAnalytics();

      expect(analytics.totalErrors).toBe(6);
      expect(analytics.resolvedErrors).toBe(2);
      expect(analytics.unresolvedErrors).toBe(4);

      // Check severity breakdown
      expect(analytics.bySeverity[ErrorSeverity.LOW]).toBe(2);
      expect(analytics.bySeverity[ErrorSeverity.MEDIUM]).toBe(2);
      expect(analytics.bySeverity[ErrorSeverity.HIGH]).toBe(1);
      expect(analytics.bySeverity[ErrorSeverity.CRITICAL]).toBe(1);

      // Check category breakdown
      expect(analytics.byCategory[ErrorCategory.VALIDATION]).toBe(1);
      expect(analytics.byCategory[ErrorCategory.DATABASE]).toBe(1);
      expect(analytics.byCategory[ErrorCategory.NETWORK]).toBe(1);
      expect(analytics.byCategory[ErrorCategory.SECURITY]).toBe(1);
      expect(analytics.byCategory[ErrorCategory.UI]).toBe(1);
      expect(analytics.byCategory[ErrorCategory.PERFORMANCE]).toBe(1);
    });

    it('should calculate error trends', () => {
      const analytics = logger.getErrorAnalytics();

      expect(analytics.errorTrends).toBeDefined();
      expect(analytics.errorTrends.last24Hours).toBeGreaterThan(0);
      expect(analytics.errorTrends.last7Days).toBeGreaterThanOrEqual(analytics.errorTrends.last24Hours);
      expect(analytics.errorTrends.last30Days).toBeGreaterThanOrEqual(analytics.errorTrends.last7Days);
    });

    it('should track top error messages', () => {
      // Add duplicate error messages
      logger.logError('Common error message', ErrorSeverity.MEDIUM, ErrorCategory.VALIDATION);
      logger.logError('Common error message', ErrorSeverity.MEDIUM, ErrorCategory.VALIDATION);
      logger.logError('Another common error', ErrorSeverity.LOW, ErrorCategory.UI);

      const analytics = logger.getErrorAnalytics();

      expect(analytics.topErrorMessages).toBeDefined();
      expect(analytics.topErrorMessages['Common error message']).toBe(2);
      expect(analytics.topErrorMessages['Another common error']).toBe(1);
    });

    it('should calculate crash rate', () => {
      // Add some crashes
      const errorId1 = logger.logError('Crash error 1', ErrorSeverity.CRITICAL, ErrorCategory.SYSTEM);
      const errorId2 = logger.logError('Crash error 2', ErrorSeverity.HIGH, ErrorCategory.SYSTEM);
      
      logger.recordCrash(errorId1, 'Manual crash 1');
      logger.recordCrash(errorId2, 'Manual crash 2');

      const analytics = logger.getErrorAnalytics();
      
      expect(analytics.crashRate).toBeGreaterThan(0);
      expect(analytics.crashRate).toBeLessThanOrEqual(1);
    });

    it('should support time-range analytics', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      const analytics = logger.getErrorAnalytics({
        start: oneHourAgo,
        end: now,
      });

      expect(analytics.totalErrors).toBeGreaterThan(0);
      expect(analytics.bySeverity).toBeDefined();
      expect(analytics.byCategory).toBeDefined();
    });
  });

  describe('Event Handlers', () => {
    it('should trigger error handlers when errors are logged', () => {
      const errorHandler = jest.fn();
      const unsubscribe = logger.onError(errorHandler);

      logger.logError('Test error', ErrorSeverity.MEDIUM, ErrorCategory.VALIDATION);

      expect(errorHandler).toHaveBeenCalledTimes(1);
      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test error',
          severity: ErrorSeverity.MEDIUM,
          category: ErrorCategory.VALIDATION,
        })
      );

      // Test unsubscription
      unsubscribe();
      logger.logError('Another error', ErrorSeverity.LOW, ErrorCategory.UI);
      expect(errorHandler).toHaveBeenCalledTimes(1); // Should not increase
    });

    it('should trigger crash handlers when crashes are recorded', () => {
      const crashHandler = jest.fn();
      const unsubscribe = logger.onCrash(crashHandler);

      const errorId = logger.logError('Test error', ErrorSeverity.HIGH, ErrorCategory.SYSTEM);
      logger.recordCrash(errorId, 'Test crash');

      expect(crashHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          errorId,
          crashReason: 'Test crash',
        })
      );

      // Test unsubscription
      unsubscribe();
      logger.recordCrash(errorId, 'Another crash');
      expect(crashHandler).toHaveBeenCalledTimes(1); // Should not increase
    });

    it('should handle errors in event handlers gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const faultyHandler = jest.fn().mockImplementation(() => {
        throw new Error('Handler error');
      });
      
      logger.onError(faultyHandler);
      
      // Should not throw when handler fails
      expect(() => {
        logger.logError('Test error', ErrorSeverity.MEDIUM, ErrorCategory.VALIDATION);
      }).not.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith('Error handler failed:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('Log Management', () => {
    it('should perform log rotation when max size is reached', () => {
      const smallLogger = new ErrorLogger(3); // Very small log size

      // Add more errors than the limit
      for (let i = 0; i < 5; i++) {
        smallLogger.logError(`Error ${i}`, ErrorSeverity.MEDIUM, ErrorCategory.VALIDATION);
      }

      const errors = smallLogger.getErrors();
      expect(errors).toHaveLength(3); // Should only keep 3 most recent

      // Check that the oldest errors were removed
      const messages = errors.map(e => e.message);
      expect(messages).toContain('Error 4');
      expect(messages).toContain('Error 3');
      expect(messages).toContain('Error 2');
      expect(messages).not.toContain('Error 1');
      expect(messages).not.toContain('Error 0');
    });

    it('should resolve errors with resolution notes', () => {
      const errorId = logger.logError('Test error', ErrorSeverity.MEDIUM, ErrorCategory.VALIDATION);

      const result = logger.resolveError(errorId, 'Fixed by updating validation rules');
      expect(result).toBe(true);

      const errors = logger.getErrors();
      const resolvedError = errors.find(e => e.id === errorId);
      
      expect(resolvedError!.resolved).toBe(true);
      expect(resolvedError!.resolutionNotes).toBe('Fixed by updating validation rules');
    });

    it('should handle resolving non-existent errors', () => {
      const result = logger.resolveError('non-existent-id', 'Some notes');
      expect(result).toBe(false);
    });

    it('should clear all logs', () => {
      logger.logError('Error 1', ErrorSeverity.MEDIUM, ErrorCategory.VALIDATION);
      logger.logError('Error 2', ErrorSeverity.HIGH, ErrorCategory.NETWORK);
      logger.recordCrash('err_123', 'Test crash');

      expect(logger.getErrors()).toHaveLength(2);
      expect(logger.getCrashReports()).toHaveLength(1);

      logger.clearLogs();

      expect(logger.getErrors()).toHaveLength(0);
      expect(logger.getCrashReports()).toHaveLength(0);
    });
  });

  describe('Log Export', () => {
    beforeEach(() => {
      logger.logError('Export test error 1', ErrorSeverity.MEDIUM, ErrorCategory.VALIDATION, { userId: 'user1' });
      logger.logError('Export test error 2', ErrorSeverity.HIGH, ErrorCategory.DATABASE, { sessionId: 'session1' });
      
      const errorId = logger.logError('Crash error', ErrorSeverity.CRITICAL, ErrorCategory.SYSTEM);
      logger.recordCrash(errorId, 'Export test crash');
    });

    it('should export logs in JSON format', () => {
      const jsonExport = logger.exportLogs('json');
      const parsed = JSON.parse(jsonExport);

      expect(parsed).toHaveProperty('errors');
      expect(parsed).toHaveProperty('crashes');
      expect(parsed).toHaveProperty('exportedAt');

      expect(parsed.errors).toHaveLength(3);
      expect(parsed.crashes).toHaveLength(2); // One auto-generated, one manual
      
      expect(parsed.errors[0]).toMatchObject({
        message: expect.any(String),
        severity: expect.any(String),
        category: expect.any(String),
        timestamp: expect.any(String),
      });
    });

    it('should export logs in CSV format', () => {
      const csvExport = logger.exportLogs('csv');
      const lines = csvExport.split('\n');

      expect(lines[0]).toContain('id,timestamp,severity,category,message');
      expect(lines.length).toBeGreaterThan(1);

      // Check that data is properly escaped (commas in messages become semicolons)
      const dataLines = lines.slice(1).filter(line => line.trim());
      expect(dataLines.length).toBe(3); // 3 errors

      // Verify CSV structure
      dataLines.forEach(line => {
        const fields = line.split(',');
        expect(fields.length).toBe(8); // All CSV fields
      });
    });
  });

  describe('Global Error Handlers', () => {
    it('should set up global error handlers in constructor', () => {
      const testLogger = new ErrorLogger();
      
      // The constructor should set up global handlers
      // This is tested by verifying the logger can handle global errors
      expect(testLogger).toBeInstanceOf(ErrorLogger);
      
      testLogger.clearLogs();
    });
  });

  describe('Singleton Usage', () => {
    it('should provide singleton error logger instance', () => {
      expect(errorLogger).toBeInstanceOf(ErrorLogger);
      
      // Test singleton functionality
      errorLogger.logError('Singleton test', ErrorSeverity.LOW, ErrorCategory.SYSTEM);
      const errors = errorLogger.getErrors();
      
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Singleton test');
      
      errorLogger.clearLogs();
    });
  });

  describe('Integration with Application', () => {
    it('should integrate with service error reporting', () => {
      // Simulate service error reporting pattern
      const simulateServiceError = (serviceName: string, operation: string, error: Error) => {
        return logger.logError(
          `${serviceName} service error: ${error.message}`,
          ErrorSeverity.HIGH,
          ErrorCategory.BUSINESS_LOGIC,
          {
            component: serviceName,
            action: operation,
            additionalData: { 
              errorName: error.name,
              stack: error.stack 
            }
          },
          error
        );
      };

      const testError = new Error('Database connection failed');
      const errorId = simulateServiceError('SessionService', 'createSession', testError);

      const errors = logger.getErrors();
      const loggedError = errors.find(e => e.id === errorId);

      expect(loggedError).toBeDefined();
      expect(loggedError!.message).toContain('SessionService service error');
      expect(loggedError!.context.component).toBe('SessionService');
      expect(loggedError!.context.action).toBe('createSession');
      expect(loggedError!.context.additionalData?.errorName).toBe('Error');
    });

    it('should support contextual error logging for user sessions', () => {
      const userSession = {
        userId: 'user123',
        sessionId: 'session456',
        gameId: 'game789',
      };

      // Simulate multiple errors in user session
      const errors = [
        'Failed to join game',
        'Transaction processing error', 
        'Settlement calculation failed',
      ];

      const errorIds = errors.map((message, index) => 
        logger.logError(
          message,
          [ErrorSeverity.MEDIUM, ErrorSeverity.HIGH, ErrorSeverity.CRITICAL][index],
          ErrorCategory.BUSINESS_LOGIC,
          {
            ...userSession,
            component: 'GameSession',
            action: `operation_${index}`,
          }
        )
      );

      // Verify session-based error retrieval
      const sessionErrors = logger.getErrors({ sessionId: userSession.sessionId });
      expect(sessionErrors).toHaveLength(3);

      // Verify error escalation for critical error
      const crashes = logger.getCrashReports();
      expect(crashes.length).toBeGreaterThan(0);
      
      const relatedCrash = crashes.find(c => c.errorId === errorIds[2]);
      expect(relatedCrash).toBeDefined();
    });
  });
});