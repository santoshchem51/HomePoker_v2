/**
 * HomeScreen - Main landing page for PokePot
 * Replaces the home functionality from App.tsx with navigation
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../contexts/ThemeContext';
import { BrightnessOverlay } from '../components/common/BrightnessControl';
import { DarkPokerColors } from '../styles/darkTheme.styles';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useSessionStore } from '../stores/sessionStore';
import AnimatedButton from '../components/ui/AnimatedButton';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { isDarkMode, brightness } = useTheme();
  
  // Session store for active sessions
  const { activeSessions, activeSessionsLoading, actions } = useSessionStore();
  
  // Load active sessions when component mounts
  useEffect(() => {
    actions.loadActiveSessions();
  }, [actions]);

  const handleStartSession = () => {
    navigation.navigate('CreateSession');
  };

  const handleViewHistory = () => {
    navigation.navigate('SessionHistory');
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  const handleContinueSession = (sessionId: string, sessionName: string) => {
    navigation.navigate('LiveGame', { sessionId, sessionName });
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? DarkPokerColors.background : '#f5f5f5' }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      <View style={[styles.contentContainer, { backgroundColor: isDarkMode ? DarkPokerColors.background : '#f5f5f5' }]}>
        <Animated.Text 
          entering={FadeIn.duration(600)}
          style={[styles.title, { color: isDarkMode ? DarkPokerColors.goldChip : '#2196F3' }]}
        >
          🎰 PokePot
        </Animated.Text>
        <Animated.Text 
          entering={FadeIn.delay(300).duration(600)}
          style={[styles.subtitle, { color: isDarkMode ? DarkPokerColors.success : '#4CAF50' }]}
        >
          Professional poker session management
        </Animated.Text>

        {/* Active Sessions Section */}
        {activeSessions.length > 0 && (
          <Animated.View 
            style={styles.activeSessionsContainer}
            entering={FadeInDown.delay(100).springify()}
          >
            <Text style={[styles.activeSessionsTitle, { color: isDarkMode ? DarkPokerColors.goldChip : '#FF9800' }]}>
              🎮 Continue Active Session
            </Text>
            {activeSessions.map((session, index) => (
              <Animated.View
                key={session.id}
                entering={FadeInDown.delay(150 + index * 50).springify()}
              >
                <AnimatedButton 
                  style={[styles.activeSessionButton, { 
                    backgroundColor: isDarkMode ? DarkPokerColors.cardBackground : '#fff',
                    borderColor: isDarkMode ? DarkPokerColors.goldChip : '#FF9800'
                  }]}
                  onPress={() => handleContinueSession(session.id, session.name)}
                  hapticType="light"
                  scaleAmount={0.98}
                >
                  <View>
                    <Text style={[styles.activeSessionText, { 
                      color: isDarkMode ? DarkPokerColors.primaryText : '#333' 
                    }]}>
                      {session.name}
                    </Text>
                    <Text style={[styles.activeSessionStatus, { 
                      color: isDarkMode ? DarkPokerColors.goldChip : '#FF9800' 
                    }]}>
                      {session.status === 'active' ? '● Active' : '○ Created'}
                    </Text>
                  </View>
                </AnimatedButton>
              </Animated.View>
            ))}
          </Animated.View>
        )}
        
        <Animated.View 
          style={styles.buttonContainer}
          entering={FadeInDown.delay(200).springify()}
        >
          <AnimatedButton 
            style={[styles.primaryButton, { 
              backgroundColor: isDarkMode ? DarkPokerColors.buttonPrimary : '#2196F3' 
            }]}
            onPress={handleStartSession}
            hapticType="medium"
            scaleAmount={0.96}
          >
            <Text style={[styles.primaryButtonText, { 
              color: isDarkMode ? DarkPokerColors.background : '#fff' 
            }]}>
              Start New Session
            </Text>
          </AnimatedButton>

          <AnimatedButton 
            style={[styles.secondaryButton, { 
              borderColor: isDarkMode ? DarkPokerColors.buttonPrimary : '#2196F3' 
            }]}
            onPress={handleViewHistory}
            hapticType="light"
            scaleAmount={0.97}
          >
            <Text style={[styles.secondaryButtonText, { 
              color: isDarkMode ? DarkPokerColors.buttonPrimary : '#2196F3' 
            }]}>
              View Session History
            </Text>
          </AnimatedButton>

          <AnimatedButton 
            style={[styles.secondaryButton, { 
              borderColor: isDarkMode ? DarkPokerColors.secondaryText : '#666' 
            }]}
            onPress={handleSettings}
            hapticType="light"
            scaleAmount={0.97}
          >
            <Text style={[styles.secondaryButtonText, { 
              color: isDarkMode ? DarkPokerColors.secondaryText : '#666' 
            }]}>
              Settings
            </Text>
          </AnimatedButton>
        </Animated.View>
        
        <Text style={[styles.statusText, { color: isDarkMode ? DarkPokerColors.secondaryText : '#666' }]}>
          Voice commands, settlements & WhatsApp sharing ready!
        </Text>
        
        {/* Theme indicator */}
        <Text style={[styles.themeIndicator, { color: isDarkMode ? DarkPokerColors.selected : '#FFC107' }]}>
          🌙 Theme: {isDarkMode ? 'Dark (Poker Optimized)' : 'Light'} | 
          🔆 Brightness: {Math.round(brightness * 100)}%
        </Text>
      </View>
      
      <BrightnessOverlay brightness={brightness} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 40,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
    gap: 16,
  },
  primaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 32,
    fontStyle: 'italic',
  },
  themeIndicator: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
  },
  activeSessionsContainer: {
    width: '100%',
    maxWidth: 300,
    marginBottom: 24,
  },
  activeSessionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  activeSessionButton: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeSessionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  activeSessionStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
});