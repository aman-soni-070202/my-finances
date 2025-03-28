// App.tsx
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './navigation/AppNavigator';

// Note: You may not need these if you're fully switching to Drizzle
import { initializeDatabase, closeDatabase } from '@/storage/sqliteService';
// import { migrateDataToSQLite, isMigrationNeeded } from './utils/migrations';

import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import migrations from './drizzle/migrations';

// Initialize the database connection once at the app level
const expo = SQLite.openDatabaseSync('db.db');
const db = drizzle(expo);

export default function App() {
  const { success, error } = useMigrations(db, migrations);
  const [isReady, setIsReady] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);

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
          // Only call closeDatabase if you're using your custom service
          // await closeDatabase();
          
          // For Drizzle, you may want to close the connection like this:
          expo.closeSync();
        } catch (err) {
          console.error('Error during cleanup:', err);
        }
      };

      cleanUp();
    };
  }, [success, error]); // Add dependencies to re-run when migration status changes

  // If there's an error, show error screen
  if (error || customError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorText}>{customError || error?.message}</Text>
        <Text style={styles.errorHelp}>Please restart the app and try again</Text>
      </View>
    );
  }

  // Show loading screen while initializing
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