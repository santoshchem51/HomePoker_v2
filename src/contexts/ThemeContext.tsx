import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'auto' | 'dark' | 'light';
export type EffectiveTheme = 'dark' | 'light';

export interface ThemeContextValue {
  isDarkMode: boolean;
  currentTheme: ThemeMode;
  effectiveTheme: EffectiveTheme;
  brightness: number;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  setBrightness: (brightness: number) => void;
  isLoading: boolean;
}

const THEME_STORAGE_KEY = 'pokepot_theme_preference';
const BRIGHTNESS_STORAGE_KEY = 'pokepot_brightness_preference';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>('auto');
  const [brightness, setBrightnessState] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate effective theme based on user preference and system setting
  const effectiveTheme = useMemo((): EffectiveTheme => {
    if (currentTheme === 'auto') {
      return systemColorScheme === 'dark' ? 'dark' : 'light';
    }
    return currentTheme === 'dark' ? 'dark' : 'light';
  }, [currentTheme, systemColorScheme]);

  const isDarkMode = effectiveTheme === 'dark';

  // Load preferences from AsyncStorage on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const [savedTheme, savedBrightness] = await Promise.all([
          AsyncStorage.getItem(THEME_STORAGE_KEY),
          AsyncStorage.getItem(BRIGHTNESS_STORAGE_KEY)
        ]);

        if (savedTheme && ['auto', 'dark', 'light'].includes(savedTheme)) {
          setCurrentTheme(savedTheme as ThemeMode);
        }

        if (savedBrightness) {
          const parsedBrightness = parseFloat(savedBrightness);
          if (parsedBrightness >= 0.3 && parsedBrightness <= 1.0) {
            setBrightnessState(parsedBrightness);
          }
        }
      } catch (error) {
        console.warn('Failed to load theme preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, []);

  // Persist theme preference to AsyncStorage
  const setTheme = async (theme: ThemeMode) => {
    try {
      setCurrentTheme(theme);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  };

  // Persist brightness preference to AsyncStorage
  const setBrightness = async (newBrightness: number) => {
    const clampedBrightness = Math.max(0.3, Math.min(1.0, newBrightness));
    try {
      setBrightnessState(clampedBrightness);
      await AsyncStorage.setItem(BRIGHTNESS_STORAGE_KEY, clampedBrightness.toString());
    } catch (error) {
      console.warn('Failed to save brightness preference:', error);
    }
  };

  // Toggle between auto/dark/light modes
  const toggleTheme = () => {
    const themeOrder: ThemeMode[] = ['auto', 'dark', 'light'];
    const currentIndex = themeOrder.indexOf(currentTheme);
    const nextTheme = themeOrder[(currentIndex + 1) % themeOrder.length];
    setTheme(nextTheme);
  };

  const contextValue: ThemeContextValue = {
    isDarkMode,
    currentTheme,
    effectiveTheme,
    brightness,
    toggleTheme,
    setTheme,
    setBrightness,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Convenience hook for theme-aware styling
export const useThemedStyles = <T extends Record<string, any>>(
  lightStyles: T,
  darkStyles: T
): T => {
  const { isDarkMode } = useTheme();
  return isDarkMode ? darkStyles : lightStyles;
};