import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction } from '../types';

interface TransactionItemProps {
  transaction: Transaction;
  onPress: () => void;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, onPress }) => {
  // Format date
  const date = new Date(transaction.date);
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });

  // Get icon based on category
  const getCategoryIcon = (category: string) => {
    const iconMap: Record<string, any> = {
      Food: 'fast-food' as const,
      Transport: 'car' as const,
      Entertainment: 'film' as const,
      Bills: 'receipt' as const,
      Shopping: 'cart' as const,
      Salary: 'cash' as const,
      Investments: 'trending-up' as const,
      'Side Hustle': 'briefcase' as const,
      Gifts: 'gift' as const,
      Other: 'ellipsis-horizontal' as const
    };

    return iconMap[category] || ('ellipsis-horizontal' as const);
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Ionicons
          name={getCategoryIcon(transaction.category)}
          size={20}
          color="#fff"
        />
      </View>
      <View style={styles.details}>
        <Text style={styles.category}>{transaction.category}</Text>
        {transaction.note ? (
          <Text style={styles.note} numberOfLines={1}>{transaction.note}</Text>
        ) : null}
      </View>
      <View style={styles.rightContent}>
        <Text
          style={[
            styles.amount,
            { color: transaction.type === 'expense' ? '#e74c3c' : '#2ecc71' }
          ]}
        >
          {transaction.type === 'expense' ? '-' : '+'}₹{transaction.amount.toFixed(2)}
        </Text>
        <Text style={styles.date}>{formattedDate}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  details: {
    flex: 1,
  },
  category: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2
  },
  note: {
    fontSize: 13,
    color: '#999',
  },
  rightContent: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2
  },
  date: {
    fontSize: 13,
    color: '#999',
  }
});

export default TransactionItem;