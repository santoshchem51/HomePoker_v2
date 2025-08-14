/**
 * Early Cash-out Calculator Component - Epic 3: Settlement Optimization
 * Story 3.1: Early Cash-out Calculator Implementation
 * 
 * React Native component for calculating and displaying early cash-out settlements
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useEarlyCashOut } from '../../hooks/useEarlyCashOut';
import { EarlyCashOutResult } from '../../types/settlement';

interface EarlyCashOutCalculatorProps {
  sessionId: string;
  playerId: string;
  playerName: string;
  onCalculationComplete?: (result: EarlyCashOutResult) => void;
  onClose?: () => void;
}

export const EarlyCashOutCalculator: React.FC<EarlyCashOutCalculatorProps> = ({
  sessionId,
  playerId,
  playerName,
  onCalculationComplete,
  onClose,
}) => {
  const [chipCount, setChipCount] = useState<string>('');
  const [isCalculating, setIsCalculating] = useState(false);

  const {
    calculateCashOut,
    result,
    error,
    isLoading,
    clearResult,
    clearError,
  } = useEarlyCashOut();

  useEffect(() => {
    if (result && onCalculationComplete) {
      onCalculationComplete(result);
    }
  }, [result, onCalculationComplete]);

  const handleCalculate = async () => {
    const chipValue = parseFloat(chipCount);
    
    if (isNaN(chipValue) || chipValue < 0) {
      Alert.alert('Invalid Input', 'Please enter a valid chip count');
      return;
    }

    setIsCalculating(true);
    try {
      await calculateCashOut({
        sessionId,
        playerId,
        currentChipCount: chipValue,
        timestamp: new Date(),
      });
    } catch (err) {
      // Error handled by hook
    } finally {
      setIsCalculating(false);
    }
  };

  const handleReset = () => {
    setChipCount('');
    clearResult();
    clearError();
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getSettlementColor = (type: string): string => {
    switch (type) {
      case 'payment_to_player':
        return '#4CAF50'; // Green for receiving money
      case 'payment_from_player':
        return '#F44336'; // Red for owing money
      default:
        return '#9E9E9E'; // Gray for even
    }
  };

  const getSettlementIcon = (type: string): string => {
    switch (type) {
      case 'payment_to_player':
        return '↗'; // Up arrow for receiving
      case 'payment_from_player':
        return '↙'; // Down arrow for paying
      default:
        return '—'; // Dash for even
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Early Cash-out Calculator</Text>
        <Text style={styles.playerName}>{playerName}</Text>
        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Input Section */}
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Current Chip Count</Text>
        <TextInput
          style={styles.chipInput}
          value={chipCount}
          onChangeText={setChipCount}
          placeholder="Enter chip count"
          keyboardType="numeric"
          editable={!isLoading && !isCalculating}
        />
        
        <TouchableOpacity
          style={[styles.calculateButton, (isLoading || isCalculating) && styles.disabledButton]}
          onPress={handleCalculate}
          disabled={isLoading || isCalculating}
        >
          {isLoading || isCalculating ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.calculateButtonText}>Calculate Settlement</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error.message}</Text>
          <TouchableOpacity style={styles.clearErrorButton} onPress={clearError}>
            <Text style={styles.clearErrorText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Results Display */}
      {result && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Settlement Calculation</Text>
          
          {/* Financial Breakdown */}
          <View style={styles.breakdownContainer}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Chip Value:</Text>
              <Text style={styles.breakdownValue}>{formatCurrency(result.currentChipValue)}</Text>
            </View>
            
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Total Buy-ins:</Text>
              <Text style={styles.breakdownValue}>{formatCurrency(result.totalBuyIns)}</Text>
            </View>
            
            <View style={[styles.breakdownRow, styles.netPositionRow]}>
              <Text style={styles.breakdownLabel}>Net Position:</Text>
              <Text style={[
                styles.breakdownValue,
                { color: result.netPosition >= 0 ? '#4CAF50' : '#F44336' }
              ]}>
                {result.netPosition >= 0 ? '+' : ''}{formatCurrency(result.netPosition)}
              </Text>
            </View>
          </View>

          {/* Settlement Amount */}
          <View style={[styles.settlementContainer, { borderColor: getSettlementColor(result.settlementType) }]}>
            <View style={styles.settlementHeader}>
              <Text style={styles.settlementIcon}>{getSettlementIcon(result.settlementType)}</Text>
              <Text style={styles.settlementLabel}>
                {result.settlementType === 'payment_to_player' ? 'You Receive:' :
                 result.settlementType === 'payment_from_player' ? 'You Pay:' :
                 'Settlement:'}
              </Text>
            </View>
            <Text style={[styles.settlementAmount, { color: getSettlementColor(result.settlementType) }]}>
              {formatCurrency(result.settlementAmount)}
            </Text>
          </View>

          {/* Bank Balance Info */}
          <View style={styles.bankInfoContainer}>
            <Text style={styles.bankInfoText}>
              Bank balance after settlement: {formatCurrency(result.bankBalanceAfter)}
            </Text>
            <Text style={styles.calculationTime}>
              Calculated in {result.calculationDurationMs}ms
            </Text>
          </View>

          {/* Validation Messages */}
          {result.validationMessages.length > 0 && (
            <View style={styles.validationContainer}>
              <Text style={styles.validationTitle}>⚠️ Warnings:</Text>
              {result.validationMessages.map((message, index) => (
                <Text key={index} style={styles.validationMessage}>• {message}</Text>
              ))}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetButtonText}>Calculate Another</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingBottom: 12,
  },
  
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1976D2',
    flex: 1,
  },
  
  playerName: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  
  closeButton: {
    padding: 8,
    marginLeft: 12,
  },
  
  closeButtonText: {
    fontSize: 18,
    color: '#999',
    fontWeight: 'bold',
  },
  
  inputSection: {
    marginBottom: 20,
  },
  
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  
  chipInput: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    backgroundColor: '#FAFAFA',
    marginBottom: 16,
  },
  
  calculateButton: {
    backgroundColor: '#1976D2',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  
  disabledButton: {
    backgroundColor: '#BDBDBD',
  },
  
  calculateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  errorIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  
  errorText: {
    color: '#C62828',
    fontSize: 14,
    flex: 1,
  },
  
  clearErrorButton: {
    paddingHorizontal: 8,
  },
  
  clearErrorText: {
    color: '#1976D2',
    fontSize: 12,
    fontWeight: '600',
  },
  
  resultContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 20,
  },
  
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  
  breakdownContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  
  netPositionRow: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginTop: 8,
    paddingTop: 8,
  },
  
  breakdownLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  
  breakdownValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  
  settlementContainer: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#FAFAFA',
  },
  
  settlementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  settlementIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  
  settlementLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  
  settlementAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  
  bankInfoContainer: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  
  bankInfoText: {
    fontSize: 14,
    color: '#1565C0',
    textAlign: 'center',
    marginBottom: 4,
  },
  
  calculationTime: {
    fontSize: 12,
    color: '#90A4AE',
    textAlign: 'center',
  },
  
  validationContainer: {
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  
  validationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF6C00',
    marginBottom: 8,
  },
  
  validationMessage: {
    fontSize: 12,
    color: '#EF6C00',
    lineHeight: 16,
  },
  
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  
  resetButton: {
    backgroundColor: '#37474F',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});