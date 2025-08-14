/**
 * Performance Monitoring Service
 * Implements Story 5.2 AC: 1-6 - Comprehensive app performance monitoring system
 * Enhanced with React Native performance monitoring, timing APIs, and real-time metrics
 */
// Performance monitoring implementation for React Native

export interface PerformanceMetrics {
  appStartupTime: number;
  memoryUsage: number;
  frameRate: number;
  uiResponseTime: number;
  databaseOperationTime: number;
  componentRenderTime: number;
  bundleLoadTime: number;
  timestamp: Date;
}

export interface PerformanceAlert {
  id: string;
  type: 'startup' | 'memory' | 'frameRate' | 'uiResponse' | 'database' | 'bundle';
  severity: 'warning' | 'error' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
}

export interface PerformanceThresholds {
  appStartupTime: number;      // 3 seconds
  memoryUsage: number;         // 150MB
  minFrameRate: number;        // 30fps
  maxUIResponseTime: number;   // 100ms
  maxDatabaseTime: number;     // 100ms
  maxRenderTime: number;       // 16ms (60fps)
  maxBundleLoadTime: number;   // 2 seconds
}

/**
 * Performance Monitor Service
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor | null = null;
  private metrics: PerformanceMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private isMonitoring: boolean = false;
  private monitoringInterval: ReturnType<typeof setInterval> | null = null;
  private alertCallbacks: ((alert: PerformanceAlert) => void)[] = [];
  private startupStartTime: number = Date.now();
  private frameCount: number = 0;
  private lastFrameTime: number = 0;

  // Performance thresholds
  private thresholds: PerformanceThresholds = {
    appStartupTime: 3000,      // 3 seconds
    memoryUsage: 150 * 1024 * 1024, // 150MB
    minFrameRate: 30,          // 30fps
    maxUIResponseTime: 100,    // 100ms
    maxDatabaseTime: 100,      // 100ms  
    maxRenderTime: 16,         // 16ms (60fps)
    maxBundleLoadTime: 2000,   // 2 seconds
  };

  private constructor() {
    this.initializeMonitoring();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Initialize performance monitoring
   */
  private initializeMonitoring(): void {
    if (__DEV__) {
      console.log('[Performance Monitor] Initializing...');
    }

    // Record app startup
    this.recordAppStartupTime();
    
    // Start continuous monitoring
    this.startMonitoring();
  }

  /**
   * Start performance monitoring
   */
  public startMonitoring(): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    this.lastFrameTime = Date.now();

    // Monitor performance every 5 seconds
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, 5000);

    if (__DEV__) {
      console.log('[Performance Monitor] Started monitoring');
    }
  }

  /**
   * Stop performance monitoring
   */
  public stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    if (__DEV__) {
      console.log('[Performance Monitor] Stopped monitoring');
    }
  }

  /**
   * Subscribe to performance alerts
   */
  public onAlert(callback: (alert: PerformanceAlert) => void): () => void {
    this.alertCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.alertCallbacks.indexOf(callback);
      if (index > -1) {
        this.alertCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Record app startup time
   */
  public recordAppStartupTime(): void {
    const startupTime = Date.now() - this.startupStartTime;
    
    if (__DEV__) {
      console.log(`[Performance Monitor] App startup time: ${startupTime}ms`);
    }

    if (startupTime > this.thresholds.appStartupTime) {
      this.addAlert({
        type: 'startup',
        severity: 'warning',
        message: `App startup time (${startupTime}ms) exceeds threshold (${this.thresholds.appStartupTime}ms)`,
        value: startupTime,
        threshold: this.thresholds.appStartupTime,
      });
    }
  }

  /**
   * Record UI response time
   */
  public recordUIResponseTime(operationName: string, startTime: number): void {
    const responseTime = Date.now() - startTime;
    
    if (__DEV__) {
      console.log(`[Performance Monitor] UI Response (${operationName}): ${responseTime}ms`);
    }

    if (responseTime > this.thresholds.maxUIResponseTime) {
      this.addAlert({
        type: 'uiResponse',
        severity: responseTime > this.thresholds.maxUIResponseTime * 2 ? 'error' : 'warning',
        message: `UI response time for ${operationName} (${responseTime}ms) exceeds threshold (${this.thresholds.maxUIResponseTime}ms)`,
        value: responseTime,
        threshold: this.thresholds.maxUIResponseTime,
      });
    }
  }

  /**
   * Record database operation time
   */
  public recordDatabaseOperationTime(operationName: string, startTime: number): void {
    const operationTime = Date.now() - startTime;
    
    if (__DEV__) {
      console.log(`[Performance Monitor] Database Operation (${operationName}): ${operationTime}ms`);
    }

    if (operationTime > this.thresholds.maxDatabaseTime) {
      this.addAlert({
        type: 'database',
        severity: operationTime > this.thresholds.maxDatabaseTime * 2 ? 'error' : 'warning',
        message: `Database operation ${operationName} (${operationTime}ms) exceeds threshold (${this.thresholds.maxDatabaseTime}ms)`,
        value: operationTime,
        threshold: this.thresholds.maxDatabaseTime,
      });
    }
  }

  /**
   * Record component render time
   */
  public recordComponentRenderTime(componentName: string, startTime: number): void {
    const renderTime = Date.now() - startTime;
    
    if (__DEV__) {
      console.log(`[Performance Monitor] Component Render (${componentName}): ${renderTime}ms`);
    }

    if (renderTime > this.thresholds.maxRenderTime) {
      this.addAlert({
        type: 'frameRate',
        severity: 'warning',
        message: `Component render time for ${componentName} (${renderTime}ms) exceeds 60fps threshold (${this.thresholds.maxRenderTime}ms)`,
        value: renderTime,
        threshold: this.thresholds.maxRenderTime,
      });
    }
  }

  /**
   * Record bundle load time
   */
  public recordBundleLoadTime(bundleName: string, startTime: number): void {
    const loadTime = Date.now() - startTime;
    
    if (__DEV__) {
      console.log(`[Performance Monitor] Bundle Load (${bundleName}): ${loadTime}ms`);
    }

    if (loadTime > this.thresholds.maxBundleLoadTime) {
      this.addAlert({
        type: 'bundle',
        severity: 'warning',
        message: `Bundle load time for ${bundleName} (${loadTime}ms) exceeds threshold (${this.thresholds.maxBundleLoadTime}ms)`,
        value: loadTime,
        threshold: this.thresholds.maxBundleLoadTime,
      });
    }
  }

  /**
   * Record frame for FPS calculation
   */
  public recordFrame(): void {
    this.frameCount++;
    const now = Date.now();
    
    // Calculate FPS every second
    if (now - this.lastFrameTime >= 1000) {
      const fps = this.frameCount / ((now - this.lastFrameTime) / 1000);
      
      if (fps < this.thresholds.minFrameRate) {
        this.addAlert({
          type: 'frameRate',
          severity: fps < this.thresholds.minFrameRate * 0.5 ? 'error' : 'warning',
          message: `Frame rate (${fps.toFixed(1)}fps) below threshold (${this.thresholds.minFrameRate}fps)`,
          value: fps,
          threshold: this.thresholds.minFrameRate,
        });
      }
      
      this.frameCount = 0;
      this.lastFrameTime = now;
    }
  }

  /**
   * Get current performance metrics
   */
  public getCurrentMetrics(): PerformanceMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  /**
   * Get performance metrics history
   */
  public getMetricsHistory(limit: number = 50): PerformanceMetrics[] {
    return this.metrics.slice(-limit);
  }

  /**
   * Get recent alerts
   */
  public getRecentAlerts(limit: number = 20): PerformanceAlert[] {
    return this.alerts
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get performance summary
   */
  public getPerformanceSummary(): {
    isHealthy: boolean;
    criticalIssues: number;
    warnings: number;
    averageStartupTime: number;
    averageMemoryUsage: number;
    averageFrameRate: number;
    recommendations: string[];
  } {
    const recentMetrics = this.getMetricsHistory(10);
    const recentAlerts = this.getRecentAlerts(50);
    
    const criticalIssues = recentAlerts.filter(a => a.severity === 'critical').length;
    const warnings = recentAlerts.filter(a => a.severity === 'warning').length;
    
    const averageStartupTime = recentMetrics.length > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.appStartupTime, 0) / recentMetrics.length 
      : 0;
    
    const averageMemoryUsage = recentMetrics.length > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.memoryUsage, 0) / recentMetrics.length 
      : 0;
    
    const averageFrameRate = recentMetrics.length > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.frameRate, 0) / recentMetrics.length 
      : 0;

    const recommendations: string[] = [];
    
    if (averageStartupTime > this.thresholds.appStartupTime) {
      recommendations.push('Consider lazy loading components to improve startup time');
    }
    
    if (averageMemoryUsage > this.thresholds.memoryUsage * 0.8) {
      recommendations.push('Memory usage is approaching limit - review component lifecycle');
    }
    
    if (averageFrameRate < this.thresholds.minFrameRate) {
      recommendations.push('Frame rate is below optimal - optimize render performance');
    }

    return {
      isHealthy: criticalIssues === 0 && warnings < 5,
      criticalIssues,
      warnings,
      averageStartupTime,
      averageMemoryUsage,
      averageFrameRate,
      recommendations,
    };
  }

  /**
   * Collect current performance metrics
   */
  private collectMetrics(): void {
    const metrics: PerformanceMetrics = {
      appStartupTime: Date.now() - this.startupStartTime,
      memoryUsage: this.estimateMemoryUsage(),
      frameRate: this.calculateCurrentFrameRate(),
      uiResponseTime: 0, // Will be updated by individual operations
      databaseOperationTime: 0, // Will be updated by individual operations
      componentRenderTime: 0, // Will be updated by individual operations
      bundleLoadTime: 0, // Will be updated by individual operations
      timestamp: new Date(),
    };

    this.metrics.push(metrics);
    
    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    // Check thresholds
    this.checkThresholds(metrics);
  }

  /**
   * Estimate current memory usage
   */
  private estimateMemoryUsage(): number {
    // React Native doesn't have direct memory API
    // This is an estimation based on app complexity
    const baseMemory = 50 * 1024 * 1024; // 50MB base
    const metricsMemory = this.metrics.length * 1024; // 1KB per metric
    const alertsMemory = this.alerts.length * 512; // 512 bytes per alert
    
    return baseMemory + metricsMemory + alertsMemory;
  }

  /**
   * Calculate current frame rate
   */
  private calculateCurrentFrameRate(): number {
    const now = Date.now();
    const elapsed = now - this.lastFrameTime;
    
    if (elapsed === 0 || this.frameCount === 0) {
      return 60; // Default assumption
    }
    
    return (this.frameCount / elapsed) * 1000;
  }

  /**
   * Check performance thresholds
   */
  private checkThresholds(metrics: PerformanceMetrics): void {
    // Memory usage check
    if (metrics.memoryUsage > this.thresholds.memoryUsage) {
      this.addAlert({
        type: 'memory',
        severity: 'error',
        message: `Memory usage (${(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB) exceeds threshold (${(this.thresholds.memoryUsage / 1024 / 1024).toFixed(1)}MB)`,
        value: metrics.memoryUsage,
        threshold: this.thresholds.memoryUsage,
      });
    } else if (metrics.memoryUsage > this.thresholds.memoryUsage * 0.8) {
      this.addAlert({
        type: 'memory',
        severity: 'warning',
        message: `Memory usage (${(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB) approaching threshold (${(this.thresholds.memoryUsage / 1024 / 1024).toFixed(1)}MB)`,
        value: metrics.memoryUsage,
        threshold: this.thresholds.memoryUsage,
      });
    }
  }

  /**
   * Add performance alert
   */
  private addAlert(alert: Omit<PerformanceAlert, 'id' | 'timestamp'>): void {
    const fullAlert: PerformanceAlert = {
      ...alert,
      id: `perf_alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    this.alerts.push(fullAlert);
    
    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    // Notify subscribers
    this.alertCallbacks.forEach(callback => {
      try {
        callback(fullAlert);
      } catch (error) {
        console.warn('[Performance Monitor] Alert callback failed:', error);
      }
    });

    if (__DEV__) {
      console.log(`[Performance Monitor] ${fullAlert.severity.toUpperCase()}: ${fullAlert.message}`);
    }
  }

  /**
   * Update performance thresholds
   */
  public updateThresholds(newThresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    
    if (__DEV__) {
      console.log('[Performance Monitor] Thresholds updated:', newThresholds);
    }
  }
}

/**
 * Performance monitoring hook for React components
 */
export function usePerformanceMonitoring(): {
  metrics: PerformanceMetrics | null;
  alerts: PerformanceAlert[];
  summary: ReturnType<PerformanceMonitor['getPerformanceSummary']>;
  recordUIResponse: (operationName: string, startTime: number) => void;
  recordComponentRender: (componentName: string, startTime: number) => void;
} {
  const [metrics, setMetrics] = React.useState<PerformanceMetrics | null>(null);
  const [alerts, setAlerts] = React.useState<PerformanceAlert[]>([]);
  const [summary, setSummary] = React.useState<ReturnType<PerformanceMonitor['getPerformanceSummary']>>(
    PerformanceMonitor.getInstance().getPerformanceSummary()
  );

  const monitor = React.useMemo(() => PerformanceMonitor.getInstance(), []);

  React.useEffect(() => {
    // Subscribe to alerts
    const unsubscribe = monitor.onAlert((alert) => {
      setAlerts(prev => [alert, ...prev.slice(0, 19)]);
    });

    // Update metrics and summary periodically
    const interval = setInterval(() => {
      setMetrics(monitor.getCurrentMetrics());
      setSummary(monitor.getPerformanceSummary());
    }, 5000);

    // Initial state
    setMetrics(monitor.getCurrentMetrics());
    setAlerts(monitor.getRecentAlerts(20));

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [monitor]);

  const recordUIResponse = React.useCallback((operationName: string, startTime: number) => {
    monitor.recordUIResponseTime(operationName, startTime);
  }, [monitor]);

  const recordComponentRender = React.useCallback((componentName: string, startTime: number) => {
    monitor.recordComponentRenderTime(componentName, startTime);
  }, [monitor]);

  return {
    metrics,
    alerts,
    summary,
    recordUIResponse,
    recordComponentRender,
  };
}

// React import for hook
import React from 'react';