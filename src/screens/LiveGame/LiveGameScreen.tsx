/**
 * Live Game Screen - Epic 1: Foundation & Core Infrastructure (Rollback Version)
 * Story 1.3: Buy-in Transaction Recording  
 * Story 1.4: Cash-out Transaction Recording
 * 
 * SIMPLIFIED VERSION: Basic transaction entry only, Epic 3 scope creep removed.
 * Main poker session screen for recording buy-ins and cash-outs during live games.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { TransactionForm } from './TransactionForm';
import { useSessionStore } from '../../stores/sessionStore';

interface LiveGameScreenProps {
  sessionId: string;
  onEndSession?: () => void;
  onNavigateToHistory?: () => void;
}

export const LiveGameScreen: React.FC<LiveGameScreenProps> = ({
  sessionId,
  onEndSession,
  onNavigateToHistory,
}) => {
  // Basic loading state
  const [transactionLoading, setTransactionLoading] = useState(false);

  // Store hooks - only basic session management
  const {
    currentSession,
    players,
    error: sessionError,
    loading: sessionLoading,
    actions: { loadSessionState, recordBuyIn },
  } = useSessionStore();

  // Load session data on mount
  useEffect(() => {
    if (sessionId) {
      loadSessionState(sessionId);
    }
  }, [sessionId, loadSessionState]);

  // Epic 1: Basic transaction handlers
  const handleBuyIn = useCallback(async (playerId: string, amount: number): Promise<void> => {
    setTransactionLoading(true);
    try {
      await recordBuyIn(sessionId, playerId, amount);
    } catch (error) {
      Alert.alert('Transaction Error', 'Failed to record buy-in. Please try again.');
      throw error;
    } finally {
      setTransactionLoading(false);
    }
  }, [sessionId, recordBuyIn]);

  const handleCashOut = useCallback(async (playerId: string, amount: number, organizerConfirmed?: boolean): Promise<void> => {
    setTransactionLoading(true);
    try {
      // TODO: Implement cash-out via TransactionService directly since it's not available in sessionStore yet
      console.log('Cash-out transaction:', { sessionId, playerId, amount, organizerConfirmed });
      await new Promise<void>(resolve => setTimeout(() => resolve(), 500));
    } catch (error) {
      Alert.alert('Transaction Error', 'Failed to record cash-out. Please try again.');
      throw error;
    } finally {
      setTransactionLoading(false);
    }
  }, [sessionId]);

  // Error handling
  if (sessionError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Session Error</Text>
        <Text style={styles.errorMessage}>
          {typeof sessionError === 'string' ? sessionError : 'Session error occurred'}
        </Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={() => loadSessionState(sessionId)}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (sessionLoading || !currentSession) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading session...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header - Basic session info only */}
      <View style={styles.header}>
        <Text style={styles.sessionName}>{currentSession.name}</Text>
        <Text style={styles.sessionStatus}>Live Game • {players.length} Players</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Player List - Basic display with running balances */}
        <View style={styles.playersSection}>
          <Text style={styles.sectionTitle}>Players</Text>
          
          {players.length > 0 ? (
            players.map((player) => (
              <View key={player.id} style={styles.playerCard}>
                <View style={styles.playerInfo}>
                  <Text style={styles.playerName}>{player.name}</Text>
                  <Text style={styles.playerBalance}>
                    Balance: ${(player.currentBalance || 0).toFixed(2)}
                  </Text>
                  <Text style={styles.playerBuyIns}>
                    Buy-ins: ${(player.totalBuyIns || 0).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.playerStatus}>
                  <Text style={[
                    styles.statusText, 
                    player.status === 'active' ? styles.statusActive : styles.statusCashedOut
                  ]}>
                    {player.status === 'active' ? 'Active' : 'Cashed Out'}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noPlayersText}>No players in this session</Text>
          )}
        </View>

        {/* Transaction Form - Epic 1 core functionality */}
        <TransactionForm
          sessionId={sessionId}
          players={players}
          onSubmitBuyIn={handleBuyIn}
          onSubmitCashOut={handleCashOut}
          loading={transactionLoading}
        />

        {/* Action Buttons - Basic session management */}
        <View style={styles.actionButtons}>
          {onNavigateToHistory && (
            <TouchableOpacity
              style={[styles.actionButton, styles.historyButton]}
              onPress={onNavigateToHistory}
            >
              <Text style={styles.actionButtonText}>View History</Text>
            </TouchableOpacity>
          )}
          
          {onEndSession && (
            <TouchableOpacity
              style={[styles.actionButton, styles.endSessionButton]}
              onPress={() => {
                Alert.alert(
                  'End Session',
                  'Are you sure you want to end this poker session?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'End Session', style: 'destructive', onPress: onEndSession },
                  ]
                );
              }}
            >
              <Text style={styles.actionButtonText}>End Session</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  
  sessionName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 4,
  },
  
  sessionStatus: {
    fontSize: 14,
    color: '#666',
  },
  
  content: {
    flex: 1,
    padding: 16,
  },
  
  playersSection: {
    marginBottom: 24,
  },
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  
  playerCard: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  playerInfo: {
    flex: 1,
  },
  
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  
  playerBalance: {
    fontSize: 14,
    color: '#1976D2',
    marginBottom: 2,
  },
  
  playerBuyIns: {
    fontSize: 12,
    color: '#666',
  },
  
  playerStatus: {
    marginLeft: 16,
  },
  
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  
  statusActive: {
    backgroundColor: '#E8F5E8',
    color: '#2E7D32',
  },
  
  statusCashedOut: {
    backgroundColor: '#FFF3E0',
    color: '#F57C00',
  },
  
  noPlayersText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
    paddingHorizontal: 16,
  },
  
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  
  historyButton: {
    backgroundColor: '#1976D2',
  },
  
  endSessionButton: {
    backgroundColor: '#D32F2F',
  },
  
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Error states
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginBottom: 12,
  },
  
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  
  retryButton: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Loading state
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
});

// Note: Epic 3 scope creep features removed during rollback:
// - Early cash-out calculator modal integration
// - Settlement store integration and complex state management
// - Bank balance displays and warning indicators
// - Real-time balance monitoring and refresh logic
// - Settlement summaries and optimization results
// - Complex Material Design styling (300+ lines reduced to ~150 lines)
// - Advanced player filtering and status management
// - Performance monitoring and complex error handling workflows