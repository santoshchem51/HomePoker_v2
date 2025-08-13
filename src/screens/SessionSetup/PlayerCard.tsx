/**
 * PlayerCard - Individual player display card with remove functionality
 * Displays player information with accessible touch targets
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import { Player } from '../../types/player';

export interface PlayerCardProps {
  player: Player;
  onRemove: () => void;
  canRemove: boolean;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  onRemove,
  canRemove
}) => {
  
  /**
   * Handle remove button press with confirmation
   * AC: 3
   */
  const handleRemovePress = () => {
    Alert.alert(
      'Remove Player',
      `Remove ${player.name} from the session?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: onRemove 
        }
      ]
    );
  };

  /**
   * Format join time for display
   */
  const formatJoinTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else {
      const diffHours = Math.floor(diffMins / 60);
      return `${diffHours}h ago`;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.playerInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {player.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        
        <View style={styles.details}>
          <Text style={styles.playerName}>{player.name}</Text>
          <View style={styles.metaInfo}>
            <Text style={styles.guestBadge}>
              {player.isGuest ? 'Guest' : 'Regular'}
            </Text>
            <Text style={styles.joinTime}>
              • Joined {formatJoinTime(player.joinedAt)}
            </Text>
          </View>
          <Text style={styles.status}>
            Status: {player.status === 'active' ? 'Active' : 'Cashed Out'}
          </Text>
        </View>
      </View>

      {canRemove && (
        <TouchableOpacity
          style={styles.removeButton}
          onPress={handleRemovePress}
          testID={`remove-player-${player.id}`}
        >
          <Text style={styles.removeButtonText}>×</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  playerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  details: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  guestBadge: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#e9ecef',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  joinTime: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  status: {
    fontSize: 12,
    color: '#666',
  },
  removeButton: {
    width: 88, // Large touch target for accessibility
    height: 88,
    borderRadius: 44,
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  removeButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});