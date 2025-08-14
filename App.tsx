/**
 * PokePot - React Native Poker Session Manager
 * 
 * @format
 */

import React, { useEffect, useState, useCallback } from 'react';
import { StatusBar, StyleSheet, useColorScheme, View, Text, TouchableOpacity, InteractionManager } from 'react-native';
import { DatabaseService } from './src/services/infrastructure/DatabaseService';
import { CrashReportingService, setupGlobalErrorHandler } from './src/services/monitoring/CrashReportingService';
import { StartupOptimizer } from './src/utils/startup-optimization';
import { useMemoryManagement, useMemoryMonitoring } from './src/hooks/useMemoryManagement';

// Performance monitoring for startup
let startupStartTime = Date.now();

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [dbInitialized, setDbInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [startupPhase, setStartupPhase] = useState<'database' | 'services' | 'complete'>('database');

  // Memory management hooks
  const { trackTimer } = useMemoryManagement({ 
    componentName: 'App',
    enableAutoCleanup: true,
    cleanupDelay: 10000 // 10 seconds
  });
  const { getCurrentMetrics, performCleanup } = useMemoryMonitoring(true);

  // Lazy initialization of non-critical services
  const initializeNonCriticalServices = useCallback(async () => {
    const servicesStartTime = Date.now();
    const crashReporting = CrashReportingService.getInstance();
    const startupOptimizer = StartupOptimizer.getInstance();
    
    try {
      setStartupPhase('services');
      console.log('Initializing non-critical services...');
      
      // Use startup optimizer for progressive loading
      await startupOptimizer.preloadCriticalComponents();
      
      // Preload service modules in background without blocking UI
      const servicePromises = [
        import('./src/services/core/SessionService'),
        import('./src/services/core/TransactionService'),
        import('./src/services/core/ProfileService')
      ];
      
      // Don't wait for all services, just start loading them
      Promise.all(servicePromises).then(() => {
        console.log('Core services preloaded');
      }).catch(error => {
        console.warn('Service preloading failed:', error);
      });
      
      const servicesInitTime = Date.now() - servicesStartTime;
      crashReporting.reportServiceInitializationTime(servicesInitTime, true);
      startupOptimizer.recordMetric('servicesInit', servicesInitTime);
      
      setStartupPhase('complete');
      
      // Report total startup time and initial memory metrics
      const totalStartupTime = Date.now() - startupStartTime;
      crashReporting.reportAppStartupTime(totalStartupTime);
      startupOptimizer.recordMetric('totalStartup', totalStartupTime);
      
      // Report initial memory usage
      const initialMemoryMetrics = getCurrentMetrics();
      if (initialMemoryMetrics) {
        console.log('Initial memory metrics:', initialMemoryMetrics);
      }
      
      console.log(`App startup completed in ${totalStartupTime}ms`);
      
    } catch (error) {
      const servicesInitTime = Date.now() - servicesStartTime;
      crashReporting.reportServiceInitializationTime(servicesInitTime, false);
      console.warn('Non-critical service initialization failed:', error);
      
      // Don't block app startup for non-critical services
      setStartupPhase('complete');
    }
  }, [getCurrentMetrics]);

  // Optimized initialization with lazy loading and preloading
  const initializeDatabase = useCallback(async () => {
    const crashReporting = CrashReportingService.getInstance();
    const startupOptimizer = StartupOptimizer.getInstance();
    const dbStartTime = Date.now();
    
    try {
      console.log('Starting database initialization...');
      setIsRetrying(false);
      setStartupPhase('database');
      
      // Initialize database with timeout protection
      await DatabaseService.getInstance().initialize();
      
      const dbInitTime = Date.now() - dbStartTime;
      crashReporting.reportDatabaseInitializationTime(dbInitTime, true);
      startupOptimizer.recordMetric('databaseInit', dbInitTime);
      
      console.log('Database initialized successfully!');
      setDbInitialized(true);
      setRetryCount(0); // Reset retry count on success
      
      // Initialize non-critical services after InteractionManager
      InteractionManager.runAfterInteractions(() => {
        initializeNonCriticalServices();
      });
      
    } catch (error) {
      const dbInitTime = Date.now() - dbStartTime;
      crashReporting.reportDatabaseInitializationTime(dbInitTime, false);
      
      console.error('Database initialization failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
      
      // Report error to crash reporting
      crashReporting.reportError(
        error instanceof Error ? error : new Error('Database initialization failed'),
        'database_initialization',
        { retryCount, initTime: dbInitTime }
      );
      
      // Provide helpful error messages based on error type
      let userFriendlyMessage = errorMessage;
      if (errorMessage.includes('timeout')) {
        userFriendlyMessage = 'Database initialization is taking longer than expected. Please try again.';
      } else if (errorMessage.includes('permission')) {
        userFriendlyMessage = 'Permission denied accessing device storage. Please check app permissions.';
      } else if (errorMessage.includes('storage')) {
        userFriendlyMessage = 'Insufficient storage space. Please free up some space and try again.';
      }
      
      setInitError(userFriendlyMessage);
    }
  }, [setRetryCount, setDbInitialized, setIsRetrying, setInitError, retryCount, initializeNonCriticalServices]);

  const initializeAppWithMonitoring = useCallback(async () => {
    startupStartTime = Date.now(); // Reset startup timer
    const crashReporting = CrashReportingService.getInstance();
    
    try {
      // Initialize crash reporting first - this is critical
      await crashReporting.initialize({
        enabled: true,
        provider: 'console',
        minimumSeverity: 'info',
        collectDeviceInfo: true,
        collectUserInfo: false,
      });
      
      // Setup global error handlers
      setupGlobalErrorHandler(crashReporting);
      
      // Initialize database - critical path
      await initializeDatabase();
      
    } catch (error) {
      const appStartupTime = Date.now() - startupStartTime;
      crashReporting.reportError(
        error instanceof Error ? error : new Error('Unknown app initialization error'),
        'app_initialization',
        { startupTime: appStartupTime }
      );
      throw error;
    }
  }, [initializeDatabase]);

  useEffect(() => {
    initializeAppWithMonitoring();
  }, [initializeAppWithMonitoring]);

  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    setInitError(null);
    setDbInitialized(false);
    setStartupPhase('database');
    setRetryCount(prev => prev + 1);
    
    // Perform cleanup before retry
    performCleanup();
    
    // Brief delay before retry to show loading state
    trackTimer(setTimeout(() => {
      // Timer will be cleaned up automatically
    }, 500));
    await new Promise(resolve => setTimeout(() => resolve(undefined), 500));
    await initializeDatabase();
  }, [performCleanup, trackTimer, initializeDatabase]);

  if (initError) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>🚫 Initialization Failed</Text>
          <Text style={styles.errorText}>{initError}</Text>
          {retryCount > 0 && (
            <Text style={styles.retryCountText}>Attempt {retryCount + 1}</Text>
          )}
          <TouchableOpacity 
            style={[styles.retryButton, isRetrying && styles.retryButtonDisabled]} 
            onPress={handleRetry}
            disabled={isRetrying}
          >
            <Text style={styles.retryButtonText}>
              {isRetrying ? 'Retrying...' : 'Try Again'}
            </Text>
          </TouchableOpacity>
          
          {retryCount >= 2 && (
            <View style={styles.helpContainer}>
              <Text style={styles.helpText}>Still having trouble?</Text>
              <Text style={styles.helpSubtext}>
                • Check your device storage space{'\n'}
                • Restart the app{'\n'}
                • Contact support if the problem persists
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  if (!dbInitialized || isRetrying) {
    const getLoadingMessage = () => {
      if (isRetrying) return '🔄 Retrying...';
      if (startupPhase === 'database') return '⏳ Initializing Database...';
      if (startupPhase === 'services') return '🔧 Loading Services...';
      return '⏳ Initializing PokePot...';
    };
    
    const getLoadingSubtext = () => {
      if (startupPhase === 'database') return 'Setting up your poker session data...';
      if (startupPhase === 'services') return 'Loading app features...';
      return 'This should take less than 3 seconds';
    };
    
    return (
      <View style={styles.container}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            {getLoadingMessage()}
          </Text>
          <Text style={styles.loadingSubtext}>
            {getLoadingSubtext()}
          </Text>
          {startupPhase === 'services' && (
            <Text style={styles.loadingProgressText}>
              Database ready ✅
            </Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={styles.workingContainer}>
        <Text style={styles.workingTitle}>🎰 PokePot</Text>
        <Text style={styles.workingSubtitle}>Epic 1 Complete ✅</Text>
        <TouchableOpacity style={styles.workingButton}>
          <Text style={styles.workingButtonText}>Start New Session</Text>
        </TouchableOpacity>
        <Text style={styles.workingStatus}>App is working in your emulator!</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  workingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  workingTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 10,
    textAlign: 'center',
  },
  workingSubtitle: {
    fontSize: 18,
    color: '#4CAF50',
    marginBottom: 30,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  workingButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  workingButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  workingStatus: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadingProgressText: {
    fontSize: 12,
    color: '#4CAF50',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F44336',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  retryButtonDisabled: {
    backgroundColor: '#ccc',
  },
  retryCountText: {
    fontSize: 14,
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '500',
  },
  helpContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  helpText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E65100',
    textAlign: 'center',
    marginBottom: 8,
  },
  helpSubtext: {
    fontSize: 14,
    color: '#BF360C',
    textAlign: 'left',
    lineHeight: 20,
  },
});

export default App;
