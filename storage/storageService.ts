// storage/storageService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, Categories, MonthlyStats, MonthData, BackupData, BankAccount, CreditCard } from '../types';
import { Alert } from 'react-native';

// Keys for our storage
const TRANSACTIONS_KEY = 'finance_transactions';
const CATEGORIES_KEY = 'finance_categories';
const BANK_ACCOUNTS_KEY = 'bankAccounts';
const CREDIT_CARDS_KEY = 'creditCards';

// Default categories to start with
const defaultCategories: Categories = {
  expense: ['Food', 'Transport', 'Entertainment', 'Bills', 'Shopping', 'Other'],
  income: ['Salary', 'Gifts', 'Investments', 'Side Hustle', 'Other']
};

// Initialize storage with default values if empty
export const initializeStorage = async (): Promise<boolean> => {
  try {
    const transactions = await AsyncStorage.getItem(TRANSACTIONS_KEY);
    if (transactions === null) {
      await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify([]));
    }

    const categories = await AsyncStorage.getItem(CATEGORIES_KEY);
    if (categories === null) {
      await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(defaultCategories));
    }

    return true;
  } catch (error) {
    console.error('Initialization error:', error);
    return false;
  }
};

// Get all transactions
export const getTransactions = async (): Promise<Transaction[]> => {
  try {
    const transactions = await AsyncStorage.getItem(TRANSACTIONS_KEY);
    return transactions ? JSON.parse(transactions) : [];
  } catch (error) {
    console.error('Error getting transactions:', error);
    return [];
  }
};

// Add a new transaction
export const addTransaction = async (transaction: Omit<Transaction, 'id' | 'date'>): Promise<Transaction | null> => {
  try {
    // Ensure transaction has required fields and a unique ID
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      ...transaction
    };

    const transactions = await getTransactions();
    const updatedTransactions = [newTransaction, ...transactions];

    await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(updatedTransactions));

    const paymentMethod = transaction.paymentMethod;

    if (paymentMethod.isCard) {
      updateCreditCardBalance(paymentMethod.id, transaction.amount * ((transaction.type == 'income') ? 1 : -1));
    }
    else {
      updateBankAccountBalance(paymentMethod.id, transaction.amount * ((transaction.type == 'income') ? 1 : -1));
    }

    return newTransaction;
  } catch (error) {
    console.error('Error adding transaction:', error);
    return null;
  }
};

// Update an existing transaction
export const updateTransaction = async (id: string, updatedData: Partial<Transaction>): Promise<Transaction | null> => {
  try {
    const transactions = await getTransactions();
    const index = transactions.findIndex(t => t.id === id);

    if (index !== -1) {
      const balanceToUpdate = (updatedData.amount != undefined) ? updatedData.amount : 0 - transactions[index].amount;
      transactions[index] = { ...transactions[index], ...updatedData };
      await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));

      const paymentMethod = updatedData.paymentMethod;
      if (paymentMethod) {
        if (paymentMethod.isCard) {
          updateCreditCardBalance(paymentMethod.id, balanceToUpdate * ((updatedData.type == 'income') ? 1 : -1))
        }
        else {
          updateBankAccountBalance(paymentMethod.id, balanceToUpdate * ((updatedData.type == 'income') ? 1 : -1))
        }
      }

      return transactions[index];
    }
    return null;
  } catch (error) {
    console.error('Error updating transaction:', error);
    return null;
  }
};

// Delete a transaction
export const deleteTransaction = async (id: string): Promise<boolean> => {
  try {
    const transactions = await getTransactions();
    const updatedTransactions = transactions.filter(t => t.id !== id);

    await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(updatedTransactions));
    return true;
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return false;
  }
};

// Get all categories
export const getCategories = async (): Promise<Categories> => {
  try {
    const categories = await AsyncStorage.getItem(CATEGORIES_KEY);
    return categories ? JSON.parse(categories) : defaultCategories;
  } catch (error) {
    console.error('Error getting categories:', error);
    return defaultCategories;
  }
};

// Add a new category
export const addCategory = async (type: 'income' | 'expense', categoryName: string): Promise<Categories | null> => {
  try {
    const categories = await getCategories();

    if (!categories[type].includes(categoryName)) {
      categories[type] = [...categories[type], categoryName];
      await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
    }

    return categories;
  } catch (error) {
    console.error('Error adding category:', error);
    return null;
  }
};

export const saveBankAccounts = async (updatedAccounts: BankAccount[]) => {
  try {
    await AsyncStorage.setItem(BANK_ACCOUNTS_KEY, JSON.stringify(updatedAccounts));
  } catch (error) {
    Alert.alert('Error', 'Failed to save bank accounts');
    console.error(error);
    return false;
  }
  return true;
};

