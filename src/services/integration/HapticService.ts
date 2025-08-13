/**
 * HapticService - Centralized haptic feedback management
 * Story 2.3: Enhanced Touch Interface for Buy-ins - AC 5
 * 
 * Provides distinct haptic patterns for different actions with cross-platform support
 */
import { Vibration, Platform } from 'react-native';

export type HapticPattern = 
  | 'light'           // Light touch, selection
  | 'medium'          // Button press, navigation
  | 'heavy'           // Important action, confirmation
  | 'success'         // Successful transaction
  | 'error'           // Error or invalid action
  | 'warning'         // Warning or attention needed;

interface HapticConfig {
  ios: number | number[];
  android: number | number[];
  description: string;
}

/**
 * Haptic patterns optimized for iOS and Android
 * iOS uses Taptic Engine patterns, Android uses vibration patterns
 */
const HAPTIC_PATTERNS: Record<HapticPattern, HapticConfig> = {
  light: {
    ios: 25,                    // Light taptic feedback
    android: 25,                // Short vibration
    description: 'Light touch, selection feedback',
  },
  
  medium: {
    ios: 50,                    // Medium taptic feedback
    android: 50,                // Medium vibration
    description: 'Button press, navigation feedback',
  },
  
  heavy: {
    ios: 75,                    // Heavy taptic feedback
    android: 100,               // Strong vibration
    description: 'Important action, confirmation feedback',
  },
  
  success: {
    ios: [0, 100, 50, 100],     // Double pulse pattern
    android: [0, 100, 50, 100], // Double pulse pattern
    description: 'Successful transaction or completion',
  },
  
  error: {
    ios: [0, 200, 100, 200],    // Strong double pulse
    android: [0, 200, 100, 200], // Strong double pulse
    description: 'Error or invalid action feedback',
  },
  
  warning: {
    ios: [0, 150, 75, 150, 75, 150], // Triple pulse pattern
    android: [0, 150, 75, 150, 75, 150], // Triple pulse pattern
    description: 'Warning or attention needed',
  },
};

export class HapticService {
  private static instance: HapticService | null = null;
  private isEnabled: boolean = true;
  private debugMode: boolean = false;

  private constructor() {
    this.initializeService();
  }

  /**
   * Get singleton instance of HapticService
   */
  public static getInstance(): HapticService {
    if (!HapticService.instance) {
      HapticService.instance = new HapticService();
    }
    return HapticService.instance;
  }

  /**
   * Initialize haptic service
   */
  private initializeService(): void {
    // Check if haptic feedback is supported
    this.checkHapticSupport();
    
    if (this.debugMode) {
      console.log('HapticService initialized', {
        platform: Platform.OS,
        isEnabled: this.isEnabled,
      });
    }
  }

  /**
   * Check if haptic feedback is supported on the current platform
   */
  private checkHapticSupport(): boolean {
    // Both iOS and Android support vibration, but iOS has better Taptic Engine
    this.isEnabled = true;
    return this.isEnabled;
  }

  /**
   * Trigger haptic feedback with the specified pattern
   */
  public trigger(pattern: HapticPattern): void {
    if (!this.isEnabled) {
      if (this.debugMode) {
        console.log('Haptic feedback disabled, skipping pattern:', pattern);
      }
      return;
    }

    try {
      const config = HAPTIC_PATTERNS[pattern];
      const vibrationPattern = Platform.OS === 'ios' ? config.ios : config.android;

      if (this.debugMode) {
        console.log('Triggering haptic pattern:', {
          pattern,
          platform: Platform.OS,
          vibrationPattern,
          description: config.description,
        });
      }

      // Trigger vibration
      if (Array.isArray(vibrationPattern)) {
        Vibration.vibrate(vibrationPattern);
      } else {
        Vibration.vibrate(vibrationPattern);
      }
    } catch (error) {
      console.error('Failed to trigger haptic feedback:', error);
      // Gracefully handle haptic failures without affecting app functionality
    }
  }

  /**
   * Trigger light haptic feedback for selections and light touches
   */
  public light(): void {
    this.trigger('light');
  }

  /**
   * Trigger medium haptic feedback for button presses and navigation
   */
  public medium(): void {
    this.trigger('medium');
  }

  /**
   * Trigger heavy haptic feedback for important actions
   */
  public heavy(): void {
    this.trigger('heavy');
  }

  /**
   * Trigger success haptic feedback for completed transactions
   */
  public success(): void {
    this.trigger('success');
  }

  /**
   * Trigger error haptic feedback for failed actions
   */
  public error(): void {
    this.trigger('error');
  }

  /**
   * Trigger warning haptic feedback for attention-needed situations
   */
  public warning(): void {
    this.trigger('warning');
  }

  /**
   * Enable or disable haptic feedback
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    
    if (this.debugMode) {
      console.log('Haptic feedback', enabled ? 'enabled' : 'disabled');
    }
  }

  /**
   * Check if haptic feedback is currently enabled
   */
  public isHapticEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Enable or disable debug mode
   */
  public setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  /**
   * Test all haptic patterns (useful for settings/testing)
   */
  public async testAllPatterns(): Promise<void> {
    if (!this.isEnabled) {
      console.log('Haptic feedback is disabled, skipping test');
      return;
    }

    const patterns: HapticPattern[] = ['light', 'medium', 'heavy', 'success', 'error', 'warning'];
    
    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      const config = HAPTIC_PATTERNS[pattern];
      
      console.log(`Testing haptic pattern: ${pattern} - ${config.description}`);
      this.trigger(pattern);
      
      // Wait between patterns
      await new Promise<void>(resolve => setTimeout(resolve, 1000));
    }
  }

  /**
   * Get available haptic patterns with descriptions
   */
  public getAvailablePatterns(): Record<HapticPattern, string> {
    const patterns: Record<HapticPattern, string> = {} as Record<HapticPattern, string>;
    
    for (const [pattern, config] of Object.entries(HAPTIC_PATTERNS)) {
      patterns[pattern as HapticPattern] = config.description;
    }
    
    return patterns;
  }

  /**
   * Cancel all ongoing vibrations
   */
  public cancel(): void {
    try {
      Vibration.cancel();
      
      if (this.debugMode) {
        console.log('All haptic feedback cancelled');
      }
    } catch (error) {
      console.error('Failed to cancel haptic feedback:', error);
    }
  }
}

export default HapticService;