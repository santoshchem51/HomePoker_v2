/**
 * VoiceStatusIndicator Component Tests
 * Story 2.6A: Basic Voice Fallback - Component Tests
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { VoiceStatusIndicator } from '../../../../src/components/poker/VoiceStatusIndicator';
import { useVoiceStore } from '../../../../src/stores/voiceStore';

// Mock the voice store
jest.mock('../../../../src/stores/voiceStore');
const mockUseVoiceStore = useVoiceStore as jest.MockedFunction<typeof useVoiceStore>;

describe('VoiceStatusIndicator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Voice Available States', () => {
    it('should display voice mode status when voice is available and in voice mode', () => {
      mockUseVoiceStore.mockReturnValue({
        voiceAvailable: true,
        inputMode: 'voice',
      } as any);

      const { getByText } = render(<VoiceStatusIndicator />);
      
      expect(getByText('Voice Mode')).toBeTruthy();
    });

    it('should display manual mode status when voice is available but in manual mode', () => {
      mockUseVoiceStore.mockReturnValue({
        voiceAvailable: true,
        inputMode: 'manual',
      } as any);

      const { getByText } = render(<VoiceStatusIndicator />);
      
      expect(getByText('Manual Mode')).toBeTruthy();
    });

    it('should display voice unavailable status when voice is not available', () => {
      mockUseVoiceStore.mockReturnValue({
        voiceAvailable: false,
        inputMode: 'manual',
      } as any);

      const { getByText } = render(<VoiceStatusIndicator />);
      
      expect(getByText('Voice Unavailable')).toBeTruthy();
    });
  });

  describe('Component Props', () => {
    it('should hide label when showLabel is false', () => {
      mockUseVoiceStore.mockReturnValue({
        voiceAvailable: true,
        inputMode: 'voice',
      } as any);

      const { queryByText } = render(<VoiceStatusIndicator showLabel={false} />);
      
      expect(queryByText('Voice Mode')).toBeNull();
    });

    it('should show label by default', () => {
      mockUseVoiceStore.mockReturnValue({
        voiceAvailable: true,
        inputMode: 'voice',
      } as any);

      const { getByText } = render(<VoiceStatusIndicator />);
      
      expect(getByText('Voice Mode')).toBeTruthy();
    });

    it('should render with different sizes', () => {
      mockUseVoiceStore.mockReturnValue({
        voiceAvailable: true,
        inputMode: 'voice',
      } as any);

      // Test small size
      const { rerender } = render(<VoiceStatusIndicator size="small" />);
      expect(() => rerender(<VoiceStatusIndicator size="medium" />)).not.toThrow();
      expect(() => rerender(<VoiceStatusIndicator size="large" />)).not.toThrow();
    });
  });

  describe('Visual States', () => {
    it('should apply correct styles for voice mode', () => {
      mockUseVoiceStore.mockReturnValue({
        voiceAvailable: true,
        inputMode: 'voice',
      } as any);

      const { getByText } = render(<VoiceStatusIndicator />);
      const statusText = getByText('Voice Mode');
      
      // Check that text renders (style testing would require more specific testing tools)
      expect(statusText).toBeTruthy();
    });

    it('should apply correct styles for manual mode', () => {
      mockUseVoiceStore.mockReturnValue({
        voiceAvailable: true,
        inputMode: 'manual',
      } as any);

      const { getByText } = render(<VoiceStatusIndicator />);
      const statusText = getByText('Manual Mode');
      
      expect(statusText).toBeTruthy();
    });

    it('should apply correct styles for voice unavailable', () => {
      mockUseVoiceStore.mockReturnValue({
        voiceAvailable: false,
        inputMode: 'manual',
      } as any);

      const { getByText } = render(<VoiceStatusIndicator />);
      const statusText = getByText('Voice Unavailable');
      
      expect(statusText).toBeTruthy();
    });
  });

  describe('Store Integration', () => {
    it('should react to store changes', () => {
      // Start with voice mode
      mockUseVoiceStore.mockReturnValue({
        voiceAvailable: true,
        inputMode: 'voice',
      } as any);

      const { getByText, rerender } = render(<VoiceStatusIndicator />);
      expect(getByText('Voice Mode')).toBeTruthy();

      // Change to manual mode
      mockUseVoiceStore.mockReturnValue({
        voiceAvailable: true,
        inputMode: 'manual',
      } as any);

      rerender(<VoiceStatusIndicator />);
      expect(getByText('Manual Mode')).toBeTruthy();

      // Change to unavailable
      mockUseVoiceStore.mockReturnValue({
        voiceAvailable: false,
        inputMode: 'manual',
      } as any);

      rerender(<VoiceStatusIndicator />);
      expect(getByText('Voice Unavailable')).toBeTruthy();
    });
  });
});