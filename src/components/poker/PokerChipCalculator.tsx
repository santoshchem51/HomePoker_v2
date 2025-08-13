/**
 * PokerChipCalculator Component
 * Story 2.3: Enhanced Touch Interface for Buy-ins - AC 3
 * 
 * Visual poker chip interface for custom amounts with chip-based calculation
 * and visual chip stacking animation for amount building
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Alert,
  AccessibilityInfo,
} from 'react-native';
import { TransactionService } from '../../services/core/TransactionService';
import { HapticService } from '../../services/integration/HapticService';
import { TRANSACTION_LIMITS } from '../../types/transaction';
import { validatePlayerId, validateSessionId, validateBuyInAmount, validateChipCounts } from '../../utils/validation';
import { 
  chipCalculatorStyles, 
  PokerColors,
  landscapeStyles,
} from '../../styles/touchInterface.styles';

interface ChipCount {
  red: number;    // $5 chips
  green: number;  // $25 chips
  black: number;  // $100 chips
}

interface PokerChipCalculatorProps {
  sessionId: string;
  selectedPlayerId: string | null;
  onBuyInComplete?: (transactionId: string, amount: number) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  isLandscape?: boolean;
  onAmountChange?: (amount: number) => void;
}

// Chip denominations
const CHIP_VALUES = {
  red: 5,
  green: 25,
  black: 100,
} as const;

const PokerChipCalculatorComponent: React.FC<PokerChipCalculatorProps> = ({
  sessionId,
  selectedPlayerId,
  onBuyInComplete,
  onError,
  disabled = false,
  isLandscape = false,
  onAmountChange,
}) => {
  const [chipCounts, setChipCounts] = useState<ChipCount>({
    red: 0,
    green: 0,
    black: 0,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Animation refs for chip stacking effect - memoize to prevent recreation
  const redChipAnimation = useMemo(() => new Animated.Value(1), []);
  const greenChipAnimation = useMemo(() => new Animated.Value(1), []);
  const blackChipAnimation = useMemo(() => new Animated.Value(1), []);
  
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
   * Calculate total amount from chip counts
   */
  const calculateTotal = useMemo((): number => {
    return (
      chipCounts.red * CHIP_VALUES.red +
      chipCounts.green * CHIP_VALUES.green +
      chipCounts.black * CHIP_VALUES.black
    );
  }, [chipCounts]);

  /**
   * Get animation ref for chip type
   */
  const getChipAnimation = useCallback((chipType: keyof ChipCount): Animated.Value => {
    switch (chipType) {
      case 'red': return redChipAnimation;
      case 'green': return greenChipAnimation;
      case 'black': return blackChipAnimation;
    }
  }, [redChipAnimation, greenChipAnimation, blackChipAnimation]);

  /**
   * Animate chip selection
   */
  const animateChip = useCallback((chipType: keyof ChipCount) => {
    const animation = getChipAnimation(chipType);
    
    Animated.sequence([
      Animated.timing(animation, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [getChipAnimation]);

  /**
   * Handle chip tap (add chip)
   */
  const handleChipAdd = useCallback((chipType: keyof ChipCount) => {
    if (disabled) return;

    const newCounts = {
      ...chipCounts,
      [chipType]: chipCounts[chipType] + 1,
    };

    // Validate chip counts
    const chipValidation = validateChipCounts(newCounts);
    if (!chipValidation.isValid) {
      hapticService.error();
      Alert.alert(
        'Invalid Chip Count',
        chipValidation.error || 'Invalid chip configuration',
        [{ text: 'OK' }]
      );
      return;
    }

    // Calculate new total to validate limits
    const newTotal = (
      newCounts.red * CHIP_VALUES.red +
      newCounts.green * CHIP_VALUES.green +
      newCounts.black * CHIP_VALUES.black
    );

    // Validate the total amount
    const amountValidation = validateBuyInAmount(newTotal);
    if (!amountValidation.isValid) {
      hapticService.error(); // Error feedback
      Alert.alert(
        'Invalid Amount',
        amountValidation.error || 'Invalid buy-in amount',
        [{ text: 'OK' }]
      );
      return;
    }

    // Light haptic feedback for chip addition
    hapticService.light();
    
    // Announce chip addition to screen readers
    announceToScreenReader(`Added $${CHIP_VALUES[chipType]} chip. New total: $${newTotal}`);
    
    // Animate chip
    animateChip(chipType);
    
    // Update chip counts
    setChipCounts(newCounts);
    
    // Notify parent of amount change
    onAmountChange?.(newTotal);
  }, [disabled, chipCounts, hapticService, animateChip, onAmountChange, announceToScreenReader]);

  /**
   * Handle chip long press (remove chip)
   */
  const handleChipRemove = useCallback((chipType: keyof ChipCount) => {
    if (disabled || chipCounts[chipType] === 0) return;

    const newCounts = {
      ...chipCounts,
      [chipType]: chipCounts[chipType] - 1,
    };

    // Calculate new total
    const newTotal = (
      newCounts.red * CHIP_VALUES.red +
      newCounts.green * CHIP_VALUES.green +
      newCounts.black * CHIP_VALUES.black
    );

    // Light haptic feedback for chip removal
    hapticService.light();
    
    // Announce chip removal to screen readers
    announceToScreenReader(`Removed $${CHIP_VALUES[chipType]} chip. New total: $${newTotal}`);
    
    // Update chip counts
    setChipCounts(newCounts);
    
    // Notify parent of amount change
    onAmountChange?.(newTotal);
  }, [disabled, chipCounts, hapticService, onAmountChange, announceToScreenReader]);

  /**
   * Clear all chips
   */
  const handleClear = useCallback(() => {
    if (disabled) return;

    const total = calculateTotal;
    if (total === 0) return; // Don't clear if there are no chips

    // Medium haptic feedback for clear action
    hapticService.medium();
    
    // Announce clear action to screen readers
    announceToScreenReader('All chips cleared. Total reset to $0');
    
    setChipCounts({ red: 0, green: 0, black: 0 });
    onAmountChange?.(0);
  }, [disabled, calculateTotal, hapticService, onAmountChange, announceToScreenReader]);

  /**
   * Confirm and process buy-in
   */
  const handleConfirm = useCallback(async () => {
    const total = calculateTotal;
    
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

    const amountValidation = validateBuyInAmount(total);
    if (!amountValidation.isValid) {
      Alert.alert(
        'Invalid Amount',
        amountValidation.error || 'Invalid buy-in amount.',
        [{ text: 'OK' }]
      );
      return;
    }

    const chipValidation = validateChipCounts(chipCounts);
    if (!chipValidation.isValid) {
      Alert.alert(
        'Invalid Chip Count',
        chipValidation.error || 'Invalid chip configuration.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (disabled || isProcessing) return;

    setIsProcessing(true);

    try {
      // Medium haptic feedback for processing
      hapticService.medium();

      // Record buy-in transaction
      const transaction = await transactionService.recordBuyIn(
        sessionId,
        selectedPlayerId!, // We've already validated this is not null above
        total,
        'manual',
        'user',
        `Chip calculator buy-in: ${chipCounts.red}x$5 + ${chipCounts.green}x$25 + ${chipCounts.black}x$100`
      );

      // Success haptic feedback
      hapticService.success();

      // Clear chips after successful transaction
      setChipCounts({ red: 0, green: 0, black: 0 });
      onAmountChange?.(0);

      // Notify parent component
      onBuyInComplete?.(transaction.id, total);

      Alert.alert(
        'Buy-in Successful',
        `$${total} buy-in recorded successfully!`,
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('Chip calculator buy-in failed:', error);
      
      // Error haptic feedback
      hapticService.error();

      const errorMessage = error instanceof Error ? error.message : 'Failed to process buy-in';
      onError?.(errorMessage);
      
      Alert.alert(
        'Buy-in Failed',
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
    }
  }, [selectedPlayerId, disabled, isProcessing, calculateTotal, sessionId, transactionService, hapticService, chipCounts, onBuyInComplete, onError, onAmountChange]);

  /**
   * Render individual chip
   */
  const renderChip = useCallback((chipType: keyof ChipCount, color: string, value: number) => {
    const animation = getChipAnimation(chipType);
    const count = chipCounts[chipType];
    
    return (
      <View key={chipType} style={chipCalculatorStyles.chipStack}>
        <Text style={chipCalculatorStyles.chipLabel}>${value}</Text>
        
        <Animated.View style={{ transform: [{ scale: animation }] }}>
          <TouchableOpacity
            testID={`chip-${value}-button`}
            style={[chipCalculatorStyles.chipButton, { backgroundColor: color }]}
            onPress={() => handleChipAdd(chipType)}
            onLongPress={() => handleChipRemove(chipType)}
            disabled={disabled}
            activeOpacity={0.8}
            accessibilityLabel={`${value} dollar chip`}
            accessibilityHint={`Tap to add, long press to remove. Current count: ${count}`}
            accessibilityRole="button"
          >
            <Text style={chipCalculatorStyles.chipText}>${value}</Text>
          </TouchableOpacity>
        </Animated.View>
        
        <View style={chipCalculatorStyles.chipCountContainer}>
          <Text testID={`chip-${value}-count`} style={chipCalculatorStyles.chipCount}>{count}</Text>
        </View>
      </View>
    );
  }, [chipCounts, disabled, getChipAnimation, handleChipAdd, handleChipRemove]);

  const total = calculateTotal;
  const canConfirm = useMemo(() => 
    total >= TRANSACTION_LIMITS.MIN_BUY_IN && selectedPlayerId && !isProcessing,
    [total, selectedPlayerId, isProcessing]
  );
  const canClear = useMemo(() => total > 0 && !isProcessing, [total, isProcessing]);

  const containerStyle = useMemo(() => 
    isLandscape 
      ? [chipCalculatorStyles.container, landscapeStyles.chipCalculatorLandscape]
      : chipCalculatorStyles.container,
    [isLandscape]
  );

  return (
    <View 
      style={containerStyle}
      accessibilityLabel="Poker Chip Calculator"
      accessibilityHint="Use chips to build custom buy-in amounts. Tap chips to add, long press to remove."
    >
      <Text 
        style={chipCalculatorStyles.title}
        accessibilityRole="header"
      >
        Chip Calculator
      </Text>
      
      {/* Total Display */}
      <View 
        style={chipCalculatorStyles.totalDisplay}
        accessibilityRole="text"
        accessibilityLabel={`Current total amount: $${total}`}
        accessibilityLiveRegion="polite"
      >
        <Text style={chipCalculatorStyles.totalLabel}>Total Amount</Text>
        <Text 
          testID="total-amount"
          style={chipCalculatorStyles.totalAmount}
          accessibilityLabel={`$${total}`}
        >
          ${total}
        </Text>
      </View>
      
      {/* Chips */}
      <View style={chipCalculatorStyles.chipsContainer}>
        {renderChip('red', PokerColors.redChip, CHIP_VALUES.red)}
        {renderChip('green', PokerColors.greenChip, CHIP_VALUES.green)}
        {renderChip('black', PokerColors.blackChip, CHIP_VALUES.black)}
      </View>
      
      {/* Actions */}
      <View style={chipCalculatorStyles.actionsContainer}>
        <TouchableOpacity
          testID="clear-button"
          style={[
            chipCalculatorStyles.clearButton,
            !canClear && chipCalculatorStyles.buttonDisabled,
          ]}
          onPress={handleClear}
          disabled={!canClear}
          accessibilityLabel="Clear all chips"
          accessibilityRole="button"
        >
          <Text style={chipCalculatorStyles.actionButtonText}>Clear</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          testID="confirm-button"
          style={[
            chipCalculatorStyles.confirmButton,
            !canConfirm && chipCalculatorStyles.buttonDisabled,
          ]}
          onPress={handleConfirm}
          disabled={!canConfirm}
          accessibilityLabel={`Confirm buy-in of $${total}`}
          accessibilityRole="button"
        >
          <Text style={chipCalculatorStyles.actionButtonText}>
            {isProcessing ? 'Processing...' : 'Confirm'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Instruction Text */}
      <View style={chipCalculatorStyles.instructionContainer}>
        <Text style={chipCalculatorStyles.instructionText}>
          Tap to add chips • Long press to remove
        </Text>
        {!selectedPlayerId && (
          <Text style={chipCalculatorStyles.errorText}>
            Select a player to enable confirmation
          </Text>
        )}
      </View>
    </View>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const PokerChipCalculator = React.memo(PokerChipCalculatorComponent);

// Set display name for debugging
PokerChipCalculator.displayName = 'PokerChipCalculator';

export default PokerChipCalculator;