import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { DarkPokerColors, DarkThemeTypography, DarkThemeStyles } from '../../styles/darkTheme.styles';

// Fallback slider implementation since @react-native-community/slider is not available
const FallbackSlider: React.FC<{
  style?: any;
  minimumValue: number;
  maximumValue: number;
  value: number;
  onValueChange: (value: number) => void;
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
  thumbStyle?: any;
  trackStyle?: any;
}> = ({ minimumValue, maximumValue, value, onValueChange, style }) => {
  const { isDarkMode } = useTheme();
  
  const handlePress = (percentage: number) => {
    const newValue = minimumValue + (maximumValue - minimumValue) * percentage;
    onValueChange(newValue);
  };

  const valuePercentage = (value - minimumValue) / (maximumValue - minimumValue);

  return (
    <View style={[{ flex: 1, height: 40, justifyContent: 'center', marginHorizontal: 16 }, style]}>
      <View style={{
        height: 6,
        backgroundColor: isDarkMode ? DarkPokerColors.border : '#DEE2E6',
        borderRadius: 3,
        position: 'relative',
      }}>
        <View style={{
          height: 6,
          backgroundColor: isDarkMode ? DarkPokerColors.selected : '#007BFF',
          borderRadius: 3,
          width: `${valuePercentage * 100}%`,
        }} />
        <TouchableOpacity
          style={{
            position: 'absolute',
            left: `${valuePercentage * 100}%`,
            top: -9,
            width: 24,
            height: 24,
            backgroundColor: isDarkMode ? DarkPokerColors.selected : '#007BFF',
            borderRadius: 12,
            marginLeft: -12,
          }}
          onPress={() => handlePress(valuePercentage)}
        />
      </View>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
      }}>
        <TouchableOpacity onPress={() => handlePress(0)}>
          <Text style={{ fontSize: 12, color: isDarkMode ? DarkPokerColors.secondaryText : '#6C757D' }}>
            {Math.round(minimumValue * 100)}%
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handlePress(0.5)}>
          <Text style={{ fontSize: 12, color: isDarkMode ? DarkPokerColors.secondaryText : '#6C757D' }}>
            50%
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handlePress(1)}>
          <Text style={{ fontSize: 12, color: isDarkMode ? DarkPokerColors.secondaryText : '#6C757D' }}>
            100%
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export interface BrightnessControlProps {
  showPresets?: boolean;
  showTitle?: boolean;
  compact?: boolean;
}

// Poker-optimized brightness presets
const BRIGHTNESS_PRESETS = [
  { label: 'Dim', value: 0.3, description: 'Minimal light for dim poker rooms' },
  { label: 'Medium', value: 0.6, description: 'Balanced brightness for normal lighting' },
  { label: 'Bright', value: 1.0, description: 'Full brightness for well-lit areas' },
] as const;

