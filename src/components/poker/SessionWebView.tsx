/**
 * SessionWebView - Simple mobile web view component for player balance display
 * Implements Story 2.4 requirements for mobile web interface
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SessionUrlService, RefreshResponse } from '../../services/integration/SessionUrlService';
import { ServiceError } from '../../services/core/ServiceError';

export interface SessionWebViewProps {
  sessionId: string;
  playerId: string;
  onSessionExpired?: () => void;
  onError?: (error: string) => void;
}

export interface TransactionHistoryItem {
  id: string;
  type: 'buy_in' | 'cash_out';
  amount: number;
  timestamp: Date;
  description: string;
}

export const SessionWebView: React.FC<SessionWebViewProps> = ({
  sessionId,
  playerId,
  onSessionExpired,
  onError
}) => {
  const [balanceData, setBalanceData] = useState<RefreshResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  
  const sessionUrlService = SessionUrlService.getInstance();

  /**
   * Load player balance data
   * AC: 2 - Scanning opens mobile-optimized web page showing player's current balance
   */
  const loadBalanceData = useCallback(async (showLoading: boolean = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      const response = await sessionUrlService.getPlayerBalance(sessionId, playerId);
      setBalanceData(response);
      setLastRefresh(new Date());
    } catch (err) {
      const errorMessage = err instanceof ServiceError 
        ? err.message 
        : 'Failed to load balance data';
      
      setError(errorMessage);
      
      // Handle session expiration
      if (errorMessage.includes('Session has ended') || errorMessage.includes('not found')) {
        onSessionExpired?.();
      }
      
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [sessionId, playerId, sessionUrlService, onSessionExpired, onError]);

  /**
   * Manual refresh functionality
   * AC: 3 - Balance updates when organizer manually refreshes (no real-time updates)
   */
  const handleManualRefresh = async () => {
    try {
      setRefreshing(true);
      await loadBalanceData(false);
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * Format currency amount
   */
  const formatCurrency = (amount: number): string => {
    return `$${Math.abs(amount).toFixed(2)}`;
  };

  /**
   * Get balance color based on positive/negative value
   */
  const getBalanceColor = (balance: number): string => {
    if (balance > 0) return '#2e7d32'; // Green for positive
    if (balance < 0) return '#d32f2f'; // Red for negative
    return '#666'; // Gray for zero
  };

  /**
   * Format last update time
   */
  const formatLastUpdate = (): string => {
    const now = new Date();
    const diffMs = now.getTime() - lastRefresh.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    return lastRefresh.toLocaleDateString();
  };

  // Load balance data on component mount
  useEffect(() => {
    loadBalanceData();
  }, [sessionId, playerId, loadBalanceData]);

  // Session expiration check
  useEffect(() => {
    if (balanceData && !balanceData.sessionActive) {
      onSessionExpired?.();
    }
  }, [balanceData, onSessionExpired]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0f3460" />
          <Text style={styles.loadingText}>Loading balance...</Text>
        </View>
      </View>
    );
  }

  if (error && !balanceData) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity 
            onPress={() => loadBalanceData()} 
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.sessionName}>
            {balanceData?.sessionName || 'Poker Session'}
          </Text>
          <View style={styles.statusIndicator}>
            <View style={[
              styles.statusDot,
              balanceData?.sessionActive ? styles.statusDotActive : styles.statusDotInactive
            ]} />
            <Text style={styles.statusText}>
              {balanceData?.sessionActive ? 'Active' : 'Ended'}
            </Text>
          </View>
        </View>

        {/* Player Info */}
        <View style={styles.playerCard}>
          <Text style={styles.playerLabel}>Player</Text>
          <Text style={styles.playerName}>
            {balanceData?.playerName || 'Unknown'}
          </Text>
        </View>

        {/* Balance Display */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={[
            styles.balanceAmount,
            { color: getBalanceColor(balanceData?.balance || 0) }
          ]}>
            {balanceData?.balance !== undefined 
              ? (balanceData.balance >= 0 
                  ? `+${formatCurrency(balanceData.balance)}`
                  : `-${formatCurrency(balanceData.balance)}`)
              : '$0.00'
            }
          </Text>
          
          {balanceData?.balance !== undefined && (
            <Text style={styles.balanceDescription}>
              {balanceData.balance > 0 && 'You are ahead'}
              {balanceData.balance === 0 && 'You are even'}
              {balanceData.balance < 0 && 'You owe money'}
            </Text>
          )}
        </View>

        {/* Last Update Info */}
        <View style={styles.updateCard}>
          <Text style={styles.updateLabel}>Last Updated</Text>
          <Text style={styles.updateTime}>{formatLastUpdate()}</Text>
          {error && (
            <Text style={styles.updateError}>
              Last refresh failed: {error}
            </Text>
          )}
        </View>

        {/* Manual Refresh Button */}
        <View style={styles.refreshContainer}>
          <TouchableOpacity 
            onPress={handleManualRefresh}
            disabled={refreshing || !balanceData?.sessionActive}
            style={[
              styles.refreshButton,
              (!balanceData?.sessionActive || refreshing) && styles.refreshButtonDisabled
            ]}
          >
            <Text style={[
              styles.refreshButtonText,
              (!balanceData?.sessionActive || refreshing) && styles.refreshButtonTextDisabled
            ]}>
              {refreshing ? 'Refreshing...' : 'Refresh Balance'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Session Status Message */}
        {!balanceData?.sessionActive && (
          <View style={styles.expiredCard}>
            <Text style={styles.expiredTitle}>Session Ended</Text>
            <Text style={styles.expiredMessage}>
              This session has been completed by the organizer. 
              Balance information is no longer updating.
            </Text>
          </View>
        )}

      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Balance updates manually • No real-time sync
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#0f3460',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  header: {
    backgroundColor: '#0f3460',
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  sessionName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusDotActive: {
    backgroundColor: '#4caf50',
  },
  statusDotInactive: {
    backgroundColor: '#f44336',
  },
  statusText: {
    fontSize: 14,
    color: '#a8c8e6',
  },
  playerCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  playerLabel: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 5,
  },
  playerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f3460',
  },
  balanceCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 15,
    paddingVertical: 25,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  balanceDescription: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  updateCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 15,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  updateLabel: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 5,
  },
  updateTime: {
    fontSize: 14,
    color: '#333',
  },
  updateError: {
    fontSize: 12,
    color: '#d32f2f',
    marginTop: 5,
    textAlign: 'center',
  },
  refreshContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  refreshButton: {
    backgroundColor: '#0f3460',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshButtonDisabled: {
    backgroundColor: '#ccc',
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  refreshButtonTextDisabled: {
    color: '#999',
  },
  expiredCard: {
    backgroundColor: '#fff3e0',
    borderWidth: 1,
    borderColor: '#ffb74d',
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  expiredTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e65100',
    marginBottom: 5,
  },
  expiredMessage: {
    fontSize: 14,
    color: '#bf360c',
    lineHeight: 20,
  },
  footer: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  footerText: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
  },
});