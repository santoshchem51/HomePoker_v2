import React from 'react';
import { Text, View, StyleSheet, TextProps, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { DarkPokerColors, DarkThemeTypography, AccessibilityStyles } from '../../styles/darkTheme.styles';

export type DistanceTextType = 
  | 'criticalBalance' 
  | 'actionButton' 
  | 'playerName' 
  | 'transactionAmount' 
  | 'secondaryInfo' 
  | 'detailText';

export interface DistanceOptimizedTextProps extends TextProps {
  type: DistanceTextType;
  children: React.ReactNode;
  highContrast?: boolean;
  withBackground?: boolean;
  emphasized?: boolean;
}

// Distance-optimized text component with poker room specific visibility enhancements
export const DistanceOptimizedText: React.FC<DistanceOptimizedTextProps> = ({
  type,
  children,
  highContrast = false,
  withBackground = false,
  emphasized = false,
  style,
  ...textProps
}) => {
  const { isDarkMode } = useTheme();

  const getTextStyle = (): TextStyle => {
    const baseStyle = isDarkMode ? DarkThemeTypography[type] : getLightModeStyle(type);
    
    let textColor = baseStyle.color;
    
    if (highContrast) {
      textColor = isDarkMode ? DarkPokerColors.highContrastText : '#000000';
    }

    return {
      ...baseStyle,
      color: textColor,
      fontWeight: emphasized ? 'bold' : baseStyle.fontWeight,
    };
  };

  const getContainerStyle = (): ViewStyle | undefined => {
    if (!withBackground) return undefined;

    return {
      backgroundColor: isDarkMode ? DarkPokerColors.tableGreen : '#E8F5E8',
      paddingVertical: getVerticalPadding(type),
      paddingHorizontal: getHorizontalPadding(type),
      borderRadius: 6,
      alignSelf: 'flex-start',
    };
  };

  const textStyle = getTextStyle();
  const containerStyle = getContainerStyle();

  if (containerStyle) {
    return (
      <View style={containerStyle}>
        <Text 
          style={[textStyle, style]} 
          {...textProps}
          accessibilityRole="text"
        >
          {children}
        </Text>
      </View>
    );
  }

  return (
    <Text 
      style={[textStyle, style]} 
      {...textProps}
      accessibilityRole="text"
    >
      {children}
    </Text>
  );
};

// Balance display component optimized for critical visibility
export interface CriticalBalanceDisplayProps {
  amount: number;
  label?: string;
  currency?: string;
  positive?: boolean;
  negative?: boolean;
  withBackground?: boolean;
}

export const CriticalBalanceDisplay: React.FC<CriticalBalanceDisplayProps> = ({
  amount,
  label,
  currency = '$',
  positive,
  negative,
  withBackground = true,
}) => {
  const { isDarkMode } = useTheme();

  const formatAmount = (value: number): string => {
    return `${currency}${Math.abs(value).toFixed(2)}`;
  };

  const getAmountColor = (): string => {
    if (positive) return isDarkMode ? DarkPokerColors.success : '#28A745';
    if (negative) return isDarkMode ? DarkPokerColors.error : '#DC3545';
    return isDarkMode ? DarkPokerColors.highContrastText : '#000000';
  };

  const getBackgroundColor = (): string => {
    if (positive) return isDarkMode ? '#1A3A2E' : '#D4EDDA';
    if (negative) return isDarkMode ? '#3A1A1A' : '#F8D7DA';
    return isDarkMode ? DarkPokerColors.tableGreen : '#E8F5E8';
  };

  return (
    <View style={[
      styles.criticalBalanceContainer,
      withBackground && {
        backgroundColor: getBackgroundColor(),
      }
    ]}>
      {label && (
        <DistanceOptimizedText 
          type="secondaryInfo" 
          style={[styles.balanceLabel, { 
            color: isDarkMode ? DarkPokerColors.secondaryText : '#6C757D' 
          }]}
        >
          {label}
        </DistanceOptimizedText>
      )}
      <DistanceOptimizedText
        type="criticalBalance"
        style={[styles.balanceAmount, { color: getAmountColor() }]}
      >
        {negative && amount > 0 ? '-' : ''}{formatAmount(amount)}
      </DistanceOptimizedText>
    </View>
  );
};

// Action button text component with enhanced visibility
export interface ActionButtonTextProps {
  children: React.ReactNode;
  primary?: boolean;
  secondary?: boolean;
  disabled?: boolean;
}

export const ActionButtonText: React.FC<ActionButtonTextProps> = ({
  children,
  primary = false,
  secondary = false,
  disabled = false,
}) => {
  const { isDarkMode } = useTheme();

  const getTextColor = (): string => {
    if (disabled) {
      return isDarkMode ? DarkPokerColors.disabledText : '#ADB5BD';
    }
    if (primary) {
      return isDarkMode ? DarkPokerColors.background : '#FFFFFF';
    }
    if (secondary) {
      return isDarkMode ? DarkPokerColors.primaryText : '#343A40';
    }
    return isDarkMode ? DarkPokerColors.buttonText : '#FFFFFF';
  };

  return (
    <DistanceOptimizedText
      type="actionButton"
      style={[styles.actionButtonText, { color: getTextColor() }]}
    >
      {children}
    </DistanceOptimizedText>
  );
};

// Player information display optimized for distance viewing
export interface PlayerInfoDisplayProps {
  name: string;
  balance: number;
  status: 'active' | 'waiting' | 'cashedOut';
  compact?: boolean;
}

export const PlayerInfoDisplay: React.FC<PlayerInfoDisplayProps> = ({
  name,
  balance,
  status,
  compact = false,
}) => {
  const { isDarkMode } = useTheme();

  const getStatusColor = (): string => {
    switch (status) {
      case 'active':
        return isDarkMode ? DarkPokerColors.active : '#28A745';
      case 'waiting':
        return isDarkMode ? DarkPokerColors.waiting : '#FFC107';
      case 'cashedOut':
        return isDarkMode ? DarkPokerColors.cashedOut : '#6C757D';
      default:
        return isDarkMode ? DarkPokerColors.secondaryText : '#6C757D';
    }
  };

  const getStatusText = (): string => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'waiting':
        return 'Waiting';
      case 'cashedOut':
        return 'Cashed Out';
      default:
        return '';
    }
  };

  return (
    <View style={compact ? styles.compactPlayerInfo : styles.playerInfoContainer}>
      <View style={styles.playerHeader}>
        <DistanceOptimizedText type="playerName" emphasized>
          {name}
        </DistanceOptimizedText>
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]}>
          <DistanceOptimizedText 
            type="detailText" 
            style={[styles.statusText, { 
              color: isDarkMode ? DarkPokerColors.background : '#FFFFFF' 
            }]}
          >
            {getStatusText()}
          </DistanceOptimizedText>
        </View>
      </View>
      
      <CriticalBalanceDisplay
        amount={balance}
        label={compact ? undefined : "Balance"}
        positive={balance > 0}
        negative={balance < 0}
        withBackground={!compact}
      />
    </View>
  );
};

