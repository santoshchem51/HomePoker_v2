import Voice, { 
  SpeechRecognizedEvent, 
  SpeechResultsEvent, 
  SpeechErrorEvent,
  SpeechStartEvent,
  SpeechEndEvent
} from '@react-native-voice/voice';
import { Platform, PermissionsAndroid, Vibration } from 'react-native';
import { ServiceError } from '../core/ServiceError';
import { 
  VoiceServiceCapabilities, 
  VoiceCommandResult, 
  VOICE_ERROR_CODES,
} from '../../types/voice';

class VoiceService {
  private static instance: VoiceService;
  private isInitialized = false;
  private capabilities: VoiceServiceCapabilities | null = null;
  private currentTimeout: ReturnType<typeof setTimeout> | null = null;
  private startTime: Date | null = null;
  private onResultCallback: ((result: VoiceCommandResult) => void) | null = null;
  private onErrorCallback: ((error: ServiceError) => void) | null = null;

  private constructor() {
    this.initializeVoiceEvents();
  }

  public static getInstance(): VoiceService {
    if (!VoiceService.instance) {
      VoiceService.instance = new VoiceService();
    }
    return VoiceService.instance;
  }

  private initializeVoiceEvents(): void {
    Voice.onSpeechStart = this.onSpeechStart.bind(this);
    Voice.onSpeechRecognized = this.onSpeechRecognized.bind(this);
    Voice.onSpeechEnd = this.onSpeechEnd.bind(this);
    Voice.onSpeechError = this.onSpeechError.bind(this);
    Voice.onSpeechResults = this.onSpeechResults.bind(this);
    Voice.onSpeechPartialResults = this.onSpeechPartialResults.bind(this);
  }

  public async initialize(): Promise<void> {
    try {
      if (this.isInitialized) {
        return;
      }

      // Check device capabilities
      this.capabilities = await this.checkCapabilities();
      
      if (!this.capabilities.available) {
        throw new ServiceError(
          VOICE_ERROR_CODES.VOICE_RECOGNITION_UNAVAILABLE,
          'Voice recognition is not available on this device'
        );
      }

      // Request permissions if needed
      if (!this.capabilities.permissionGranted) {
        const granted = await this.requestPermissions();
        if (!granted) {
          throw new ServiceError(
            VOICE_ERROR_CODES.PERMISSION_DENIED,
            'Microphone permission is required for voice commands'
          );
        }
        this.capabilities.permissionGranted = true;
      }

      this.isInitialized = true;
    } catch (error) {
      // Reset initialization state on error
      this.isInitialized = false;
      this.capabilities = null;
      
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError(
        VOICE_ERROR_CODES.INITIALIZATION_FAILED,
        'Failed to initialize voice recognition service',
        error
      );
    }
  }

  public async checkCapabilities(): Promise<VoiceServiceCapabilities> {
    try {
      const available = await Voice.isAvailable();
      const permissionGranted = await this.checkPermissions();
      
      return {
        available: available === 1,
        permissionGranted,
        supportsSpeechRecognition: available === 1,
        platform: Platform.OS as 'ios' | 'android',
      };
    } catch (error) {
      return {
        available: false,
        permissionGranted: false,
        supportsSpeechRecognition: false,
        platform: Platform.OS as 'ios' | 'android',
      };
    }
  }

  /**
   * Story 2.6A: Basic voice capability detection on startup only
   * Simple startup detection without runtime monitoring with 5-second timeout
   */
  public async checkStartupCapabilities(): Promise<boolean> {
    try {
      // Implement 5-second timeout for capability detection
      const capabilityPromise = this.checkCapabilities();
      const timeoutPromise = new Promise<VoiceServiceCapabilities>((_, reject) => {
        setTimeout(() => {
          reject(new ServiceError(
            VOICE_ERROR_CODES.VOICE_TIMEOUT,
            'Voice capability detection timed out after 5 seconds'
          ));
        }, 5000);
      });

      const capabilities = await Promise.race([capabilityPromise, timeoutPromise]);
      const isVoiceReady = capabilities.available && capabilities.permissionGranted;
      
      // Store capabilities for app session
      this.capabilities = capabilities;
      
      return isVoiceReady;
    } catch (error) {
      console.warn('Startup voice capability check failed:', error);
      // Gracefully handle failures - assume voice is not available
      this.capabilities = {
        available: false,
        permissionGranted: false,
        supportsSpeechRecognition: false,
        platform: Platform.OS as 'ios' | 'android',
      };
      return false;
    }
  }

  public async isAvailable(): Promise<boolean> {
    if (!this.capabilities) {
      this.capabilities = await this.checkCapabilities();
    }
    return this.capabilities.available && this.capabilities.permissionGranted;
  }

  /**
   * Reset the service state - used for testing
   */
  public reset(): void {
    this.isInitialized = false;
    this.capabilities = null;
    this.clearTimeout();
    this.onResultCallback = null;
    this.onErrorCallback = null;
  }

