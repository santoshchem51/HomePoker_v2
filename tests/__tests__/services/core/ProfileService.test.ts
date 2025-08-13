/**
 * ProfileService Test Suite
 * Tests for Story 2.5: Player Profile Management (Simplified/PO-Revised Version)
 * 
 * Coverage:
 * - ProfileService CRUD operations
 * - AsyncStorage integration
 * - Profile validation
 * - Recent profiles tracking
 * - Search functionality
 * - Error handling
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProfileService } from '../../../../src/services/core/ProfileService';
import { PlayerProfile, CreateProfileRequest, PROFILE_VALIDATION_RULES } from '../../../../src/types/profile';
import { ServiceError } from '../../../../src/services/core/ServiceError';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock UUID
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('ProfileService', () => {
  let profileService: ProfileService;
  const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

  beforeEach(() => {
    jest.clearAllMocks();
    profileService = ProfileService.getInstance();
    
    // Reset AsyncStorage mock implementations
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ProfileService.getInstance();
      const instance2 = ProfileService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('createProfile', () => {
    const validRequest: CreateProfileRequest = {
      name: 'John Doe',
      preferredBuyIn: 50
    };

    it('should create a profile successfully', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('[]'); // Empty profiles array

      const result = await profileService.createProfile(validRequest);

      expect(result).toMatchObject({
        id: 'mock-uuid-1234',
        name: 'John Doe',
        preferredBuyIn: 50,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      });

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'pokepot_profiles',
        expect.stringContaining('"name":"John Doe"')
      );
    });

    it('should trim whitespace from name', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('[]');

      const result = await profileService.createProfile({
        ...validRequest,
        name: '  John Doe  '
      });

      expect(result.name).toBe('John Doe');
    });

    it('should throw error for duplicate name', async () => {
      const existingProfile: PlayerProfile = {
        id: 'existing-id',
        name: 'John Doe',
        preferredBuyIn: 40,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify([existingProfile]));

      await expect(profileService.createProfile(validRequest))
        .rejects.toThrow(ServiceError);
    });

    it('should validate name requirements', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('[]');

      // Empty name
      await expect(profileService.createProfile({ ...validRequest, name: '' }))
        .rejects.toThrow(ServiceError);

      // Name too long
      await expect(profileService.createProfile({ 
        ...validRequest, 
        name: 'a'.repeat(PROFILE_VALIDATION_RULES.name.maxLength + 1) 
      })).rejects.toThrow(ServiceError);

      // Invalid characters
      await expect(profileService.createProfile({ 
        ...validRequest, 
        name: 'John@Doe#' 
      })).rejects.toThrow(ServiceError);
    });

    it('should validate buy-in requirements', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('[]');

      // Negative buy-in
      await expect(profileService.createProfile({ 
        ...validRequest, 
        preferredBuyIn: -10 
      })).rejects.toThrow(ServiceError);

      // Zero buy-in
      await expect(profileService.createProfile({ 
        ...validRequest, 
        preferredBuyIn: 0 
      })).rejects.toThrow(ServiceError);

      // Buy-in too high
      await expect(profileService.createProfile({ 
        ...validRequest, 
        preferredBuyIn: PROFILE_VALIDATION_RULES.preferredBuyIn.max + 1 
      })).rejects.toThrow(ServiceError);

      // Non-integer buy-in
      await expect(profileService.createProfile({ 
        ...validRequest, 
        preferredBuyIn: 50.5 
      })).rejects.toThrow(ServiceError);
    });
  });

  describe('updateProfile', () => {
    const existingProfile: PlayerProfile = {
      id: 'profile-1',
      name: 'John Doe',
      preferredBuyIn: 50,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    };

    beforeEach(() => {
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify([existingProfile]));
    });

    it('should update profile name', async () => {
      const result = await profileService.updateProfile('profile-1', { name: 'Jane Doe' });

      expect(result.name).toBe('Jane Doe');
      expect(result.preferredBuyIn).toBe(50); // Unchanged
      expect(result.updatedAt).not.toEqual(existingProfile.updatedAt);
    });

    it('should update preferred buy-in', async () => {
      const result = await profileService.updateProfile('profile-1', { preferredBuyIn: 75 });

      expect(result.preferredBuyIn).toBe(75);
      expect(result.name).toBe('John Doe'); // Unchanged
    });

    it('should throw error for non-existent profile', async () => {
      await expect(profileService.updateProfile('non-existent', { name: 'Jane' }))
        .rejects.toThrow(ServiceError);
    });

    it('should prevent duplicate names', async () => {
      const anotherProfile: PlayerProfile = {
        id: 'profile-2',
        name: 'Jane Doe',
        preferredBuyIn: 30,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify([existingProfile, anotherProfile]));

      await expect(profileService.updateProfile('profile-1', { name: 'Jane Doe' }))
        .rejects.toThrow(ServiceError);
    });
  });

  describe('getProfile', () => {
    const profiles: PlayerProfile[] = [
      {
        id: 'profile-1',
        name: 'John Doe',
        preferredBuyIn: 50,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    it('should return profile by ID', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(profiles));

      const result = await profileService.getProfile('profile-1');

      expect(result).toMatchObject({
        id: 'profile-1',
        name: 'John Doe',
        preferredBuyIn: 50
      });
    });

    it('should return null for non-existent profile', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(profiles));

      const result = await profileService.getProfile('non-existent');

      expect(result).toBeNull();
    });

    it('should handle empty storage', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const result = await profileService.getProfile('profile-1');

      expect(result).toBeNull();
    });
  });

  describe('deleteProfile', () => {
    const profiles: PlayerProfile[] = [
      {
        id: 'profile-1',
        name: 'John Doe',
        preferredBuyIn: 50,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'profile-2',
        name: 'Jane Doe',
        preferredBuyIn: 30,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    it('should delete existing profile', async () => {
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'pokepot_profiles') {
          return Promise.resolve(JSON.stringify(profiles));
        }
        if (key === 'pokepot_recent_profiles') {
          return Promise.resolve(JSON.stringify(['profile-1', 'profile-2']));
        }
        return Promise.resolve(null);
      });

      await profileService.deleteProfile('profile-1');

      // Should save updated profiles without deleted profile
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'pokepot_profiles',
        expect.not.stringContaining('"id":"profile-1"')
      );

      // Should update recent profiles
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'pokepot_recent_profiles',
        JSON.stringify(['profile-2'])
      );
    });

    it('should throw error for non-existent profile', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(profiles));

      await expect(profileService.deleteProfile('non-existent'))
        .rejects.toThrow(ServiceError);
    });
  });

  describe('searchProfilesByName', () => {
    const profiles: PlayerProfile[] = [
      {
        id: 'profile-1',
        name: 'John Doe',
        preferredBuyIn: 50,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'profile-2',
        name: 'Jane Smith',
        preferredBuyIn: 30,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'profile-3',
        name: 'Johnny Cash',
        preferredBuyIn: 100,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    beforeEach(() => {
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'pokepot_profiles') {
          return Promise.resolve(JSON.stringify(profiles));
        }
        if (key === 'pokepot_recent_profiles') {
          return Promise.resolve(JSON.stringify(['profile-1']));
        }
        return Promise.resolve(null);
      });
    });

    it('should find profiles by partial name match', async () => {
      const results = await profileService.searchProfilesByName('john');

      expect(results).toHaveLength(2);
      expect(results.map(r => r.profile.name)).toContain('John Doe');
      expect(results.map(r => r.profile.name)).toContain('Johnny Cash');
    });

    it('should mark recent profiles in results', async () => {
      const results = await profileService.searchProfilesByName('john');

      const johnDoeResult = results.find(r => r.profile.name === 'John Doe');
      const johnnyCashResult = results.find(r => r.profile.name === 'Johnny Cash');

      expect(johnDoeResult?.isRecent).toBe(true);
      expect(johnnyCashResult?.isRecent).toBe(false);
    });

    it('should return empty array for empty query', async () => {
      const results = await profileService.searchProfilesByName('');

      expect(results).toHaveLength(0);
    });

    it('should handle case insensitive search', async () => {
      const results = await profileService.searchProfilesByName('JOHN');

      expect(results).toHaveLength(2);
    });
  });

  describe('getRecentProfiles', () => {
    const profiles: PlayerProfile[] = [
      {
        id: 'profile-1',
        name: 'John Doe',
        preferredBuyIn: 50,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'profile-2',
        name: 'Jane Doe',
        preferredBuyIn: 30,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'profile-3',
        name: 'Bob Smith',
        preferredBuyIn: 75,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    it('should return recent profiles in order', async () => {
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'pokepot_profiles') {
          return Promise.resolve(JSON.stringify(profiles));
        }
        if (key === 'pokepot_recent_profiles') {
          return Promise.resolve(JSON.stringify(['profile-2', 'profile-1']));
        }
        return Promise.resolve(null);
      });

      const results = await profileService.getRecentProfiles();

      expect(results).toHaveLength(2);
      expect(results[0].name).toBe('Jane Doe');
      expect(results[1].name).toBe('John Doe');
    });

    it('should respect limit parameter', async () => {
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'pokepot_profiles') {
          return Promise.resolve(JSON.stringify(profiles));
        }
        if (key === 'pokepot_recent_profiles') {
          return Promise.resolve(JSON.stringify(['profile-2', 'profile-1', 'profile-3']));
        }
        return Promise.resolve(null);
      });

      const results = await profileService.getRecentProfiles(2);

      expect(results).toHaveLength(2);
    });

    it('should filter out deleted profiles', async () => {
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'pokepot_profiles') {
          return Promise.resolve(JSON.stringify([profiles[0], profiles[2]])); // Missing profile-2
        }
        if (key === 'pokepot_recent_profiles') {
          return Promise.resolve(JSON.stringify(['profile-2', 'profile-1', 'profile-3']));
        }
        return Promise.resolve(null);
      });

      const results = await profileService.getRecentProfiles();

      expect(results).toHaveLength(2);
      expect(results.map(p => p.id)).toEqual(['profile-1', 'profile-3']);
    });
  });

  describe('markProfileAsUsed', () => {
    const profile: PlayerProfile = {
      id: 'profile-1',
      name: 'John Doe',
      preferredBuyIn: 50,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    };

    it('should update recent profiles list', async () => {
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'pokepot_profiles') {
          return Promise.resolve(JSON.stringify([profile]));
        }
        if (key === 'pokepot_recent_profiles') {
          return Promise.resolve(JSON.stringify(['profile-2', 'profile-3']));
        }
        return Promise.resolve(null);
      });

      await profileService.markProfileAsUsed('profile-1');

      // Should add to front of recent list
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'pokepot_recent_profiles',
        JSON.stringify(['profile-1', 'profile-2', 'profile-3'])
      );
    });

    it('should move existing profile to front', async () => {
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'pokepot_profiles') {
          return Promise.resolve(JSON.stringify([profile]));
        }
        if (key === 'pokepot_recent_profiles') {
          return Promise.resolve(JSON.stringify(['profile-2', 'profile-1', 'profile-3']));
        }
        return Promise.resolve(null);
      });

      await profileService.markProfileAsUsed('profile-1');

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'pokepot_recent_profiles',
        JSON.stringify(['profile-1', 'profile-2', 'profile-3'])
      );
    });

    it('should respect maximum recent profiles limit', async () => {
      const manyRecentProfiles = Array.from({ length: 10 }, (_, i) => `profile-${i + 2}`);
      
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'pokepot_profiles') {
          return Promise.resolve(JSON.stringify([profile]));
        }
        if (key === 'pokepot_recent_profiles') {
          return Promise.resolve(JSON.stringify(manyRecentProfiles));
        }
        return Promise.resolve(null);
      });

      await profileService.markProfileAsUsed('profile-1');

      const savedCall = mockAsyncStorage.setItem.mock.calls.find(
        call => call[0] === 'pokepot_recent_profiles'
      );
      
      expect(savedCall).toBeDefined();
      const savedRecent = JSON.parse(savedCall![1] as string);
      expect(savedRecent).toHaveLength(6); // Maximum limit
      expect(savedRecent[0]).toBe('profile-1');
    });

    it('should update lastPlayedAt timestamp', async () => {
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'pokepot_profiles') {
          return Promise.resolve(JSON.stringify([profile]));
        }
        if (key === 'pokepot_recent_profiles') {
          return Promise.resolve(JSON.stringify([]));
        }
        return Promise.resolve(null);
      });

      await profileService.markProfileAsUsed('profile-1');

      const profileSaveCall = mockAsyncStorage.setItem.mock.calls.find(
        call => call[0] === 'pokepot_profiles'
      );
      
      expect(profileSaveCall).toBeDefined();
      const savedProfiles = JSON.parse(profileSaveCall![1] as string);
      const updatedProfile = savedProfiles[0];
      
      expect(updatedProfile.lastPlayedAt).toBeDefined();
      expect(new Date(updatedProfile.updatedAt)).toBeInstanceOf(Date);
    });

    it('should throw error for non-existent profile', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('[]');

      await expect(profileService.markProfileAsUsed('non-existent'))
        .rejects.toThrow(ServiceError);
    });
  });

  describe('Error Handling', () => {
    it('should handle AsyncStorage errors gracefully', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      await expect(profileService.getRecentProfiles())
        .rejects.toThrow(ServiceError);
    });

    it('should handle corrupted data', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('invalid json');

      await expect(profileService.getRecentProfiles())
        .rejects.toThrow(ServiceError);
    });
  });
});