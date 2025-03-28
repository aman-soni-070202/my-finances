// schema.ts
import { sqliteTable, text, real, integer, index } from 'drizzle-orm/sqlite-core';
import { sql, relations } from 'drizzle-orm';
import { primaryKey, check, foreignKey } from 'drizzle-orm/sqlite-core';

// Categories table
export const categories = sqliteTable('categories', {
  type: text('type').notNull(),
  name: text('name').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.type, table.name] }),
  typeCheck: check('type_check', sql`type IN ('income', 'expense')`)
}));

// Bank accounts table
export const bankAccounts = sqliteTable('bank_accounts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  accountNumber: text('accountNumber').notNull(),
  bankName: text('bankName').notNull(),
  balance: real('balance').notNull(),
  type: text('type').notNull(),
}, (table) => ({
  typeCheck: check('account_type_check', sql`type IN ('checking', 'savings', 'credit', 'investment')`)
}));

// Credit cards table
export const creditCards = sqliteTable('credit_cards', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  cardNumber: text('cardNumber').notNull(),
  creditLimit: real('creditLimit').notNull(),
  creditBalance: real('creditBalance').notNull(),
});

// Transactions table
export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  amount: real('amount').notNull(),
  note: text('note'),
  category: text('category').notNull(),
  type: text('type').notNull(),
  paymentMethodId: text('paymentMethodId').notNull(),
  paymentMethodType: text('paymentMethodType').notNull(),
  isCard: integer('isCard', { mode: 'boolean' }).notNull(),
}, (table) => ({
  // Foreign key constraint (properly defined)
  categoryFK: foreignKey({
    columns: [table.category, table.type],
    foreignColumns: [categories.name, categories.type],
    name: 'transactions_category_fk'
  }),
  // Check constraints
  typeCheck: check('transaction_type_check', sql`type IN ('income', 'expense')`),
  isCardCheck: check('is_card_check', sql`isCard IN (0, 1)`),

  // Indexes using Drizzle's index function
  dateIdx: index('idx_transactions_date').on(table.date),
  typeIdx: index('idx_transactions_type').on(table.type),
  paymentMethodCardIdx: index('idx_transactions_card_payment').on(table.paymentMethodId)
    .where(sql`isCard = 1`),
  paymentMethodBankIdx: index('idx_transactions_bank_payment').on(table.paymentMethodId)
    .where(sql`isCard = 0`)
}));

// Drizzle relations - using the relations API
export const categoriesRelations = relations(categories, ({ many }) => ({
  transactions: many(transactions)
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  category: one(categories, {
    fields: [transactions.category, transactions.type],
    references: [categories.name, categories.type]
  })
  // Dynamic relation for payment method would need to be handled in application code
}));

// Type definitions for query returns
export type CategorySelect = typeof categories.$inferSelect;
export type BankAccountSelect = typeof bankAccounts.$inferSelect;
export type CreditCardSelect = typeof creditCards.$inferSelect;
export type TransactionSelect = typeof transactions.$inferSelect;

// Type definitions for inserts
export type NewCategory = typeof categories.$inferInsert;
export type NewBankAccount = typeof bankAccounts.$inferInsert;
export type NewCreditCard = typeof creditCards.$inferInsert;
export type NewTransaction = typeof transactions.$inferInsert;