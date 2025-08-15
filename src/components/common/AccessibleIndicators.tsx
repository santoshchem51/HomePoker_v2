import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { DarkPokerColors, DarkThemeTypography } from '../../styles/darkTheme.styles';

// Chip shape types for accessibility
export type ChipShape = 'circle' | 'square' | 'diamond' | 'triangle' | 'hexagon';
export type ChipValue = 1 | 5 | 10 | 25 | 50 | 100 | 500;

// Pattern types for player status indicators
export type PatternType = 'solid' | 'striped' | 'dotted' | 'checkerboard' | 'diagonal';

// Player status types
export type PlayerStatus = 'active' | 'waiting' | 'selected' | 'cashedOut' | 'inactive';

// Transaction types
export type TransactionType = 'buyIn' | 'cashOut' | 'adjustment' | 'void';

export interface ChipShapeIndicatorProps {
  value: ChipValue;
  size?: number;
  showValue?: boolean;
  style?: ViewStyle;
}

// Shape-based chip indicator for color-blind accessibility
export const ChipShapeIndicator: React.FC<ChipShapeIndicatorProps> = ({
  value,
  size = 44,
  showValue = true,
  style,
}) => {
  const { isDarkMode } = useTheme();

  const getChipShape = (chipValue: ChipValue): ChipShape => {
    switch (chipValue) {
      case 1: return 'circle';
      case 5: return 'circle';     // Red $5 chips - circle
      case 10: return 'square';    // Blue $10 chips - square
      case 25: return 'square';    // Green $25 chips - square
      case 50: return 'diamond';   // Purple $50 chips - diamond
      case 100: return 'diamond';  // Black $100 chips - diamond
      case 500: return 'hexagon';  // Premium $500 chips - hexagon
      default: return 'circle';
    }
  };

  const getChipColor = (chipValue: ChipValue): string => {
    const colors = isDarkMode ? DarkPokerColors : {
      redChip: '#E74C3C',
      greenChip: '#27AE60',
      blackChip: '#343A40',
      goldChip: '#F1C40F',
      blueChip: '#3498DB',
      whiteChip: '#FFFFFF',
    };

    switch (chipValue) {
      case 1: return colors.whiteChip;
      case 5: return colors.redChip;
      case 10: return colors.blueChip;
      case 25: return colors.greenChip;
      case 50: return '#9B59B6'; // Purple for $50
      case 100: return colors.blackChip;
      case 500: return colors.goldChip;
      default: return colors.whiteChip;
    }
  };

  const getTextColor = (chipValue: ChipValue): string => {
    // Ensure high contrast text on chip colors
    if (chipValue === 1 || chipValue === 500) {
      return isDarkMode ? DarkPokerColors.background : '#000000';
    }
    return '#FFFFFF';
  };

  const shape = getChipShape(value);
  const chipColor = getChipColor(value);
  const textColor = getTextColor(value);

  const renderShape = () => {
    const shapeSize = size * 0.8;
    const commonStyle = {
      width: shapeSize,
      height: shapeSize,
      backgroundColor: chipColor,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    };

    switch (shape) {
      case 'circle':
        return (
          <View style={[commonStyle, { borderRadius: shapeSize / 2 }]}>
            {showValue && (
              <Text style={[styles.chipText, { color: textColor, fontSize: size * 0.25 }]}>
                ${value}
              </Text>
            )}
          </View>
        );

      case 'square':
        return (
          <View style={[commonStyle, { borderRadius: 4 }]}>
            {showValue && (
              <Text style={[styles.chipText, { color: textColor, fontSize: size * 0.25 }]}>
                ${value}
              </Text>
            )}
          </View>
        );

      case 'diamond':
        return (
          <View style={[commonStyle, { transform: [{ rotate: '45deg' }] }]}>
            <View style={{ transform: [{ rotate: '-45deg' }] }}>
              {showValue && (
                <Text style={[styles.chipText, { color: textColor, fontSize: size * 0.22 }]}>
                  ${value}
                </Text>
              )}
            </View>
          </View>
        );

      case 'triangle':
        // Implement triangle using borderRadius and transforms
        return (
          <View style={[styles.triangle, { 
            borderBottomColor: chipColor,
            borderBottomWidth: shapeSize * 0.8,
            borderLeftWidth: shapeSize * 0.4,
            borderRightWidth: shapeSize * 0.4,
          }]}>
            {showValue && (
              <Text style={[styles.chipText, { 
                color: textColor, 
                fontSize: size * 0.2,
                position: 'absolute',
                bottom: -shapeSize * 0.3,
                textAlign: 'center',
              }]}>
                ${value}
              </Text>
            )}
          </View>
        );

      case 'hexagon':
        return (
          <View style={[styles.hexagon, { 
            backgroundColor: chipColor,
            width: shapeSize,
            height: shapeSize * 0.87,
          }]}>
            {showValue && (
              <Text style={[styles.chipText, { color: textColor, fontSize: size * 0.22 }]}>
                ${value}
              </Text>
            )}
          </View>
        );

      default:
        return (
          <View style={[commonStyle, { borderRadius: shapeSize / 2 }]}>
            {showValue && (
              <Text style={[styles.chipText, { color: textColor, fontSize: size * 0.25 }]}>
                ${value}
              </Text>
            )}
          </View>
        );
    }
  };

  return (
    <View style={[styles.chipContainer, { width: size, height: size }, style]}>
      {renderShape()}
    </View>
  );
};

