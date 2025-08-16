import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { SessionHistory } from '../../components/poker/SessionHistory';
import { useTheme } from '../../contexts/ThemeContext';
import { DarkPokerColors } from '../../styles/darkTheme.styles';

type SessionHistoryScreenNavigationProp = StackNavigationProp<RootStackParamList, 'SessionHistory'>;

export const SessionHistoryScreen: React.FC = () => {
  const navigation = useNavigation<SessionHistoryScreenNavigationProp>();
  const { isDarkMode } = useTheme();
  
  const handleSessionSelect = (sessionId: string) => {
    // Note: SessionDetails screen doesn't exist in current navigation
    // For now, log the selection - can be enhanced later
    console.log('Session selected:', sessionId);
  };

  const handleExportComplete = (sessionId: string, format: string) => {
    console.log(`Session ${sessionId} exported as ${format}`);
    // Could show a toast notification or update UI state
  };

  const containerStyle = [
    styles.container,
    { backgroundColor: isDarkMode ? DarkPokerColors.background : '#f5f5f5' }
  ];

  const headerStyle = [
    styles.header,
    { 
      backgroundColor: isDarkMode ? DarkPokerColors.surfaceBackground : 'white',
      borderBottomColor: isDarkMode ? DarkPokerColors.border : '#e0e0e0'
    }
  ];

  const titleStyle = [
    styles.title,
    { color: isDarkMode ? DarkPokerColors.primaryText : '#333' }
  ];

  const subtitleStyle = [
    styles.subtitle,
    { color: isDarkMode ? DarkPokerColors.secondaryText : '#666' }
  ];

  return (
    <SafeAreaView style={containerStyle}>
      <View style={headerStyle}>
        <Text style={titleStyle}>Session History</Text>
        <Text style={subtitleStyle}>
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