/**
 * EnhancedPlayerList - Component that integrates profile selection with player management
 * Implements Story 2.5: Player Profile Management (Simplified/PO-Revised Version)
 * 
 * Features:
 * - Integration of QuickPlayerSelection for profile-based player addition
 * - Clear distinction between guest and saved players in the UI
 * - Seamless flow from profile selection to session player management
 * - Backwards compatibility with existing PlayerList functionality
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Modal,
} from 'react-native';
import { Player } from '../../types/player';
import { PlayerSelectionOption } from '../../types/profile';
import { PlayerCard } from '../../screens/SessionSetup/PlayerCard';
import { QuickPlayerSelection } from './QuickPlayerSelection';
import { useProfileSelection } from '../../hooks/useProfileSelection';

export interface EnhancedPlayerListProps {
  sessionId: string;
  players: Player[];
  onPlayerAdded?: (player: Player) => void;
  onRemovePlayer: (playerId: string) => Promise<void>;
  loading: boolean;
  maxPlayers: number;
  minPlayers: number;
}

export const EnhancedPlayerList: React.FC<EnhancedPlayerListProps> = ({
  sessionId,
  players,
  onPlayerAdded,
  onRemovePlayer,
  loading,
  maxPlayers,
  minPlayers
}) => {
  const [showProfileSelection, setShowProfileSelection] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use profile selection hook
  const { loading: profileLoading, addPlayerFromSelection } = useProfileSelection({
    sessionId,
    onPlayerAdded,
    onError: setError
  });

  /**
   * Handle player selection from profile interface
   * AC: 4, 5 - Profile selection and guest player flows
   */
  const handlePlayerSelect = useCallback(async (selection: PlayerSelectionOption) => {
    try {
      const player = await addPlayerFromSelection(selection);
      if (player) {
        setShowProfileSelection(false);
        setError(null);
        
        // Show success message based on player type
        const playerType = selection.type === 'profile' ? 'profile' : 'guest';
        Alert.alert(
          'Player Added',
          `${player.name} has been added as a ${playerType} player.`,
          [{ text: 'OK' }]
        );
      }
    } catch (err) {
      // Error handling is done in the hook
      console.error('Failed to add player:', err);
    }
  }, [addPlayerFromSelection]);

  /**
   * Handle removing a player with confirmation
   * AC: 3
   */
  const handleRemovePlayer = useCallback(async (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    Alert.alert(
      'Remove Player',
      `Are you sure you want to remove ${player.name} from the session?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            try {
              await onRemovePlayer(playerId);
              setError(null);
            } catch (err) {
              console.error('Failed to remove player:', err);
            }
          }
        }
      ]
    );
  }, [players, onRemovePlayer]);

  /**
   * Group players by type for display
   */
  const groupedPlayers = React.useMemo(() => {
    const profilePlayers = players.filter(p => !p.isGuest && p.profileId);
    const guestPlayers = players.filter(p => p.isGuest);
    return { profilePlayers, guestPlayers };
  }, [players]);

  /**
   * Check if we can add more players
   */
  const canAddPlayer = players.length < maxPlayers && !loading && !profileLoading;

  /**
   * Render player section with type distinction
   */
  const renderPlayerSection = (title: string, sectionPlayers: Player[], sectionType: 'profile' | 'guest') => {
    if (sectionPlayers.length === 0) return null;

    return (
      <View style={styles.playerSection}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {sectionPlayers.map((player) => (
          <View key={player.id} style={styles.playerCardContainer}>
            <PlayerCard
              player={player}
              onRemove={() => handleRemovePlayer(player.id)}
              canRemove={!loading}
            />
            <View style={[
              styles.playerTypeIndicator,
              sectionType === 'profile' ? styles.profileIndicator : styles.guestIndicator
            ]}>
              <Text style={styles.playerTypeText}>
                {sectionType === 'profile' ? 'Profile' : 'Guest'}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with player count */}
      <View style={styles.header}>
        <Text style={styles.title}>Players</Text>
        <View style={styles.playerCount}>
          <Text style={[
            styles.playerCountText,
            players.length >= minPlayers ? styles.playerCountValid : styles.playerCountInvalid
          ]}>
            {players.length}/{maxPlayers}
          </Text>
          {players.length >= minPlayers && (
            <Text style={styles.minPlayersText}>✓ Ready to start</Text>
          )}
          {players.length < minPlayers && (
            <Text style={styles.minPlayersText}>
              Need {minPlayers - players.length} more players
            </Text>
          )}
        </View>
      </View>

      {/* Add Player Button */}
      <TouchableOpacity
        style={[
          styles.addPlayerButton,
          canAddPlayer ? styles.addPlayerButtonEnabled : styles.addPlayerButtonDisabled
        ]}
        onPress={() => setShowProfileSelection(true)}
        disabled={!canAddPlayer}
        testID="add-player-button"
      >
        <Text style={[
          styles.addPlayerButtonText,
          canAddPlayer ? styles.addPlayerButtonTextEnabled : styles.addPlayerButtonTextDisabled
        ]}>
          + Add Player
        </Text>
      </TouchableOpacity>

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            onPress={() => setError(null)}
            style={styles.errorDismiss}
          >
            <Text style={styles.errorDismissText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Player Lists */}
      {players.length > 0 ? (
        <FlatList
          style={styles.playerList}
          data={[1]} // Dummy data to render custom content
          renderItem={() => (
            <View>
              {renderPlayerSection(
                `Saved Players (${groupedPlayers.profilePlayers.length})`, 
                groupedPlayers.profilePlayers, 
                'profile'
              )}
              {renderPlayerSection(
                `Guest Players (${groupedPlayers.guestPlayers.length})`, 
                groupedPlayers.guestPlayers, 
                'guest'
              )}
            </View>
          )}
          keyExtractor={() => 'players'}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No players added yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Add {minPlayers}-{maxPlayers} players to start the game
          </Text>
        </View>
      )}

      {/* Help Text */}
      <View style={styles.helpContainer}>
        <Text style={styles.helpText}>
          • Use saved profiles for regular players
        </Text>
        <Text style={styles.helpText}>
          • Add guests for one-time participants
        </Text>
        <Text style={styles.helpText}>
          • Players can be removed until the game starts
        </Text>
      </View>

      {/* Profile Selection Modal */}
      <Modal
        visible={showProfileSelection}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowProfileSelection(false)}
      >
        <QuickPlayerSelection
          sessionId={sessionId}
          onPlayerSelect={handlePlayerSelect}
          showGuestOption={true}
          disabled={!canAddPlayer}
        />
        <View style={styles.modalCloseContainer}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowProfileSelection(false)}
            testID="close-profile-selection"
          >
            <Text style={styles.modalCloseButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  playerCount: {
    alignItems: 'flex-end',
  },
  playerCountText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  playerCountValid: {
    color: '#4CAF50',
  },
  playerCountInvalid: {
    color: '#FF9800',
  },
  minPlayersText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  addPlayerButton: {
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    minHeight: 48,
  },
  addPlayerButtonEnabled: {
    backgroundColor: '#2196F3',
  },
  addPlayerButtonDisabled: {
    backgroundColor: '#ccc',
  },
  addPlayerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  addPlayerButtonTextEnabled: {
    color: 'white',
  },
  addPlayerButtonTextDisabled: {
    color: '#888',
  },
  errorContainer: {
    flexDirection: 'row',
    backgroundColor: '#FDEDEC',
    borderColor: '#E74C3C',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  errorText: {
    flex: 1,
    color: '#E74C3C',
    fontSize: 14,
  },
  errorDismiss: {
    padding: 4,
  },
  errorDismissText: {
    color: '#E74C3C',
    fontSize: 16,
    fontWeight: 'bold',
  },
  playerList: {
    maxHeight: 400,
    marginVertical: 8,
  },
  playerSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34495E',
    marginBottom: 8,
  },
  playerCardContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  playerTypeIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  profileIndicator: {
    backgroundColor: '#E3F2FD',
  },
  guestIndicator: {
    backgroundColor: '#F3E5F5',
  },
  playerTypeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
  },
  helpContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  modalCloseContainer: {
    padding: 16,
    backgroundColor: '#F8F9FA',
  },
  modalCloseButton: {
    backgroundColor: '#95A5A6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});