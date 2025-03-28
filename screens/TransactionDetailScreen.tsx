// screens/TransactionDetailScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
// import { deleteTransaction, updateTransaction } from '../storage/storageService';
import { deleteTransaction } from '@/storage/sqliteService';
import { NavigationParamList, PaymentMethod, Transaction } from '../types';
import { SafeAreaView } from 'react-native-safe-area-context';

type TransactionDetailScreenProps = {
  navigation: StackNavigationProp<NavigationParamList, 'TransactionDetail'>;
  route: RouteProp<NavigationParamList, 'TransactionDetail'>;
};

const TransactionDetailScreen: React.FC<TransactionDetailScreenProps> = ({ navigation, route }) => {
  const { transaction } = route.params;
  const [loading, setLoading] = useState(false);

  if (!transaction) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Transaction data not available</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const getIconName = (type: string) => {
    switch (type) {
      case 'checking': return 'card-outline';
      case 'savings': return 'wallet-outline';
      case 'credit': return 'card-outline';
      case 'investment': return 'trending-up-outline';
      default: return 'card-outline';
    }
  };

  const renderPaymentMode = (paymentMethod: PaymentMethod) => {
    if (!paymentMethod) {
      return <Text>No payment information available</Text>;
    }
    else if (paymentMethod.isCard) {
      const lastFourDigits = paymentMethod.cardNumber && 
      paymentMethod.cardNumber.length >= 4 ? 
      paymentMethod.cardNumber.slice(-4) : 'XXXX';
      return (
        <View>
          <View style={styles.paymentModeRow}>
            <Text style={styles.paymentModeLabel}>Payment Mode</Text>
          </View>
          <View style={styles.paymentModeRow}>
            <View style={styles.accountIcon}>
              <Ionicons name={getIconName(paymentMethod.type)} size={20} color="#3498db" />
            </View>
            <View style={styles.accountInfo}>
              <Text style={styles.accountName}>{paymentMethod.name}</Text>
              <Text style={styles.accountDetails}>
                •••• {lastFourDigits}
              </Text>
            </View>
          </View>
        </View>
      );
    }
    else {
      return (
        <View>
          <View style={styles.paymentModeRow}>
            <Text style={styles.paymentModeLabel}>Payment Mode</Text>
          </View>
          <View style={styles.paymentModeRow}>
            <View style={styles.accountIcon}>
              <Ionicons name={getIconName(paymentMethod.type)} size={20} color="#3498db" />
            </View>
            <View style={styles.accountInfo}>
              <Text style={styles.accountName}>{paymentMethod.name}</Text>
              <Text style={styles.accountDetails}>
                {paymentMethod.bankName} •••• {paymentMethod.accountNumber}
              </Text>
            </View>
          </View>
        </View>
      );
    }
  };

  // Format date for display
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Unknown date';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      return 'Invalid date format';
    }
  };

  // Format time for display
  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          onPress: async () => {
            setLoading(true);
            const success = await deleteTransaction(transaction.id);
            setLoading(false);

            if (success) {
              navigation.goBack();
            } else {
              Alert.alert('Error', 'Failed to delete transaction');
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  const handleEdit = () => {
    // Redirect to edit screen (implementation would be added later)
    // For now, we'll just show a message
    Alert.alert('Feature Coming Soon', 'Editing transactions will be available in the next update!');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transaction Details</Text>
          <TouchableOpacity onPress={handleEdit}>
            <Ionicons name="create-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3498db" />
          </View>
        ) : (
          <View style={styles.content}>
            <View style={styles.amountContainer}>
              <Text style={[
                styles.amount,
                { color: transaction.type === 'expense' ? '#e74c3c' : '#2ecc71' }
              ]}>
                {transaction.type === 'expense' ? '-' : '+'}₹{transaction.amount.toFixed(2)}
              </Text>
              <Text style={styles.type}>
                {transaction.type === 'expense' ? 'Expense' : 'Income'}
              </Text>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Category</Text>
                <Text style={styles.infoValue}>{transaction.category}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Date</Text>
                <Text style={styles.infoValue}>{formatDate(transaction.date)}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Time</Text>
                <Text style={styles.infoValue}>{formatTime(transaction.date)}</Text>
              </View>

              {renderPaymentMode(transaction.paymentMethod)}

              {transaction.note ? (
                <View style={styles.noteContainer}>
                  <Text style={styles.infoLabel}>Note</Text>
                  <Text style={styles.noteText}>{transaction.note}</Text>
                </View>
              ) : null}
            </View>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={20} color="#fff" />
              <Text style={styles.deleteButtonText}>Delete Transaction</Text>
            </TouchableOpacity>
          </View>
        )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  amountContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  amount: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  type: {
    fontSize: 16,
    color: '#666',
    textTransform: 'uppercase',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  paymentModeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  paymentModeLabel: {
    fontSize: 14,
    color: '#666',
  },
  paymentModeValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  noteContainer: {
    paddingVertical: 12,
  },
  noteText: {
    fontSize: 14,
    color: '#333',
    marginTop: 8,
    lineHeight: 20,
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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

});

export default TransactionDetailScreen;