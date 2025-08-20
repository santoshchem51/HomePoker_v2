/**
 * AppNavigator - Main navigation structure for PokePot
 * Connects all implemented screens with React Navigation
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from '../contexts/ThemeContext';
import { DarkPokerColors } from '../styles/darkTheme.styles';

// Screens
import HomeScreen from '../screens/HomeScreen';
import { CreateSessionScreen } from '../screens/SessionSetup/CreateSessionScreen';
import { LiveGameScreen } from '../screens/LiveGame/LiveGameScreen';
import { SettlementScreen } from '../screens/Settlement/SettlementScreen';
import { SessionHistoryScreen } from '../screens/SessionHistory/SessionHistoryScreen';
import { SettingsScreen } from '../components/screens/SettingsScreen';

export type RootStackParamList = {
  Home: undefined;
  CreateSession: undefined;
  LiveGame: {
    sessionId: string;
    sessionName: string;
  };
  Settlement: {
    sessionId: string;
    sessionName: string;
    isSessionEnd?: boolean;
    fromScreen?: 'LiveGame' | 'SessionHistory';
  };
  SessionHistory: undefined;
  Settings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { isDarkMode } = useTheme();

  const screenOptions = {
    headerStyle: {
      backgroundColor: isDarkMode ? DarkPokerColors.background : '#f5f5f5',
    },
    headerTintColor: isDarkMode ? DarkPokerColors.primaryText : '#333',
    headerTitleStyle: {
      fontWeight: 'bold' as const,
      color: isDarkMode ? DarkPokerColors.primaryText : '#333',
    },
    cardStyle: {
      backgroundColor: isDarkMode ? DarkPokerColors.background : '#f5f5f5',
    },
  };

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={screenOptions}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ 
            title: 'PokePot',
            headerShown: false // Home screen has its own header design
          }}
        />
        <Stack.Screen 
          name="CreateSession" 
          component={CreateSessionScreen}
          options={{ 
            title: 'Create Session',
            headerBackTitle: 'Home'
          }}
        />
        <Stack.Screen 
          name="LiveGame" 
          component={LiveGameScreen}
          options={({ route }) => ({ 
            title: route.params?.sessionName || 'Live Game',
            headerBackTitle: 'Session',
            gestureEnabled: false,       // Disable swipe back gestures
            headerLeft: () => null,      // Remove back button from header
          })}
        />
        <Stack.Screen 
          name="Settlement" 
          component={SettlementScreen}
          options={({ route }) => ({ 
            title: `${route.params?.sessionName || 'Session'} Settlement`,
            headerBackTitle: 'Game',
            gestureEnabled: false,       // Disable swipe back gestures
            headerLeft: () => null,      // Remove back button from header (all cases)
          })}
        />
        <Stack.Screen 
          name="SessionHistory" 
          component={SessionHistoryScreen}
          options={{ 
            title: 'Session History',
            headerBackTitle: 'Home'
          }}
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen}
          options={{ 
            title: 'Settings',
            headerBackTitle: 'Home',
            headerStyle: {
              backgroundColor: isDarkMode ? DarkPokerColors.background : '#f5f5f5',
            },
            headerTintColor: isDarkMode ? DarkPokerColors.primaryText : '#333',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}