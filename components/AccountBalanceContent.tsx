import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Dimensions
} from 'react-native';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { getBankAccounts, getCreditCards, updateBankAccountBalance, updateCreditCardBalance } from '@/storage/sqliteService';
import { BankAccount, CreditCard } from '@/types';
import { useFocusEffect } from '@react-navigation/native';

type AccountBalanceContentProps = {
  navigation: any; // You can replace 'any' with the proper navigation type
};

const AccountBalanceContent: React.FC<AccountBalanceContentProps> = ({ navigation }) => {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalBalance, setTotalBalance] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);
  const [showBalances, setShowBalances] = useState(false);

  // New state for edit drawer
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  // Add a ref for the TextInput
  const textInputRef = useRef<TextInput>(null);

  // Initial data load
  useEffect(() => {
    initialFetchAccountData();
  }, []);

  // Keyboard event listeners
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    
    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);


  // This will run when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      refreshAccountData();
      return () => {
        // Optional cleanup if needed
      };
    }, [])
  );

  // Initial loading with full loading indicator
  const initialFetchAccountData = async () => {
    try {
      setIsLoading(true);
      await loadAccountData();
    } catch (error) {
      console.error('Error fetching account data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh data without showing full loading screen
  const refreshAccountData = async () => {
    try {
      setIsRefreshing(true);
      await loadAccountData();
    } catch (error) {
      console.error('Error refreshing account data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Core data loading logic, separated for reuse
  const loadAccountData = async () => {
    // Fetch bank accounts from AsyncStorage
    const storedBankAccounts = await getBankAccounts();
    
    // Fetch credit cards from AsyncStorage
    const storedCreditCards = await getCreditCards();

    setBankAccounts(storedBankAccounts);
    setCreditCards(storedCreditCards);

    // Calculate totals
    const bankTotal = storedBankAccounts.reduce(
      (sum: number, account: BankAccount) => sum + account.balance, 
      0
    );

    const creditTotal = storedCreditCards.reduce(
      (sum: number, card: CreditCard) => sum + card.creditBalance,
      0
    );

    setTotalBalance(bankTotal);
    setTotalCredit(creditTotal);
  };

  const toggleBalances = () => {
    setShowBalances(!showBalances);
  };

  const formatCurrency = (amount: any) => {
    return `₹${parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  // Handle clicking on a bank account
  const handleBankAccountPress = (account: BankAccount) => {
    navigation.navigate('AccountStatement', {
      item: account,
      itemType: 'bank'
    });
  };
  
  const handleCreditCardPress = (card: CreditCard) => {
    navigation.navigate('AccountStatement', {
      item: card,
      itemType: 'credit'
    });
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
        <View style={[styles.summaryItem, { marginLeft: 15 }]}>
          <Text style={styles.summaryLabel}>Total Balance</Text>
          <View style={styles.valueContainer}>
            {isRefreshing ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.summaryValue}>
                {showBalances ? formatCurrency(totalBalance) : '••••••'}
              </Text>
            )}
          </View>
        </View>
        <View style={[styles.summaryItem, { marginLeft: 15, marginRight: 15 }]}>
          <Text style={styles.summaryLabel}>Available Credit</Text>
          <View style={styles.valueContainer}>
            {isRefreshing ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.summaryValue}>
                {showBalances ? formatCurrency(totalCredit) : '••••••'}
              </Text>
            )}
          </View>
        </View>
      </View>

      <ScrollView style={styles.accountsContainer}>
        {bankAccounts.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Bank Accounts</Text>
            {bankAccounts.map((account: BankAccount, index) => (
              <TouchableOpacity
                key={index}
                style={styles.accountCard}
                onPress={() => handleBankAccountPress(account)}
              >
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
                  {isRefreshing ? (
                    <ActivityIndicator size="small" color="#0066cc" />
                  ) : (
                    <Text style={styles.balanceAmount}>
                      {showBalances
                        ? formatCurrency(account.balance || 0)
                        : '••••••'}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {creditCards.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Credit Cards</Text>
            {creditCards.map((card: CreditCard, index) => (
              <TouchableOpacity
                key={index}
                style={styles.accountCard}
                onPress={() => handleCreditCardPress(card)}
              >
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
                  {isRefreshing ? (
                    <ActivityIndicator size="small" color="#9c27b0" />
                  ) : (
                    <Text style={styles.balanceAmount}>
                      {showBalances
                        ? formatCurrency(card.creditBalance || 0)
                        : '••••••'}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
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

const { height: screenHeight } = Dimensions.get('window');

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
    paddingVertical: 6,
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
  valueContainer: {
    height: 24, // Fixed height to prevent layout shift
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
    minWidth: 80, // Ensure consistent width for the balance area
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
  // Drawer styles
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  drawerContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    // Set a max height that's less than the screen height
    maxHeight: screenHeight * 0.7,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  closeButton: {
    padding: 5,
  },
  drawerBody: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 20,
  },
  editLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#dddddd',
    paddingBottom: 8,
    marginBottom: 30,
  },
  currencySymbol: {
    fontSize: 22,
    color: '#333333',
    marginRight: 5,
  },
  balanceInput: {
    flex: 1,
    fontSize: 22,
    color: '#333333',
    padding: 0,
  },
  saveButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 15,
    paddingHorizontal: 15,
    height: 50,
    width: 50,
    alignItems: 'center',
    borderRadius: 25,
  },
  fullWidthSaveButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  }
});

export default AccountBalanceContent;