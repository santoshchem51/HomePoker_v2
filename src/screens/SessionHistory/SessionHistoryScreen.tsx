import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { SessionHistory } from '../../components/poker/SessionHistory';

interface SessionHistoryScreenProps {
  navigation?: any;
}

export const SessionHistoryScreen: React.FC<SessionHistoryScreenProps> = ({ navigation }) => {
  const handleSessionSelect = (sessionId: string) => {
    // Navigate to session details or live game view
    if (navigation) {
      navigation.navigate('SessionDetails', { sessionId });
    }
  };

  const handleExportComplete = (sessionId: string, format: string) => {
    console.log(`Session ${sessionId} exported as ${format}`);
    // Could show a toast notification or update UI state
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Session History</Text>
        <Text style={styles.subtitle}>
          View and manage your completed poker sessions
        </Text>
      </View>
      
      <SessionHistory
        onSessionSelect={handleSessionSelect}
        onExportComplete={handleExportComplete}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});