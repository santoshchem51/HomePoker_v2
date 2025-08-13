/**
 * QuickBuyInPanel Component
 * Story 2.3: Enhanced Touch Interface for Buy-ins - AC 1
 * 
 * Provides quick-add buttons for common buy-in amounts ($20, $50, $100)
 * with one-tap processing and visual feedback
 */
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  AccessibilityInfo,
} from 'react-native';
import { TransactionService } from '../../services/core/TransactionService';
import { HapticService } from '../../services/integration/HapticService';
import { quickBuyInStyles, PokerColors } from '../../styles/touchInterface.styles';
import { validatePlayerId, validateSessionId, validateBuyInAmount } from '../../utils/validation';

interface QuickBuyInPanelProps {
  sessionId: string;
  selectedPlayerId: string | null;
  onBuyInComplete?: (transactionId: string, amount: number) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  amounts?: number[]; // Allow customization of amounts
}

interface LoadingState {
  [key: number]: boolean;
}

// Default quick buy-in amounts as per story requirements
const DEFAULT_AMOUNTS = [20, 50, 100];

const QuickBuyInPanelComponent: React.FC<QuickBuyInPanelProps> = ({
  sessionId,
  selectedPlayerId,
  onBuyInComplete,
  onError,
  disabled = false,
  amounts = DEFAULT_AMOUNTS,
}) => {
  const [loadingStates, setLoadingStates] = useState<LoadingState>({});
  
  // Memoize service instances to prevent unnecessary re-renders
  const transactionService = useMemo(() => TransactionService.getInstance(), []);
  const hapticService = useMemo(() => HapticService.getInstance(), []);

  /**
   * Announce accessibility updates for screen readers
   */
  const announceToScreenReader = useCallback((message: string) => {
    AccessibilityInfo.announceForAccessibility(message);
  }, []);

  /**
   * Handle quick buy-in button press with haptic feedback
   */
  const handleQuickBuyIn = useCallback(async (amount: number) => {
    // Check if any transaction is already processing
    const isCurrentlyProcessing = Object.values(loadingStates).some(loading => loading);
    
    // Security validation
    const sessionValidation = validateSessionId(sessionId);
    if (!sessionValidation.isValid) {
      onError?.(sessionValidation.error || 'Invalid session');
      return;
    }

    const playerValidation = validatePlayerId(selectedPlayerId);
    if (!playerValidation.isValid) {
      Alert.alert(
        'Player Required',
        playerValidation.error || 'Please select a player before processing a buy-in.',
        [{ text: 'OK' }]
      );
      return;
    }

    const amountValidation = validateBuyInAmount(amount);
    if (!amountValidation.isValid) {
      Alert.alert(
        'Invalid Amount',
        amountValidation.error || 'Invalid buy-in amount.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (disabled || isCurrentlyProcessing) {
      return;
    }

    // Announce start of transaction to screen readers
    announceToScreenReader(`Processing $${amount} buy-in for selected player`);

    // Haptic feedback for button press
    hapticService.medium(); // Medium haptic feedback for button press

    // Set loading state for this amount
    setLoadingStates(prev => ({ ...prev, [amount]: true }));

    try {
      // Record buy-in transaction with 'touch' method
      const transaction = await transactionService.recordBuyIn(
        sessionId,
        selectedPlayerId!, // We've already validated this is not null above
        amount,
        'manual', // Using 'manual' as 'touch' method per story requirements
        'user',
        `Quick buy-in: $${amount}`
      );

      // Success haptic feedback
      hapticService.success(); // Success pattern for completed transaction

      // Announce success to screen readers
      announceToScreenReader(`Buy-in successful: $${amount} recorded for selected player`);

      // Notify parent component
      onBuyInComplete?.(transaction.id, amount);

      // Show success feedback
      Alert.alert(
        'Buy-in Successful',
        `$${amount} buy-in recorded successfully!`,
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('Quick buy-in failed:', error);
      
      // Error haptic feedback
      hapticService.error(); // Error pattern for failed transaction

      const errorMessage = error instanceof Error ? error.message : 'Failed to process buy-in';
      
      // Announce error to screen readers
      announceToScreenReader(`Buy-in failed: ${errorMessage}`);
      
      onError?.(errorMessage);
      
      Alert.alert(
        'Buy-in Failed',
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      // Clear loading state
      setLoadingStates(prev => ({ ...prev, [amount]: false }));
    }
  }, [sessionId, selectedPlayerId, disabled, loadingStates, transactionService, hapticService, onBuyInComplete, onError, announceToScreenReader]);

  /**
   * Get button style based on state
   */
  const getButtonStyle = useCallback((_amount: number, isPressed: boolean) => {
    const baseStyle = quickBuyInStyles.quickButton;
    const pressedStyle = isPressed ? quickBuyInStyles.quickButtonPressed : {};
    const disabledStyle = (disabled || !selectedPlayerId) ? quickBuyInStyles.quickButtonDisabled : {};
    
    return [baseStyle, pressedStyle, disabledStyle];
  }, [disabled, selectedPlayerId]);

  /**
   * Check if any transaction is currently processing
   */
  const isAnyLoading = useMemo(() => 
    Object.values(loadingStates).some(loading => loading), 
    [loadingStates]
  );

  return (
    <View 
      style={quickBuyInStyles.container}
      accessibilityLabel="Quick Buy-in Panel"
      accessibilityHint="Select a quick buy-in amount to process for the selected player"
    >
      <Text 
        style={quickBuyInStyles.title}
        accessibilityRole="header"
      >
        Quick Buy-in
      </Text>
      
      <View style={quickBuyInStyles.buttonContainer}>
        {amounts.map((amount) => (
          <TouchableOpacity
            key={amount}
            style={getButtonStyle(amount, loadingStates[amount])}
            onPress={() => handleQuickBuyIn(amount)}
            disabled={disabled || !selectedPlayerId || isAnyLoading}
            activeOpacity={0.8}
            accessibilityLabel={`Quick buy-in $${amount}`}
            accessibilityHint={`Tap to record a $${amount} buy-in for the selected player`}
            accessibilityRole="button"
            accessibilityState={{ 
              disabled: disabled || !selectedPlayerId || isAnyLoading,
              busy: loadingStates[amount] || false
            }}
          >
            {loadingStates[amount] ? (
              <View style={quickBuyInStyles.loadingOverlay}>
                <ActivityIndicator size="small" color={PokerColors.primaryText} />
              </View>
            ) : (
              <>
                <Text style={quickBuyInStyles.buttonText}>$</Text>
                <Text style={quickBuyInStyles.buttonAmount}>{amount}</Text>
              </>
            )}
          </TouchableOpacity>
        ))}
      </View>
      
      {!selectedPlayerId && (
        <View style={quickBuyInStyles.helperContainer}>
          <Text style={quickBuyInStyles.helperText}>
            Select a player to enable quick buy-in
          </Text>
        </View>
      )}
    </View>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const QuickBuyInPanel = React.memo(QuickBuyInPanelComponent);

// Set display name for debugging
QuickBuyInPanel.displayName = 'QuickBuyInPanel';

export default QuickBuyInPanel;