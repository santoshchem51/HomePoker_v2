/**
 * SessionForm - Form component for session creation with validation
 * Handles input validation for session name and organizer information
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator
} from 'react-native';

export interface SessionFormProps {
  onSubmit: (sessionName: string, organizerId: string) => Promise<void>;
  loading: boolean;
}

export const SessionForm: React.FC<SessionFormProps> = ({ onSubmit, loading }) => {
  const [sessionName, setSessionName] = useState('');
  const [organizerId, setOrganizerId] = useState('');
  const [errors, setErrors] = useState<{
    sessionName?: string;
    organizerId?: string;
  }>({});

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
    } else if (trimmedSessionName.length > 50) {
      newErrors.sessionName = 'Session name must be 50 characters or less';
    }

    // Validate organizer ID
    const trimmedOrganizerId = organizerId.trim();
    if (!trimmedOrganizerId) {
      newErrors.organizerId = 'Organizer name is required';
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

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>Session Details</Text>

      {/* Session Name Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Session Name *</Text>
        <TextInput
          style={[
            styles.input,
            errors.sessionName ? styles.inputError : null
          ]}
          value={sessionName}
          onChangeText={(text) => {
            setSessionName(text);
            clearError('sessionName');
          }}
          placeholder="e.g., Friday Night Poker"
          maxLength={50}
          editable={!loading}
          testID="session-name-input"
        />
        {errors.sessionName && (
          <Text style={styles.errorText}>{errors.sessionName}</Text>
        )}
        <Text style={styles.helperText}>
          {sessionName.length}/50 characters
        </Text>
      </View>

      {/* Organizer ID Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Organizer Name *</Text>
        <TextInput
          style={[
            styles.input,
            errors.organizerId ? styles.inputError : null
          ]}
          value={organizerId}
          onChangeText={(text) => {
            setOrganizerId(text);
            clearError('organizerId');
          }}
          placeholder="Your name"
          editable={!loading}
          testID="organizer-id-input"
        />
        {errors.organizerId && (
          <Text style={styles.errorText}>{errors.organizerId}</Text>
        )}
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          loading ? styles.submitButtonDisabled : styles.submitButtonEnabled
        ]}
        onPress={handleSubmit}
        disabled={loading}
        testID="create-session-button"
      >
        {loading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={styles.submitButtonText}>Create Session</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.requiredNote}>* Required fields</Text>
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
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  inputError: {
    borderColor: '#ff4444',
    backgroundColor: '#ffe6e6',
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