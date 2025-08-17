# Voice Recognition Implementation Guide for PokePot

## Overview
This guide outlines the complete implementation path for real voice recognition in the PokePot poker session management app, replacing the current placeholder implementation with actual speech-to-text functionality.

## Current Status
- ✅ Voice UI implemented (WhatsApp-style microphone buttons)
- ✅ RealVoiceService.ts created with full voice recognition logic
- ✅ Android permissions configured (RECORD_AUDIO)
- ✅ @react-native-voice/voice package installed
- ⏳ Native module linking pending
- ⏳ Physical device testing required

## Implementation Phases

### Phase 1: Quick Wins (2-4 hours)
Focus on getting basic voice-to-text working on a physical device.

#### Tasks:
1. **Native Module Configuration**
   ```bash
   # Clean and rebuild Android
   cd android
   ./gradlew clean
   cd ..
   
   # For iOS (if applicable)
   cd ios
   pod install
   cd ..
   ```

2. **Wire Up Existing Service**
   - Uncomment RealVoiceService import in SessionForm.tsx
   - Replace placeholder implementation with actual service calls
   - Test basic voice recognition flow

3. **Physical Device Testing**
   - Deploy to real Android device (emulators often lack speech recognition)
   - Verify microphone permissions are granted
   - Test basic speech-to-text conversion

4. **Basic Error Handling**
   - Ensure app doesn't crash if voice unavailable
   - Provide clear feedback when recognition fails
   - Maintain manual input fallback

### Phase 2: Full Feature Implementation (1-2 days)

#### 1. Platform-Specific Setup

**Android Requirements:**
```xml
<!-- AndroidManifest.xml additions -->
<uses-permission android:name="android.permission.RECORD_AUDIO" /> <!-- Already present -->
<uses-permission android:name="android.permission.INTERNET" /> <!-- Already present -->

<!-- Add for Android 11+ -->
<queries>
  <intent>
    <action android:name="android.speech.RecognizeService" />
  </intent>
</queries>
```

**iOS Requirements (Info.plist):**
```xml
<key>NSSpeechRecognitionUsageDescription</key>
<string>PokePot needs access to speech recognition to convert your voice to text for easy input.</string>
<key>NSMicrophoneUsageDescription</key>
<string>PokePot needs access to your microphone for voice input features.</string>
```

#### 2. Enhanced Voice Service Features

**Language Support:**
```typescript
// Add to RealVoiceService.ts
public async startListening(callbacks: VoiceRecognitionCallbacks, options?: {
  language?: string; // 'en-US', 'es-ES', 'fr-FR', etc.
  partialResults?: boolean;
  maxAlternatives?: number;
}) {
  const language = options?.language || 'en-US';
  await Voice.start(language);
}
```

**Custom Vocabulary for Poker Terms:**
```typescript
// Poker-specific terms to improve recognition
const pokerVocabulary = [
  'all-in', 'buy-in', 'cash-out', 'rebuy',
  'fold', 'raise', 'call', 'check',
  'flop', 'turn', 'river', 'blinds',
  'ante', 'pot', 'chips', 'dealer'
];
```

#### 3. Visual Feedback Components

**Animated Recording Indicator:**
```typescript
// VoiceRecordingIndicator.tsx
const VoiceRecordingIndicator: React.FC<{isRecording: boolean}> = ({isRecording}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isRecording]);
  
  return (
    <Animated.View style={{transform: [{scale: pulseAnim}]}}>
      {/* Microphone icon */}
    </Animated.View>
  );
};
```

**Volume Level Indicator:**
```typescript
// Show real-time audio input levels
Voice.onSpeechVolumeChanged = (e: any) => {
  const volume = e.value; // 0-10 scale
  updateVolumeIndicator(volume);
};
```

#### 4. Advanced Features

**Continuous Listening Mode:**
```typescript
// For hands-free operation during poker games
public async enableContinuousListening() {
  // Keep listening after each result
  Voice.onSpeechEnd = () => {
    if (this.continuousMode) {
      this.startListening();
    }
  };
}
```

**Wake Word Detection:**
```typescript
// "Hey PokePot" activation
// Requires always-on listening (battery intensive)
// Consider using a dedicated wake word library
```

**Offline Recognition:**
```typescript
// Check if offline recognition is available
const isOfflineAvailable = await Voice.isRecognitionAvailable();

// Download language packs for offline use
// (Platform-specific implementation required)
```

## Testing Strategy

### Unit Tests
```typescript
// __tests__/RealVoiceService.test.ts
describe('RealVoiceService', () => {
  it('should request microphone permissions on Android', async () => {
    // Mock PermissionsAndroid
    // Test permission flow
  });
  
  it('should handle recognition errors gracefully', async () => {
    // Mock Voice.start failure
    // Verify error callback is called
  });
});
```

