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
import { WhatsAppShare } from './WhatsAppShare';
import { SettlementService } from '../../services/settlement/SettlementService';
import { OptimizedSettlement } from '../../types/settlement';
import { ShareResult } from '../../types/whatsapp';

interface SettlementScreenProps {
  route: {
    params: {
      sessionId: string;
      sessionName: string;
    };
  };
  navigation: any;
}

export const SettlementScreen: React.FC<SettlementScreenProps> = ({
  route,
  navigation,
}) => {
  const { sessionId, sessionName } = route.params;
  const [settlement, setSettlement] = useState<OptimizedSettlement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const settlementService = SettlementService.getInstance();

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

  const handleBackToHome = () => {
    navigation.navigate('Home');
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Calculating settlements...</Text>
      </View>
    );
  }

  if (error || !settlement) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || 'No settlement data available'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadSettlement}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{sessionName}</Text>
        <Text style={styles.subtitle}>Final Settlement</Text>
      </View>

      {/* Settlement Summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Settlement Summary</Text>
        
        {/* Player Results */}
        <View style={styles.playersContainer}>
          <Text style={styles.sectionTitle}>Player Results:</Text>
          {settlement.playerSettlements.map((player, index) => (
            <View key={index} style={styles.playerRow}>
              <Text style={styles.playerName}>{player.playerName}</Text>
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
            <Text style={styles.sectionTitle}>Payments Required:</Text>
            {settlement.paymentPlan.map((payment, index) => (
              <View key={index} style={styles.paymentRow}>
                <Text style={styles.paymentText}>
                  {payment.fromPlayerName} → {payment.toPlayerName}
                </Text>
                <Text style={styles.paymentAmount}>
                  ${payment.amount.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.evenContainer}>
            <Text style={styles.evenText}>🤝 Perfect! Everyone broke even!</Text>
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
          style={styles.navigationButton}
          onPress={handleBackToHome}
        >
          <Text style={styles.navigationButtonText}>Back to Home</Text>
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