export interface PatternIndicatorProps {
  status: PlayerStatus;
  pattern: PatternType;
  size?: number;
  style?: ViewStyle;
}

// Pattern-based status indicator for color-blind accessibility
export const PatternIndicator: React.FC<PatternIndicatorProps> = ({
  status,
  pattern,
  size = 24,
  style,
}) => {
  const { isDarkMode } = useTheme();

  const getStatusColor = (playerStatus: PlayerStatus): string => {
    const colors = isDarkMode ? DarkPokerColors : {
      active: '#28A745',
      waiting: '#FFC107',
      selected: '#007BFF',
      cashedOut: '#6C757D',
      inactive: '#ADB5BD',
    };

    switch (playerStatus) {
      case 'active': return colors.active;
      case 'waiting': return colors.waiting;
      case 'selected': return colors.selected;
      case 'cashedOut': return colors.cashedOut;
      case 'inactive': return colors.cashedOut;
      default: return colors.cashedOut;
    }
  };

  const backgroundColor = getStatusColor(status);
  const patternColor = isDarkMode ? DarkPokerColors.background : '#FFFFFF';

  const renderPattern = () => {
    const patternSize = size;

    switch (pattern) {
      case 'solid':
        return (
          <View style={[
            styles.patternContainer,
            {
              width: patternSize,
              height: patternSize,
              backgroundColor,
              borderRadius: patternSize / 2,
            }
          ]} />
        );

      case 'striped':
        return (
          <View style={[
            styles.patternContainer,
            {
              width: patternSize,
              height: patternSize,
              backgroundColor,
              borderRadius: patternSize / 2,
              overflow: 'hidden',
            }
          ]}>
            {/* Horizontal stripes */}
            <View style={[styles.stripe, { 
              backgroundColor: patternColor,
              height: 2,
              top: patternSize * 0.25,
            }]} />
            <View style={[styles.stripe, { 
              backgroundColor: patternColor,
              height: 2,
              top: patternSize * 0.5,
            }]} />
            <View style={[styles.stripe, { 
              backgroundColor: patternColor,
              height: 2,
              top: patternSize * 0.75,
            }]} />
          </View>
        );

      case 'dotted':
        return (
          <View style={[
            styles.patternContainer,
            {
              width: patternSize,
              height: patternSize,
              backgroundColor,
              borderRadius: patternSize / 2,
              alignItems: 'center',
              justifyContent: 'center',
            }
          ]}>
            {/* Center dot */}
            <View style={[styles.dot, {
              backgroundColor: patternColor,
              width: patternSize * 0.3,
              height: patternSize * 0.3,
              borderRadius: patternSize * 0.15,
            }]} />
          </View>
        );

      case 'checkerboard':
        return (
          <View style={[
            styles.patternContainer,
            {
              width: patternSize,
              height: patternSize,
              backgroundColor,
              borderRadius: 4, // Square for checkerboard
              flexDirection: 'row',
              flexWrap: 'wrap',
            }
          ]}>
            {/* 2x2 checkerboard pattern */}
            {[0, 1, 2, 3].map((index) => (
              <View
                key={index}
                style={{
                  width: patternSize / 2,
                  height: patternSize / 2,
                  backgroundColor: (index % 2 === 0) ? backgroundColor : patternColor,
                }}
              />
            ))}
          </View>
        );

      case 'diagonal':
        return (
          <View style={[
            styles.patternContainer,
            {
              width: patternSize,
              height: patternSize,
              backgroundColor,
              borderRadius: patternSize / 2,
              overflow: 'hidden',
            }
          ]}>
            {/* Diagonal line */}
            <View style={[styles.diagonalLine, {
              backgroundColor: patternColor,
              width: Math.sqrt(2) * patternSize,
              height: 2,
              transform: [{ rotate: '45deg' }],
              alignSelf: 'center',
              top: (patternSize - 2) / 2,
            }]} />
          </View>
        );

      default:
        return (
          <View style={[
            styles.patternContainer,
            {
              width: patternSize,
              height: patternSize,
              backgroundColor,
              borderRadius: patternSize / 2,
            }
          ]} />
        );
    }
  };

  return (
    <View style={[styles.indicatorContainer, style]}>
      {renderPattern()}
    </View>
  );
};

