import VoiceService, { VoiceService as VoiceServiceClass } from '../../../src/services/integration/VoiceService';
import { useVoiceCommands } from '../../../src/hooks/useVoiceCommands';
import { ServiceError } from '../../../src/services/core/ServiceError';
import { VOICE_ERROR_CODES } from '../../../src/types/voice';
import { renderHook, act } from '@testing-library/react-native';

// Mock @react-native-voice/voice
jest.mock('@react-native-voice/voice', () => ({
  __esModule: true,
  default: {
    isAvailable: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    destroy: jest.fn(),
    onSpeechStart: null,
    onSpeechRecognized: null,
    onSpeechEnd: null,
    onSpeechError: null,
    onSpeechResults: null,
    onSpeechPartialResults: null,
  },
}));

// Mock React Native modules
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
  PermissionsAndroid: {
    PERMISSIONS: {
      RECORD_AUDIO: 'android.permission.RECORD_AUDIO',
    },
    RESULTS: {
      GRANTED: 'granted',
    },
    check: jest.fn().mockResolvedValue(true),
    request: jest.fn().mockResolvedValue('granted'),
  },
  Alert: {
    alert: jest.fn(),
  },
  Vibration: {
    vibrate: jest.fn(),
  },
}));

import Voice from '@react-native-voice/voice';

const mockVoice = Voice as jest.Mocked<typeof Voice>;

