/**
 * ProfileService - Core business logic for player profile management
 * Implements Story 2.5: Player Profile Management (Simplified/PO-Revised Version)
 * 
 * Features:
 * - Basic CRUD operations using AsyncStorage
 * - Simple name search functionality
 * - Recent players tracking (max 6)
 * - Profile validation and error handling
 * - Integration with existing SessionService patterns
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import { 
  PlayerProfile, 
  ProfileData, 
  CreateProfileRequest, 
  UpdateProfileRequest,
  ProfileSearchResult,
  PROFILE_VALIDATION_RULES
} from '../../types/profile';
import { ServiceError } from './ServiceError';

export class ProfileService {
  private static instance: ProfileService | null = null;
  private static readonly PROFILES_KEY = 'pokepot_profiles';
  private static readonly RECENT_PROFILES_KEY = 'pokepot_recent_profiles';
  private static readonly MAX_RECENT_PROFILES = 6;

  private constructor() {}

  /**
   * Get singleton instance of ProfileService
   */
  public static getInstance(): ProfileService {
    if (!ProfileService.instance) {
      ProfileService.instance = new ProfileService();
    }
    return ProfileService.instance;
  }

  /**
   * Create a new player profile
   * AC: 1, 2
   */
  public async createProfile(request: CreateProfileRequest): Promise<PlayerProfile> {
    try {
      // Validate input data
      this.validateProfileData(request);

      // Check for duplicate names
      const existingProfiles = await this.getAllProfiles();
      const duplicateName = existingProfiles.find(
        profile => profile.name.toLowerCase() === request.name.trim().toLowerCase()
      );

      if (duplicateName) {
        throw new ServiceError('DUPLICATE_PROFILE_NAME', 'A profile with this name already exists');
      }

      // Create new profile
      const now = new Date();
      const profile: PlayerProfile = {
        id: uuidv4(),
        name: request.name.trim(),
        preferredBuyIn: request.preferredBuyIn,
        createdAt: now,
        updatedAt: now
      };

      // Save to AsyncStorage
      await this.saveProfile(profile);

      return profile;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError('PROFILE_CREATION_FAILED', `Failed to create profile: ${error}`);
    }
  }

  /**
   * Update an existing profile
   * AC: 1, 2
   */
  public async updateProfile(id: string, updates: UpdateProfileRequest): Promise<PlayerProfile> {
    try {
      if (!id) {
        throw new ServiceError('VALIDATION_ERROR', 'Profile ID is required');
      }

      const existingProfile = await this.getProfile(id);
      if (!existingProfile) {
        throw new ServiceError('PROFILE_NOT_FOUND', `Profile ${id} not found`);
      }

      // Validate updates
      if (updates.name !== undefined) {
        this.validateName(updates.name);
        
        // Check for duplicate names (excluding current profile)
        const allProfiles = await this.getAllProfiles();
        const duplicateName = allProfiles.find(
          profile => profile.id !== id && 
          profile.name.toLowerCase() === updates.name!.trim().toLowerCase()
        );

        if (duplicateName) {
          throw new ServiceError('DUPLICATE_PROFILE_NAME', 'A profile with this name already exists');
        }
      }

      if (updates.preferredBuyIn !== undefined) {
        this.validateBuyIn(updates.preferredBuyIn);
      }

      // Create updated profile
      const updatedProfile: PlayerProfile = {
        ...existingProfile,
        ...(updates.name !== undefined && { name: updates.name.trim() }),
        ...(updates.preferredBuyIn !== undefined && { preferredBuyIn: updates.preferredBuyIn }),
        updatedAt: new Date()
      };

      // Save updated profile
      await this.saveProfile(updatedProfile);

      return updatedProfile;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError('PROFILE_UPDATE_FAILED', `Failed to update profile: ${error}`);
    }
  }

  /**
   * Get a profile by ID
   * AC: 4
   */
  public async getProfile(id: string): Promise<PlayerProfile | null> {
    try {
      if (!id) {
        throw new ServiceError('VALIDATION_ERROR', 'Profile ID is required');
      }

      const profiles = await this.getAllProfiles();
      return profiles.find(profile => profile.id === id) || null;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError('PROFILE_FETCH_FAILED', `Failed to get profile: ${error}`);
    }
  }

  /**
   * Delete a profile
   * AC: 1
   */
  public async deleteProfile(id: string): Promise<void> {
    try {
      if (!id) {
        throw new ServiceError('VALIDATION_ERROR', 'Profile ID is required');
      }

      const profiles = await this.getAllProfiles();
      const filteredProfiles = profiles.filter(profile => profile.id !== id);

      if (profiles.length === filteredProfiles.length) {
        throw new ServiceError('PROFILE_NOT_FOUND', `Profile ${id} not found`);
      }

      await this.saveAllProfiles(filteredProfiles);

      // Remove from recent profiles as well
      await this.removeFromRecentProfiles(id);
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError('PROFILE_DELETE_FAILED', `Failed to delete profile: ${error}`);
    }
  }

  /**
   * Search profiles by name
   * AC: 6
   */
  public async searchProfilesByName(query: string): Promise<ProfileSearchResult[]> {
    try {
      if (!query || query.trim().length === 0) {
        return [];
      }

      const profiles = await this.getAllProfiles();
      const recentProfileIds = await this.getRecentProfileIds();
      const searchQuery = query.trim().toLowerCase();

      const matchingProfiles = profiles.filter(profile =>
        profile.name.toLowerCase().includes(searchQuery)
      );

      return matchingProfiles.map(profile => ({
        profile,
        isRecent: recentProfileIds.includes(profile.id)
      }));
    } catch (error) {
      throw new ServiceError('PROFILE_SEARCH_FAILED', `Failed to search profiles: ${error}`);
    }
  }

  /**
   * Get recent profiles (max 6)
   * AC: 3
   */
  public async getRecentProfiles(limit: number = ProfileService.MAX_RECENT_PROFILES): Promise<PlayerProfile[]> {
    try {
      const recentProfileIds = await this.getRecentProfileIds();
      const profiles = await this.getAllProfiles();
      
      const recentProfiles = recentProfileIds
        .map(id => profiles.find(profile => profile.id === id))
        .filter((profile): profile is PlayerProfile => profile !== undefined)
        .slice(0, limit);

      return recentProfiles;
    } catch (error) {
      throw new ServiceError('RECENT_PROFILES_FETCH_FAILED', `Failed to get recent profiles: ${error}`);
    }
  }

  /**
   * Mark a profile as recently used
   * AC: 3
   */
  public async markProfileAsUsed(profileId: string): Promise<void> {
    try {
      if (!profileId) {
        throw new ServiceError('VALIDATION_ERROR', 'Profile ID is required');
      }

      // Verify profile exists
      const profile = await this.getProfile(profileId);
      if (!profile) {
        throw new ServiceError('PROFILE_NOT_FOUND', `Profile ${profileId} not found`);
      }

      const recentProfileIds = await this.getRecentProfileIds();
      
      // Remove if already exists to move it to front
      const filteredIds = recentProfileIds.filter(id => id !== profileId);
      
      // Add to front of list
      const updatedIds = [profileId, ...filteredIds].slice(0, ProfileService.MAX_RECENT_PROFILES);
      
      await this.saveRecentProfileIds(updatedIds);

      // Update lastPlayedAt timestamp
      const updatedProfile: PlayerProfile = {
        ...profile,
        lastPlayedAt: new Date(),
        updatedAt: new Date()
      };

      await this.saveProfile(updatedProfile);
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError('MARK_PROFILE_USED_FAILED', `Failed to mark profile as used: ${error}`);
    }
  }

  /**
   * Get all profiles (for internal use)
   */
  private async getAllProfiles(): Promise<PlayerProfile[]> {
    try {
      const data = await AsyncStorage.getItem(ProfileService.PROFILES_KEY);
      if (!data) {
        return [];
      }

      const profiles = JSON.parse(data) as PlayerProfile[];
      
      // Convert date strings back to Date objects
      return profiles.map(profile => ({
        ...profile,
        createdAt: new Date(profile.createdAt),
        updatedAt: new Date(profile.updatedAt),
        ...(profile.lastPlayedAt && { lastPlayedAt: new Date(profile.lastPlayedAt) })
      }));
    } catch (error) {
      throw new ServiceError('STORAGE_ERROR', `Failed to retrieve profiles from storage: ${error}`);
    }
  }

  /**
   * Save a single profile (updates the profile in the list)
   */
  private async saveProfile(profile: PlayerProfile): Promise<void> {
    try {
      const profiles = await this.getAllProfiles();
      const index = profiles.findIndex(p => p.id === profile.id);
      
      if (index >= 0) {
        profiles[index] = profile;
      } else {
        profiles.push(profile);
      }

      await this.saveAllProfiles(profiles);
    } catch (error) {
      throw new ServiceError('STORAGE_ERROR', `Failed to save profile to storage: ${error}`);
    }
  }

  /**
   * Save all profiles to storage
   */
  private async saveAllProfiles(profiles: PlayerProfile[]): Promise<void> {
    try {
      await AsyncStorage.setItem(ProfileService.PROFILES_KEY, JSON.stringify(profiles));
    } catch (error) {
      throw new ServiceError('STORAGE_ERROR', `Failed to save profiles to storage: ${error}`);
    }
  }

  /**
   * Get recent profile IDs
   */
  private async getRecentProfileIds(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(ProfileService.RECENT_PROFILES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.warn('Failed to get recent profile IDs, returning empty array:', error);
      // Try to clear corrupted data
      try {
        await AsyncStorage.removeItem(ProfileService.RECENT_PROFILES_KEY);
      } catch (clearError) {
        console.warn('Failed to clear corrupted recent profiles data:', clearError);
      }
      return [];
    }
  }

  /**
   * Save recent profile IDs
   */
  private async saveRecentProfileIds(ids: string[]): Promise<void> {
    try {
      await AsyncStorage.setItem(ProfileService.RECENT_PROFILES_KEY, JSON.stringify(ids));
    } catch (error) {
      throw new ServiceError('STORAGE_ERROR', `Failed to save recent profiles: ${error}`);
    }
  }

  /**
   * Remove profile from recent list
   */
  private async removeFromRecentProfiles(profileId: string): Promise<void> {
    try {
      const recentIds = await this.getRecentProfileIds();
      const filteredIds = recentIds.filter(id => id !== profileId);
      await this.saveRecentProfileIds(filteredIds);
    } catch (error) {
      // Don't throw error for this operation, just log it
      console.warn('Failed to remove profile from recent list:', error);
    }
  }

  /**
   * Validate profile data
   */
  private validateProfileData(data: ProfileData): void {
    this.validateName(data.name);
    this.validateBuyIn(data.preferredBuyIn);
  }

  /**
   * Validate profile name
   */
  private validateName(name: string): void {
    if (!name || typeof name !== 'string') {
      throw new ServiceError('VALIDATION_ERROR', 'Profile name is required');
    }

    const trimmedName = name.trim();
    const rules = PROFILE_VALIDATION_RULES.name;

    if (trimmedName.length < rules.minLength) {
      throw new ServiceError('VALIDATION_ERROR', `Profile name must be at least ${rules.minLength} character long`);
    }

    if (trimmedName.length > rules.maxLength) {
      throw new ServiceError('VALIDATION_ERROR', `Profile name must be ${rules.maxLength} characters or less`);
    }

    if (rules.pattern && !rules.pattern.test(trimmedName)) {
      throw new ServiceError('VALIDATION_ERROR', 'Profile name contains invalid characters');
    }
  }

  /**
   * Validate preferred buy-in amount
   */
  private validateBuyIn(buyIn: number): void {
    if (typeof buyIn !== 'number' || isNaN(buyIn)) {
      throw new ServiceError('VALIDATION_ERROR', 'Preferred buy-in must be a valid number');
    }

    const rules = PROFILE_VALIDATION_RULES.preferredBuyIn;

    if (buyIn < rules.min) {
      throw new ServiceError('VALIDATION_ERROR', `Preferred buy-in must be at least $${rules.min}`);
    }

    if (buyIn > rules.max) {
      throw new ServiceError('VALIDATION_ERROR', `Preferred buy-in cannot exceed $${rules.max}`);
    }

    if (!Number.isInteger(buyIn)) {
      throw new ServiceError('VALIDATION_ERROR', 'Preferred buy-in must be a whole dollar amount');
    }
  }
}