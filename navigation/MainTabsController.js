import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import DashboardScreen from '../screens/DashboardScreen';
import ProfileScreen from '../screens/ProfileScreen';
import DeliveryListScreen from '../screens/DeliveryListScreen';
import DeliveryFormScreen from '../screens/DeliveryFormScreen';
import StockOverviewScreen from '../screens/StockOverviewScreen';
import StockMovementFormScreen from '../screens/StockMovementFormScreen';
import StockMovementHistoryScreen from '../screens/StockMovementHistoryScreen';
import SalaryListScreen from '../screens/SalaryListScreen';
import SalaryCalculationScreen from '../screens/SalaryCalculationScreen';
import NotificationListScreen from '../screens/NotificationListScreen';
import TruckListScreen from '../screens/TruckListScreen';
import TruckFormScreen from '../screens/TruckFormScreen';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const iconMap = {
  'Stock': 'cube-outline',
  'Stock Mouvements': 'swap-horizontal-outline',
  'Historique Stock': 'time-outline',
  'Vue Stock': 'eye-outline',
  'Salaires': 'cash-outline',
  'Notifications': 'notifications-outline',
  'Camions': 'car-sport-outline',
  'Livraisons': 'bicycle-outline',
  'Ajout Camion': 'add-circle-outline',
  'Ajout Livraison': 'send-outline',
  'Calcul Salaire': 'calculator-outline',
};

function GestionGridController() {
  const navigation = useNavigation();

  const items = [
    { label: 'Vue Stock', screen: 'Stock' },
    { label: 'Stock Mouvements', screen: 'StockMovementForm' },
    { label: 'Historique Stock', screen: 'StockMovementHistory' },
    { label: 'Salaires', screen: 'Salaires' },
    { label: 'Notifications', screen: 'Notifications' },
    { label: 'Camions', screen: 'Camions' },
    { label: 'Ajout de livraison', screen: 'Livraisons' },
    { label: 'Finalisation de livraison', screen: 'DeliveryForm' },
    
  ];

  return (
    <View style={styles.gestionContainer}>
      <View style={styles.headerCustom}>
        <Text style={styles.headerCustomTitle}>Gestion</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
      >
        {items.map((item) => (
          <Pressable
            key={item.screen}
            style={({ pressed }) => [
              styles.gridItem,
              pressed && styles.gridItemPressed,
            ]}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Ionicons
              name={iconMap[item.label] || 'help-circle-outline'}
              size={36}
              color="white"
              style={{ marginBottom: 8 }}
            />
            <Text style={styles.gridText}>{item.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function GestionStackController() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Menu" component={GestionGridController} />
      <Stack.Screen name="Stock" component={StockOverviewScreen} />
      <Stack.Screen name="Salaires" component={SalaryListScreen} />
      <Stack.Screen name="Notifications" component={NotificationListScreen} />
      <Stack.Screen name="Camions" component={TruckListScreen} />
      <Stack.Screen name="Livraisons" component={DeliveryListScreen} />
      <Stack.Screen name="TruckForm" component={TruckFormScreen} />
      <Stack.Screen name="DeliveryForm" component={DeliveryFormScreen} />
      <Stack.Screen name="StockMovementForm" component={StockMovementFormScreen} />
      <Stack.Screen name="StockMovementHistory" component={StockMovementHistoryScreen} />
      <Stack.Screen name="StockOverview" component={StockOverviewScreen} />
      <Stack.Screen name="SalaryCalculation" component={SalaryCalculationScreen} />
    </Stack.Navigator>
  );
}

export default function MainTabsController({ setIsAuthenticated }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') {
            iconName = focused ? 'speedometer' : 'speedometer-outline';
          } else if (route.name === 'Gestion') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Profil') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4a90e2',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Gestion" component={GestionStackController} />
      <Tab.Screen name="Profil">
        {(props) => <ProfileScreen {...props} setIsAuthenticated={setIsAuthenticated} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  gestionContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerCustom: {
    backgroundColor: '#4a90e2',
    paddingTop: 46,
    paddingBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 2,
    elevation: 6,
  },
  headerCustomTitle: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 26,
    letterSpacing: 1,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 0,
    minHeight: 400,
    flexGrow: 1,
  },
  gridItem: {
    width: Dimensions.get('window').width > 600 ? '28%' : '40%',
    aspectRatio: 1,
    backgroundColor: '#4a90e2',
    margin: 12,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.20,
    shadowRadius: 5,
    elevation: 6,
  },
  gridItemPressed: {
    backgroundColor: '#357ABD',
  },
  gridText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
  },
});
