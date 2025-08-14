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

  static setEnabled(enabled: boolean): void {
    // Mock implementation
  }
}

export class PerformanceTrace {
  constructor(private name: string) {}

  putAttribute(key: string, value: string): void {
    // Mock implementation
  }

  putMetric(key: string, value: number): void {
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