### Integration Tests
1. Test with various accents and speaking speeds
2. Test in noisy environments
3. Test with poker-specific terminology
4. Test language switching
5. Test offline mode (airplane mode)

### Edge Cases to Test
- Network connectivity loss during recognition
- Microphone permission denied
- Google Services not available
- Long pauses in speech
- Background app state
- Multiple simultaneous recognition requests

## Common Issues and Solutions

### Build Issues

**Issue: Duplicate package error**
```bash
# Solution: Remove duplicate packages
npm uninstall @react-native-community/voice
# Keep only @react-native-voice/voice
```

**Issue: Native module not found**
```bash
# Solution: Clean and rebuild
cd android && ./gradlew clean
cd .. && npx react-native run-android
```

**Issue: Metro bundler cache**
```bash
# Solution: Clear all caches
npx react-native start --reset-cache
```

### Runtime Issues

**Issue: Permission denied**
```typescript
// Solution: Request at runtime
const granted = await PermissionsAndroid.request(
  PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
);
```

**Issue: Recognition service not available**
```typescript
// Solution: Check availability first
const available = await Voice.isAvailable();
if (!available) {
  // Fallback to manual input
}
```

**Issue: No recognition results**
```typescript
// Solution: Set proper language and options
await Voice.start('en-US', {
  RECOGNIZER_ENGINE: 'GOOGLE',
  EXTRA_PARTIAL_RESULTS: true
});
```

## Performance Optimization

### Battery Usage
- Implement auto-stop after silence detection
- Limit continuous listening to active game sessions
- Use push-to-talk by default

### Memory Management
```typescript
// Cleanup when component unmounts
useEffect(() => {
  return () => {
    Voice.destroy();
  };
}, []);
```

### Network Usage
- Cache common recognitions
- Batch multiple recognitions when possible
- Implement offline fallback

## Alternative Approaches

### If Native Voice Recognition Fails

**Option 1: Web Speech API via WebView**
```javascript
const WebSpeechBridge = () => {
  return (
    <WebView
      source={{html: speechRecognitionHTML}}
      onMessage={(event) => {
        const transcript = event.nativeEvent.data;
        handleVoiceResult(transcript);
      }}
    />
  );
};
```

**Option 2: Cloud Speech APIs**
```typescript
// Using Google Cloud Speech-to-Text
import { SpeechClient } from '@google-cloud/speech';

// Record audio locally, then send to cloud
const audio = await recordAudio();
const response = await speechClient.recognize({
  audio: { content: audio },
  config: {
    encoding: 'LINEAR16',
    sampleRateHertz: 16000,
    languageCode: 'en-US',
  },
});
```

**Option 3: Expo Speech (if migrating to Expo)**
```typescript
import * as Speech from 'expo-speech';
// Simpler API but requires Expo
```

## Success Metrics

### Minimum Viable Product (MVP)
- [ ] Voice recognition works on physical device
- [ ] Text populates in correct field
- [ ] Basic error handling prevents crashes
- [ ] Manual fallback always available

### Production Ready
- [ ] 90%+ recognition accuracy for common terms
- [ ] < 2 second response time
- [ ] Works offline for basic commands
- [ ] Supports 3+ languages
- [ ] Visual feedback during recording
- [ ] Comprehensive error messages
- [ ] Battery usage < 5% during session

## Implementation Checklist

### Quick Wins (Phase 1)
- [ ] Clean and rebuild with native modules
- [ ] Uncomment RealVoiceService import
- [ ] Wire up actual voice service
- [ ] Test on physical Android device
- [ ] Verify basic speech-to-text works
- [ ] Ensure fallback to manual input

### Full Feature (Phase 2)
- [ ] Add Android manifest queries
- [ ] Implement iOS permissions (if needed)
- [ ] Add visual recording indicator
- [ ] Implement volume level display
- [ ] Add language selection
- [ ] Custom poker vocabulary
- [ ] Offline recognition
- [ ] Continuous listening mode
- [ ] Comprehensive error handling
- [ ] Performance optimization
- [ ] Battery usage optimization
- [ ] Full test coverage

## Resources

- [React Native Voice Documentation](https://github.com/react-native-voice/voice)
- [Android Speech Recognition](https://developer.android.com/reference/android/speech/SpeechRecognizer)
- [iOS Speech Framework](https://developer.apple.com/documentation/speech)
- [Google Cloud Speech-to-Text](https://cloud.google.com/speech-to-text)

## Notes

- Emulators often lack proper speech recognition support
- Physical device testing is essential
- Google Play Services must be installed on Android
- Internet connection improves accuracy but isn't always required
- Consider poker room noise levels in production use

---

*Last Updated: December 2024*
*Version: 1.0.0*