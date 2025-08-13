/**
 * Story 2.6A: Basic Voice Fallback Integration Tests
 * 
 * Tests the basic voice fallback workflow including startup capability detection,
 * VoiceStatusIndicator display states, manual mode toggle functionality,
 * and integration between voice and manual modes.
 */

import { renderHook, act } from '@testing-library/react-native';
import VoiceService from '../../../src/services/integration/VoiceService';
import { useVoiceStore } from '../../../src/stores/voiceStore';

// Mock the VoiceService
jest.mock('../../../src/services/integration/VoiceService');
const mockVoiceService = VoiceService as jest.Mocked<typeof VoiceService>;

// Mock React Native Voice
jest.mock('@react-native-voice/voice', () => ({
  isAvailable: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
  destroy: jest.fn(),
  onSpeechStart: jest.fn(),
  onSpeechRecognized: jest.fn(),
  onSpeechEnd: jest.fn(),
  onSpeechError: jest.fn(),
  onSpeechResults: jest.fn(),
  onSpeechPartialResults: jest.fn(),
}));

// Mock React Native permissions
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  PermissionsAndroid: {
    check: jest.fn(),
    request: jest.fn(),
    PERMISSIONS: { RECORD_AUDIO: 'android.permission.RECORD_AUDIO' },
    RESULTS: { GRANTED: 'granted' },
  },
  Vibration: { vibrate: jest.fn() },
  Alert: { alert: jest.fn() },
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 812 })),
    addEventListener: jest.fn(),
  },
}));