  public async startListening(): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!(await this.isAvailable())) {
        throw new ServiceError(
          VOICE_ERROR_CODES.VOICE_RECOGNITION_UNAVAILABLE,
          'Voice recognition is not available'
        );
      }

      // Set timeout for 500ms as per requirements
      this.startTime = new Date();
      this.currentTimeout = setTimeout(async () => {
        try {
          await this.stopListening();
        } catch (err) {
          console.error('Error stopping voice recognition on timeout:', err);
        }
        // Trigger timeout error through event system
        this.onVoiceTimeout();
      }, 500);

      // Provide haptic feedback for start
      Vibration.vibrate(50);

      await Voice.start('en-US');
    } catch (error) {
      this.clearTimeout();
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError(
        VOICE_ERROR_CODES.RECOGNITION_FAILED,
        'Failed to start voice recognition',
        error
      );
    }
  }

  public async stopListening(): Promise<void> {
    try {
      this.clearTimeout();
      
      // Provide haptic feedback for stop
      Vibration.vibrate(100);
      
      await Voice.stop();
    } catch (error) {
      throw new ServiceError(
        VOICE_ERROR_CODES.RECOGNITION_FAILED,
        'Failed to stop voice recognition',
        error
      );
    }
  }

  public async destroy(): Promise<void> {
    try {
      this.clearTimeout();
      await Voice.destroy();
      this.isInitialized = false;
      this.onResultCallback = null;
      this.onErrorCallback = null;
    } catch (error) {
      throw new ServiceError(
        VOICE_ERROR_CODES.RECOGNITION_FAILED,
        'Failed to destroy voice recognition',
        error
      );
    }
  }

  public setOnResult(callback: (result: VoiceCommandResult) => void): void {
    this.onResultCallback = callback;
  }

  public setOnError(callback: (error: ServiceError) => void): void {
    this.onErrorCallback = callback;
  }

  private async checkPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
      );
      return granted;
    }
    
    // For iOS, permissions are handled at runtime by the Voice library
    return true;
  }

  private async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'PokePot needs microphone access to enable voice commands for poker game tracking.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (error) {
        return false;
      }
    }
    
    // For iOS, permissions are requested automatically by Voice.start()
    return true;
  }

  private clearTimeout(): void {
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }
  }

  private calculateProcessingTime(): number {
    if (!this.startTime) return 0;
    return new Date().getTime() - this.startTime.getTime();
  }

  // Voice event handlers
  private onSpeechStart(_e: SpeechStartEvent): void {
    console.log('Voice recognition started');
  }

  private onSpeechRecognized(e: SpeechRecognizedEvent): void {
    console.log('Speech recognized:', e);
  }

  private onSpeechEnd(_e: SpeechEndEvent): void {
    console.log('Voice recognition ended');
    this.clearTimeout();
  }

  private onSpeechError(e: SpeechErrorEvent): void {
    console.error('Voice recognition error:', e);
    this.clearTimeout();
    
    const errorCode = this.mapVoiceErrorToServiceError(e.error?.code);
    const error = new ServiceError(
      errorCode,
      e.error?.message || 'Voice recognition error occurred',
      e.error
    );
    
    if (this.onErrorCallback) {
      this.onErrorCallback(error);
    }
  }

  private onVoiceTimeout(): void {
    const error = new ServiceError(
      VOICE_ERROR_CODES.VOICE_TIMEOUT,
      'Voice recognition timed out after 500ms'
    );
    
    if (this.onErrorCallback) {
      this.onErrorCallback(error);
    }
  }

  private onSpeechResults(e: SpeechResultsEvent): void {
    this.clearTimeout();
    
    if (e.value && e.value.length > 0) {
      const processingTime = this.calculateProcessingTime();
      // Calculate confidence based on processing time (faster = more confident)
      const confidence = processingTime < 300 ? 0.95 : processingTime < 400 ? 0.85 : 0.75;
      
      const result: VoiceCommandResult = {
        recognized: true,
        text: e.value[0],
        confidence,
        timestamp: new Date(),
        processingTime,
      };
      
      console.log('Voice command result:', result);
      
      if (this.onResultCallback) {
        this.onResultCallback(result);
      }
    }
  }

  private onSpeechPartialResults(e: SpeechResultsEvent): void {
    // Handle partial results for real-time feedback
    console.log('Partial results:', e.value);
  }

  private mapVoiceErrorToServiceError(errorCode?: string): string {
    switch (errorCode) {
      case '7': // ERROR_NO_MATCH
        return VOICE_ERROR_CODES.RECOGNITION_FAILED;
      case '6': // ERROR_SPEECH_TIMEOUT
        return VOICE_ERROR_CODES.VOICE_TIMEOUT;
      case '9': // ERROR_INSUFFICIENT_PERMISSIONS
        return VOICE_ERROR_CODES.PERMISSION_DENIED;
      case '8': // ERROR_AUDIO
        return VOICE_ERROR_CODES.AUDIO_ERROR;
      case '2': // ERROR_NETWORK
        return VOICE_ERROR_CODES.NETWORK_ERROR;
      default:
        return VOICE_ERROR_CODES.RECOGNITION_FAILED;
    }
  }
}

export { VoiceService };
export default VoiceService.getInstance();