export const BrightnessControl: React.FC<BrightnessControlProps> = ({
  showPresets = true,
  showTitle = true,
  compact = false,
}) => {
  const { brightness, setBrightness, isDarkMode } = useTheme();

  const handleSliderChange = (value: number) => {
    // Clamp brightness between 0.3 and 1.0 for poker room optimization
    const clampedValue = Math.max(0.3, Math.min(1.0, value));
    setBrightness(clampedValue);
  };

  const handlePresetPress = (preset: number) => {
    setBrightness(preset);
  };

  const getBrightnessLabel = () => {
    if (brightness >= 0.9) return 'Bright';
    if (brightness >= 0.55) return 'Medium';
    return 'Dim';
  };

  const getBrightnessPercentage = () => {
    return Math.round(brightness * 100);
  };

  const containerStyle = compact ? styles.compactContainer : styles.container;
  const textColor = isDarkMode ? DarkPokerColors.primaryText : '#212529';
  const secondaryTextColor = isDarkMode ? DarkPokerColors.secondaryText : '#6C757D';
  const surfaceColor = isDarkMode ? DarkPokerColors.surfaceBackground : '#F8F9FA';

  return (
    <View style={[containerStyle, { backgroundColor: surfaceColor }]}>
      {showTitle && (
        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]}>
            Screen Brightness
          </Text>
          <Text style={[styles.currentValue, { color: textColor }]}>
            {getBrightnessLabel()} ({getBrightnessPercentage()}%)
          </Text>
        </View>
      )}

      <View style={styles.sliderContainer}>
        <Text style={[styles.sliderLabel, { color: secondaryTextColor }]}>
          Dim
        </Text>
        <FallbackSlider
          style={styles.slider}
          minimumValue={0.3}
          maximumValue={1.0}
          value={brightness}
          onValueChange={handleSliderChange}
          minimumTrackTintColor={isDarkMode ? DarkPokerColors.selected : '#007BFF'}
          maximumTrackTintColor={isDarkMode ? DarkPokerColors.border : '#DEE2E6'}
        />
        <Text style={[styles.sliderLabel, { color: secondaryTextColor }]}>
          Bright
        </Text>
      </View>

      {showPresets && (
        <View style={styles.presetsContainer}>
          <Text style={[styles.presetsTitle, { color: secondaryTextColor }]}>
            Quick Presets:
          </Text>
          <View style={styles.presetButtons}>
            {BRIGHTNESS_PRESETS.map((preset) => {
              const isSelected = Math.abs(brightness - preset.value) < 0.05;
              return (
                <TouchableOpacity
                  key={preset.label}
                  style={[
                    styles.presetButton,
                    {
                      backgroundColor: isSelected
                        ? (isDarkMode ? DarkPokerColors.selected : '#007BFF')
                        : (isDarkMode ? DarkPokerColors.cardBackground : '#FFFFFF'),
                      borderColor: isDarkMode ? DarkPokerColors.border : '#DEE2E6',
                    }
                  ]}
                  onPress={() => handlePresetPress(preset.value)}
                  accessibilityLabel={`Set brightness to ${preset.label} (${Math.round(preset.value * 100)}%)`}
                  accessibilityHint={preset.description}
                  accessibilityRole="button"
                >
                  <Text style={[
                    styles.presetButtonText,
                    {
                      color: isSelected
                        ? (isDarkMode ? DarkPokerColors.background : '#FFFFFF')
                        : textColor
                    }
                  ]}>
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {!compact && (
        <Text style={[styles.description, { color: secondaryTextColor }]}>
          Adjust brightness independently of your device settings for optimal poker room visibility.
        </Text>
      )}
    </View>
  );
};

// Brightness overlay component to be placed at the root level
export interface BrightnessOverlayProps {
  brightness: number;
}

export const BrightnessOverlay: React.FC<BrightnessOverlayProps> = ({ brightness }) => {
  // Only apply overlay if brightness is less than 1.0
  if (brightness >= 1.0) {
    return null;
  }

  const overlayOpacity = 1 - brightness;

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: 'black',
          opacity: overlayOpacity,
          pointerEvents: 'none', // Allow touches to pass through
          zIndex: 1000, // Ensure it's on top of other elements
        }
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  compactContainer: {
    borderRadius: 8,
    padding: 12,
    marginVertical: 4,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  title: {
    ...DarkThemeTypography.playerName,
    fontSize: 18,
    fontWeight: '600',
  },

  currentValue: {
    ...DarkThemeTypography.secondaryInfo,
    fontSize: 16,
    fontWeight: '500',
  },

  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },

  sliderLabel: {
    ...DarkThemeTypography.detailText,
    minWidth: 40,
    textAlign: 'center',
  },

  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 16,
  },

  presetsContainer: {
    marginTop: 16,
  },

  presetsTitle: {
    ...DarkThemeTypography.detailText,
    marginBottom: 8,
  },

  presetButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },

  presetButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // Enhanced touch target for distance interaction
    minHeight: 48,
  },

  presetButtonText: {
    ...DarkThemeTypography.secondaryInfo,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  description: {
    ...DarkThemeTypography.detailText,
    marginTop: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});