import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../contexts/ThemeContext';
import { DarkPokerColors, DarkThemeTypography } from '../../styles/darkTheme.styles';
import { setBatteryOptimization, getBatteryOptimizationStatus, getAnimationPerformanceMetrics } from '../../styles/minimalAnimations.styles';

const ANIMATION_SETTINGS_KEY = 'pokepot_animation_settings';

export interface AnimationSettings {
  batteryOptimizationEnabled: boolean;
  showPerformanceMetrics: boolean;
}

export interface AnimationToggleProps {
  showMetrics?: boolean;
  compact?: boolean;
}

export const AnimationToggle: React.FC<AnimationToggleProps> = ({
  showMetrics = false,
  compact = false,
}) => {
  const { isDarkMode } = useTheme();
  const [settings, setSettings] = useState<AnimationSettings>({
    batteryOptimizationEnabled: false,
    showPerformanceMetrics: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load animation settings from AsyncStorage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await AsyncStorage.getItem(ANIMATION_SETTINGS_KEY);
        if (savedSettings) {
          const parsedSettings: AnimationSettings = JSON.parse(savedSettings);
          setSettings(parsedSettings);
          setBatteryOptimization(parsedSettings.batteryOptimizationEnabled);
        }
      } catch (error) {
        console.warn('Failed to load animation settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Save settings to AsyncStorage
  const saveSettings = async (newSettings: AnimationSettings) => {
    try {
      await AsyncStorage.setItem(ANIMATION_SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
      setBatteryOptimization(newSettings.batteryOptimizationEnabled);
    } catch (error) {
      console.warn('Failed to save animation settings:', error);
    }
  };

  const toggleBatteryOptimization = () => {
    const newSettings = {
      ...settings,
      batteryOptimizationEnabled: !settings.batteryOptimizationEnabled,
    };
    saveSettings(newSettings);
  };

  const togglePerformanceMetrics = () => {
    const newSettings = {
      ...settings,
      showPerformanceMetrics: !settings.showPerformanceMetrics,
    };
    saveSettings(newSettings);
  };

  if (isLoading) {
    return (
      <View style={[
        compact ? styles.compactContainer : styles.container,
        { backgroundColor: isDarkMode ? DarkPokerColors.surfaceBackground : '#F8F9FA' }
      ]}>
        <Text style={[styles.loadingText, { 
          color: isDarkMode ? DarkPokerColors.secondaryText : '#6C757D' 
        }]}>
          Loading animation settings...
        </Text>
      </View>
    );
  }

  const textColor = isDarkMode ? DarkPokerColors.primaryText : '#212529';
  const secondaryTextColor = isDarkMode ? DarkPokerColors.secondaryText : '#6C757D';
  const surfaceColor = isDarkMode ? DarkPokerColors.surfaceBackground : '#F8F9FA';

  return (
    <View style={[
      compact ? styles.compactContainer : styles.container,
      { backgroundColor: surfaceColor }
    ]}>
      {!compact && (
        <Text style={[styles.title, { color: textColor }]}>
          Performance & Battery
        </Text>
      )}

      {/* Battery Optimization Toggle */}
      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={[styles.settingTitle, { color: textColor }]}>
            Battery Optimization
          </Text>
          <Text style={[styles.settingDescription, { color: secondaryTextColor }]}>
            {settings.batteryOptimizationEnabled 
              ? 'Animations disabled for maximum battery life'
              : 'Minimal animations enabled (200ms opacity transitions)'}
          </Text>
        </View>
        <Switch
          value={settings.batteryOptimizationEnabled}
          onValueChange={toggleBatteryOptimization}
          trackColor={{
            false: isDarkMode ? DarkPokerColors.border : '#DEE2E6',
            true: isDarkMode ? DarkPokerColors.selected : '#007BFF',
          }}
          thumbColor={
            settings.batteryOptimizationEnabled 
              ? (isDarkMode ? DarkPokerColors.goldChip : '#FFC107')
              : (isDarkMode ? DarkPokerColors.disabledText : '#ADB5BD')
          }
          accessibilityLabel="Toggle battery optimization mode"
          accessibilityHint={
            settings.batteryOptimizationEnabled
              ? 'Currently optimized for battery life with no animations'
              : 'Currently using minimal animations for better user experience'
          }
        />
      </View>

      {/* Performance Metrics Toggle */}
      {showMetrics && (
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, { color: textColor }]}>
              Show Performance Metrics
            </Text>
            <Text style={[styles.settingDescription, { color: secondaryTextColor }]}>
              Display animation performance data for debugging
            </Text>
          </View>
          <Switch
            value={settings.showPerformanceMetrics}
            onValueChange={togglePerformanceMetrics}
            trackColor={{
              false: isDarkMode ? DarkPokerColors.border : '#DEE2E6',
              true: isDarkMode ? DarkPokerColors.info : '#17A2B8',
            }}
            thumbColor={
              settings.showPerformanceMetrics 
                ? (isDarkMode ? DarkPokerColors.info : '#17A2B8')
                : (isDarkMode ? DarkPokerColors.disabledText : '#ADB5BD')
            }
            accessibilityLabel="Toggle performance metrics display"
            accessibilityHint="Show or hide animation performance debugging information"
          />
        </View>
      )}

      {/* Performance Metrics Display */}
      {settings.showPerformanceMetrics && (
        <PerformanceMetricsDisplay />
      )}

      {/* Battery Savings Info */}
      {settings.batteryOptimizationEnabled && (
        <View style={[styles.infoBox, {
          backgroundColor: isDarkMode ? DarkPokerColors.tableGreen : '#D4EDDA',
          borderColor: isDarkMode ? DarkPokerColors.success : '#C3E6CB',
        }]}>
          <Text style={[styles.infoText, {
            color: isDarkMode ? DarkPokerColors.primaryText : '#155724',
          }]}>
            🔋 Battery optimization active - All animations disabled for extended poker sessions
          </Text>
        </View>
      )}

      {/* Animation Performance Info */}
      {!settings.batteryOptimizationEnabled && !compact && (
        <View style={[styles.infoBox, {
          backgroundColor: isDarkMode ? DarkPokerColors.cardBackground : '#F8F9FA',
          borderColor: isDarkMode ? DarkPokerColors.border : '#E9ECEF',
        }]}>
          <Text style={[styles.infoText, { color: secondaryTextColor }]}>
            ⚡ Minimal animations active - Only essential 200ms opacity transitions for better UX while conserving battery
          </Text>
        </View>
      )}
    </View>
  );
};

// Performance metrics display component
const PerformanceMetricsDisplay: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [metrics, setMetrics] = useState(getAnimationPerformanceMetrics());

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(getAnimationPerformanceMetrics());
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  const textColor = isDarkMode ? DarkPokerColors.primaryText : '#212529';
  const secondaryTextColor = isDarkMode ? DarkPokerColors.secondaryText : '#6C757D';

  return (
    <View style={[styles.metricsContainer, {
      backgroundColor: isDarkMode ? DarkPokerColors.cardBackground : '#FFFFFF',
      borderColor: isDarkMode ? DarkPokerColors.border : '#DEE2E6',
    }]}>
      <Text style={[styles.metricsTitle, { color: textColor }]}>
        Performance Metrics
      </Text>
      
      <View style={styles.metricsGrid}>
        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, { color: secondaryTextColor }]}>
            Frame Time
          </Text>
          <Text style={[styles.metricValue, { color: textColor }]}>
            {metrics.averageFrameTime.toFixed(2)}ms
          </Text>
        </View>
        
        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, { color: secondaryTextColor }]}>
            Dropped Frames
          </Text>
          <Text style={[styles.metricValue, { color: textColor }]}>
            {metrics.droppedFrames}
          </Text>
        </View>
        
        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, { color: secondaryTextColor }]}>
            Battery Mode
          </Text>
          <Text style={[styles.metricValue, { 
            color: metrics.batteryOptimizationEnabled 
              ? (isDarkMode ? DarkPokerColors.success : '#28A745')
              : (isDarkMode ? DarkPokerColors.warning : '#FFC107')
          }]}>
            {metrics.batteryOptimizationEnabled ? 'Optimized' : 'Normal'}
          </Text>
        </View>
      </View>
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

  loadingText: {
    ...DarkThemeTypography.secondaryInfo,
    textAlign: 'center',
    padding: 20,
  },

  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
  },

  settingInfo: {
    flex: 1,
    marginRight: 16,
  },

  settingTitle: {
    ...DarkThemeTypography.secondaryInfo,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },

  settingDescription: {
    ...DarkThemeTypography.detailText,
    lineHeight: 18,
  },

  infoBox: {
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
  },

  infoText: {
    ...DarkThemeTypography.detailText,
    lineHeight: 18,
    textAlign: 'center',
  },

  metricsContainer: {
    borderRadius: 8,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
  },

  metricsTitle: {
    ...DarkThemeTypography.secondaryInfo,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },

  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  metricItem: {
    flex: 1,
    alignItems: 'center',
  },

  metricLabel: {
    ...DarkThemeTypography.detailText,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
  },

  metricValue: {
    ...DarkThemeTypography.secondaryInfo,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});