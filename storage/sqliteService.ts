// storage/sqliteService.ts
import * as SQLite from 'expo-sqlite';
import { Transaction, Categories, MonthlyStats, MonthData, BackupData, BankAccount, CreditCard, TransactionInput } from '../types';
import { Alert, Platform } from 'react-native';
import { NewCategory, NewBankAccount, NewCreditCard, NewTransaction } from '@/db/schema';
import { CategorySelect, BankAccountSelect, CreditCardSelect, TransactionSelect } from '@/db/schema';

// Define SQLResultSet interface since it's not exported directly
interface SQLResultSet {
  insertId?: number;
  rowsAffected: number;
  rows: any[];
}

const DATABASE_NAME = 'db.db';

// Database connection
export let db: SQLite.SQLiteDatabase | null = null;

// Default categories to start with
const defaultCategories: Categories = {
  expense: ['Food', 'Transport', 'Entertainment', 'Bills', 'Shopping', 'Other'],
  income: ['Salary', 'Gifts', 'Investments', 'Side Hustle', 'Other']
};

// Ensure DB is initialized before operations
const ensureDbInitialized = (): SQLite.SQLiteDatabase => {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase first.');
  }
  return db;
};

// Helper for consistent date formatting
const formatDateForSql = (date: Date): string => {
  // Use ISO string but keep only the date part to avoid timezone issues
  return date.toISOString().split('T')[0];
};

// Helper for consistent error handling
const handleError = (message: string, error: any, showAlert = false): null => {
  console.error(`${message}:`, error);
  if (showAlert) {
    Alert.alert('Error', message);
  }
  return null;
};

// Promise wrapper for SQL transaction
const executeSqlWithParams = (
  database: SQLite.SQLiteDatabase,
  query: string,
  params: any[] = []
): Promise<SQLResultSet[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      const statement = await database.prepareAsync(query);
      const response: SQLResultSet[] = [];

      if (params.length) {
        for (let i = 0; i < params.length; i++) {
          const result = await statement.executeAsync(params[i]);
          const rows = await result.getAllAsync();
          const res: SQLResultSet = {
            rowsAffected: result.changes,
            rows: rows
          }
          response.push(res)
          await result.resetAsync()
        }
      } else {
        const result = await statement.executeAsync();
        const rows = await result.getAllAsync();
        const res: SQLResultSet = {
          rowsAffected: result.changes,
          rows: rows
        }
        response.push(res)
        await result.resetAsync()
      }
      resolve(response);
    }
    catch (error) {
      reject(error);
    }
  });
};

const executeSqlWithoutParams = (
  database: SQLite.SQLiteDatabase,
  query: string
): Promise<Boolean> => {
  return new Promise((resolve, reject) => {
    database.execAsync(query)
      .then(() => resolve(true))
      .catch(error => reject(error));
  });
};


export const initializeDatabase = async (): Promise<boolean> => {
  try {
    if (db) {
      console.log('Database already initialized, reusing existing connection');
      return true;
    }

    console.log(`Opening database ${DATABASE_NAME}`);

    db = await SQLite.openDatabaseAsync(DATABASE_NAME);

    if (!db) {
      throw new Error('Failed to open database');
    }

    await executeSqlWithoutParams(db, 'PRAGMA foreign_keys = ON;');
    console.log('Foreign keys enabled');

    await initializeCategories();

    console.log('Database schema completely initialized');
    return true;
  } catch (error) {
    console.error('Database initialization error:', error);

    // Set db to null on error
    db = null;
    return false;
  }
};

const initializeCategories = async (): Promise<void> => {
  const db = ensureDbInitialized();

  try {
    // Check if categories already exist
    
    const result = await executeSqlWithParams(db, 'SELECT COUNT(*) as count FROM categories');

    if (result[0].rows[0]['COUNT(*)'] === 0) {
      console.log('No categories found, inserting defaults');
      await insertDefaultCategories();
    } else {
      console.log('Categories already exist, skipping initialization');
    }
  } catch (error) {
    console.error('Error checking or initializing categories:', error);
    throw error;
  }
};

