/**
 * Performance Dashboard Component
 * Implements Story 5.2 Task 7 - Performance dashboard for development and testing
 * Enhanced with real-time metrics display and performance alerts
 */
import React, { memo, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { usePerformanceMonitoring, PerformanceAlert } from '../../services/monitoring/PerformanceMonitor';

interface PerformanceDashboardProps {
  visible: boolean;
  onToggle: (visible: boolean) => void;
}

const PerformanceDashboardComponent: React.FC<PerformanceDashboardProps> = ({
  visible,
  onToggle,
}) => {
  const { metrics, alerts, summary } = usePerformanceMonitoring();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'metrics' | 'alerts'>('overview');

  /**
   * Format memory size for display
   */
  const formatMemorySize = useCallback((bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)}MB`;
  }, []);

  /**
   * Format time for display
   */
  const formatTime = useCallback((milliseconds: number): string => {
    if (milliseconds < 1000) {
      return `${milliseconds.toFixed(0)}ms`;
    }
    return `${(milliseconds / 1000).toFixed(1)}s`;
  }, []);

  /**
   * Get alert color based on severity
   */
  const getAlertColor = useCallback((severity: PerformanceAlert['severity']): string => {
    switch (severity) {
      case 'critical':
        return '#DC3545';
      case 'error':
        return '#FD7E14';
      case 'warning':
        return '#FFC107';
      default:
        return '#6C757D';
    }
  }, []);

  /**
   * Get health status color
   */
  const getHealthColor = useCallback((isHealthy: boolean): string => {
    return isHealthy ? '#28A745' : '#DC3545';
  }, []);

  /**
   * Render overview tab
   */
  const renderOverview = useCallback(() => (
    <View style={styles.tabContent}>
      <View style={styles.healthCard}>
        <View style={styles.healthHeader}>
          <Text style={styles.cardTitle}>Performance Health</Text>
          <View style={[
            styles.healthIndicator,
            { backgroundColor: getHealthColor(summary.isHealthy) }
          ]} />
        </View>
        
        <View style={styles.healthStats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{summary.criticalIssues}</Text>
            <Text style={styles.statLabel}>Critical Issues</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{summary.warnings}</Text>
            <Text style={styles.statLabel}>Warnings</Text>
          </View>
        </View>

        <Text style={styles.healthStatus}>
          {summary.isHealthy ? 'System performing well' : 'Performance issues detected'}
        </Text>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>
            {formatTime(summary.averageStartupTime)}
          </Text>
          <Text style={styles.metricLabel}>Avg Startup Time</Text>
          <Text style={styles.metricTarget}>Target: &lt;3s</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>
            {formatMemorySize(summary.averageMemoryUsage)}
          </Text>
          <Text style={styles.metricLabel}>Avg Memory Usage</Text>
          <Text style={styles.metricTarget}>Target: &lt;150MB</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>
            {summary.averageFrameRate.toFixed(1)}fps
          </Text>
          <Text style={styles.metricLabel}>Avg Frame Rate</Text>
          <Text style={styles.metricTarget}>Target: &gt;30fps</Text>
        </View>
      </View>

      {summary.recommendations.length > 0 && (
        <View style={styles.recommendationsCard}>
          <Text style={styles.cardTitle}>Recommendations</Text>
          {summary.recommendations.map((rec, index) => (
            <Text key={index} style={styles.recommendation}>
              • {rec}
            </Text>
          ))}
        </View>
      )}
    </View>
  ), [summary, formatTime, formatMemorySize, getHealthColor]);

  /**
   * Render metrics tab
   */
  const renderMetrics = useCallback(() => (
    <View style={styles.tabContent}>
      {metrics ? (
        <ScrollView style={styles.metricsScroll}>
          <View style={styles.metricSection}>
            <Text style={styles.sectionTitle}>Current Metrics</Text>
            
            <View style={styles.metricRow}>
              <Text style={styles.metricName}>App Startup Time:</Text>
              <Text style={styles.metricValue}>{formatTime(metrics.appStartupTime)}</Text>
            </View>
            
            <View style={styles.metricRow}>
              <Text style={styles.metricName}>Memory Usage:</Text>
              <Text style={styles.metricValue}>{formatMemorySize(metrics.memoryUsage)}</Text>
            </View>
            
            <View style={styles.metricRow}>
              <Text style={styles.metricName}>Frame Rate:</Text>
              <Text style={styles.metricValue}>{metrics.frameRate.toFixed(1)}fps</Text>
            </View>
            
            <View style={styles.metricRow}>
              <Text style={styles.metricName}>UI Response Time:</Text>
              <Text style={styles.metricValue}>{formatTime(metrics.uiResponseTime)}</Text>
            </View>
            
            <View style={styles.metricRow}>
              <Text style={styles.metricName}>Database Operation Time:</Text>
              <Text style={styles.metricValue}>{formatTime(metrics.databaseOperationTime)}</Text>
            </View>
            
            <View style={styles.metricRow}>
              <Text style={styles.metricName}>Component Render Time:</Text>
              <Text style={styles.metricValue}>{formatTime(metrics.componentRenderTime)}</Text>
            </View>
            
            <View style={styles.metricRow}>
              <Text style={styles.metricName}>Bundle Load Time:</Text>
              <Text style={styles.metricValue}>{formatTime(metrics.bundleLoadTime)}</Text>
            </View>
            
            <Text style={styles.timestamp}>
              Last Updated: {metrics.timestamp.toLocaleTimeString()}
            </Text>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.noData}>
          <Text style={styles.noDataText}>No metrics available</Text>
        </View>
      )}
    </View>
  ), [metrics, formatTime, formatMemorySize]);

  /**
   * Render alerts tab
   */
  const renderAlerts = useCallback(() => (
    <View style={styles.tabContent}>
      <ScrollView style={styles.alertsScroll}>
        {alerts.length > 0 ? (
          alerts.map((alert) => (
            <View key={alert.id} style={styles.alertCard}>
              <View style={styles.alertHeader}>
                <View style={[
                  styles.alertSeverity,
                  { backgroundColor: getAlertColor(alert.severity) }
                ]}>
                  <Text style={styles.alertSeverityText}>
                    {alert.severity.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.alertType}>{alert.type}</Text>
                <Text style={styles.alertTime}>
                  {alert.timestamp.toLocaleTimeString()}
                </Text>
              </View>
              
              <Text style={styles.alertMessage}>{alert.message}</Text>
              
              <View style={styles.alertMetrics}>
                <Text style={styles.alertMetric}>
                  Value: {alert.type === 'memory' ? formatMemorySize(alert.value) : formatTime(alert.value)}
                </Text>
                <Text style={styles.alertMetric}>
                  Threshold: {alert.type === 'memory' ? formatMemorySize(alert.threshold) : formatTime(alert.threshold)}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.noData}>
            <Text style={styles.noDataText}>No alerts</Text>
          </View>
        )}
      </ScrollView>
    </View>
  ), [alerts, getAlertColor, formatTime, formatMemorySize]);

  if (!visible) {
    return (
      <TouchableOpacity style={styles.toggleButton} onPress={() => onToggle(true)}>
        <Text style={styles.toggleButtonText}>Performance Monitor</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.dashboard}>
      <View style={styles.header}>
        <Text style={styles.title}>Performance Dashboard</Text>
        <TouchableOpacity onPress={() => onToggle(false)}>
          <Text style={styles.closeButton}>×</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'overview' && styles.activeTab]}
          onPress={() => setSelectedTab('overview')}
        >
          <Text style={[styles.tabText, selectedTab === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'metrics' && styles.activeTab]}
          onPress={() => setSelectedTab('metrics')}
        >
          <Text style={[styles.tabText, selectedTab === 'metrics' && styles.activeTabText]}>
            Metrics
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'alerts' && styles.activeTab]}
          onPress={() => setSelectedTab('alerts')}
        >
          <Text style={[styles.tabText, selectedTab === 'alerts' && styles.activeTabText]}>
            Alerts ({alerts.length})
          </Text>
        </TouchableOpacity>
      </View>

      {selectedTab === 'overview' && renderOverview()}
      {selectedTab === 'metrics' && renderMetrics()}
      {selectedTab === 'alerts' && renderAlerts()}
    </View>
  );
};

const styles = StyleSheet.create({
  toggleButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    zIndex: 1000,
  },
  toggleButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  dashboard: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
    maxHeight: 600,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
  },
  closeButton: {
    fontSize: 24,
    color: '#6C757D',
    fontWeight: 'bold',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#6C757D',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  tabContent: {
    padding: 16,
  },
  healthCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  healthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  healthIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  healthStats: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  statLabel: {
    fontSize: 12,
    color: '#6C757D',
    marginTop: 2,
  },
  healthStatus: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    margin: '1%',
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6C757D',
    textAlign: 'center',
    marginBottom: 2,
  },
  metricTarget: {
    fontSize: 10,
    color: '#28A745',
    textAlign: 'center',
  },
  recommendationsCard: {
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    padding: 16,
  },
  recommendation: {
    fontSize: 14,
    color: '#856404',
    marginVertical: 2,
    lineHeight: 20,
  },
  metricsScroll: {
    maxHeight: 400,
  },
  metricSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 12,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4',
  },
  metricName: {
    fontSize: 14,
    color: '#6C757D',
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    color: '#ADB5BD',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  alertsScroll: {
    maxHeight: 400,
  },
  alertCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertSeverity: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  alertSeverityText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  alertType: {
    fontSize: 12,
    color: '#6C757D',
    textTransform: 'capitalize',
    flex: 1,
  },
  alertTime: {
    fontSize: 10,
    color: '#ADB5BD',
  },
  alertMessage: {
    fontSize: 14,
    color: '#2C3E50',
    marginBottom: 8,
    lineHeight: 18,
  },
  alertMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  alertMetric: {
    fontSize: 12,
    color: '#6C757D',
  },
  noData: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noDataText: {
    fontSize: 16,
    color: '#6C757D',
  },
});

// Memoized export for performance
export const PerformanceDashboard = memo(PerformanceDashboardComponent);
PerformanceDashboard.displayName = 'PerformanceDashboard';