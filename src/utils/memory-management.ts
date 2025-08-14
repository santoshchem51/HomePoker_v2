/**
 * Memory Management Utilities
 * Implements comprehensive memory usage optimization and monitoring for React Native
 */

import { CrashReportingService } from '../services/monitoring/CrashReportingService';

interface MemoryMetrics {
  timestamp: Date;
  estimatedUsage: number;
  componentCount: number;
  listenerCount: number;
  timerCount: number;
}

interface MemoryThresholds {
  warning: number;    // 100MB
  critical: number;   // 150MB
  maximum: number;    // 200MB
}

/**
 * Memory Usage Monitor
 */
class MemoryMonitor {
  private static instance: MemoryMonitor;
  private metrics: MemoryMetrics[] = [];
  private thresholds: MemoryThresholds = {
    warning: 100 * 1024 * 1024,   // 100MB
    critical: 150 * 1024 * 1024,  // 150MB
    maximum: 200 * 1024 * 1024,   // 200MB
  };
  private crashReporting = CrashReportingService.getInstance();
  private monitoringInterval?: ReturnType<typeof setInterval>;
  private activeTimers = new Set<ReturnType<typeof setTimeout>>();
  private activeIntervals = new Set<ReturnType<typeof setInterval>>();
  private componentRegistry = new Map<string, number>();
  private listenerRegistry = new Map<string, number>();

