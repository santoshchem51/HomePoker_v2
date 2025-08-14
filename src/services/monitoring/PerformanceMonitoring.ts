/**
 * Mock Performance Monitoring Service
 * Placeholder for performance monitoring functionality
 */

export class PerformanceMonitoring {
  static startTrace(name: string): PerformanceTrace {
    return new PerformanceTrace(name);
  }

  static recordMetric(name: string, value: number): void {
    console.log(`Metric: ${name} = ${value}`);
  }

  static setEnabled(_enabled: boolean): void {
    // Mock implementation
  }
}

export class PerformanceTrace {
  constructor(_name: string) {
    // Mock implementation - name parameter ignored
  }

  putAttribute(_key: string, _value: string): void {
    // Mock implementation
  }

  putMetric(_key: string, _value: number): void {
    // Mock implementation
  }

  start(): void {
    // Mock implementation
  }

  stop(): void {
    // Mock implementation
  }
}

export default PerformanceMonitoring;