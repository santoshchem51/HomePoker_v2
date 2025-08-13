import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import HealthCheckService, { HealthStatus as IHealthStatus } from '../services/HealthCheckService';

interface HealthStatusProps {
  showDetails?: boolean;
}

export const HealthStatus: React.FC<HealthStatusProps> = ({ showDetails = false }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState<IHealthStatus | null>(null);

  const checkHealth = async () => {
    try {
      setLoading(true);
      setError(null);
      const status = await HealthCheckService.checkHealth();
      setHealthStatus(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Health check failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const getStatusColor = (status: 'healthy' | 'unhealthy') => {
    return status === 'healthy' ? '#4CAF50' : '#F44336';
  };

  const getStatusIcon = (status: 'healthy' | 'unhealthy') => {
    return status === 'healthy' ? '✅' : '❌';
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2196F3" testID="loading-indicator" />
        <Text style={styles.loadingText}>Checking health status...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Health Check Failed</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={checkHealth}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!healthStatus) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No health data available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Overall Status */}
      <View style={styles.statusCard}>
        <Text style={styles.title}>System Health</Text>
        <View style={styles.statusRow}>
          <Text style={styles.statusIcon}>
            {getStatusIcon(healthStatus.overall)}
          </Text>
          <Text
            style={[
              styles.statusText,
              { color: getStatusColor(healthStatus.overall) }
            ]}
          >
            {healthStatus.overall.toUpperCase()}
          </Text>
        </View>
      </View>

      {showDetails && (
        <>
          {/* App Status */}
          <View style={styles.statusCard}>
            <Text style={styles.cardTitle}>Application</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Name:</Text>
              <Text style={styles.detailValue}>{healthStatus.app.name}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Version:</Text>
              <Text style={styles.detailValue}>{healthStatus.app.version}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Uptime:</Text>
              <Text style={styles.detailValue}>{healthStatus.app.uptime}s</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status:</Text>
              <Text
                style={[
                  styles.detailValue,
                  { color: getStatusColor(healthStatus.app.status) }
                ]}
              >
                {getStatusIcon(healthStatus.app.status)} {healthStatus.app.status}
              </Text>
            </View>
          </View>

          {/* Database Status */}
          <View style={styles.statusCard}>
            <Text style={styles.cardTitle}>Database</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Connected:</Text>
              <Text style={styles.detailValue}>
                {healthStatus.database.connected ? 'Yes' : 'No'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Version:</Text>
              <Text style={styles.detailValue}>
                {healthStatus.database.version || 'Unknown'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Tables:</Text>
              <Text style={styles.detailValue}>
                {healthStatus.database.tablesCount}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status:</Text>
              <Text
                style={[
                  styles.detailValue,
                  { color: getStatusColor(healthStatus.database.status) }
                ]}
              >
                {getStatusIcon(healthStatus.database.status)} {healthStatus.database.status}
              </Text>
            </View>
          </View>

          {/* System Info */}
          <View style={styles.statusCard}>
            <Text style={styles.cardTitle}>System</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Platform:</Text>
              <Text style={styles.detailValue}>{healthStatus.system.platform}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Timestamp:</Text>
              <Text style={styles.detailValue}>
                {new Date(healthStatus.system.timestamp).toLocaleString()}
              </Text>
            </View>
          </View>
        </>
      )}

      <TouchableOpacity style={styles.refreshButton} onPress={checkHealth}>
        <Text style={styles.refreshButtonText}>Refresh Health Status</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  statusText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '400',
  },
  refreshButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#FF9800',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
  errorText: {
    fontSize: 18,
    color: '#F44336',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default HealthStatus;