// Insert default categories
const insertDefaultCategories = async (): Promise<void> => {
  try {
    const db = ensureDbInitialized();

    for (const type of Object.keys(defaultCategories) as Array<keyof Categories>) {
      for (const name of defaultCategories[type]) {
        // Use parameterized query to prevent SQL injection
        await executeSqlWithParams(
          db,
          'INSERT INTO categories (type, name) VALUES ($type, $name)',
          [{ $type: type, $name: name }]
        );
      }
    }
  } catch (error) {
    handleError('Error inserting default categories', error);
  }
};

// Get all transactions
export const getTransactions = async (): Promise<Transaction[]> => {
  try {
    const db = ensureDbInitialized();

    const result = await executeSqlWithParams(db, `
      SELECT t.*, 
        CASE 
          WHEN t.isCard=1 THEN c.name 
          ELSE b.name 
        END as paymentMethodName,
        CASE 
          WHEN t.isCard=1 THEN c.cardNumber 
          ELSE b.accountNumber 
        END as paymentMethodNumber,
        CASE 
          WHEN t.isCard=0 THEN b.bankName 
          ELSE NULL 
        END as paymentMethodBankName
      FROM transactions t
      LEFT JOIN bank_accounts b ON (t.paymentMethodId = b.id AND t.isCard = 0)
      LEFT JOIN credit_cards c ON (t.paymentMethodId = c.id AND t.isCard = 1)
      ORDER BY date DESC
    `);

    const transactions: Transaction[] = [];

    for (const row of result[0].rows) {
      transactions.push({
        id: row.id,
        date: row.date,
        amount: row.amount,
        note: row.note,
        category: row.category,
        type: row.type as 'income' | 'expense',
        paymentMethod: {
          id: row.paymentMethodId,
          name: row.paymentMethodName,
          type: row.paymentMethodType,
          isCard: !!row.isCard,
          cardNumber: row.isCard ? row.paymentMethodNumber : undefined,
          accountNumber: !row.isCard ? row.paymentMethodNumber : undefined,
          bankName: row.paymentMethodBankName
        }
      });
    }

    return transactions;
  } catch (error) {
    return handleError('Error getting transactions', error) || [];
  }
};

// Add a new transaction
export const addTransaction = async (transaction: TransactionInput): Promise<Transaction | null> => {
  try {
    const db = ensureDbInitialized();

    // Validate transaction type
    if (transaction.type !== 'income' && transaction.type !== 'expense') {
      throw new Error(`Invalid transaction type: ${transaction.type}. Must be 'income' or 'expense'.`);
    }

    // Ensure transaction has required fields and a unique ID
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      ...transaction
    };

    const transactionParams = [{
      $id: newTransaction.id,
      $date: newTransaction.date,
      $amount: newTransaction.amount,
      $note: newTransaction.note || '',
      $category: newTransaction.category,
      $type: newTransaction.type,
      $paymentMethodId: newTransaction.paymentMethod.id,
      $paymentMethodType: newTransaction.paymentMethod.type,
      $isCard: newTransaction.paymentMethod.isCard ? 1 : 0
    }];

    console.log(transactionParams);

    await executeSqlWithParams(db, `
      INSERT INTO transactions (
        id, date, amount, note, category, type, paymentMethodId, paymentMethodType, isCard
      ) VALUES (
        $id, $date, $amount, $note, $category, $type, $paymentMethodId, $paymentMethodType, $isCard
      )
    `,
      transactionParams
    );

    // Update account or card balance (unless skipBalanceUpdate flag is set)
    if (!transaction._skipBalanceUpdate) {
      const adjustmentAmount = newTransaction.amount * (newTransaction.type === 'income' ? 1 : -1);

      if (newTransaction.paymentMethod.isCard) {
        await updateCreditCardBalance(newTransaction.paymentMethod.id, adjustmentAmount);
      } else {
        await updateBankAccountBalance(newTransaction.paymentMethod.id, adjustmentAmount);
      }
    }

    return newTransaction;
  } catch (error) {
    return handleError('Error adding transaction', error);
  }
};