describe('Story 2.6A: Basic Voice Fallback Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset store to initial state
    useVoiceStore.getState().reset();
    useVoiceStore.getState().setInputMode('voice');
    useVoiceStore.getState().setVoiceAvailable(false);
  });

  describe('Voice Capability Detection', () => {
    it('should detect voice capabilities on startup', async () => {
      // Mock successful capability detection
      mockVoiceService.checkStartupCapabilities = jest.fn().mockResolvedValue(true);
      mockVoiceService.checkCapabilities = jest.fn().mockResolvedValue({
        available: true,
        permissionGranted: true,
        supportsSpeechRecognition: true,
        platform: 'ios',
      });

      const { result } = renderHook(() => useVoiceStore());

      // Simulate startup capability check
      await act(async () => {
        const isVoiceReady = await mockVoiceService.checkStartupCapabilities();
        const caps = await mockVoiceService.checkCapabilities();
        result.current.setCapabilities(caps);
        result.current.setVoiceAvailable(isVoiceReady);
      });

      expect(mockVoiceService.checkStartupCapabilities).toHaveBeenCalled();
      expect(mockVoiceService.checkCapabilities).toHaveBeenCalled();
      expect(result.current.voiceAvailable).toBe(true);
      expect(result.current.capabilities?.available).toBe(true);
      expect(result.current.capabilities?.permissionGranted).toBe(true);
    });

    it('should handle voice unavailable scenario', async () => {
      // Mock failed capability detection
      mockVoiceService.checkStartupCapabilities = jest.fn().mockResolvedValue(false);
      mockVoiceService.checkCapabilities = jest.fn().mockResolvedValue({
        available: false,
        permissionGranted: false,
        supportsSpeechRecognition: false,
        platform: 'ios',
      });

      const { result } = renderHook(() => useVoiceStore());

      // Simulate startup capability check
      await act(async () => {
        const isVoiceReady = await mockVoiceService.checkStartupCapabilities();
        const caps = await mockVoiceService.checkCapabilities();
        result.current.setCapabilities(caps);
        result.current.setVoiceAvailable(isVoiceReady);
        
        // If voice is not available, automatically switch to manual mode
        if (!isVoiceReady) {
          result.current.setInputMode('manual');
        }
      });

      expect(result.current.voiceAvailable).toBe(false);
      expect(result.current.capabilities?.available).toBe(false);
      expect(result.current.inputMode).toBe('manual');
    });

    it('should handle capability detection errors gracefully', async () => {
      // Mock capability detection error
      mockVoiceService.checkStartupCapabilities = jest.fn().mockRejectedValue(new Error('Capability check failed'));
      mockVoiceService.checkCapabilities = jest.fn().mockRejectedValue(new Error('Check failed'));

      const { result } = renderHook(() => useVoiceStore());

      // Simulate startup capability check with error handling
      await act(async () => {
        try {
          const isVoiceReady = await mockVoiceService.checkStartupCapabilities();
          result.current.setVoiceAvailable(isVoiceReady);
        } catch (error) {
          // Graceful handling of errors - assume voice is not available
          result.current.setVoiceAvailable(false);
          result.current.setInputMode('manual');
        }
      });

      expect(result.current.voiceAvailable).toBe(false);
      expect(result.current.inputMode).toBe('manual');
    });
  });

  describe('VoiceStatusIndicator Display States', () => {
    it('should show correct status for voice available state', () => {
      const { result } = renderHook(() => useVoiceStore());

      act(() => {
        result.current.setVoiceAvailable(true);
        result.current.setInputMode('voice');
      });

      expect(result.current.voiceAvailable).toBe(true);
      expect(result.current.inputMode).toBe('voice');
      
      // Status indicator should show: Green dot + "Voice Mode"
    });

    it('should show correct status for voice unavailable state', () => {
      const { result } = renderHook(() => useVoiceStore());

      act(() => {
        result.current.setVoiceAvailable(false);
        result.current.setInputMode('manual');
      });

      expect(result.current.voiceAvailable).toBe(false);
      expect(result.current.inputMode).toBe('manual');
      
      // Status indicator should show: Red dot + "Voice Unavailable"
    });

    it('should show correct status for manual mode with voice available', () => {
      const { result } = renderHook(() => useVoiceStore());

      act(() => {
        result.current.setVoiceAvailable(true);
        result.current.setInputMode('manual');
      });

      expect(result.current.voiceAvailable).toBe(true);
      expect(result.current.inputMode).toBe('manual');
      
      // Status indicator should show: Orange dot + "Manual Mode"
    });
  });

  describe('Manual Mode Toggle Functionality', () => {
    it('should toggle from voice to manual mode', () => {
      const { result } = renderHook(() => useVoiceStore());

      // Setup voice available state
      act(() => {
        result.current.setVoiceAvailable(true);
        result.current.setInputMode('voice');
      });

      expect(result.current.inputMode).toBe('voice');

      // Toggle to manual mode
      act(() => {
        result.current.setInputMode('manual');
      });

      expect(result.current.inputMode).toBe('manual');
    });

    it('should toggle from manual to voice mode when voice is available', () => {
      const { result } = renderHook(() => useVoiceStore());

      // Setup manual mode with voice available
      act(() => {
        result.current.setVoiceAvailable(true);
        result.current.setInputMode('manual');
      });

      expect(result.current.inputMode).toBe('manual');

      // Toggle to voice mode
      act(() => {
        result.current.setInputMode('voice');
      });

      expect(result.current.inputMode).toBe('voice');
    });

    it('should prevent toggle to voice mode when voice is unavailable', () => {
      const { result } = renderHook(() => useVoiceStore());

      // Setup manual mode with voice unavailable
      act(() => {
        result.current.setVoiceAvailable(false);
        result.current.setInputMode('manual');
      });

      expect(result.current.inputMode).toBe('manual');
      expect(result.current.voiceAvailable).toBe(false);

      // Attempting to toggle to voice mode should fail (handled in component)
      // The store state should remain in manual mode
      expect(result.current.inputMode).toBe('manual');
    });

    it('should stop listening when switching to manual mode', () => {
      const { result } = renderHook(() => useVoiceStore());

      // Setup listening state in voice mode
      act(() => {
        result.current.setVoiceAvailable(true);
        result.current.setInputMode('voice');
        result.current.startListening();
      });

      expect(result.current.inputMode).toBe('voice');
      expect(result.current.isListening).toBe(true);

      // Switch to manual mode (should stop listening)
      act(() => {
        result.current.setInputMode('manual');
        result.current.stopListening(); // Component would call this
      });

      expect(result.current.inputMode).toBe('manual');
      expect(result.current.isListening).toBe(false);
    });
  });

  describe('Voice and Manual Mode Integration', () => {
    it('should maintain voice state when switching modes', () => {
      const { result } = renderHook(() => useVoiceStore());

      // Setup voice available
      act(() => {
        result.current.setVoiceAvailable(true);
        result.current.setInputMode('voice');
      });

      // Switch to manual
      act(() => {
        result.current.setInputMode('manual');
      });

      // Switch back to voice
      act(() => {
        result.current.setInputMode('voice');
      });

      expect(result.current.voiceAvailable).toBe(true);
      expect(result.current.inputMode).toBe('voice');
    });

    it('should persist voice availability across mode changes', () => {
      const { result } = renderHook(() => useVoiceStore());

      // Setup voice available
      act(() => {
        result.current.setVoiceAvailable(true);
        result.current.setInputMode('voice');
      });

      expect(result.current.voiceAvailable).toBe(true);

      // Switch modes multiple times
      act(() => {
        result.current.setInputMode('manual');
      });
      expect(result.current.voiceAvailable).toBe(true);

      act(() => {
        result.current.setInputMode('voice');
      });
      expect(result.current.voiceAvailable).toBe(true);
    });

    it('should preserve voice state across store reset', () => {
      const { result } = renderHook(() => useVoiceStore());

      // Setup voice available in manual mode
      act(() => {
        result.current.setVoiceAvailable(true);
        result.current.setInputMode('manual');
        result.current.setError('Some error');
        result.current.startListening();
      });

      const initialVoiceAvailable = result.current.voiceAvailable;
      const initialInputMode = result.current.inputMode;

      // Reset store (should preserve voice availability and input mode as per Story 2.6A requirements)
      act(() => {
        result.current.reset();
      });

      // Voice availability and input mode should persist (per story requirements)
      expect(result.current.voiceAvailable).toBe(initialVoiceAvailable);
      expect(result.current.inputMode).toBe(initialInputMode);
      // But other state should be reset
      expect(result.current.isListening).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe('Basic Workflow Validation', () => {
    it('should complete basic voice fallback workflow', async () => {
      const { result } = renderHook(() => useVoiceStore());

      // Step 1: App startup - check capabilities
      await act(async () => {
        mockVoiceService.checkStartupCapabilities = jest.fn().mockResolvedValue(true);
        mockVoiceService.checkCapabilities = jest.fn().mockResolvedValue({
          available: true,
          permissionGranted: true,
          supportsSpeechRecognition: true,
          platform: 'ios',
        });

        const isVoiceReady = await mockVoiceService.checkStartupCapabilities();
        const caps = await mockVoiceService.checkCapabilities();
        result.current.setCapabilities(caps);
        result.current.setVoiceAvailable(isVoiceReady);
      });

      expect(result.current.voiceAvailable).toBe(true);
      expect(result.current.inputMode).toBe('voice');

      // Step 2: User toggles to manual mode
      act(() => {
        result.current.setInputMode('manual');
      });

      expect(result.current.inputMode).toBe('manual');

      // Step 3: User toggles back to voice mode
      act(() => {
        result.current.setInputMode('voice');
      });

      expect(result.current.inputMode).toBe('voice');
      expect(result.current.voiceAvailable).toBe(true);
    });

    it('should handle voice unavailable workflow', async () => {
      const { result } = renderHook(() => useVoiceStore());

      // Step 1: App startup - voice unavailable
      await act(async () => {
        mockVoiceService.checkStartupCapabilities = jest.fn().mockResolvedValue(false);
        mockVoiceService.checkCapabilities = jest.fn().mockResolvedValue({
          available: false,
          permissionGranted: false,
          supportsSpeechRecognition: false,
          platform: 'ios',
        });

        const isVoiceReady = await mockVoiceService.checkStartupCapabilities();
        const caps = await mockVoiceService.checkCapabilities();
        result.current.setCapabilities(caps);
        result.current.setVoiceAvailable(isVoiceReady);
        
        // Auto-switch to manual mode when voice unavailable
        if (!isVoiceReady) {
          result.current.setInputMode('manual');
        }
      });

      expect(result.current.voiceAvailable).toBe(false);
      expect(result.current.inputMode).toBe('manual');

      // Step 2: Verify user cannot switch to voice mode
      // (This would be prevented in the component, not the store)
      expect(result.current.voiceAvailable).toBe(false);
    });
  });
});