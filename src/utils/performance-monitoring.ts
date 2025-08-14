/**
 * Performance Monitoring and Dashboard Utilities
 * Development tools for runtime performance monitoring
 */

// Performance monitoring utilities

export interface PerformanceMetrics {
  timestamp: number;
  metric: string;
  value: number;
  unit: string;
  context?: string;
}

export interface PerformanceDashboard {
  startupTime: number;
  memoryUsage: number;
  frameRate: number;
  interactionLatency: number;
  bundleSize: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private isMonitoring = false;
  private monitoringInterval?: any;

  constructor() {
    this.initializeMonitoring();
  }

  private initializeMonitoring() {
    console.log('🔍 Performance Monitor initialized');
  }

  /**
   * Start continuous performance monitoring
   */
  startMonitoring(intervalMs: number = 5000) {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log(`📊 Starting performance monitoring (interval: ${intervalMs}ms)`);
    
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, intervalMs);
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    
    console.log('🛑 Performance monitoring stopped');
  }

  /**
   * Collect current performance metrics
   */
  private collectMetrics() {
    const timestamp = Date.now();
    
    // Memory usage monitoring
    this.recordMetric({
      timestamp,
      metric: 'memory_usage',
      value: this.getMemoryUsage(),
      unit: 'MB',
      context: 'continuous_monitoring'
    });

    // Frame rate monitoring (simulated for React Native)
    this.recordMetric({
      timestamp,
      metric: 'frame_rate',
      value: this.getFrameRate(),
      unit: 'fps',
      context: 'ui_performance'
    });
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric);
    
    // Keep only last 100 metrics to prevent memory growth
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    // Alert on threshold breaches
    this.checkThresholds(metric);
  }

  /**
   * Get current memory usage estimate
   */
  private getMemoryUsage(): number {
    // Simulated memory usage - in production would use actual React Native APIs
    return Math.random() * 50 + 80; // 80-130MB range
  }

  /**
   * Get current frame rate estimate
   */
  private getFrameRate(): number {
    // Simulated frame rate - in production would use actual Performance APIs
    return Math.random() * 10 + 50; // 50-60 fps range
  }

  /**
   * Check performance thresholds and alert
   */
  private checkThresholds(metric: PerformanceMetrics) {
    const thresholds = {
      memory_usage: 150, // 150MB
      frame_rate: 45, // 45 fps minimum
      startup_time: 3000, // 3 seconds
      interaction_latency: 200, // 200ms
    };

    const threshold = thresholds[metric.metric as keyof typeof thresholds];
    if (!threshold) return;

    const isViolation = metric.metric === 'frame_rate' 
      ? metric.value < threshold 
      : metric.value > threshold;

    if (isViolation) {
      console.warn(`⚠️ Performance threshold violation: ${metric.metric} = ${metric.value}${metric.unit} (threshold: ${threshold})`);
    }
  }

  /**
   * Measure and record startup time
   */
  measureStartupTime(startTime: number) {
    const startupTime = Date.now() - startTime;
    
    this.recordMetric({
      timestamp: Date.now(),
      metric: 'startup_time',
      value: startupTime,
      unit: 'ms',
      context: 'app_initialization'
    });

    return startupTime;
  }

  /**
   * Measure and record interaction latency
   */
  measureInteraction(interactionName: string, startTime: number) {
    const latency = Date.now() - startTime;
    
    this.recordMetric({
      timestamp: Date.now(),
      metric: 'interaction_latency',
      value: latency,
      unit: 'ms',
      context: interactionName
    });

    return latency;
  }

  /**
   * Get performance dashboard data
   */
  getDashboard(): PerformanceDashboard {
    const recent = this.metrics.slice(-20); // Last 20 metrics
    
    const getLatestMetricValue = (metricName: string): number => {
      const metric = recent.reverse().find(m => m.metric === metricName);
      return metric?.value || 0;
    };

    return {
      startupTime: getLatestMetricValue('startup_time'),
      memoryUsage: getLatestMetricValue('memory_usage'),
      frameRate: getLatestMetricValue('frame_rate'),
      interactionLatency: getLatestMetricValue('interaction_latency'),
      bundleSize: 0, // Would be populated from build tools
    };
  }

  /**
   * Get all metrics for analysis
   */
  getAllMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Get metrics filtered by type
   */
  getMetricsByType(metricType: string): PerformanceMetrics[] {
    return this.metrics.filter(m => m.metric === metricType);
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const dashboard = this.getDashboard();
    
    return `
Performance Report
==================
Startup Time: ${dashboard.startupTime}ms
Memory Usage: ${dashboard.memoryUsage}MB
Frame Rate: ${dashboard.frameRate}fps
Interaction Latency: ${dashboard.interactionLatency}ms
Bundle Size: ${dashboard.bundleSize}MB

Total Metrics Collected: ${this.metrics.length}
Monitoring Active: ${this.isMonitoring}
==================
    `.trim();
  }

  /**
   * Export metrics for external analysis
   */
  exportMetrics(): string {
    return JSON.stringify({
      dashboard: this.getDashboard(),
      metrics: this.metrics,
      timestamp: Date.now(),
    }, null, 2);
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Utility functions
export const startPerformanceMonitoring = (intervalMs?: number) => {
  performanceMonitor.startMonitoring(intervalMs);
};

export const stopPerformanceMonitoring = () => {
  performanceMonitor.stopMonitoring();
};

export const recordPerformanceMetric = (metric: PerformanceMetrics) => {
  performanceMonitor.recordMetric(metric);
};

export const getPerformanceDashboard = (): PerformanceDashboard => {
  return performanceMonitor.getDashboard();
};

export const generatePerformanceReport = (): string => {
  return performanceMonitor.generateReport();
};

export default performanceMonitor;