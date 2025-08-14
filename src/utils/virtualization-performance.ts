/**
 * Virtualization Performance Utilities
 * Implements Story 5.2 AC: 5 - Performance testing for virtualized lists
 */

export interface VirtualizationPerformanceMetrics {
  renderTime: number;
  scrollPerformance: number;
  memoryUsage: number;
  frameRate: number;
  totalItems: number;
  visibleItems: number;
}

export interface VirtualizationTestConfig {
  itemCount: number;
  itemHeight: number;
  containerHeight: number;
  scrollSpeed: number;
}

/**
 * Calculate virtualization window size based on container and item dimensions
 */
export function calculateVirtualizationWindow(
  containerHeight: number,
  itemHeight: number,
  bufferSize: number = 2
): {
  visibleItems: number;
  windowSize: number;
  initialNumToRender: number;
} {
  const visibleItems = Math.ceil(containerHeight / itemHeight);
  const windowSize = visibleItems + (bufferSize * 2);
  const initialNumToRender = Math.min(visibleItems + bufferSize, 20);

  return {
    visibleItems,
    windowSize,
    initialNumToRender,
  };
}

/**
 * Estimate memory usage for virtualized list
 */
export function estimateVirtualizationMemoryUsage(
  totalItems: number,
  renderedItems: number,
  itemMemorySize: number = 1024 // bytes per item
): {
  totalMemoryWithoutVirtualization: number;
  actualMemoryUsage: number;
  memorySavings: number;
  savingsPercentage: number;
} {
  const totalMemoryWithoutVirtualization = totalItems * itemMemorySize;
  const actualMemoryUsage = renderedItems * itemMemorySize;
  const memorySavings = totalMemoryWithoutVirtualization - actualMemoryUsage;
  const savingsPercentage = (memorySavings / totalMemoryWithoutVirtualization) * 100;

  return {
    totalMemoryWithoutVirtualization,
    actualMemoryUsage,
    memorySavings,
    savingsPercentage,
  };
}

/**
 * Performance benchmarking for virtualized lists
 */
export class VirtualizationPerformanceTester {
  private startTime: number = 0;
  private frameCount: number = 0;
  private lastFrameTime: number = 0;

  /**
   * Start performance measurement
   */
  startMeasurement(): void {
    this.startTime = Date.now();
    this.frameCount = 0;
    this.lastFrameTime = this.startTime;
  }

  /**
   * Record a frame render for FPS calculation
   */
  recordFrame(): void {
    this.frameCount++;
    this.lastFrameTime = Date.now();
  }

  /**
   * Calculate current FPS
   */
  getCurrentFPS(): number {
    const elapsed = this.lastFrameTime - this.startTime;
    if (elapsed === 0) return 0;
    return (this.frameCount / elapsed) * 1000;
  }

  /**
   * Get performance metrics
   */
  getMetrics(totalItems: number, visibleItems: number): VirtualizationPerformanceMetrics {
    const elapsed = this.lastFrameTime - this.startTime;
    
    return {
      renderTime: elapsed,
      scrollPerformance: this.getCurrentFPS(),
      memoryUsage: this.estimateMemoryUsage(totalItems, visibleItems),
      frameRate: this.getCurrentFPS(),
      totalItems,
      visibleItems,
    };
  }

  /**
   * Estimate current memory usage
   */
  private estimateMemoryUsage(_totalItems: number, visibleItems: number): number {
    const itemMemorySize = 1024; // Estimated bytes per transaction item
    return visibleItems * itemMemorySize;
  }
}

/**
 * Validate virtualization performance against thresholds
 */