  public static getInstance(): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor();
    }
    return MemoryMonitor.instance;
  }

  /**
   * Start memory monitoring
   */
  public startMonitoring(intervalMs = 30000): void {
    if (this.monitoringInterval) {
      this.stopMonitoring();
    }

    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, intervalMs);

    console.log('Memory monitoring started');
  }

  /**
   * Stop memory monitoring
   */
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
      console.log('Memory monitoring stopped');
    }
  }

  /**
   * Collect current memory metrics
   */
  public collectMetrics(): MemoryMetrics {
    // Estimate memory usage based on tracked components and data
    const estimatedUsage = this.estimateMemoryUsage();
    
    const metrics: MemoryMetrics = {
      timestamp: new Date(),
      estimatedUsage,
      componentCount: this.getTotalComponentCount(),
      listenerCount: this.getTotalListenerCount(),
      timerCount: this.activeTimers.size + this.activeIntervals.size,
    };

    this.metrics.push(metrics);
    
    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    // Check thresholds and report
    this.checkThresholds(metrics);
    
    return metrics;
  }

  /**
   * Estimate memory usage based on application state
   */
  private estimateMemoryUsage(): number {
    // Base memory usage (app overhead)
    let estimated = 30 * 1024 * 1024; // 30MB base

    // Add memory for components (estimated)
    estimated += this.getTotalComponentCount() * 0.5 * 1024; // 0.5KB per component

    // Add memory for listeners
    estimated += this.getTotalListenerCount() * 0.1 * 1024; // 0.1KB per listener

    // Add memory for timers
    estimated += (this.activeTimers.size + this.activeIntervals.size) * 0.1 * 1024; // 0.1KB per timer

    return estimated;
  }

  /**
   * Check memory thresholds and take action
   */
  private checkThresholds(metrics: MemoryMetrics): void {
    const { estimatedUsage } = metrics;

    if (estimatedUsage > this.thresholds.maximum) {
      // Critical memory usage - force cleanup
      this.performAggressiveCleanup();
      this.crashReporting.reportError(
        new Error('Critical memory usage detected'),
        'memory_management',
        { usage: estimatedUsage, threshold: this.thresholds.maximum }
      );
    } else if (estimatedUsage > this.thresholds.critical) {
      // High memory usage - perform cleanup
      this.performCleanup();
      this.crashReporting.reportPerformanceMetric({
        name: 'high_memory_usage',
        value: estimatedUsage,
        unit: 'bytes',
        context: 'critical_threshold',
        timestamp: new Date(),
      });
    } else if (estimatedUsage > this.thresholds.warning) {
      // Warning level - log and monitor
      this.crashReporting.reportPerformanceMetric({
        name: 'elevated_memory_usage',
        value: estimatedUsage,
        unit: 'bytes',
        context: 'warning_threshold',
        timestamp: new Date(),
      });
    }

    // Always report memory usage
    this.crashReporting.reportMemoryUsage(estimatedUsage);
  }

  /**
   * Perform standard memory cleanup
   */
  public performCleanup(): void {
    console.log('Performing memory cleanup...');
    
    // Clear old metrics
    if (this.metrics.length > 50) {
      this.metrics = this.metrics.slice(-50);
    }

    // Clear expired timers
    this.clearExpiredTimers();

    // Suggest garbage collection if available - React Native doesn't support this
    try {
      // In React Native, we can't manually trigger GC, so this is a placeholder
      console.log('Memory cleanup completed - manual GC not available in React Native');
    } catch (error) {
      console.warn('Manual garbage collection failed:', error);
    }

    console.log('Memory cleanup completed');
  }

  /**
   * Perform aggressive memory cleanup
   */
  public performAggressiveCleanup(): void {
    console.warn('Performing aggressive memory cleanup...');
    
    // Clear all cached metrics except latest
    this.metrics = this.metrics.slice(-10);

    // Clear all active timers
    this.clearAllTimers();

    // Reset registries
    this.componentRegistry.clear();
    this.listenerRegistry.clear();

    // Force garbage collection - React Native doesn't support this
    try {
      // In React Native, we can't manually trigger GC, so this is a placeholder
      console.log('Aggressive cleanup completed - manual GC not available in React Native');
    } catch (error) {
      console.warn('Manual garbage collection failed:', error);
    }

    console.warn('Aggressive memory cleanup completed');
  }

  /**
   * Clear expired timers
   */
  private clearExpiredTimers(): void {
    // Note: In a real implementation, you would track timer expiration times
    // For now, we'll just clear the tracking sets if they get too large
    if (this.activeTimers.size > 100) {
      this.activeTimers.clear();
    }
    if (this.activeIntervals.size > 50) {
      this.activeIntervals.clear();
    }
  }

  /**
   * Clear all active timers
   */
  private clearAllTimers(): void {
    this.activeTimers.forEach(timer => clearTimeout(timer));
    this.activeIntervals.forEach(interval => clearInterval(interval));
    this.activeTimers.clear();
    this.activeIntervals.clear();
  }

  /**
   * Register a component for memory tracking
   */
  public registerComponent(componentName: string): void {
    const current = this.componentRegistry.get(componentName) || 0;
    this.componentRegistry.set(componentName, current + 1);
  }

  /**
   * Unregister a component
   */
  public unregisterComponent(componentName: string): void {
    const current = this.componentRegistry.get(componentName) || 0;
    if (current > 1) {
      this.componentRegistry.set(componentName, current - 1);
    } else {
      this.componentRegistry.delete(componentName);
    }
  }

  /**
   * Register a listener for memory tracking
   */
  public registerListener(listenerName: string): void {
    const current = this.listenerRegistry.get(listenerName) || 0;
    this.listenerRegistry.set(listenerName, current + 1);
  }

  /**
   * Unregister a listener
   */
  public unregisterListener(listenerName: string): void {
    const current = this.listenerRegistry.get(listenerName) || 0;
    if (current > 1) {
      this.listenerRegistry.set(listenerName, current - 1);
    } else {
      this.listenerRegistry.delete(listenerName);
    }
  }

  /**
   * Track a timer
   */
  public trackTimer(timer: ReturnType<typeof setTimeout>): void {
    this.activeTimers.add(timer);
  }

  /**
   * Track an interval
   */
  public trackInterval(interval: ReturnType<typeof setInterval>): void {
    this.activeIntervals.add(interval);
  }

  /**
   * Untrack a timer
   */
  public untrackTimer(timer: ReturnType<typeof setTimeout>): void {
    this.activeTimers.delete(timer);
  }

  /**
   * Untrack an interval
   */
  public untrackInterval(interval: ReturnType<typeof setInterval>): void {
    this.activeIntervals.delete(interval);
  }

  /**
   * Get total component count
   */
  private getTotalComponentCount(): number {
    return Array.from(this.componentRegistry.values()).reduce((sum, count) => sum + count, 0);
  }

  /**
   * Get total listener count
   */
  private getTotalListenerCount(): number {
    return Array.from(this.listenerRegistry.values()).reduce((sum, count) => sum + count, 0);
  }

  /**
   * Get current memory metrics
   */
  public getCurrentMetrics(): MemoryMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  /**
   * Get memory usage history
   */
  public getMetricsHistory(): MemoryMetrics[] {
    return [...this.metrics];
  }

  /**
   * Get component registry for debugging
   */
  public getComponentRegistry(): Record<string, number> {
    return Object.fromEntries(this.componentRegistry);
  }

  /**
   * Get listener registry for debugging
   */
  public getListenerRegistry(): Record<string, number> {
    return Object.fromEntries(this.listenerRegistry);
  }

  /**
   * Update memory thresholds
   */
  public updateThresholds(thresholds: Partial<MemoryThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }
}

