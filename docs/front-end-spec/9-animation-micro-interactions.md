# 9. Animation & Micro-interactions

## 9.1 Celebration System Architecture

```typescript
interface CelebrationConfig {
  type: 'buyIn' | 'cashOut' | 'bigWin' | 'perfectBalance' | 'gameComplete'
  intensity: 'subtle' | 'medium' | 'celebration' | 'epic'
  respectsReducedMotion: boolean
  duration: number
  hapticPattern?: number[]
  soundEffect?: string
}

export const celebrations: Record<string, CelebrationConfig> = {
  buyInSuccess: {
    type: 'buyIn',
    intensity: 'medium',
    respectsReducedMotion: true,
    duration: 300,
    hapticPattern: [100],
    soundEffect: 'chipStack.wav'
  },
  
  bigWin: {
    type: 'bigWin', 
    intensity: 'epic',
    respectsReducedMotion: true,
    duration: 1000,
    hapticPattern: [100, 200, 100],
    soundEffect: 'victory.wav'
  }
}
```

## 9.2 Voice Interaction Feedback

```typescript
export const VoiceStates = {
  idle: { color: 'muted', animation: 'none' },
  listening: { color: 'primary', animation: 'pulse' },
  processing: { color: 'accent', animation: 'spin' },
  success: { color: 'success', animation: 'checkmark' },
  error: { color: 'destructive', animation: 'shake' }
}
```

## 9.3 Transaction Animations

- **Balance Updates**: Smooth number counting from old to new value
- **Chip Movements**: Physics-based chip stack building/removal
- **Card Reveals**: Material Design-inspired slide and shadow effects
- **Status Changes**: Color transitions with progress indicators