// Update an existing transaction
export const updateTransaction = async (id: string, updatedData: Partial<Transaction>): Promise<Transaction | null> => {
  try {
    const db = ensureDbInitialized();

    // Validate transaction type if provided
    if (updatedData.type && updatedData.type !== 'income' && updatedData.type !== 'expense') {
      throw new Error(`Invalid transaction type: ${updatedData.type}. Must be 'income' or 'expense'.`);
    }

    // First get the original transaction
    const transaction = await getTransactionById(id);

    if (!transaction) {
      return null;
    }

    const originalTransaction = transaction;

    // Calculate balance adjustment if amount or type changed
    let balanceAdjustment = 0;
    const newAmount = updatedData.amount !== undefined ? updatedData.amount : originalTransaction.amount;
    const newType = updatedData.type || originalTransaction.type;

    // Calculate the actual difference between old and new values
    const originalEffect = originalTransaction.type === 'income' ? originalTransaction.amount : -originalTransaction.amount;
    const newEffect = newType === 'income' ? newAmount : -newAmount;
    balanceAdjustment = newEffect - originalEffect;

    // If payment method changed, we need to adjust both accounts
    if (updatedData.paymentMethod &&
      (updatedData.paymentMethod.id !== originalTransaction.paymentMethod.id ||
        updatedData.paymentMethod.isCard !== originalTransaction.paymentMethod.isCard)) {

      // Reverse original transaction
      if (originalTransaction.paymentMethod.isCard) {
        await updateCreditCardBalance(originalTransaction.paymentMethod.id, -originalEffect);
      } else {
        await updateBankAccountBalance(originalTransaction.paymentMethod.id, -originalEffect);
      }

      // Apply to new payment method
      if (updatedData.paymentMethod.isCard) {
        await updateCreditCardBalance(updatedData.paymentMethod.id, newEffect);
      } else {
        await updateBankAccountBalance(updatedData.paymentMethod.id, newEffect);
      }
    } else if (balanceAdjustment !== 0) {
      // Just adjust the current payment method if amount or type changed
      if (originalTransaction.paymentMethod.isCard) {
        await updateCreditCardBalance(originalTransaction.paymentMethod.id, balanceAdjustment);
      } else {
        await updateBankAccountBalance(originalTransaction.paymentMethod.id, balanceAdjustment);
      }
    }

    // Update the transaction
    const updateFields = [];
    const updateValues: any = {};

    if (updatedData.date !== undefined) {
      updateFields.push('date = $date');
      updateValues['$date'] = updatedData.date;
    }

    if (updatedData.amount !== undefined) {
      updateFields.push('amount = $amount');
      updateValues['$amount'] = updatedData.amount;
    }

    if (updatedData.note !== undefined) {
      updateFields.push('note = $note');
      updateValues['$note'] = updatedData.note;
    }

    if (updatedData.category !== undefined) {
      updateFields.push('category = $category');
      updateValues['$category'] = updatedData.category;
    }

    if (updatedData.type !== undefined) {
      updateFields.push('type = $type');
      updateValues['$type'] = updatedData.type;
    }

    if (updatedData.paymentMethod !== undefined) {
      updateFields.push('paymentMethodId = $paymentMethodId');
      updateValues['$paymentMethodId'] = (updatedData.paymentMethod.id);

      updateFields.push('paymentMethodType = $paymentMethodType');
      updateValues['$paymentMethodType'] = (updatedData.paymentMethod.type);

      updateFields.push('isCard = $isCard');
      updateValues['$isCard'] = (updatedData.paymentMethod.isCard ? 1 : 0);
    }

    if (updateFields.length > 0) {
      updateValues['$id'] = (id);
      await executeSqlWithParams(db, `
        UPDATE transactions 
        SET ${updateFields.join(', ')} 
        WHERE id = $id
      `, [updateValues]);
    }

    // Get the updated transaction
    return await getTransactionById(id);
  } catch (error) {
    return handleError('Error updating transaction', error);
  }
};

