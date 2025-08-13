import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { CommandResult } from '../../types/voice';

interface VoiceBuyInConfirmationDialogProps {
  visible: boolean;
  parsedCommand: CommandResult | null;
  onConfirm: (playerId: string, playerName: string, amount: number) => void;
  onCancel: () => void;
}

export const VoiceBuyInConfirmationDialog: React.FC<VoiceBuyInConfirmationDialogProps> = ({
  visible,
  parsedCommand,
  onConfirm,
  onCancel,
}) => {
  const [editedPlayerName, setEditedPlayerName] = useState('');
  const [editedAmount, setEditedAmount] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  React.useEffect(() => {
    if (parsedCommand) {
      setEditedPlayerName(parsedCommand.playerMatch.playerName || '');
      setEditedAmount(parsedCommand.amountParse.amount?.toString() || '');
      setIsEditing(false);
    }
  }, [parsedCommand]);

  const handleConfirm = () => {
    if (!parsedCommand) return;

    const playerId = parsedCommand.playerMatch.playerId || '';
    const playerName = isEditing ? editedPlayerName : (parsedCommand.playerMatch.playerName || '');
    const amount = isEditing ? parseFloat(editedAmount) : (parsedCommand.amountParse.amount || 0);

    if (!playerName || !amount || amount <= 0) {
      Alert.alert('Invalid Input', 'Please provide a valid player name and amount.');
      return;
    }

    onConfirm(playerId, playerName, amount);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const getConfidenceIndicator = () => {
    if (!parsedCommand) return null;

    const confidence = parsedCommand.overallConfidence;
    if (confidence >= 0.7) {
      return (
        <View style={styles.confidenceHigh}>
          <Text style={styles.confidenceText}>High Confidence</Text>
        </View>
      );
    } else {
      return (
        <View style={styles.confidenceLow}>
          <Text style={styles.confidenceText}>Voice recognition uncertain</Text>
        </View>
      );
    }
  };

  const renderSimilarMatches = () => {
    if (!parsedCommand?.playerMatch.similarMatches?.length) return null;

    return (
      <View style={styles.similarMatchesContainer}>
        <Text style={styles.similarMatchesTitle}>Similar players:</Text>
        {parsedCommand.playerMatch.similarMatches.slice(0, 3).map((match, index) => (
          <TouchableOpacity
            key={index}
            style={styles.similarMatchItem}
            onPress={() => {
              setEditedPlayerName(match.playerName);
              setIsEditing(true);
            }}
          >
            <Text style={styles.similarMatchText}>{match.playerName}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (!visible || !parsedCommand) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.title}>Confirm Buy-in</Text>
          
          {getConfidenceIndicator()}

          <View style={styles.content}>
            <Text style={styles.label}>Player:</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={editedPlayerName}
                onChangeText={setEditedPlayerName}
                placeholder="Player name"
                autoCapitalize="words"
              />
            ) : (
              <Text style={styles.value}>
                {parsedCommand.playerMatch.playerName || 'Unknown'}
              </Text>
            )}

            <Text style={styles.label}>Amount:</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={editedAmount}
                onChangeText={setEditedAmount}
                placeholder="Amount"
                keyboardType="numeric"
              />
            ) : (
              <Text style={styles.value}>
                ${parsedCommand.amountParse.amount || 0}
              </Text>
            )}

            {!isEditing && renderSimilarMatches()}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            {!isEditing && (
              <TouchableOpacity
                style={[styles.button, styles.editButton]}
                onPress={handleEdit}
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialog: {
    backgroundColor: '#1E1E1E', // Dark poker theme
    borderRadius: 12,
    padding: 24,
    margin: 20,
    maxWidth: 400,
    width: '90%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  confidenceHigh: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'center',
    marginBottom: 16,
  },
  confidenceLow: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'center',
    marginBottom: 16,
  },
  confidenceText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50', // Green accent
    marginBottom: 8,
  },
  value: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#2E2E2E',
    borderRadius: 8,
  },
  input: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#2E2E2E',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  similarMatchesContainer: {
    marginTop: 8,
  },
  similarMatchesTitle: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 8,
  },
  similarMatchItem: {
    backgroundColor: '#3E3E3E',
    padding: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  similarMatchText: {
    color: '#4CAF50',
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#757575',
  },
  editButton: {
    backgroundColor: '#FF9800',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});