export function validateVirtualizationPerformance(
  metrics: VirtualizationPerformanceMetrics,
  thresholds: {
    minFrameRate: number;
    maxRenderTime: number;
    maxMemoryUsage: number;
  }
): {
  isValid: boolean;
  failures: string[];
  warnings: string[];
} {
  const failures: string[] = [];
  const warnings: string[] = [];

  // Frame rate validation
  if (metrics.frameRate < thresholds.minFrameRate) {
    failures.push(`Frame rate ${metrics.frameRate.toFixed(2)}fps is below threshold ${thresholds.minFrameRate}fps`);
  } else if (metrics.frameRate < thresholds.minFrameRate * 1.2) {
    warnings.push(`Frame rate ${metrics.frameRate.toFixed(2)}fps is close to threshold ${thresholds.minFrameRate}fps`);
  }

  // Render time validation
  if (metrics.renderTime > thresholds.maxRenderTime) {
    failures.push(`Render time ${metrics.renderTime.toFixed(2)}ms exceeds threshold ${thresholds.maxRenderTime}ms`);
  } else if (metrics.renderTime > thresholds.maxRenderTime * 0.8) {
    warnings.push(`Render time ${metrics.renderTime.toFixed(2)}ms is approaching threshold ${thresholds.maxRenderTime}ms`);
  }

  // Memory usage validation
  if (metrics.memoryUsage > thresholds.maxMemoryUsage) {
    failures.push(`Memory usage ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB exceeds threshold ${(thresholds.maxMemoryUsage / 1024 / 1024).toFixed(2)}MB`);
  } else if (metrics.memoryUsage > thresholds.maxMemoryUsage * 0.8) {
    warnings.push(`Memory usage ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB is approaching threshold ${(thresholds.maxMemoryUsage / 1024 / 1024).toFixed(2)}MB`);
  }

  return {
    isValid: failures.length === 0,
    failures,
    warnings,
  };
}

/**
 * Generate virtualization performance report
 */
export function generateVirtualizationReport(
  metrics: VirtualizationPerformanceMetrics,
  config: VirtualizationTestConfig
): string {
  const memoryEstimate = estimateVirtualizationMemoryUsage(
    config.itemCount,
    metrics.visibleItems
  );

  return `
Virtualization Performance Report
================================

Configuration:
- Total Items: ${config.itemCount}
- Item Height: ${config.itemHeight}px
- Container Height: ${config.containerHeight}px

Performance Metrics:
- Render Time: ${metrics.renderTime.toFixed(2)}ms
- Frame Rate: ${metrics.frameRate.toFixed(2)}fps
- Visible Items: ${metrics.visibleItems}
- Memory Usage: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB

Memory Optimization:
- Without Virtualization: ${(memoryEstimate.totalMemoryWithoutVirtualization / 1024 / 1024).toFixed(2)}MB
- With Virtualization: ${(memoryEstimate.actualMemoryUsage / 1024 / 1024).toFixed(2)}MB
- Memory Savings: ${(memoryEstimate.memorySavings / 1024 / 1024).toFixed(2)}MB (${memoryEstimate.savingsPercentage.toFixed(1)}%)

Scroll Performance:
- Scroll Speed: ${config.scrollSpeed}px/s
- Performance Score: ${metrics.scrollPerformance.toFixed(2)}

Recommendations:
${metrics.frameRate < 30 ? '- Frame rate is below optimal (30fps). Consider reducing item complexity.' : '- Frame rate is acceptable.'}
${metrics.memoryUsage > 50 * 1024 * 1024 ? '- Memory usage is high. Consider optimizing item rendering.' : '- Memory usage is within acceptable limits.'}
${memoryEstimate.savingsPercentage > 80 ? '- Excellent memory savings with virtualization!' : '- Good memory optimization with virtualization.'}
  `.trim();
}

/**
 * Virtualization configuration presets for different scenarios
 */
export const VIRTUALIZATION_PRESETS = {
  SMALL_DATASET: {
    itemCount: 100,
    itemHeight: 80,
    containerHeight: 600,
    scrollSpeed: 300,
  },
  MEDIUM_DATASET: {
    itemCount: 1000,
    itemHeight: 120,
    containerHeight: 600,
    scrollSpeed: 500,
  },
  LARGE_DATASET: {
    itemCount: 10000,
    itemHeight: 120,
    containerHeight: 600,
    scrollSpeed: 800,
  },
  TRANSACTION_HISTORY: {
    itemCount: 5000,
    itemHeight: 120,
    containerHeight: 600,
    scrollSpeed: 400,
  },
} as const;

/**
 * Performance thresholds for different device types
 */
export const PERFORMANCE_THRESHOLDS = {
  HIGH_END_DEVICE: {
    minFrameRate: 60,
    maxRenderTime: 16.67, // 60fps = 16.67ms per frame
    maxMemoryUsage: 100 * 1024 * 1024, // 100MB
  },
  MID_RANGE_DEVICE: {
    minFrameRate: 30,
    maxRenderTime: 33.33, // 30fps = 33.33ms per frame
    maxMemoryUsage: 150 * 1024 * 1024, // 150MB
  },
  LOW_END_DEVICE: {
    minFrameRate: 24,
    maxRenderTime: 41.67, // 24fps = 41.67ms per frame
    maxMemoryUsage: 200 * 1024 * 1024, // 200MB
  },
} as const;