// Get a single transaction by id
export const getTransactionById = async (id: string): Promise<Transaction | null> => {
  try {
    const db = ensureDbInitialized();

    const result: SQLResultSet[] = await executeSqlWithParams(db, `
      SELECT t.*, 
        CASE 
          WHEN t.isCard=1 THEN c.name 
          ELSE b.name 
        END as paymentMethodName,
        CASE 
          WHEN t.isCard=1 THEN c.cardNumber 
          ELSE b.accountNumber 
        END as paymentMethodNumber,
        CASE 
          WHEN t.isCard=0 THEN b.bankName 
          ELSE NULL 
        END as paymentMethodBankName
      FROM transactions t
      LEFT JOIN bank_accounts b ON (t.paymentMethodId = b.id AND t.isCard = 0)
      LEFT JOIN credit_cards c ON (t.paymentMethodId = c.id AND t.isCard = 1)
      WHERE t.id = $id
    `, [{ $id: id }]);

    if (result[0].rows.length === 0) {
      return null;
    }

    const row = result[0].rows[0];
    return {
      id: row.id,
      date: row.date,
      amount: row.amount,
      note: row.note,
      category: row.category,
      type: row.type as 'income' | 'expense',
      paymentMethod: {
        id: row.paymentMethodId,
        name: row.paymentMethodName,
        type: row.paymentMethodType,
        isCard: !!row.isCard,
        cardNumber: row.isCard ? row.paymentMethodNumber : undefined,
        accountNumber: !row.isCard ? row.paymentMethodNumber : undefined,
        bankName: row.paymentMethodBankName
      }
    };
  } catch (error) {
    return handleError('Error getting transaction', error);
  }
};

// Delete a transaction
export const deleteTransaction = async (id: string): Promise<boolean> => {
  try {
    const db = ensureDbInitialized();

    // First get the transaction to know how to adjust balances
    const transaction = await getTransactionById(id);

    if (!transaction) {
      return false;
    }

    // Adjust the balance in reverse
    const adjustmentAmount = transaction.amount * (transaction.type === 'income' ? -1 : 1);

    if (transaction.paymentMethod.isCard) {
      await updateCreditCardBalance(transaction.paymentMethod.id, adjustmentAmount);
    } else {
      await updateBankAccountBalance(transaction.paymentMethod.id, adjustmentAmount);
    }

    // Delete the transaction
    await executeSqlWithParams(db, 'DELETE FROM transactions WHERE id = $id', [{ $id: id }]);

    return true;
  } catch (error) {
    handleError('Error deleting transaction', error);
    return false;
  }
};

// Get all categories
export const getCategories = async (): Promise<Categories> => {
  try {
    const db = ensureDbInitialized();

    const result = await executeSqlWithParams(db, 'SELECT * FROM categories');
    const categories: Categories = {
      income: [],
      expense: []
    };

    if (result[0].rows.length == 0) {
      await insertDefaultCategories();
      return await getCategories();
    } else {
      for (const row of result[0].rows) {
        const { type, name }: { type: string, name: string } = row;
        if (type === 'income' || type === 'expense') {
          categories[type].push(name);
        }
      }

      return categories;
    }
  } catch (error) {
    handleError('Error getting categories', error);
    return defaultCategories;
  }
};

