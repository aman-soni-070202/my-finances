// App.tsx
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// import { ThemeProvider } from './contexts/ThemeContext';
import AppNavigator from './navigation/AppNavigator';
// Storage initialization
import { initializeStorage } from './storage/storageService';

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialize storage on first launch
    const prepareApp = async () => {
      try {
        await initializeStorage();
        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };
    prepareApp();
  }, []);

  if (!isReady) {
    // Show loading screen while initializing
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff'
  }
});