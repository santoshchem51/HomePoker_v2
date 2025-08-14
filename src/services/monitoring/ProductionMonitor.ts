/**
 * Production Monitoring Service
 * Story 5.4 - Production Deployment Preparation
 * Comprehensive production monitoring with analytics, crash reporting, and user session recording
 */

import { PerformanceMonitor, PerformanceMetrics, PerformanceAlert } from './PerformanceMonitor';
import { ErrorLogger, LoggedError, ErrorSeverity, ErrorCategory } from './ErrorLogger';
import { getConfig, isProduction } from '../../config/production';
import { SecurityValidator } from '../../config/security';

export interface UserSession {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  screenViews: ScreenView[];
  interactions: UserInteraction[];
  errors: string[];
  crashReport?: string;
  deviceInfo: DeviceInfo;
  appVersion: string;
}

export interface ScreenView {
  screen: string;
  timestamp: Date;
  duration?: number;
  loadTime?: number;
  errorCount: number;
}

export interface UserInteraction {
  type: 'tap' | 'swipe' | 'voice' | 'form' | 'navigation';
  element: string;
  timestamp: Date;
  context: Record<string, any>;
  successful: boolean;
  duration?: number;
}

export interface DeviceInfo {
  platform: 'ios' | 'android';
  osVersion: string;
  appVersion: string;
  deviceModel: string;
  screenSize: { width: number; height: number };
  memoryTotal?: number;
  storageAvailable?: number;
  networkType?: string;
}

export interface AnalyticsEvent {
  id: string;
  name: string;
  timestamp: Date;
  userId?: string;
  sessionId: string;
  properties: Record<string, any>;
  context: {
    screen: string;
    version: string;
    platform: string;
  };
}

export interface CrashData {
  id: string;
  timestamp: Date;
  errorId: string;
  userId: string;
  sessionId: string;
  stackTrace: string;
  breadcrumbs: string[];
  deviceInfo: DeviceInfo;
  appState: Record<string, any>;
  reproductionSteps: string[];
}

/**
 * Production Monitoring Service
 * Integrates performance monitoring, error logging, analytics, and crash reporting
 */
export class ProductionMonitor {
  private static instance: ProductionMonitor | null = null;
  
  private performanceMonitor: PerformanceMonitor;
  private errorLogger: ErrorLogger;
  private sessions: Map<string, UserSession> = new Map();
  private analytics: AnalyticsEvent[] = [];
  private crashes: CrashData[] = [];
  
  private currentSession: UserSession | null = null;
  // Private field for future monitoring state management
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _isMonitoring: boolean = false;
  private config = getConfig();
  
  private constructor() {
    this.performanceMonitor = PerformanceMonitor.getInstance();
    this.errorLogger = new ErrorLogger();
    
    this.initializeMonitoring();
  }
  
  public static getInstance(): ProductionMonitor {
    if (!ProductionMonitor.instance) {
      ProductionMonitor.instance = new ProductionMonitor();
    }
    return ProductionMonitor.instance;
  }
  
  /**
   * Initialize production monitoring
   */
  private initializeMonitoring(): void {
    if (!this.config.features.enableAnalytics) {
      return;
    }
    
    // Subscribe to performance alerts
    this.performanceMonitor.onAlert(this.handlePerformanceAlert.bind(this));
    
    // Subscribe to errors
    this.errorLogger.onError(this.handleError.bind(this));
    this.errorLogger.onCrash(this.handleCrash.bind(this));
    
    // Start session
    this.startSession();
    
    this._isMonitoring = true;
    
    if (__DEV__) {
      console.log('[Production Monitor] Initialized monitoring');
    }
  }
  
  /**
   * Start user session
   */
  public startSession(userId: string = 'anonymous'): string {
    const sessionId = SecurityValidator.generateSecureToken();
    
    const session: UserSession = {
      id: sessionId,
      userId: userId,
      startTime: new Date(),
      screenViews: [],
      interactions: [],
      errors: [],
      deviceInfo: this.getDeviceInfo(),
      appVersion: this.getAppVersion(),
    };
    
    this.sessions.set(sessionId, session);
    this.currentSession = session;
    
    this.trackEvent('session_start', {
      userId,
      deviceInfo: session.deviceInfo,
    });
    
    return sessionId;
  }
  
  /**
   * End current session
   */
  public endSession(): void {
    if (!this.currentSession) {
      return;
    }
    
    const session = this.currentSession;
    session.endTime = new Date();
    session.duration = session.endTime.getTime() - session.startTime.getTime();
    
    this.trackEvent('session_end', {
      duration: session.duration,
      screenViews: session.screenViews.length,
      interactions: session.interactions.length,
      errors: session.errors.length,
    });
    
    this.currentSession = null;
  }
  
