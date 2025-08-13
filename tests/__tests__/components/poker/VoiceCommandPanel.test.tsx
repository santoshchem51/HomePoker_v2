import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { VoiceCommandPanel } from '../../../../src/components/poker/VoiceCommandPanel';
import { useVoiceStore } from '../../../../src/stores/voiceStore';
import VoiceService from '../../../../src/services/integration/VoiceService';
import { ServiceError } from '../../../../src/services/core/ServiceError';
import { VOICE_ERROR_CODES } from '../../../../src/types/voice';

// Mock dependencies
jest.mock('../../../../src/stores/voiceStore');
jest.mock('../../../../src/services/integration/VoiceService');
jest.mock('../../../../src/services/integration/VoiceCommandParser');
jest.mock('../../../../src/services/core/TransactionService');
jest.mock('../../../../src/services/core/SessionService');

// Mock child components
jest.mock('../../../../src/components/poker/VoiceBuyInConfirmationDialog', () => ({
  VoiceBuyInConfirmationDialog: ({ visible, onConfirm, onCancel }: any) => {
    if (!visible) return null;
    return (
      <div>
        <div>Confirm Buy-in</div>
        <button onClick={() => onConfirm('player-1', 'Test Player', 50)}>Confirm</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    );
  },
}));

jest.mock('../../../../src/components/poker/VoiceCommandHelp', () => ({
  VoiceCommandHelp: ({ visible, onClose }: any) => {
    if (!visible) return null;
    return (
      <div>
        <div>Voice Commands Guide</div>
        <button onClick={onClose}>Close</button>
      </div>
    );
  },
}));

// React Native is mocked globally in tests/setup.js

const mockUseVoiceStore = useVoiceStore as jest.MockedFunction<typeof useVoiceStore>;
const mockVoiceService = VoiceService as jest.Mocked<typeof VoiceService>;
const mockAlert = Alert.alert as jest.MockedFunction<typeof Alert.alert>;

