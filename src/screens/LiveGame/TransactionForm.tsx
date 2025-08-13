/**
 * TransactionForm - Form component for buy-in entry with validation
 * Implements Story 1.3 AC: 1, 5 - Buy-in entry interface with validation
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Player } from '../../types/player';
import { TRANSACTION_LIMITS, TransactionType } from '../../types/transaction';
import { ServiceError, ErrorCode } from '../../types/errors';

export interface TransactionFormProps {
  sessionId: string;
  players: Player[];
  onSubmitBuyIn: (playerId: string, amount: number) => Promise<void>;
  onSubmitCashOut: (playerId: string, amount: number, organizerConfirmed?: boolean) => Promise<void>;
  loading: boolean;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  sessionId: _sessionId,
  players,
  onSubmitBuyIn,
  onSubmitCashOut,
  loading
}) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [transactionType, setTransactionType] = useState<TransactionType>('buy_in');
  const [showOrganizerConfirmation, setShowOrganizerConfirmation] = useState(false);
  const [pendingCashOut, setPendingCashOut] = useState<{ playerId: string; amount: number } | null>(null);
  const [errors, setErrors] = useState<{
    player?: string;
    amount?: string;
  }>({});

  /**
   * Get players eligible for the current transaction type
   */
  const getEligiblePlayers = useCallback(() => {
    if (transactionType === 'buy_in') {
      return players.filter(p => p.status === 'active');
    } else {
      // For cash-out: active players with positive balance
      return players.filter(p => p.status === 'active' && p.currentBalance > 0);
    }
  }, [players, transactionType]);

  // Pre-select first eligible player based on transaction type
  useEffect(() => {
    const eligiblePlayers = getEligiblePlayers();
    if (eligiblePlayers.length > 0 && !selectedPlayerId) {
      setSelectedPlayerId(eligiblePlayers[0].id);
    }
  }, [players, selectedPlayerId, transactionType, getEligiblePlayers]);

  /**
   * Validate form inputs for both buy-in and cash-out
   * AC: 1, 5 - Input validation for both transaction types
   */
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    // Validate player selection
    if (!selectedPlayerId) {
      newErrors.player = 'Please select a player';
    } else {
      const selectedPlayer = players.find(p => p.id === selectedPlayerId);
      if (!selectedPlayer) {
        newErrors.player = 'Selected player not found';
      } else if (selectedPlayer.status !== 'active') {
        newErrors.player = 'Selected player is not active';
      } else if (transactionType === 'cash_out' && selectedPlayer.currentBalance <= 0) {
        newErrors.player = 'Selected player has no balance to cash out';
      }
    }

    // Validate amount
    const trimmedAmount = amount.trim();
    if (!trimmedAmount) {
      newErrors.amount = 'Amount is required';
    } else {
      const numAmount = parseFloat(trimmedAmount);
      
      if (isNaN(numAmount)) {
        newErrors.amount = 'Amount must be a valid number';
      } else if (numAmount <= 0) {
        newErrors.amount = 'Amount must be positive';
      } else if (!Number.isInteger(numAmount * 100)) {
        newErrors.amount = 'Amount cannot have more than 2 decimal places';
      } else if (transactionType === 'buy_in') {
        // Buy-in specific validation
        if (numAmount < TRANSACTION_LIMITS.MIN_BUY_IN) {
          newErrors.amount = `Amount must be at least $${TRANSACTION_LIMITS.MIN_BUY_IN}`;
        } else if (numAmount > TRANSACTION_LIMITS.MAX_BUY_IN) {
          newErrors.amount = `Amount cannot exceed $${TRANSACTION_LIMITS.MAX_BUY_IN}`;
        }
      } else {
        // Cash-out specific validation
        if (numAmount < TRANSACTION_LIMITS.MIN_CASH_OUT) {
          newErrors.amount = `Amount must be at least $${TRANSACTION_LIMITS.MIN_CASH_OUT}`;
        } else if (numAmount > TRANSACTION_LIMITS.MAX_CASH_OUT) {
          newErrors.amount = `Amount cannot exceed $${TRANSACTION_LIMITS.MAX_CASH_OUT}`;
        }
        
        // Check if cash-out exceeds player's current balance
        const selectedPlayer = players.find(p => p.id === selectedPlayerId);
        if (selectedPlayer && numAmount > selectedPlayer.currentBalance) {
          newErrors.amount = `Amount cannot exceed player's balance $${selectedPlayer.currentBalance.toFixed(2)}`;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission for both buy-in and cash-out
   * AC: 1, 4 - Transaction entry with organizer confirmation for cash-outs exceeding buy-ins
   */
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    const numAmount = parseFloat(amount.trim());

    try {
      if (transactionType === 'buy_in') {
        await onSubmitBuyIn(selectedPlayerId, numAmount);
        
        Alert.alert(
          'Success',
          `Buy-in of $${numAmount.toFixed(2)} recorded successfully!`,
          [{ text: 'OK' }]
        );
      } else {
        await onSubmitCashOut(selectedPlayerId, numAmount);
        
        Alert.alert(
          'Success',
          `Cash-out of $${numAmount.toFixed(2)} recorded successfully!`,
          [{ text: 'OK' }]
        );
      }
      
      // Clear form after successful submission
      setAmount('');
      setErrors({});
      
    } catch (error) {
      console.error('Transaction submission failed:', error);
      
      // Handle organizer confirmation requirement
      if (error instanceof ServiceError && error.code === ErrorCode.ORGANIZER_CONFIRMATION_REQUIRED) {
        setPendingCashOut({ playerId: selectedPlayerId, amount: numAmount });
        setShowOrganizerConfirmation(true);
        return;
      }
      
      Alert.alert(
        'Error',
        error instanceof ServiceError ? error.message : `Failed to record ${transactionType.replace('_', '-')}. Please try again.`,
        [{ text: 'OK' }]
      );
    }
  };

  /**
   * Handle organizer confirmation for cash-outs exceeding buy-ins
   * AC: 4 - Organizer confirmation workflow
   */
  const handleOrganizerConfirmation = async (confirmed: boolean) => {
    setShowOrganizerConfirmation(false);
    
    if (!confirmed || !pendingCashOut) {
      setPendingCashOut(null);
      return;
    }

    try {
      await onSubmitCashOut(pendingCashOut.playerId, pendingCashOut.amount, true);
      
      Alert.alert(
        'Success',
        `Cash-out of $${pendingCashOut.amount.toFixed(2)} recorded successfully with organizer approval!`,
        [{ text: 'OK' }]
      );
      
      // Clear form after successful submission
      setAmount('');
      setErrors({});
      setPendingCashOut(null);
      
    } catch (error) {
      console.error('Confirmed cash-out submission failed:', error);
      Alert.alert(
        'Error',
        error instanceof ServiceError ? error.message : 'Failed to record cash-out. Please try again.',
        [{ text: 'OK' }]
      );
      setPendingCashOut(null);
    }
  };

  /**
   * Format amount input to currency-like format
   */
  const handleAmountChange = (text: string) => {
    // Remove any non-numeric characters except decimal point
    const cleaned = text.replace(/[^0-9.]/g, '');
    
    // Prevent multiple decimal points
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return;
    }
    
    // Limit decimal places to 2
    if (parts[1] && parts[1].length > 2) {
      return;
    }
    
    setAmount(cleaned);
    
    // Clear amount error on valid input change
    if (errors.amount && cleaned && !isNaN(parseFloat(cleaned))) {
      setErrors(prev => ({ ...prev, amount: undefined }));
    }
  };

  const eligiblePlayers = getEligiblePlayers();
  const currentLimits = transactionType === 'buy_in' 
    ? { min: TRANSACTION_LIMITS.MIN_BUY_IN, max: TRANSACTION_LIMITS.MAX_BUY_IN }
    : { min: TRANSACTION_LIMITS.MIN_CASH_OUT, max: TRANSACTION_LIMITS.MAX_CASH_OUT };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.form}>
        <Text style={styles.title}>Record Transaction</Text>
        
        {/* Transaction Type Toggle */}
        <View style={styles.typeToggleContainer}>
          <TouchableOpacity
            style={[
              styles.typeToggleButton,
              transactionType === 'buy_in' ? styles.typeToggleButtonActive : null
            ]}
            onPress={() => {
              setTransactionType('buy_in');
              setAmount('');
              setErrors({});
            }}
            disabled={loading}
          >
            <Text style={[
              styles.typeToggleText,
              transactionType === 'buy_in' ? styles.typeToggleTextActive : null
            ]}>
              Buy-in
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeToggleButton,
              transactionType === 'cash_out' ? styles.typeToggleButtonActive : null
            ]}
            onPress={() => {
              setTransactionType('cash_out');
              setAmount('');
              setErrors({});
            }}
            disabled={loading}
          >
            <Text style={[
              styles.typeToggleText,
              transactionType === 'cash_out' ? styles.typeToggleTextActive : null
            ]}>
              Cash-out
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Player Selection */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Player *</Text>
          <View style={[
            styles.pickerContainer,
            errors.player ? styles.inputError : null
          ]}>
            <Picker
              selectedValue={selectedPlayerId}
              onValueChange={(playerId) => {
                setSelectedPlayerId(playerId);
                if (errors.player && playerId) {
                  setErrors(prev => ({ ...prev, player: undefined }));
                }
              }}
              style={styles.picker}
              enabled={!loading}
            >
              <Picker.Item label="Select a player..." value="" />
              {eligiblePlayers.map((player) => (
                <Picker.Item
                  key={player.id}
                  label={`${player.name} (Balance: $${player.currentBalance.toFixed(2)})`}
                  value={player.id}
                />
              ))}
            </Picker>
          </View>
          {errors.player && (
            <Text style={styles.errorText}>{errors.player}</Text>
          )}
        </View>

        {/* Amount Input */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Amount * (${currentLimits.min} - ${currentLimits.max})
          </Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={[
                styles.amountInput,
                errors.amount ? styles.inputError : null
              ]}
              value={amount}
              onChangeText={handleAmountChange}
              placeholder="0.00"
              keyboardType="numeric"
              editable={!loading}
              maxLength={6} // Max for $500.00
            />
          </View>
          {errors.amount && (
            <Text style={styles.errorText}>{errors.amount}</Text>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (loading || eligiblePlayers.length === 0) ? styles.submitButtonDisabled : null,
            transactionType === 'cash_out' ? styles.submitButtonCashOut : null
          ]}
          onPress={handleSubmit}
          disabled={loading || eligiblePlayers.length === 0}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={[styles.submitButtonText, styles.loadingText]}>
                Recording...
              </Text>
            </View>
          ) : (
            <Text style={styles.submitButtonText}>
              Record {transactionType === 'buy_in' ? 'Buy-in' : 'Cash-out'}
            </Text>
          )}
        </TouchableOpacity>

        {eligiblePlayers.length === 0 && (
          <Text style={styles.noPlayersText}>
            {transactionType === 'buy_in' 
              ? 'No active players available for buy-in'
              : 'No players with balance available for cash-out'
            }
          </Text>
        )}

        {/* Organizer Confirmation Modal */}
        {showOrganizerConfirmation && pendingCashOut && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Organizer Confirmation Required</Text>
              <Text style={styles.modalMessage}>
                Cash-out amount ${pendingCashOut.amount.toFixed(2)} exceeds player's total buy-ins. 
                Do you want to proceed as the organizer?
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => handleOrganizerConfirmation(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonConfirm]}
                  onPress={() => handleOrganizerConfirmation(true)}
                >
                  <Text style={styles.modalButtonText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  form: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    margin: 16,
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
    marginBottom: 24,
    color: '#2C3E50',
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#34495E',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#BDC3C7',
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
  },
  picker: {
    height: 50,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BDC3C7',
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    height: 50,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#27AE60',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    color: '#2C3E50',
    textAlign: 'right',
  },
  inputError: {
    borderColor: '#E74C3C',
    backgroundColor: '#FDEDEC',
  },
  errorText: {
    fontSize: 14,
    color: '#E74C3C',
    marginTop: 4,
    fontStyle: 'italic',
  },
  submitButton: {
    backgroundColor: '#27AE60',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    minHeight: 56,
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#95A5A6',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    marginLeft: 8,
  },
  noPlayersText: {
    textAlign: 'center',
    color: '#7F8C8D',
    fontStyle: 'italic',
    marginTop: 16,
  },
  typeToggleContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 8,
    backgroundColor: '#ECF0F1',
    padding: 4,
  },
  typeToggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderRadius: 6,
  },
  typeToggleButtonActive: {
    backgroundColor: '#3498DB',
  },
  typeToggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7F8C8D',
  },
  typeToggleTextActive: {
    color: '#FFFFFF',
  },
  submitButtonCashOut: {
    backgroundColor: '#E67E22',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    margin: 20,
    maxWidth: 400,
    width: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#34495E',
    marginBottom: 24,
    lineHeight: 22,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#95A5A6',
  },
  modalButtonConfirm: {
    backgroundColor: '#E67E22',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});