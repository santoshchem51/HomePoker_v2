import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  Platform,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import HapticFeedback from 'react-native-haptic-feedback';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface AnimatedButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  hapticType?: 'light' | 'medium' | 'heavy';
  scaleAmount?: number;
  enableHaptic?: boolean;
  style?: ViewStyle | ViewStyle[];
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  onPress,
  onPressIn,
  onPressOut,
  hapticType = 'light',
  scaleAmount = 0.95,
  enableHaptic = true,
  disabled = false,
  style,
  ...props
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const triggerHaptic = () => {
    if (enableHaptic && !disabled) {
      const hapticOptions = {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      };

      switch (hapticType) {
        case 'heavy':
          HapticFeedback.trigger('impactHeavy', hapticOptions);
          break;
        case 'medium':
          HapticFeedback.trigger('impactMedium', hapticOptions);
          break;
        case 'light':
        default:
          HapticFeedback.trigger('impactLight', hapticOptions);
          break;
      }
    }
  };

  const handlePressIn = (event: any) => {
    'worklet';
    scale.value = withSpring(scaleAmount, {
      damping: 15,
      stiffness: 400,
    });
    opacity.value = withTiming(0.8, { duration: 100 });
    
    if (enableHaptic) {
      runOnJS(triggerHaptic)();
    }

    if (onPressIn) {
      runOnJS(onPressIn)(event);
    }
  };

  const handlePressOut = (event: any) => {
    'worklet';
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 400,
    });
    opacity.value = withTiming(1, { duration: 100 });

    if (onPressOut) {
      runOnJS(onPressOut)(event);
    }
  };

  const handlePress = (event: any) => {
    if (onPress) {
      onPress(event);
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: disabled ? 0.5 : opacity.value,
    };
  });

  return (
    <AnimatedTouchable
      {...props}
      disabled={disabled}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[animatedStyle, style]}
      activeOpacity={1} // We handle opacity ourselves
    >
      {children}
    </AnimatedTouchable>
  );
};

export default AnimatedButton;