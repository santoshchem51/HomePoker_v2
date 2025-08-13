/**
 * CreateSessionScreen - Main session creation screen for Story 1.2
 * Handles session creation and player management before game starts
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SessionForm } from './SessionForm';
import { PlayerList } from './PlayerList';
import { SessionService } from '../../services/core/SessionService';
import { Session } from '../../types/session';
import { Player } from '../../types/player';
import { ServiceError } from '../../services/core/ServiceError';

export interface CreateSessionScreenProps {
  onSessionCreated?: (session: Session) => void;
  onStartGame?: (sessionId: string) => void;
}

export const CreateSessionScreen: React.FC<CreateSessionScreenProps> = ({
  onSessionCreated,
  onStartGame
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionService = SessionService.getInstance();

  /**
   * Handle session creation from the form
   * AC: 1
   */
  const handleCreateSession = async (sessionName: string, organizerId: string) => {
    setLoading(true);
    setError(null);

    try {
      const newSession = await sessionService.createSession({
        name: sessionName,
        organizerId: organizerId
      });

      setSession(newSession);
      onSessionCreated?.(newSession);
    } catch (err) {
      const errorMessage = err instanceof ServiceError 
        ? err.message 
        : 'Failed to create session. Please try again.';
      setError(errorMessage);
      
      // Show alert for user feedback
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle adding a player to the session
   * AC: 2, 3
   */
  const handleAddPlayer = async (playerName: string) => {
    if (!session) return;

    setLoading(true);
    setError(null);

    try {
      const newPlayer = await sessionService.addPlayer(session.id, {
        name: playerName,
        isGuest: true
      });

      setPlayers(prev => [...prev, newPlayer]);
      
      // Update session player count
      setSession(prev => prev ? { ...prev, playerCount: prev.playerCount + 1 } : null);
    } catch (err) {
      const errorMessage = err instanceof ServiceError 
        ? err.message 
        : 'Failed to add player. Please try again.';
      setError(errorMessage);
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle removing a player from the session
   * AC: 3
   */
  const handleRemovePlayer = async (playerId: string) => {
    if (!session) return;

    // Confirm removal
    Alert.alert(
      'Remove Player',
      'Are you sure you want to remove this player?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            setError(null);

            try {
              await sessionService.removePlayer(session.id, playerId);
              
              setPlayers(prev => prev.filter(p => p.id !== playerId));
              
              // Update session player count
              setSession(prev => prev ? { ...prev, playerCount: prev.playerCount - 1 } : null);
            } catch (err) {
              const errorMessage = err instanceof ServiceError 
                ? err.message 
                : 'Failed to remove player. Please try again.';
              setError(errorMessage);
              
              Alert.alert('Error', errorMessage);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  /**
   * Handle starting the game
   * AC: 6
   */
  const handleStartGame = async () => {
    if (!session || players.length < 4) return;

    Alert.alert(
      'Start Game',
      `Start poker game with ${players.length} players?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Game',
          onPress: async () => {
            setLoading(true);
            try {
              await sessionService.updateSessionStatus(session.id, 'active');
              onStartGame?.(session.id);
            } catch (err) {
              const errorMessage = err instanceof ServiceError 
                ? err.message 
                : 'Failed to start game. Please try again.';
              Alert.alert('Error', errorMessage);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  /**
   * Check if the game can be started (4+ players)
   * AC: 2
   */
  const canStartGame = session && players.length >= 4 && players.length <= 8 && !loading;

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Create New Session</Text>
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>

        {/* Session Creation Form */}
        {!session && (
          <SessionForm 
            onSubmit={handleCreateSession}
            loading={loading}
          />
        )}

        {/* Player Management */}
        {session && (
          <>
            <View style={styles.sessionInfo}>
              <Text style={styles.sessionName}>{session.name}</Text>
              <Text style={styles.sessionStatus}>
                Status: {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
              </Text>
            </View>

            <PlayerList
              players={players}
              onAddPlayer={handleAddPlayer}
              onRemovePlayer={handleRemovePlayer}
              loading={loading}
              maxPlayers={8}
              minPlayers={4}
            />

            {/* Start Game Button */}
            <TouchableOpacity
              style={[
                styles.startButton,
                canStartGame ? styles.startButtonEnabled : styles.startButtonDisabled
              ]}
              onPress={handleStartGame}
              disabled={!canStartGame}
              testID="start-game-button"
            >
              <Text style={[
                styles.startButtonText,
                canStartGame ? styles.startButtonTextEnabled : styles.startButtonTextDisabled
              ]}>
                {players.length < 4 
                  ? `Add ${4 - players.length} more players to start`
                  : `Start Game (${players.length} players)`
                }
              </Text>
            </TouchableOpacity>

            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                • Add 4-8 players to participate
              </Text>
              <Text style={styles.infoText}>
                • Players can be removed until the game starts
              </Text>
              <Text style={styles.infoText}>
                • All players are guests by default
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#ffe6e6',
    borderColor: '#ff4444',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  errorText: {
    color: '#cc0000',
    fontSize: 14,
    textAlign: 'center',
  },
  sessionInfo: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sessionName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sessionStatus: {
    fontSize: 14,
    color: '#666',
  },
  startButton: {
    borderRadius: 12,
    padding: 18,
    marginVertical: 20,
    minHeight: 88, // Large touch target for accessibility
  },
  startButtonEnabled: {
    backgroundColor: '#4CAF50',
  },
  startButtonDisabled: {
    backgroundColor: '#ccc',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  startButtonTextEnabled: {
    color: 'white',
  },
  startButtonTextDisabled: {
    color: '#888',
  },
  infoContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
});