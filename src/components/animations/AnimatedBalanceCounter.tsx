import React, { useEffect } from 'react';
import { TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useDerivedValue as _useDerivedValue,
  withTiming,
  interpolate as _interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { TextInput } from 'react-native';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface AnimatedBalanceCounterProps {
  value: number;
  duration?: number;
  style?: TextStyle;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

const AnimatedBalanceCounter: React.FC<AnimatedBalanceCounterProps> = ({
  value,
  duration = 1200, // Increased from 800ms to 1200ms for more visible counting
  style,
  prefix = '$',
  suffix = '',
  decimals = 0,
}) => {
  const animatedValue = useSharedValue(0);
  const previousValue = useSharedValue(0);

  useEffect(() => {
    previousValue.value = animatedValue.value;
    animatedValue.value = withTiming(value, { duration });
  }, [value, duration]);

  // Create animated props for the text input
  const animatedProps = useAnimatedProps(() => {
    const currentValue = animatedValue.value;
    const formattedValue = decimals > 0 
      ? currentValue.toFixed(decimals)
      : Math.round(currentValue).toString();
    
    const displayText = `${prefix}${formattedValue}${suffix}`;
    
    return {
      text: displayText,
      defaultValue: displayText,
    } as any;
  });

  // Add subtle scale animation when value changes
  const scaleValue = useSharedValue(1);
  
  useEffect(() => {
    if (Math.abs(value - previousValue.value) > 0) {
      scaleValue.value = withTiming(1.05, { duration: 150 }, () => {
        scaleValue.value = withTiming(1, { duration: 150 });
      });
    }
  }, [value]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <AnimatedTextInput
        editable={false}
        style={[
          {
            color: style?.color || '#000',
            fontSize: style?.fontSize || 16,
            fontWeight: style?.fontWeight || 'normal',
            textAlign: style?.textAlign || 'left',
            backgroundColor: 'transparent',
            borderWidth: 0,
            padding: 0,
            margin: 0,
            ...style,
          },
        ]}
        animatedProps={animatedProps}
        selectTextOnFocus={false}
        showSoftInputOnFocus={false}
      />
    </Animated.View>
  );
};

export default AnimatedBalanceCounter;