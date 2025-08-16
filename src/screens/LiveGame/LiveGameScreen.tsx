/**
 * Live Game Screen - Epic 1: Foundation & Core Infrastructure (Rollback Version)
 * Story 1.3: Buy-in Transaction Recording  
 * Story 1.4: Cash-out Transaction Recording
 * 
 * SIMPLIFIED VERSION: Basic transaction entry only, Epic 3 scope creep removed.
 * Main poker session screen for recording buy-ins and cash-outs during live games.
 */

import React, { useState, useCallback, useEffect, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { TransactionForm } from './TransactionForm';
import { useSessionStore } from '../../stores/sessionStore';
import { useMemoryManagement } from '../../hooks/useMemoryManagement';
import { useTheme } from '../../contexts/ThemeContext';
import { DarkPokerColors } from '../../styles/darkTheme.styles';

type LiveGameScreenNavigationProp = StackNavigationProp<RootStackParamList, 'LiveGame'>;
type LiveGameScreenRouteProp = RouteProp<RootStackParamList, 'LiveGame'>;

const LiveGameScreenComponent: React.FC = () => {
  const navigation = useNavigation<LiveGameScreenNavigationProp>();
  const route = useRoute<LiveGameScreenRouteProp>();
  const { sessionId, sessionName } = route.params;
  const { isDarkMode } = useTheme();
  
  // Memory management
  const { addCleanup, trackTimer } = useMemoryManagement({
    componentName: 'LiveGameScreen',
    enableAutoCleanup: true,
    cleanupDelay: 5000
  });

  // Basic loading state
  const [transactionLoading, setTransactionLoading] = useState(false);

  // Store hooks - only basic session management
  const {
    currentSession,
    players,
    error: sessionError,
    loading: sessionLoading,
    actions: { loadSessionState, recordBuyIn, recordCashOut },
  } = useSessionStore();

  // Load session data on mount
  useEffect(() => {
    if (sessionId) {
      loadSessionState(sessionId);
    }
  }, [sessionId, loadSessionState]);

  // Epic 1: Basic transaction handlers with memory management
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
      await recordCashOut(sessionId, playerId, amount, organizerConfirmed);
    } catch (error) {
      Alert.alert('Transaction Error', 'Failed to record cash-out. Please try again.');
      throw error;
    } finally {
      setTransactionLoading(false);
    }
  }, [sessionId, recordCashOut]);

  const handleEndSession = useCallback(async () => {
    try {
      // Check if any players are still active (haven't cashed out completely)
      const activePlayers = players.filter(player => player.status === 'active');
      
      if (activePlayers.length > 0) {
        const playerNames = activePlayers.map(p => p.name).join(', ');
        Alert.alert(
          'Players Still Active',
          `${playerNames} haven't cashed out yet. Please record their cash-outs before ending the session.`,
          [
            { text: 'OK', style: 'default' }
          ]
        );
        return;
      }

      // If no players have chips, proceed with normal end session confirmation
      Alert.alert(
        'End Session',
        'Are you sure you want to end this poker session?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'End Session', 
            style: 'destructive', 
            onPress: () => navigation.navigate('Settlement', { 
              sessionId, 
              sessionName,
              isSessionEnd: true
            })
          },
        ]
      );
    } catch (error) {
      console.error('Error checking session end state:', error);
      Alert.alert('Error', 'Failed to check session state. Please try again.');
    }
  }, [players, sessionId, sessionName, navigation]);

  // Setup cleanup for component state
  useEffect(() => {
    addCleanup(() => {
      setTransactionLoading(false);
    });
  }, [addCleanup]);

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
    <View style={[styles.container, { backgroundColor: isDarkMode ? DarkPokerColors.background : '#F5F5F5' }]}>
      {/* Header - Basic session info only */}
      <View style={[styles.header, { backgroundColor: isDarkMode ? DarkPokerColors.cardBackground : '#FFFFFF' }]}>
        <Text style={[styles.sessionName, { color: isDarkMode ? DarkPokerColors.primaryText : '#333' }]}>{currentSession.name}</Text>
        <Text style={[styles.sessionStatus, { color: isDarkMode ? DarkPokerColors.secondaryText : '#666' }]}>Live Game • {players.length} Players</Text>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* Player List - Basic display with running balances */}
        <View style={[styles.playersSection, { backgroundColor: isDarkMode ? DarkPokerColors.cardBackground : '#FFFFFF' }]}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? DarkPokerColors.primaryText : '#333' }]}>Players</Text>
          
          {players.length > 0 ? (
            players.map((player) => (
              <View key={player.id} style={[styles.playerCard, { backgroundColor: isDarkMode ? DarkPokerColors.surfaceBackground : '#F8F9FA' }]}>
                <View style={styles.playerInfo}>
                  <Text style={[styles.playerName, { color: isDarkMode ? DarkPokerColors.primaryText : '#333' }]}>{player.name}</Text>
                  <View style={styles.playerFinancials}>
                    <Text style={[styles.playerBalance, { color: isDarkMode ? DarkPokerColors.secondaryText : '#1976D2' }]}>
                      ${(player.currentBalance || 0).toFixed(2)}
                    </Text>
                    <Text style={[styles.playerBuyIns, { color: isDarkMode ? DarkPokerColors.secondaryText : '#666' }]}>
                      (${(player.totalBuyIns || 0).toFixed(2)} in)
                    </Text>
                  </View>
                </View>
                <View style={styles.playerStatus}>
                  <Text style={[
                    styles.statusText, 
                    player.status === 'active' ? styles.statusActive : styles.statusCashedOut
                  ]}>
                    {player.status === 'active' ? '●' : '○'}
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
          <TouchableOpacity
            style={[styles.actionButton, styles.historyButton]}
            onPress={() => navigation.navigate('SessionHistory')}
          >
            <Text style={styles.actionButtonText}>View History</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.endSessionButton]}
            onPress={handleEndSession}
          >
            <Text style={styles.actionButtonText}>End Session</Text>
          </TouchableOpacity>
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
  
  scrollContainer: {
    flex: 1,
  },
  
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Extra space for bottom content
  },
  
  playersSection: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
  },
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  
  playerCard: {
    backgroundColor: '#FFFFFF',
    padding: 8,
    marginBottom: 4,
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 50, // Reduced height for more players
  },
  
  playerInfo: {
    flex: 1,
  },
  
  playerFinancials: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  
  playerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  
  playerBalance: {
    fontSize: 13,
    color: '#1976D2',
    marginBottom: 1,
  },
  
  playerBuyIns: {
    fontSize: 11,
    color: '#666',
  },
  
  playerStatus: {
    marginLeft: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  statusActive: {
    color: '#2E7D32', // Green for active
  },
  
  statusCashedOut: {
    color: '#999', // Gray for cashed out
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

// Memoized export for performance optimization
export const LiveGameScreen = memo(LiveGameScreenComponent);

// Note: Epic 3 scope creep features removed during rollback:
// - Early cash-out calculator modal integration
// - Settlement store integration and complex state management
// - Bank balance displays and warning indicators
// - Real-time balance monitoring and refresh logic
// - Settlement summaries and optimization results
// - Complex Material Design styling (300+ lines reduced to ~150 lines)
// - Advanced player filtering and status management
// - Performance monitoring and complex error handling workflows