# 4. Component Library & shadcn Integration

## Design System Architecture
**Gaming-Optimized + Accessible Party + Hybrid Library Approach**

The component library combines shadcn/ui's production-ready accessibility foundation with poker-specific gaming components and React Native native elements for optimal performance and platform integration.

## Core Component Categories

### 1. shadcn/ui Base Components (Utility & Structure)
```typescript
import { 
  Button, Card, CardContent, CardHeader,
  Dialog, DialogContent, DialogHeader,
  Toast, Toaster, Badge, Input,
  Select, Progress, AlertDialog,
  Switch, Slider, ScrollArea
} from "@/components/ui"
```

### 2. Poker-Specific Gaming Components (Custom)
```typescript
// Large touch targets optimized for poker gameplay
export const ChipStack = ({ amount, animated, color }: ChipStackProps) => {
  // WCAG AA: aria-label, high contrast, screen reader support
  // Gaming: Realistic chip stack visualization with physics
  // Performance: React Native Reanimated 3 optimizations
  return (
    <TouchableOpacity 
      style={{ minHeight: 88, minWidth: 88 }}
      accessibilityLabel={`${amount} dollar chip stack`}
    >
      <Animated.View>{/* Chip stack animation */}</Animated.View>
    </TouchableOpacity>
  )
}

export const PokerTable = ({ players, pot }: PokerTableProps) => {
  // Gaming: Felt background, chip animations, player positions
  // Accessible: Voice navigation, focus indicators, text scaling
  // Hybrid: React Native View + shadcn Card components
  return (
    <View style={styles.pokerFelt}>
      {players.map(player => 
        <PlayerBalanceCard key={player.id} {...player} />
      )}
    </View>
  )
}

export const VoiceCommandPanel = ({ 
  listening, command, confidence 
}: VoiceCommandProps) => {
  return (
    <Dialog open={listening}>
      <DialogContent>
        <VoiceMicrophone animated={listening} />
        <Text accessibilityLiveRegion="polite">
          {command && `Heard: ${command} (${Math.round(confidence * 100)}% confidence)`}
        </Text>
        <Button onClick={handleConfirm}>Confirm</Button>
        <Button variant="outline" onClick={handleRetry}>Try Again</Button>
      </DialogContent>
    </Dialog>
  )
}
```

### 3. React Native Native Components (Platform Integration)
```typescript
import { 
  View, Text, TouchableOpacity, Animated,
  Vibration, Dimensions, StatusBar,
  PermissionsAndroid, Camera
} from 'react-native'

import Voice from '@react-native-community/voice'
import SQLite from 'react-native-sqlite-storage'
```

## Party Celebration System
```typescript
export const CelebrationManager = {
  // WCAG AA compliant animations (respect prefers-reduced-motion)
  buyInSuccess: () => {
    if (!prefersReducedMotion) {
      chipStackAnimation.start()
      Vibration.vibrate(100)
    }
    playSuccessSound()
  },
  
  bigWin: () => {
    if (!prefersReducedMotion) {
      confettiAnimation.start()
      Vibration.vibrate([100, 200, 100])
    }
    playVictorySound()
  },
  
  perfectBalance: () => {
    if (!prefersReducedMotion) {
      sparkleEffect.start()
    }
    playCelebrationSound()
  }
}
```

## Component Theming Strategy
```typescript
// shadcn theme extended with poker aesthetics
const pokerTheme = {
  ...defaultTheme,
  colors: {
    ...defaultTheme.colors,
    primary: '#0D4F3C', // Poker felt green
    accent: '#FFD700',  // Gold chip
    success: '#228B22', // Winning green
    warning: '#DC143C', // Red chip warning
    background: '#1A1A1A', // Dark casino
  },
  spacing: {
    ...defaultTheme.spacing,
    touch: 44,      // Minimum touch target
    comfortable: 88, // Poker-friendly large targets
  }
}
```
