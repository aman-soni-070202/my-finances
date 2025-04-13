// App.tsx
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet, Text, Platform, AppState, AppStateStatus } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './navigation/AppNavigator';

import { initializeDatabase, closeDatabase } from '@/storage/sqliteService';

import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import migrations from './drizzle/migrations';

// Import SMS and notification services
// import { startSmsMonitoring, stopSmsMonitoring, checkSmsMonitoringStatus } from '@/services/smsService';
// import { setupNotifications } from '@/services/notificationService';
// import { PERMISSIONS, requestMultiple, Permission } from 'react-native-permissions';

// Initialize the database connection once at the app level
const expo = SQLite.openDatabaseSync('db.db');
const db = drizzle(expo);

export default function App() {
  const { success, error } = useMigrations(db, migrations);
  const [isReady, setIsReady] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);
  const appState = React.useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);

  // Initialize SMS monitoring and notification handling
  // useEffect(() => {
  //   if (!isReady) return;

  //   const initializeSmsAndNotifications = async () => {
  //     try {
  //       // Setup notifications first
  //       // const phoneNumber = await SmsRetriever.requestPhoneNumber();
  //       await setupNotifications();
        
  //       // Request SMS permissions (Android only)
  //       if (Platform.OS === 'android') {
  //         const permissions: Permission[] = [
  //           PERMISSIONS.ANDROID.READ_SMS,
  //           PERMISSIONS.ANDROID.RECEIVE_SMS,
  //         ];
          
  //         const result = await requestMultiple(permissions);
  //         console.log('SMS Permissions:', result);
  //       }
        
  //       // Start SMS monitoring service
  //       await startSmsMonitoring();
  //       console.log('SMS monitoring service started');
  //     } catch (err) {
  //       console.error('Failed to initialize SMS monitoring:', err);
  //     }
  //   };

  //   initializeSmsAndNotifications();

  //   // Set up AppState listener to restart service when app comes to foreground
  //   const subscription = AppState.addEventListener('change', handleAppStateChange);

  //   return () => {
  //     subscription.remove();
  //     stopSmsMonitoring();
  //   };
  // }, [isReady]);

  // App state change handler
  // const handleAppStateChange = async (nextAppState: AppStateStatus) => {
  //   if (
  //     appState.current.match(/inactive|background/) &&
  //     nextAppState === 'active'
  //   ) {
  //     console.log('App has come to the foreground!');
  //     // Check if SMS monitoring is running and restart if needed
  //     const isRunning = await checkSmsMonitoringStatus();
  //     if (!isRunning) {
  //       console.log('Restarting SMS monitoring service');
  //       await startSmsMonitoring();
  //     }
  //   }

  //   appState.current = nextAppState;
  //   setAppStateVisible(appState.current);
  // };

  // Original database initialization
  useEffect(() => {
    // Initialize storage on first launch
    const prepareApp = async () => {
      try {
        console.log("Starting database initialization...");
        
        // Wait for migrations to complete
        if (error) {
          console.error('Migration error:', error);
          setCustomError(`Migration error: ${error.message}`);
          return;
        }
        
        if (!success) {
          console.log("Migrations in progress...");
          setIsMigrating(true);
          return;
        }
        
        initializeDatabase();

        console.log("Database initialized successfully");
        setIsMigrating(false);
        setIsReady(true);
      } catch (err) {
        console.error('Failed to initialize app:', err);
        setCustomError('Failed to initialize app. Please restart and try again.');
      }
    };

    prepareApp();

    // Return cleanup function to close database when app unmounts
    return () => {
      const cleanUp = async () => {
        try {
          console.log("Cleaning up and closing database connection");
          // await closeDatabase();
          
          expo.closeSync();
          
          // Also stop SMS monitoring
          // await stopSmsMonitoring();
        } catch (err) {
          console.error('Error during cleanup:', err);
        }
      };

      cleanUp();
    };
  }, [success, error]); // Add dependencies to re-run when migration status changes

  if (error || customError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorText}>{customError || error?.message}</Text>
        <Text style={styles.errorHelp}>Please restart the app and try again</Text>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        {isMigrating && (
          <View style={styles.migrationMessage}>
            <Text style={styles.migrationText}>
              Migrating your data... Please wait.
            </Text>
          </View>
        )}
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
  },
  migrationMessage: {
    marginTop: 20,
    padding: 10
  },
  migrationText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#555'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 10
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
    marginBottom: 20
  },
  errorHelp: {
    fontSize: 14,
    textAlign: 'center',
    color: '#7f8c8d'
  }
});