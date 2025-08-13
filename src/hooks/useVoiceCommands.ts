import { useEffect, useCallback } from 'react';
import { useVoiceStore } from '../stores/voiceStore';
import VoiceService from '../services/integration/VoiceService';
import { ServiceError } from '../services/core/ServiceError';
import { VoiceCommandResult, VOICE_ERROR_CODES } from '../types/voice';

interface UseVoiceCommandsOptions {
  onVoiceCommand?: (result: VoiceCommandResult) => void;
  onError?: (error: ServiceError) => void;
  autoInitialize?: boolean;
}

interface UseVoiceCommandsReturn {
  isListening: boolean;
  isAvailable: boolean;
  error: string | null;
  lastCommand: VoiceCommandResult | null;
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
  initialize: () => Promise<void>;
  destroy: () => Promise<void>;
}

export const useVoiceCommands = (
  options: UseVoiceCommandsOptions = {}
): UseVoiceCommandsReturn => {
  const {
    onVoiceCommand,
    onError,
    autoInitialize = true,
  } = options;

  const {
    isListening,
    error,
    capabilities,
    lastCommand,
    setState,
    setError,
    setCapabilities,
    startListening: storeStartListening,
    stopListening: storeStopListening,
    reset,
  } = useVoiceStore();

  const initialize = useCallback(async (): Promise<void> => {
    try {
      setState('idle');
      setError(null);
      
      const caps = await VoiceService.checkCapabilities();
      setCapabilities(caps);
      
      if (!caps.available) {
        const serviceError = new ServiceError(
          VOICE_ERROR_CODES.VOICE_RECOGNITION_UNAVAILABLE,
          'Voice recognition is not available on this device'
        );
        setError(serviceError.message);
        onError?.(serviceError);
        return;
      }
      
      // Set up callbacks for results and errors
      if (onVoiceCommand) {
        VoiceService.setOnResult(onVoiceCommand);
      }
      
      if (onError) {
        VoiceService.setOnError((err) => {
          setError(err.message);
          storeStopListening();
          onError(err);
        });
      }
      
      await VoiceService.initialize();
    } catch (err) {
      const serviceError = err instanceof ServiceError 
        ? err 
        : new ServiceError(
            VOICE_ERROR_CODES.INITIALIZATION_FAILED,
            'Failed to initialize voice recognition',
            err
          );
      
      setError(serviceError.message);
      onError?.(serviceError);
    }
  }, [setState, setError, setCapabilities, onError, onVoiceCommand, storeStopListening]);

  const startListening = useCallback(async (): Promise<void> => {
    try {
      if (!(await VoiceService.isAvailable())) {
        const serviceError = new ServiceError(
          VOICE_ERROR_CODES.VOICE_RECOGNITION_UNAVAILABLE,
          'Voice recognition is not available'
        );
        setError(serviceError.message);
        onError?.(serviceError);
        return;
      }

      setError(null);
      storeStartListening();
      
      await VoiceService.startListening();
    } catch (err) {
      storeStopListening();
      
      const serviceError = err instanceof ServiceError 
        ? err 
        : new ServiceError(
            VOICE_ERROR_CODES.RECOGNITION_FAILED,
            'Failed to start voice recognition',
            err
          );
      
      setError(serviceError.message);
      onError?.(serviceError);
    }
  }, [storeStartListening, storeStopListening, setError, onError]);

  const stopListening = useCallback(async (): Promise<void> => {
    try {
      await VoiceService.stopListening();
      storeStopListening();
    } catch (err) {
      storeStopListening(); // Force stop in store even if service fails
      
      const serviceError = err instanceof ServiceError 
        ? err 
        : new ServiceError(
            VOICE_ERROR_CODES.RECOGNITION_FAILED,
            'Failed to stop voice recognition',
            err
          );
      
      console.error('Failed to stop voice recognition:', serviceError);
    }
  }, [storeStopListening]);

  const destroy = useCallback(async (): Promise<void> => {
    try {
      await VoiceService.destroy();
      reset();
    } catch (err) {
      reset(); // Force reset even if destroy fails
      
      const serviceError = err instanceof ServiceError 
        ? err 
        : new ServiceError(
            VOICE_ERROR_CODES.RECOGNITION_FAILED,
            'Failed to destroy voice recognition',
            err
          );
      
      console.error('Failed to destroy voice recognition:', serviceError);
    }
  }, [reset]);

  // Note: Voice command results are now handled directly via callbacks
  // set in the initialize function, removing the need for effect-based handling

  // Auto-initialize if requested
  useEffect(() => {
    if (autoInitialize) {
      initialize();
    }
    
    // Cleanup on unmount
    return () => {
      if (isListening) {
        VoiceService.stopListening().catch(console.error);
      }
    };
  }, [autoInitialize, initialize, isListening]);

  return {
    isListening,
    isAvailable: capabilities?.available ?? false,
    error,
    lastCommand,
    startListening,
    stopListening,
    initialize,
    destroy,
  };
};