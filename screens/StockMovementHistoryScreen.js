import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SORT_OPTIONS = [
  { label: 'Plus récent', value: 'desc' },
  { label: 'Moins récent', value: 'asc' },
];

export default function StockMovementHistoryScreen({ navigation }) {
  const [movements, setMovements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' = plus récent par défaut

  const fetchStockMovements = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) throw new Error("Token manquant");

      const API_BASE_URL = 'http://31.97.55.154:5000/api';
      const response = await axios.get(`${API_BASE_URL}/stock/movements`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setMovements(response.data);
    } catch (error) {
      console.error("Erreur lors de la récupération de l'historique :", error);

      let message = "Erreur inconnue";
      if (error.response) {
        if (error.response.status === 401) {
          message = "Authentification échouée. Veuillez vous reconnecter.";
        } else if (error.response.status === 404) {
          message = "Route introuvable (404). Vérifiez l'URL ou le backend.";
        } else {
          message = error.response.data?.message || "Erreur serveur.";
        }
      }

      Alert.alert("Erreur", message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStockMovements();
    const unsubscribe = navigation.addListener('focus', fetchStockMovements);
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchStockMovements();
  };

  const getMovementIconAndColor = (type) => {
    return type === 'entrée'
      ? { name: 'arrow-down-circle-outline', color: '#28a745' }
      : { name: 'arrow-up-circle-outline', color: '#dc3545' };
  };

  // Filtrage/tri par date
  const sortedMovements = [...movements].sort((a, b) => {
    const da = new Date(a.createdAt).getTime();
    const db = new Date(b.createdAt).getTime();
    return sortOrder === 'desc' ? db - da : da - db;
  });

  const renderSortOptions = () => (
    <View style={styles.sortContainer}>
      {SORT_OPTIONS.map(opt => (
        <TouchableOpacity
          key={opt.value}
          style={[
            styles.sortButton,
            sortOrder === opt.value && styles.sortButtonActive,
          ]}
          onPress={() => setSortOrder(opt.value)}
        >
          <Ionicons
            name={opt.value === 'desc' ? 'arrow-down-outline' : 'arrow-up-outline'}
            size={16}
            color={sortOrder === opt.value ? "#fff" : "#3b82f6"}
            style={{ marginRight: 4 }}
          />
          <Text style={[
            styles.sortButtonText,
            sortOrder === opt.value && { color: "#fff", fontWeight: "bold" }
          ]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderItem = ({ item }) => {
    const { name, color } = getMovementIconAndColor(item.type);

    return (
      <View style={styles.movementCard}>
        <View style={styles.cardHeader}>
          <Ionicons name={name} size={28} color={color} style={styles.movementIcon} />
          <Text style={styles.movementType}>{item.type.toUpperCase()}</Text>
        </View>

        <Text style={styles.bottleDetail}>➤ Bouteilles pleines : {item.fullBottles}</Text>
        <Text style={styles.bottleDetail}>➤ Bouteilles vides : {item.emptyBottles}</Text>
        <Text style={styles.bottleDetail}>➤ Bouteilles consignées : {item.consignedBottles}</Text>

        <Text style={styles.reasonText}>📝 Description : {item.description || 'N/A'}</Text>

        {item.user && (
          <Text style={styles.userText}>
            👤 Par : {item.user.name} ({item.user.email})
          </Text>
        )}

        <Text style={styles.dateText}>
          📅 {new Date(item.createdAt).toLocaleString()}
        </Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text>Chargement de l'historique...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.mainTitle}>Historique des Mouvements de Stock</Text>
      {renderSortOptions()}
      <FlatList
        data={sortedMovements}
        keyExtractor={(item, index) => item._id || index.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#3b82f6']}
          />
        }
        ListEmptyComponent={
          <Text style={styles.emptyListText}>Aucun mouvement de stock trouvé.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f4f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f4f8',
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 40,
  },
  sortContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginHorizontal: 5,
    backgroundColor: '#fff',
  },
  sortButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  sortButtonText: {
    color: '#3b82f6',
    fontSize: 15,
  },
  listContent: {
    paddingBottom: 20,
  },
  movementCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  movementIcon: {
    marginRight: 10,
  },
  movementType: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6c757d',
  },
  bottleDetail: {
    fontSize: 15,
    color: '#333',
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 14,
    color: '#555',
    marginTop: 8,
  },
  userText: {
    fontSize: 14,
    color: '#007bff',
    marginTop: 5,
  },
  dateText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'right',
    marginTop: 10,
  },
  emptyListText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#888',
  },
});