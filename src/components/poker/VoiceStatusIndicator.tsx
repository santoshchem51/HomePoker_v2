/**
 * VoiceStatusIndicator Component
 * Story 2.6A: Basic Voice Fallback - Simple visual indicator component
 * 
 * Basic visual indicator for voice availability state with simple enabled/disabled display.
 * Integrates with voiceStore for state management following poker theme.
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { useVoiceStore } from '../../stores/voiceStore';

interface VoiceStatusIndicatorProps {
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export const VoiceStatusIndicator: React.FC<VoiceStatusIndicatorProps> = ({
  size = 'medium',
  showLabel = true,
}) => {
  const { voiceAvailable, inputMode } = useVoiceStore();

  const getIndicatorStyle = () => {
    const sizeStyles = {
      small: styles.indicatorSmall,
      medium: styles.indicatorMedium,
      large: styles.indicatorLarge,
    };

    const statusStyles = voiceAvailable 
      ? styles.indicatorAvailable 
      : styles.indicatorUnavailable;

    return [styles.indicator, sizeStyles[size], statusStyles];
  };

  const getStatusText = (): string => {
    if (!voiceAvailable) {
      return 'Voice Unavailable';
    }
    return inputMode === 'voice' ? 'Voice Mode' : 'Manual Mode';
  };

  const getStatusColor = (): string => {
    if (!voiceAvailable) {
      return '#F44336'; // Red for unavailable
    }
    return inputMode === 'voice' ? '#4CAF50' : '#FF9800'; // Green for voice, orange for manual
  };

  return (
    <View style={styles.container}>
      <View style={getIndicatorStyle()} />
      {showLabel && (
        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>
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
  indicator: {
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  indicatorSmall: {
    width: 12,
    height: 12,
  },
  indicatorMedium: {
    width: 16,
    height: 16,
  },
  indicatorLarge: {
    width: 20,
    height: 20,
  },
  indicatorAvailable: {
    backgroundColor: '#4CAF50', // Green for available
  },
  indicatorUnavailable: {
    backgroundColor: '#F44336', // Red for unavailable
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default VoiceStatusIndicator;