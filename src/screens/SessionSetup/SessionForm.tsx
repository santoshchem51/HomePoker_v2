/**
 * SessionForm - Form component for session creation with validation
 * Handles input validation for session name and organizer information
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { showToast } from '../../components/common/ToastManager';
import { useTheme } from '../../contexts/ThemeContext';
import { DarkPokerColors } from '../../styles/darkTheme.styles';
import { RealVoiceService } from '../../services/integration/RealVoiceService';

export interface SessionFormProps {
  onSubmit: (sessionName: string, organizerId: string) => Promise<void>;
  loading: boolean;
}

// Voice Input Button Component (WhatsApp style) with Real Speech Recognition
const VoiceInputButton: React.FC<{
  onVoiceInput: (text: string) => void;
  isDarkMode: boolean;
  disabled?: boolean;
}> = ({ onVoiceInput, isDarkMode, disabled }) => {
  const [isRecording, setIsRecording] = useState(false);
  const voiceService = RealVoiceService.getInstance();

  const handleVoicePress = async () => {
    if (disabled) return;

    if (isRecording) {
      // Stop recording
      await voiceService.stopListening();
      setIsRecording(false);
    } else {
      // Start recording with real voice recognition
      const started = await voiceService.startListening({
        onStart: () => {
          setIsRecording(true);
          console.log('Voice recording started');
        },
        onResult: (result) => {
          console.log('Voice recognition result:', result);
          if (result.text && result.text.trim()) {
            onVoiceInput(result.text.trim());
            showToast({
              type: 'success',
              title: '🎤 Voice Input Complete',
              message: `Recognized: "${result.text}"`,
              duration: 2000,
            });
          }
          setIsRecording(false);
        },
        onError: (error) => {
          console.error('Voice recognition error:', error);
          setIsRecording(false);
          
          // Show single, clear error message
          showToast({
            type: 'error',
            title: 'Voice Input Unavailable',
            message: error.includes('emulator') ? 
              'Voice input requires a physical device with microphone.' :
              'Voice input not available. Please type manually.',
            duration: 3000,
          });
        },
        onEnd: () => {
          setIsRecording(false);
          console.log('Voice recording ended');
        }
      });

      if (!started) {
        setIsRecording(false);
        // Voice not available, show helpful message without duplicate error
        console.log('Voice service failed to start - user will see error from onError callback');
      }
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.voiceButton,
        {
          backgroundColor: isRecording 
            ? (isDarkMode ? DarkPokerColors.error : '#ff4444')
            : (isDarkMode ? DarkPokerColors.buttonSecondary : '#f0f0f0'),
          borderColor: isDarkMode ? DarkPokerColors.border : '#ddd',
        },
        disabled && styles.voiceButtonDisabled
      ]}
      onPress={handleVoicePress}
      disabled={disabled}
    >
      <Text style={[
        styles.voiceButtonText,
        {
          color: isRecording 
            ? '#fff'
            : (isDarkMode ? DarkPokerColors.primaryText : '#666')
        }
      ]}>
        {isRecording ? '⏹️' : '🎤'}
      </Text>
    </TouchableOpacity>
  );
};

export const SessionForm: React.FC<SessionFormProps> = ({ onSubmit, loading }) => {
  const { isDarkMode } = useTheme();
  const [sessionName, setSessionName] = useState('');
  const [organizerId, setOrganizerId] = useState('');
  const [errors, setErrors] = useState<{
    sessionName?: string;
    organizerId?: string;
  }>({});

  // Cleanup voice service on unmount
  useEffect(() => {
    return () => {
      const voiceService = RealVoiceService.getInstance();
      voiceService.cleanup();
    };
  }, []);

  /**
   * Validate form inputs
   * AC: 1 - Session name and organizer information validation
   */
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    // Validate session name
    const trimmedSessionName = sessionName.trim();
    if (!trimmedSessionName) {
      newErrors.sessionName = 'Session name is required';
    } else if (trimmedSessionName.length < 3) {
      newErrors.sessionName = 'Session name must be at least 3 characters';
    } else if (trimmedSessionName.length > 50) {
      newErrors.sessionName = 'Session name must be 50 characters or less';
    } else if (/^test|^session\d+|^game\d+/i.test(trimmedSessionName)) {
      newErrors.sessionName = 'Please enter a meaningful session name (avoid test names)';
    }

    // Validate organizer ID
    const trimmedOrganizerId = organizerId.trim();
    if (!trimmedOrganizerId) {
      newErrors.organizerId = 'Organizer name is required';
    } else if (trimmedOrganizerId.length < 2) {
      newErrors.organizerId = 'Organizer name must be at least 2 characters';
    } else if (/^test|^user\d+|^admin/i.test(trimmedOrganizerId)) {
      newErrors.organizerId = 'Please enter a real organizer name (avoid test names)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(sessionName.trim(), organizerId.trim());
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  /**
   * Clear error when user starts typing
   */
  const clearError = (field: keyof typeof errors) => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  /**
   * Handle voice input for session name
   */
  const handleSessionNameVoice = (text: string) => {
    setSessionName(text);
    clearError('sessionName');
  };

  /**
   * Handle voice input for organizer ID
   */
  const handleOrganizerIdVoice = (text: string) => {
    setOrganizerId(text);
    clearError('organizerId');
  };

  return (
    <View style={[
      styles.container,
      { backgroundColor: isDarkMode ? DarkPokerColors.cardBackground : 'white' }
    ]}>
      <Text style={[
        styles.subtitle,
        { color: isDarkMode ? DarkPokerColors.primaryText : '#333' }
      ]}>Session Details</Text>

      {/* Session Name Input */}
      <View style={styles.inputContainer}>
        <Text style={[
          styles.label,
          { color: isDarkMode ? DarkPokerColors.primaryText : '#333' }
        ]}>Session Name *</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[
              styles.input,
              styles.inputWithVoice,
              {
                backgroundColor: isDarkMode ? DarkPokerColors.background : '#f9f9f9',
                color: isDarkMode ? DarkPokerColors.primaryText : '#333',
                borderColor: isDarkMode ? DarkPokerColors.border : '#ddd',
              },
              errors.sessionName ? styles.inputError : null
            ]}
            value={sessionName}
            onChangeText={(text) => {
              setSessionName(text);
              clearError('sessionName');
            }}
            placeholder="e.g., Friday Night Poker"
            placeholderTextColor={isDarkMode ? DarkPokerColors.placeholderText : '#999'}
            maxLength={50}
            editable={!loading}
            testID="session-name-input"
          />
          <VoiceInputButton
            onVoiceInput={handleSessionNameVoice}
            isDarkMode={isDarkMode}
            disabled={loading}
          />
        </View>
        {errors.sessionName && (
          <Text style={[
            styles.errorText,
            { color: isDarkMode ? DarkPokerColors.error : '#cc0000' }
          ]}>{errors.sessionName}</Text>
        )}
        <Text style={[
          styles.helperText,
          { color: isDarkMode ? DarkPokerColors.secondaryText : '#666' }
        ]}>
          {sessionName.length}/50 characters
        </Text>
      </View>

      {/* Organizer ID Input */}
      <View style={styles.inputContainer}>
        <Text style={[
          styles.label,
          { color: isDarkMode ? DarkPokerColors.primaryText : '#333' }
        ]}>Organizer Name *</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[
              styles.input,
              styles.inputWithVoice,
              {
                backgroundColor: isDarkMode ? DarkPokerColors.background : '#f9f9f9',
                color: isDarkMode ? DarkPokerColors.primaryText : '#333',
                borderColor: isDarkMode ? DarkPokerColors.border : '#ddd',
              },
              errors.organizerId ? styles.inputError : null
            ]}
            value={organizerId}
            onChangeText={(text) => {
              setOrganizerId(text);
              clearError('organizerId');
            }}
            placeholder="Your name"
            placeholderTextColor={isDarkMode ? DarkPokerColors.placeholderText : '#999'}
            editable={!loading}
            testID="organizer-id-input"
          />
          <VoiceInputButton
            onVoiceInput={handleOrganizerIdVoice}
            isDarkMode={isDarkMode}
            disabled={loading}
          />
        </View>
        {errors.organizerId && (
          <Text style={[
            styles.errorText,
            { color: isDarkMode ? DarkPokerColors.error : '#cc0000' }
          ]}>{errors.organizerId}</Text>
        )}
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          loading ? styles.submitButtonDisabled : {
            backgroundColor: isDarkMode ? DarkPokerColors.buttonPrimary : '#2196F3'
          }
        ]}
        onPress={handleSubmit}
        disabled={loading}
        testID="create-session-button"
      >
        {loading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={[
            styles.submitButtonText,
            { color: isDarkMode ? DarkPokerColors.buttonText : 'white' }
          ]}>Create Session</Text>
        )}
      </TouchableOpacity>

      <Text style={[
        styles.requiredNote,
        { color: isDarkMode ? DarkPokerColors.secondaryText : '#666' }
      ]}>* Required fields</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  inputWithVoice: {
    flex: 1, // Take up remaining space in the row
  },
  inputError: {
    borderColor: '#ff4444',
    backgroundColor: '#ffe6e6',
  },
  voiceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginTop: 1, // Slight adjustment to align with text input
  },
  voiceButtonDisabled: {
    opacity: 0.5,
  },
  voiceButtonText: {
    fontSize: 18,
    textAlign: 'center',
  },
  errorText: {
    color: '#cc0000',
    fontSize: 12,
    marginTop: 4,
  },
  helperText: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  submitButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 88, // Large touch target for accessibility
  },
  submitButtonEnabled: {
    backgroundColor: '#2196F3',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  requiredNote: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
});