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
import { useSessionStore } from '../../stores/sessionStore';
import { useMemoryManagement } from '../../hooks/useMemoryManagement';
import { useTheme } from '../../contexts/ThemeContext';
import { DarkPokerColors } from '../../styles/darkTheme.styles';
import { AmountInputModal } from '../../components/common/AmountInputModal';
import { PlayerActionButtons } from '../../components/poker/PlayerActionButtons';
import { ServiceError, ErrorCode } from '../../types/errors';
import { Player } from '../../types/player';

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

  // Modal state for transaction input
  const [modalState, setModalState] = useState<{
    visible: boolean;
    transactionType: 'buy_in' | 'cash_out' | null;
    selectedPlayer: Player | null;
  }>({
    visible: false,
    transactionType: null,
    selectedPlayer: null
  });
  
  // Transaction loading state
  const [transactionLoading, setTransactionLoading] = useState(false);
  
  // Organizer confirmation state
  const [showOrganizerConfirmation, setShowOrganizerConfirmation] = useState(false);
  const [pendingCashOut, setPendingCashOut] = useState<{ player: Player; amount: number } | null>(null);

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

  // Player action button handlers
  const handleBuyInPress = useCallback((playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (player) {
      setModalState({
        visible: true,
        transactionType: 'buy_in',
        selectedPlayer: player
      });
    }
  }, [players]);

  const handleCashOutPress = useCallback((playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (player) {
      setModalState({
        visible: true,
        transactionType: 'cash_out',
        selectedPlayer: player
      });
    }
  }, [players]);

  // Modal handlers
  const handleModalCancel = useCallback(() => {
    setModalState({
      visible: false,
      transactionType: null,
      selectedPlayer: null
    });
  }, []);

  const handleModalSubmit = useCallback(async (amount: number): Promise<void> => {
    if (!modalState.selectedPlayer || !modalState.transactionType) {
      return;
    }

    setTransactionLoading(true);
    
    try {
      if (modalState.transactionType === 'buy_in') {
        await recordBuyIn(sessionId, modalState.selectedPlayer.id, amount);
        
        Alert.alert(
          'Success',
          `Buy-in of $${amount.toFixed(2)} recorded for ${modalState.selectedPlayer.name}!`,
          [{ text: 'OK' }]
        );
      } else {
        await recordCashOut(sessionId, modalState.selectedPlayer.id, amount);
        
        Alert.alert(
          'Success',
          `Cash-out of $${amount.toFixed(2)} recorded for ${modalState.selectedPlayer.name}!`,
          [{ text: 'OK' }]
        );
      }
      
      // Close modal on success
      handleModalCancel();
      
    } catch (error) {
      console.error('Transaction submission failed:', error);
      
      // Handle organizer confirmation requirement
      if (error instanceof ServiceError && error.code === ErrorCode.ORGANIZER_CONFIRMATION_REQUIRED) {
        setPendingCashOut({ player: modalState.selectedPlayer, amount });
        setShowOrganizerConfirmation(true);
        handleModalCancel(); // Close amount modal
        return;
      }
      
      Alert.alert(
        'Error',
        error instanceof ServiceError ? error.message : `Failed to record ${modalState.transactionType.replace('_', '-')}. Please try again.`,
        [{ text: 'OK' }]
      );
      throw error;
    } finally {
      setTransactionLoading(false);
    }
  }, [modalState, sessionId, recordBuyIn, recordCashOut, handleModalCancel]);

  // Organizer confirmation handlers
  const handleOrganizerConfirmation = useCallback(async (confirmed: boolean) => {
    setShowOrganizerConfirmation(false);
    
    if (!confirmed || !pendingCashOut) {
      setPendingCashOut(null);
      return;
    }

    setTransactionLoading(true);
    
    try {
      await recordCashOut(sessionId, pendingCashOut.player.id, pendingCashOut.amount, true);
      
      Alert.alert(
        'Success',
        `Cash-out of $${pendingCashOut.amount.toFixed(2)} recorded for ${pendingCashOut.player.name} with organizer approval!`,
        [{ text: 'OK' }]
      );
      
      setPendingCashOut(null);
      
    } catch (error) {
      console.error('Confirmed cash-out submission failed:', error);
      Alert.alert(
        'Error',
        error instanceof ServiceError ? error.message : 'Failed to record cash-out. Please try again.',
        [{ text: 'OK' }]
      );
      setPendingCashOut(null);
    } finally {
      setTransactionLoading(false);
    }
  }, [pendingCashOut, sessionId, recordCashOut]);

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
      setModalState({
        visible: false,
        transactionType: null,
        selectedPlayer: null
      });
      setShowOrganizerConfirmation(false);
      setPendingCashOut(null);
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
                <View style={styles.playerActions}>
                  <Text style={[
                    styles.statusText, 
                    player.status === 'active' ? styles.statusActive : styles.statusCashedOut
                  ]}>
                    {player.status === 'active' ? '●' : '○'}
                  </Text>
                  <PlayerActionButtons
                    player={player}
                    onBuyInPress={handleBuyInPress}
                    onCashOutPress={handleCashOutPress}
                    disabled={transactionLoading}
                  />
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noPlayersText}>No players in this session</Text>
          )}
        </View>


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
      
      {/* Amount Input Modal */}
      <AmountInputModal
        visible={modalState.visible}
        transactionType={modalState.transactionType || 'buy_in'}
        playerName={modalState.selectedPlayer?.name || ''}
        currentBalance={modalState.selectedPlayer?.currentBalance || 0}
        onSubmit={handleModalSubmit}
        onCancel={handleModalCancel}
        loading={transactionLoading}
      />
      
      {/* Organizer Confirmation Modal */}
      {showOrganizerConfirmation && pendingCashOut && (
        <View style={[styles.organizerModalOverlay, { backgroundColor: isDarkMode ? DarkPokerColors.overlay : 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[styles.organizerModalContainer, { backgroundColor: isDarkMode ? DarkPokerColors.modalBackground : '#FFFFFF' }]}>
            <Text style={[styles.organizerModalTitle, { color: isDarkMode ? DarkPokerColors.primaryText : '#2C3E50' }]}>Organizer Confirmation Required</Text>
            <Text style={[styles.organizerModalMessage, { color: isDarkMode ? DarkPokerColors.secondaryText : '#34495E' }]}>
              Cash-out amount ${pendingCashOut.amount.toFixed(2)} exceeds {pendingCashOut.player.name}'s total buy-ins. 
              Do you want to proceed as the organizer?
            </Text>
            <View style={styles.organizerModalButtons}>
              <TouchableOpacity
                style={[styles.organizerModalButton, styles.organizerModalButtonCancel]}
                onPress={() => handleOrganizerConfirmation(false)}
              >
                <Text style={styles.organizerModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.organizerModalButton, styles.organizerModalButtonConfirm]}
                onPress={() => handleOrganizerConfirmation(true)}
              >
                <Text style={styles.organizerModalButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
  
  playerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  
  // Organizer confirmation modal styles
  organizerModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  organizerModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    margin: 20,
    maxWidth: 400,
    width: '90%',
  },
  organizerModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
    textAlign: 'center',
  },
  organizerModalMessage: {
    fontSize: 16,
    color: '#34495E',
    marginBottom: 24,
    lineHeight: 22,
    textAlign: 'center',
  },
  organizerModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  organizerModalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  organizerModalButtonCancel: {
    backgroundColor: '#95A5A6',
  },
  organizerModalButtonConfirm: {
    backgroundColor: '#E67E22',
  },
  organizerModalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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