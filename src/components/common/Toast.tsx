import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import HapticFeedback from 'react-native-haptic-feedback';
import { useTheme } from '../../contexts/ThemeContext';
import { DarkPokerColors } from '../../styles/darkTheme.styles';

export interface ToastData {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface ToastProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const { isDarkMode } = useTheme();
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    // Trigger haptic feedback
    if (toast.type === 'success') {
      HapticFeedback.trigger('impactLight');
    } else if (toast.type === 'error') {
      HapticFeedback.trigger('impactMedium');
    }

    // Entrance animation
    translateY.value = withSpring(0, { damping: 15, stiffness: 300 });
    opacity.value = withTiming(1, { duration: 200 });
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });

    // Auto dismiss
    const timer = setTimeout(() => {
      // Exit animation
      translateY.value = withSpring(-100, { damping: 15, stiffness: 300 });
      opacity.value = withTiming(0, { duration: 200 }, () => {
        runOnJS(onDismiss)(toast.id);
      });
      scale.value = withSpring(0.9, { damping: 15, stiffness: 300 });
    }, toast.duration || 2000);

    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const getToastStyle = () => {
    switch (toast.type) {
      case 'success':
        return {
          backgroundColor: isDarkMode ? DarkPokerColors.success : '#4CAF50',
          borderLeftColor: isDarkMode ? '#2E7D32' : '#388E3C',
        };
      case 'error':
        return {
          backgroundColor: isDarkMode ? DarkPokerColors.error : '#F44336',
          borderLeftColor: isDarkMode ? '#C62828' : '#D32F2F',
        };
      case 'info':
        return {
          backgroundColor: isDarkMode ? DarkPokerColors.warning : '#FF9800',
          borderLeftColor: isDarkMode ? '#F57C00' : '#F57C00',
        };
      default:
        return {
          backgroundColor: isDarkMode ? DarkPokerColors.cardBackground : '#FFFFFF',
          borderLeftColor: isDarkMode ? DarkPokerColors.primaryText : '#333',
        };
    }
  };

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={[styles.toast, getToastStyle()]}>
        <Text style={[
          styles.title,
          { color: isDarkMode ? DarkPokerColors.background : '#fff' }
        ]}>
          {toast.title}
        </Text>
        {toast.message && (
          <Text style={[
            styles.message,
            { color: isDarkMode ? DarkPokerColors.background : '#fff' }
          ]}>
            {toast.message}
          </Text>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  toast: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    opacity: 0.9,
  },
});

export default Toast;