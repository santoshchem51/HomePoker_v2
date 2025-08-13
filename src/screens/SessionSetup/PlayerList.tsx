/**
 * PlayerList - Component for displaying and managing players in a session
 * Handles adding/removing players with validation and UI feedback
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Player } from '../../types/player';
import { PlayerCard } from './PlayerCard';

export interface PlayerListProps {
  players: Player[];
  onAddPlayer: (playerName: string) => Promise<void>;
  onRemovePlayer: (playerId: string) => Promise<void>;
  loading: boolean;
  maxPlayers: number;
  minPlayers: number;
}

export const PlayerList: React.FC<PlayerListProps> = ({
  players,
  onAddPlayer,
  onRemovePlayer,
  loading,
  maxPlayers,
  minPlayers
}) => {
  const [newPlayerName, setNewPlayerName] = useState('');
  const [addingPlayer, setAddingPlayer] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Validate player name input
   * AC: 2 - Player name validation
   */
  const validatePlayerName = (name: string): string | null => {
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      return 'Player name is required';
    }
    
    if (trimmedName.length > 50) {
      return 'Player name must be 50 characters or less';
    }

    // Check for duplicate names (case insensitive)
    const isDuplicate = players.some(
      player => player.name.toLowerCase() === trimmedName.toLowerCase()
    );
    
    if (isDuplicate) {
      return 'A player with this name already exists';
    }

    return null;
  };

  /**
   * Handle adding a new player
   * AC: 2, 3
   */
  const handleAddPlayer = async () => {
    const validationError = validatePlayerName(newPlayerName);
    if (validationError) {
      setError(validationError);
      Alert.alert('Invalid Input', validationError);
      return;
    }

    if (players.length >= maxPlayers) {
      const errorMsg = `Cannot add more than ${maxPlayers} players`;
      setError(errorMsg);
      Alert.alert('Maximum Players Reached', errorMsg);
      return;
    }

    setAddingPlayer(true);
    setError(null);

    try {
      await onAddPlayer(newPlayerName.trim());
      setNewPlayerName('');
    } catch (err) {
      // Error handling is done in parent component
    } finally {
      setAddingPlayer(false);
    }
  };

  /**
   * Handle removing a player
   * AC: 3
   */
  const handleRemovePlayer = async (playerId: string) => {
    try {
      await onRemovePlayer(playerId);
    } catch (err) {
      // Error handling is done in parent component
    }
  };

  /**
   * Clear error when user starts typing
   */
  const clearError = () => {
    if (error) {
      setError(null);
    }
  };

  /**
   * Check if we can add more players
   */
  const canAddPlayer = players.length < maxPlayers && !loading && !addingPlayer;

  return (
    <View style={styles.container}>
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

      {/* Add Player Input */}
      <View style={styles.addPlayerContainer}>
        <TextInput
          style={[
            styles.addPlayerInput,
            error ? styles.addPlayerInputError : null
          ]}
          value={newPlayerName}
          onChangeText={(text) => {
            setNewPlayerName(text);
            clearError();
          }}
          placeholder="Enter player name"
          maxLength={50}
          editable={canAddPlayer}
          testID="add-player-input"
        />
        <TouchableOpacity
          style={[
            styles.addPlayerButton,
            canAddPlayer ? styles.addPlayerButtonEnabled : styles.addPlayerButtonDisabled
          ]}
          onPress={handleAddPlayer}
          disabled={!canAddPlayer}
          testID="add-player-button"
        >
          {addingPlayer ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={[
              styles.addPlayerButtonText,
              canAddPlayer ? styles.addPlayerButtonTextEnabled : styles.addPlayerButtonTextDisabled
            ]}>
              Add
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {/* Player List */}
      {players.length > 0 ? (
        <FlatList
          data={players}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PlayerCard
              player={item}
              onRemove={() => handleRemovePlayer(item.id)}
              canRemove={!loading}
            />
          )}
          style={styles.playerList}
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
          • Players will be guests by default
        </Text>
        <Text style={styles.helpText}>
          • Names must be unique within the session
        </Text>
        <Text style={styles.helpText}>
          • Players can be removed until the game starts
        </Text>
      </View>
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
  addPlayerContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  addPlayerInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  addPlayerInputError: {
    borderColor: '#ff4444',
    backgroundColor: '#ffe6e6',
  },
  addPlayerButton: {
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 88, // Large touch target for accessibility
    minWidth: 88,
  },
  addPlayerButtonEnabled: {
    backgroundColor: '#4CAF50',
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
  errorText: {
    color: '#cc0000',
    fontSize: 12,
    marginBottom: 8,
  },
  playerList: {
    maxHeight: 300,
    marginVertical: 8,
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
});