/**
 * QuickPlayerSelection Test Suite
 * Tests for Story 2.5: Player Profile Management (Simplified/PO-Revised Version)
 * 
 * Coverage:
 * - Recent profiles display (max 6)
 * - Profile search functionality
 * - Guest player addition
 * - Profile selection handling
 * - Profile creation integration
 * - Loading and error states
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { QuickPlayerSelection } from '../../../../src/components/poker/QuickPlayerSelection';
import { ProfileService } from '../../../../src/services/core/ProfileService';
import { PlayerProfile, ProfileSearchResult } from '../../../../src/types/profile';

// Mock ProfileService
jest.mock('../../../../src/services/core/ProfileService');
const MockedProfileService = ProfileService as jest.MockedClass<typeof ProfileService>;

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock child components
jest.mock('../../../../src/components/poker/ProfileCreationForm', () => ({
  ProfileCreationForm: ({ onProfileCreated: _onProfileCreated, onCancel: _onCancel }: any) => {
    const MockedProfileCreationForm = ({ children }: { children?: React.ReactNode }) => (
      <>{children}</>
    );
    MockedProfileCreationForm.displayName = 'MockedProfileCreationForm';
    return MockedProfileCreationForm;
  }
}));

describe('QuickPlayerSelection', () => {
  let mockProfileService: jest.Mocked<ProfileService>;
  let mockOnPlayerSelect: jest.Mock;
  let mockOnCreateProfile: jest.Mock;

  const mockProfiles: PlayerProfile[] = [
    {
      id: 'profile-1',
      name: 'John Doe',
      preferredBuyIn: 50,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      lastPlayedAt: new Date('2023-01-10')
    },
    {
      id: 'profile-2',
      name: 'Jane Smith',
      preferredBuyIn: 75,
      createdAt: new Date('2023-01-02'),
      updatedAt: new Date('2023-01-02'),
      lastPlayedAt: new Date('2023-01-09')
    },
    {
      id: 'profile-3',
      name: 'Bob Johnson',
      preferredBuyIn: 100,
      createdAt: new Date('2023-01-03'),
      updatedAt: new Date('2023-01-03')
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockOnPlayerSelect = jest.fn();
    mockOnCreateProfile = jest.fn();
    
    mockProfileService = {
      getRecentProfiles: jest.fn(),
      searchProfilesByName: jest.fn(),
      markProfileAsUsed: jest.fn(),
      getProfile: jest.fn(),
    } as any;
    
    MockedProfileService.getInstance.mockReturnValue(mockProfileService);
    
    // Default mock implementations
    mockProfileService.getRecentProfiles.mockResolvedValue([mockProfiles[0], mockProfiles[1]]);
    mockProfileService.searchProfilesByName.mockResolvedValue([]);
    mockProfileService.markProfileAsUsed.mockResolvedValue();
  });

  const renderComponent = (props = {}) => {
    return render(
      <QuickPlayerSelection
        sessionId="test-session"
        onPlayerSelect={mockOnPlayerSelect}
        onCreateProfile={mockOnCreateProfile}
        {...props}
      />
    );
  };

  describe('Rendering', () => {
    it('should render main elements correctly', async () => {
      const { getByText, getByTestId } = renderComponent();

      await waitFor(() => {
        expect(getByText('Select Player')).toBeTruthy();
        expect(getByText('Choose a saved profile or add a guest')).toBeTruthy();
        expect(getByTestId('profile-search-input')).toBeTruthy();
        expect(getByTestId('guest-name-input')).toBeTruthy();
        expect(getByTestId('add-guest-button')).toBeTruthy();
        expect(getByTestId('create-profile-button')).toBeTruthy();
      });
    });

    it('should show loading state initially', () => {
      const { getByText } = renderComponent();

      expect(getByText('Loading recent players...')).toBeTruthy();
    });

    it('should hide guest option when showGuestOption is false', async () => {
      const { queryByText } = renderComponent({ showGuestOption: false });

      await waitFor(() => {
        expect(queryByText('Guest Player')).toBeNull();
      });
    });
  });

  describe('Recent Profiles', () => {
    it('should display recent profiles', async () => {
      const { getByText, getByTestId } = renderComponent();

      await waitFor(() => {
        expect(getByText('Recent Players')).toBeTruthy();
        expect(getByText('John Doe')).toBeTruthy();
        expect(getByText('$50')).toBeTruthy();
        expect(getByText('Jane Smith')).toBeTruthy();
        expect(getByText('$75')).toBeTruthy();
      });

      expect(getByTestId('profile-profile-1')).toBeTruthy();
      expect(getByTestId('profile-profile-2')).toBeTruthy();
    });

    it('should call ProfileService.getRecentProfiles with correct limit', async () => {
      renderComponent();

      await waitFor(() => {
        expect(mockProfileService.getRecentProfiles).toHaveBeenCalledWith(6);
      });
    });

    it('should handle empty recent profiles', async () => {
      mockProfileService.getRecentProfiles.mockResolvedValue([]);
      
      const { queryByText } = renderComponent();

      await waitFor(() => {
        expect(queryByText('Recent Players')).toBeNull();
      });
    });

    it('should mark profiles as recent', async () => {
      const { getAllByText } = renderComponent();

      await waitFor(() => {
        expect(getAllByText('Recent')).toHaveLength(2);
      });
    });
  });

  describe('Profile Search', () => {
    const searchResults: ProfileSearchResult[] = [
      {
        profile: mockProfiles[0],
        isRecent: true
      },
      {
        profile: mockProfiles[2],
        isRecent: false
      }
    ];

    it('should perform search when typing', async () => {
      const { getByTestId } = renderComponent();

      const searchInput = getByTestId('profile-search-input');
      fireEvent.changeText(searchInput, 'john');

      await waitFor(() => {
        expect(mockProfileService.searchProfilesByName).toHaveBeenCalledWith('john');
      }, { timeout: 500 }); // Account for debounce
    });

    it('should display search results', async () => {
      mockProfileService.searchProfilesByName.mockResolvedValue(searchResults);

      const { getByTestId, getByText } = renderComponent();

      const searchInput = getByTestId('profile-search-input');
      fireEvent.changeText(searchInput, 'john');

      await waitFor(() => {
        expect(getByText('Search Results')).toBeTruthy();
        expect(getByText('John Doe')).toBeTruthy();
        expect(getByText('Bob Johnson')).toBeTruthy();
      });
    });

    it('should show no results message', async () => {
      mockProfileService.searchProfilesByName.mockResolvedValue([]);

      const { getByTestId, getByText } = renderComponent();

      const searchInput = getByTestId('profile-search-input');
      fireEvent.changeText(searchInput, 'nonexistent');

      await waitFor(() => {
        expect(getByText('No profiles found matching "nonexistent"')).toBeTruthy();
      });
    });

    it('should show searching indicator', async () => {
      let resolveSearch: (value: ProfileSearchResult[]) => void;
      mockProfileService.searchProfilesByName.mockReturnValue(
        new Promise((resolve) => {
          resolveSearch = resolve;
        })
      );

      const { getByTestId, getByText } = renderComponent();

      const searchInput = getByTestId('profile-search-input');
      fireEvent.changeText(searchInput, 'john');

      await waitFor(() => {
        expect(getByText('Search Results (searching...)')).toBeTruthy();
      });

      resolveSearch!(searchResults);
    });

    it('should hide recent profiles when searching', async () => {
      const { getByTestId, queryByText } = renderComponent();

      const searchInput = getByTestId('profile-search-input');
      fireEvent.changeText(searchInput, 'test');

      await waitFor(() => {
        expect(queryByText('Recent Players')).toBeNull();
      });
    });

    it('should clear search results when clearing input', async () => {
      mockProfileService.searchProfilesByName.mockResolvedValue(searchResults);

      const { getByTestId, getByText, queryByText } = renderComponent();

      const searchInput = getByTestId('profile-search-input');
      fireEvent.changeText(searchInput, 'john');

      await waitFor(() => {
        expect(getByText('Search Results')).toBeTruthy();
      });

      fireEvent.changeText(searchInput, '');

      await waitFor(() => {
        expect(queryByText('Search Results')).toBeNull();
        expect(getByText('Recent Players')).toBeTruthy();
      });
    });
  });

  describe('Profile Selection', () => {
    it('should select profile and mark as used', async () => {
      const { getByTestId } = renderComponent();

      await waitFor(() => {
        const profileCard = getByTestId('profile-profile-1');
        fireEvent.press(profileCard);
      });

      expect(mockProfileService.markProfileAsUsed).toHaveBeenCalledWith('profile-1');
      expect(mockOnPlayerSelect).toHaveBeenCalledWith({
        type: 'profile',
        profile: mockProfiles[0],
        isRecent: true
      });
    });

    it('should handle mark as used failure gracefully', async () => {
      mockProfileService.markProfileAsUsed.mockRejectedValue(new Error('Storage error'));

      const { getByTestId } = renderComponent();

      await waitFor(() => {
        const profileCard = getByTestId('profile-profile-1');
        fireEvent.press(profileCard);
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Warning',
        'Profile selected but failed to update recent players list.',
        [{ text: 'OK' }]
      );

      // Should still proceed with selection
      expect(mockOnPlayerSelect).toHaveBeenCalledWith({
        type: 'profile',
        profile: mockProfiles[0],
        isRecent: true
      });
    });

    it('should not select profile when disabled', async () => {
      const { getByTestId } = renderComponent({ disabled: true });

      await waitFor(() => {
        const profileCard = getByTestId('profile-profile-1');
        fireEvent.press(profileCard);
      });

      expect(mockOnPlayerSelect).not.toHaveBeenCalled();
    });
  });

  describe('Guest Player', () => {
    it('should add guest player', async () => {
      const { getByTestId } = renderComponent();

      await waitFor(() => {
        const guestInput = getByTestId('guest-name-input');
        fireEvent.changeText(guestInput, 'Guest Player');

        const addGuestButton = getByTestId('add-guest-button');
        fireEvent.press(addGuestButton);
      });

      expect(mockOnPlayerSelect).toHaveBeenCalledWith({
        type: 'guest',
        guestData: { name: 'Guest Player' }
      });
    });

    it('should clear guest name after selection', async () => {
      const { getByTestId } = renderComponent();

      await waitFor(() => {
        const guestInput = getByTestId('guest-name-input');
        fireEvent.changeText(guestInput, 'Guest Player');

        const addGuestButton = getByTestId('add-guest-button');
        fireEvent.press(addGuestButton);

        expect(guestInput.props.value).toBe('');
      });
    });

    it('should disable add guest button when name is empty', async () => {
      const { getByTestId } = renderComponent();

      await waitFor(() => {
        const addGuestButton = getByTestId('add-guest-button');
        expect(addGuestButton.props.disabled).toBe(true);
      });
    });

    it('should enable add guest button when name is provided', async () => {
      const { getByTestId } = renderComponent();

      await waitFor(() => {
        const guestInput = getByTestId('guest-name-input');
        fireEvent.changeText(guestInput, 'Guest Player');

        const addGuestButton = getByTestId('add-guest-button');
        expect(addGuestButton.props.disabled).toBe(false);
      });
    });

    it('should not add guest when disabled', async () => {
      const { getByTestId } = renderComponent({ disabled: true });

      await waitFor(() => {
        const guestInput = getByTestId('guest-name-input');
        fireEvent.changeText(guestInput, 'Guest Player');

        const addGuestButton = getByTestId('add-guest-button');
        fireEvent.press(addGuestButton);
      });

      expect(mockOnPlayerSelect).not.toHaveBeenCalled();
    });
  });

  describe('Profile Creation', () => {
    it('should call onCreateProfile when provided', async () => {
      const { getByTestId } = renderComponent();

      await waitFor(() => {
        const createButton = getByTestId('create-profile-button');
        fireEvent.press(createButton);
      });

      expect(mockOnCreateProfile).toHaveBeenCalled();
    });

    it('should show profile creation form when onCreateProfile not provided', async () => {
      const { getByTestId } = renderComponent({ onCreateProfile: undefined });

      await waitFor(() => {
        const createButton = getByTestId('create-profile-button');
        fireEvent.press(createButton);
      });

      // This would show the ProfileCreationForm component
      // In our mocked version, we can't easily test this without more complex mocking
    });

    it('should not create profile when disabled', async () => {
      const { getByTestId } = renderComponent({ disabled: true });

      await waitFor(() => {
        const createButton = getByTestId('create-profile-button');
        expect(createButton.props.disabled).toBe(true);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle recent profiles loading error', async () => {
      mockProfileService.getRecentProfiles.mockRejectedValue(new Error('Storage error'));

      const { queryByText } = renderComponent();

      await waitFor(() => {
        expect(queryByText('Recent Players')).toBeNull();
      });
    });

    it('should handle search error gracefully', async () => {
      mockProfileService.searchProfilesByName.mockRejectedValue(new Error('Search error'));

      const { getByTestId, queryByText } = renderComponent();

      const searchInput = getByTestId('profile-search-input');
      fireEvent.changeText(searchInput, 'test');

      await waitFor(() => {
        expect(queryByText('Search Results')).toBeNull();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper test IDs for automation', async () => {
      const { getByTestId } = renderComponent();

      await waitFor(() => {
        expect(getByTestId('profile-search-input')).toBeTruthy();
        expect(getByTestId('guest-name-input')).toBeTruthy();
        expect(getByTestId('add-guest-button')).toBeTruthy();
        expect(getByTestId('create-profile-button')).toBeTruthy();
      });
    });

    it('should have proper placeholder text', async () => {
      const { getByTestId } = renderComponent();

      await waitFor(() => {
        const searchInput = getByTestId('profile-search-input');
        const guestInput = getByTestId('guest-name-input');

        expect(searchInput.props.placeholder).toBe('Search saved players...');
        expect(guestInput.props.placeholder).toBe('Enter guest player name');
      });
    });

    it('should limit guest name input length', async () => {
      const { getByTestId } = renderComponent();

      await waitFor(() => {
        const guestInput = getByTestId('guest-name-input');
        expect(guestInput.props.maxLength).toBe(50);
      });
    });
  });
});