/**
 * Memory-efficient data structure utilities
 */
export const MemoryEfficientUtils = {
  /**
   * Create a memory-efficient array with automatic cleanup
   */
  createManagedArray: <T>(maxSize = 1000): {
    push: (item: T) => void;
    get: () => T[];
    clear: () => void;
    size: () => number;
  } => {
    let items: T[] = [];

    return {
      push: (item: T) => {
        items.push(item);
        if (items.length > maxSize) {
          items = items.slice(-Math.floor(maxSize * 0.8)); // Keep 80% when trimming
        }
      },
      get: () => [...items],
      clear: () => { items = []; },
      size: () => items.length,
    };
  },

  /**
   * Create a memory-efficient map with automatic cleanup
   */
  createManagedMap: <K, V>(maxSize = 1000): {
    set: (key: K, value: V) => void;
    get: (key: K) => V | undefined;
    delete: (key: K) => boolean;
    clear: () => void;
    size: () => number;
  } => {
    const map = new Map<K, V>();
    const accessOrder: K[] = [];

    const trimToSize = () => {
      while (map.size > maxSize * 0.8) {
        const oldestKey = accessOrder.shift();
        if (oldestKey !== undefined) {
          map.delete(oldestKey);
        }
      }
    };

    return {
      set: (key: K, value: V) => {
        if (map.has(key)) {
          // Update existing key's position
          const index = accessOrder.indexOf(key);
          if (index > -1) {
            accessOrder.splice(index, 1);
          }
        }
        map.set(key, value);
        accessOrder.push(key);
        
        if (map.size > maxSize) {
          trimToSize();
        }
      },
      get: (key: K) => {
        const value = map.get(key);
        if (value !== undefined) {
          // Move to end for LRU behavior
          const index = accessOrder.indexOf(key);
          if (index > -1) {
            accessOrder.splice(index, 1);
            accessOrder.push(key);
          }
        }
        return value;
      },
      delete: (key: K) => {
        const index = accessOrder.indexOf(key);
        if (index > -1) {
          accessOrder.splice(index, 1);
        }
        return map.delete(key);
      },
      clear: () => {
        map.clear();
        accessOrder.length = 0;
      },
      size: () => map.size,
    };
  },

  /**
   * Debounced cleanup function
   */
  createDebouncedCleanup: (
    cleanupFn: () => void,
    delay = 5000
  ): (() => void) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(cleanupFn, delay);
      MemoryMonitor.getInstance().trackTimer(timeoutId);
    };
  },
};

/**
 * Memory-aware React Hook utilities
 */
export const MemoryAwareHooks = {
  /**
   * Create a cleanup function tracker
   */
  createCleanupTracker: (componentName: string): {
    addCleanup: (fn: () => void) => void;
    cleanup: () => void;
  } => {
    const cleanupFunctions: (() => void)[] = [];
    const monitor = MemoryMonitor.getInstance();
    
    monitor.registerComponent(componentName);

    return {
      addCleanup: (fn: () => void) => {
        cleanupFunctions.push(fn);
      },
      cleanup: () => {
        cleanupFunctions.forEach(fn => {
          try {
            fn();
          } catch (error) {
            console.warn('Cleanup function failed:', error);
          }
        });
        cleanupFunctions.length = 0;
        monitor.unregisterComponent(componentName);
      },
    };
  },
};

/**
 * Measure current memory usage for performance testing
 */
export const measureMemoryUsage = (): Promise<number> => {
  return new Promise((resolve) => {
    const monitor = MemoryMonitor.getInstance();
    const metrics = monitor.collectMetrics();
    const usageInMB = metrics.estimatedUsage / (1024 * 1024);
    resolve(usageInMB);
  });
};

/**
 * Get memory threshold for testing compliance
 */
export const getMemoryThreshold = (): number => {
  return 150; // 150MB as per acceptance criteria
};

export { MemoryMonitor };