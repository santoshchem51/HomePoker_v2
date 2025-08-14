/**
 * Performance API Polyfill for React Native
 * Provides consistent performance measurement across platforms
 */

// Simple performance polyfill for React Native
export const performancePolyfill = {
  now(): number {
    return Date.now();
  },
  
  mark(name: string): void {
    if (__DEV__) {
      console.log(`[Performance Mark] ${name} at ${Date.now()}`);
    }
  },
  
  measure(name: string, startMark?: string, endMark?: string): void {
    if (__DEV__) {
      console.log(`[Performance Measure] ${name} - Start: ${startMark}, End: ${endMark}`);
    }
  }
};

// Use native performance API if available, otherwise use polyfill
export const getPerformance = () => {
  // In React Native, we'll primarily use our polyfill
  // since the Web Performance API may not be available
  return performancePolyfill;
};