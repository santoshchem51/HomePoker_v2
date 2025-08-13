/**
 * UndoButton - Component for displaying undo functionality with countdown
 * Implements Story 1.3 AC: 6 - Undo button with 30-second countdown timer
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Transaction } from '../../types/transaction';

export interface UndoButtonProps {
  transaction: Transaction;
  remainingTime: number;
  onUndo: (transactionId: string) => Promise<void>;
  disabled?: boolean;
}

export const UndoButton: React.FC<UndoButtonProps> = ({
  transaction,
  remainingTime: initialRemainingTime,
  onUndo,
  disabled = false,
}) => {
  const [remainingTime, setRemainingTime] = useState(initialRemainingTime);
  const [isUndoing, setIsUndoing] = useState(false);

  // Update countdown timer
  useEffect(() => {
    if (remainingTime <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        const newTime = prev - 1;
        return newTime <= 0 ? 0 : newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingTime]);

  // Reset remaining time when prop changes
  useEffect(() => {
    setRemainingTime(initialRemainingTime);
  }, [initialRemainingTime]);

  /**
   * Handle undo with confirmation
   */
  const handleUndo = () => {
    if (remainingTime <= 0 || disabled || isUndoing) {
      return;
    }

    Alert.alert(
      'Undo Transaction',
      `Are you sure you want to undo this ${transaction.type.replace('_', '-')} of $${transaction.amount.toFixed(2)}? This action cannot be reversed.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Undo',
          style: 'destructive',
          onPress: performUndo,
        },
      ]
    );
  };

  /**
   * Perform the undo operation
   */
  const performUndo = async () => {
    try {
      setIsUndoing(true);
      await onUndo(transaction.id);
      
      Alert.alert(
        'Transaction Undone',
        `The ${transaction.type.replace('_', '-')} of $${transaction.amount.toFixed(2)} has been successfully undone.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Undo failed:', error);
      Alert.alert(
        'Undo Failed',
        'Failed to undo the transaction. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsUndoing(false);
    }
  };

  // Don't show button if time has expired or transaction is voided
  if (remainingTime <= 0 || transaction.isVoided) {
    return null;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.undoButton,
          disabled ? styles.undoButtonDisabled : null,
          isUndoing ? styles.undoButtonLoading : null
        ]}
        onPress={handleUndo}
        disabled={disabled || isUndoing || remainingTime <= 0}
      >
        {isUndoing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text style={styles.loadingText}>Undoing...</Text>
          </View>
        ) : (
          <View style={styles.buttonContent}>
            <Text style={styles.undoButtonText}>Undo</Text>
            <View style={styles.timerContainer}>
              <Text style={styles.timerText}>{remainingTime}s</Text>
              <View style={styles.timerBar}>
                <View
                  style={[
                    styles.timerProgress,
                    {
                      width: `${(remainingTime / 30) * 100}%`,
                    }
                  ]}
                />
              </View>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  undoButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  undoButtonDisabled: {
    backgroundColor: '#BDC3C7',
    shadowOpacity: 0,
    elevation: 0,
  },
  undoButtonLoading: {
    backgroundColor: '#E17055',
  },
  buttonContent: {
    alignItems: 'center',
  },
  undoButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  timerContainer: {
    marginTop: 4,
    alignItems: 'center',
    minWidth: 60,
  },
  timerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.9,
  },
  timerBar: {
    width: 60,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1.5,
    marginTop: 2,
    overflow: 'hidden',
  },
  timerProgress: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 1.5,
  },
});