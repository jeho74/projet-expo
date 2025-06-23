import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, Button, TextInput, StyleSheet,
  TouchableOpacity, Alert, ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const STORAGE_KEY = 'local_deliveries_v2';

const DeliveryListScreen = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [fullReturned, setFullReturned] = useState('');
  const [consigned, setConsigned] = useState('');

  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem('authToken');
    return { Authorization: `Bearer ${token}` };
  };

  const loadDeliveries = async () => {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    setDeliveries(data ? JSON.parse(data) : []);
    setIsLoading(false);
  };

  useEffect(() => { loadDeliveries(); }, []);

  const confirmCompletion = (delivery) => {
    setSelectedDelivery(delivery);
    setFullReturned('');
    setConsigned('');
    setModalVisible(true);
  };

  const finalizeDelivery = async () => {
    if (!selectedDelivery) return;

    const fullSent = selectedDelivery.fullBottlesSent;
    const fullBack = parseInt(fullReturned);
    const consignedSold = parseInt(consigned);
    const emptyBack = fullSent - fullBack - consignedSold;

    if (
      isNaN(fullBack) || isNaN(consignedSold) ||
      fullBack < 0 || consignedSold < 0 ||
      emptyBack < 0 || fullBack > fullSent
    ) {
      return Alert.alert("Erreur", "Valeurs invalides ou incohérentes.");
    }

    try {
      const headers = await getAuthHeaders();
      const deliveryId = selectedDelivery._id || selectedDelivery.id;
      let res;
      try {
        res = await api.patch(
          `/deliveries/${deliveryId}`,
          {
            fullBottlesReturned: fullBack,
            emptyBottlesReturned: emptyBack,
            consignedBottles: consignedSold,
            status: 'terminée'
          },
          { headers }
        );
      } catch {
        res = null;
      }

      let updated;
      if (res && res.data && res.data.livraison) {
        const newData = res.data.livraison;
        updated = deliveries.map(item =>
          (item._id || item.id) === deliveryId
            ? { ...item, ...newData, isSynced: true }
            : item
        );
        Alert.alert("Succès", "Livraison finalisée sur le serveur.");
      } else {
        const fullSold = fullSent - fullBack;
        updated = deliveries.map(item =>
          (item._id || item.id) === deliveryId
            ? {
              ...item,
              fullBottlesReturned: fullBack,
              emptyBottlesReturned: emptyBack,
              consignedBottles: consignedSold,
              fullBottlesSold: fullSold,
              status: 'terminée',
              updatedAt: new Date().toISOString(),
              isSynced: false
            }
            : item
        );
        Alert.alert("Succès", "Livraison finalisée localement (offline).");
      }

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setDeliveries(updated);
      setModalVisible(false);
    } catch (error) {
      Alert.alert("Erreur", "Impossible de finaliser la livraison.");
    }
  };

  const deleteDelivery = async (id) => {
    const updated = deliveries.filter(item => (item._id || item.id) !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setDeliveries(updated);
  };

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.title}>{item.driverName || 'Chauffeur inconnu'}</Text>
      <Text>Camion: {item.truckName} ({item.licensePlate})</Text>
      <Text>Bouteilles envoyées: {item.fullBottlesSent}</Text>
      <Text style={{ color: item.status === 'terminée' ? 'green' : '#000' }}>
        Statut: {item.status}
      </Text>
      <View style={styles.actions}>
        {item.status !== 'terminée' && (
          <Button title="Terminer" onPress={() => confirmCompletion(item)} />
        )}
        <TouchableOpacity onPress={() => deleteDelivery(item._id || item.id)}>
          <Text style={styles.delete}>🗑️ Supprimer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return <ActivityIndicator size="large" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>📋 Livraisons ({deliveries.length})</Text>
      <FlatList
        data={deliveries}
        keyExtractor={item => item._id ? item._id : item.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.emptyText}>Aucune livraison</Text>}
        refreshing={isLoading}
        onRefresh={loadDeliveries}
      />
      {modalVisible && selectedDelivery && (
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Finaliser Livraison</Text>
          <TextInput
            placeholder="Pleines retournées"
            value={fullReturned}
            onChangeText={setFullReturned}
            keyboardType="numeric"
            style={styles.input}
          />
          <TextInput
            placeholder="Consignées vendues"
            value={consigned}
            onChangeText={setConsigned}
            keyboardType="numeric"
            style={styles.input}
          />
          {fullReturned && consigned && (
            <Text style={{ textAlign: 'center', marginBottom: 10, color: '#555' }}>
              Vides retournées estimées : {selectedDelivery.fullBottlesSent - parseInt(fullReturned || 0) - parseInt(consigned || 0)}
            </Text>
          )}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Button title="Annuler" color="#888" onPress={() => setModalVisible(false)} />
            <Button title="Valider" onPress={finalizeDelivery} />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  header: { fontSize: 20, fontWeight: 'bold', marginVertical: 15 },
  item: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10
  },
  title: { fontWeight: 'bold', fontSize: 16, marginBottom: 5 },
  delete: { color: 'red', marginTop: 8, textAlign: 'center', padding: 5 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#888',
    fontSize: 16
  },
  modal: {
    position: 'absolute',
    top: '30%',
    left: '5%',
    right: '5%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    marginBottom: 15,
    padding: 12,
    borderRadius: 5,
    fontSize: 16
  },
});

export default DeliveryListScreen;