export interface TransactionTypeIndicatorProps {
  type: TransactionType;
  size?: number;
  showLabel?: boolean;
  style?: ViewStyle;
}

// Icon-based transaction type indicator
export const TransactionTypeIndicator: React.FC<TransactionTypeIndicatorProps> = ({
  type,
  size = 32,
  showLabel = true,
  style,
}) => {
  const { isDarkMode } = useTheme();

  const getTransactionIcon = (transactionType: TransactionType): string => {
    switch (transactionType) {
      case 'buyIn': return '⬆️'; // Up arrow for money coming in
      case 'cashOut': return '⬇️'; // Down arrow for money going out
      case 'adjustment': return '↔️'; // Horizontal arrows for adjustments
      case 'void': return '❌'; // X for voided transactions
      default: return '💰'; // Generic money icon
    }
  };

  const getTransactionColor = (transactionType: TransactionType): string => {
    const colors = isDarkMode ? DarkPokerColors : {
      success: '#28A745',
      error: '#DC3545',
      warning: '#FFC107',
      info: '#17A2B8',
    };

    switch (transactionType) {
      case 'buyIn': return colors.success;
      case 'cashOut': return colors.error;
      case 'adjustment': return colors.warning;
      case 'void': return colors.error;
      default: return colors.info;
    }
  };

  const getTransactionLabel = (transactionType: TransactionType): string => {
    switch (transactionType) {
      case 'buyIn': return 'Buy In';
      case 'cashOut': return 'Cash Out';
      case 'adjustment': return 'Adjustment';
      case 'void': return 'Void';
      default: return 'Transaction';
    }
  };

  const icon = getTransactionIcon(type);
  const color = getTransactionColor(type);
  const label = getTransactionLabel(type);

  return (
    <View style={[styles.transactionIndicator, style]}>
      <View style={[styles.iconContainer, {
        backgroundColor: color,
        width: size,
        height: size,
        borderRadius: size / 2,
      }]}>
        <Text style={[styles.iconText, { fontSize: size * 0.5 }]}>
          {icon}
        </Text>
      </View>
      {showLabel && (
        <Text style={[
          styles.transactionLabel,
          {
            color: isDarkMode ? DarkPokerColors.secondaryText : '#6C757D',
            marginTop: 4,
          }
        ]}>
          {label}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  chipContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  chipText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },

  triangle: {
    width: 0,
    height: 0,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },

  hexagon: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  patternContainer: {
    position: 'relative',
  },

  stripe: {
    position: 'absolute',
    left: 0,
    right: 0,
  },

  dot: {
    position: 'absolute',
  },

  diagonalLine: {
    position: 'absolute',
  },

  indicatorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  transactionIndicator: {
    alignItems: 'center',
  },

  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },

  iconText: {
    textAlign: 'center',
  },

  transactionLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});