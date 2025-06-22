import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Ecrans
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import DeliveryListScreen from '../screens/DeliveryListScreen';
import DeliveryFormScreen from '../screens/DeliveryFormScreen';
import StockOverviewScreen from '../screens/StockOverviewScreen';
import StockMovementFormScreen from '../screens/StockMovementFormScreen';
import StockMovementHistoryScreen from '../screens/StockMovementHistoryScreen';
import SalaryListScreen from '../screens/SalaryListScreen';
import SalaryCalculationScreen from '../screens/SalaryCalculationScreen';
import SalaryDetailScreen from '../screens/SalaryDetailScreen';
import NotificationListScreen from '../screens/NotificationListScreen';
import UserListScreen from '../screens/UserListScreen';
import UserEditScreen from '../screens/UserEditScreen';
import ActionLogScreen from '../screens/ActionLogScreen';
import TruckListScreen from '../screens/TruckListScreen';
import TruckFormScreen from '../screens/TruckFormScreen';
import UserCreateScreen from '../screens/UserCreateScreen';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();

function HomeStackScreen({ setIsAuthenticated }) {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#3b82f6' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        headerBackTitleVisible: false,
      }}
    >
      <HomeStack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen 
        name="DeliveryList" 
        component={DeliveryListScreen} 
        options={{ title: 'Liste des Livraisons' }} 
      />
      <HomeStack.Screen 
        name="DeliveryForm" 
        component={DeliveryFormScreen} 
        options={{ title: 'Ajouter/Modifier Livraison' }} 
      />
      <HomeStack.Screen 
        name="TruckList" 
        component={TruckListScreen} 
        options={{ title: 'Liste des Camions' }} 
      />
      <HomeStack.Screen 
        name="TruckForm" 
        component={TruckFormScreen} 
        options={{ title: 'Détail Camion' }} 
      />
      <HomeStack.Screen 
        name="StockOverview" 
        component={StockOverviewScreen} 
        options={{ title: 'Vue du Stock' }} 
      />
      <HomeStack.Screen 
        name="StockMovementForm" 
        component={StockMovementFormScreen} 
        options={{ title: 'Nouveau Mouvement' }} 
      />
      <HomeStack.Screen 
        name="StockMovementHistory" 
        component={StockMovementHistoryScreen} 
        options={{ title: 'Historique Mouvements' }} 
      />
      <HomeStack.Screen 
        name="SalaryList" 
        component={SalaryListScreen} 
        options={{ title: 'Liste des Salaires' }} 
      />
      <HomeStack.Screen 
        name="SalaryCalculation" 
        component={SalaryCalculationScreen} 
        options={{ title: 'Calcul Salaire' }} 
      />
      <HomeStack.Screen 
        name="SalaryDetail" 
        component={SalaryDetailScreen} 
        options={{ title: 'Détail Salaire' }} 
      />
      <HomeStack.Screen 
        name="NotificationList" 
        component={NotificationListScreen} 
        options={{ title: 'Notifications' }} 
      />
      <HomeStack.Screen 
        name="UserList" 
        component={UserListScreen} 
        options={{ title: 'Gestion Utilisateurs' }} 
      />
      <HomeStack.Screen 
        name="UserEdit" 
        component={UserEditScreen} 
        options={{ title: 'Modifier Utilisateur' }} 
      />
      <HomeStack.Screen 
        name="ActionLog" 
        component={ActionLogScreen} 
        options={{ title: "Journal d'Activités" }} 
      />
      <HomeStack.Screen name="ProfileScreen">
        {(props) => <ProfileScreen {...props} setIsAuthenticated={setIsAuthenticated} />}
      </HomeStack.Screen>
      <HomeStack.Screen 
        name="UserCreate" 
        component={UserCreateScreen} 
        options={{ title: "Créer Utilisateur" }} 
      />
    </HomeStack.Navigator>
  );
}

export default function MainTabs({ setIsAuthenticated }) {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarIcon: () => null,
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: 'gray',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 90 : 60,
          paddingBottom: Platform.OS === 'ios' ? 10 : 5,
          paddingTop: -25,
          backgroundColor: '#ffffff',
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -5 },
          shadowOpacity: 0.1,
          shadowRadius: 5,
          flexDirection: 'row',
          justifyContent: 'flex-start',
          paddingRight: 250,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen name="AccueilTab" options={{ title: '' }}>
        {(props) => <HomeStackScreen {...props} setIsAuthenticated={setIsAuthenticated} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}