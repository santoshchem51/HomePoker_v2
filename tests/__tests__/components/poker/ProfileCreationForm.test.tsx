/**
 * ProfileCreationForm Test Suite
 * Tests for Story 2.5: Player Profile Management (Simplified/PO-Revised Version)
 * 
 * Coverage:
 * - Form rendering and user interactions
 * - Input validation
 * - ProfileService integration
 * - Success and error handling
 * - Accessibility features
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { ProfileCreationForm } from '../../../../src/components/poker/ProfileCreationForm';
import { ProfileService } from '../../../../src/services/core/ProfileService';
import { PlayerProfile } from '../../../../src/types/profile';
import { ServiceError } from '../../../../src/services/core/ServiceError';

// Mock ProfileService
jest.mock('../../../../src/services/core/ProfileService');
const MockedProfileService = ProfileService as jest.MockedClass<typeof ProfileService>;

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock UUID
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-profile-id'),
}));

describe('ProfileCreationForm', () => {
  let mockProfileService: jest.Mocked<ProfileService>;
  let mockOnProfileCreated: jest.Mock;
  let mockOnCancel: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockOnProfileCreated = jest.fn();
    mockOnCancel = jest.fn();
    
    mockProfileService = {
      createProfile: jest.fn(),
    } as any;
    
    MockedProfileService.getInstance.mockReturnValue(mockProfileService);
  });

  const renderComponent = (props = {}) => {
    return render(
      <ProfileCreationForm
        onProfileCreated={mockOnProfileCreated}
        onCancel={mockOnCancel}
        {...props}
      />
    );
  };

  describe('Rendering', () => {
    it('should render form elements correctly', () => {
      const { getByTestId, getByText } = renderComponent();

      expect(getByText('Create Player Profile')).toBeTruthy();
      expect(getByText('Save player details for quick setup')).toBeTruthy();
      expect(getByTestId('profile-name-input')).toBeTruthy();
      expect(getByTestId('profile-buyin-input')).toBeTruthy();
      expect(getByTestId('create-profile-button')).toBeTruthy();
      expect(getByTestId('cancel-profile-creation')).toBeTruthy();
    });

    it('should display validation rules in labels', () => {
      const { getByText } = renderComponent();

      expect(getByText('Player Name *')).toBeTruthy();
      expect(getByText('Preferred Buy-in * ($1 - $10000)')).toBeTruthy();
    });

    it('should show character count for name input', () => {
      const { getByText, getByTestId } = renderComponent();

      const nameInput = getByTestId('profile-name-input');
      fireEvent.changeText(nameInput, 'John');

      expect(getByText('4/50 characters')).toBeTruthy();
    });
  });

  describe('Input Validation', () => {
    it('should validate required name field', async () => {
      const { getByTestId } = renderComponent();

      const createButton = getByTestId('create-profile-button');
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(mockProfileService.createProfile).not.toHaveBeenCalled();
      });
    });

    it('should validate name length constraints', async () => {
      const { getByTestId, getByText } = renderComponent();

      // Test name too long
      const nameInput = getByTestId('profile-name-input');
      fireEvent.changeText(nameInput, 'a'.repeat(51));
      
      const buyInInput = getByTestId('profile-buyin-input');
      fireEvent.changeText(buyInInput, '50');

      const createButton = getByTestId('create-profile-button');
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(getByText('Profile name must be 50 characters or less')).toBeTruthy();
      });
    });

    it('should validate name character restrictions', async () => {
      const { getByTestId, getByText } = renderComponent();

      const nameInput = getByTestId('profile-name-input');
      fireEvent.changeText(nameInput, 'John@Doe#');
      
      const buyInInput = getByTestId('profile-buyin-input');
      fireEvent.changeText(buyInInput, '50');

      const createButton = getByTestId('create-profile-button');
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(getByText('Profile name contains invalid characters')).toBeTruthy();
      });
    });

    it('should validate required buy-in field', async () => {
      const { getByTestId, getByText } = renderComponent();

      const nameInput = getByTestId('profile-name-input');
      fireEvent.changeText(nameInput, 'John Doe');

      const createButton = getByTestId('create-profile-button');
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(getByText('Preferred buy-in is required')).toBeTruthy();
      });
    });

    it('should validate buy-in amount constraints', async () => {
      const { getByTestId, getByText } = renderComponent();

      const nameInput = getByTestId('profile-name-input');
      fireEvent.changeText(nameInput, 'John Doe');

      const buyInInput = getByTestId('profile-buyin-input');
      
      // Test zero amount
      fireEvent.changeText(buyInInput, '0');
      
      const createButton = getByTestId('create-profile-button');
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(getByText('Preferred buy-in must be positive')).toBeTruthy();
      });
    });

    it('should validate buy-in as whole dollar amount', async () => {
      const { getByTestId, getByText } = renderComponent();

      const nameInput = getByTestId('profile-name-input');
      fireEvent.changeText(nameInput, 'John Doe');

      // Buy-in input should only allow integers, but test the validation
      const buyInInput = getByTestId('profile-buyin-input');
      fireEvent.changeText(buyInInput, '50.5');

      const createButton = getByTestId('create-profile-button');
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(getByText('Preferred buy-in must be a whole dollar amount')).toBeTruthy();
      });
    });

    it('should filter non-numeric input for buy-in', () => {
      const { getByTestId } = renderComponent();

      const buyInInput = getByTestId('profile-buyin-input');
      fireEvent.changeText(buyInInput, 'abc123def');

      // The input should only contain numeric characters
      expect(buyInInput.props.value).toBe('123');
    });
  });

  describe('Profile Creation', () => {
    const mockProfile: PlayerProfile = {
      id: 'mock-profile-id',
      name: 'John Doe',
      preferredBuyIn: 50,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should create profile successfully', async () => {
      mockProfileService.createProfile.mockResolvedValue(mockProfile);

      const { getByTestId } = renderComponent();

      const nameInput = getByTestId('profile-name-input');
      fireEvent.changeText(nameInput, 'John Doe');

      const buyInInput = getByTestId('profile-buyin-input');
      fireEvent.changeText(buyInInput, '50');

      const createButton = getByTestId('create-profile-button');
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(mockProfileService.createProfile).toHaveBeenCalledWith({
          name: 'John Doe',
          preferredBuyIn: 50
        });
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Success',
        'Profile "John Doe" created successfully!',
        expect.any(Array)
      );
    });

    it('should trim whitespace from name', async () => {
      mockProfileService.createProfile.mockResolvedValue(mockProfile);

      const { getByTestId } = renderComponent();

      const nameInput = getByTestId('profile-name-input');
      fireEvent.changeText(nameInput, '  John Doe  ');

      const buyInInput = getByTestId('profile-buyin-input');
      fireEvent.changeText(buyInInput, '50');

      const createButton = getByTestId('create-profile-button');
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(mockProfileService.createProfile).toHaveBeenCalledWith({
          name: 'John Doe',
          preferredBuyIn: 50
        });
      });
    });

    it('should call onProfileCreated after successful creation', async () => {
      mockProfileService.createProfile.mockResolvedValue(mockProfile);

      const { getByTestId } = renderComponent();

      const nameInput = getByTestId('profile-name-input');
      fireEvent.changeText(nameInput, 'John Doe');

      const buyInInput = getByTestId('profile-buyin-input');
      fireEvent.changeText(buyInInput, '50');

      const createButton = getByTestId('create-profile-button');
      fireEvent.press(createButton);

      // Simulate Alert OK press
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });

      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const okButton = alertCall[2][0];
      okButton.onPress();

      expect(mockOnProfileCreated).toHaveBeenCalledWith('mock-profile-id', 'John Doe');
    });

    it('should show loading state during creation', async () => {
      let resolveCreate: (value: PlayerProfile) => void;
      mockProfileService.createProfile.mockReturnValue(
        new Promise((resolve) => {
          resolveCreate = resolve;
        })
      );

      const { getByTestId, getByText } = renderComponent();

      const nameInput = getByTestId('profile-name-input');
      fireEvent.changeText(nameInput, 'John Doe');

      const buyInInput = getByTestId('profile-buyin-input');
      fireEvent.changeText(buyInInput, '50');

      const createButton = getByTestId('create-profile-button');
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(getByText('Creating...')).toBeTruthy();
      });

      resolveCreate!(mockProfile);
    });
  });

  describe('Error Handling', () => {
    it('should handle duplicate name error', async () => {
      const duplicateError = new ServiceError('DUPLICATE_PROFILE_NAME', 'A profile with this name already exists');
      mockProfileService.createProfile.mockRejectedValue(duplicateError);

      const { getByTestId, getByText } = renderComponent();

      const nameInput = getByTestId('profile-name-input');
      fireEvent.changeText(nameInput, 'John Doe');

      const buyInInput = getByTestId('profile-buyin-input');
      fireEvent.changeText(buyInInput, '50');

      const createButton = getByTestId('create-profile-button');
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(getByText('A profile with this name already exists')).toBeTruthy();
      });
    });

    it('should handle validation errors', async () => {
      const validationError = new ServiceError('VALIDATION_ERROR', 'Invalid data');
      mockProfileService.createProfile.mockRejectedValue(validationError);

      const { getByTestId, getByText } = renderComponent();

      const nameInput = getByTestId('profile-name-input');
      fireEvent.changeText(nameInput, 'John Doe');

      const buyInInput = getByTestId('profile-buyin-input');
      fireEvent.changeText(buyInInput, '50');

      const createButton = getByTestId('create-profile-button');
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(getByText('Invalid data')).toBeTruthy();
      });
    });

    it('should handle unknown errors', async () => {
      mockProfileService.createProfile.mockRejectedValue(new Error('Network error'));

      const { getByTestId, getByText } = renderComponent();

      const nameInput = getByTestId('profile-name-input');
      fireEvent.changeText(nameInput, 'John Doe');

      const buyInInput = getByTestId('profile-buyin-input');
      fireEvent.changeText(buyInInput, '50');

      const createButton = getByTestId('create-profile-button');
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(getByText('Failed to create profile. Please try again.')).toBeTruthy();
      });
    });

    it('should clear errors when user starts typing', async () => {
      const duplicateError = new ServiceError('DUPLICATE_PROFILE_NAME', 'Duplicate name');
      mockProfileService.createProfile.mockRejectedValue(duplicateError);

      const { getByTestId, getByText, queryByText } = renderComponent();

      // Trigger error
      const nameInput = getByTestId('profile-name-input');
      fireEvent.changeText(nameInput, 'John Doe');

      const buyInInput = getByTestId('profile-buyin-input');
      fireEvent.changeText(buyInInput, '50');

      const createButton = getByTestId('create-profile-button');
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(getByText('A profile with this name already exists')).toBeTruthy();
      });

      // Clear error by typing
      fireEvent.changeText(nameInput, 'Jane Doe');

      await waitFor(() => {
        expect(queryByText('A profile with this name already exists')).toBeNull();
      });
    });
  });

  describe('Cancel Functionality', () => {
    it('should call onCancel when cancel button is pressed', () => {
      const { getByTestId } = renderComponent();

      const cancelButton = getByTestId('cancel-profile-creation');
      fireEvent.press(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should disable buttons when external loading is true', () => {
      const { getByTestId } = renderComponent({ loading: true });

      const createButton = getByTestId('create-profile-button');
      const cancelButton = getByTestId('cancel-profile-creation');

      expect(createButton.props.disabled).toBe(true);
      expect(cancelButton.props.disabled).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should have proper test IDs for automation', () => {
      const { getByTestId } = renderComponent();

      expect(getByTestId('profile-name-input')).toBeTruthy();
      expect(getByTestId('profile-buyin-input')).toBeTruthy();
      expect(getByTestId('create-profile-button')).toBeTruthy();
      expect(getByTestId('cancel-profile-creation')).toBeTruthy();
    });

    it('should have proper placeholder text', () => {
      const { getByTestId } = renderComponent();

      const nameInput = getByTestId('profile-name-input');
      const buyInInput = getByTestId('profile-buyin-input');

      expect(nameInput.props.placeholder).toBe('e.g., John Smith');
      expect(buyInInput.props.placeholder).toBe('50');
    });
  });
});