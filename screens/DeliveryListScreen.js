import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import uuid from 'react-native-uuid';
import api from '../services/api'; // Assurez-vous que ce fichier contient une instance Axios avec baseURL

const STORAGE_KEY = 'local_deliveries_v2';

const CreateDeliveryScreen = () => {
  const [drivers, setDrivers] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedTruck, setSelectedTruck] = useState('');
  const [fullBottlesSent, setFullBottlesSent] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem('authToken');
    return { Authorization: `Bearer ${token}` };
  };

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
      Alert.alert('Erreur', 'Impossible de charger chauffeurs et camions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDriversAndTrucks();
  }, []);

  const addDelivery = async () => {
    const bottles = parseInt(fullBottlesSent, 10);
    if (!selectedDriver || !selectedTruck || isNaN(bottles) || bottles <= 0) {
      return Alert.alert('Erreur', 'Champs incomplets ou invalides');
    }

    const driverObj = drivers.find(d => d._id === selectedDriver);
    const truckObj = trucks.find(t => t._id === selectedTruck);

    if (!driverObj || !truckObj) {
      return Alert.alert('Erreur', 'Chauffeur ou camion introuvable');
    }

    const deliveries = JSON.parse(await AsyncStorage.getItem(STORAGE_KEY) || '[]');

    try {
      const headers = await getAuthHeaders();
      const res = await api.post(
        '/deliveries',
        {
          driver: driverObj._id,
          truck: truckObj._id,
          fullBottlesSent: bottles,
          emptyBottlesSent: 0,
        },
        { headers }
      );

      const newDelivery = {
        ...res.data,
        driverName: driverObj.name,
        truckName: truckObj.name,
        licensePlate: truckObj.licensePlate,
        isSynced: true,
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...deliveries, newDelivery]));
      Alert.alert('Succès', 'Livraison enregistrée sur le serveur et en local');
    } catch (error) {
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
        isSynced: false,
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...deliveries, newDelivery]));
      Alert.alert('Succès', 'Livraison enregistrée localement (offline)');
    }

    setFullBottlesSent('');
    setSelectedDriver('');
    setSelectedTruck('');
  };

  if (isLoading) return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🚚 Nouvelle Livraison</Text>

      <Picker selectedValue={selectedDriver} onValueChange={setSelectedDriver} style={styles.picker}>
        <Picker.Item label="Sélectionner Chauffeur" value="" />
        {drivers.map(driver => (
          <Picker.Item
            key={driver._id}
            label={driver.name || `Chauffeur ${driver._id.slice(0, 5)}`}
            value={driver._id}
          />
        ))}
      </Picker>

      <Picker selectedValue={selectedTruck} onValueChange={setSelectedTruck} style={styles.picker}>
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

      <Button title="Ajouter livraison" onPress={addDelivery} />
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
});

export default CreateDeliveryScreen;
