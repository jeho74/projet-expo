// screens/HomeScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView, // Garder SafeAreaView
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const cardMargin = 10;
const numColumns = 2; // Pour un affichage en grille de 2 colonnes

export default function HomeScreen() {
  const navigation = useNavigation();

  // Définition des sections de l'application (AVEC Livraisons ET Camions)
  const sections = [
    {
      id: 'deliveries',
      title: 'Livraisons',
      description: 'Gérer toutes les livraisons (pleines et vides).',
      icon: 'cube-outline',
      color: ['#4CAF50', '#8BC34A'], // Vert gradient
      screen: 'DeliveryList', // Pointeur vers l'écran de liste des livraisons
    },
    {
      id: 'bus-outline',
      title: 'Camions',
      description: 'Gérer la flotte de véhicules et maintenance.',
      icon: 'bus-outline', // CORRECTION D'ICÔNE : 'truck' au lieu de 'truck-outline'
      color: ['#6f42c1', '#8a2be2'], // Violet foncé gradient
      screen: 'TruckList',
    },
    {
      id: 'stock',
      title: 'Stock',
      description: 'Surveiller les niveaux de stock (bouteilles).',
      icon: 'layers-outline',
      color: ['#FFC107', '#FFEB3B'],
      screen: 'StockOverview',
    },
    {
      id: 'salaries',
      title: 'Salaires',
      description: 'Calculer et consulter les salaires des chauffeurs.',
      icon: 'wallet-outline',
      color: ['#2196F3', '#64B5F6'],
      screen: 'SalaryList',
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Messages importants et alertes système.',
      icon: 'notifications-outline',
      color: ['#FF5722', '#FF8A65'],
      screen: 'NotificationList',
    },
    {
      id: 'users',
      title: 'Utilisateurs',
      description: 'Administrer les comptes et les rôles.',
      icon: 'people-outline',
      color: ['#9C27B0', '#BA68C8'],
      screen: 'UserList',
    },
    {
      id: 'logs',
      title: 'Journal Activités',
      description: 'Historique détaillé des actions système.',
      icon: 'receipt-outline',
      color: ['#607D8B', '#90A4AE'],
      screen: 'ActionLog',
    },
  ];

  const renderSectionCard = (section) => {
    const cardWidth = (width - (cardMargin * (numColumns + 1))) / numColumns;

    return (
      <TouchableOpacity
        key={section.id}
        style={[styles.card, { width: cardWidth }]}
        onPress={() => navigation.navigate(section.screen)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={section.color}
          style={styles.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name={section.icon} size={40} color="#fff" style={styles.cardIcon} />
          <Text style={styles.cardTitle}>{section.title}</Text>
          <Text style={styles.cardDescription}>{section.description}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* BOUTON PROFIL EN HAUT À DROITE */}
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate('ProfileScreen')} // Navigue vers l'écran de profil
        >
          <Ionicons name="person-circle-outline" size={40} color="#3b82f6" />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Ionicons name="apps-sharp" size={80} color="#3b82f6" />
          </View>
          <Text style={styles.welcomeText}>Bienvenue, Responsable de Gestion !</Text>
          <Text style={styles.subHeaderText}>
            Votre tableau de bord centralisé pour une gestion d'entreprise intelligente.
          </Text>
        </View>

        <View style={styles.sectionsGrid}>
          {sections.map(renderSectionCard)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#eef2f6',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: cardMargin,
    paddingVertical: 20,
    alignItems: 'center',
  },
  // NOUVEAU STYLE POUR LE BOUTON PROFIL
  profileButton: {
    position: 'absolute', // Positionnement absolu
    top: Platform.OS === 'ios' ? 50 : 20, // Ajuster la position verticale pour la safe area iOS
    right: 20,
    zIndex: 10, // Assurez-vous qu'il est au-dessus d'autres éléments
    backgroundColor: '#fff',
    borderRadius: 30, // Pour faire un cercle
    padding: 5,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  headerTop: {
    marginBottom: 15,
    padding: 10,
    borderRadius: 50,
    backgroundColor: '#e0f2f7',
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 10,
  },
  subHeaderText: {
    fontSize: 15,
    color: '#7f8c8d',
    textAlign: 'center',
    paddingHorizontal: 10,
    lineHeight: 22,
  },
  sectionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 0,
  },
  card: {
    borderRadius: 15,
    marginBottom: cardMargin,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  cardGradient: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: width * 0.45,
  },
  cardIcon: {
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 5,
  },
  cardDescription: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.8,
  },
});