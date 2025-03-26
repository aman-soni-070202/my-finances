// screens/AccountBalanceScreen.tsx
import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import { NavigationParamList, TabParamList } from '@/types';
import AccountBalanceContent from '../components/AccountBalanceContent';

type AccountBalanceScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Balance'>,
  StackNavigationProp<NavigationParamList>
>;

type AccountBalanceScreenProps = {
  navigation: AccountBalanceScreenNavigationProp;
};

const AccountBalanceScreen: React.FC<AccountBalanceScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AccountBalanceContent navigation={navigation} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});

export default AccountBalanceScreen;