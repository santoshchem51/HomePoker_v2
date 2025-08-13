/**
 * Player Profile TypeScript type definitions for PokePot
 * Implements Story 2.5: Player Profile Management (Simplified/PO-Revised Version)
 * 
 * Simplified profile structure with only essential fields:
 * - name and preferredBuyIn for core profile data
 * - Basic timestamps for tracking
 * - Integration with existing Player interface via profileId field
 */

export interface PlayerProfile {
  id: string;
  name: string;
  preferredBuyIn: number;
  lastPlayedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProfileData {
  name: string;
  preferredBuyIn: number;
}

export interface CreateProfileRequest {
  name: string;
  preferredBuyIn: number;
}

export interface UpdateProfileRequest {
  name?: string;
  preferredBuyIn?: number;
}

export interface ProfileSearchResult {
  profile: PlayerProfile;
  isRecent: boolean;
}

/**
 * Validation rules for profile data
 */
export interface ProfileValidationRules {
  name: {
    minLength: number;
    maxLength: number;
    pattern?: RegExp;
  };
  preferredBuyIn: {
    min: number;
    max: number;
  };
}

export const PROFILE_VALIDATION_RULES: ProfileValidationRules = {
  name: {
    minLength: 1,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9\s\-_'.]+$/ // Allow alphanumeric, spaces, hyphens, underscores, apostrophes, periods
  },
  preferredBuyIn: {
    min: 1,
    max: 10000 // Reasonable max for home poker games
  }
};

/**
 * Profile-related error types
 */
export interface ProfileError {
  code: ProfileErrorCode;
  message: string;
  field?: string;
}

export enum ProfileErrorCode {
  INVALID_NAME = 'INVALID_NAME',
  INVALID_BUY_IN = 'INVALID_BUY_IN',
  DUPLICATE_NAME = 'DUPLICATE_NAME',
  PROFILE_NOT_FOUND = 'PROFILE_NOT_FOUND',
  STORAGE_ERROR = 'STORAGE_ERROR',
  VALIDATION_FAILED = 'VALIDATION_FAILED'
}

/**
 * Interface for player selection components
 */
export interface PlayerSelectionOption {
  type: 'profile' | 'guest';
  profile?: PlayerProfile;
  guestData?: { name: string };
  isRecent?: boolean;
}