import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';
import { DarkPokerColors } from '../../styles/darkTheme.styles';

interface ChipAnimationProps {
  amount: number;
  type: 'buy-in' | 'cash-out';
  onComplete: () => void;
  startX?: number;
  startY?: number;
}

const ChipAnimation: React.FC<ChipAnimationProps> = ({
  amount,
  type,
  onComplete,
  startX = 0,
  startY = 0,
}) => {
  const { isDarkMode } = useTheme();
  const translateY = useSharedValue(startY);
  const translateX = useSharedValue(startX);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    // Initial entrance - chip appears and scales up (slower)
    scale.value = withSpring(1, { damping: 20, stiffness: 200 });
    opacity.value = withTiming(1, { duration: 400 });

    // Flying animation based on transaction type (much slower and more dramatic)
    if (type === 'buy-in') {
      // Fly up and slightly to the center (toward the pot) - slower spring
      translateY.value = withSpring(-250, { damping: 18, stiffness: 80 });
      translateX.value = withSpring(30, { damping: 18, stiffness: 80 });
      rotation.value = withSpring(20, { damping: 15, stiffness: 60 });
    } else {
      // Cash-out: fly down and away (leaving the table) - slower spring
      translateY.value = withSpring(200, { damping: 18, stiffness: 80 });
      translateX.value = withSpring(-40, { damping: 18, stiffness: 80 });
      rotation.value = withSpring(-20, { damping: 15, stiffness: 60 });
    }

    // Exit animation after longer delay (more time to appreciate the flight)
    const timer = setTimeout(() => {
      scale.value = withSequence(
        withSpring(1.4, { damping: 12, stiffness: 100 }),
        withSpring(0, { damping: 18, stiffness: 120 }, () => {
          runOnJS(onComplete)();
        })
      );
      opacity.value = withTiming(0, { duration: 500 });
    }, 2000); // Increased from 1200ms to 2000ms

    return () => clearTimeout(timer);
  }, [amount, type, onComplete]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  const chipColor = type === 'buy-in' 
    ? (isDarkMode ? DarkPokerColors.success : '#4CAF50')
    : (isDarkMode ? DarkPokerColors.goldChip : '#FF9800');

  const chipBorderColor = type === 'buy-in'
    ? (isDarkMode ? '#2E7D32' : '#388E3C')
    : (isDarkMode ? '#F57C00' : '#F57C00');

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={[
        styles.chip,
        {
          backgroundColor: chipColor,
          borderColor: chipBorderColor,
        }
      ]}>
        <Text style={[
          styles.chipText,
          { color: isDarkMode ? DarkPokerColors.background : '#fff' }
        ]}>
          {type === 'buy-in' ? '+' : '-'}${Math.abs(amount)}
        </Text>
      </View>
      <View style={[
        styles.chipShadow,
        { backgroundColor: chipColor }
      ]} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  chip: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  chipText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  chipShadow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    opacity: 0.2,
    top: 6,
    zIndex: -1,
  },
});

export default ChipAnimation;