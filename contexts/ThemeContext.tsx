// contexts/ThemeContext.tsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

// Define theme types
export type ThemeType = 'light' | 'dark' | 'system';

// Define theme colors
export interface ThemeColors {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
  income: string;
  expense: string;
  tabBar: string;
  statusBar: 'light' | 'dark';
}

// Theme definitions
export const themes: Record<'light' | 'dark', ThemeColors> = {
  light: {
    background: '#f5f5f5',
    card: '#ffffff',
    text: '#333333',
    textSecondary: '#666666',
    border: '#e0e0e0',
    primary: '#3498db',
    income: '#2ecc71',
    expense: '#e74c3c',
    tabBar: '#ffffff',
    statusBar: 'dark',
  },
  dark: {
    background: '#121212',
    card: '#1e1e1e',
    text: '#ffffff',
    textSecondary: '#aaaaaa',
    border: '#333333',
    primary: '#4facfe',
    income: '#4cd97b',
    expense: '#ff5252',
    tabBar: '#1e1e1e',
    statusBar: 'light',
  },
};

// Context interface
interface ThemeContextType {
  themeType: ThemeType;
  theme: ThemeColors;
  isDark: boolean;
  toggleTheme: (newTheme?: ThemeType) => void;
}

// Create context
const ThemeContext = createContext<ThemeContextType>({
  themeType: 'light',
  theme: themes.light,
  isDark: false,
  toggleTheme: () => {},
});

// Theme provider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeType, setThemeType] = useState<ThemeType>('system');
  const systemTheme = useColorScheme() || 'light';
  
  // Determine if dark mode is active
  const isDark = themeType === 'dark' || (themeType === 'system' && systemTheme === 'dark');
  
  // Get actual theme colors
  const theme = isDark ? themes.dark : themes.light;

  // Load saved theme preference
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        if (savedTheme) {
          setThemeType(savedTheme as ThemeType);
        }
      } catch (error) {
        console.error('Failed to load theme', error);
      }
    };
    
    loadTheme();
  }, []);

  // Toggle theme function
  const toggleTheme = async (newTheme?: ThemeType) => {
    const nextTheme = newTheme || (themeType === 'light' ? 'dark' : themeType === 'dark' ? 'system' : 'light');
    setThemeType(nextTheme);
    
    try {
      await AsyncStorage.setItem('theme', nextTheme);
    } catch (error) {
      console.error('Failed to save theme', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ themeType, theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook for using theme
export const useTheme = () => useContext(ThemeContext);