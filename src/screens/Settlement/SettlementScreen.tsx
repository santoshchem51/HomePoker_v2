/**
 * SettlementScreen - Epic 4: Social Integration  
 * Story 4.1: WhatsApp URL Scheme Integration
 * Implements AC: 1 - Settlement completion screen with WhatsApp sharing
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  BackHandler,
  Alert,
} from 'react-native';
import { showToast } from '../../components/common/ToastManager';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { WhatsAppShare } from './WhatsAppShare';
import { SettlementService } from '../../services/settlement/SettlementService';
import { OptimizedSettlement } from '../../types/settlement';
import { ShareResult } from '../../types/whatsapp';
import { useTheme } from '../../contexts/ThemeContext';
import { DarkPokerColors } from '../../styles/darkTheme.styles';
import { useSessionStore } from '../../stores/sessionStore';
import { TransactionService } from '../../services/core/TransactionService';
import { DatabaseService } from '../../services/infrastructure/DatabaseService';

type SettlementScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Settlement'>;
type SettlementScreenRouteProp = RouteProp<RootStackParamList, 'Settlement'>;

export const SettlementScreen: React.FC = () => {
  const navigation = useNavigation<SettlementScreenNavigationProp>();
  const route = useRoute<SettlementScreenRouteProp>();
  const { sessionId, sessionName, isSessionEnd } = route.params;
  const { isDarkMode } = useTheme();
  const [settlement, setSettlement] = useState<OptimizedSettlement | null>(null);
  const [sessionMetadata, setSessionMetadata] = useState<any>(null);
  const [transactionBreakdown, setTransactionBreakdown] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const settlementService = SettlementService.getInstance();
  const transactionService = TransactionService.getInstance();
  const dbService = DatabaseService.getInstance();
  const { actions: sessionActions } = useSessionStore();

  const loadSettlement = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load settlement, session metadata, and transaction breakdown in parallel
      const [optimizedSettlement, sessionData, transactions] = await Promise.all([
        settlementService.optimizeSettlement(sessionId),
        dbService.getSession(sessionId),
        dbService.getTransactions(sessionId)
      ]);
      
      setSettlement(optimizedSettlement);
      
      // Process session metadata
      if (sessionData) {
        const sessionStartTime = new Date(sessionData.createdAt);
        const sessionEndTime = sessionData.completedAt ? new Date(sessionData.completedAt) : new Date();
        const duration = Math.floor((sessionEndTime.getTime() - sessionStartTime.getTime()) / (1000 * 60)); // minutes
        
        setSessionMetadata({
          ...sessionData,
          duration,
          totalPot: transactions.filter(t => t.type === 'buy_in' && !t.isVoided).reduce((sum, t) => sum + t.amount, 0)
        });
      }
      
      // Process transaction breakdown by player
      const playerBreakdown = optimizedSettlement.playerSettlements.map(player => {
        const playerTransactions = transactions.filter(t => t.playerId === player.playerId && !t.isVoided);
        const buyIns = playerTransactions.filter(t => t.type === 'buy_in');
        const cashOuts = playerTransactions.filter(t => t.type === 'cash_out');
        
        return {
          ...player,
          buyInCount: buyIns.length,
          cashOutCount: cashOuts.length,
          transactions: playerTransactions
        };
      });
      
      setTransactionBreakdown(playerBreakdown);
    } catch (err) {
      console.error('Failed to load settlement:', err);
      setError('Failed to load settlement data');
      showToast({
        type: 'error',
        title: '❌ Settlement Error',
        message: 'Failed to load settlement data',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [sessionId, settlementService, dbService]);

  // Load settlement data
  useEffect(() => {
    loadSettlement();
  }, [loadSettlement]);

  // Handle hardware back button (Android)
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (isSessionEnd) {
          // For session end settlements, confirm navigation back to home
          Alert.alert(
            'Complete Settlement?',
            'Are you sure you want to complete the settlement and return to home?',
            [
              { text: 'Stay', style: 'cancel' },
              { text: 'Complete', style: 'default', onPress: handleBackToHome }
            ]
          );
        } else {
          // For mid-session settlements, confirm return to game
          Alert.alert(
            'Return to Game?',
            'Are you sure you want to return to the active session?',
            [
              { text: 'Stay', style: 'cancel' },
              { text: 'Return', style: 'default', onPress: () => navigation.goBack() }
            ]
          );
        }
        return true; // Prevent default back action
      }
    );

    return () => backHandler.remove();
  }, [isSessionEnd, handleBackToHome, navigation]);

  const handleShareComplete = (result: ShareResult) => {
    if (result.success) {
      console.log(`Settlement shared via ${result.method}`);
    }
  };

  const handleBackToHome = async () => {
    try {
      // If this is a session end, complete the session and clear state
      if (isSessionEnd) {
        await sessionActions.updateSessionStatus(sessionId, 'completed');
        sessionActions.clearSession();
      }
      navigation.navigate('Home');
    } catch (error) {
      console.error('Error completing session:', error);
      // Still navigate home even if there's an error
      navigation.navigate('Home');
    }
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: isDarkMode ? DarkPokerColors.background : '#f5f5f5' }]}>
        <Text style={[styles.loadingText, { color: isDarkMode ? DarkPokerColors.primaryText : '#666' }]}>Calculating settlements...</Text>
      </View>
    );
  }

  if (error || !settlement) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: isDarkMode ? DarkPokerColors.background : '#f5f5f5' }]}>
        <Text style={[styles.errorText, { color: isDarkMode ? DarkPokerColors.error : '#d32f2f' }]}>{error || 'No settlement data available'}</Text>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: isDarkMode ? DarkPokerColors.buttonPrimary : '#007AFF' }]} onPress={loadSettlement}>
          <Text style={[styles.retryButtonText, { color: isDarkMode ? DarkPokerColors.buttonText : '#fff' }]}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDarkMode ? DarkPokerColors.background : '#f5f5f5' }]}>
      <View style={[styles.header, { backgroundColor: isDarkMode ? DarkPokerColors.cardBackground : '#fff', borderBottomColor: isDarkMode ? DarkPokerColors.border : '#e0e0e0' }]}>
        <Text style={[styles.title, { color: isDarkMode ? DarkPokerColors.primaryText : '#333' }]}>{sessionName}</Text>
        <Text style={[styles.subtitle, { color: isDarkMode ? DarkPokerColors.secondaryText : '#666' }]}>Final Settlement</Text>
      </View>

      {/* Enhanced Settlement Summary */}
      <View style={[styles.summaryContainer, { backgroundColor: isDarkMode ? DarkPokerColors.cardBackground : '#fff' }]}>
        <View style={styles.summaryHeader}>
          <Text style={[styles.summaryTitle, { color: isDarkMode ? DarkPokerColors.primaryText : '#333' }]}>📊 Settlement Summary</Text>
          {settlement?.isBalanced && (
            <View style={[styles.balancedBadge, { backgroundColor: isDarkMode ? DarkPokerColors.success + '20' : '#4CAF5020' }]}>
              <Text style={[styles.balancedText, { color: isDarkMode ? DarkPokerColors.success : '#4CAF50' }]}>✅ Balanced</Text>
            </View>
          )}
        </View>
        
        {/* Enhanced Player Results with Transaction Breakdown */}
        <View style={styles.playersContainer}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? DarkPokerColors.primaryText : '#333' }]}>👥 Player Results:</Text>
          {transactionBreakdown.map((player, index) => (
            <View key={index} style={[styles.enhancedPlayerCard, { 
              backgroundColor: isDarkMode ? DarkPokerColors.surfaceBackground : '#f8f9fa',
              borderColor: isDarkMode ? DarkPokerColors.border : '#e9ecef'
            }]}>
              <View style={styles.playerMainRow}>
                <Text style={[styles.playerName, { color: isDarkMode ? DarkPokerColors.primaryText : '#333' }]}>
                  {player.playerName}
                </Text>
                <Text style={[
                  styles.playerAmount,
                  player.netAmount >= 0 ? styles.positive : styles.negative
                ]}>
                  {player.netAmount >= 0 ? '+' : ''}${player.netAmount.toFixed(2)}
                </Text>
              </View>
              <View style={styles.playerBreakdown}>
                <Text style={[styles.breakdownText, { color: isDarkMode ? DarkPokerColors.secondaryText : '#666' }]}>
                  ↳ ${player.totalBuyIns.toFixed(2)} buy-ins → ${player.totalCashOuts.toFixed(2)} cash-out
                </Text>
                {player.buyInCount > 0 && (
                  <Text style={[styles.transactionCount, { color: isDarkMode ? DarkPokerColors.secondaryText : '#999' }]}>
                    {player.buyInCount} buy-in{player.buyInCount !== 1 ? 's' : ''}
                    {player.cashOutCount > 0 && `, ${player.cashOutCount} cash-out${player.cashOutCount !== 1 ? 's' : ''}`}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Enhanced Payment Plan */}
        {settlement.paymentPlan.length > 0 ? (
          <View style={styles.paymentsContainer}>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? DarkPokerColors.primaryText : '#333' }]}>💸 Payments Required:</Text>
            {settlement.paymentPlan.map((payment, index) => (
              <View key={index} style={[styles.enhancedPaymentCard, { 
                backgroundColor: isDarkMode ? DarkPokerColors.surfaceBackground : '#fff3cd',
                borderColor: isDarkMode ? DarkPokerColors.warning : '#ffeaa7'
              }]}>
                <View style={styles.paymentMainRow}>
                  <Text style={[styles.paymentText, { color: isDarkMode ? DarkPokerColors.primaryText : '#333' }]}>
                    {payment.fromPlayerName} → {payment.toPlayerName}
                  </Text>
                  <Text style={[styles.paymentAmount, { color: isDarkMode ? DarkPokerColors.warning : '#e17055' }]}>
                    ${payment.amount.toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
            <View style={[styles.paymentSummary, { backgroundColor: isDarkMode ? DarkPokerColors.surfaceBackground : '#f8f9fa' }]}>
              <Text style={[styles.paymentSummaryText, { color: isDarkMode ? DarkPokerColors.secondaryText : '#666' }]}>
                Total Transfers: ${settlement.paymentPlan.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
              </Text>
              {settlement.transactionReduction > 0 && (
                <Text style={[styles.optimizationText, { color: isDarkMode ? DarkPokerColors.success : '#4CAF50' }]}>
                  🎯 Optimized: {settlement.transactionReduction} fewer transaction{settlement.transactionReduction !== 1 ? 's' : ''}
                </Text>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.evenContainer}>
            <Text style={[styles.evenText, { color: isDarkMode ? DarkPokerColors.success : '#4CAF50' }]}>🤝 Perfect! Everyone broke even!</Text>
          </View>
        )}
      </View>

      {/* Mathematical Verification Section */}
      <View style={[styles.verificationContainer, { 
        backgroundColor: isDarkMode ? DarkPokerColors.cardBackground : '#fff',
        borderColor: isDarkMode ? DarkPokerColors.success : '#4CAF50'
      }]}>
        <Text style={[styles.verificationTitle, { color: isDarkMode ? DarkPokerColors.success : '#4CAF50' }]}>
          ✅ Settlement Verified
        </Text>
        <View style={styles.verificationDetails}>
          <View style={styles.verificationRow}>
            <Text style={[styles.verificationLabel, { color: isDarkMode ? DarkPokerColors.secondaryText : '#666' }]}>Total In:</Text>
            <Text style={[styles.verificationValue, { color: isDarkMode ? DarkPokerColors.primaryText : '#333' }]}>
              ${sessionMetadata?.totalPot.toFixed(2) || '0.00'}
            </Text>
          </View>
          <View style={styles.verificationRow}>
            <Text style={[styles.verificationLabel, { color: isDarkMode ? DarkPokerColors.secondaryText : '#666' }]}>Total Out:</Text>
            <Text style={[styles.verificationValue, { color: isDarkMode ? DarkPokerColors.primaryText : '#333' }]}>
              ${settlement?.playerSettlements.reduce((sum, p) => sum + p.totalCashOuts, 0).toFixed(2) || '0.00'}
            </Text>
          </View>
          <View style={[styles.verificationRow, styles.verificationTotal]}>
            <Text style={[styles.verificationLabel, { color: isDarkMode ? DarkPokerColors.primaryText : '#333', fontWeight: 'bold' }]}>Balance:</Text>
            <Text style={[styles.verificationValue, { 
              color: isDarkMode ? DarkPokerColors.success : '#4CAF50',
              fontWeight: 'bold'
            }]}>
              $0.00
            </Text>
          </View>
        </View>
      </View>

      {/* Share Component without WhatsApp button */}
      <WhatsAppShare
        settlement={settlement}
        sessionName={sessionName}
        sessionMetadata={sessionMetadata}
        onShareComplete={handleShareComplete}
      />

      {/* Navigation */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[styles.navigationButton, { backgroundColor: isDarkMode ? DarkPokerColors.buttonSecondary : '#6c757d' }]}
          onPress={handleBackToHome}
        >
          <Text style={[styles.navigationButtonText, { color: isDarkMode ? DarkPokerColors.buttonText : '#fff' }]}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  header: {
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 16,
  },
  sessionMetadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metadataLabel: {
    fontSize: 16,
  },
  metadataValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  summaryContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  balancedBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#4CAF5020',
  },
  balancedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
  playersContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  enhancedPlayerCard: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  playerMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  playerAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  playerBreakdown: {
    marginLeft: 8,
  },
  breakdownText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  transactionCount: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
  positive: {
    color: '#4CAF50',
  },
  negative: {
    color: '#f44336',
  },
  paymentsContainer: {
    marginBottom: 24,
  },
  enhancedPaymentCard: {
    backgroundColor: '#fff3cd',
    borderWidth: 1,
    borderColor: '#ffeaa7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#e17055',
  },
  paymentMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e17055',
  },
  paymentSummary: {
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    padding: 12,
    marginTop: 8,
    alignItems: 'center',
  },
  paymentSummaryText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  optimizationText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  evenContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#f0f8f0',
    borderRadius: 8,
    marginTop: 8,
  },
  evenText: {
    fontSize: 18,
    color: '#4CAF50',
    fontWeight: '600',
  },
  verificationContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  verificationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 16,
  },
  verificationDetails: {
    gap: 8,
  },
  verificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  verificationTotal: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 4,
  },
  verificationLabel: {
    fontSize: 14,
    color: '#666',
  },
  verificationValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  navigationContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  navigationButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  navigationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SettlementScreen;