import VoiceService, { VoiceService as VoiceServiceClass } from '../../../src/services/integration/VoiceService';
import { ServiceError } from '../../../src/services/core/ServiceError';
import { VOICE_ERROR_CODES } from '../../../src/types/voice';
import { Platform } from 'react-native';

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
      DENIED: 'denied',
    },
    check: jest.fn(),
    request: jest.fn(),
  },
  Alert: {
    alert: jest.fn(),
  },
  Vibration: {
    vibrate: jest.fn(),
  },
}));

import Voice from '@react-native-voice/voice';
import { PermissionsAndroid, Vibration } from 'react-native';

const mockVoice = Voice as jest.Mocked<typeof Voice>;
const mockPermissionsAndroid = PermissionsAndroid as jest.Mocked<typeof PermissionsAndroid>;
const mockVibration = Vibration as jest.Mocked<typeof Vibration>;

describe('VoiceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
    
    // Reset singleton instance state
    (VoiceServiceClass as any).instance = undefined;
    
    // Get fresh instance and reset state
    const service = VoiceService;
    if (service.reset) {
      service.reset();
    }
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance when called multiple times', () => {
      const instance1 = (VoiceServiceClass as any).getInstance();
      const instance2 = (VoiceServiceClass as any).getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('checkCapabilities', () => {
    it('should return capabilities with voice available on iOS', async () => {
      Platform.OS = 'ios';
      mockVoice.isAvailable.mockResolvedValue(1);
      
      const service = VoiceService;
      const capabilities = await service.checkCapabilities();
      
      expect(capabilities).toEqual({
        available: true,
        permissionGranted: true, // iOS permissions are handled at runtime
        supportsSpeechRecognition: true,
        platform: 'ios',
      });
    });

    it('should return capabilities with voice unavailable', async () => {
      mockVoice.isAvailable.mockResolvedValue(0);
      
      const service = VoiceService;
      const capabilities = await service.checkCapabilities();
      
      expect(capabilities.available).toBe(false);
      expect(capabilities.supportsSpeechRecognition).toBe(false);
    });

    it('should handle voice availability check errors', async () => {
      mockVoice.isAvailable.mockRejectedValue(new Error('Voice not available'));
      
      const service = VoiceService;
      const capabilities = await service.checkCapabilities();
      
      expect(capabilities.available).toBe(false);
    });
  });

  describe('Android Permissions', () => {
    beforeEach(() => {
      (Platform as any).OS = 'android';
    });

    it('should check Android permissions correctly', async () => {
      mockPermissionsAndroid.check.mockResolvedValue(true);
      mockVoice.isAvailable.mockResolvedValue(1);
      
      const service = VoiceService;
      const capabilities = await service.checkCapabilities();
      
      expect(capabilities.permissionGranted).toBe(true);
      expect(mockPermissionsAndroid.check).toHaveBeenCalledWith(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
      );
    });

    it('should request Android permissions when not granted', async () => {
      mockPermissionsAndroid.request.mockResolvedValue(PermissionsAndroid.RESULTS.GRANTED);
      
      const service = VoiceService;
      const granted = await (service as any).requestPermissions();
      
      expect(granted).toBe(true);
      expect(mockPermissionsAndroid.request).toHaveBeenCalledWith(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        expect.objectContaining({
          title: 'Microphone Permission',
        })
      );
    });

    it('should handle permission denial', async () => {
      mockPermissionsAndroid.request.mockResolvedValue(PermissionsAndroid.RESULTS.DENIED);
      
      const service = VoiceService;
      const granted = await (service as any).requestPermissions();
      
      expect(granted).toBe(false);
    });
  });

  describe('initialize', () => {
    it('should initialize successfully with available voice recognition', async () => {
      mockVoice.isAvailable.mockResolvedValue(1);
      Platform.OS = 'ios';
      
      const service = VoiceService;
      await expect(service.initialize()).resolves.not.toThrow();
      
      expect((service as any).isInitialized).toBe(true);
    });

    it('should throw error when voice recognition unavailable', async () => {
      mockVoice.isAvailable.mockResolvedValue(0);
      
      const service = VoiceService;
      
      await expect(service.initialize()).rejects.toThrow(ServiceError);
      await expect(service.initialize()).rejects.toThrow(
        expect.objectContaining({
          code: VOICE_ERROR_CODES.VOICE_RECOGNITION_UNAVAILABLE,
        })
      );
    });

    it('should throw error when permissions denied', async () => {
      Platform.OS = 'android';
      mockVoice.isAvailable.mockResolvedValue(1);
      mockPermissionsAndroid.check.mockResolvedValue(false);
      mockPermissionsAndroid.request.mockResolvedValue(PermissionsAndroid.RESULTS.DENIED);
      
      const service = VoiceService;
      
      await expect(service.initialize()).rejects.toThrow(ServiceError);
      await expect(service.initialize()).rejects.toThrow(
        expect.objectContaining({
          code: VOICE_ERROR_CODES.PERMISSION_DENIED,
        })
      );
    });
  });

  describe('startListening', () => {
    it('should start listening successfully', async () => {
      mockVoice.isAvailable.mockResolvedValue(1);
      mockVoice.start.mockResolvedValue();
      Platform.OS = 'ios';
      
      const service = VoiceService;
      await service.initialize();
      
      await expect(service.startListening()).resolves.not.toThrow();
      
      expect(mockVoice.start).toHaveBeenCalledWith('en-US');
      expect(mockVibration.vibrate).toHaveBeenCalledWith(50);
    });

    it('should set timeout for 500ms processing limit', async () => {
      mockVoice.isAvailable.mockResolvedValue(1);
      mockVoice.start.mockResolvedValue();
      mockVoice.stop.mockResolvedValue();
      Platform.OS = 'ios';
      
      const service = VoiceService;
      await service.initialize();
      
      const startPromise = service.startListening();
      await startPromise;
      
      // Fast-forward timeout
      jest.advanceTimersByTime(500);
      
      expect(mockVoice.stop).toHaveBeenCalled();
    });

    it('should throw error when not initialized', async () => {
      mockVoice.isAvailable.mockResolvedValue(0);
      
      const service = VoiceService;
      
      await expect(service.startListening()).rejects.toThrow(ServiceError);
    });

    it('should throw error when voice unavailable during start', async () => {
      mockVoice.isAvailable.mockResolvedValue(1);
      mockVoice.start.mockRejectedValue(new Error('Start failed'));
      Platform.OS = 'ios';
      
      const service = VoiceService;
      await service.initialize();
      
      await expect(service.startListening()).rejects.toThrow(ServiceError);
      await expect(service.startListening()).rejects.toThrow(
        expect.objectContaining({
          code: VOICE_ERROR_CODES.RECOGNITION_FAILED,
        })
      );
    });
  });

  describe('stopListening', () => {
    it('should stop listening successfully', async () => {
      mockVoice.stop.mockResolvedValue();
      
      const service = VoiceService;
      
      await expect(service.stopListening()).resolves.not.toThrow();
      
      expect(mockVoice.stop).toHaveBeenCalled();
      expect(mockVibration.vibrate).toHaveBeenCalledWith(100);
    });

    it('should handle stop errors gracefully', async () => {
      mockVoice.stop.mockRejectedValue(new Error('Stop failed'));
      
      const service = VoiceService;
      
      await expect(service.stopListening()).rejects.toThrow(ServiceError);
      await expect(service.stopListening()).rejects.toThrow(
        expect.objectContaining({
          code: VOICE_ERROR_CODES.RECOGNITION_FAILED,
        })
      );
    });
  });

  describe('destroy', () => {
    it('should destroy voice service successfully', async () => {
      mockVoice.destroy.mockResolvedValue();
      
      const service = VoiceService;
      (service as any).isInitialized = true;
      
      await expect(service.destroy()).resolves.not.toThrow();
      
      expect(mockVoice.destroy).toHaveBeenCalled();
      expect((service as any).isInitialized).toBe(false);
    });

    it('should handle destroy errors', async () => {
      mockVoice.destroy.mockRejectedValue(new Error('Destroy failed'));
      
      const service = VoiceService;
      
      await expect(service.destroy()).rejects.toThrow(ServiceError);
    });
  });

  describe('isAvailable', () => {
    it('should return true when capabilities are available and permissions granted', async () => {
      mockVoice.isAvailable.mockResolvedValue(1);
      Platform.OS = 'ios';
      
      const service = VoiceService;
      
      const available = await service.isAvailable();
      expect(available).toBe(true);
    });

    it('should return false when voice recognition unavailable', async () => {
      mockVoice.isAvailable.mockResolvedValue(0);
      
      const service = VoiceService;
      
      const available = await service.isAvailable();
      expect(available).toBe(false);
    });
  });

  describe('Error Mapping', () => {
    it('should map voice error codes correctly', () => {
      const service = VoiceService;
      
      expect((service as any).mapVoiceErrorToServiceError('7')).toBe(VOICE_ERROR_CODES.RECOGNITION_FAILED);
      expect((service as any).mapVoiceErrorToServiceError('6')).toBe(VOICE_ERROR_CODES.VOICE_TIMEOUT);
      expect((service as any).mapVoiceErrorToServiceError('9')).toBe(VOICE_ERROR_CODES.PERMISSION_DENIED);
      expect((service as any).mapVoiceErrorToServiceError('8')).toBe(VOICE_ERROR_CODES.AUDIO_ERROR);
      expect((service as any).mapVoiceErrorToServiceError('2')).toBe(VOICE_ERROR_CODES.NETWORK_ERROR);
      expect((service as any).mapVoiceErrorToServiceError('unknown')).toBe(VOICE_ERROR_CODES.RECOGNITION_FAILED);
    });
  });
});