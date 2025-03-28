// screens/CreditCardsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { NavigationParamList } from '../types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CreditCard } from '../types';
// import { saveCreditCards, getCreditCards } from '@/storage/storageService';
import { saveCreditCards, getCreditCards } from '@/storage/sqliteService';

type CreditCardsScreenProps = {
  navigation: StackNavigationProp<NavigationParamList, 'CreditCards'>;
};

const CreditCardsScreen: React.FC<CreditCardsScreenProps> = ({ navigation }) => {
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCard, setCurrentCard] = useState<Partial<CreditCard>>({
    name: '',
    cardNumber: '',
    creditLimit: 0,
    creditBalance: 0
  });

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      setLoading(true);
      const storedCards = await getCreditCards();
      if (storedCards) {
        setCards(storedCards);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load credit cards');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = async () => {
    if (!currentCard.name || !currentCard.cardNumber) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (isEditing && currentCard.id) {
      // Update existing card
      const updatedCards = cards.map(card => 
        card.id === currentCard.id ? currentCard as CreditCard : card
      );
      
      const saved = await saveCreditCards(updatedCards);
      if (saved) {
        setCards(updatedCards);
        setModalVisible(false);
        resetCardForm();
        Alert.alert('Success', 'Credit card updated successfully');
      }
    } else {
      // Add new card
      const cardToAdd: CreditCard = {
        id: Date.now().toString(),
        name: currentCard.name || '',
        cardNumber: currentCard.cardNumber || '',
        creditLimit: currentCard.creditLimit || 0,
        creditBalance: currentCard.creditBalance || 0
      };

      const updatedCards = [...cards, cardToAdd];
      const saved = await saveCreditCards(updatedCards);
      
      if (saved) {
        setCards(updatedCards);
        setModalVisible(false);
        resetCardForm();
        Alert.alert('Success', 'Credit Card added successfully');
      }
    }
  };

  const handleDeleteCard = async (id: string) => {
    Alert.alert(
      'Delete Card',
      'Are you sure you want to remove this card? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          onPress: async () => {
            const updatedCards = cards.filter(card => card.id !== id);
            const saved = await saveCreditCards(updatedCards);
            if (saved) {
              setCards(updatedCards);
              Alert.alert('Success', 'Credit Card removed successfully');
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  const resetCardForm = () => {
    setCurrentCard({
      name: '',
      cardNumber: '',
      creditLimit: 0,
      creditBalance: 0
    });
    setIsEditing(false);
  };

  const openAddCardModal = () => {
    resetCardForm();
    setIsEditing(false);
    setModalVisible(true);
  };

  const openEditCardModal = (card: CreditCard) => {
    setCurrentCard(card);
    setIsEditing(true);
    setModalVisible(true);
  };

  const renderCardItem = ({ item }: { item: CreditCard }) => {
    return (
      <TouchableOpacity onPress={() => openEditCardModal(item)}>
        <View style={styles.cardCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIcon}>
              <Ionicons name='card-outline' size={24} color="#3498db" />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.cardNumber}>•••• {item.cardNumber.slice(-4)}</Text>
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteCard(item.id)}
            >
              <Ionicons name="trash-outline" size={20} color="#e74c3c" />
            </TouchableOpacity>
          </View>
          <View style={styles.cardDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Card</Text>
              <Text style={styles.detailValue}>{item.name}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Credit Limit</Text>
              <Text style={styles.creditLimitValue}>₹{item.creditLimit.toFixed(2)}</Text>
            </View>
            {item.creditBalance ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Credit Balance</Text>
                <Text style={styles.creditLimitValue}>₹{item.creditBalance.toFixed(2)}</Text>
              </View>
            ) : null}
          </View>
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
          <Text style={styles.headerTitle}>Credit Cards</Text>
          <TouchableOpacity onPress={openAddCardModal}>
            <Ionicons name="add-circle" size={24} color="#3498db" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3498db" />
          </View>
        ) : cards.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="wallet-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No credit cards added yet</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={openAddCardModal}
            >
              <Text style={styles.addButtonText}>Add Your First Card</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={cards}
            renderItem={renderCardItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
          />
        )}

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(false);
            resetCardForm();
          }}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {isEditing ? 'Edit Credit Card' : 'Add Credit Card'}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setModalVisible(false);
                    resetCardForm();
                  }}
                >
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Card Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., HDFC"
                  value={currentCard.name}
                  onChangeText={(text) => setCurrentCard({ ...currentCard, name: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Card Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter last 4 digits"
                  value={currentCard.cardNumber}
                  onChangeText={(text) => setCurrentCard({ ...currentCard, cardNumber: text })}
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Credit Limit</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  value={currentCard.creditLimit?.toString() || ""}
                  onChangeText={(text) => setCurrentCard({ ...currentCard, creditLimit: parseFloat(text) || 0 })}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Credit Balance</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  value={currentCard.creditBalance?.toString() || ""}
                  onChangeText={(text) => setCurrentCard({ ...currentCard, creditBalance: parseFloat(text) || 0 })}
                  keyboardType="numeric"
                />
              </View>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleAddCard}
              >
                <Text style={styles.saveButtonText}>
                  {isEditing ? 'Update Card' : 'Save Card'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  listContainer: {
    padding: 15,
  },
  cardCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cardIcon: {
    backgroundColor: '#ecf0f1',
    padding: 10,
    borderRadius: 25,
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  cardNumber: {
    fontSize: 12,
    color: '#999',
  },
  deleteButton: {
    padding: 8,
  },
  cardDetails: {
    padding: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  creditLimitValue: {
    fontSize: 16,
    color: '#2ecc71',
    fontWeight: '600',
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
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  inputGroup: {
    marginBottom: 15,
  }, 
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#f9f9f9',
  },
  typeButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  typeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#f0f0f0',
  },
  selectedTypeButton: {
    backgroundColor: '#3498db',
  },
  typeButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  selectedTypeButtonText: {
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreditCardsScreen;