// AppNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationParamList } from '../types';

// Screens
import AddTransactionScreen from '../screens/AddTransactionScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import TransactionDetailScreen from '../screens/TransactionDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';
import StatisticsScreen from '../screens/StatisticsScreen';
import BankAccountsScreen from '../screens/BankAccountsScreen';
import CreditCardsScreen from '../screens/CreditCardsScreen';
import TabNavigator from './TabNavigator';
import StatementsScreen from '@/screens/StatementScreen';

const Stack = createNativeStackNavigator<NavigationParamList>();

const AppNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false
      }}
    >
      <Stack.Screen name="TabHome" component={TabNavigator} />
      <Stack.Screen
        name="AddTransaction"
        component={AddTransactionScreen}
        options={{
          presentation: 'modal'
        }}
      />
      <Stack.Screen name="Transactions" component={TransactionsScreen} />
      <Stack.Screen
        name="TransactionDetail"
        component={TransactionDetailScreen}
      />
      <Stack.Screen
        name="AccountStatement"
        component={StatementsScreen}
        options={({ route }) => ({
          headerShown: true,
        })} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Statistics" component={StatisticsScreen} />
      <Stack.Screen name="BankAccounts" component={BankAccountsScreen} />
      <Stack.Screen name="CreditCards" component={CreditCardsScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;