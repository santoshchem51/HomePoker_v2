/**
 * Startup Optimization Utilities
 * Implements React Native performance optimization patterns for app startup
 */

import { InteractionManager } from 'react-native';

interface StartupMetrics {
  databaseInit: number;
  servicesInit: number;
  totalStartup: number;
}

class StartupOptimizer {
  private static instance: StartupOptimizer;
  private metrics: Partial<StartupMetrics> = {};

  public static getInstance(): StartupOptimizer {
    if (!StartupOptimizer.instance) {
      StartupOptimizer.instance = new StartupOptimizer();
    }
    return StartupOptimizer.instance;
  }

  /**
   * Preload components that are likely to be used soon
   * This happens after the interaction manager is ready
   */
  public async preloadCriticalComponents(): Promise<void> {
    return new Promise((resolve) => {
      InteractionManager.runAfterInteractions(async () => {
        try {
          // Preload critical components in background
          const componentPromises = [
            // Session components
            import('../screens/SessionSetup/CreateSessionScreen'),
            import('../screens/LiveGame/LiveGameScreen'),
            
            // Player components  
            import('../components/poker/PlayerSelectionGrid'),
            import('../components/poker/EnhancedPlayerList'),
            
            // Transaction components
            import('../components/poker/TransactionHistory'),
            import('../components/poker/QuickBuyInPanel'),
          ];

          // Don't await all - just start loading them
          Promise.all(componentPromises).catch(error => {
            console.warn('Component preloading failed:', error);
          });

          resolve();
        } catch (error) {
          console.warn('Preload failed:', error);
          resolve();
        }
      });
    });
  }

  /**
   * Optimize bundle loading with lazy imports
   */
  public async loadFeatureBundle(feature: 'voice' | 'export' | 'whatsapp'): Promise<any> {
    try {
      switch (feature) {
        case 'voice':
          return await import('../services/integration/VoiceService');
        case 'export':
          return await import('../services/infrastructure/ExportService');
        case 'whatsapp':
          return await import('../services/integration/WhatsAppService');
        default:
          throw new Error(`Unknown feature bundle: ${feature}`);
      }
    } catch (error) {
      console.warn(`Failed to load ${feature} bundle:`, error);
      throw error;
    }
  }

  /**
   * Record timing metrics for startup optimization
   */
  public recordMetric(type: keyof StartupMetrics, duration: number): void {
    this.metrics[type] = duration;
    
    // Log performance insights
    if (type === 'totalStartup') {
      const insights = this.generatePerformanceInsights();
      console.log('Startup Performance Insights:', insights);
    }
  }

  /**
   * Generate performance insights for optimization
   */
  private generatePerformanceInsights(): Record<string, any> {
    const insights: Record<string, any> = {
      metrics: { ...this.metrics },
      recommendations: [],
    };

    if (this.metrics.databaseInit && this.metrics.databaseInit > 1000) {
      insights.recommendations.push({
        area: 'database',
        issue: 'Database initialization is slow',
        suggestion: 'Consider database optimization or connection pooling',
      });
    }

    if (this.metrics.servicesInit && this.metrics.servicesInit > 1500) {
      insights.recommendations.push({
        area: 'services',
        issue: 'Service initialization is slow',
        suggestion: 'Consider lazy loading non-critical services',
      });
    }

    if (this.metrics.totalStartup && this.metrics.totalStartup > 3000) {
      insights.recommendations.push({
        area: 'overall',
        issue: 'Total startup time exceeds target',
        suggestion: 'Review critical path and implement progressive loading',
      });
    }

    return insights;
  }

  /**
   * Get current startup metrics
   */
  public getMetrics(): Partial<StartupMetrics> {
    return { ...this.metrics };
  }

  /**
   * Reset metrics for new startup measurement
   */
  public reset(): void {
    this.metrics = {};
  }
}

/**
 * Utility functions for startup optimization
 */
export const StartupUtils = {
  /**
   * Defer non-critical operations until after interactions complete
   */
  deferUntilInteractionComplete: (callback: () => void | Promise<void>): void => {
    InteractionManager.runAfterInteractions(callback);
  },

  /**
   * Batch multiple state updates to reduce re-renders
   */
  batchStateUpdates: <T>(updates: (() => T)[]): T[] => {
    return updates.map(update => update());
  },

  /**
   * Create a timeout promise for initialization operations
   */
  createTimeoutPromise: <T>(
    promise: Promise<T>,
    timeoutMs: number,
    timeoutMessage = 'Operation timed out'
  ): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
      }),
    ]);
  },

  /**
   * Progressive loading with priority queues
   */
  progressiveLoad: async (
    highPriority: (() => Promise<any>)[],
    lowPriority: (() => Promise<any>)[]
  ): Promise<void> => {
    // Load high priority items first
    await Promise.all(highPriority.map(fn => fn().catch(console.warn)));
    
    // Load low priority items after interaction manager
    InteractionManager.runAfterInteractions(async () => {
      await Promise.all(lowPriority.map(fn => fn().catch(console.warn)));
    });
  },
};

/**
 * Measure startup time for performance testing
 */
export const measureStartupTime = (): Promise<{
  totalTime: number;
  phases: Record<string, number>;
}> => {
  return new Promise((resolve) => {
    const optimizer = StartupOptimizer.getInstance();
    const metrics = optimizer.getMetrics();
    
    resolve({
      totalTime: metrics.totalStartup || 0,
      phases: {
        database: metrics.databaseInit || 0,
        services: metrics.servicesInit || 0,
      }
    });
  });
};

export { StartupOptimizer };