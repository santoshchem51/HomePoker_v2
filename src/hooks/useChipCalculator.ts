/**
 * useChipCalculator Hook
 * Story 2.3: Enhanced Touch Interface for Buy-ins - Custom hook for chip calculation
 * 
 * Manages chip counts, amount calculation, and validation logic
 */
import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { HapticService } from '../services/integration/HapticService';
import { TRANSACTION_LIMITS } from '../types/transaction';

interface ChipCount {
  red: number;    // $5 chips
  green: number;  // $25 chips
  black: number;  // $100 chips
}

// Chip denominations
const CHIP_VALUES = {
  red: 5,
  green: 25,
  black: 100,
} as const;

interface UseChipCalculatorProps {
  onAmountChange?: (amount: number) => void;
  maxAmount?: number;
  minAmount?: number;
}

interface UseChipCalculatorReturn {
  chipCounts: ChipCount;
  totalAmount: number;
  addChip: (chipType: keyof ChipCount) => void;
  removeChip: (chipType: keyof ChipCount) => void;
  clearChips: () => void;
  canAddChip: (chipType: keyof ChipCount) => boolean;
  canRemoveChip: (chipType: keyof ChipCount) => boolean;
  isValidAmount: boolean;
  isAboveMinimum: boolean;
  isBelowMaximum: boolean;
  getChipValue: (chipType: keyof ChipCount) => number;
  getBreakdown: () => string;
}

export const useChipCalculator = ({
  onAmountChange,
  maxAmount = TRANSACTION_LIMITS.MAX_BUY_IN,
  minAmount = TRANSACTION_LIMITS.MIN_BUY_IN,
}: UseChipCalculatorProps = {}): UseChipCalculatorReturn => {
  const [chipCounts, setChipCounts] = useState<ChipCount>({
    red: 0,
    green: 0,
    black: 0,
  });

  const hapticService = HapticService.getInstance();

  /**
   * Calculate total amount from chip counts
   */
  const calculateTotal = useCallback((counts: ChipCount): number => {
    return (
      counts.red * CHIP_VALUES.red +
      counts.green * CHIP_VALUES.green +
      counts.black * CHIP_VALUES.black
    );
  }, []);

  const totalAmount = calculateTotal(chipCounts);

  /**
   * Add a chip of the specified type
   */
  const addChip = useCallback((chipType: keyof ChipCount) => {
    const newCounts = {
      ...chipCounts,
      [chipType]: chipCounts[chipType] + 1,
    };

    const newTotal = calculateTotal(newCounts);

    // Check if new total exceeds maximum
    if (newTotal > maxAmount) {
      hapticService.error();
      Alert.alert(
        'Amount Too High',
        `Maximum buy-in amount is $${maxAmount}`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Light haptic feedback for chip addition
    hapticService.light();
    
    // Update chip counts
    setChipCounts(newCounts);
    
    // Notify parent of amount change
    onAmountChange?.(newTotal);
  }, [chipCounts, calculateTotal, maxAmount, hapticService, onAmountChange]);

  /**
   * Remove a chip of the specified type
   */
  const removeChip = useCallback((chipType: keyof ChipCount) => {
    if (chipCounts[chipType] === 0) return;

    const newCounts = {
      ...chipCounts,
      [chipType]: chipCounts[chipType] - 1,
    };

    const newTotal = calculateTotal(newCounts);

    // Light haptic feedback for chip removal
    hapticService.light();
    
    // Update chip counts
    setChipCounts(newCounts);
    
    // Notify parent of amount change
    onAmountChange?.(newTotal);
  }, [chipCounts, calculateTotal, hapticService, onAmountChange]);

  /**
   * Clear all chips
   */
  const clearChips = useCallback(() => {
    // Medium haptic feedback for clear action
    hapticService.medium();
    
    setChipCounts({ red: 0, green: 0, black: 0 });
    onAmountChange?.(0);
  }, [hapticService, onAmountChange]);

  /**
   * Check if a chip can be added (won't exceed maximum)
   */
  const canAddChip = useCallback((chipType: keyof ChipCount): boolean => {
    const testCounts = {
      ...chipCounts,
      [chipType]: chipCounts[chipType] + 1,
    };
    const testTotal = calculateTotal(testCounts);
    return testTotal <= maxAmount;
  }, [chipCounts, calculateTotal, maxAmount]);

  /**
   * Check if a chip can be removed
   */
  const canRemoveChip = useCallback((chipType: keyof ChipCount): boolean => {
    return chipCounts[chipType] > 0;
  }, [chipCounts]);

  /**
   * Check if current amount is valid for transactions
   */
  const isValidAmount = totalAmount >= minAmount && totalAmount <= maxAmount;
  const isAboveMinimum = totalAmount >= minAmount;
  const isBelowMaximum = totalAmount <= maxAmount;

  /**
   * Get chip value for a specific type
   */
  const getChipValue = useCallback((chipType: keyof ChipCount): number => {
    return CHIP_VALUES[chipType];
  }, []);

  /**
   * Get breakdown of chips as a string
   */
  const getBreakdown = useCallback((): string => {
    const parts: string[] = [];
    
    if (chipCounts.red > 0) {
      parts.push(`${chipCounts.red}x$5`);
    }
    if (chipCounts.green > 0) {
      parts.push(`${chipCounts.green}x$25`);
    }
    if (chipCounts.black > 0) {
      parts.push(`${chipCounts.black}x$100`);
    }
    
    return parts.length > 0 ? parts.join(' + ') : 'No chips';
  }, [chipCounts]);

  return {
    chipCounts,
    totalAmount,
    addChip,
    removeChip,
    clearChips,
    canAddChip,
    canRemoveChip,
    isValidAmount,
    isAboveMinimum,
    isBelowMaximum,
    getChipValue,
    getBreakdown,
  };
};