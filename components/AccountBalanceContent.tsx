// components/AccountBalanceContent.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator 
} from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { getBankAccounts, getCreditCards } from '@/storage/storageService';
import { BankAccount, CreditCard } from '@/types';

type AccountBalanceContentProps = {
  navigation: any; // You can replace 'any' with the proper navigation type
};

const AccountBalanceContent: React.FC<AccountBalanceContentProps> = ({ navigation }) => {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalBalance, setTotalBalance] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);
  const [showBalances, setShowBalances] = useState(true);

  useEffect(() => {
    fetchAccountData();
  }, []);

  const fetchAccountData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch bank accounts from AsyncStorage
      const storedBankAccounts = await getBankAccounts();
      const parsedBankAccounts = storedBankAccounts ? JSON.parse(storedBankAccounts) : [];
      
      // Fetch credit cards from AsyncStorage
      const storedCreditCards = await getCreditCards();
      const parsedCreditCards = storedCreditCards ? JSON.parse(storedCreditCards) : [];
      
      setBankAccounts(parsedBankAccounts);
      setCreditCards(parsedCreditCards);
      
      // Calculate totals
      const bankTotal = parsedBankAccounts.reduce(
        (sum: number, account: BankAccount) => sum + account.balance, 
        0
      );
      
      const creditTotal = parsedCreditCards.reduce(
        (sum: number, card: CreditCard) => sum + card.creditBalance, 
        0
      );
      
      setTotalBalance(bankTotal);
      setTotalCredit(creditTotal);
    } catch (error) {
      console.error('Error fetching account data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleBalances = () => {
    setShowBalances(!showBalances);
  };

  const formatCurrency = (amount: any) => {
    return `₹${parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading your accounts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Accounts</Text>
        <TouchableOpacity onPress={toggleBalances} style={styles.visibilityButton}>
          <MaterialIcons 
            name={showBalances ? "visibility" : "visibility-off"} 
            size={24} 
            color="#0066cc" 
          />
        </TouchableOpacity>
      </View>
      
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryItem, {marginLeft: 15}]}>
          <Text style={styles.summaryLabel}>Total Balance</Text>
          <Text style={styles.summaryValue}>
            {showBalances ? formatCurrency(totalBalance) : '••••••'}
          </Text>
        </View>
        <View style={[styles.summaryItem, {marginLeft: 15, marginRight: 15}]}>
          <Text style={styles.summaryLabel}>Available Credit</Text>
          <Text style={styles.summaryValue}>
            {showBalances ? formatCurrency(totalCredit) : '••••••'}
          </Text>
        </View>
      </View>
      
      <ScrollView style={styles.accountsContainer}>
        {bankAccounts.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Bank Accounts</Text>
            {bankAccounts.map((account: BankAccount, index) => (
              <View key={index} style={styles.accountCard}>
                <View style={styles.accountIconContainer}>
                  <FontAwesome5 name="university" size={24} color="#0066cc" />
                </View>
                <View style={styles.accountDetails}>
                  <Text style={styles.accountName}>{account.name || 'Account'}</Text>
                  <Text style={styles.accountNumber}>
                    {account.accountNumber 
                      ? `••••${account.accountNumber.slice(-4)}` 
                      : 'No account number'}
                  </Text>
                </View>
                <View style={styles.balanceContainer}>
                  <Text style={styles.balanceLabel}>Balance</Text>
                  <Text style={styles.balanceAmount}>
                    {showBalances 
                      ? formatCurrency(account.balance || 0)
                      : '••••••'}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}
        
        {creditCards.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Credit Cards</Text>
            {creditCards.map((card: CreditCard, index) => (
              <View key={index} style={styles.accountCard}>
                <View style={styles.accountIconContainer}>
                  <FontAwesome5 name="credit-card" size={24} color="#9c27b0" />
                </View>
                <View style={styles.accountDetails}>
                  <Text style={styles.accountName}>{card.name || 'Credit Card'}</Text>
                  <Text style={styles.accountNumber}>
                    {card.cardNumber 
                      ? `••••${card.cardNumber.slice(-4)}` 
                      : 'No card number'}
                  </Text>
                </View>
                <View style={styles.balanceContainer}>
                  <Text style={styles.balanceLabel}>Limit</Text>
                  <Text style={styles.balanceAmount}>
                    {showBalances 
                      ? formatCurrency(card.creditBalance || 0)
                      : '••••••'}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}
        
        {bankAccounts.length === 0 && creditCards.length === 0 && (
          <View style={styles.emptyState}>
            <FontAwesome5 name="piggy-bank" size={48} color="#cccccc" />
            <Text style={styles.emptyStateText}>No accounts found</Text>
            <Text style={styles.emptyStateSubtext}>
              Your accounts will appear here once they're added
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  visibilityButton: {
    padding: 5,
  },
  summaryContainer: {
    flexDirection: 'row',
  },
  summaryItem: {
    flexDirection: 'column',
    flex: 1,
    backgroundColor: '#0066cc',
    marginTop: 10,
    padding: 15,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  accountsContainer: {
    flex: 1,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginTop: 10,
    marginBottom: 15,
  },
  accountCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  accountIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  accountDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 3,
  },
  accountNumber: {
    fontSize: 14,
    color: '#666666',
  },
  balanceContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  balanceLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 3,
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
  refreshButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 15,
    alignItems: 'center',
    margin: 15,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AccountBalanceContent;