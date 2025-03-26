// navigation/TabNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import AccountBalanceScreen from '../screens/AccountBalanceScreen';

// Import types
import { TabParamList } from '../types';

// Define a type for the Ionicons name prop
type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

// Create typed tab navigator
const Tab = createBottomTabNavigator<TabParamList>();

const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          // Initialize with a valid icon name that exists in Ionicons
          let iconName: IoniconsName = 'help-circle';
          
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Balance') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3498db',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: styles.tabBar,
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen 
        name="Balance" 
        component={AccountBalanceScreen}
        options={{
          tabBarLabel: 'Balance',
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
  }
});

export default TabNavigator;