export const updateBankAccountBalance = async (
  accountId: string,
  balanceAdjustment: number
): Promise<boolean> => {
  try {
    const accountsJson = await AsyncStorage.getItem(BANK_ACCOUNTS_KEY);

    if (!accountsJson) {
      Alert.alert('Error', 'No bank accounts found');
      return false;
    }

    const accounts: BankAccount[] = JSON.parse(accountsJson);

    const accountIndex = accounts.findIndex(account => account.id === accountId);

    if (accountIndex === -1) {
      Alert.alert('Error', `Bank account with ID ${accountId} not found`);
      return false;
    }

    accounts[accountIndex].balance = accounts[accountIndex].balance + balanceAdjustment;

    await AsyncStorage.setItem(BANK_ACCOUNTS_KEY, JSON.stringify(accounts));

    return true;
  } catch (error) {
    Alert.alert('Error', 'Failed to update bank account balance');
    console.error(error);
    return false;
  }
};

export const getBankAccounts = async () => {
  return await AsyncStorage.getItem(BANK_ACCOUNTS_KEY);
};


export const saveCreditCards = async (updatedCards: CreditCard[]) => {
  try {
    await AsyncStorage.setItem(CREDIT_CARDS_KEY, JSON.stringify(updatedCards));
  } catch (error) {
    Alert.alert('Error', 'Failed to save credit cards');
    console.error(error);
    return false;
  }
  return true;
};

export const updateCreditCardBalance = async (
  cardId: string,
  balanceAdjustment: number
): Promise<boolean> => {
  try {
    const cardsJson = await AsyncStorage.getItem(CREDIT_CARDS_KEY);

    if (!cardsJson) {
      Alert.alert('Error', 'No credit card found');
      return false;
    }

    const cards: CreditCard[] = JSON.parse(cardsJson);

    const cardIndex = cards.findIndex(card => card.id === cardId);

    if (cardIndex === -1) {
      Alert.alert('Error', `Bank account with ID ${cardId} not found`);
      return false;
    }

    cards[cardIndex].creditBalance = cards[cardIndex].creditBalance + balanceAdjustment;

    await AsyncStorage.setItem(BANK_ACCOUNTS_KEY, JSON.stringify(cards));

    return true;
  } catch (error) {
    Alert.alert('Error', 'Failed to update bank account balance');
    console.error(error);
    return false;
  }
};

export const getCreditCards = async () => {
  return await AsyncStorage.getItem(CREDIT_CARDS_KEY);
};


// Export statistics and summaries
export const getMonthlyStats = async (month: number, year: number): Promise<MonthlyStats> => {
  try {
    const transactions = await getTransactions();

    // Filter transactions for the specified month and year
    const filteredTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === month && date.getFullYear() === year;
    });

    // Calculate totals
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      income,
      expense,
      balance: income - expense,
      transactions: filteredTransactions
    };
  } catch (error) {
    console.error('Error getting monthly stats:', error);
    return {
      income: 0,
      expense: 0,
      balance: 0,
      transactions: []
    };
  }
};

// Get yearly statistics
export const getYearlyStats = async (year: number): Promise<MonthData[]> => {
  try {
    const transactions = await getTransactions();

    // Filter transactions for the specified year
    const filteredTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date.getFullYear() === year;
    });

    // Monthly breakdown
    const monthlyData: MonthData[] = Array(12).fill(0).map((_, index) => {
      const monthTransactions = filteredTransactions.filter(t => {
        const date = new Date(t.date);
        return date.getMonth() === index;
      });

      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const expense = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        month: index,
        income,
        expense,
        balance: income - expense
      };
    });

    return monthlyData;
  } catch (error) {
    console.error('Error getting yearly stats:', error);
    return [];
  }
};

// Backup data to JSON string
export const exportData = async (): Promise<string | null> => {
  try {
    const transactions = await getTransactions();
    const categories = await getCategories();

    const backupData: BackupData = {
      transactions,
      categories,
      exportDate: new Date().toISOString()
    };

    return JSON.stringify(backupData);
  } catch (error) {
    console.error('Error exporting data:', error);
    return null;
  }
};

// Import data from backup
export const importData = async (jsonString: string): Promise<boolean> => {
  try {
    const backupData = JSON.parse(jsonString) as BackupData;

    if (backupData.transactions) {
      await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(backupData.transactions));
    }

    if (backupData.categories) {
      await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(backupData.categories));
    }

    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
};