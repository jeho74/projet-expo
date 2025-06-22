// screens/ProfileScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ToastAndroid,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/auth';

export default function ProfileScreen({ setIsAuthenticated }) {
  const navigation = useNavigation();
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/auth/profile');
      setUserData(response.data);
    } catch (err) {
      console.error('Erreur fetch profile:', err);
      if (err.response) {
        if (err.response.status === 401) {
          setError('Session expirée, veuillez vous reconnecter.');
          await AsyncStorage.removeItem('authToken');
          setIsAuthenticated(false);
          return;
        } else if (err.response.status === 404) {
          setError('Utilisateur non trouvé.');
        } else {
          setError(err.response.data.message || 'Erreur inconnue');
        }
      } else {
        setError("Impossible de charger le profil. Vérifiez votre connexion.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchUserData();
    }, [])
  );

  const handleLogout = async () => {
    Alert.alert(
      "Déconnexion",
      "Voulez-vous vraiment vous déconnecter ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Déconnecter",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('authToken');
              setUserData(null);
              setIsAuthenticated(false);

              if (Platform.OS === 'android') {
                ToastAndroid.show("Déconnecté avec succès", ToastAndroid.SHORT);
              }
            } catch (err) {
              console.warn("Erreur AsyncStorage :", err.message);
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Chargement du profil...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={50} color="#dc3545" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchUserData}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Aucune donnée de profil disponible.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Ionicons name="person-circle-sharp" size={100} color="#3b82f6" />
        <Text style={styles.userName}>{userData.name}</Text>
        <Text style={styles.userRole}>{userData.role}</Text>
      </View>

      <View style={styles.detailsCard}>
        <Text style={styles.cardTitle}>Informations Personnelles</Text>
        <View style={styles.detailRow}>
          <Ionicons name="mail-outline" size={20} color="#555" style={styles.detailIcon} />
          <Text style={styles.detailLabel}>Email :</Text>
          <Text style={styles.detailValue}>{userData.email}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => navigation.navigate('UserEditScreen', {
          userId: userData._id,
          userData,
        })}
      >
        <Ionicons name="pencil-outline" size={22} color="#fff" style={styles.buttonIcon} />
        <Text style={styles.actionButtonText}>Modifier le Profil</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, styles.logoutButton]}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={22} color="#fff" style={styles.buttonIcon} />
        <Text style={styles.actionButtonText}>Se Déconnecter</Text>
      </TouchableOpacity>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  container: {
    padding: 20,
    alignItems: 'center',
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f4f8',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f4f8',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#dc3545',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    width: '100%',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 10,
  },
  userRole: {
    fontSize: 18,
    color: '#7f8c8d',
    marginTop: 5,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 5,
  },
  detailIcon: {
    marginRight: 10,
    width: 25,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginRight: 10,
    flexShrink: 0,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    flexShrink: 1,
  },
  actionButton: {
    flexDirection: 'row',
    backgroundColor: '#3b82f6',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  logoutButton: {
    backgroundColor: '#dc3545',
  },
  buttonIcon: {
    marginRight: 10,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
