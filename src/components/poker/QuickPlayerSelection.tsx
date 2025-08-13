/**
 * QuickPlayerSelection - Interface for quick player selection during session setup
 * Implements Story 2.5: Player Profile Management (Simplified/PO-Revised Version)
 * 
 * Features:
 * - Shows recent 6 players first
 * - Simple name search capability
 * - Guest player option clearly separated
 * - Integration with existing PlayerSelectionGrid patterns
 * - Profile creation workflow integration
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ProfileService } from '../../services/core/ProfileService';
import { ProfileCreationForm } from './ProfileCreationForm';
import { 
  PlayerProfile, 
  ProfileSearchResult,
  PlayerSelectionOption
} from '../../types/profile';

export interface QuickPlayerSelectionProps {
  onPlayerSelect: (option: PlayerSelectionOption) => void;
  onCreateProfile?: () => void;
  sessionId: string;
  showGuestOption?: boolean;
  disabled?: boolean;
}

export const QuickPlayerSelection: React.FC<QuickPlayerSelectionProps> = React.memo(({
  onPlayerSelect,
  onCreateProfile,
  sessionId: _sessionId,
  showGuestOption = true,
  disabled = false
}) => {
  const [recentProfiles, setRecentProfiles] = useState<PlayerProfile[]>([]);
  const [searchResults, setSearchResults] = useState<ProfileSearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  const profileService = useMemo(() => ProfileService.getInstance(), []);

  /**
   * Load recent profiles on component mount
   * AC: 3 - Quick-select interface shows recent 6 players max
   */
  const loadRecentProfiles = useCallback(async () => {
    try {
      setLoading(true);
      const profiles = await profileService.getRecentProfiles(6);
      setRecentProfiles(profiles);
    } catch (error) {
      console.error('Failed to load recent profiles:', error);
      setRecentProfiles([]);
    } finally {
      setLoading(false);
    }
  }, [profileService]);

  useEffect(() => {
    loadRecentProfiles();
  }, [loadRecentProfiles]);

  /**
   * Handle search input with debouncing
   * AC: 6 - Simple profile search by name only
   */
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const results = await profileService.searchProfilesByName(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Profile search failed:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [profileService]);

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, handleSearch]);

  /**
   * Handle profile selection
   * AC: 3, 4 - Profile selection with profile data pre-fill
   */
  const handleProfileSelect = useCallback(async (profile: PlayerProfile) => {
    if (disabled) return;

    try {
      // Mark profile as recently used
      await profileService.markProfileAsUsed(profile.id);
      
      // Call the selection handler
      onPlayerSelect({
        type: 'profile',
        profile,
        isRecent: recentProfiles.some(p => p.id === profile.id)
      });
    } catch (error) {
      console.error('Failed to mark profile as used:', error);
      Alert.alert(
        'Warning',
        'Profile selected but failed to update recent players list.',
        [{ text: 'OK' }]
      );
      
      // Still proceed with selection
      onPlayerSelect({
        type: 'profile',
        profile,
        isRecent: recentProfiles.some(p => p.id === profile.id)
      });
    }
  }, [disabled, profileService, recentProfiles, onPlayerSelect]);

  /**
   * Handle guest player selection
   * AC: 5 - Guest player option for one-time participants
   */
  const handleGuestSelect = useCallback(() => {
    if (disabled || !guestName.trim()) return;

    onPlayerSelect({
      type: 'guest',
      guestData: { name: guestName.trim() }
    });

    // Clear guest name after selection
    setGuestName('');
  }, [disabled, guestName, onPlayerSelect]);

  /**
   * Handle profile creation completion
   */
  const handleProfileCreated = useCallback((profileId: string, _profileName: string) => {
    setShowProfileForm(false);
    
    // Reload recent profiles to show the new one
    loadRecentProfiles();
    
    // Automatically select the newly created profile
    profileService.getProfile(profileId).then(profile => {
      if (profile) {
        handleProfileSelect(profile);
      }
    });
  }, [loadRecentProfiles, profileService, handleProfileSelect]);

  /**
   * Get player initials for avatar
   */
  const getPlayerInitials = useCallback((name: string): string => {
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }, []);

  /**
   * Render profile card
   */
  const renderProfileCard = useCallback((profile: PlayerProfile, isRecent: boolean = false) => {
    const initials = getPlayerInitials(profile.name);
    
    return (
      <TouchableOpacity
        key={profile.id}
        style={[
          styles.profileCard,
          isRecent && styles.profileCardRecent
        ]}
        onPress={() => handleProfileSelect(profile)}
        disabled={disabled}
        activeOpacity={0.8}
        testID={`profile-${profile.id}`}
      >
        <View style={styles.profileAvatar}>
          <Text style={styles.profileInitials}>{initials}</Text>
        </View>
        
        <View style={styles.profileInfo}>
          <Text style={styles.profileName} numberOfLines={1}>
            {profile.name}
          </Text>
          <Text style={styles.profileBuyIn}>
            ${profile.preferredBuyIn}
          </Text>
          {isRecent && (
            <Text style={styles.recentLabel}>Recent</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }, [disabled, getPlayerInitials, handleProfileSelect]);

  if (showProfileForm) {
    return (
      <ProfileCreationForm
        onProfileCreated={handleProfileCreated}
        onCancel={() => setShowProfileForm(false)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Player</Text>
      <Text style={styles.subtitle}>Choose a saved profile or add a guest</Text>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search saved players..."
          editable={!disabled}
          testID="profile-search-input"
        />
        {searching && (
          <ActivityIndicator 
            size="small" 
            color="#2196F3" 
            style={styles.searchSpinner}
          />
        )}
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Search Results */}
        {searchQuery.trim() && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Search Results {searching && '(searching...)'}
            </Text>
            {searchResults.length === 0 && !searching && (
              <Text style={styles.noResultsText}>
                No profiles found matching "{searchQuery}"
              </Text>
            )}
            {searchResults.map(result => 
              renderProfileCard(result.profile, result.isRecent)
            )}
          </View>
        )}

        {/* Recent Players (only show when not searching) */}
        {!searchQuery.trim() && (
          <>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2196F3" />
                <Text style={styles.loadingText}>Loading recent players...</Text>
              </View>
            ) : (
              <>
                {recentProfiles.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recent Players</Text>
                    {recentProfiles.map(profile => 
                      renderProfileCard(profile, true)
                    )}
                  </View>
                )}

                {/* Guest Player Section */}
                {showGuestOption && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Guest Player</Text>
                    <View style={styles.guestContainer}>
                      <TextInput
                        style={styles.guestInput}
                        value={guestName}
                        onChangeText={setGuestName}
                        placeholder="Enter guest player name"
                        editable={!disabled}
                        maxLength={50}
                        testID="guest-name-input"
                      />
                      <TouchableOpacity
                        style={[
                          styles.guestButton,
                          !guestName.trim() || disabled ? styles.guestButtonDisabled : null
                        ]}
                        onPress={handleGuestSelect}
                        disabled={!guestName.trim() || disabled}
                        testID="add-guest-button"
                      >
                        <Text style={styles.guestButtonText}>
                          Add Guest
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Create New Profile Section */}
                <View style={styles.section}>
                  <TouchableOpacity
                    style={[
                      styles.createProfileButton,
                      disabled ? styles.createProfileButtonDisabled : null
                    ]}
                    onPress={() => {
                      if (onCreateProfile) {
                        onCreateProfile();
                      } else {
                        setShowProfileForm(true);
                      }
                    }}
                    disabled={disabled}
                    testID="create-profile-button"
                  >
                    <Text style={styles.createProfileButtonText}>
                      + Create New Profile
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 16,
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
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#BDC3C7',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#2C3E50',
  },
  searchSpinner: {
    marginLeft: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#34495E',
    marginBottom: 12,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#ECF0F1',
  },
  profileCardRecent: {
    borderColor: '#2196F3',
    borderWidth: 2,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3498DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInitials: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  profileBuyIn: {
    fontSize: 14,
    color: '#27AE60',
    fontWeight: '500',
  },
  recentLabel: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '500',
    marginTop: 2,
  },
  guestContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  guestInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#BDC3C7',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#2C3E50',
  },
  guestButton: {
    backgroundColor: '#95A5A6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 100,
  },
  guestButtonDisabled: {
    backgroundColor: '#BDC3C7',
  },
  guestButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  createProfileButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createProfileButtonDisabled: {
    backgroundColor: '#BDC3C7',
  },
  createProfileButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    color: '#7F8C8D',
    fontSize: 16,
    marginTop: 16,
  },
  noResultsText: {
    color: '#7F8C8D',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
});