  /**
   * Track screen view
   */
  public trackScreenView(screenName: string, loadTime?: number): void {
    if (!this.currentSession || !this.config.features.enableAnalytics) {
      return;
    }
    
    const screenView: ScreenView = {
      screen: screenName,
      timestamp: new Date(),
      loadTime,
      errorCount: 0,
    };
    
    // End previous screen view if exists
    const lastScreen = this.currentSession.screenViews[this.currentSession.screenViews.length - 1];
    if (lastScreen && !lastScreen.duration) {
      lastScreen.duration = screenView.timestamp.getTime() - lastScreen.timestamp.getTime();
    }
    
    this.currentSession.screenViews.push(screenView);
    
    this.trackEvent('screen_view', {
      screen: screenName,
      loadTime,
    });
  }
  
  /**
   * Track user interaction
   */
  public trackInteraction(
    type: UserInteraction['type'],
    element: string,
    context: Record<string, any> = {},
    successful: boolean = true,
    duration?: number
  ): void {
    if (!this.currentSession || !this.config.features.enableAnalytics) {
      return;
    }
    
    const interaction: UserInteraction = {
      type,
      element,
      timestamp: new Date(),
      context: SecurityValidator.isSecureConnection() ? context : {},
      successful,
      duration,
    };
    
    this.currentSession.interactions.push(interaction);
    
    this.trackEvent('user_interaction', {
      type,
      element,
      successful,
      duration,
    });
  }
  
  /**
   * Track analytics event
   */
  public trackEvent(eventName: string, properties: Record<string, any> = {}): void {
    if (!this.config.features.enableAnalytics) {
      return;
    }
    
    const event: AnalyticsEvent = {
      id: SecurityValidator.generateSecureToken(),
      name: eventName,
      timestamp: new Date(),
      userId: this.currentSession?.userId,
      sessionId: this.currentSession?.id || 'no_session',
      properties,
      context: {
        screen: this.getCurrentScreen(),
        version: this.getAppVersion(),
        platform: this.getDeviceInfo().platform,
      },
    };
    
    this.analytics.push(event);
    
    // Keep only recent events
    if (this.analytics.length > 10000) {
      this.analytics = this.analytics.slice(-5000);
    }
    
    // Send to analytics service in production
    if (isProduction() && this.shouldSendAnalytics()) {
      this.sendAnalyticsEvent(event);
    }
  }
  
  /**
   * Record crash with reproduction steps
   */
  public recordCrashWithContext(
    error: Error,
    reproductionSteps: string[],
    appState: Record<string, any> = {}
  ): string {
    if (!this.config.features.enableCrashReporting) {
      return '';
    }
    
    // Log error first
    const errorId = this.errorLogger.logError(
      error.message,
      ErrorSeverity.CRITICAL,
      ErrorCategory.SYSTEM,
      {
        sessionId: this.currentSession?.id,
        userId: this.currentSession?.userId,
        component: 'ProductionMonitor',
        action: 'crash_recording',
      },
      error
    );
    
    // Create crash data
    const crashData: CrashData = {
      id: SecurityValidator.generateSecureToken(),
      timestamp: new Date(),
      errorId,
      userId: this.currentSession?.userId || 'anonymous',
      sessionId: this.currentSession?.id || 'no_session',
      stackTrace: error.stack || '',
      breadcrumbs: this.generateBreadcrumbs(),
      deviceInfo: this.getDeviceInfo(),
      appState,
      reproductionSteps,
    };
    
    this.crashes.push(crashData);
    
    // Add to current session
    if (this.currentSession) {
      this.currentSession.crashReport = crashData.id;
    }
    
    // Track crash event
    this.trackEvent('app_crash', {
      errorMessage: error.message,
      stackTrace: error.stack,
      reproductionSteps: reproductionSteps.length,
    });
    
    // Send crash report in production
    if (isProduction()) {
      this.sendCrashReport(crashData);
    }
    
    return crashData.id;
  }
  
  /**
   * Get analytics summary
   */
  public getAnalyticsSummary(timeRange?: { start: Date; end: Date }) {
    let events = this.analytics;
    let sessions = Array.from(this.sessions.values());
    
    if (timeRange) {
      events = events.filter(e => 
        e.timestamp >= timeRange.start && e.timestamp <= timeRange.end
      );
      sessions = sessions.filter(s => 
        s.startTime >= timeRange.start && 
        (s.endTime ? s.endTime <= timeRange.end : true)
      );
    }
    
    const performanceSummary = this.performanceMonitor.getPerformanceSummary();
    const errorAnalytics = this.errorLogger.getErrorAnalytics(timeRange);
    
    return {
      sessions: {
        total: sessions.length,
        active: sessions.filter(s => !s.endTime).length,
        averageDuration: sessions
          .filter(s => s.duration)
          .reduce((sum, s) => sum + s.duration!, 0) / sessions.length,
        crashedSessions: sessions.filter(s => s.crashReport).length,
      },
      events: {
        total: events.length,
        byType: this.groupEventsByType(events),
        topScreens: this.getTopScreens(sessions),
      },
      performance: performanceSummary,
      errors: errorAnalytics,
      crashes: {
        total: this.crashes.length,
        byPlatform: this.groupCrashesByPlatform(),
        topCauses: this.getTopCrashCauses(),
      },
    };
  }
  
