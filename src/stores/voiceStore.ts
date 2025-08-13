import { create } from 'zustand';
import { VoiceRecognitionState, VoiceCommandResult, VoiceServiceCapabilities, CommandResult } from '../types/voice';

interface VoiceStore {
  // Voice recognition state
  state: VoiceRecognitionState;
  isListening: boolean;
  lastCommand: VoiceCommandResult | null;
  error: string | null;
  capabilities: VoiceServiceCapabilities | null;
  
  // Voice recording feedback
  audioLevel: number;
  recordingStartTime: Date | null;
  
  // Buy-in command state
  parsedCommand: CommandResult | null;
  showConfirmationDialog: boolean;
  isProcessingBuyIn: boolean;
  
  // Voice fallback state - Story 2.6A
  inputMode: 'voice' | 'manual';
  voiceAvailable: boolean;
  
  // Actions
  setState: (state: VoiceRecognitionState) => void;
  setListening: (listening: boolean) => void;
  setLastCommand: (command: VoiceCommandResult | null) => void;
  setError: (error: string | null) => void;
  setCapabilities: (capabilities: VoiceServiceCapabilities) => void;
  setAudioLevel: (level: number) => void;
  setRecordingStartTime: (time: Date | null) => void;
  
  // Buy-in command actions
  setParsedCommand: (command: CommandResult | null) => void;
  setShowConfirmationDialog: (show: boolean) => void;
  setIsProcessingBuyIn: (processing: boolean) => void;
  
  // Voice fallback actions - Story 2.6A
  setInputMode: (mode: 'voice' | 'manual') => void;
  setVoiceAvailable: (available: boolean) => void;
  
  // Composite actions
  startListening: () => void;
  stopListening: () => void;
  reset: () => void;
}

export const useVoiceStore = create<VoiceStore>((set) => ({
  // Initial state
  state: 'idle',
  isListening: false,
  lastCommand: null,
  error: null,
  capabilities: null,
  audioLevel: 0,
  recordingStartTime: null,
  
  // Buy-in command initial state
  parsedCommand: null,
  showConfirmationDialog: false,
  isProcessingBuyIn: false,
  
  // Voice fallback initial state - Story 2.6A
  inputMode: 'voice',
  voiceAvailable: false,
  
  // Basic setters
  setState: (state) => set({ state }),
  setListening: (isListening) => set({ isListening }),
  setLastCommand: (lastCommand) => set({ lastCommand }),
  setError: (error) => set({ error }),
  setCapabilities: (capabilities) => set({ capabilities }),
  setAudioLevel: (audioLevel) => set({ audioLevel }),
  setRecordingStartTime: (recordingStartTime) => set({ recordingStartTime }),
  
  // Buy-in command setters
  setParsedCommand: (parsedCommand) => set({ parsedCommand }),
  setShowConfirmationDialog: (showConfirmationDialog) => set({ showConfirmationDialog }),
  setIsProcessingBuyIn: (isProcessingBuyIn) => set({ isProcessingBuyIn }),
  
  // Voice fallback setters - Story 2.6A
  setInputMode: (inputMode) => set({ inputMode }),
  setVoiceAvailable: (voiceAvailable) => set({ voiceAvailable }),
  
  // Composite actions
  startListening: () => set({
    state: 'listening',
    isListening: true,
    error: null,
    recordingStartTime: new Date(),
    audioLevel: 0,
  }),
  
  stopListening: () => set({
    state: 'idle',
    isListening: false,
    recordingStartTime: null,
    audioLevel: 0,
  }),
  
  reset: () => set({
    state: 'idle',
    isListening: false,
    lastCommand: null,
    error: null,
    audioLevel: 0,
    recordingStartTime: null,
    parsedCommand: null,
    showConfirmationDialog: false,
    isProcessingBuyIn: false,
    // Note: inputMode and voiceAvailable are not reset as they should persist across sessions
  }),
}));