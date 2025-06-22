// screens/TruckFormScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TruckFormScreen({ route, navigation }) {
  const { truckId, truckData } = route.params || {};

  const [name, setName] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [capacity, setCapacity] = useState('');
  const [status, setStatus] = useState('disponible');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (truckData) {
      setIsEditing(true);
      setName(truckData.name);
      setLicensePlate(truckData.licensePlate);
      setCapacity(String(truckData.capacity));
      setStatus(truckData.status);
    }
  }, [truckData]);

  const handleSubmit = async () => {
    if (!name || !licensePlate || capacity === '') {
      Alert.alert("Erreur", "Veuillez remplir tous les champs obligatoires.");
      return;
    }

    const parsedCapacity = parseInt(capacity);
    if (isNaN(parsedCapacity) || parsedCapacity <= 0) {
      Alert.alert("Erreur", "La capacité doit être un nombre positif.");
      return;
    }

    setIsLoading(true);

    const payload = {
      name,
      licensePlate,
      capacity: parsedCapacity,
      status,
    };

    const API_BASE_URL = 'http://31.97.55.154:5000/api';
    const token = await AsyncStorage.getItem('authToken');

    try {
      if (isEditing) {
        await axios.put(`${API_BASE_URL}/trucks/${truckId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        Alert.alert("Succès", "Camion modifié avec succès !");
      } else {
        await axios.post(`${API_BASE_URL}/trucks`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        Alert.alert("Succès", "Nouveau camion ajouté avec succès !");
      }
      navigation.goBack();
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du camion :", error);
      Alert.alert("Erreur", "Impossible d'enregistrer le camion.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.fullScreen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>
          {isEditing ? "Modifier le Camion" : "Ajouter un Camion"}
        </Text>

        <View style={styles.formSection}>
          <Text style={styles.label}>Nom du Camion</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Iveco Daily"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Numéro de Plaque</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: GA-XYZ-789"
            value={licensePlate}
            onChangeText={setLicensePlate}
          />

          <Text style={styles.label}>Capacité (kg)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 500"
            keyboardType="numeric"
            value={capacity}
            onChangeText={setCapacity}
          />

          <Text style={styles.label}>Statut</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={status}
              onValueChange={(itemValue) => setStatus(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Disponible" value="disponible" />
              <Picker.Item label="En Livraison" value="en livraison" />
              <Picker.Item label="En Maintenance" value="en maintenance" />
            </Picker>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? "Envoi en cours..." : (isEditing ? "Enregistrer les modifications" : "Ajouter le camion")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Retour à la liste</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f0f4f8',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 30,
    marginTop: 40,
  },
  formSection: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    color: '#34495e',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: '#fdfdfd',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#fdfdfd',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#666',
    fontSize: 16,
  },
});
