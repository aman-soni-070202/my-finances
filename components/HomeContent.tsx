// components/HomeContent.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ListRenderItemInfo
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import { getTransactions, getMonthlyStats } from '../storage/storageService';
import TransactionItem from '../components/TransactionItems';
import { Transaction, NavigationParamList, TabParamList } from '../types';

type HomeContentNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Home'>,
  StackNavigationProp<NavigationParamList>
>;

type HomeContentProps = {
  navigation: HomeContentNavigationProp;
};

const HomeContent: React.FC<HomeContentProps> = ({ navigation }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState({
    income: 0,
    expense: 0,
    balance: 0
  });
  const [loading, setLoading] = useState(true);

  // Get current month and year
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const loadData = async () => {
    setLoading(true);
    const monthlyStats = await getMonthlyStats(currentMonth, currentYear);
    setTransactions(monthlyStats.transactions);
    setStats({
      income: monthlyStats.income,
      expense: monthlyStats.expense,
      balance: monthlyStats.balance
    });
    setLoading(false);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });

    return unsubscribe;
  }, [navigation]);

  const renderItem = ({ item }: ListRenderItemInfo<Transaction>) => (
    <View style={styles.transactionItemContainer}>
      <TransactionItem 
        transaction={item} 
        onPress={() => navigation.navigate('TransactionDetail', { transaction: item })}
      />
    </View>
  );
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Aman Soni</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="settings-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.summaryContainer}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceAmount}>₹{stats.balance.toFixed(2)}</Text>
          <View style={styles.incomeExpenseRow}>
            <View style={styles.incomeContainer}>
              <Text style={styles.incomeExpenseLabel}>Income</Text>
              <Text style={styles.incomeAmount}>₹{stats.income.toFixed(2)}</Text>
            </View>
            <View style={styles.expenseContainer}>
              <Text style={styles.incomeExpenseLabel}>Expense</Text>
              <Text style={styles.expenseAmount}>₹{stats.expense.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </View>
      
      <View style={styles.transactionsContainer}>
        <View style={styles.transactionsHeader}>
          <Text style={styles.transactionsTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        {transactions.length > 0 ? (
            <FlatList
              data={transactions.slice(0, 5)}
              renderItem={renderItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.transactionsList}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubText}>Add your first transaction to get started</Text>
          </View>
        )}
      </View>
      
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => navigation.navigate('AddTransaction')}
      >
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.statsButton}
        onPress={() => navigation.navigate('Statistics')}
      >
        <Ionicons name="bar-chart" size={24} color="#FFF" />
      </TouchableOpacity>
    </View>
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  balanceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  incomeExpenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  incomeContainer: {
    flex: 1,
  },
  expenseContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  incomeExpenseLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  incomeAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2ecc71',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e74c3c',
  },
  transactionsContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  viewAllText: {
    fontSize: 14,
    color: '#3498db',
  },
  transactionItemContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    marginLeft: 10,
    marginRight: 10,
    paddingVertical: 5,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  separator: {
    height: 8,
  },
  transactionsList: {
    paddingHorizontal: 5,
    paddingVertical: 0,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#3498db',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  statsButton: {
    position: 'absolute',
    right: 20,
    bottom: 86,
    backgroundColor: '#8e44ad',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  }
});

export default HomeContent;