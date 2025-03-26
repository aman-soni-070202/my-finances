// screens/SettingsScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  Share,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { exportData, importData } from '../storage/storageService';
import { NavigationParamList } from '../types';
import { SafeAreaView } from 'react-native-safe-area-context';

type SettingsScreenProps = {
  navigation: StackNavigationProp<NavigationParamList, 'Settings'>;
};

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const toggleDarkMode = () => {
    // Dark mode functionality would be implemented in a real app
    setIsDarkMode(previous => !previous);
    Alert.alert('Coming Soon', 'Dark mode will be available in the next update!');
  };

  const toggleNotifications = () => {
    // Notification functionality would be implemented in a real app
    setIsNotificationsEnabled(previous => !previous);
    Alert.alert('Coming Soon', 'Notifications will be available in the next update!');
  };

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      const data = await exportData();
      setIsExporting(false);

      if (data) {
        await Share.share({
          message: data,
          title: 'Finance Tracker Data Export'
        });
      } else {
        Alert.alert('Error', 'Failed to export data');
      }
    } catch (error) {
      setIsExporting(false);
      Alert.alert('Error', 'Failed to share exported data');
      console.error(error);
    }
  };

  const handleImportData = async () => {
    // In a real app, this would use a document picker
    // For simplicity, we'll just show a mock alert
    Alert.alert(
      'Import Data',
      'This feature would allow you to select a backup file from your device. For this demo, it\'s not fully implemented.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'OK',
          onPress: () => {
            Alert.alert('Coming Soon', 'Full import functionality will be available in the next update!');
          }
        }
      ]
    );
  };

  const handleClearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to delete all your financial data? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('Success', 'All data has been cleared. The app will restart.');
              // In a real app, you would reset the navigation stack or restart the app
              navigation.navigate('Home');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
              console.error(error);
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bank Accounts</Text>
            <TouchableOpacity
              style={styles.navigationRow}
              onPress={() => navigation.navigate('BankAccounts')}
            >
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Manage Bank Accounts</Text>
                <Text style={styles.settingDescription}>View, add or remove your connected accounts</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Credit Cards</Text>
            <TouchableOpacity
              style={styles.navigationRow}
              onPress={() => navigation.navigate('CreditCards')}
            >
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Manage Credit Cards</Text>
                <Text style={styles.settingDescription}>View, add or remove your connected credit cards</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Appearance</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Dark Mode</Text>
                <Text style={styles.settingDescription}>Enable dark theme</Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={toggleDarkMode}
                trackColor={{ false: '#ddd', true: '#81b0ff' }}
                thumbColor={isDarkMode ? '#3498db' : '#f4f3f4'}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Enable Notifications</Text>
                <Text style={styles.settingDescription}>Get reminders and alerts</Text>
              </View>
              <Switch
                value={isNotificationsEnabled}
                onValueChange={toggleNotifications}
                trackColor={{ false: '#ddd', true: '#81b0ff' }}
                thumbColor={isNotificationsEnabled ? '#3498db' : '#f4f3f4'}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Management</Text>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleExportData}
              disabled={isExporting}
            >
              {isExporting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="download-outline" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Export Data</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleImportData}
              disabled={isImporting}
            >
              {isImporting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Import Data</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.dangerButton]}
              onPress={handleClearAllData}
            >
              <Ionicons name="trash-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Clear All Data</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Version</Text>
              <Text style={styles.infoValue}>1.0.0</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Made with</Text>
              <Text style={styles.infoValue}>React Native & Expo</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    padding: 20,
  },
  navigationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: '#999',
  },
  actionButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  dangerButton: {
    backgroundColor: '#e74c3c',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
  },
});

export default SettingsScreen;