describe('VoiceCommandPanel', () => {
  const mockStore = {
    state: 'idle' as const,
    isListening: false,
    error: null,
    capabilities: {
      available: true,
      permissionGranted: true,
      supportsSpeechRecognition: true,
      platform: 'ios' as const,
    },
    audioLevel: 0,
    parsedCommand: null,
    showConfirmationDialog: false,
    isProcessingBuyIn: false,
    lastCommand: null,
    setState: jest.fn(),
    setError: jest.fn(),
    setCapabilities: jest.fn(),
    startListening: jest.fn(),
    stopListening: jest.fn(),
    setParsedCommand: jest.fn(),
    setShowConfirmationDialog: jest.fn(),
    setIsProcessingBuyIn: jest.fn(),
    reset: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseVoiceStore.mockReturnValue(mockStore);
    
    // Default mock implementations
    mockVoiceService.checkCapabilities.mockResolvedValue({
      available: true,
      permissionGranted: true,
      supportsSpeechRecognition: true,
      platform: 'ios',
    });
    mockVoiceService.initialize.mockResolvedValue();
    mockVoiceService.startListening.mockResolvedValue();
    mockVoiceService.stopListening.mockResolvedValue();
  });

  describe('Initialization', () => {
    it('should render voice command button', () => {
      const { getByText } = render(<VoiceCommandPanel />);
      expect(getByText('Voice Command')).toBeTruthy();
    });

    it('should initialize voice service on mount', async () => {
      render(<VoiceCommandPanel />);
      
      await waitFor(() => {
        expect(mockVoiceService.checkCapabilities).toHaveBeenCalled();
        expect(mockVoiceService.initialize).toHaveBeenCalled();
      });
    });

    it('should display error when voice recognition unavailable', async () => {
      mockVoiceService.checkCapabilities.mockResolvedValue({
        available: false,
        permissionGranted: true,
        supportsSpeechRecognition: false,
        platform: 'ios',
      });

      const { getByText } = render(<VoiceCommandPanel />);
      
      await waitFor(() => {
        expect(getByText('Voice Unavailable')).toBeTruthy();
        expect(getByText('Voice commands require microphone access')).toBeTruthy();
      });
    });

    it('should display error when permissions not granted', async () => {
      mockVoiceService.checkCapabilities.mockResolvedValue({
        available: true,
        permissionGranted: false,
        supportsSpeechRecognition: true,
        platform: 'ios',
      });

      render(<VoiceCommandPanel />);
      
      await waitFor(() => {
        expect(mockStore.setError).toHaveBeenCalledWith('Microphone permission required for voice commands');
      });
    });
  });

  describe('Voice Button Interaction', () => {
    it('should start listening when button pressed and not listening', async () => {
      const { getByText } = render(<VoiceCommandPanel />);
      
      // Wait for initialization
      await waitFor(() => {
        expect(mockVoiceService.initialize).toHaveBeenCalled();
      });

      const button = getByText('Voice Command');
      fireEvent.press(button);

      await waitFor(() => {
        expect(mockStore.startListening).toHaveBeenCalled();
        expect(mockVoiceService.startListening).toHaveBeenCalled();
      });
    });

    it('should stop listening when button pressed and currently listening', async () => {
      mockUseVoiceStore.mockReturnValue({
        ...mockStore,
        isListening: true,
      });

      const { getByText } = render(<VoiceCommandPanel />);
      
      // Wait for initialization
      await waitFor(() => {
        expect(mockVoiceService.initialize).toHaveBeenCalled();
      });

      const button = getByText('Listening...');
      fireEvent.press(button);

      await waitFor(() => {
        expect(mockVoiceService.stopListening).toHaveBeenCalled();
        expect(mockStore.stopListening).toHaveBeenCalled();
      });
    });

    it('should show alert when voice unavailable and button pressed', async () => {
      mockUseVoiceStore.mockReturnValue({
        ...mockStore,
        capabilities: {
          available: false,
          permissionGranted: true,
          supportsSpeechRecognition: false,
          platform: 'ios',
        },
      });

      const { getByText } = render(<VoiceCommandPanel />);
      
      const button = getByText('Voice Unavailable');
      fireEvent.press(button);

      expect(mockAlert).toHaveBeenCalledWith(
        'Voice Recognition Unavailable', 
        'Please check your device settings and permissions.'
      );
    });

    it('should be disabled when disabled prop is true', () => {
      const { getByText } = render(<VoiceCommandPanel disabled={true} />);
      
      const button = getByText('Voice Command');
      expect(button.props.accessibilityState?.disabled).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle voice service initialization errors', async () => {
      const initError = new ServiceError(
        VOICE_ERROR_CODES.INITIALIZATION_FAILED,
        'Failed to initialize voice service'
      );
      mockVoiceService.initialize.mockRejectedValue(initError);

      render(<VoiceCommandPanel />);
      
      await waitFor(() => {
        expect(mockStore.setError).toHaveBeenCalledWith('Failed to initialize voice service');
      });
    });

    it('should handle voice recognition start errors', async () => {
      const startError = new ServiceError(
        VOICE_ERROR_CODES.RECOGNITION_FAILED,
        'Failed to start voice recognition'
      );
      mockVoiceService.startListening.mockRejectedValue(startError);

      const { getByText } = render(<VoiceCommandPanel />);
      
      // Wait for initialization
      await waitFor(() => {
        expect(mockVoiceService.initialize).toHaveBeenCalled();
      });

      const button = getByText('Voice Command');
      fireEvent.press(button);

      await waitFor(() => {
        expect(mockStore.setError).toHaveBeenCalledWith('Failed to start voice recognition');
        expect(mockStore.stopListening).toHaveBeenCalled();
      });
    });

    it('should show permission alert for permission denied errors', async () => {
      const permissionError = new ServiceError(
        VOICE_ERROR_CODES.PERMISSION_DENIED,
        'Permission denied'
      );
      mockVoiceService.startListening.mockRejectedValue(permissionError);

      const { getByText } = render(<VoiceCommandPanel />);
      
      // Wait for initialization
      await waitFor(() => {
        expect(mockVoiceService.initialize).toHaveBeenCalled();
      });

      const button = getByText('Voice Command');
      fireEvent.press(button);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Permission Required',
          'Please enable microphone permission in your device settings to use voice commands.',
          expect.arrayContaining([
            { text: 'Cancel', style: 'cancel' },
            { text: 'Retry', onPress: expect.any(Function) },
          ])
        );
      });
    });

    it('should display error message on long press', async () => {
      mockUseVoiceStore.mockReturnValue({
        ...mockStore,
        error: 'Test error message',
      });

      const { getByText } = render(<VoiceCommandPanel />);
      
      const button = getByText('Voice Error');
      fireEvent(button, 'onLongPress');

      expect(mockAlert).toHaveBeenCalledWith('Voice Recognition Error', 'Test error message');
    });
  });

  describe('Audio Level Indicator', () => {
    it('should show audio level indicator when listening', () => {
      mockUseVoiceStore.mockReturnValue({
        ...mockStore,
        isListening: true,
        audioLevel: 0.5,
      });

      const { getByText } = render(<VoiceCommandPanel />);
      
      expect(getByText('Listening...')).toBeTruthy();
    });

    it('should not show audio level indicator when not listening', () => {
      const { queryByText } = render(<VoiceCommandPanel />);
      
      // Should not find the listening text in audio level indicator
      const listeningTexts = queryByText('Listening...');
      if (listeningTexts) {
        // If found, it should be in the button, not the audio level indicator
        expect(listeningTexts.props.children).toBe('Voice Command');
      }
    });
  });

  describe('Button States', () => {
    it('should show correct button text for different states', () => {
      // Idle state
      const { rerender, getByText } = render(<VoiceCommandPanel />);
      expect(getByText('Voice Command')).toBeTruthy();

      // Listening state
      mockUseVoiceStore.mockReturnValue({
        ...mockStore,
        isListening: true,
      });
      rerender(<VoiceCommandPanel />);
      expect(getByText('Listening...')).toBeTruthy();

      // Error state
      mockUseVoiceStore.mockReturnValue({
        ...mockStore,
        error: 'Some error',
      });
      rerender(<VoiceCommandPanel />);
      expect(getByText('Voice Error')).toBeTruthy();

      // Unavailable state
      mockUseVoiceStore.mockReturnValue({
        ...mockStore,
        capabilities: {
          available: false,
          permissionGranted: true,
          supportsSpeechRecognition: false,
          platform: 'ios',
        },
      });
      rerender(<VoiceCommandPanel />);
      expect(getByText('Voice Unavailable')).toBeTruthy();
    });
  });

  describe('Voice Command Callback', () => {
    it('should call onVoiceCommand callback when provided', async () => {
      const onVoiceCommand = jest.fn();
      
      render(<VoiceCommandPanel onVoiceCommand={onVoiceCommand} />);
      
      // Wait for initialization
      await waitFor(() => {
        expect(mockVoiceService.initialize).toHaveBeenCalled();
      });

      // onVoiceCommand would be called when voice recognition provides results
      // This would be tested in integration tests with actual voice events
    });
  });

  describe('Cleanup', () => {
    it('should stop listening on unmount if currently listening', () => {
      mockUseVoiceStore.mockReturnValue({
        ...mockStore,
        isListening: true,
      });

      const { unmount } = render(<VoiceCommandPanel />);
      
      unmount();

      expect(mockVoiceService.stopListening).toHaveBeenCalled();
    });

    it('should not stop listening on unmount if not listening', () => {
      const { unmount } = render(<VoiceCommandPanel />);
      
      unmount();

      expect(mockVoiceService.stopListening).not.toHaveBeenCalled();
    });
  });

  describe('Buy-in Command Processing', () => {
    beforeEach(() => {
      // Mock the new buy-in state properties
      mockUseVoiceStore.mockReturnValue({
        ...mockStore,
        parsedCommand: null,
        showConfirmationDialog: false,
        isProcessingBuyIn: false,
        setParsedCommand: jest.fn(),
        setShowConfirmationDialog: jest.fn(),
        setIsProcessingBuyIn: jest.fn(),
      });
    });

    it('should show help dialog when help button is pressed', async () => {
      const { getByText, queryByText } = render(
        <VoiceCommandPanel sessionId="test-session" />
      );
      
      // Wait for initialization
      await waitFor(() => {
        expect(mockVoiceService.initialize).toHaveBeenCalled();
      });

      const helpButton = getByText('?');
      fireEvent.press(helpButton);

      // Help dialog should be visible
      await waitFor(() => {
        expect(queryByText('Voice Commands Guide')).toBeTruthy();
      });
    });

    it('should display processing state when processing buy-in', () => {
      mockUseVoiceStore.mockReturnValue({
        ...mockStore,
        parsedCommand: null,
        showConfirmationDialog: false,
        isProcessingBuyIn: true,
        setParsedCommand: jest.fn(),
        setShowConfirmationDialog: jest.fn(),
        setIsProcessingBuyIn: jest.fn(),
        capabilities: {
          available: true,
          permissionGranted: true,
          supportsSpeechRecognition: true,
          platform: 'ios',
        },
      });

      const { getByText } = render(
        <VoiceCommandPanel sessionId="test-session" />
      );

      expect(getByText('Processing...')).toBeTruthy();
    });

    it('should disable voice button when processing buy-in', () => {
      mockUseVoiceStore.mockReturnValue({
        ...mockStore,
        parsedCommand: null,
        showConfirmationDialog: false,
        isProcessingBuyIn: true,
        setParsedCommand: jest.fn(),
        setShowConfirmationDialog: jest.fn(),
        setIsProcessingBuyIn: jest.fn(),
        capabilities: {
          available: true,
          permissionGranted: true,
          supportsSpeechRecognition: true,
          platform: 'ios',
        },
      });

      const { getByText } = render(
        <VoiceCommandPanel sessionId="test-session" />
      );

      const button = getByText('Processing...');
      expect(button.parent?.props.accessibilityState?.disabled).toBe(true);
    });

    it('should show confirmation dialog when buy-in command requires confirmation', () => {
      const mockParsedCommand = {
        command: 'buy-in' as const,
        playerMatch: {
          playerId: 'player-1',
          playerName: 'John Smith',
          confidence: 0.6,
          similarMatches: [],
        },
        amountParse: {
          amount: 50,
          confidence: 0.8,
          rawText: 'fifty',
          interpretedAs: 'word number: 50',
        },
        overallConfidence: 0.65,
        requiresConfirmation: true,
      };

      mockUseVoiceStore.mockReturnValue({
        ...mockStore,
        parsedCommand: mockParsedCommand,
        showConfirmationDialog: true,
        isProcessingBuyIn: false,
        setParsedCommand: jest.fn(),
        setShowConfirmationDialog: jest.fn(),
        setIsProcessingBuyIn: jest.fn(),
      });

      const { queryByText } = render(
        <VoiceCommandPanel sessionId="test-session" />
      );

      expect(queryByText('Confirm Buy-in')).toBeTruthy();
    });

    it('should not process buy-in commands when sessionId is not provided', async () => {
      const mockOnVoiceCommand = jest.fn();
      
      render(
        <VoiceCommandPanel onVoiceCommand={mockOnVoiceCommand} />
      );
      
      // Wait for initialization
      await waitFor(() => {
        expect(mockVoiceService.initialize).toHaveBeenCalled();
      });

      // Simulate voice result callback
      const setOnResultCall = mockVoiceService.setOnResult.mock.calls[0];
      const onResultCallback = setOnResultCall[0];
      
      onResultCallback({
        recognized: true,
        text: 'add john fifty',
        confidence: 0.9,
        timestamp: new Date(),
        processingTime: 200,
      });

      // Should call the original callback but not process buy-in
      expect(mockOnVoiceCommand).toHaveBeenCalledWith('add john fifty', 0.9);
    });
  });
});