// Add a new category
export const addCategory = async (type: 'income' | 'expense', categoryName: string): Promise<Categories | null> => {
  try {
    const db = ensureDbInitialized();

    // Validate inputs
    if (type !== 'income' && type !== 'expense') {
      throw new Error(`Invalid category type: ${type}. Must be 'income' or 'expense'.`);
    }

    if (!categoryName || categoryName.trim() === '') {
      throw new Error('Category name cannot be empty');
    }

    // Check if category already exists
    const existingResult = await executeSqlWithParams(
      db,
      'SELECT COUNT(*) as count FROM categories WHERE type = $type AND name = $name',
      [{ $type: type, $name: categoryName }]
    );

    if (existingResult[0].rows[0]['COUNT(*)'] === 0) {
      // Add new category
      await executeSqlWithParams(
        db,
        'INSERT INTO categories (type, name) VALUES ($type, $name)',
        [{ $type: type, $name: categoryName }]
      );
    }

    return await getCategories();
  } catch (error) {
    return handleError('Error adding category', error);
  }
};

// Bank account operations
export const saveBankAccounts = async (updatedAccounts: BankAccount[]): Promise<boolean> => {
  try {
    const db = ensureDbInitialized();

    // Validate inputs
    if (!Array.isArray(updatedAccounts)) {
      throw new Error('Expected an array of bank accounts');
    }

    // First delete all existing accounts
    await executeSqlWithoutParams(db, 'DELETE FROM bank_accounts');

    // Then insert each account
    for (const account of updatedAccounts) {
      if (!account.id || !account.name) {
        throw new Error('Bank account missing required fields (id, name)');
      }

      await executeSqlWithParams(db, `
        INSERT INTO bank_accounts (id, name, accountNumber, bankName, balance, type)
        VALUES ($id, $name, $accountNumber, $bankName, $balance, $type)
      `, [{
        $id: account.id,
        $name: account.name,
        $accountNumber: account.accountNumber,
        $bankName: account.bankName,
        $balance: account.balance,
        $type: account.type
      }]);
    }

    console.log('Bank accounts saved successfully');
    return true;
  } catch (error) {
    handleError('Failed to save bank accounts', error, true);
    return false;
  }
};

export const updateBankAccountBalance = async (
  accountId: string,
  balanceAdjustment: number
): Promise<boolean> => {
  try {
    const db = ensureDbInitialized();

    if (!accountId) {
      throw new Error('Account ID is required');
    }

    const checkResult = await executeSqlWithParams(
      db,
      'SELECT COUNT(*) as count FROM bank_accounts WHERE id = $id',
      [{ $id: accountId }]
    );

    if (checkResult[0].rows[0]['COUNT(*)'] === 0) {
      throw new Error(`Bank account with ID ${accountId} not found`);
    }

    await executeSqlWithParams(db, `
      UPDATE bank_accounts 
      SET balance = balance + $adjustment 
      WHERE id = $id
    `, [{ $adjustment: balanceAdjustment, $id: accountId }]);

    return true;
  } catch (error) {
    handleError('Failed to update bank account balance', error, true);
    return false;
  }
};

export const getBankAccounts = async (): Promise<BankAccount[]> => {
  try {
    const db = ensureDbInitialized();

    const result = await executeSqlWithParams(db, 'SELECT * FROM bank_accounts');

    const accounts: BankAccount[] = [];

    for (const row of result[0].rows) {
      accounts.push({
        id: row.id,
        name: row.name,
        accountNumber: row.accountNumber,
        bankName: row.bankName,
        balance: row.balance,
        type: row.type as 'checking' | 'savings' | 'credit' | 'investment'
      });
    }

    return accounts;
  } catch (error) {
    return handleError('Error getting bank accounts', error) || [];
  }
};

