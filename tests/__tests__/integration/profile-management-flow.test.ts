/**
 * Profile Management Integration Test Suite
 * Tests for Story 2.5: Player Profile Management (Simplified/PO-Revised Version)
 * 
 * Coverage:
 * - Complete profile creation to session integration workflow
 * - ProfileService and SessionService integration
 * - Guest vs saved player flows
 * - Profile usage tracking
 * - Error scenarios and edge cases
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProfileService } from '../../../src/services/core/ProfileService';
import { SessionService } from '../../../src/services/core/SessionService';
import { DatabaseService } from '../../../src/services/infrastructure/DatabaseService';
import { PlayerProfile, CreateProfileRequest } from '../../../src/types/profile';
import { Session } from '../../../src/types/session';
import { Player } from '../../../src/types/player';
import { ServiceError } from '../../../src/services/core/ServiceError';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock DatabaseService
jest.mock('../../../src/services/infrastructure/DatabaseService');

// Mock UUID for consistent testing
jest.mock('uuid', () => ({
  v4: jest.fn(() => {
    const mockUuid = jest.requireActual('uuid').v4;
    return `mock-${mockUuid()}`;
  }),
}));

describe('Profile Management Integration Flow', () => {
  let profileService: ProfileService;
  let sessionService: SessionService;
  let mockDatabaseService: jest.Mocked<DatabaseService>;
  let testSession: Session;
  let testProfiles: PlayerProfile[];

  const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Setup DatabaseService mock
    mockDatabaseService = {
      createSession: jest.fn(),
      getSession: jest.fn(),
      addPlayer: jest.fn(),
      getPlayers: jest.fn(),
      executeTransaction: jest.fn(),
      updateSession: jest.fn(),
      removePlayer: jest.fn(),
    } as any;

    (DatabaseService.getInstance as jest.Mock).mockReturnValue(mockDatabaseService);

    // Setup services
    profileService = ProfileService.getInstance();
    sessionService = SessionService.getInstance();

    // Setup test data
    testSession = {
      id: 'test-session-id',
      name: 'Test Session',
      organizerId: 'test-organizer',
      status: 'created',
      totalPot: 0,
      playerCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    testProfiles = [
      {
        id: 'profile-1',
        name: 'John Doe',
        preferredBuyIn: 50,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01')
      },
      {
        id: 'profile-2',
        name: 'Jane Smith',
        preferredBuyIn: 75,
        createdAt: new Date('2023-01-02'),
        updatedAt: new Date('2023-01-02')
      }
    ];

    // Setup AsyncStorage defaults
    mockAsyncStorage.getItem.mockImplementation((key) => {
      if (key === 'pokepot_profiles') {
        return Promise.resolve(JSON.stringify(testProfiles));
      }
      if (key === 'pokepot_recent_profiles') {
        return Promise.resolve(JSON.stringify(['profile-1']));
      }
      return Promise.resolve(null);
    });
    mockAsyncStorage.setItem.mockResolvedValue();

    // Setup DatabaseService defaults
    mockDatabaseService.createSession.mockResolvedValue(testSession);
    mockDatabaseService.getSession.mockResolvedValue(testSession);
    mockDatabaseService.getPlayers.mockResolvedValue([]);
    mockDatabaseService.executeTransaction.mockImplementation((callback) => callback());
  });

  describe('Profile Creation and Usage Workflow', () => {
    it('should create profile, use in session, and track as recent', async () => {
      // Step 1: Create a new profile
      const profileRequest: CreateProfileRequest = {
        name: 'Alice Johnson',
        preferredBuyIn: 100
      };

      mockAsyncStorage.getItem.mockResolvedValueOnce('[]'); // Empty profiles for creation

      const createdProfile = await profileService.createProfile(profileRequest);

      expect(createdProfile.name).toBe('Alice Johnson');
      expect(createdProfile.preferredBuyIn).toBe(100);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'pokepot_profiles',
        expect.stringContaining('"name":"Alice Johnson"')
      );

      // Step 2: Use profile in session
      const mockPlayer: Player = {
        id: 'player-1',
        sessionId: testSession.id,
        name: 'Alice Johnson',
        isGuest: false,
        profileId: createdProfile.id,
        currentBalance: 0,
        totalBuyIns: 0,
        totalCashOuts: 0,
        status: 'active',
        joinedAt: new Date()
      };

      mockDatabaseService.addPlayer.mockResolvedValue(mockPlayer);

      const addedPlayer = await sessionService.addPlayerFromProfile(
        testSession.id,
        createdProfile.id
      );

      expect(addedPlayer.name).toBe('Alice Johnson');
      expect(addedPlayer.profileId).toBe(createdProfile.id);
      expect(addedPlayer.isGuest).toBe(false);

      // Verify profile was marked as used (recent profiles updated)
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'pokepot_recent_profiles',
        expect.stringContaining(createdProfile.id)
      );
    });

    it('should handle guest player workflow separately', async () => {
      const mockGuestPlayer: Player = {
        id: 'player-2',
        sessionId: testSession.id,
        name: 'Guest Player',
        isGuest: true,
        currentBalance: 0,
        totalBuyIns: 0,
        totalCashOuts: 0,
        status: 'active',
        joinedAt: new Date()
      };

      mockDatabaseService.addPlayer.mockResolvedValue(mockGuestPlayer);

      const addedPlayer = await sessionService.addGuestPlayer(
        testSession.id,
        'Guest Player'
      );

      expect(addedPlayer.name).toBe('Guest Player');
      expect(addedPlayer.isGuest).toBe(true);
      expect(addedPlayer.profileId).toBeUndefined();

      // Verify no profile-related AsyncStorage calls were made
      expect(mockAsyncStorage.setItem).not.toHaveBeenCalledWith(
        'pokepot_recent_profiles',
        expect.any(String)
      );
    });
  });

  describe('Recent Profiles Management', () => {
    it('should maintain recent profiles list with proper ordering', async () => {
      // Setup initial recent profiles
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'pokepot_profiles') {
          return Promise.resolve(JSON.stringify(testProfiles));
        }
        if (key === 'pokepot_recent_profiles') {
          return Promise.resolve(JSON.stringify(['profile-2', 'profile-1']));
        }
        return Promise.resolve(null);
      });

      const recentProfiles = await profileService.getRecentProfiles();

      expect(recentProfiles).toHaveLength(2);
      expect(recentProfiles[0].name).toBe('Jane Smith'); // profile-2 first
      expect(recentProfiles[1].name).toBe('John Doe');   // profile-1 second

      // Use profile-1, should move to front
      await profileService.markProfileAsUsed('profile-1');

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'pokepot_recent_profiles',
        JSON.stringify(['profile-1', 'profile-2']) // profile-1 now first
      );
    });

    it('should limit recent profiles to maximum of 6', async () => {
      const manyProfiles = Array.from({ length: 10 }, (_, i) => ({
        id: `profile-${i + 1}`,
        name: `Player ${i + 1}`,
        preferredBuyIn: 50,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      const manyRecentIds = manyProfiles.map(p => p.id);

      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'pokepot_profiles') {
          return Promise.resolve(JSON.stringify(manyProfiles));
        }
        if (key === 'pokepot_recent_profiles') {
          return Promise.resolve(JSON.stringify(manyRecentIds));
        }
        return Promise.resolve(null);
      });

      const recentProfiles = await profileService.getRecentProfiles();

      expect(recentProfiles).toHaveLength(6); // Limited to 6
      expect(recentProfiles.map(p => p.id)).toEqual([
        'profile-1', 'profile-2', 'profile-3', 'profile-4', 'profile-5', 'profile-6'
      ]);
    });
  });

  describe('Search Integration', () => {
    it('should search profiles and mark recent ones correctly', async () => {
      const searchResults = await profileService.searchProfilesByName('john');

      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].profile.name).toBe('John Doe');
      expect(searchResults[0].isRecent).toBe(true); // profile-1 is in recent list
    });

    it('should return non-recent profiles in search results', async () => {
      const searchResults = await profileService.searchProfilesByName('jane');

      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].profile.name).toBe('Jane Smith');
      expect(searchResults[0].isRecent).toBe(false); // profile-2 not in recent list
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle profile not found when adding to session', async () => {
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'pokepot_profiles') {
          return Promise.resolve('[]'); // No profiles
        }
        return Promise.resolve(null);
      });

      await expect(
        sessionService.addPlayerFromProfile(testSession.id, 'non-existent-profile')
      ).rejects.toThrow(ServiceError);
    });

    it('should handle duplicate player names across profile and guest players', async () => {
      // Add a profile player first
      const mockProfilePlayer: Player = {
        id: 'player-1',
        sessionId: testSession.id,
        name: 'John Doe',
        isGuest: false,
        profileId: 'profile-1',
        currentBalance: 0,
        totalBuyIns: 0,
        totalCashOuts: 0,
        status: 'active',
        joinedAt: new Date()
      };

      mockDatabaseService.getPlayers.mockResolvedValue([mockProfilePlayer]);
      mockDatabaseService.addPlayer.mockRejectedValue(
        new ServiceError('DUPLICATE_PLAYER_NAME', 'A player with this name already exists in the session')
      );

      // Try to add guest with same name
      await expect(
        sessionService.addGuestPlayer(testSession.id, 'John Doe')
      ).rejects.toThrow('A player with this name already exists in the session');
    });

    it('should handle session not in created status', async () => {
      mockDatabaseService.getSession.mockResolvedValue({
        ...testSession,
        status: 'active'
      });

      await expect(
        sessionService.addPlayerFromProfile(testSession.id, 'profile-1')
      ).rejects.toThrow('Cannot add players to a session that has already started');
    });

    it('should handle AsyncStorage errors gracefully', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      await expect(profileService.getRecentProfiles()).rejects.toThrow(ServiceError);
    });

    it('should handle corrupted profile data', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('invalid json');

      await expect(profileService.getRecentProfiles()).rejects.toThrow(ServiceError);
    });
  });

  describe('Player Type Grouping', () => {
    it('should correctly group players by type', async () => {
      const mockPlayers: Player[] = [
        {
          id: 'player-1',
          sessionId: testSession.id,
          name: 'John Doe',
          isGuest: false,
          profileId: 'profile-1',
          currentBalance: 0,
          totalBuyIns: 0,
          totalCashOuts: 0,
          status: 'active',
          joinedAt: new Date()
        },
        {
          id: 'player-2',
          sessionId: testSession.id,
          name: 'Guest Player',
          isGuest: true,
          currentBalance: 0,
          totalBuyIns: 0,
          totalCashOuts: 0,
          status: 'active',
          joinedAt: new Date()
        },
        {
          id: 'player-3',
          sessionId: testSession.id,
          name: 'Jane Smith',
          isGuest: false,
          profileId: 'profile-2',
          currentBalance: 0,
          totalBuyIns: 0,
          totalCashOuts: 0,
          status: 'active',
          joinedAt: new Date()
        }
      ];

      mockDatabaseService.getPlayers.mockResolvedValue(mockPlayers);

      const grouped = await sessionService.getPlayersGroupedByType(testSession.id);

      expect(grouped.profilePlayers).toHaveLength(2);
      expect(grouped.profilePlayers.map(p => p.name)).toContain('John Doe');
      expect(grouped.profilePlayers.map(p => p.name)).toContain('Jane Smith');

      expect(grouped.guestPlayers).toHaveLength(1);
      expect(grouped.guestPlayers[0].name).toBe('Guest Player');
    });
  });

  describe('Data Consistency', () => {
    it('should maintain data consistency when profile is deleted while in recent list', async () => {
      // Delete a profile that's in the recent list
      await profileService.deleteProfile('profile-1');

      // Recent profiles should be updated to remove deleted profile
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'pokepot_recent_profiles',
        JSON.stringify([]) // profile-1 removed from recent list
      );
    });

    it('should handle profile updates correctly', async () => {
      const updatedProfile = await profileService.updateProfile('profile-1', {
        name: 'John Updated',
        preferredBuyIn: 75
      });

      expect(updatedProfile.name).toBe('John Updated');
      expect(updatedProfile.preferredBuyIn).toBe(75);
      expect(updatedProfile.updatedAt).toBeInstanceOf(Date);

      // Verify profile was saved to storage
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'pokepot_profiles',
        expect.stringContaining('"name":"John Updated"')
      );
    });
  });

  describe('Performance Considerations', () => {
    it('should efficiently handle large numbers of profiles', async () => {
      const manyProfiles = Array.from({ length: 1000 }, (_, i) => ({
        id: `profile-${i + 1}`,
        name: `Player ${i + 1}`,
        preferredBuyIn: 50,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'pokepot_profiles') {
          return Promise.resolve(JSON.stringify(manyProfiles));
        }
        return Promise.resolve(null);
      });

      const startTime = Date.now();
      const searchResults = await profileService.searchProfilesByName('Player 500');
      const endTime = Date.now();

      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].profile.name).toBe('Player 500');
      expect(endTime - startTime).toBeLessThan(100); // Should be fast
    });
  });
});