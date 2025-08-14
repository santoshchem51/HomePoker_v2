/**
 * Memory Management Hook
 * Provides React hook for component-level memory management and cleanup
 */

import { useEffect, useRef, useCallback } from 'react';
import { MemoryMonitor, MemoryAwareHooks } from '../utils/memory-management';

interface UseMemoryManagementOptions {
  componentName: string;
  enableAutoCleanup?: boolean;
  cleanupDelay?: number;
}

/**
 * Hook for component-level memory management
 */
export const useMemoryManagement = (options: UseMemoryManagementOptions) => {
  const { componentName, enableAutoCleanup = true, cleanupDelay = 5000 } = options;
  const cleanupTracker = useRef<ReturnType<typeof MemoryAwareHooks.createCleanupTracker> | null>(null);
  const monitor = MemoryMonitor.getInstance();
  const cleanupTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Initialize cleanup tracker
  if (!cleanupTracker.current) {
    cleanupTracker.current = MemoryAwareHooks.createCleanupTracker(componentName);
  }

  /**
   * Add a cleanup function to be called on unmount
   */
  const addCleanup = useCallback((cleanupFn: () => void) => {
    cleanupTracker.current?.addCleanup(cleanupFn);
  }, []);

  /**
   * Register a timer for memory tracking
   */
  const trackTimer = useCallback((timer: ReturnType<typeof setTimeout>) => {
    monitor.trackTimer(timer);
    addCleanup(() => {
      clearTimeout(timer);
      monitor.untrackTimer(timer);
    });
    return timer;
  }, [addCleanup, monitor]);

  /**
   * Register an interval for memory tracking
   */
  const trackInterval = useCallback((interval: ReturnType<typeof setInterval>) => {
    monitor.trackInterval(interval);
    addCleanup(() => {
      clearInterval(interval);
      monitor.untrackInterval(interval);
    });
    return interval;
  }, [addCleanup, monitor]);

  /**
   * Register a listener for memory tracking
   */
  const trackListener = useCallback((listenerName: string, cleanup: () => void) => {
    monitor.registerListener(listenerName);
    addCleanup(() => {
      cleanup();
      monitor.unregisterListener(listenerName);
    });
  }, [addCleanup, monitor]);

  /**
   * Force cleanup
   */
  const forceCleanup = useCallback(() => {
    cleanupTracker.current?.cleanup();
  }, []);

  /**
   * Get current memory metrics
   */
  const getMemoryMetrics = useCallback(() => {
    return monitor.getCurrentMetrics();
  }, [monitor]);

  /**
   * Schedule automatic cleanup
   */
  const scheduleCleanup = useCallback(() => {
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
    }
    
    if (enableAutoCleanup) {
      cleanupTimeoutRef.current = setTimeout(() => {
        monitor.performCleanup();
      }, cleanupDelay);
      
      trackTimer(cleanupTimeoutRef.current);
    }
  }, [enableAutoCleanup, cleanupDelay, trackTimer]);

  // Setup component lifecycle management
  useEffect(() => {
    // Schedule initial cleanup
    scheduleCleanup();

    // Cleanup on unmount
    return () => {
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }
      cleanupTracker.current?.cleanup();
    };
  }, [scheduleCleanup]);

  return {
    addCleanup,
    trackTimer,
    trackInterval,
    trackListener,
    forceCleanup,
    getMemoryMetrics,
    scheduleCleanup,
  };
};

/**
 * Hook for memory monitoring
 */
export const useMemoryMonitoring = (enabled = true) => {
  const monitor = MemoryMonitor.getInstance();

  useEffect(() => {
    if (enabled) {
      monitor.startMonitoring();
      
      return () => {
        monitor.stopMonitoring();
      };
    }
    return undefined;
  }, [enabled, monitor]);

  const getCurrentMetrics = useCallback(() => {
    return monitor.getCurrentMetrics();
  }, [monitor]);

  const getMetricsHistory = useCallback(() => {
    return monitor.getMetricsHistory();
  }, [monitor]);

  const performCleanup = useCallback(() => {
    monitor.performCleanup();
  }, [monitor]);

  const performAggressiveCleanup = useCallback(() => {
    monitor.performAggressiveCleanup();
  }, [monitor]);

  return {
    getCurrentMetrics,
    getMetricsHistory,
    performCleanup,
    performAggressiveCleanup,
  };
};

/**
 * Hook for memory-efficient list management
 */
export const useMemoryEfficientList = <T>(maxSize = 1000, initialItems: T[] = []) => {
  const itemsRef = useRef<T[]>([...initialItems]);
  const { addCleanup } = useMemoryManagement({ componentName: 'MemoryEfficientList' });

  const addItem = useCallback((item: T) => {
    itemsRef.current.push(item);
    
    // Trim if over max size
    if (itemsRef.current.length > maxSize) {
      const trimSize = Math.floor(maxSize * 0.8);
      itemsRef.current = itemsRef.current.slice(-trimSize);
    }
  }, [maxSize]);

  const removeItem = useCallback((index: number) => {
    if (index >= 0 && index < itemsRef.current.length) {
      itemsRef.current.splice(index, 1);
    }
  }, []);

  const clearItems = useCallback(() => {
    itemsRef.current = [];
  }, []);

  const getItems = useCallback((): T[] => {
    return [...itemsRef.current];
  }, []);

  const getSize = useCallback((): number => {
    return itemsRef.current.length;
  }, []);

  // Register cleanup
  useEffect(() => {
    addCleanup(() => {
      itemsRef.current = [];
    });
  }, [addCleanup]);

  return {
    addItem,
    removeItem,
    clearItems,
    getItems,
    getSize,
  };
};

/**
 * Hook for memory-aware state management
 */
export const useMemoryAwareState = <T>(
  initialValue: T,
  componentName: string
): [T, (value: T | ((prev: T) => T)) => void] => {
  const stateRef = useRef<T>(initialValue);
  const { addCleanup } = useMemoryManagement({ componentName });

  const setState = useCallback((value: T | ((prev: T) => T)) => {
    if (typeof value === 'function') {
      stateRef.current = (value as (prev: T) => T)(stateRef.current);
    } else {
      stateRef.current = value;
    }
  }, []);

  // Register cleanup
  useEffect(() => {
    addCleanup(() => {
      // Clear references for garbage collection
      stateRef.current = null as any;
    });
  }, [addCleanup]);

  return [stateRef.current, setState];
};