import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';

interface VoiceCommandHelpProps {
  visible: boolean;
  onClose: () => void;
}

export const VoiceCommandHelp: React.FC<VoiceCommandHelpProps> = ({
  visible,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Voice Commands Guide</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Buy-in Commands</Text>
              <Text style={styles.sectionDescription}>
                Add money to a player's balance using voice commands
              </Text>
              
              <View style={styles.commandGroup}>
                <Text style={styles.commandPattern}>Pattern: "Add [Player Name] [Amount]"</Text>
                
                <View style={styles.exampleContainer}>
                  <Text style={styles.exampleTitle}>Examples:</Text>
                  <Text style={styles.example}>• "Add John fifty dollars"</Text>
                  <Text style={styles.example}>• "Add Sarah 100"</Text>
                  <Text style={styles.example}>• "Add Mike twenty five"</Text>
                  <Text style={styles.example}>• "Give Alex fifty"</Text>
                  <Text style={styles.example}>• "Add Jennifer one hundred"</Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Supported Number Formats</Text>
              
              <View style={styles.formatGroup}>
                <Text style={styles.formatTitle}>Written Numbers:</Text>
                <Text style={styles.formatExample}>• "twenty" = $20</Text>
                <Text style={styles.formatExample}>• "fifty" = $50</Text>
                <Text style={styles.formatExample}>• "one hundred" = $100</Text>
                <Text style={styles.formatExample}>• "two hundred" = $200</Text>
              </View>

              <View style={styles.formatGroup}>
                <Text style={styles.formatTitle}>Digit Recognition:</Text>
                <Text style={styles.formatExample}>• "20" = $20</Text>
                <Text style={styles.formatExample}>• "50" = $50</Text>
                <Text style={styles.formatExample}>• "100" = $100</Text>
                <Text style={styles.formatExample}>• "500" = $500</Text>
              </View>

              <View style={styles.formatGroup}>
                <Text style={styles.formatTitle}>Combination Patterns:</Text>
                <Text style={styles.formatExample}>• "five zero" = $50</Text>
                <Text style={styles.formatExample}>• "one zero zero" = $100</Text>
                <Text style={styles.formatExample}>• "two five" = $25</Text>
              </View>

              <View style={styles.formatGroup}>
                <Text style={styles.formatTitle}>Common Poker Amounts:</Text>
                <Text style={styles.formatExample}>• Small stakes: $5, $10, $20</Text>
                <Text style={styles.formatExample}>• Medium stakes: $25, $50, $100</Text>
                <Text style={styles.formatExample}>• High stakes: $200, $500</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Player Name Matching</Text>
              <Text style={styles.tip}>
                • Use first names, full names, or nicknames
              </Text>
              <Text style={styles.tip}>
                • Voice recognition will match against current session players
              </Text>
              <Text style={styles.tip}>
                • Similar names will be suggested if recognition is uncertain
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Confidence & Confirmation</Text>
              <Text style={styles.tip}>
                • High confidence commands (70%+) process automatically
              </Text>
              <Text style={styles.tip}>
                • Low confidence commands show confirmation dialog
              </Text>
              <Text style={styles.tip}>
                • You can always edit player name or amount before confirming
              </Text>
              <Text style={styles.tip}>
                • Cancel anytime if the command was misunderstood
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tips for Best Results</Text>
              <Text style={styles.tip}>
                • Speak clearly and at normal pace
              </Text>
              <Text style={styles.tip}>
                • Use the exact name as shown in the player list
              </Text>
              <Text style={styles.tip}>
                • Keep background noise minimal
              </Text>
              <Text style={styles.tip}>
                • Try "add" or "give" as command words
              </Text>
              <Text style={styles.tip}>
                • Say dollar amounts without "dollars" (optional)
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Error Handling</Text>
              <Text style={styles.errorInfo}>
                If voice recognition fails or produces unexpected results:
              </Text>
              <Text style={styles.tip}>
                • Check that microphone permissions are granted
              </Text>
              <Text style={styles.tip}>
                • Ensure the session has active players
              </Text>
              <Text style={styles.tip}>
                • Try speaking more slowly and clearly
              </Text>
              <Text style={styles.tip}>
                • Use the manual input as backup
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Privacy & Security</Text>
              <Text style={styles.privacyInfo}>
                • Voice audio is processed locally on your device only
              </Text>
              <Text style={styles.privacyInfo}>
                • No audio recordings are stored or transmitted
              </Text>
              <Text style={styles.privacyInfo}>
                • Voice processing stops automatically after 500ms
              </Text>
              <Text style={styles.privacyInfo}>
                • All transactions require visual confirmation
              </Text>
            </View>
          </ScrollView>
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
  container: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    margin: 20,
    maxHeight: '90%',
    width: '90%',
    maxWidth: 500,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#CCCCCC',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  commandGroup: {
    backgroundColor: '#2E2E2E',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  commandPattern: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  exampleContainer: {
    marginTop: 8,
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 6,
  },
  example: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  formatGroup: {
    marginBottom: 16,
  },
  formatTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  formatExample: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 3,
    marginLeft: 8,
  },
  tip: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 6,
    lineHeight: 20,
  },
  errorInfo: {
    fontSize: 14,
    color: '#FF9800',
    marginBottom: 8,
    fontWeight: '500',
  },
  privacyInfo: {
    fontSize: 14,
    color: '#81C784',
    marginBottom: 6,
    lineHeight: 20,
  },
});