  /**
   * Export all monitoring data
   */
  public exportMonitoringData(): {
    sessions: UserSession[];
    analytics: AnalyticsEvent[];
    crashes: CrashData[];
    performance: PerformanceMetrics[];
    errors: LoggedError[];
  } {
    return {
      sessions: Array.from(this.sessions.values()),
      analytics: this.analytics,
      crashes: this.crashes,
      performance: this.performanceMonitor.getMetricsHistory(100),
      errors: this.errorLogger.getErrors(),
    };
  }
  
  /**
   * Clear all data (for testing)
   */
  public clearAllData(): void {
    this.sessions.clear();
    this.analytics = [];
    this.crashes = [];
    this.errorLogger.clearLogs();
    this.currentSession = null;
  }
  
  // Private methods
  
  private handlePerformanceAlert(alert: PerformanceAlert): void {
    this.trackEvent('performance_alert', {
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      value: alert.value,
      threshold: alert.threshold,
    });
    
    // Update current screen error count
    if (this.currentSession) {
      const currentScreen = this.currentSession.screenViews[this.currentSession.screenViews.length - 1];
      if (currentScreen) {
        currentScreen.errorCount++;
      }
    }
  }
  
  private handleError(error: LoggedError): void {
    if (this.currentSession) {
      this.currentSession.errors.push(error.id);
    }
    
    this.trackEvent('error_logged', {
      severity: error.severity,
      category: error.category,
      message: error.message,
    });
  }
  
  private handleCrash(crashReport: any): void {
    this.trackEvent('crash_reported', {
      errorId: crashReport.errorId,
      crashReason: crashReport.crashReason,
    });
  }
  
  private getDeviceInfo(): DeviceInfo {
    // In a real React Native app, this would use actual device APIs
    return {
      platform: 'android' as const, // Will be determined by platform
      osVersion: '13.0',
      appVersion: this.getAppVersion(),
      deviceModel: 'Unknown',
      screenSize: { width: 375, height: 812 },
      memoryTotal: 4096,
      storageAvailable: 32768,
      networkType: 'wifi',
    };
  }
  
  private getAppVersion(): string {
    return '1.0.0'; // Would be read from app config
  }
  
  private getCurrentScreen(): string {
    if (!this.currentSession || this.currentSession.screenViews.length === 0) {
      return 'unknown';
    }
    
    const lastScreen = this.currentSession.screenViews[this.currentSession.screenViews.length - 1];
    return lastScreen.screen;
  }
  
  private generateBreadcrumbs(): string[] {
    if (!this.currentSession) {
      return [];
    }
    
    const breadcrumbs: string[] = [];
    
    // Add recent screen views
    this.currentSession.screenViews.slice(-5).forEach(screen => {
      breadcrumbs.push(`Viewed screen: ${screen.screen}`);
    });
    
    // Add recent interactions
    this.currentSession.interactions.slice(-10).forEach(interaction => {
      breadcrumbs.push(`${interaction.type}: ${interaction.element}`);
    });
    
    return breadcrumbs;
  }
  
  private shouldSendAnalytics(): boolean {
    return isProduction() && Math.random() < 0.1; // 10% sampling in production
  }
  
  private async sendAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
    // In production, this would send to analytics service
    if (__DEV__) {
      console.log('[Production Monitor] Analytics event:', event.name);
    }
  }
  
  private async sendCrashReport(crashData: CrashData): Promise<void> {
    // In production, this would send to crash reporting service
    if (__DEV__) {
      console.log('[Production Monitor] Crash report:', crashData.id);
    }
  }
  
  private groupEventsByType(events: AnalyticsEvent[]): Record<string, number> {
    return events.reduce((acc, event) => {
      acc[event.name] = (acc[event.name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
  
  private getTopScreens(sessions: UserSession[]): Array<{ screen: string; views: number }> {
    const screenCounts: Record<string, number> = {};
    
    sessions.forEach(session => {
      session.screenViews.forEach(view => {
        screenCounts[view.screen] = (screenCounts[view.screen] || 0) + 1;
      });
    });
    
    return Object.entries(screenCounts)
      .map(([screen, views]) => ({ screen, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);
  }
  
  private groupCrashesByPlatform(): Record<string, number> {
    return this.crashes.reduce((acc, crash) => {
      const platform = crash.deviceInfo.platform;
      acc[platform] = (acc[platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
  
  private getTopCrashCauses(): Array<{ cause: string; count: number }> {
    const causes: Record<string, number> = {};
    
    this.crashes.forEach(crash => {
      // Extract first line of stack trace as cause
      const firstLine = crash.stackTrace.split('\n')[0] || 'Unknown';
      const cause = firstLine.substring(0, 100); // Limit length
      causes[cause] = (causes[cause] || 0) + 1;
    });
    
    return Object.entries(causes)
      .map(([cause, count]) => ({ cause, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }
}

// Export singleton instance
export const productionMonitor = ProductionMonitor.getInstance();