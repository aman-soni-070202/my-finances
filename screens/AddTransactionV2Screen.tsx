// src/screens/AddTransactionScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Navigation } from 'react-native-navigation';

// Define props interface
interface PrefillData {
  amount?: number;
  description?: string;
  category?: string;
  type?: 'expense' | 'credit';
  date?: Date;
}

interface AddTransactionScreenProps {
  componentId: string;
  prefillData?: PrefillData;
}

// Define transaction data interface
interface TransactionData {
  amount: number;
  description: string;
  category: string;
  type: 'expense' | 'credit';
  date: Date;
  isAutoGenerated: boolean;
  source: string;
}

const AddTransactionScreen: React.FC<AddTransactionScreenProps> = (props) => {
  const { prefillData = {} } = props;
  
  // State for form fields
  const [amount, setAmount] = useState<string>(prefillData.amount?.toString() || '');
  const [description, setDescription] = useState<string>(prefillData.description || '');
  const [category, setCategory] = useState<string>(prefillData.category || '');
  const [type, setType] = useState<'expense' | 'credit'>(prefillData.type || 'expense');
  const [date, setDate] = useState<Date>(prefillData.date || new Date());
  
  // Save transaction to your app's database
  const saveTransaction = (): void => {
    // Implement your data saving logic here
    // For example:
    const transactionData: TransactionData = {
      amount: parseFloat(amount),
      description,
      category,
      type,
      date,
      isAutoGenerated: Boolean(prefillData.amount),
      source: 'sms',
    };
    
    console.log('Saving transaction:', transactionData);
    
    // Add to your database
    // Example: addTransactionToDatabase(transactionData);
    
    // Close the modal
    dismissModal();
  };
  
  // Dismiss modal
  const dismissModal = (): void => {
    Navigation.dismissModal(props.componentId);
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          {/* Transaction type selector */}
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'expense' && styles.selectedTypeButton
              ]}
              onPress={() => setType('expense')}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  type === 'expense' && styles.selectedTypeButtonText
                ]}
              >
                Expense
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'credit' && styles.selectedTypeButton
              ]}
              onPress={() => setType('credit')}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  type === 'credit' && styles.selectedTypeButtonText
                ]}
              >
                Income
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Amount field */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Amount</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0.00"
            />
          </View>
          
          {/* Description field */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              placeholder="What was this for?"
              multiline
            />
          </View>
          
          {/* Category field */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Category</Text>
            <TextInput
              style={styles.input}
              value={category}
              onChangeText={setCategory}
              placeholder="Select category"
              // You might want to replace this with a proper category selector
            />
          </View>
          
          {/* Auto-detected info notice */}
          {prefillData.amount && (
            <View style={styles.autoDetectedContainer}>
              <Text style={styles.autoDetectedText}>
                This transaction was auto-detected from an SMS message.
              </Text>
            </View>
          )}
          
          {/* Action buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={dismissModal}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={saveTransaction}
            >
              <Text style={styles.saveButtonText}>Save Transaction</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  selectedTypeButton: {
    backgroundColor: '#007bff',
  },
  typeButtonText: {
    fontWeight: '600',
    color: '#333',
  },
  selectedTypeButtonText: {
    color: '#fff',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  autoDetectedContainer: {
    backgroundColor: '#e8f4fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  autoDetectedText: {
    color: '#0066cc',
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cancelButton: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  saveButton: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    flex: 2,
    backgroundColor: '#007bff',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

// Register the component with React Native Navigation
Navigation.registerComponent('AddTransactionScreen', () => AddTransactionScreen);

export default AddTransactionScreen;