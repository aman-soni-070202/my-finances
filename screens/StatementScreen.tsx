import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
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
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { getTransactionByAccountTypeAndId, updateBankAccountBalance, updateCreditCardBalance } from '@/storage/sqliteService';
import { BankAccount, CreditCard, NavigationParamList, Transaction } from '@/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import TransactionItem from '@/components/TransactionItems';

type StatementsScreenProps = NativeStackScreenProps<NavigationParamList, 'AccountStatement'>;

const StatementsScreen: React.FC<StatementsScreenProps> = ({ route, navigation }) => {
  const { item, itemType } = route.params;

  // State for transactions
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State for edit drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editedBalance, setEditedBalance] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Add a ref for the TextInput
  const textInputRef = useRef<TextInput>(null);

  useEffect(() => {
    // Set the navigation title based on the account name
    navigation.setOptions({
      title: item.name || (itemType === 'bank' ? 'Bank Account' : 'Credit Card')
    });

    // Load transactions
    fetchTransactions();

    // Set initial balance for editing
    setEditedBalance(
      itemType === 'bank'
        ? (item as BankAccount).balance.toString()
        : (item as CreditCard).creditBalance.toString()
    );
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

  // Effect to focus input when drawer opens
  useEffect(() => {
    if (isDrawerOpen && textInputRef.current) {
      // Small delay to ensure the modal is fully rendered
      const timer = setTimeout(() => {
        if (textInputRef.current) {
          textInputRef.current.focus();
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isDrawerOpen]);

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      setIsLoading(true);

      // Here you would fetch transactions from your database
      // For this example, I'm creating mock data
      const mockTransactions = await getTransactionByAccountTypeAndId(item.id.toString(), (itemType == 'credit') ? true : false);

      setTransactions(mockTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: any) => {
    const value = parseFloat(amount);
    return `₹${Math.abs(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  // Open the balance edit drawer
  const handleEditBalance = () => {
    setEditedBalance(
      itemType === 'bank'
        ? (item as BankAccount).balance.toString()
        : (item as CreditCard).creditBalance.toString()
    );
    setIsDrawerOpen(true);
  };

  // Close the drawer
  const closeDrawer = () => {
    Keyboard.dismiss();
    setIsDrawerOpen(false);
  };

  // Save the edited balance
  const saveBalance = async () => {
    try {
      const newBalance = parseFloat(editedBalance);
      const oldBalance =
        itemType === 'bank'
          ? (item as BankAccount).balance
          : (item as CreditCard).creditBalance;

      if (isNaN(newBalance)) {
        alert('Please enter a valid number');
        return;
      }

      const balanceDifference = newBalance - oldBalance;

      if (balanceDifference !== 0) {
        if (itemType === 'bank') {
          await updateBankAccountBalance(item.id, balanceDifference);
          (item as BankAccount).balance = newBalance;
        } else {
          await updateCreditCardBalance(item.id, balanceDifference);
          (item as CreditCard).creditBalance = newBalance;
        }
      }

      // Refresh data
      await fetchTransactions();
      closeDrawer();
    } catch (error) {
      console.error('Error updating balance:', error);
      alert('Failed to update balance');
    }
  };

  // Render a transaction item
  const renderTransactionItem = ({ item: transaction }: { item: Transaction }) => {
    const isPositive = transaction.amount > 0;

    return (
      <View style={styles.transactionItemContainer}>
        <TransactionItem
          transaction={transaction}
          onPress={() => navigation.navigate('TransactionDetail', { transaction })}
        />
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading transactions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Balance Header */}
      <TouchableOpacity style={styles.balanceHeader} onPress={handleEditBalance}>
        <View style={styles.balanceHeaderContent}>
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>
              {itemType === 'bank' ? 'Current Balance' : 'Credit Balance'}
            </Text>
            <View style={styles.balanceValueContainer}>
              <Text style={styles.balanceValue}>
                {formatCurrency(
                  itemType === 'bank'
                    ? (item as BankAccount).balance
                    : (item as CreditCard).creditBalance
                )}
              </Text>
              <MaterialIcons name="edit" size={18} color="#ffffff" style={styles.editIcon} />
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Transactions List */}
      <View style={styles.transactionsContainer}>
        <View style={styles.transactionsHeader}>
          <Text style={styles.transactionsTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {transactions.length > 0 ? (
          <FlatList
            data={transactions}
            renderItem={renderTransactionItem}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.transactionsList}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        ) : (
          <View style={styles.emptyState}>
            <FontAwesome5 name="exchange-alt" size={48} color="#cccccc" />
            <Text style={styles.emptyStateText}>No transactions found</Text>
            <Text style={styles.emptyStateSubtext}>
              Transactions will appear here once they're processed
            </Text>
          </View>
        )}
      </View>

      {/* Balance Edit Drawer (Modal) */}
      <Modal
        visible={isDrawerOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={closeDrawer}
      >
        <View style={styles.drawerOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoidingView}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={closeDrawer}
              style={styles.modalTouchable}
            >
              <TouchableOpacity
                activeOpacity={1}
                onPress={(e) => e.stopPropagation()}
                style={styles.drawerContent}
              >
                <View style={styles.drawerHeader}>
                  <Text style={styles.drawerTitle}>
                    Edit {itemType === 'bank' ? 'Balance' : 'Credit Limit'}
                  </Text>
                  <TouchableOpacity onPress={closeDrawer} style={styles.closeButton}>
                    <MaterialIcons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>

                <View style={styles.drawerBody}>
                  <Text style={styles.itemName}>{item.name}</Text>

                  <Text style={styles.editLabel}>
                    {itemType === 'bank' ? 'Current Balance' : 'Current Credit Limit'}
                  </Text>

                  <View style={styles.inputContainer}>
                    <Text style={styles.currencySymbol}>₹</Text>
                    <TextInput
                      ref={textInputRef}
                      style={styles.balanceInput}
                      value={editedBalance}
                      onChangeText={setEditedBalance}
                      keyboardType="decimal-pad"
                      placeholder={itemType === 'bank'
                        ? (item as BankAccount).balance.toString()
                        : (item as CreditCard).creditBalance.toString()}
                      autoFocus={true}
                      caretHidden={false}
                      selection={{ start: editedBalance.length, end: editedBalance.length }}
                      keyboardAppearance="light"
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.fullWidthSaveButton}
                    onPress={saveBalance}
                  >
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
};

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
  },
  balanceHeader: {
    backgroundColor: '#0066cc',
    paddingVertical: 10,
    paddingHorizontal: 20,
    width: "50%",
    borderBottomRightRadius: 15,
  },
  balanceHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceInfo: {
    flex: 1,
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
  separator: {
    height: 8,
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
  balanceLabel: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
    marginBottom: 5,
  },
  balanceValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  editIcon: {
    marginLeft: 10,
  },
  visibilityButton: {
    padding: 5,
  },
  transactionsContainer: {
    flex: 1,
    paddingTop: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 15,
  },
  transactionsList: {
    paddingHorizontal: 5,
    paddingVertical: 0,
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
  keyboardAvoidingView: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  modalTouchable: {
    width: '100%',
  },
  drawerContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    width: '100%',
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
    paddingBottom: Platform.OS === 'ios' ? 20 : 20,
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

export default StatementsScreen;