import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { Theme, themes, ThemeType } from '../constants/Themes';

interface ThemeContextType {
  theme: Theme;
  themeType: ThemeType;
  setTheme: (themeType: ThemeType) => void;
  toggleTheme: () => void;
  isDark: boolean;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@trading_app_theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeType, setThemeType] = useState<ThemeType>('light');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSavedTheme();
  }, []);

  const loadSavedTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && savedTheme in themes) {
        setThemeType(savedTheme as ThemeType);
      } else {
        // Use system preference if no saved theme
        const defaultTheme = systemColorScheme === 'dark' ? 'dark' : 'light';
        setThemeType(defaultTheme);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
      // Fallback to system preference
      const defaultTheme = systemColorScheme === 'dark' ? 'dark' : 'light';
      setThemeType(defaultTheme);
    } finally {
      setIsLoading(false);
    }
  };

  const setTheme = async (newThemeType: ThemeType) => {
    try {
      setThemeType(newThemeType);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newThemeType);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const toggleTheme = () => {
    const newTheme = themeType === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const theme = themes[themeType];
  const isDark = themeType === 'dark' || themeType === 'cyberpunk';

  return (
    <ThemeContext.Provider value={{
      theme,
      themeType,
      setTheme,
      toggleTheme,
      isDark,
      isLoading,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
