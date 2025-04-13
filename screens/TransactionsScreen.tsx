import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ListRenderItemInfo,
  Modal,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { getTransactions, getBankAccounts, getCreditCards } from '@/storage/sqliteService';
import TransactionItem from '../components/TransactionItems';
import { Transaction, NavigationParamList, PaymentMethod } from '../types';
import { SafeAreaView } from 'react-native-safe-area-context';

type TransactionsScreenProps = {
  navigation: StackNavigationProp<NavigationParamList, 'Transactions'>;
};

// Available filter options (these would typically come from your data)
const TYPE_OPTIONS = ['income', 'expense'];
const CATEGORY_OPTIONS = ['Food', 'Transportation', 'Housing', 'Entertainment', 'Healthcare', 'Shopping', 'Salary', 'Investment'];

type FilterDrawerType = 'type' | 'category' | 'paymentMode' | null;

const TransactionsScreen: React.FC<TransactionsScreenProps> = ({ navigation }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [basicFilter, setBasicFilter] = useState<'all' | 'income' | 'expense'>('all');
  
  // Payment methods from SQLite
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  
  // Selected filters
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPaymentModes, setSelectedPaymentModes] = useState<string[]>([]);
  
  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState<FilterDrawerType>(null);

  const loadTransactions = async () => {
    setLoading(true);
    const allTransactions = await getTransactions();

    // Sort by date (newest first)
    allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setTransactions(allTransactions);
    setLoading(false);
  };

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);

      const storedAccounts = await getBankAccounts();
      const storedCards = await getCreditCards();

      setPaymentMethods([...(storedAccounts as PaymentMethod[]), ...(storedCards as PaymentMethod[])]);
    } catch (error) {
      console.error('Failed to load payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([loadTransactions(), loadPaymentMethods()]);
    };

    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });

    return unsubscribe;
  }, [navigation]);

  const filteredTransactions = () => {
    let result = transactions;

    // Apply basic filter
    if (basicFilter !== 'all') {
      result = result.filter(t => t.type === basicFilter);
    }

    // Apply advanced filters if any are selected
    if (selectedTypes.length > 0) {
      result = result.filter(t => selectedTypes.includes(t.type));
    }

    if (selectedCategories.length > 0) {
      result = result.filter(t => selectedCategories.includes(t.category));
    }

    if (selectedPaymentModes.length > 0) {
      result = result.filter(t => selectedPaymentModes.includes(t.paymentMethod.id.toString()));
    }

    return result;
  };

  const openDrawer = (type: FilterDrawerType) => {
    setActiveDrawer(type);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setActiveDrawer(null);
  };

  const toggleFilterSelection = (option: string, type: FilterDrawerType) => {
    if (!type) return;

    switch (type) {
      case 'type':
        setSelectedTypes(prev => 
          prev.includes(option) 
            ? prev.filter(item => item !== option) 
            : [...prev, option]
        );
        break;
      case 'category':
        setSelectedCategories(prev => 
          prev.includes(option) 
            ? prev.filter(item => item !== option) 
            : [...prev, option]
        );
        break;
      case 'paymentMode':
        setSelectedPaymentModes(prev => 
          prev.includes(option) 
            ? prev.filter(item => item !== option) 
            : [...prev, option]
        );
        break;
    }
  };

  const getActiveOptions = () => {
    switch (activeDrawer) {
      case 'type':
        return TYPE_OPTIONS;
      case 'category':
        return CATEGORY_OPTIONS;
      case 'paymentMode':
        // Return payment method options from the database
        return paymentMethods.map(method => method.id.toString());
      default:
        return [];
    }
  };

  const getSelectedOptions = () => {
    switch (activeDrawer) {
      case 'type':
        return selectedTypes;
      case 'category':
        return selectedCategories;
      case 'paymentMode':
        return selectedPaymentModes;
      default:
        return [];
    }
  };

  // Helper to get payment method name by ID
  const getPaymentMethodName = (id: string) => {
    const method = paymentMethods.find(m => m.id.toString() === id);
    return method ? method.name : id;
  };

  const renderFilterTags = () => {
    const allTags = [
      ...selectedTypes.map(type => ({ type: 'type', value: type, display: type })),
      ...selectedCategories.map(category => ({ type: 'category', value: category, display: category })),
      ...selectedPaymentModes.map(mode => ({ 
        type: 'paymentMode', 
        value: mode, 
        display: getPaymentMethodName(mode)
      }))
    ];

    if (allTags.length === 0) return null;

    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.tagsContainer}
        contentContainerStyle={styles.tagsContentContainer}
      >
        {allTags.map((tag, index) => (
          <TouchableOpacity 
            key={`${tag.type}-${tag.value}-${index}`}
            style={styles.tag}
            onPress={() => toggleFilterSelection(tag.value, tag.type as FilterDrawerType)}
          >
            <Text style={styles.tagText}>{tag.display}</Text>
            <Ionicons name="close-circle" size={16} color="#666" />
          </TouchableOpacity>
        ))}
        
        {allTags.length > 0 && (
          <TouchableOpacity 
            style={styles.clearAllTag}
            onPress={() => {
              setSelectedTypes([]);
              setSelectedCategories([]);
              setSelectedPaymentModes([]);
            }}
          >
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    );
  };

  const renderItem = ({ item }: ListRenderItemInfo<Transaction>) => (
    <TransactionItem
      transaction={item}
      onPress={() => navigation.navigate('TransactionDetail', { transaction: item })}
    />
  );

  // Render payment method option item with proper display name
  const renderPaymentMethodOption = (optionId: string) => {
    const method = paymentMethods.find(m => m.id.toString() === optionId);
    
    return (
      <TouchableOpacity
        key={optionId}
        style={styles.optionItem}
        onPress={() => toggleFilterSelection(optionId, activeDrawer)}
      >
        <View style={styles.checkboxContainer}>
          <View style={[
            styles.checkbox,
            getSelectedOptions().includes(optionId) && styles.checkboxSelected
          ]}>
            {getSelectedOptions().includes(optionId) && (
              <Ionicons name="checkmark" size={16} color="#fff" />
            )}
          </View>
          <Text style={styles.optionText}>{method ? method.name : optionId}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transactions</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.advancedFiltersContainer}>
          <TouchableOpacity
            style={[
              styles.advancedFilterButton,
              selectedTypes.length > 0 && styles.advancedFilterActive
            ]}
            onPress={() => openDrawer('type')}
          >
            <Text style={styles.advancedFilterText}>Type</Text>
            <Ionicons name="chevron-down" size={16} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.advancedFilterButton,
              selectedCategories.length > 0 && styles.advancedFilterActive
            ]}
            onPress={() => openDrawer('category')}
          >
            <Text style={styles.advancedFilterText}>Category</Text>
            <Ionicons name="chevron-down" size={16} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.advancedFilterButton,
              selectedPaymentModes.length > 0 && styles.advancedFilterActive
            ]}
            onPress={() => openDrawer('paymentMode')}
          >
            <Text style={styles.advancedFilterText}>Payment Mode</Text>
            <Ionicons name="chevron-down" size={16} color="#666" />
          </TouchableOpacity>
        </View>

        {renderFilterTags()}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3498db" />
          </View>
        ) : filteredTransactions().length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No transactions found</Text>
          </View>
        ) : (
          <FlatList
            data={filteredTransactions()}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.transactionsList}
          />
        )}
      </View>

      {/* Filter Drawer Modal */}
      <Modal
        visible={drawerOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={closeDrawer}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeDrawer}
        >
          <View style={styles.drawerContainer}>
            <View style={styles.drawerHandle} />
            
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>
                {activeDrawer === 'type' ? 'Select Types' : 
                 activeDrawer === 'category' ? 'Select Categories' : 
                 activeDrawer === 'paymentMode' ? 'Select Payment Methods' : ''}
              </Text>
              <TouchableOpacity onPress={closeDrawer}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.optionsContainer}>
              {activeDrawer === 'paymentMode' ? (
                // Render payment methods with proper names
                getActiveOptions().map((optionId) => renderPaymentMethodOption(optionId))
              ) : (
                // Render normal options for type and category
                getActiveOptions().map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={styles.optionItem}
                    onPress={() => toggleFilterSelection(option, activeDrawer)}
                  >
                    <View style={styles.checkboxContainer}>
                      <View style={[
                        styles.checkbox,
                        getSelectedOptions().includes(option) && styles.checkboxSelected
                      ]}>
                        {getSelectedOptions().includes(option) && (
                          <Ionicons name="checkmark" size={16} color="#fff" />
                        )}
                      </View>
                      <Text style={styles.optionText}>{option}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}

              {activeDrawer === 'paymentMode' && paymentMethods.length === 0 && (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No payment methods found</Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.drawerFooter}>
              <TouchableOpacity 
                style={styles.applyButton}
                onPress={closeDrawer}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#3498db',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  advancedFiltersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  advancedFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  advancedFilterActive: {
    backgroundColor: '#e1f0fa',
    borderWidth: 1,
    borderColor: '#3498db',
  },
  advancedFilterText: {
    fontSize: 14,
    color: '#666',
    marginRight: 4,
  },
  tagsContainer: {
    maxHeight: 50,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tagsContentContainer: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e1f0fa',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#3498db',
    marginRight: 4,
  },
  clearAllTag: {
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  clearAllText: {
    fontSize: 12,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  transactionsList: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  drawerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: 300,
    maxHeight: '70%',
  },
  drawerHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#ddd',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 10,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  optionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  optionItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  drawerFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  applyButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TransactionsScreen;