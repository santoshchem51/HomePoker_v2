/**
 * ProfileCreationForm - Simple form component for creating player profiles
 * Implements Story 2.5: Player Profile Management (Simplified/PO-Revised Version)
 * 
 * Features:
 * - Simple form with name and buy-in fields only
 * - Validation for required fields following existing patterns
 * - Integration with ProfileService
 * - React Native form best practices
 * - Consistent styling with existing forms
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { ProfileService } from '../../services/core/ProfileService';
import { CreateProfileRequest, PROFILE_VALIDATION_RULES } from '../../types/profile';
import { ServiceError } from '../../services/core/ServiceError';

export interface ProfileCreationFormProps {
  onProfileCreated: (profileId: string, profileName: string) => void;
  onCancel: () => void;
  loading?: boolean;
}

export const ProfileCreationForm: React.FC<ProfileCreationFormProps> = React.memo(({
  onProfileCreated,
  onCancel,
  loading: externalLoading = false
}) => {
  const [name, setName] = useState('');
  const [preferredBuyIn, setPreferredBuyIn] = useState('');
  const [internalLoading, setInternalLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    preferredBuyIn?: string;
    general?: string;
  }>({});

  const loading = externalLoading || internalLoading;

  /**
   * Validate form inputs
   * AC: 2 - Profile creation form with name and buy-in fields
   */
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    // Validate profile name
    const trimmedName = name.trim();
    if (!trimmedName) {
      newErrors.name = 'Profile name is required';
    } else {
      const nameRules = PROFILE_VALIDATION_RULES.name;
      
      if (trimmedName.length < nameRules.minLength) {
        newErrors.name = `Profile name must be at least ${nameRules.minLength} character long`;
      } else if (trimmedName.length > nameRules.maxLength) {
        newErrors.name = `Profile name must be ${nameRules.maxLength} characters or less`;
      } else if (nameRules.pattern && !nameRules.pattern.test(trimmedName)) {
        newErrors.name = 'Profile name contains invalid characters';
      }
    }

    // Validate preferred buy-in
    const trimmedBuyIn = preferredBuyIn.trim();
    if (!trimmedBuyIn) {
      newErrors.preferredBuyIn = 'Preferred buy-in is required';
    } else {
      const numBuyIn = parseFloat(trimmedBuyIn);
      const buyInRules = PROFILE_VALIDATION_RULES.preferredBuyIn;
      
      if (isNaN(numBuyIn)) {
        newErrors.preferredBuyIn = 'Preferred buy-in must be a valid number';
      } else if (numBuyIn <= 0) {
        newErrors.preferredBuyIn = 'Preferred buy-in must be positive';
      } else if (!Number.isInteger(numBuyIn)) {
        newErrors.preferredBuyIn = 'Preferred buy-in must be a whole dollar amount';
      } else if (numBuyIn < buyInRules.min) {
        newErrors.preferredBuyIn = `Preferred buy-in must be at least $${buyInRules.min}`;
      } else if (numBuyIn > buyInRules.max) {
        newErrors.preferredBuyIn = `Preferred buy-in cannot exceed $${buyInRules.max}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   * AC: 2 - Create profile creation flow during session setup
   */
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setInternalLoading(true);
    setErrors(prev => ({ ...prev, general: undefined }));

    try {
      const profileService = ProfileService.getInstance();
      const request: CreateProfileRequest = {
        name: name.trim(),
        preferredBuyIn: parseInt(preferredBuyIn.trim(), 10)
      };

      const profile = await profileService.createProfile(request);
      
      Alert.alert(
        'Success',
        `Profile "${profile.name}" created successfully!`,
        [
          {
            text: 'OK',
            onPress: () => {
              onProfileCreated(profile.id, profile.name);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Profile creation failed:', error);
      
      let errorMessage = 'Failed to create profile. Please try again.';
      
      if (error instanceof ServiceError) {
        switch (error.code) {
          case 'DUPLICATE_PROFILE_NAME':
            setErrors(prev => ({ ...prev, name: 'A profile with this name already exists' }));
            return;
          case 'VALIDATION_ERROR':
            errorMessage = error.message;
            break;
          default:
            errorMessage = error.message;
        }
      }

      setErrors(prev => ({ ...prev, general: errorMessage }));
    } finally {
      setInternalLoading(false);
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
   * Format buy-in input to only allow whole numbers
   */
  const handleBuyInChange = (text: string) => {
    // Remove any non-numeric characters
    const cleaned = text.replace(/[^0-9]/g, '');
    setPreferredBuyIn(cleaned);
    clearError('preferredBuyIn');
  };

  const buyInRules = PROFILE_VALIDATION_RULES.preferredBuyIn;
  const nameRules = PROFILE_VALIDATION_RULES.name;

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.form}>
        <Text style={styles.title}>Create Player Profile</Text>
        <Text style={styles.subtitle}>Save player details for quick setup</Text>

        {/* General Error */}
        {errors.general && (
          <View style={styles.generalErrorContainer}>
            <Text style={styles.generalErrorText}>{errors.general}</Text>
          </View>
        )}

        {/* Profile Name Input */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Player Name *</Text>
          <TextInput
            style={[
              styles.input,
              errors.name ? styles.inputError : null
            ]}
            value={name}
            onChangeText={(text) => {
              setName(text);
              clearError('name');
            }}
            placeholder="e.g., John Smith"
            maxLength={nameRules.maxLength}
            editable={!loading}
            testID="profile-name-input"
            autoCapitalize="words"
            autoCorrect={false}
          />
          {errors.name && (
            <Text style={styles.errorText}>{errors.name}</Text>
          )}
          <Text style={styles.helperText}>
            {name.length}/{nameRules.maxLength} characters
          </Text>
        </View>

        {/* Preferred Buy-in Input */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Preferred Buy-in * (${buyInRules.min} - ${buyInRules.max})
          </Text>
          <View style={styles.buyInInputContainer}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={[
                styles.buyInInput,
                errors.preferredBuyIn ? styles.inputError : null
              ]}
              value={preferredBuyIn}
              onChangeText={handleBuyInChange}
              placeholder="50"
              keyboardType="numeric"
              editable={!loading}
              maxLength={4} // Max for 9999
              testID="profile-buyin-input"
            />
          </View>
          {errors.preferredBuyIn && (
            <Text style={styles.errorText}>{errors.preferredBuyIn}</Text>
          )}
          <Text style={styles.helperText}>
            This will be pre-filled when joining games
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.cancelButton,
              loading ? styles.buttonDisabled : null
            ]}
            onPress={onCancel}
            disabled={loading}
            testID="cancel-profile-creation"
          >
            <Text style={[styles.buttonText, styles.cancelButtonText]}>
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.createButton,
              loading ? styles.buttonDisabled : null
            ]}
            onPress={handleSubmit}
            disabled={loading}
            testID="create-profile-button"
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="white" />
                <Text style={[styles.buttonText, styles.loadingText]}>
                  Creating...
                </Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>Create Profile</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.requiredNote}>* Required fields</Text>
      </View>
    </KeyboardAvoidingView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Modal overlay
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    margin: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 24,
  },
  generalErrorContainer: {
    backgroundColor: '#FDEDEC',
    borderColor: '#E74C3C',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  generalErrorText: {
    color: '#E74C3C',
    fontSize: 14,
    textAlign: 'center',
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34495E',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#BDC3C7',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
    color: '#2C3E50',
  },
  buyInInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BDC3C7',
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#27AE60',
    marginRight: 8,
  },
  buyInInput: {
    flex: 1,
    fontSize: 16,
    color: '#2C3E50',
    textAlign: 'right',
    padding: 0, // Remove default padding since we're inside a container
  },
  inputError: {
    borderColor: '#E74C3C',
    backgroundColor: '#FDEDEC',
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  helperText: {
    color: '#7F8C8D',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelButton: {
    backgroundColor: '#95A5A6',
  },
  createButton: {
    backgroundColor: '#2196F3',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    marginLeft: 8,
  },
  requiredNote: {
    color: '#7F8C8D',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
});