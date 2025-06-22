// utils/offlineManager.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
import api from '../api/auth';

const STORAGE_KEY = '@offline_deliveries';

export const saveDeliveryLocally = async (delivery) => {
  try {
    const existing = await AsyncStorage.getItem(STORAGE_KEY);
    const deliveries = existing ? JSON.parse(existing) : [];
    deliveries.push(delivery);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(deliveries));
  } catch (error) {
    console.error("Erreur lors de la sauvegarde locale:", error);
  }
};

export const resendOfflineDeliveries = async () => {
  try {
    const status = await Network.getNetworkStateAsync();
    if (!status.isConnected) return;

    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    const deliveries = JSON.parse(stored);
    const successfullySent = [];

    for (const delivery of deliveries) {
      try {
        await api.post('/deliveries', delivery);
        successfullySent.push(delivery);
      } catch (err) {
        console.error("Erreur lors de la réinjection:", err);
      }
    }

    // On garde uniquement celles qui ont échoué
    const remaining = deliveries.filter(d => !successfullySent.includes(d));
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
  } catch (error) {
    console.error("Erreur de réenvoi local:", error);
  }
};
