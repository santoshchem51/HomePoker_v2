/**
 * RealVoiceService - Actual speech-to-text using device capabilities
 * Integrates with @react-native-community/voice for real voice recognition
 */

import Voice, { SpeechRecognizedEvent, SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';
import { Platform, PermissionsAndroid, Alert } from 'react-native';

export interface VoiceRecognitionResult {
  text: string;
  confidence?: number;
}

export interface VoiceRecognitionCallbacks {
  onStart?: () => void;
  onResult?: (result: VoiceRecognitionResult) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

export class RealVoiceService {
  private static instance: RealVoiceService;
  private isListening = false;
  private callbacks: VoiceRecognitionCallbacks = {};

  private constructor() {
    this.setupVoiceEvents();
  }

  public static getInstance(): RealVoiceService {
    if (!RealVoiceService.instance) {
      RealVoiceService.instance = new RealVoiceService();
    }
    return RealVoiceService.instance;
  }

  /**
   * Setup voice recognition event handlers
   */
  private setupVoiceEvents() {
    Voice.onSpeechStart = this.onSpeechStart.bind(this);
    Voice.onSpeechRecognized = this.onSpeechRecognized.bind(this);
    Voice.onSpeechEnd = this.onSpeechEnd.bind(this);
    Voice.onSpeechError = this.onSpeechError.bind(this);
    Voice.onSpeechResults = this.onSpeechResults.bind(this);
    Voice.onSpeechPartialResults = this.onSpeechPartialResults.bind(this);
    Voice.onSpeechVolumeChanged = this.onSpeechVolumeChanged.bind(this);
  }

  /**
   * Request microphone permission (Android)
   */
  private async requestMicrophonePermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'PokePot needs access to your microphone for voice input features.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Permission request error:', err);
        return false;
      }
    }
    return true; // iOS handles permissions automatically
  }

  /**
   * Check if voice recognition is available
   */
  public async isAvailable(): Promise<boolean> {
    try {
      const available = await Voice.isAvailable();
      return available === 1;
    } catch (error) {
      console.warn('Voice availability check failed:', error);
      return false;
    }
  }

  /**
   * Start voice recognition
   */
  public async startListening(callbacks: VoiceRecognitionCallbacks = {}): Promise<boolean> {
    if (this.isListening) {
      console.warn('Voice recognition already in progress');
      return false;
    }

    // Check if voice recognition is available
    const available = await this.isAvailable();
    if (!available) {
      const error = 'Voice recognition is not available on this device';
      console.warn(error);
      callbacks.onError?.(error);
      return false;
    }

    // Request microphone permission
    const hasPermission = await this.requestMicrophonePermission();
    if (!hasPermission) {
      const error = 'Microphone permission denied';
      console.warn(error);
      callbacks.onError?.(error);
      return false;
    }

    try {
      this.callbacks = callbacks;
      this.isListening = true;

      await Voice.start('en-US'); // You can make this configurable
      console.log('Voice recognition started');
      return true;
    } catch (error) {
      this.isListening = false;
      const errorMessage = error instanceof Error ? error.message : 'Failed to start voice recognition';
      console.error('Voice start error:', errorMessage);
      callbacks.onError?.(errorMessage);
      return false;
    }
  }

  /**
   * Stop voice recognition
   */
  public async stopListening(): Promise<void> {
    if (!this.isListening) {
      return;
    }

    try {
      await Voice.stop();
      console.log('Voice recognition stopped');
    } catch (error) {
      console.warn('Voice stop error:', error);
    }
  }

  /**
   * Cancel voice recognition
   */
  public async cancelListening(): Promise<void> {
    if (!this.isListening) {
      return;
    }

    try {
      await Voice.cancel();
      console.log('Voice recognition cancelled');
    } catch (error) {
      console.warn('Voice cancel error:', error);
    }
  }

  /**
   * Cleanup voice recognition
   */
  public async cleanup(): Promise<void> {
    try {
      await Voice.destroy();
      this.isListening = false;
      this.callbacks = {};
      console.log('Voice recognition cleaned up');
    } catch (error) {
      console.warn('Voice cleanup error:', error);
    }
  }

  // Voice event handlers
  private onSpeechStart(e: any): void {
    console.log('onSpeechStart:', e);
    this.callbacks.onStart?.();
  }

  private onSpeechRecognized(e: SpeechRecognizedEvent): void {
    console.log('onSpeechRecognized:', e);
  }

  private onSpeechEnd(e: any): void {
    console.log('onSpeechEnd:', e);
    this.isListening = false;
    this.callbacks.onEnd?.();
  }

  private onSpeechError(e: SpeechErrorEvent): void {
    console.log('onSpeechError:', e);
    this.isListening = false;
    const errorMessage = e.error?.message || 'Speech recognition error';
    this.callbacks.onError?.(errorMessage);
  }

  private onSpeechResults(e: SpeechResultsEvent): void {
    console.log('onSpeechResults:', e);
    if (e.value && e.value.length > 0) {
      const text = e.value[0];
      const confidence = e.value.length > 1 ? parseFloat(e.value[1]) : undefined;
      
      this.callbacks.onResult?.({
        text,
        confidence
      });
    }
  }

  private onSpeechPartialResults(e: SpeechResultsEvent): void {
    console.log('onSpeechPartialResults:', e);
    // You can use this for real-time feedback if needed
  }

  private onSpeechVolumeChanged(e: any): void {
    console.log('onSpeechVolumeChanged:', e);
    // You can use this for volume level indicators
  }

  /**
   * Get current listening state
   */
  public getIsListening(): boolean {
    return this.isListening;
  }
}