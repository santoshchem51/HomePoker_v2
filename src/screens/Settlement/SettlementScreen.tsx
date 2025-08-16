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
  Alert,
  TouchableOpacity,
} from 'react-native';
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

type SettlementScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Settlement'>;
type SettlementScreenRouteProp = RouteProp<RootStackParamList, 'Settlement'>;

export const SettlementScreen: React.FC = () => {
  const navigation = useNavigation<SettlementScreenNavigationProp>();
  const route = useRoute<SettlementScreenRouteProp>();
  const { sessionId, sessionName, isSessionEnd } = route.params;
  const { isDarkMode } = useTheme();
  const [settlement, setSettlement] = useState<OptimizedSettlement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const settlementService = SettlementService.getInstance();
  const { actions: sessionActions } = useSessionStore();

  const loadSettlement = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Generate optimized settlement
      const optimizedSettlement = await settlementService.optimizeSettlement(sessionId);
      setSettlement(optimizedSettlement);
    } catch (err) {
      console.error('Failed to load settlement:', err);
      setError('Failed to load settlement data');
      Alert.alert('Error', 'Failed to load settlement data');
    } finally {
      setLoading(false);
    }
  }, [sessionId, settlementService]);

  // Load settlement data
  useEffect(() => {
    loadSettlement();
  }, [loadSettlement]);

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

      {/* Settlement Summary */}
      <View style={[styles.summaryContainer, { backgroundColor: isDarkMode ? DarkPokerColors.cardBackground : '#fff' }]}>
        <Text style={[styles.summaryTitle, { color: isDarkMode ? DarkPokerColors.primaryText : '#333' }]}>Settlement Summary</Text>
        
        {/* Player Results */}
        <View style={styles.playersContainer}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? DarkPokerColors.primaryText : '#333' }]}>Player Results:</Text>
          {settlement.playerSettlements.map((player, index) => (
            <View key={index} style={[styles.playerRow, { borderBottomColor: isDarkMode ? DarkPokerColors.border : '#f0f0f0' }]}>
              <Text style={[styles.playerName, { color: isDarkMode ? DarkPokerColors.primaryText : '#333' }]}>{player.playerName}</Text>
              <Text style={[
                styles.playerAmount,
                player.netAmount >= 0 ? styles.positive : styles.negative
              ]}>
                {player.netAmount >= 0 ? '+' : ''}${player.netAmount.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* Payment Plan */}
        {settlement.paymentPlan.length > 0 ? (
          <View style={styles.paymentsContainer}>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? DarkPokerColors.primaryText : '#333' }]}>Payments Required:</Text>
            {settlement.paymentPlan.map((payment, index) => (
              <View key={index} style={[styles.paymentRow, { borderBottomColor: isDarkMode ? DarkPokerColors.border : '#f0f0f0' }]}>
                <Text style={[styles.paymentText, { color: isDarkMode ? DarkPokerColors.primaryText : '#333' }]}>
                  {payment.fromPlayerName} → {payment.toPlayerName}
                </Text>
                <Text style={[styles.paymentAmount, { color: isDarkMode ? DarkPokerColors.primaryText : '#333' }]}>
                  ${payment.amount.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.evenContainer}>
            <Text style={[styles.evenText, { color: isDarkMode ? DarkPokerColors.success : '#4CAF50' }]}>🤝 Perfect! Everyone broke even!</Text>
          </View>
        )}
      </View>

      {/* WhatsApp Share Component (AC: 1) */}
      <WhatsAppShare
        settlement={settlement}
        sessionName={sessionName}
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
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
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
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  playersContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  playerName: {
    fontSize: 14,
    color: '#333',
  },
  playerAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  positive: {
    color: '#4CAF50',
  },
  negative: {
    color: '#f44336',
  },
  paymentsContainer: {
    marginBottom: 20,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  paymentText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  paymentAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  evenContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  evenText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '500',
  },
  navigationContainer: {
    padding: 16,
  },
  navigationButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  navigationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default SettlementScreen;