// Credit card operations
export const saveCreditCards = async (updatedCards: CreditCard[]): Promise<boolean> => {
  try {
    const db = ensureDbInitialized();

    // Validate inputs
    if (!Array.isArray(updatedCards)) {
      throw new Error('Expected an array of credit cards');
    }

    // First delete all existing cards
    await executeSqlWithoutParams(db, 'DELETE FROM credit_cards');

    // Then insert each card
    for (const card of updatedCards) {
      if (!card.id || !card.name) {
        throw new Error('Credit card missing required fields (id, name)');
      }

      await executeSqlWithParams(db, `
        INSERT INTO credit_cards (id, name, cardNumber, creditBalance, creditLimit)
        VALUES ($id, $name, $cardNumber, $creditBalance, $creditLimit)
      `, [{
        $id: card.id,
        $name: card.name,
        $cardNumber: card.cardNumber,
        $creditBalance: card.creditBalance,
        $creditLimit: card.creditLimit
      }]);
    }

    console.log('Credit cards saved successfully');
    return true;
  } catch (error) {
    handleError('Failed to save credit cards', error, true);
    return false;
  }
};

export const updateCreditCardBalance = async (
  cardId: string,
  balanceAdjustment: number
): Promise<boolean> => {
  try {
    const db = ensureDbInitialized();

    // Validate inputs
    if (!cardId) {
      throw new Error('Card ID is required');
    }

    // Check if card exists first
    const checkResult = await executeSqlWithParams(
      db,
      'SELECT COUNT(*) as count FROM credit_cards WHERE id = $id',
      [{ $id: cardId }]
    );

    if (checkResult[0].rows[0]['COUNT(*)'] === 0) {
      throw new Error(`Credit card with ID ${cardId} not found`);
    }

    await executeSqlWithParams(db, `
      UPDATE credit_cards 
      SET creditBalance = creditBalance + $adjustment 
      WHERE id = $id
    `, [{ $adjustment: balanceAdjustment, $id: cardId }]);

    return true;
  } catch (error) {
    handleError('Failed to update credit card balance', error, true);
    return false;
  }
};

export const getCreditCards = async (): Promise<CreditCard[]> => {
  try {
    const db = ensureDbInitialized();

    const result = await executeSqlWithParams(db, 'SELECT * FROM credit_cards');

    const cards: CreditCard[] = [];

    for (const row of result[0].rows) {
      cards.push({
        id: row.id,
        name: row.name,
        cardNumber: row.cardNumber,
        creditBalance: row.creditBalance,
        creditLimit: row.creditLimit
      });
    }

    return cards;
  } catch (error) {
    return handleError('Error getting credit cards', error) || [];
  }
};

