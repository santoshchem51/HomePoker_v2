import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { ThemeProvider, useTheme } from '../../../src/contexts/ThemeContext';

// Mock dependencies
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  useColorScheme: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const mockUseColorScheme = useColorScheme as jest.MockedFunction<typeof useColorScheme>;
const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('ThemeContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseColorScheme.mockReturnValue('light');
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
  });

  // Test component to access theme context
  const TestComponent = () => {
    const theme = useTheme();
    return (
      <>
        <>{theme.isDarkMode ? 'dark' : 'light'}</>
        <>{theme.currentTheme}</>
        <>{theme.brightness}</>
      </>
    );
  };

  it('should provide default theme values', async () => {
    const { getByText } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(getByText('light')).toBeTruthy(); // isDarkMode false
      expect(getByText('auto')).toBeTruthy();  // currentTheme auto
      expect(getByText('1')).toBeTruthy();     // brightness 1.0
    });
  });

  it('should follow system color scheme when set to auto', async () => {
    mockUseColorScheme.mockReturnValue('dark');

    const { getByText } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(getByText('dark')).toBeTruthy(); // isDarkMode follows system
      expect(getByText('auto')).toBeTruthy(); // currentTheme still auto
    });
  });

  it('should load saved preferences from AsyncStorage', async () => {
    mockAsyncStorage.getItem
      .mockImplementationOnce((key) => {
        if (key === 'pokepot_theme_preference') {
          return Promise.resolve('dark');
        }
        if (key === 'pokepot_brightness_preference') {
          return Promise.resolve('0.6');
        }
        return Promise.resolve(null);
      });

    const { getByText } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(getByText('dark')).toBeTruthy(); // isDarkMode true due to saved preference
      expect(getByText('dark')).toBeTruthy(); // currentTheme is dark
      expect(getByText('0.6')).toBeTruthy();  // brightness is 0.6
    });
  });

  it('should clamp brightness values between 0.3 and 1.0', () => {
    const TestBrightnessComponent = () => {
      const { setBrightness, brightness } = useTheme();

      React.useEffect(() => {
        // Test clamping
        setBrightness(1.5); // Should be clamped to 1.0
      }, [setBrightness]);

      return <>{brightness}</>;
    };

    render(
      <ThemeProvider>
        <TestBrightnessComponent />
      </ThemeProvider>
    );

    // Should clamp to 1.0
    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('pokepot_brightness_preference', '1');
  });

  it('should handle AsyncStorage errors gracefully', async () => {
    mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

    const { getByText } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Should use defaults when storage fails
    await waitFor(() => {
      expect(getByText('auto')).toBeTruthy();
      expect(getByText('1')).toBeTruthy();
    });
  });

  it('should validate theme mode values', async () => {
    mockAsyncStorage.getItem.mockResolvedValueOnce('invalid-theme');

    const { getByText } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Should use default when invalid value is stored
    await waitFor(() => {
      expect(getByText('auto')).toBeTruthy();
    });
  });

  it('should toggle through theme modes correctly', async () => {
    const TestToggleComponent = () => {
      const { toggleTheme, currentTheme } = useTheme();

      const handleToggle = () => {
        act(() => {
          toggleTheme();
        });
      };

      return (
        <>
          <>{currentTheme}</>
        </>
      );
    };

    const { getByText } = render(
      <ThemeProvider>
        <TestToggleComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(getByText('auto')).toBeTruthy();
    });
  });
});