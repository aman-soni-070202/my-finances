// screens/BankAccountsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { NavigationParamList } from '../types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BankAccount } from '../types';
import { saveBankAccounts, getBankAccounts } from '@/storage/sqliteService';

type BankAccountsScreenProps = {
  navigation: StackNavigationProp<NavigationParamList, 'BankAccounts'>;
};

const BankAccountsScreen: React.FC<BankAccountsScreenProps> = ({ navigation }) => {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<Partial<BankAccount>>({
    name: '',
    accountNumber: '',
    bankName: '',
    balance: 0,
    type: 'checking'
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const storedAccounts = await getBankAccounts();
      if (storedAccounts) {
        setAccounts(storedAccounts);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load bank accounts');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async () => {
    if (!currentAccount.name || !currentAccount.accountNumber || !currentAccount.bankName) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (isEditing && currentAccount.id) {
      // Update existing account
      const updatedAccounts = accounts.map(account => 
        account.id === currentAccount.id ? currentAccount as BankAccount : account
      );
      
      const saved = await saveBankAccounts(updatedAccounts);
      if (saved) {
        setAccounts(updatedAccounts);
        setModalVisible(false);
        resetAccountForm();
        Alert.alert('Success', 'Bank account updated successfully');
      }
    } else {
      // Add new account
      const accountToAdd: BankAccount = {
        id: Date.now().toString(),
        name: currentAccount.name || '',
        accountNumber: currentAccount.accountNumber || '',
        bankName: currentAccount.bankName || '',
        balance: currentAccount.balance || 0,
        type: currentAccount.type || 'checking'
      };

      const updatedAccounts = [...accounts, accountToAdd];
      const saved = await saveBankAccounts(updatedAccounts);

      if (saved) {
        setAccounts(updatedAccounts);
        setModalVisible(false);
        resetAccountForm();
        Alert.alert('Success', 'Bank account added successfully');
      }
    }
  };

  const handleDeleteAccount = async (id: string) => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to remove this account? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          onPress: async () => {
            const updatedAccounts = accounts.filter(account => account.id !== id);
            const saved = await saveBankAccounts(updatedAccounts);
            if (saved) {
              setAccounts(updatedAccounts);
              Alert.alert('Success', 'Account removed successfully');
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  const resetAccountForm = () => {
    setCurrentAccount({
      name: '',
      accountNumber: '',
      bankName: '',
      balance: 0,
      type: 'checking'
    });
    setIsEditing(false);
  };

  const openAddAccountModal = () => {
    resetAccountForm();
    setIsEditing(false);
    setModalVisible(true);
  };

  const openEditAccountModal = (account: BankAccount) => {
    setCurrentAccount(account);
    setIsEditing(true);
    setModalVisible(true);
  };

  const renderAccountItem = ({ item }: { item: BankAccount }) => {
    const getIconName = (type: string) => {
      switch (type) {
        case 'checking': return 'card-outline';
        case 'savings': return 'wallet-outline';
        case 'credit': return 'card-outline';
        case 'investment': return 'trending-up-outline';
        default: return 'card-outline';
      }
    };

    return (
      <TouchableOpacity onPress={() => openEditAccountModal(item)}>
        <View style={styles.accountCard}>
          <View style={styles.accountHeader}>
            <View style={styles.accountIcon}>
              <Ionicons name={getIconName(item.type)} size={24} color="#3498db" />
            </View>
            <View style={styles.accountInfo}>
              <Text style={styles.accountName}>{item.name}</Text>
              <Text style={styles.accountNumber}>•••• {item.accountNumber.slice(-4)}</Text>
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteAccount(item.id)}
            >
              <Ionicons name="trash-outline" size={20} color="#e74c3c" />
            </TouchableOpacity>
          </View>
          <View style={styles.accountDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Bank</Text>
              <Text style={styles.detailValue}>{item.bankName}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Type</Text>
              <Text style={styles.detailValue}>{item.type.charAt(0).toUpperCase() + item.type.slice(1)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Balance</Text>
              <Text style={styles.balanceValue}>₹{item.balance.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bank Accounts</Text>
          <TouchableOpacity onPress={openAddAccountModal}>
            <Ionicons name="add-circle" size={24} color="#3498db" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3498db" />
          </View>
        ) : accounts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="wallet-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No bank accounts added yet</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={openAddAccountModal}
            >
              <Text style={styles.addButtonText}>Add Your First Account</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={accounts}
            renderItem={renderAccountItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
          />
        )}

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(false);
            resetAccountForm();
          }}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {isEditing ? 'Edit Bank Account' : 'Add Bank Account'}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setModalVisible(false);
                    resetAccountForm();
                  }}
                >
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Account Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Primary Checking"
                  value={currentAccount.name}
                  onChangeText={(text) => setCurrentAccount({ ...currentAccount, name: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Bank Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Chase Bank"
                  value={currentAccount.bankName}
                  onChangeText={(text) => setCurrentAccount({ ...currentAccount, bankName: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Account Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter last 4 digits"
                  value={currentAccount.accountNumber}
                  onChangeText={(text) => setCurrentAccount({ ...currentAccount, accountNumber: text })}
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Current Balance</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  value={currentAccount.balance?.toString() || ""}
                  onChangeText={(text) => setCurrentAccount({ ...currentAccount, balance: parseFloat(text) || 0 })}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Account Type</Text>
                <View style={styles.typeButtonsContainer}>
                  {['checking', 'savings', 'credit', 'investment'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeButton,
                        currentAccount.type === type && styles.selectedTypeButton
                      ]}
                      onPress={() => setCurrentAccount({ ...currentAccount, type: type as BankAccount['type'] })}
                    >
                      <Text
                        style={[
                          styles.typeButtonText,
                          currentAccount.type === type && styles.selectedTypeButtonText
                        ]}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleAddAccount}
              >
                <Text style={styles.saveButtonText}>
                  {isEditing ? 'Update Account' : 'Save Account'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  listContainer: {
    padding: 15,
  },
  accountCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  accountIcon: {
    backgroundColor: '#ecf0f1',
    padding: 10,
    borderRadius: 25,
    marginRight: 12,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  accountNumber: {
    fontSize: 12,
    color: '#999',
  },
  deleteButton: {
    padding: 8,
  },
  accountDetails: {
    padding: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  balanceValue: {
    fontSize: 16,
    color: '#2ecc71',
    fontWeight: '600',
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
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  inputGroup: {
    marginBottom: 15,
  }, 
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#f9f9f9',
  },
  typeButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  typeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#f0f0f0',
  },
  selectedTypeButton: {
    backgroundColor: '#3498db',
  },
  typeButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  selectedTypeButtonText: {
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BankAccountsScreen;