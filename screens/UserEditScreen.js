import React, { useState, useEffect } from 'react';
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
import api from '../api/auth';

export default function UserEditScreen({ route, navigation }) {
  const { userId, userData: initialUserData } = route.params || {};
  const [name, setName] = useState(initialUserData?.name || '');
  const [email, setEmail] = useState(initialUserData?.email || '');
  const [role, setRole] = useState(initialUserData?.role || 'driver');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  const isOwnProfile = currentUserId === userId;

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const res = await api.get('/auth/profile');
        setCurrentUserId(res.data?._id);
      } catch (err) {
        console.error('Erreur récupération du profil :', err);
      }
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (initialUserData) {
      setIsLoading(false);
      return;
    }

    const fetchUserDetails = async () => {
      if (!userId) {
        Alert.alert('Erreur', 'Aucun ID utilisateur fourni.');
        navigation.goBack();
        return;
      }
      try {
        const response = await api.get(`/users/${userId}`);
        const user = response.data;
        setName(user.name);
        setEmail(user.email);
        setRole(user.role);
      } catch (error) {
        Alert.alert('Erreur', "Impossible de charger les détails de l'utilisateur.");
        navigation.goBack();
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserDetails();
  }, [userId, initialUserData, navigation]);

  const handleUpdate = async () => {
    if (!name || !email || !role) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires.');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = { name, email, role };
      await api.put(`/users/${userId}`, data);
      Alert.alert('Succès', 'Utilisateur mis à jour avec succès !');
      navigation.goBack();
    } catch (error) {
      console.error('Erreur mise à jour utilisateur:', error);
      if (error.response) {
        switch (error.response.status) {
          case 404:
            Alert.alert('Erreur', 'Utilisateur non trouvé.');
            break;
          case 400:
            Alert.alert('Erreur', 'Email invalide ou rôle non autorisé.');
            break;
          case 500:
            Alert.alert('Erreur', 'Erreur serveur, veuillez réessayer plus tard.');
            break;
          default:
            Alert.alert('Erreur', 'Échec de la mise à jour de l\'utilisateur.');
        }
      } else {
        Alert.alert('Erreur', 'Impossible de contacter le serveur.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text>Chargement des détails de l'utilisateur...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Modifier l'utilisateur : {initialUserData?.name || name}</Text>

        {/* Nom */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nom:</Text>
          <TextInput
            style={styles.input}
            placeholder="Nom complet"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        </View>

        {/* Email */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email:</Text>
          <TextInput
            style={styles.input}
            placeholder="email@example.com"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
        </View>

        {/* Rôle */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Rôle:</Text>
          {isOwnProfile ? (
            <Text style={styles.notice}>
              Vous ne pouvez pas modifier votre propre rôle.
            </Text>
          ) : (
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={role}
                onValueChange={setRole}
                style={styles.picker}
              >
                <Picker.Item label="Admin" value="admin" />
                <Picker.Item label="Controller" value="controller" />
                <Picker.Item label="Driver" value="driver" />
              </Picker>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleUpdate}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="save-outline" size={24} color="#fff" />
              <Text style={styles.submitButtonText}>Enregistrer les modifications</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f4f8',
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
  notice: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#007bff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});
