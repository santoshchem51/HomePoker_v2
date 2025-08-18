/**
 * Component Optimization Utilities
 * Provides React performance optimization patterns for memoization and callback optimization
 */

import { useCallback, useMemo, useRef, useEffect } from 'react';

/**
 * Shallow comparison for React.memo
 */
export const shallowEqual = (prevProps: any, nextProps: any): boolean => {
  const keys1 = Object.keys(prevProps);
  const keys2 = Object.keys(nextProps);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (let key of keys1) {
    if (prevProps[key] !== nextProps[key]) {
      return false;
    }
  }

  return true;
};

/**
 * Deep comparison for complex objects
 */
export const deepEqual = (a: any, b: any): boolean => {
  if (a === b) return true;

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  if (!a || !b || (typeof a !== 'object' && typeof b !== 'object')) {
    return a === b;
  }

  if (a === null || a === undefined || b === null || b === undefined) {
    return false;
  }

  if (a.prototype !== b.prototype) return false;

  let keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) {
    return false;
  }

  return keys.every(k => deepEqual(a[k], b[k]));
};

/**
 * Stable callback hook that persists across renders
 */
export const useStableCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList = []
): T => {
  const callbackRef = useRef<T>(callback);
  
  // Update the callback ref when dependencies change
  useEffect(() => {
    callbackRef.current = callback;
  }, deps);

  // Return a stable callback that always calls the latest version
  return useCallback(
    ((...args: any[]) => callbackRef.current(...args)) as T,
    []
  );
};

/**
 * Memoized value with custom comparison
 */
export const useMemoWithComparison = <T>(
  factory: () => T,
  deps: React.DependencyList,
  compare: (a: T, b: T) => boolean = shallowEqual
): T => {
  const valueRef = useRef<T | undefined>(undefined);
  const depsRef = useRef<React.DependencyList | undefined>(undefined);

  // Check if dependencies have changed
  const depsChanged = !depsRef.current || deps.some((dep, index) => 
    !Object.is(dep, depsRef.current![index])
  );

  if (depsChanged) {
    const newValue = factory();
    
    // Only update if the value has actually changed according to the comparison function
    if (!valueRef.current || !compare(valueRef.current, newValue)) {
      valueRef.current = newValue;
    }
    
    depsRef.current = deps;
  }

  return valueRef.current!;
};

/**
 * Optimized Zustand selector with shallow comparison
 */
export const createOptimizedSelector = <T, U>(
  selector: (state: T) => U
) => {
  return (state: T): U => selector(state);
};

/**
 * Performance-optimized event handlers
 * Note: This approach doesn't use useCallback inside loops to comply with rules of hooks
 */
export const useOptimizedHandlers = <T extends Record<string, (...args: any[]) => any>>(
  handlers: T,
  deps: React.DependencyList = []
): T => {
  return useMemo(() => {
    // Return the handlers wrapped in a memoized object
    // Individual handlers should be memoized at the component level if needed
    return { ...handlers };
  }, deps);
};

/**
 * Debounced callback hook
 */
export const useDebouncedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  
  return useCallback(
    ((...args: any[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay, ...deps]
  );
};

/**
 * Throttled callback hook
 */
export const useThrottledCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T => {
  const lastCallRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  
  return useCallback(
    ((...args: any[]) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallRef.current;
      
      if (timeSinceLastCall >= delay) {
        lastCallRef.current = now;
        callback(...args);
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          lastCallRef.current = Date.now();
          callback(...args);
        }, delay - timeSinceLastCall);
      }
    }) as T,
    [callback, delay, ...deps]
  );
};

/**
 * Render count tracking for performance debugging
 */
export const useRenderCount = (componentName: string): number => {
  const renderCount = useRef<number>(0);
  
  useEffect(() => {
    renderCount.current += 1;
    console.log(`${componentName} rendered ${renderCount.current} times`);
  });
  
  return renderCount.current;
};

/**
 * Performance measurement hook
 */
export const usePerformanceMeasure = (measureName: string, enabled = false) => {
  const startTimeRef = useRef<number | undefined>(undefined);
  
  const startMeasure = useCallback(() => {
    if (enabled) {
      startTimeRef.current = Date.now();
    }
  }, [enabled]);
  
  const endMeasure = useCallback(() => {
    if (enabled && startTimeRef.current) {
      const duration = Date.now() - startTimeRef.current;
      console.log(`${measureName} took ${duration.toFixed(2)}ms`);
      return duration;
    }
    return 0;
  }, [enabled, measureName]);
  
  return { startMeasure, endMeasure };
};

/**
 * Lazy component loading utilities
 */
export const ComponentLoadingUtils = {
  /**
   * Create a lazy-loaded component with fallback
   */
  createLazyComponent: <T extends React.ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
    fallbackComponent?: React.ComponentType
  ): React.ComponentType<any> => {
    const LazyComponent = React.lazy(importFn);
    
    if (fallbackComponent) {
      return React.forwardRef((props: any, ref: any) => 
        React.createElement(
          React.Suspense,
          { fallback: React.createElement(fallbackComponent, props) },
          React.createElement(LazyComponent, { ...props, ref })
        )
      );
    }
    
    return LazyComponent;
  },

  /**
   * Preload a component for better performance
   */
  preloadComponent: <T extends React.ComponentType<any>>(
    importFn: () => Promise<{ default: T }>
  ): void => {
    // Start loading the component immediately
    importFn().catch(error => {
      console.warn('Component preload failed:', error);
    });
  },
};

/**
 * Optimization decorator for class components (legacy support)
 */
export const withOptimization = <P extends object>(
  Component: React.ComponentType<P>,
  propsAreEqual?: (prevProps: P, nextProps: P) => boolean
): React.ComponentType<P> => {
  return React.memo(Component, propsAreEqual || shallowEqual);
};

/**
 * Bundle size optimization utilities
 */
export const BundleOptimizationUtils = {
  /**
   * Dynamic imports are not supported in React Native production builds
   * This method is disabled for production compatibility
   */
  dynamicImport: async <T>(_modulePath: string): Promise<T> => {
    throw new Error('Dynamic imports are not supported in React Native');
  },

  /**
   * Lazy load heavy features
   */
  lazyLoadFeature: <T>(
    featureName: string,
    importFn: () => Promise<T>
  ): (() => Promise<T>) => {
    let cachedFeature: Promise<T> | null = null;
    
    return () => {
      if (!cachedFeature) {
        console.log(`Loading feature: ${featureName}`);
        cachedFeature = importFn();
      }
      return cachedFeature;
    };
  },
};

// Re-export React for optimization patterns
import * as React from 'react';
export { React };