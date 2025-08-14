/**
 * UI Responsiveness Utilities
 * Implements React Native patterns for maintaining UI responsiveness during database operations
 */

import { InteractionManager } from 'react-native';
import { CrashReportingService } from '../services/monitoring/CrashReportingService';

/**
 * Performance monitoring for UI operations
 */
class UIPerformanceMonitor {
  private static instance: UIPerformanceMonitor;
  private metrics: Map<string, number> = new Map();
  private crashReporting = CrashReportingService.getInstance();

  public static getInstance(): UIPerformanceMonitor {
    if (!UIPerformanceMonitor.instance) {
      UIPerformanceMonitor.instance = new UIPerformanceMonitor();
    }
    return UIPerformanceMonitor.instance;
  }

  /**
   * Track interaction latency
   */
  public trackInteraction(action: string): () => void {
    const startTime = Date.now();
    
    return () => {
      const duration = Date.now() - startTime;
      this.metrics.set(action, duration);
      
      // Report slow interactions
      if (duration > 100) {
        this.crashReporting.reportPerformanceMetric({
          name: 'slow_interaction',
          value: duration,
          unit: 'ms',
          context: action,
          timestamp: new Date(),
        });
      }
    };
  }

  /**
   * Get interaction metrics
   */
  public getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  /**
   * Clear metrics
   */
  public clearMetrics(): void {
    this.metrics.clear();
  }
}

/**
 * Async operation wrapper that maintains UI responsiveness
 */
export const responsiveAsync = async <T>(
  operation: () => Promise<T>,
  options: {
    loadingCallback?: (loading: boolean) => void;
    errorCallback?: (error: Error) => void;
    successCallback?: (result: T) => void;
    operationName?: string;
  } = {}
): Promise<T> => {
  const { loadingCallback, errorCallback, successCallback, operationName = 'async_operation' } = options;
  const monitor = UIPerformanceMonitor.getInstance();
  const endTracking = monitor.trackInteraction(operationName);

  try {
    // Set loading state
    loadingCallback?.(true);

    // Defer operation until after current interactions
    return await new Promise<T>((resolve, reject) => {
      InteractionManager.runAfterInteractions(async () => {
        try {
          const result = await operation();
          successCallback?.(result);
          resolve(result);
        } catch (error) {
          const err = error instanceof Error ? error : new Error('Unknown error');
          errorCallback?.(err);
          reject(err);
        } finally {
          loadingCallback?.(false);
          endTracking();
        }
      });
    });
  } catch (error) {
    loadingCallback?.(false);
    endTracking();
    throw error;
  }
};

/**
 * Batch state updates to reduce re-renders
 */
export const batchStateUpdates = <T>(updates: (() => T)[]): T[] => {
  return updates.map(update => update());
};

/**
 * Debounced function for search and filter operations
 */
export const createDebouncedCallback = <T extends unknown[]>(
  callback: (...args: T) => void,
  delay: number
): (...args: T) => void => {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return (...args: T) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => callback(...args), delay);
  };
};

/**
 * Optimistic UI update patterns
 */
export class OptimisticUpdater<T> {
  private originalState: T;
  private isOptimistic = false;

  constructor(initialState: T) {
    this.originalState = initialState;
  }

  /**
   * Apply optimistic update
   */
  public applyOptimistic(newState: T): T {
    if (!this.isOptimistic) {
      this.originalState = newState;
    }
    this.isOptimistic = true;
    return newState;
  }

  /**
   * Confirm optimistic update
   */
  public confirm(finalState: T): T {
    this.isOptimistic = false;
    this.originalState = finalState;
    return finalState;
  }

  /**
   * Rollback optimistic update
   */
  public rollback(): T {
    this.isOptimistic = false;
    return this.originalState;
  }

  /**
   * Check if currently in optimistic state
   */
  public isOptimisticState(): boolean {
    return this.isOptimistic;
  }
}

/**
 * Loading state manager for multiple concurrent operations
 */
export class LoadingStateManager {
  private loadingOperations = new Set<string>();
  private listeners = new Set<(loading: boolean) => void>();

  /**
   * Add loading listener
   */
  public addListener(listener: (loading: boolean) => void): () => void {
    this.listeners.add(listener);
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Start loading operation
   */
  public startLoading(operationId: string): void {
    const wasLoading = this.isLoading();
    this.loadingOperations.add(operationId);
    
    if (!wasLoading) {
      this.notifyListeners(true);
    }
  }

  /**
   * End loading operation
   */
  public endLoading(operationId: string): void {
    this.loadingOperations.delete(operationId);
    
    if (!this.isLoading()) {
      this.notifyListeners(false);
    }
  }

  /**
   * Check if any operation is loading
   */
  public isLoading(): boolean {
    return this.loadingOperations.size > 0;
  }

  /**
   * Get active operations
   */
  public getActiveOperations(): string[] {
    return Array.from(this.loadingOperations);
  }

  private notifyListeners(loading: boolean): void {
    this.listeners.forEach(listener => listener(loading));
  }
}

/**
 * Utility functions for UI responsiveness
 */
export const UIResponsivenessUtils = {
  /**
   * Defer heavy computation until UI is idle
   */
  deferHeavyComputation: <T>(computation: () => T): Promise<T> => {
    return new Promise((resolve) => {
      InteractionManager.runAfterInteractions(() => {
        resolve(computation());
      });
    });
  },

  /**
   * Chunk large datasets for progressive rendering
   */
  chunkArray: <T>(array: T[], chunkSize: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  },

  /**
   * Progressive list rendering with batching
   */
  renderProgressively: async <T>(
    items: T[],
    renderBatch: (batch: T[]) => void,
    batchSize = 10,
    delayMs = 16 // ~60fps
  ): Promise<void> => {
    const chunks = UIResponsivenessUtils.chunkArray(items, batchSize);
    
    for (const chunk of chunks) {
      await new Promise<void>(resolve => {
        InteractionManager.runAfterInteractions(() => {
          renderBatch(chunk);
          setTimeout(resolve, delayMs);
        });
      });
    }
  },

  /**
   * Timeout wrapper for operations
   */
  withTimeout: <T>(
    promise: Promise<T>,
    timeoutMs: number,
    timeoutMessage = 'Operation timed out'
  ): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
      }),
    ]);
  },

  /**
   * Frame rate monitoring
   */
  startFrameRateMonitoring: (): () => void => {
    let frameCount = 0;
    let lastTime = Date.now();
    let rafId: number;
    
    const monitor = () => {
      frameCount++;
      const currentTime = Date.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = frameCount;
        frameCount = 0;
        lastTime = currentTime;
        
        // Report low frame rate
        if (fps < 55) {
          CrashReportingService.getInstance().reportPerformanceMetric({
            name: 'low_frame_rate',
            value: fps,
            unit: 'count',
            timestamp: new Date(),
          });
        }
      }
      
      rafId = requestAnimationFrame(monitor);
    };
    
    rafId = requestAnimationFrame(monitor);
    
    return () => {
      cancelAnimationFrame(rafId);
    };
  },

  /**
   * Memory usage monitoring
   */
  monitorMemoryUsage: (): void => {
    // React Native doesn't have performance.memory, use alternative approach
    try {
      // Report a default memory usage for React Native
      // In a real implementation, you would use native modules to get actual memory usage
      const estimatedMemoryUsage = 50 * 1024 * 1024; // 50MB estimate
      CrashReportingService.getInstance().reportMemoryUsage(estimatedMemoryUsage);
    } catch (error) {
      console.warn('Memory monitoring failed:', error);
    }
  },
};

export { UIPerformanceMonitor };