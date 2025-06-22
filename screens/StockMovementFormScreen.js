import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function StockMovementFormScreen({ navigation }) {
  const [movementType, setMovementType] = useState('entrée'); // 'entrée' ou 'sortie'
  const [fullBottles, setFullBottles] = useState('');
  const [emptyBottles, setEmptyBottles] = useState('');
  const [consignedBottles, setConsignedBottles] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Validation
    if (!movementType || (!fullBottles && !emptyBottles && !consignedBottles)) {
      Alert.alert('Erreur', 'Remplissez au moins un champ de quantité.');
      return;
    }

    const API_BASE_URL = 'http://31.97.55.154:5000/api';

    const payload = {
      type: movementType,
      description: reason || '',
      fullBottles: parseInt(fullBottles) || 0,
      emptyBottles: parseInt(emptyBottles) || 0,
      consignedBottles: parseInt(consignedBottles) || 0,
    };

    setIsSubmitting(true);

    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) throw new Error('Token manquant');

      const response = await axios.put(`${API_BASE_URL}/stock`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        Alert.alert('Succès', 'Stock mis à jour avec succès.');
        // Reset form
        setFullBottles('');
        setEmptyBottles('');
        setConsignedBottles('');
        setReason('');
        setMovementType('entrée');
        navigation.goBack();
      }
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du mouvement :", error);
      const message = error.response?.data?.message || "Erreur serveur ou de réseau.";
      Alert.alert("Erreur", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Mouvement de Stock</Text>

        {/* Type de Mouvement */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Type de Mouvement :</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={movementType}
              onValueChange={(val) => setMovementType(val)}
              style={styles.picker}
            >
              <Picker.Item label="Entrée" value="entrée" />
              <Picker.Item label="Sortie" value="sortie" />
            </Picker>
          </View>
        </View>

        {/* Quantités */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bouteilles pleines :</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={fullBottles}
            onChangeText={setFullBottles}
            placeholder="ex: 10"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bouteilles vides :</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={emptyBottles}
            onChangeText={setEmptyBottles}
            placeholder="ex: 5"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bouteilles consignées :</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={consignedBottles}
            onChangeText={setConsignedBottles}
            placeholder="ex: 2"
          />
        </View>

        {/* Raison */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description (facultatif) :</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={4}
            placeholder="Ex : Réception, casse, retour client..."
          />
        </View>

        {/* Bouton */}
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="save-outline" size={24} color="#fff" />
              <Text style={styles.submitButtonText}>Mettre à jour le stock</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f0f4f8',
    paddingBottom: 50,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 30,
    marginTop: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#34495e',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});
