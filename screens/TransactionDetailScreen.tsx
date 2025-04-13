import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { deleteTransaction, updateTransaction, getCategories } from '@/storage/sqliteService';
import { NavigationParamList, PaymentMethod, Transaction, Categories } from '../types';
import { SafeAreaView } from 'react-native-safe-area-context';
import PaymentModeDropdown from '../components/PaymentModeDropdown';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

type TransactionDetailScreenProps = {
  navigation: StackNavigationProp<NavigationParamList, 'TransactionDetail'>;
  route: RouteProp<NavigationParamList, 'TransactionDetail'>;
};

const TransactionDetailScreen: React.FC<TransactionDetailScreenProps> = ({ navigation, route }) => {
  const { transaction } = route.params;
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Transaction state
  const [type, setType] = useState<'expense' | 'income'>(transaction?.type || 'expense');
  const [amount, setAmount] = useState<string>(transaction ? transaction.amount.toString() : '');
  const [note, setNote] = useState<string>(transaction?.note || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(transaction?.category || '');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>(
    transaction?.paymentMethod || null
  );
  const [date, setDate] = useState<Date>(
    transaction?.date ? new Date(transaction.date) : new Date()
  );
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [categories, setCategories] = useState<Categories>({
    expense: [],
    income: []
  });

  const slideAnim = useRef(new Animated.Value(type === 'expense' ? 0 : 1)).current;

  useEffect(() => {
    const loadCategories = async () => {
      const cats = await getCategories();
      setCategories(cats);
    };

    loadCategories();
  }, []);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: type === 'expense' ? 0 : 1,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [type, slideAnim]);

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

  // Date picker handlers
  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  const toggleDatePicker = () => {
    setShowDatePicker(!showDatePicker);
  };

  const handleTypeChange = (newType: 'expense' | 'income') => {
    setType(newType);
    // If the current category doesn't exist in the new type, set to first available
    if (!categories[newType].includes(selectedCategory)) {
      setSelectedCategory(categories[newType][0]);
    }
  };

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
  };

  // Function to dismiss the keyboard
  const dismissKeyboard = () => {
    Keyboard.dismiss();
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
    setIsEditing(true);
  };

  const handleSave = async () => {
    setLoading(true);

    const updatedTransaction: Transaction = {
      id: transaction.id,
      type,
      amount: parseFloat(amount),
      category: selectedCategory,
      note: note.trim(),
      date: date.toISOString(),
      paymentMethod: selectedPaymentMethod
    };

    try {
      const success = await updateTransaction(updatedTransaction);

      if (success) {
        setIsEditing(false);
        navigation.setParams({ transaction: updatedTransaction });
      } else {
        Alert.alert('Error', 'Failed to update transaction');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancel = () => {
    // Reset form to original transaction values
    setType(transaction.type);
    setAmount(transaction.amount.toString());
    setNote(transaction.note || '');
    setSelectedCategory(transaction.category);
    setSelectedPaymentMethod(transaction.paymentMethod);
    setDate(new Date(transaction.date));
    setIsEditing(false);
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: (isEditing) ? '#fff' : '#f5f5f5' }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Edit Transaction' : 'Transaction Details'}
          </Text>
          <View style={styles.rightPlaceholder} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3498db" />
          </View>
        ) : (
          <>
            {!isEditing ? (
              // View Mode
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

                  <View>
                    <View style={styles.paymentModeRow}>
                      <Text style={styles.paymentModeLabel}>Payment Mode</Text>
                    </View>
                    <View style={styles.paymentModeRow}>
                      <View style={styles.accountIcon}>
                        <Ionicons
                          name={getIconName(transaction.paymentMethod.type || '')}
                          size={20}
                          color="#3498db"
                        />
                      </View>
                      <View style={styles.accountInfo}>
                        <Text style={styles.accountName}>{transaction.paymentMethod.name}</Text>
                        <Text style={styles.accountDetails}>
                          {transaction.paymentMethod.isCard
                            ? `•••• ${getLastFourDigits(transaction.paymentMethod.cardNumber)}`
                            : `${transaction.paymentMethod.bankName} •••• ${transaction.paymentMethod.accountNumber}`
                          }
                        </Text>
                      </View>
                    </View>
                  </View>

                  {transaction.note ? (
                    <View style={styles.noteContainer}>
                      <Text style={styles.infoLabel}>Note</Text>
                      <Text style={styles.noteText}>{transaction.note}</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={handleDelete}
                  >
                    <Ionicons name="trash-outline" size={20} color="#fff" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={handleEdit}
                  >
                    <Ionicons name="bug-outline" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              // Edit Mode
              <ScrollView
                contentContainerStyle={styles.scrollContainer}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.typeSelector}>
                  <Animated.View
                    style={[
                      styles.sliderIndicator,
                      {
                        left: slideAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '50%']
                        }),
                        width: '50%',
                      }
                    ]}
                  />

                  <TouchableOpacity
                    style={styles.typeButton}
                    onPress={() => handleTypeChange('expense')}
                  >
                    <Text style={[
                      styles.typeButtonText,
                      type === 'expense' && styles.typeButtonTextActive
                    ]}>Expense</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.typeButton}
                    onPress={() => handleTypeChange('income')}
                  >
                    <Text style={[
                      styles.typeButtonText,
                      type === 'income' && styles.typeButtonTextActive
                    ]}>Income</Text>
                  </TouchableOpacity>
                </View>

                {/* Date Selection */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Transaction Date</Text>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={toggleDatePicker}
                  >
                    <Ionicons name="calendar-outline" size={20} color="#666" style={styles.dateIcon} />
                    <Text style={styles.dateText}>{format(date, 'dd MMM yyyy')}</Text>
                  </TouchableOpacity>

                  {showDatePicker && (
                    <DateTimePicker
                      value={date}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={onDateChange}
                      maximumDate={new Date()}
                    />
                  )}
                </View>

                <View style={styles.amountEditContainer}>
                  <Text style={styles.currencySign}>₹</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0.00"
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={setAmount}
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Category</Text>
                  <View style={styles.categoriesContainer}>
                    {categories[type].map((category) => (
                      <TouchableOpacity
                        key={category}
                        style={[
                          styles.categoryButton,
                          selectedCategory === category && styles.categoryButtonActive
                        ]}
                        onPress={() => setSelectedCategory(category)}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          styles.categoryButtonText,
                          selectedCategory === category && styles.categoryButtonTextActive
                        ]}>{category}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Payment Mode</Text>
                  <PaymentModeDropdown
                    selectedMethod={selectedPaymentMethod}
                    onSelect={handlePaymentMethodSelect}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Note (Optional)</Text>
                  <TextInput
                    style={styles.noteInput}
                    placeholder="Add a note"
                    value={note}
                    onChangeText={setNote}
                    multiline
                    placeholderTextColor="#999"
                  />
                </View>
              </ScrollView>
            )}
          </>
        )}

        {/* Keyboard dismissal for iOS */}
        {Platform.OS === 'ios' && isEditing && (
          <TouchableWithoutFeedback onPress={dismissKeyboard}>
            <View style={styles.keyboardDismissContainer} />
          </TouchableWithoutFeedback>
        )}
        
        {/* Save button moved to the right side */}
        {isEditing && (
          <TouchableOpacity
            style={styles.circularSaveButton}
            onPress={handleSave}
          >
            <Ionicons name="save" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Helper function to get icon name
const getIconName = (type: string) => {
  switch (type) {
    case 'checking': return 'card-outline';
    case 'savings': return 'wallet-outline';
    case 'credit': return 'card-outline';
    case 'investment': return 'trending-up-outline';
    default: return 'card-outline';
  }
};

// Helper function to get last four digits
const getLastFourDigits = (cardNumber?: string) => {
  return cardNumber && cardNumber.length >= 4 ?
    cardNumber.slice(-4) : 'XXXX';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  backButton: {
    width: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  rightPlaceholder: {
    width: 24,
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
  scrollContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
    paddingBottom: 100,
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
  noteContainer: {
    paddingVertical: 12,
  },
  noteText: {
    fontSize: 14,
    color: '#333',
    marginTop: 8,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 40,
    width: 80,
    height: 80,
    shadowColor: '##e74c3c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    marginTop: 'auto',
    marginBottom: "15%",
    marginLeft: "20%"
  },
  editButton: {
    backgroundColor: '#3498db',
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 40,
    width: 80,
    height: 80,
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    marginTop: 'auto',
    marginBottom: "15%",
    marginLeft: "20%"
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
  // Edit mode styles
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    padding: 4,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  typeButtonTextActive: {
    color: '#333',
  },
  sliderIndicator: {
    marginTop: 3,
    marginLeft: 4,
    position: 'absolute',
    height: '100%',
    width: '50%',
    borderRadius: 6,
    shadowColor: '#000',
    backgroundColor: '#fff',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
    zIndex: 0,
  },
  formGroup: {
    marginTop: 5,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  dateIcon: {
    marginRight: 8,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  amountEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 12,
  },
  currencySign: {
    fontSize: 24,
    color: '#333',
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '600',
    color: '#333',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginBottom: 8,
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#3498db',
  },
  categoryButtonText: {
    color: '#666',
    fontSize: 14,
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  keyboardDismissContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  // Circular save button moved to right side
  circularSaveButton: {
    position: 'absolute',
    backgroundColor: '#2ecc71',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    right: 30, // Changed from left to right
    bottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    zIndex: 10,
  },
});

export default TransactionDetailScreen;