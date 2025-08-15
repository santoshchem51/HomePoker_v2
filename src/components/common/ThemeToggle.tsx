import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { DarkPokerColors, DarkThemeTypography } from '../../styles/darkTheme.styles';

export interface ThemeToggleProps {
  showLabels?: boolean;
  compact?: boolean;
  iconOnly?: boolean;
}

const THEME_LABELS = {
  auto: 'Auto',
  dark: 'Dark',
  light: 'Light',
} as const;

const THEME_DESCRIPTIONS = {
  auto: 'Follow system setting',
  dark: 'Dark mode (poker room optimized)',
  light: 'Light mode',
} as const;

const THEME_ICONS = {
  auto: '🌓',
  dark: '🌙',
  light: '☀️',
} as const;

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  showLabels = true,
  compact = false,
  iconOnly = false,
}) => {
  const { currentTheme, toggleTheme, isDarkMode } = useTheme();

  const textColor = isDarkMode ? DarkPokerColors.primaryText : '#212529';
  const secondaryTextColor = isDarkMode ? DarkPokerColors.secondaryText : '#6C757D';
  const surfaceColor = isDarkMode ? DarkPokerColors.surfaceBackground : '#F8F9FA';
  const buttonColor = isDarkMode ? DarkPokerColors.cardBackground : '#FFFFFF';
  const selectedColor = isDarkMode ? DarkPokerColors.selected : '#007BFF';

  if (iconOnly) {
    return (
      <TouchableOpacity
        style={[styles.iconOnlyButton, { backgroundColor: buttonColor }]}
        onPress={toggleTheme}
        accessibilityLabel={`Current theme: ${THEME_LABELS[currentTheme]}. Tap to change theme.`}
        accessibilityHint={THEME_DESCRIPTIONS[currentTheme]}
        accessibilityRole="button"
      >
        <Text style={styles.iconOnlyText}>
          {THEME_ICONS[currentTheme]}
        </Text>
      </TouchableOpacity>
    );
  }

  const containerStyle = compact ? styles.compactContainer : styles.container;

  return (
    <View style={[containerStyle, { backgroundColor: surfaceColor }]}>
      {showLabels && (
        <Text style={[styles.title, { color: textColor }]}>
          Appearance
        </Text>
      )}

      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            {
              backgroundColor: buttonColor,
              borderColor: currentTheme === 'auto' ? selectedColor : (isDarkMode ? DarkPokerColors.border : '#DEE2E6'),
              borderWidth: currentTheme === 'auto' ? 2 : 1,
            }
          ]}
          onPress={() => {
            if (currentTheme !== 'auto') {
              toggleTheme();
            }
          }}
          accessibilityLabel="Auto theme mode"
          accessibilityHint="Follow system appearance setting"
          accessibilityRole="button"
          accessibilityState={{ selected: currentTheme === 'auto' }}
        >
          <Text style={styles.toggleIcon}>{THEME_ICONS.auto}</Text>
          {!compact && (
            <Text style={[
              styles.toggleText,
              {
                color: currentTheme === 'auto' ? selectedColor : textColor,
                fontWeight: currentTheme === 'auto' ? '600' : '400',
              }
            ]}>
              {THEME_LABELS.auto}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleButton,
            {
              backgroundColor: buttonColor,
              borderColor: currentTheme === 'dark' ? selectedColor : (isDarkMode ? DarkPokerColors.border : '#DEE2E6'),
              borderWidth: currentTheme === 'dark' ? 2 : 1,
            }
          ]}
          onPress={() => {
            if (currentTheme !== 'dark') {
              toggleTheme();
            }
          }}
          accessibilityLabel="Dark theme mode"
          accessibilityHint="Dark mode optimized for poker rooms"
          accessibilityRole="button"
          accessibilityState={{ selected: currentTheme === 'dark' }}
        >
          <Text style={styles.toggleIcon}>{THEME_ICONS.dark}</Text>
          {!compact && (
            <Text style={[
              styles.toggleText,
              {
                color: currentTheme === 'dark' ? selectedColor : textColor,
                fontWeight: currentTheme === 'dark' ? '600' : '400',
              }
            ]}>
              {THEME_LABELS.dark}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleButton,
            {
              backgroundColor: buttonColor,
              borderColor: currentTheme === 'light' ? selectedColor : (isDarkMode ? DarkPokerColors.border : '#DEE2E6'),
              borderWidth: currentTheme === 'light' ? 2 : 1,
            }
          ]}
          onPress={() => {
            if (currentTheme !== 'light') {
              toggleTheme();
            }
          }}
          accessibilityLabel="Light theme mode"
          accessibilityHint="Light mode for well-lit environments"
          accessibilityRole="button"
          accessibilityState={{ selected: currentTheme === 'light' }}
        >
          <Text style={styles.toggleIcon}>{THEME_ICONS.light}</Text>
          {!compact && (
            <Text style={[
              styles.toggleText,
              {
                color: currentTheme === 'light' ? selectedColor : textColor,
                fontWeight: currentTheme === 'light' ? '600' : '400',
              }
            ]}>
              {THEME_LABELS.light}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {showLabels && !compact && (
        <Text style={[styles.description, { color: secondaryTextColor }]}>
          {THEME_DESCRIPTIONS[currentTheme]}
        </Text>
      )}
    </View>
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

  title: {
    ...DarkThemeTypography.playerName,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },

  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },

  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    // Enhanced touch target for distance interaction
    minHeight: 56,
  },

  toggleIcon: {
    fontSize: 24,
    marginBottom: 4,
  },

  toggleText: {
    ...DarkThemeTypography.detailText,
    fontSize: 12,
    textAlign: 'center',
  },

  description: {
    ...DarkThemeTypography.detailText,
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 18,
  },

  iconOnlyButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DEE2E6',
  },

  iconOnlyText: {
    fontSize: 20,
  },
});