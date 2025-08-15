import { StyleSheet, Platform } from 'react-native';

// Minimal animation configuration for battery conservation
export const ANIMATION_CONFIG = {
  // Reduced animation duration for battery efficiency
  duration: {
    instant: 0,
    fast: 150,
    normal: 200,
    slow: 300,
  },
  
  // Simplified easing for performance
  easing: {
    ease: 'ease-out',
    linear: 'linear',
  },
  
  // Animation toggle for complete battery optimization
  enabled: true, // Can be toggled by user preference
} as const;

// Battery-optimized animation styles
// Focus on opacity and simple transforms only
export const MinimalAnimationStyles = StyleSheet.create({
  // Basic fade transitions (most battery efficient)
  fadeIn: {
    opacity: 1,
    ...(Platform.OS === 'web' && {
      transition: `opacity ${ANIMATION_CONFIG.duration.normal}ms ${ANIMATION_CONFIG.easing.ease}`,
    }),
  },

  fadeOut: {
    opacity: 0,
    ...(Platform.OS === 'web' && {
      transition: `opacity ${ANIMATION_CONFIG.duration.normal}ms ${ANIMATION_CONFIG.easing.ease}`,
    }),
  },

  fadeInFast: {
    opacity: 1,
    ...(Platform.OS === 'web' && {
      transition: `opacity ${ANIMATION_CONFIG.duration.fast}ms ${ANIMATION_CONFIG.easing.ease}`,
    }),
  },

  fadeOutFast: {
    opacity: 0,
    ...(Platform.OS === 'web' && {
      transition: `opacity ${ANIMATION_CONFIG.duration.fast}ms ${ANIMATION_CONFIG.easing.ease}`,
    }),
  },

  // Static state changes (no animation - maximum battery savings)
  staticShow: {
    opacity: 1,
  },

  staticHide: {
    opacity: 0,
  },

  // Minimal button press feedback
  buttonPressed: {
    opacity: 0.7,
    ...(Platform.OS === 'web' && {
      transition: `opacity ${ANIMATION_CONFIG.duration.fast}ms ${ANIMATION_CONFIG.easing.linear}`,
    }),
  },

  buttonReleased: {
    opacity: 1,
    ...(Platform.OS === 'web' && {
      transition: `opacity ${ANIMATION_CONFIG.duration.fast}ms ${ANIMATION_CONFIG.easing.linear}`,
    }),
  },

  // Card selection with minimal animation
  cardSelected: {
    opacity: 1,
    ...(Platform.OS === 'web' && {
      transition: `opacity ${ANIMATION_CONFIG.duration.normal}ms ${ANIMATION_CONFIG.easing.ease}`,
    }),
  },

  cardUnselected: {
    opacity: 0.8,
    ...(Platform.OS === 'web' && {
      transition: `opacity ${ANIMATION_CONFIG.duration.normal}ms ${ANIMATION_CONFIG.easing.ease}`,
    }),
  },

  // Loading states with minimal visual feedback
  loadingPulse: {
    opacity: 0.6,
    ...(Platform.OS === 'web' && {
      animation: 'pulse 1s infinite alternate',
    }),
  },

  // Modal/overlay appearances (minimal slide up)
  modalVisible: {
    opacity: 1,
    ...(Platform.OS === 'web' && {
      transition: `opacity ${ANIMATION_CONFIG.duration.normal}ms ${ANIMATION_CONFIG.easing.ease}`,
    }),
  },

  modalHidden: {
    opacity: 0,
    ...(Platform.OS === 'web' && {
      transition: `opacity ${ANIMATION_CONFIG.duration.normal}ms ${ANIMATION_CONFIG.easing.ease}`,
    }),
  },

  // Status indicator changes (instant for poker focus)
  statusActive: {
    opacity: 1,
  },

  statusInactive: {
    opacity: 0.5,
  },

  statusWaiting: {
    opacity: 0.8,
  },

  // No transform animations (battery hungry)
  // No scale animations (battery hungry)
  // No rotation animations (battery hungry)
  // No complex shadows (battery hungry)
  // No blur effects (battery hungry)
});

// CSS keyframes for web platform (minimal animations only)
export const WEB_KEYFRAMES = `
  @keyframes pulse {
    0% { opacity: 0.6; }
    100% { opacity: 1; }
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
`;

// Animation utility functions
export const getAnimationStyle = (
  isVisible: boolean,
  animationType: 'fade' | 'static' = 'fade',
  speed: 'fast' | 'normal' = 'normal'
) => {
  if (!ANIMATION_CONFIG.enabled || animationType === 'static') {
    return isVisible ? MinimalAnimationStyles.staticShow : MinimalAnimationStyles.staticHide;
  }

  if (speed === 'fast') {
    return isVisible ? MinimalAnimationStyles.fadeInFast : MinimalAnimationStyles.fadeOutFast;
  }

  return isVisible ? MinimalAnimationStyles.fadeIn : MinimalAnimationStyles.fadeOut;
};

export const getButtonAnimationStyle = (isPressed: boolean) => {
  if (!ANIMATION_CONFIG.enabled) {
    return MinimalAnimationStyles.staticShow;
  }

  return isPressed ? MinimalAnimationStyles.buttonPressed : MinimalAnimationStyles.buttonReleased;
};

export const getSelectionAnimationStyle = (isSelected: boolean) => {
  if (!ANIMATION_CONFIG.enabled) {
    return MinimalAnimationStyles.staticShow;
  }

  return isSelected ? MinimalAnimationStyles.cardSelected : MinimalAnimationStyles.cardUnselected;
};

export const getStatusAnimationStyle = (status: 'active' | 'inactive' | 'waiting') => {
  // Status changes are always instant for poker focus
  switch (status) {
    case 'active':
      return MinimalAnimationStyles.statusActive;
    case 'inactive':
      return MinimalAnimationStyles.statusInactive;
    case 'waiting':
      return MinimalAnimationStyles.statusWaiting;
    default:
      return MinimalAnimationStyles.statusInactive;
  }
};

// Battery optimization utilities
export const setBatteryOptimization = (enabled: boolean) => {
  // In a real implementation, this would be stored in AsyncStorage
  // For now, we modify the config directly
  (ANIMATION_CONFIG as any).enabled = !enabled; // Disable animations for battery optimization
};

export const getBatteryOptimizationStatus = (): boolean => {
  return !ANIMATION_CONFIG.enabled;
};

// Performance monitoring
export interface AnimationPerformanceMetrics {
  averageFrameTime: number;
  droppedFrames: number;
  totalAnimations: number;
  batteryOptimizationEnabled: boolean;
}

export const getAnimationPerformanceMetrics = (): AnimationPerformanceMetrics => {
  // In a real implementation, this would collect actual performance data
  return {
    averageFrameTime: ANIMATION_CONFIG.enabled ? 16.67 : 0, // 60fps when enabled, 0 when disabled
    droppedFrames: ANIMATION_CONFIG.enabled ? 0 : 0, // Minimal animations should not drop frames
    totalAnimations: 0, // Would be tracked in real implementation
    batteryOptimizationEnabled: !ANIMATION_CONFIG.enabled,
  };
};