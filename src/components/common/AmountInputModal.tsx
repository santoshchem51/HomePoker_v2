/**
 * AmountInputModal - Modal for transaction amount input with validation
 * Replaces the TransactionForm with a cleaner, contextual interface
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { TRANSACTION_LIMITS } from '../../types/transaction';
import { useTheme } from '../../contexts/ThemeContext';
import { DarkPokerColors } from '../../styles/darkTheme.styles';

export interface AmountInputModalProps {
  visible: boolean;
  transactionType: 'buy_in' | 'cash_out';
  playerName: string;
  currentBalance: number;
  onSubmit: (amount: number) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

export const AmountInputModal: React.FC<AmountInputModalProps> = ({
  visible,
  transactionType,
  playerName,
  currentBalance,
  onSubmit,
  onCancel,
  loading
}) => {
  const { isDarkMode } = useTheme();
  const [amount, setAmount] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Clear form when modal opens/closes
  useEffect(() => {
    if (visible) {
      setAmount('');
      setError('');
    }
  }, [visible]);

  /**
   * Get transaction limits based on type
   */
  const getLimits = useCallback(() => {
    if (transactionType === 'buy_in') {
      return { min: TRANSACTION_LIMITS.MIN_BUY_IN, max: TRANSACTION_LIMITS.MAX_BUY_IN };
    } else {
      return { min: TRANSACTION_LIMITS.MIN_CASH_OUT, max: TRANSACTION_LIMITS.MAX_CASH_OUT };
    }
  }, [transactionType]);

  /**
   * Quick amount buttons for common values
   */
  const getQuickAmounts = useCallback(() => {
    if (transactionType === 'buy_in') {
      return [10, 20, 50, 100];
    } else {
      // For cash-out, show reasonable amounts up to current balance
      const amounts = [10, 20, 50, 100].filter(amt => amt <= currentBalance);
      // Add current balance as option if it's not already there
      if (currentBalance > 0 && !amounts.includes(currentBalance)) {
        amounts.push(currentBalance);
      }
      return amounts.slice(0, 4); // Max 4 buttons
    }
  }, [transactionType, currentBalance]);

  /**
   * Validate amount input
   */
  const validateAmount = useCallback((amountStr: string): string | null => {
    const trimmedAmount = amountStr.trim();
    if (!trimmedAmount) {
      return 'Amount is required';
    }

    const numAmount = parseFloat(trimmedAmount);
    const limits = getLimits();

    if (isNaN(numAmount)) {
      return 'Amount must be a valid number';
    }
    if (numAmount <= 0) {
      return 'Amount must be positive';
    }
    if (!Number.isInteger(numAmount * 100)) {
      return 'Amount cannot have more than 2 decimal places';
    }
    if (numAmount < limits.min) {
      return `Amount must be at least $${limits.min}`;
    }
    if (numAmount > limits.max) {
      return `Amount cannot exceed $${limits.max}`;
    }

    return null;
  }, [getLimits]);

  /**
   * Handle amount text input change
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
    
    // Clear error on valid input change
    if (error && cleaned && !isNaN(parseFloat(cleaned))) {
      setError('');
    }
  };

  /**
   * Handle quick amount button press
   */
  const handleQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount.toString());
    setError('');
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    const validationError = validateAmount(amount);
    if (validationError) {
      setError(validationError);
      return;
    }

    const numAmount = parseFloat(amount.trim());
    
    try {
      await onSubmit(numAmount);
      // Modal will be closed by parent component on success
    } catch (submitError) {
      // Re-throw error so parent component can handle it properly
      console.error('AmountInputModal submission error:', submitError);
      throw submitError;
    }
  };

  const limits = getLimits();
  const quickAmounts = getQuickAmounts();
  const actionLabel = transactionType === 'buy_in' ? 'Buy-in' : 'Cash-out';
  const actionEmoji = transactionType === 'buy_in' ? '💰' : '💸';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView 
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity 
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onCancel}
        >
          <TouchableOpacity 
            style={[
              styles.modalContainer,
              { backgroundColor: isDarkMode ? DarkPokerColors.modalBackground : '#FFFFFF' }
            ]}
            activeOpacity={1}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={[
                styles.title,
                { color: isDarkMode ? DarkPokerColors.primaryText : '#2C3E50' }
              ]}>
                {actionEmoji} {actionLabel}
              </Text>
              <Text style={[
                styles.subtitle,
                { color: isDarkMode ? DarkPokerColors.secondaryText : '#666' }
              ]}>
                {playerName} - Current: ${currentBalance.toFixed(2)}
              </Text>
            </View>

            {/* Quick Amount Buttons */}
            {quickAmounts.length > 0 && (
              <View style={styles.quickAmountsContainer}>
                <Text style={[
                  styles.sectionLabel,
                  { color: isDarkMode ? DarkPokerColors.secondaryText : '#666' }
                ]}>
                  Quick Amounts
                </Text>
                <View style={styles.quickAmountsGrid}>
                  {quickAmounts.map((quickAmount) => (
                    <TouchableOpacity
                      key={quickAmount}
                      style={[
                        styles.quickAmountButton,
                        {
                          backgroundColor: isDarkMode ? DarkPokerColors.surfaceBackground : '#F8F9FA',
                          borderColor: isDarkMode ? DarkPokerColors.border : '#BDC3C7'
                        }
                      ]}
                      onPress={() => handleQuickAmount(quickAmount)}
                      disabled={loading}
                    >
                      <Text style={[
                        styles.quickAmountText,
                        { color: isDarkMode ? DarkPokerColors.primaryText : '#2C3E50' }
                      ]}>
                        ${quickAmount}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Custom Amount Input */}
            <View style={styles.customAmountContainer}>
              <Text style={[
                styles.sectionLabel,
                { color: isDarkMode ? DarkPokerColors.secondaryText : '#666' }
              ]}>
                Custom Amount (${limits.min} - ${limits.max})
              </Text>
              <View style={[
                styles.amountInputContainer,
                {
                  backgroundColor: isDarkMode ? DarkPokerColors.inputBackground : '#F8F9FA',
                  borderColor: error 
                    ? (isDarkMode ? DarkPokerColors.error : '#E74C3C')
                    : (isDarkMode ? DarkPokerColors.border : '#BDC3C7')
                }
              ]}>
                <Text style={[
                  styles.currencySymbol,
                  { color: isDarkMode ? DarkPokerColors.greenChip : '#27AE60' }
                ]}>
                  $
                </Text>
                <TextInput
                  style={[
                    styles.amountInput,
                    { color: isDarkMode ? DarkPokerColors.primaryText : '#2C3E50' }
                  ]}
                  value={amount}
                  onChangeText={handleAmountChange}
                  placeholder="0.00"
                  placeholderTextColor={isDarkMode ? DarkPokerColors.placeholderText : '#999'}
                  keyboardType="numeric"
                  editable={!loading}
                  maxLength={6}
                  autoFocus={quickAmounts.length === 0}
                />
              </View>
              {error && (
                <Text style={[
                  styles.errorText,
                  { color: isDarkMode ? DarkPokerColors.error : '#E74C3C' }
                ]}>
                  {error}
                </Text>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.cancelButton,
                  { backgroundColor: isDarkMode ? DarkPokerColors.buttonSecondary : '#95A5A6' }
                ]}
                onPress={onCancel}
                disabled={loading}
              >
                <Text style={styles.actionButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.submitButton,
                  {
                    backgroundColor: transactionType === 'buy_in' 
                      ? (isDarkMode ? DarkPokerColors.greenChip : '#27AE60')
                      : (isDarkMode ? DarkPokerColors.warning : '#E67E22')
                  },
                  loading ? styles.submitButtonDisabled : null
                ]}
                onPress={handleSubmit}
                disabled={loading || !amount.trim()}
              >
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={[styles.actionButtonText, styles.loadingText]}>
                      Recording...
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.actionButtonText}>
                    Record {actionLabel}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    maxWidth: 400,
    width: '90%',
    maxHeight: '80%',
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  quickAmountsContainer: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  quickAmountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickAmountButton: {
    flex: 1,
    minWidth: 70,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BDC3C7',
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
  },
  quickAmountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  customAmountContainer: {
    marginBottom: 24,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BDC3C7',
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    height: 56,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '600',
    color: '#27AE60',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 20,
    color: '#2C3E50',
    textAlign: 'right',
  },
  errorText: {
    fontSize: 14,
    color: '#E74C3C',
    marginTop: 8,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  cancelButton: {
    backgroundColor: '#95A5A6',
  },
  submitButton: {
    backgroundColor: '#27AE60',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
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
});