// screens/TransactionsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ListRenderItemInfo
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { getTransactions } from '../storage/storageService';
import TransactionItem from '../components/TransactionItems';
import { Transaction, NavigationParamList } from '../types';
import { SafeAreaView } from 'react-native-safe-area-context';

type TransactionsScreenProps = {
  navigation: StackNavigationProp<NavigationParamList, 'Transactions'>;
};

const TransactionsScreen: React.FC<TransactionsScreenProps> = ({ navigation }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

  const loadTransactions = async () => {
    setLoading(true);
    const allTransactions = await getTransactions();

    // Sort by date (newest first)
    allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setTransactions(allTransactions);
    setLoading(false);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadTransactions();
    });

    return unsubscribe;
  }, [navigation]);

  const filteredTransactions = () => {
    if (filter === 'all') return transactions;
    return transactions.filter(t => t.type === filter);
  };

  const renderItem = ({ item }: ListRenderItemInfo<Transaction>) => (
    <TransactionItem
      transaction={item}
      onPress={() => navigation.navigate('TransactionDetail', { transaction: item })}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transactions</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.filtersContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'all' && styles.filterButtonActive
            ]}
            onPress={() => setFilter('all')}
          >
            <Text style={[
              styles.filterButtonText,
              filter === 'all' && styles.filterButtonTextActive
            ]}>All</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'income' && styles.filterButtonActive
            ]}
            onPress={() => setFilter('income')}
          >
            <Text style={[
              styles.filterButtonText,
              filter === 'income' && styles.filterButtonTextActive
            ]}>Income</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'expense' && styles.filterButtonActive
            ]}
            onPress={() => setFilter('expense')}
          >
            <Text style={[
              styles.filterButtonText,
              filter === 'expense' && styles.filterButtonTextActive
            ]}>Expenses</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3498db" />
          </View>
        ) : filteredTransactions().length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No transactions found</Text>
          </View>
        ) : (
          <FlatList
            data={filteredTransactions()}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.transactionsList}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#3498db',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  transactionsList: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
});

export default TransactionsScreen;