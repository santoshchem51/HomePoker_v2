/**
 * Bundle Optimization Utilities
 * Provides utilities for reducing bundle size and optimizing app package
 */

import { Platform } from 'react-native';

/**
 * Dynamic import wrapper for code splitting
 */
export const dynamicImport = <T>(importFunction: () => Promise<T>): Promise<T> => {
  return importFunction().catch(error => {
    console.error('Dynamic import failed:', error);
    throw error;
  });
};

/**
 * Platform-specific component loader
 */
export const loadPlatformComponent = <T>(
  iosComponent: () => Promise<T>,
  androidComponent: () => Promise<T>
): Promise<T> => {
  return Platform.OS === 'ios' ? iosComponent() : androidComponent();
};

/**
 * Lazy load service initialization
 */
export const lazyLoadService = async <T>(
  serviceFactory: () => Promise<T>,
  serviceName: string
): Promise<T> => {
  try {
    const startTime = Date.now();
    const service = await serviceFactory();
    const loadTime = Date.now() - startTime;
    
    console.log(`Service ${serviceName} loaded in ${loadTime}ms`);
    return service;
  } catch (error) {
    console.error(`Failed to load service ${serviceName}:`, error);
    throw error;
  }
};

/**
 * Asset optimization helper
 */
export const optimizedImageSource = (
  source: any,
  quality: 'low' | 'medium' | 'high' = 'medium'
) => {
  const qualityMap = {
    low: 0.5,
    medium: 0.7,
    high: 0.9,
  };

  return {
    ...source,
    quality: qualityMap[quality],
  };
};

/**
 * Memory-efficient array chunking for large datasets
 */
export const chunkArray = <T>(array: T[], chunkSize: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

/**
 * Bundle size monitoring
 */
export const getBundleSize = (): Promise<number> => {
  return new Promise((resolve) => {
    // Simulated bundle size calculation
    // In production, this would integrate with actual bundle analysis
    const estimatedSize = Math.random() * 50 + 30; // 30-80MB range
    resolve(estimatedSize);
  });
};

/**
 * Tree-shaking helper for unused imports
 */
export const conditionalImport = <T>(
  condition: boolean,
  importFunction: () => Promise<T>
): Promise<T | null> => {
  return condition ? importFunction() : Promise.resolve(null);
};

export default {
  dynamicImport,
  loadPlatformComponent,
  lazyLoadService,
  optimizedImageSource,
  chunkArray,
  getBundleSize,
  conditionalImport,
};