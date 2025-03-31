// types/index.ts

export interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  isCard?: boolean;
  cardNumber?: string;
  accountNumber?: string;
  bankName?: string;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  paymentMethod: PaymentMethod
  note?: string;
  date: string;
}

export interface TransactionInput extends Omit<Transaction, 'id' | 'date'> {
  _skipBalanceUpdate?: boolean;
}

export interface Categories {
  expense: string[];
  income: string[];
}

export interface MonthlyStats {
  income: number;
  expense: number;
  balance: number;
  transactions: Transaction[];
}

export interface MonthData {
  month: number;
  income: number;
  expense: number;
  balance: number;
}

export type TabParamList = {
  Home: undefined;
  Balance: undefined;
};

export type NavigationParamList = {
  TabHome: undefined;
  Transactions: undefined;
  AddTransaction: undefined;
  TransactionDetail: { transaction: Transaction };
  Settings: undefined;
  Statistics: undefined;
  BankAccounts: undefined;
  CreditCards: undefined;
  AccountStatement: {
    item: BankAccount | CreditCard;
    itemType: 'bank' | 'credit';
  };
};

export type BankAccount = {
  id: string;
  name: string;
  accountNumber: string;
  bankName: string;
  balance: number;
  type: 'checking' | 'savings' | 'credit' | 'investment';
};


export type CreditCard = {
  id: string;
  name: string;
  cardNumber: string;
  creditLimit: number;
  creditBalance: number;
};

export interface BackupData {
  transactions: Transaction[];
  categories: Categories;
  bankAccounts?: BankAccount[];  // Added
  creditCards?: CreditCard[];    // Added
  exportDate: string;
}

export interface SQLResultSet {
  insertId?: number;
  rowsAffected: number;
  rows: {
    length: number;
    _array: any[];
    item: (idx: number) => any;
  };
}