// Helper functions
const getLightModeStyle = (type: DistanceTextType): TextStyle => {
  const baseStyles = {
    criticalBalance: { fontSize: 24, fontWeight: 'bold' as const, color: '#000000', lineHeight: 32 },
    actionButton: { fontSize: 20, fontWeight: 'bold' as const, color: '#FFFFFF', lineHeight: 28 },
    playerName: { fontSize: 18, fontWeight: '600' as const, color: '#212529', lineHeight: 24 },
    transactionAmount: { fontSize: 20, fontWeight: 'bold' as const, color: '#000000', lineHeight: 28 },
    secondaryInfo: { fontSize: 16, fontWeight: '500' as const, color: '#6C757D', lineHeight: 22 },
    detailText: { fontSize: 14, fontWeight: '400' as const, color: '#6C757D', lineHeight: 20 },
  };
  return baseStyles[type];
};

const getVerticalPadding = (type: DistanceTextType): number => {
  switch (type) {
    case 'criticalBalance':
    case 'transactionAmount':
      return 12;
    case 'actionButton':
      return 10;
    case 'playerName':
      return 8;
    default:
      return 6;
  }
};

const getHorizontalPadding = (type: DistanceTextType): number => {
  switch (type) {
    case 'criticalBalance':
    case 'transactionAmount':
      return 16;
    case 'actionButton':
      return 20;
    case 'playerName':
      return 12;
    default:
      return 10;
  }
};

const styles = StyleSheet.create({
  criticalBalanceContainer: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginVertical: 4,
  },

  balanceLabel: {
    marginBottom: 4,
    textAlign: 'center',
  },

  balanceAmount: {
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  actionButtonText: {
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  playerInfoContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },

  compactPlayerInfo: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },

  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  statusIndicator: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
});