// Statistics operations
export const getMonthlyStats = async (month: number, year: number): Promise<MonthlyStats> => {
  try {
    const db = ensureDbInitialized();

    // Format date strings for query using our helper
    const startDate = formatDateForSql(new Date(year, month, 1));
    const endDate = formatDateForSql(new Date(year, month + 1, 0)) + ' 23:59:59';

    // Get all transactions for the month
    const transactionsResult = await executeSqlWithParams(db, `
      SELECT t.*, 
        CASE 
          WHEN t.isCard=1 THEN c.name 
          ELSE b.name 
        END as paymentMethodName,
        CASE 
          WHEN t.isCard=1 THEN c.cardNumber 
          ELSE b.accountNumber 
        END as paymentMethodNumber,
        CASE 
          WHEN t.isCard=0 THEN b.bankName 
          ELSE NULL 
        END as paymentMethodBankName
      FROM transactions t
      LEFT JOIN bank_accounts b ON (t.paymentMethodId = b.id AND t.isCard = 0)
      LEFT JOIN credit_cards c ON (t.paymentMethodId = c.id AND t.isCard = 1)
      WHERE substr(t.date, 1, 10) BETWEEN $startDate AND substr($endDate, 1, 10)
      ORDER BY t.date DESC
    `, [{ $startDate: startDate, $endDate: endDate }]);

    const transactions: Transaction[] = [];
    let income = 0;
    let expense = 0;

    for (const row of transactionsResult[0].rows) {
      // Calculate totals
      if (row.type === 'income') {
        income += row.amount;
      } else {
        expense += row.amount;
      }

      transactions.push({
        id: row.id,
        date: row.date,
        amount: row.amount,
        note: row.note,
        category: row.category,
        type: row.type as 'income' | 'expense',
        paymentMethod: {
          id: row.paymentMethodId,
          name: row.paymentMethodName,
          type: row.paymentMethodType,
          isCard: !!row.isCard,
          cardNumber: row.isCard ? row.paymentMethodNumber : undefined,
          accountNumber: !row.isCard ? row.paymentMethodNumber : undefined,
          bankName: row.paymentMethodBankName
        }
      });
    }

    return {
      income,
      expense,
      balance: income - expense,
      transactions
    };
  } catch (error) {
    handleError('Error getting monthly stats', error);
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
    const db = ensureDbInitialized();

    const startDate = formatDateForSql(new Date(year, 0, 1));
    const endDate = formatDateForSql(new Date(year, 11, 31)) + ' 23:59:59';

    // Initialize empty months
    const monthlyData: MonthData[] = Array(12)
      .fill(0)
      .map((_, index) => ({
        month: index,
        income: 0,
        expense: 0,
        balance: 0
      }));

    // Get all transactions for the year
    const result = await executeSqlWithParams(db, `
      SELECT 
        cast(strftime('%m', substr(date, 1, 10)) as integer) as month,
        type,
        SUM(amount) as total
      FROM transactions
      WHERE substr(date, 1, 10) BETWEEN $startDate AND substr($endDate, 1, 10)
      GROUP BY strftime('%m', substr(date, 1, 10)), type
    `, [{ $startDate: startDate, $endDate: endDate }]);

    // Process the aggregated results
    for (const row of result[0].rows) {
      const monthIndex = row.month - 1; // Convert from 1-12 to 0-11

      if (row.type === 'income') {
        monthlyData[monthIndex].income = row.total;
      } else {
        monthlyData[monthIndex].expense = row.total;
      }

      // Recalculate balance
      monthlyData[monthIndex].balance =
        monthlyData[monthIndex].income - monthlyData[monthIndex].expense;
    }

    return monthlyData;
  } catch (error) {
    return handleError('Error getting yearly stats', error) || [];
  }
};

// Support for the skip balance update flag
export const rawExecute = async (query: string, params: any[] = []): Promise<boolean> => {
  try {
    const db = ensureDbInitialized();
    await executeSqlWithParams(db, query, params);
    return true;
  } catch (error) {
    handleError('Error executing raw SQL', error);
    return false;
  }
};

// Backup and restore
export const exportData = async (): Promise<string | null> => {
  try {
    const transactions = await getTransactions();
    const categories = await getCategories();
    const bankAccounts = await getBankAccounts();
    const creditCards = await getCreditCards();

    const backupData: BackupData = {
      transactions,
      categories,
      bankAccounts,  // Include bank accounts in backup
      creditCards,   // Include credit cards in backup
      exportDate: new Date().toISOString()
    };

    return JSON.stringify(backupData);
  } catch (error) {
    return handleError('Error exporting data', error);
  }
};

