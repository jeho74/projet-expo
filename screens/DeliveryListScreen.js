import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, Button, FlatList,
  StyleSheet, Alert, TouchableOpacity, ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import uuid from 'react-native-uuid';
import api from '../services/api'; // axios instance avec baseURL + gestion token en header

const STORAGE_KEY = 'local_deliveries_v2';

const DeliveryManagerScreen = () => {
  const [drivers, setDrivers] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedTruck, setSelectedTruck] = useState('');
  const [fullBottlesSent, setFullBottlesSent] = useState('');
  const [deliveries, setDeliveries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [fullReturned, setFullReturned] = useState('');
  const [emptyReturned, setEmptyReturned] = useState('');
  const [consigned, setConsigned] = useState('');

  // Récupère token et prépare headers
  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  // Charge livraisons locales
  const loadDeliveries = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          setDeliveries(parsed);
        } else {
          setDeliveries([]);
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
      } else {
        setDeliveries([]);
      }
    } catch (e) {
      console.error('Erreur AsyncStorage:', e);
      setDeliveries([]);
    }
  };

  // Sauvegarde livraisons locales
  const saveDeliveries = async (newDeliveries) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newDeliveries));
      setDeliveries(newDeliveries);
    } catch (e) {
      console.error('Erreur sauvegarde:', e);
      Alert.alert('Erreur', 'Impossible de sauvegarder localement');
    }
  };

  // Charge chauffeurs et camions dispo
  const fetchDriversAndTrucks = async () => {
    try {
      const headers = await getAuthHeaders();
      const [usersRes, trucksRes] = await Promise.all([
        api.get('/users', { headers }),
        api.get('/trucks', { headers }),
      ]);
      setDrivers(usersRes.data.filter(u => u.role === 'driver'));
      setTrucks(trucksRes.data.filter(t => t.status === 'disponible'));
    } catch (error) {
      console.error('Erreur API ressources:', error);
      Alert.alert('Erreur', 'Impossible de charger chauffeurs et camions');
      throw error;
    }
  };

  // Synchronise livraisons locales non synchronisées vers serveur
  const syncDeliveries = async () => {
    setIsSyncing(true);
    try {
      const headers = await getAuthHeaders();
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (!data) return;
      const localDeliveries = JSON.parse(data);
      let updated = [...localDeliveries];

      for (const delivery of localDeliveries) {
        if (!delivery.isSynced) {
          try {
            if (!delivery._id) {
              // POST nouvelle livraison
              const res = await api.post('/livraisons', {
                driver: delivery.driverId,
                truck: delivery.truckId,
                fullBottlesSent: delivery.fullBottlesSent,
                emptyBottlesSent: delivery.emptyBottlesSent || 0
              }, { headers });
              updated = updated.map(d => d.id === delivery.id ? { ...res.data, isSynced: true } : d);
            } else if (delivery.status === 'terminée') {
              // PATCH livraison terminée
              await api.patch(`/livraisons/${delivery._id}`, {
                fullBottlesReturned: delivery.fullBottlesReturned || 0,
                emptyBottlesReturned: delivery.emptyBottlesReturned || 0,
                consignedBottles: delivery.consignedBottles || 0,
                status: 'terminée'
              }, { headers });
              updated = updated.map(d => d._id === delivery._id ? { ...d, isSynced: true } : d);
            }
          } catch (err) {
            // Erreur API : on ignore pour retenter plus tard
          }
        }
      }
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setDeliveries(updated);
    } catch (e) {
      console.error('Erreur sync:', e);
    }
    setIsSyncing(false);
  };

  // Initialisation au lancement
  useEffect(() => {
    (async () => {
      try {
        await loadDeliveries();
        await fetchDriversAndTrucks();
        await syncDeliveries();
      } catch (e) {
        console.error('Init error:', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Ajout nouvelle livraison (API + local fallback)
  const addDelivery = async () => {
    if (isLoading || isSyncing) return;

    const bottles = parseInt(fullBottlesSent, 10);
    if (!selectedDriver || !selectedTruck || isNaN(bottles) || bottles <= 0) {
      return Alert.alert('Erreur', 'Champs incomplets ou invalides');
    }

    const driverObj = drivers.find(d => d._id === selectedDriver);
    const truckObj = trucks.find(t => t._id === selectedTruck);

    if (!driverObj || !truckObj) {
      return Alert.alert('Erreur', 'Chauffeur ou camion introuvable');
    }

    try {
      const headers = await getAuthHeaders();
      const res = await api.post(
        '/livraisons',
        {
          driver: driverObj._id,
          truck: truckObj._id,
          fullBottlesSent: bottles,
          emptyBottlesSent: 0
        },
        { headers }
      );
      const newDelivery = {
        ...res.data,
        driverName: driverObj.name,
        truckName: truckObj.name,
        licensePlate: truckObj.licensePlate,
        isSynced: true
      };
      const updated = [...deliveries, newDelivery];
      await saveDeliveries(updated);
      Alert.alert('Succès', 'Livraison enregistrée sur le serveur');
    } catch (e) {
      // Fallback local
      console.warn('API indisponible, sauvegarde locale', e);
      const newDelivery = {
        id: uuid.v4(),
        driverId: driverObj._id,
        driverName: driverObj.name,
        truckId: truckObj._id,
        truckName: truckObj.name,
        licensePlate: truckObj.licensePlate,
        fullBottlesSent: bottles,
        emptyBottlesSent: 0,
        status: 'en cours',
        createdAt: new Date().toISOString(),
        isSynced: false
      };
      const updated = [...deliveries, newDelivery];
      await saveDeliveries(updated);
      Alert.alert('Succès', 'Livraison enregistrée localement (offline)');
    }
    setFullBottlesSent('');
    setSelectedDriver('');
    setSelectedTruck('');
  };

  // Ouvre modal pour finaliser une livraison
  const confirmCompletion = (delivery) => {
    setSelectedDelivery(delivery);
    setFullReturned('');
    setEmptyReturned('');
    setConsigned('');
    setModalVisible(true);
  };

  // Finalise la livraison (PATCH API + fallback local)
  const finalizeDelivery = async () => {
    if (!selectedDelivery) return;

    const fullSent = selectedDelivery.fullBottlesSent;
    const fullBack = parseInt(fullReturned);
    const emptyBack = parseInt(emptyReturned);
    const consignedSold = parseInt(consigned);

    if (
      isNaN(fullBack) || isNaN(emptyBack) || isNaN(consignedSold) ||
      fullBack > fullSent || fullBack < 0 || emptyBack < 0 || consignedSold < 0
    ) {
      return Alert.alert("Erreur", "Valeurs invalides.");
    }

    try {
      const headers = await getAuthHeaders();
      const deliveryId = selectedDelivery._id || selectedDelivery.id;
      let res;
      try {
        res = await api.patch(
          `/livraisons/${deliveryId}`,
          {
            fullBottlesReturned: fullBack,
            emptyBottlesReturned: emptyBack,
            consignedBottles: consignedSold,
            status: 'terminée'
          },
          { headers }
        );
      } catch {
        res = null; // fallback local
      }

      let updated;
      if (res && res.data && res.data.livraison) {
        const newData = res.data.livraison;
        updated = deliveries.map(item =>
          (item._id || item.id) === deliveryId
            ? {
              ...item,
              ...newData,
              driverName: item.driverName,
              truckName: item.truckName,
              licensePlate: item.licensePlate,
              isSynced: true
            }
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

      await saveDeliveries(updated);
      setModalVisible(false);
    } catch (error) {
      console.error("Erreur finalisation:", error);
      Alert.alert("Erreur", "Impossible de finaliser la livraison.");
    }
  };

  // Supprime une livraison localement
  const deleteDelivery = async (id) => {
    const updated = deliveries.filter(item => (item._id || item.id) !== id);
    await saveDeliveries(updated);
  };

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.title}>{item.driverName || 'Chauffeur inconnu'}</Text>
      <Text>Camion: {item.truckName} ({item.licensePlate})</Text>
      <Text>Bouteilles: {item.fullBottlesSent}</Text>
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
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🚚 Nouvelle Livraison</Text>

      <Picker
        selectedValue={selectedDriver}
        onValueChange={setSelectedDriver}
        style={styles.picker}
      >
        <Picker.Item label="Sélectionner Chauffeur" value="" />
        {drivers.map(driver => (
          <Picker.Item
            key={driver._id}
            label={driver.name || `Chauffeur ${driver._id.slice(0, 5)}`}
            value={driver._id}
          />
        ))}
      </Picker>

      <Picker
        selectedValue={selectedTruck}
        onValueChange={setSelectedTruck}
        style={styles.picker}
      >
        <Picker.Item label="Sélectionner Camion" value="" />
        {trucks.map(truck => (
          <Picker.Item
            key={truck._id}
            label={`${truck.name} (${truck.licensePlate})`}
            value={truck._id}
          />
        ))}
      </Picker>

      <TextInput
        style={styles.input}
        placeholder="Nombre de bouteilles pleines"
        value={fullBottlesSent}
        onChangeText={text => setFullBottlesSent(text.replace(/[^0-9]/g, ''))}
        keyboardType="numeric"
      />

      <Button title={isSyncing ? "Synchronisation..." : "Ajouter la livraison"} onPress={addDelivery} disabled={isSyncing} />

      <Text style={styles.header}>📋 Livraisons ({deliveries.length})</Text>

      <FlatList
        data={deliveries}
        keyExtractor={item => item._id ? item._id : item.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.emptyText}>Aucune livraison</Text>}
        refreshing={isLoading}
        onRefresh={loadDeliveries}
      />

      {modalVisible && (
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
            placeholder="Vides retournées"
            value={emptyReturned}
            onChangeText={setEmptyReturned}
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
  picker: {
    backgroundColor: '#fff',
    marginBottom: 15,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd'
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
  }
});

export default DeliveryManagerScreen;
