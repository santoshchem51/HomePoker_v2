/**
 * Mock Crash Reporting Service
 * Placeholder for crash reporting functionality
 */

export class CrashReporting {
  static captureException(error: Error, context?: any): void {
    console.error('Crash captured:', error, context);
  }

  static captureMessage(message: string, level?: 'info' | 'warning' | 'error'): void {
    console.log(`[${level || 'info'}] ${message}`);
  }

  static setUserContext(_context: any): void {
    // Mock implementation
  }

  static clearUserContext(): void {
    // Mock implementation
  }
}

export default CrashReporting;