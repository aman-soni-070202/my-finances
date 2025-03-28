// components/PaymentModeDropdown.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  TouchableWithoutFeedback
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BankAccount, CreditCard, PaymentMethod } from '@/types';
import { getBankAccounts, getCreditCards } from '@/storage/sqliteService';

type PaymentModeDropdownProps = {
  onSelect: (method: PaymentMethod) => void;
  selectedMethod?: PaymentMethod | null;
};

const PaymentModeDropdown: React.FC<PaymentModeDropdownProps> = ({
  onSelect,
  selectedMethod
}) => {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const windowHeight = Dimensions.get('window').height;

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  useEffect(() => {
    if (!selectedMethod && !loading && (bankAccounts.length > 0 || creditCards.length > 0)) {
      // First try to select a bank account
      if (bankAccounts.length > 0) {
        const defaultAccount = bankAccounts[0];
        handleSelect({
          id: defaultAccount.id,
          name: defaultAccount.name,
          accountNumber: defaultAccount.accountNumber,
          bankName: defaultAccount.bankName,
          type: defaultAccount.type,
          isCard: false
        });
      }
      // If no bank accounts, try to select a credit card
      else if (creditCards.length > 0) {
        const defaultCard = creditCards[0];
        handleSelect({
          id: defaultCard.id,
          name: defaultCard.name,
          cardNumber: defaultCard.cardNumber,
          type: 'credit',
          isCard: true
        });
      }
    }
  }, [selectedMethod, loading, bankAccounts, creditCards]);


  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      // Load bank accounts
      const storedAccounts = await getBankAccounts();
      if (storedAccounts) {
        setBankAccounts(storedAccounts);
      } else {
        setBankAccounts([]);
      }

      // Load credit cards
      const storedCards = await getCreditCards();
      if (storedCards) {
        setCreditCards(storedCards);
      } else {
        setCreditCards([]);
      }
    } catch (error) {
      console.error('Failed to load payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIconName = (type: string) => {
    switch (type) {
      case 'checking': return 'card-outline';
      case 'savings': return 'wallet-outline';
      case 'credit': return 'card-outline';
      case 'investment': return 'trending-up-outline';
      default: return 'card-outline';
    }
  };

  const handleSelect = (method: PaymentMethod) => {
    onSelect(method);
    setModalVisible(false);
  };

  const renderSectionHeader = (title: string) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );

  const renderBankAccountItem = (account: BankAccount) => {
    const method: PaymentMethod = {
      id: account.id,
      name: account.name,
      accountNumber: account.accountNumber,
      bankName: account.bankName,
      type: account.type,
      isCard: false
    };

    return (
      <TouchableOpacity
        key={account.id}
        style={styles.accountItem}
        onPress={() => handleSelect(method)}
      >
        <View style={styles.accountIcon}>
          <Ionicons name={getIconName(account.type)} size={20} color="#3498db" />
        </View>
        <View style={styles.accountInfo}>
          <Text style={styles.accountName}>{account.name}</Text>
          <Text style={styles.accountDetails}>
            {account.bankName} •••• {account.accountNumber}
          </Text>
        </View>
        {selectedMethod?.id === account.id && (
          <Ionicons name="checkmark-circle" size={20} color="#3498db" />
        )}
      </TouchableOpacity>
    );
  };

  const renderCreditCardItem = (card: CreditCard) => {
    const method: PaymentMethod = {
      id: card.id,
      name: card.name,
      cardNumber: card.cardNumber,
      type: 'credit',
      isCard: true
    };

    return (
      <TouchableOpacity
        key={card.id}
        style={styles.accountItem}
        onPress={() => handleSelect(method)}
      >
        <View style={styles.accountIcon}>
          <Ionicons name="card-outline" size={20} color="#e74c3c" />
        </View>
        <View style={styles.accountInfo}>
          <Text style={styles.accountName}>{card.name}</Text>
          <Text style={styles.accountDetails}>
            •••• {card.cardNumber.slice(-4)}
          </Text>
        </View>
        {selectedMethod?.id === card.id && (
          <Ionicons name="checkmark-circle" size={20} color="#3498db" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setModalVisible(true)}
      >
        {selectedMethod ? (
          <View style={styles.selectedContainer}>
            <View style={styles.selectedIconContainer}>
              <Ionicons
                name={selectedMethod.isCard ? "card-outline" : getIconName(selectedMethod.type)}
                size={16}
                color={selectedMethod.isCard ? "#e74c3c" : "#3498db"}
              />
            </View>
            <Text style={styles.selectedText}>
              {selectedMethod.name}
              {selectedMethod.isCard
                ? ` (•••• ${selectedMethod.cardNumber?.slice(-4)})`
                : ` (•••• ${selectedMethod.accountNumber})`}
            </Text>
          </View>
        ) : (
          <Text style={styles.placeholderText}>Select payment method</Text>
        )}
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={[styles.modalContent, { maxHeight: windowHeight * 0.5 }]}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Payment Method</Text>
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>

                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3498db" />
                  </View>
                ) : bankAccounts.length === 0 && creditCards.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No payment methods found</Text>
                    <Text style={styles.emptySubtext}>
                      Add accounts in Settings → Bank Accounts
                    </Text>
                  </View>
                ) : (
                  <ScrollView
                    style={styles.scrollContainer}
                    contentContainerStyle={styles.accountsList}
                    showsVerticalScrollIndicator={true}
                  >
                    {/* Bank Accounts Section */}
                    {bankAccounts.filter(acc => acc.type === 'checking' || acc.type === 'savings').length > 0 && (
                      <>
                        {renderSectionHeader('Bank Accounts')}
                        {bankAccounts
                          .filter(acc => acc.type === 'checking' || acc.type === 'savings')
                          .map((item) => renderBankAccountItem(item))}
                      </>
                    )}

                    {/* Credit Cards Section */}
                    {creditCards.length > 0 && (
                      <>
                        {renderSectionHeader('Credit Cards')}
                        {creditCards.map((card) => renderCreditCardItem(card))}
                      </>
                    )}

                  </ScrollView>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
  },
  selectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  selectedText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  placeholderText: {
    fontSize: 14,
    color: '#999',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    marginBottom: -1,
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sectionHeader: {
    marginTop: 8,
    paddingHorizontal: 2,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  accountsList: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    marginTop: 8,
    marginLeft: 10,
    marginRight: 10,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  accountIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  accountDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  scrollContainer: {
    maxHeight: '100%',
  },
});

export default PaymentModeDropdown;