export const importData = async (jsonString: string): Promise<boolean> => {
  try {
    const db = ensureDbInitialized();

    let backupData: BackupData;
    try {
      backupData = JSON.parse(jsonString) as BackupData;
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error('Invalid backup data format. Could not parse JSON.');
    }

    // Validate backup data structure
    if (!backupData || !backupData.categories || !backupData.transactions) {
      throw new Error('Backup data is missing required fields (categories, transactions)');
    }

    try {
      // Clear all existing data
      await executeSqlWithParams(db, 'DELETE FROM transactions', []);
      await executeSqlWithParams(db, 'DELETE FROM categories', []);
      await executeSqlWithParams(db, 'DELETE FROM bank_accounts', []);
      await executeSqlWithParams(db, 'DELETE FROM credit_cards', []);

      // Import categories
      if (backupData.categories) {
        const validTypes: Array<keyof Categories> = ['income', 'expense'];
        for (const type of Object.keys(backupData.categories)) {
          if (validTypes.includes(type as keyof Categories)) {
            const categoryType = type as keyof Categories;
            for (const name of backupData.categories[categoryType]) {
              if (name) { // Check for null/undefined
                try {
                  await executeSqlWithParams(
                    db,
                    'INSERT INTO categories (type, name) VALUES ($type, $name)',
                    [{ $type: type, $name: name }]
                  );
                } catch (error) {
                  console.error(`Error inserting category ${name}:`, error);
                  // Continue despite error
                }
              }
            }
          }
        }
      }

      // Import bank accounts
      if (backupData.bankAccounts && Array.isArray(backupData.bankAccounts)) {
        for (const account of backupData.bankAccounts) {
          if (account && account.id) {
            try {
              await executeSqlWithParams(db, `
                INSERT INTO bank_accounts (id, name, accountNumber, bankName, balance, type)
                VALUES ($id, $name, $accountNumber, $bankName, $balance, $type)
              `, [{
                $id: account.id,
                $name: account.name,
                $accountNumber: account.accountNumber,
                $bankName: account.bankName,
                $balance: account.balance,
                $type: account.type
              }]);
            } catch (error) {
              console.error(`Error inserting bank account ${account.id}:`, error);
              // Continue despite error
            }
          }
        }
      }

      // Import credit cards
      if (backupData.creditCards && Array.isArray(backupData.creditCards)) {
        for (const card of backupData.creditCards) {
          if (card && card.id) {
            try {
              await executeSqlWithParams(db, `
                INSERT INTO credit_cards (id, name, cardNumber, creditBalance, creditLimit)
                VALUES ($id, $name, $cardNumber, $creditBalance, $creditLimit)
              `, [{
                $id: card.id,
                $name: card.name,
                $cardNumber: card.cardNumber,
                $creditBalance: card.creditBalance,
                $creditLimit: card.creditLimit
              }]);
            } catch (error) {
              console.error(`Error inserting credit card ${card.id}:`, error);
              // Continue despite error
            }
          }
        }
      }

      // Import transactions
      if (backupData.transactions && Array.isArray(backupData.transactions)) {
        for (const transaction of backupData.transactions) {
          if (transaction && transaction.id) {
            const type = transaction.type === 'income' || transaction.type === 'expense'
              ? transaction.type
              : 'expense'; // Default to expense if invalid

            try {
              await executeSqlWithParams(db, `
                INSERT INTO transactions (
                  id, date, amount, note, category, type, paymentMethodId, paymentMethodType, isCard
                ) VALUES ($id, $date, $amount, $note, $category, $type, $paymentMethodId, $paymentMethodType, $isCard)
              `, [{
                $id: transaction.id,
                $date: transaction.date,
                $amount: transaction.amount,
                $note: transaction.note || '',
                $category: transaction.category,
                $type: type,
                $paymentMethodId: transaction.paymentMethod.id,
                $paymentMethodType: transaction.paymentMethod.type,
                $isCard: transaction.paymentMethod.isCard ? 1 : 0
              }]);
            } catch (error) {
              console.error(`Error inserting transaction ${transaction.id}:`, error);
              // Continue despite error
            }
          }
        }
      }

      console.log('Import completed successfully');
      return true;
    } catch (error) {
      console.error('Error during import:', error);
      throw error;
    }
  } catch (error) {
    handleError('Error importing data', error, true);
    return false;
  }
};

// Close database connection
export const closeDatabase = async (): Promise<void> => {
  // With expo-sqlite, we don't need to explicitly close the database
  // as it handles connection management automatically
  db = null;
  console.log('Database reference cleared');
};