describe('Voice Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
    
    // Reset singleton instance
    (VoiceServiceClass as any).instance = undefined;
    
    // Default successful mocks
    mockVoice.isAvailable.mockResolvedValue(1);
    mockVoice.start.mockResolvedValue();
    mockVoice.stop.mockResolvedValue();
    mockVoice.destroy.mockResolvedValue();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('VoiceService and VoiceStore Integration', () => {
    it('should integrate VoiceService with voice store state management', async () => {
      const service = VoiceService;
      
      // Initialize service
      await service.initialize();
      
      // Check capabilities
      const capabilities = await service.checkCapabilities();
      expect(capabilities.available).toBe(true);
      
      // Test start listening
      await service.startListening();
      expect(mockVoice.start).toHaveBeenCalledWith('en-US');
      
      // Test stop listening
      await service.stopListening();
      expect(mockVoice.stop).toHaveBeenCalled();
    });

    it('should handle voice recognition timeout correctly', async () => {
      const service = VoiceService;
      await service.initialize();
      
      // Start listening
      const startPromise = service.startListening();
      await startPromise;
      
      // Advance timer to trigger timeout
      jest.advanceTimersByTime(500);
      
      // Verify stop was called due to timeout
      expect(mockVoice.stop).toHaveBeenCalled();
    });

    it('should handle voice recognition errors and map them correctly', async () => {
      const service = VoiceService;
      await service.initialize();
      
      // Test error handling
      const errorEvent = {
        error: {
          code: '7', // ERROR_NO_MATCH
          message: 'No speech input detected',
        },
      };
      
      // Simulate error event
      expect(() => {
        (service as any).onSpeechError(errorEvent);
      }).toThrow(ServiceError);
    });
  });

  describe('useVoiceCommands Hook Integration', () => {
    it('should initialize and manage voice commands through hook', async () => {
      const onVoiceCommand = jest.fn();
      const onError = jest.fn();
      
      const { result } = renderHook(() =>
        useVoiceCommands({
          onVoiceCommand,
          onError,
          autoInitialize: true,
        })
      );
      
      // Wait for auto-initialization
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      expect(result.current.isAvailable).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should handle voice command start and stop through hook', async () => {
      const { result } = renderHook(() =>
        useVoiceCommands({
          autoInitialize: true,
        })
      );
      
      // Wait for initialization
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      // Start listening
      await act(async () => {
        await result.current.startListening();
      });
      
      expect(result.current.isListening).toBe(true);
      expect(mockVoice.start).toHaveBeenCalled();
      
      // Stop listening
      await act(async () => {
        await result.current.stopListening();
      });
      
      expect(result.current.isListening).toBe(false);
      expect(mockVoice.stop).toHaveBeenCalled();
    });

    it('should handle errors in hook and call error callback', async () => {
      const onError = jest.fn();
      mockVoice.isAvailable.mockResolvedValue(0); // Make voice unavailable
      
      const { result } = renderHook(() =>
        useVoiceCommands({
          onError,
          autoInitialize: true,
        })
      );
      
      // Wait for initialization attempt
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: VOICE_ERROR_CODES.VOICE_RECOGNITION_UNAVAILABLE,
        })
      );
      expect(result.current.isAvailable).toBe(false);
    });
  });

  describe('Voice Recognition Results Processing', () => {
    it('should process voice recognition results correctly', async () => {
      const service = VoiceService;
      await service.initialize();
      
      const mockResults = {
        value: ['test command', 'alternative'],
      };
      
      // Capture console.log to verify result processing
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Simulate successful voice results
      (service as any).onSpeechResults(mockResults);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Voice command result:',
        expect.objectContaining({
          recognized: true,
          text: 'test command',
          confidence: 1.0,
          timestamp: expect.any(Date),
          processingTime: expect.any(Number),
        })
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle partial results during recognition', async () => {
      const service = VoiceService;
      await service.initialize();
      
      const mockPartialResults = {
        value: ['partial text'],
      };
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Simulate partial results
      (service as any).onSpeechPartialResults(mockPartialResults);
      
      expect(consoleSpy).toHaveBeenCalledWith('Partial results:', ['partial text']);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Performance Requirements', () => {
    it('should enforce 500ms timeout requirement', async () => {
      const service = VoiceService;
      await service.initialize();
      
      // Mock a long-running voice recognition
      let timeoutCallback: (() => void) | null = null;
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = jest.fn((callback: () => void, delay: number) => {
        if (delay === 500) {
          timeoutCallback = callback;
        }
        return originalSetTimeout(callback, delay);
      }) as any;
      
      await service.startListening();
      
      expect(global.setTimeout).toHaveBeenCalledWith(expect.any(Function), 500);
      
      // Trigger timeout
      if (timeoutCallback) {
        expect(() => timeoutCallback()).toThrow(
          expect.objectContaining({
            code: VOICE_ERROR_CODES.VOICE_TIMEOUT,
          })
        );
      }
      
      global.setTimeout = originalSetTimeout;
    });

    it('should calculate processing time correctly', async () => {
      const service = VoiceService;
      await service.initialize();
      
      // Set start time
      (service as any).startTime = new Date('2025-01-01T10:00:00.000Z');
      
      // Mock current time for calculation
      const mockDate = new Date('2025-01-01T10:00:00.250Z'); // 250ms later
      jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime());
      
      const processingTime = (service as any).calculateProcessingTime();
      expect(processingTime).toBe(250);
      
      jest.restoreAllMocks();
    });
  });

  describe('Error Recovery and Fallback', () => {
    it('should handle service unavailability gracefully', async () => {
      mockVoice.isAvailable.mockResolvedValue(0);
      
      const service = VoiceService;
      
      await expect(service.initialize()).rejects.toThrow(
        expect.objectContaining({
          code: VOICE_ERROR_CODES.VOICE_RECOGNITION_UNAVAILABLE,
        })
      );
      
      const available = await service.isAvailable();
      expect(available).toBe(false);
    });

    it('should provide fallback capabilities when voice fails', async () => {
      mockVoice.isAvailable.mockRejectedValue(new Error('Voice API failed'));
      
      const service = VoiceService;
      const capabilities = await service.checkCapabilities();
      
      expect(capabilities).toEqual({
        available: false,
        permissionGranted: false,
        supportsSpeechRecognition: false,
        platform: 'ios',
      });
    });
  });

  describe('Cleanup and Resource Management', () => {
    it('should properly cleanup resources on destroy', async () => {
      const service = VoiceService;
      await service.initialize();
      
      expect((service as any).isInitialized).toBe(true);
      
      await service.destroy();
      
      expect(mockVoice.destroy).toHaveBeenCalled();
      expect((service as any).isInitialized).toBe(false);
    });

    it('should clear timeouts properly', async () => {
      const service = VoiceService;
      await service.initialize();
      
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      
      await service.startListening();
      await service.stopListening();
      
      expect(clearTimeoutSpy).toHaveBeenCalled();
      
      clearTimeoutSpy.mockRestore();
    });
  });
});