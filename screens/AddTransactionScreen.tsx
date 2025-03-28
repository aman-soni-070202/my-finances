// screens/AddTransactionScreen.tsx
import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Alert,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
// import { addTransaction, getCategories } from '../storage/storageService';
import { addTransaction, getCategories } from '@/storage/sqliteService';
import { Categories, NavigationParamList, PaymentMethod } from '../types';
import { SafeAreaView } from 'react-native-safe-area-context';
import PaymentModeDropdown from '../components/PaymentModeDropdown';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

type AddTransactionScreenProps = {
  navigation: StackNavigationProp<NavigationParamList, 'AddTransaction'>;
};

const AddTransactionScreen: React.FC<AddTransactionScreenProps> = ({ navigation }) => {
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [categories, setCategories] = useState<Categories>({
    expense: [],
    income: []
  });

  const [date, setDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  const slideAnim = useRef(new Animated.Value(type === 'expense' ? 0 : 1)).current;

  useEffect(() => {
    const loadCategories = async () => {
      const cats = await getCategories();
      setCategories(cats);
      setSelectedCategory(cats[type][0]);
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
    setSelectedCategory(categories[newType][0]);
    // Keep the keyboard visible if it's already showing
  };

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
  };

  // Add a function to dismiss the keyboard
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };
  
  const handleSave = async () => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid amount');
      return;
    }

    if (!selectedCategory) {
      Alert.alert('Missing category', 'Please select a category');
      return;
    }


    if (!selectedPaymentMethod) {
      Alert.alert('Missing payment method', 'Please select a payment method');
      return;
    }

    const transaction = {
      type,
      amount: parseFloat(amount),
      category: selectedCategory,
      note: note.trim(),
      paymentMethod: {
        id: selectedPaymentMethod.id,
        name: selectedPaymentMethod.name,
        type: selectedPaymentMethod.type,
        isCard: selectedPaymentMethod.isCard || false,
        // Include either account number or card number based on the method type
        ...(selectedPaymentMethod.isCard
          ? { cardNumber: selectedPaymentMethod.cardNumber }
          : {
            accountNumber: selectedPaymentMethod.accountNumber,
            bankName: selectedPaymentMethod.bankName
          })
      }
    };

    const result = await addTransaction(transaction);

    if (result) {
      navigation.goBack();
    } else {
      Alert.alert('Error', 'Failed to save transaction');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add Transaction</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.typeSelector}>

            <Animated.View
              style={[
                styles.sliderIndicator, // Add this new style for positioning
                {
                  left: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '50%']
                  }),
                  width: '50%', // Width of each button
                }
              ]}
            />

            <TouchableOpacity
              style={[
                styles.typeButton,
              ]}
              onPress={() => handleTypeChange('expense')}
            >
              <Text style={[
                styles.typeButtonText,
                type === 'expense' && styles.typeButtonTextActive
              ]}>Expense</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeButton,
              ]}
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

          <View style={styles.amountContainer}>
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
            <View 
              style={styles.categoriesContainer}
              pointerEvents="box-none"
            >
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

          {/* Add some extra space at the bottom for the floating button */}
          <View style={styles.buttonSpacing} />
        </ScrollView>

        {/* Floating Action Button */}
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={handleSave}
        >
          <Ionicons name="save" size={28} color="#fff" />
        </TouchableOpacity>
        
        {/* Add a transparent view to capture keyboard dismissal taps */}
        {Platform.OS === 'ios' && (
          <TouchableWithoutFeedback onPress={dismissKeyboard}>
            <View style={styles.keyboardDismissContainer} />
          </TouchableWithoutFeedback>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    height: '100%'
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 100, // Add extra padding at the bottom for the FAB
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
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
  typeButtonActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  typeButtonTextActive: {
    color: '#333',
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
  currencySign: {
    fontSize: 24,
    color: '#333',
    marginRight: 4,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '600',
    color: '#333',
  },
  formGroup: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4, // Space between category buttons
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginBottom: 4,
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
  buttonSpacing: {
    height: 20, // Extra space at the bottom of the ScrollView
  },
  keyboardDismissContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1, // Place behind all other elements
  },
  floatingButton: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3498db',
    bottom: 30,
    right: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 999,
  },
});

export default AddTransactionScreen;