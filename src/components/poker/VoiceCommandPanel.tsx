import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useVoiceStore } from '../../stores/voiceStore';
import VoiceService from '../../services/integration/VoiceService';
import VoiceCommandParser from '../../services/integration/VoiceCommandParser';
import { TransactionService } from '../../services/core/TransactionService';
import { SessionService } from '../../services/core/SessionService';
import { ServiceError } from '../../services/core/ServiceError';
import { VOICE_ERROR_CODES, SessionContext } from '../../types/voice';
import { VoiceBuyInConfirmationDialog } from './VoiceBuyInConfirmationDialog';
import { VoiceCommandHelp } from './VoiceCommandHelp';

interface VoiceCommandPanelProps {
  onVoiceCommand?: (text: string, confidence: number) => void;
  sessionId?: string;
  disabled?: boolean;
}

export const VoiceCommandPanel: React.FC<VoiceCommandPanelProps> = ({
  onVoiceCommand,
  sessionId,
  disabled = false,
}) => {
  const {
    isListening,
    error,
    capabilities,
    audioLevel,
    parsedCommand,
    showConfirmationDialog,
    isProcessingBuyIn,
    setState,
    setError,
    setCapabilities,
    startListening,
    stopListening,
    setParsedCommand,
    setShowConfirmationDialog,
    setIsProcessingBuyIn,
  } = useVoiceStore();

  const [isInitialized, setIsInitialized] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const initializeVoiceService = useCallback(async (): Promise<void> => {
    try {
      setState('idle');
      setError(null);
      
      const caps = await VoiceService.checkCapabilities();
      setCapabilities(caps);
      
      if (!caps.available) {
        setError('Voice recognition is not available on this device');
        return;
      }
      
      if (!caps.permissionGranted) {
        setError('Microphone permission required for voice commands');
        return;
      }
      
      // Set up callbacks for voice results
      VoiceService.setOnResult((result) => {
        // Call original callback if provided
        if (onVoiceCommand) {
          onVoiceCommand(result.text, result.confidence);
        }

        // Process buy-in commands if sessionId is provided
        if (sessionId) {
          // Use a promise-based approach to avoid circular dependency
          (async () => {
            try {
              // Get session context for player matching
              const sessionService = SessionService.getInstance();
              const sessionData = await sessionService.getSessionState(sessionId);
              
              if (!sessionData?.players?.length) {
                setError('No players found in current session');
                return;
              }

              const context: SessionContext = {
                sessionId,
                players: sessionData.players.map(p => ({
                  id: p.id,
                  name: p.name
                }))
              };

              // Parse the voice command
              const commandResult = await VoiceCommandParser.parseCommand(result.text, context);

              if (commandResult.command === 'buy-in') {
                setParsedCommand(commandResult);
                
                if (commandResult.requiresConfirmation) {
                  // Show confirmation dialog for low confidence or ambiguous commands
                  setShowConfirmationDialog(true);
                } else {
                  // Auto-process high confidence commands - call processBuyIn directly
                  try {
                    if (!sessionId) return;

                    setIsProcessingBuyIn(true);
                    setShowConfirmationDialog(false);

                    const transactionService = TransactionService.getInstance();
                    
                    await transactionService.recordBuyIn(
                      sessionId,
                      commandResult.playerMatch.playerId || '',
                      commandResult.amountParse.amount || 0,
                      'voice', // Transaction method set to 'voice'
                      'voice-command',
                      `Voice command buy-in for ${commandResult.playerMatch.playerName}`
                    );

                    // Provide voice feedback for successful transaction
                    Alert.alert(
                      'Buy-in Recorded',
                      `Successfully added $${commandResult.amountParse.amount} buy-in for ${commandResult.playerMatch.playerName}`,
                      [{ text: 'OK' }]
                    );

                    // Clear parsed command state
                    setParsedCommand(null);

                  } catch (buyInErr) {
                    console.error('Error processing buy-in:', buyInErr);
                    if (buyInErr instanceof ServiceError) {
                      setError(buyInErr.message);
                    } else {
                      setError('Failed to record buy-in');
                    }
                  } finally {
                    setIsProcessingBuyIn(false);
                  }
                }
              }
            } catch (err) {
              console.error('Error processing buy-in command:', err);
              if (err instanceof ServiceError) {
                setError(err.message);
              } else {
                setError('Failed to parse voice command');
              }
            }
          })();
        }
      });
      
      VoiceService.setOnError((err) => {
        setError(err.message);
        stopListening();
      });
      
      await VoiceService.initialize();
      setIsInitialized(true);
    } catch (err) {
      console.error('Voice service initialization failed:', err);
      
      if (err instanceof ServiceError) {
        setError(err.message);
      } else {
        setError('Failed to initialize voice recognition');
      }
    }
  }, [setState, setError, setCapabilities, stopListening, onVoiceCommand, sessionId, setParsedCommand, setShowConfirmationDialog, setIsProcessingBuyIn]);

  const processBuyIn = useCallback(async (playerId: string, playerName: string, amount: number) => {
    try {
      if (!sessionId) return;

      setIsProcessingBuyIn(true);
      setShowConfirmationDialog(false);

      const transactionService = TransactionService.getInstance();
      
      await transactionService.recordBuyIn(
        sessionId,
        playerId,
        amount,
        'voice', // Transaction method set to 'voice'
        'voice-command',
        `Voice command buy-in for ${playerName}`
      );

      // Provide voice feedback for successful transaction
      Alert.alert(
        'Buy-in Recorded',
        `Successfully added $${amount} buy-in for ${playerName}`,
        [{ text: 'OK' }]
      );

      // Clear parsed command state
      setParsedCommand(null);

    } catch (err) {
      console.error('Error processing buy-in:', err);
      if (err instanceof ServiceError) {
        setError(err.message);
      } else {
        setError('Failed to record buy-in');
      }
    } finally {
      setIsProcessingBuyIn(false);
    }
  }, [sessionId, setIsProcessingBuyIn, setShowConfirmationDialog, setParsedCommand, setError]);


  const handleConfirmBuyIn = useCallback(async (playerId: string, playerName: string, amount: number) => {
    await processBuyIn(playerId, playerName, amount);
  }, [processBuyIn]);

  const handleCancelBuyIn = useCallback(() => {
    setShowConfirmationDialog(false);
    setParsedCommand(null);
  }, [setShowConfirmationDialog, setParsedCommand]);

  useEffect(() => {
    initializeVoiceService();
    
    return () => {
      // Cleanup on unmount
      if (isListening) {
        VoiceService.stopListening().catch(console.error);
      }
    };
  }, [initializeVoiceService, isListening]);

  const handleVoiceButtonPress = async (): Promise<void> => {
    if (!isInitialized) {
      Alert.alert(
        'Voice Recognition Unavailable', 
        'Please check your device settings and permissions.'
      );
      return;
    }

    if (isListening) {
      await handleStopListening();
    } else {
      await handleStartListening();
    }
  };

  const handleStartListening = async (): Promise<void> => {
    try {
      setError(null);
      startListening();
      
      await VoiceService.startListening();
    } catch (err) {
      stopListening();
      console.error('Failed to start voice recognition:', err);
      
      if (err instanceof ServiceError) {
        setError(err.message);
        
        if (err.code === VOICE_ERROR_CODES.PERMISSION_DENIED) {
          Alert.alert(
            'Permission Required',
            'Please enable microphone permission in your device settings to use voice commands.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Retry', onPress: initializeVoiceService },
            ]
          );
        }
      } else {
        setError('Failed to start voice recognition');
      }
    }
  };

  const handleStopListening = async (): Promise<void> => {
    try {
      await VoiceService.stopListening();
      stopListening();
    } catch (err) {
      console.error('Failed to stop voice recognition:', err);
      stopListening(); // Force stop in store even if service fails
    }
  };

  const getButtonStyle = () => {
    if (disabled || !capabilities?.available) {
      return [styles.voiceButton, styles.voiceButtonDisabled];
    }
    
    if (isListening) {
      return [styles.voiceButton, styles.voiceButtonListening];
    }
    
    if (error) {
      return [styles.voiceButton, styles.voiceButtonError];
    }
    
    return styles.voiceButton;
  };

  const getButtonText = (): string => {
    if (!capabilities?.available) {
      return 'Voice Unavailable';
    }
    
    if (error) {
      return 'Voice Error';
    }
    
    if (isProcessingBuyIn) {
      return 'Processing...';
    }
    
    if (isListening) {
      return 'Listening...';
    }
    
    return 'Voice Command';
  };

  const showErrorMessage = (): void => {
    if (error) {
      Alert.alert('Voice Recognition Error', error);
    }
  };

  const renderAudioLevelIndicator = () => {
    if (!isListening) return null;
    
    return (
      <View style={styles.audioLevelContainer}>
        <View style={[styles.audioLevelBar, { height: Math.max(2, audioLevel * 20) }]} />
        <Text style={styles.audioLevelText}>Listening...</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={getButtonStyle()}
          onPress={handleVoiceButtonPress}
          onLongPress={showErrorMessage}
          disabled={disabled || !capabilities?.available || isProcessingBuyIn}
          activeOpacity={0.7}
        >
          <View style={styles.buttonContent}>
            {(isListening || isProcessingBuyIn) && (
              <ActivityIndicator 
                size="small" 
                color="#FFFFFF" 
                style={styles.loadingIndicator} 
              />
            )}
            <Text style={styles.buttonText}>{getButtonText()}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.helpButton}
          onPress={() => setShowHelp(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.helpButtonText}>?</Text>
        </TouchableOpacity>
      </View>
      
      {renderAudioLevelIndicator()}
      
      {error && (
        <Text style={styles.errorText} numberOfLines={2}>
          {error}
        </Text>
      )}
      
      {!capabilities?.available && (
        <Text style={styles.hintText}>
          Voice commands require microphone access
        </Text>
      )}

      <VoiceBuyInConfirmationDialog
        visible={showConfirmationDialog}
        parsedCommand={parsedCommand}
        onConfirm={handleConfirmBuyIn}
        onCancel={handleCancelBuyIn}
      />

      <VoiceCommandHelp
        visible={showHelp}
        onClose={() => setShowHelp(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  voiceButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  voiceButtonListening: {
    backgroundColor: '#FF5722',
  },
  voiceButtonError: {
    backgroundColor: '#F44336',
  },
  voiceButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingIndicator: {
    marginRight: 8,
  },
  audioLevelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    height: 24,
  },
  audioLevelBar: {
    backgroundColor: '#4CAF50',
    width: 4,
    marginRight: 8,
    borderRadius: 2,
  },
  audioLevelText: {
    fontSize: 12,
    color: '#666',
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 200,
  },
  hintText: {
    color: '#999',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 200,
  },
  helpButton: {
    backgroundColor: '#2196F3',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  helpButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});