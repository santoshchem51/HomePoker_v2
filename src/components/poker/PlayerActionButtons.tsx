/**
 * PlayerActionButtons - Buy-in and Cash-out action buttons for player rows
 * Provides contextual transaction actions directly on each player card
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Player } from '../../types/player';
import { useTheme } from '../../contexts/ThemeContext';
import { DarkPokerColors } from '../../styles/darkTheme.styles';

export interface PlayerActionButtonsProps {
  player: Player;
  onBuyInPress: (playerId: string) => void;
  onCashOutPress: (playerId: string) => void;
  disabled?: boolean;
}

export const PlayerActionButtons: React.FC<PlayerActionButtonsProps> = ({
  player,
  onBuyInPress,
  onCashOutPress,
  disabled = false
}) => {
  const { isDarkMode } = useTheme();

  // Determine button visibility and states
  const canBuyIn = player.status === 'active' && !disabled;
  const canCashOut = player.status === 'active' && player.currentBalance > 0 && !disabled;

  const handleBuyInPress = () => {
    if (canBuyIn) {
      onBuyInPress(player.id);
    }
  };

  const handleCashOutPress = () => {
    if (canCashOut) {
      onCashOutPress(player.id);
    }
  };

  return (
    <View style={styles.container}>
      {/* Buy-in Button - Always visible for active players */}
      <TouchableOpacity
        style={[
          styles.actionButton,
          styles.buyInButton,
          {
            backgroundColor: canBuyIn 
              ? (isDarkMode ? DarkPokerColors.greenChip : '#27AE60')
              : (isDarkMode ? DarkPokerColors.buttonDisabled : '#E9ECEF'),
            borderColor: isDarkMode ? DarkPokerColors.border : '#BDC3C7'
          }
        ]}
        onPress={handleBuyInPress}
        disabled={!canBuyIn}
        activeOpacity={canBuyIn ? 0.7 : 1}
      >
        <Text style={[
          styles.buttonText,
          {
            color: canBuyIn 
              ? '#FFFFFF'
              : (isDarkMode ? DarkPokerColors.buttonTextDisabled : '#6C757D')
          }
        ]}>
          💰 Buy-in
        </Text>
      </TouchableOpacity>

      {/* Cash-out Button - Only visible when player has balance */}
      {canCashOut ? (
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.cashOutButton,
            {
              backgroundColor: isDarkMode ? DarkPokerColors.warning : '#E67E22',
              borderColor: isDarkMode ? DarkPokerColors.border : '#BDC3C7'
            }
          ]}
          onPress={handleCashOutPress}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>
            💸 Cash-out
          </Text>
        </TouchableOpacity>
      ) : (
        // Placeholder to maintain consistent spacing
        <View style={[styles.actionButton, styles.placeholderButton]} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BDC3C7',
    minWidth: 80,
    minHeight: 44, // Accessibility compliance
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyInButton: {
    backgroundColor: '#27AE60',
  },
  cashOutButton: {
    backgroundColor: '#E67E22',
  },
  placeholderButton: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});