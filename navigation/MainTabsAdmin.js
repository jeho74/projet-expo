import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Platform, StatusBar } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

// --- Import your screens ---
import DashboardScreen from '../screens/DashboardScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Import the GestionGrid component (assuming it's in the screens folder)
import GestionGrid from '../screens/GestionGrid';

// Gestion-related Screens (likely accessed via GestionStack)
import StockOverviewScreen from '../screens/StockOverviewScreen';
import StockMovementFormScreen from '../screens/StockMovementFormScreen';
import StockMovementHistoryScreen from '../screens/StockMovementHistoryScreen';
import SalaryListScreen from '../screens/SalaryListScreen';
import SalaryCalculationScreen from '../screens/SalaryCalculationScreen';
import SalaryDetailScreen from '../screens/SalaryDetailScreen';
import NotificationListScreen from '../screens/NotificationListScreen';
import UserListScreen from '../screens/UserListScreen';
import ActionLogScreen from '../screens/ActionLogScreen';
import TruckListScreen from '../screens/TruckListScreen';
import TruckFormScreen from '../screens/TruckFormScreen';
import UserEditScreen from '../screens/UserEditScreen';
import AddUserScreen from '../screens/AddUserScreen';
import DeliveryListScreen from '../screens/DeliveryListScreen';
import DeliveryFormScreen from '../screens/DeliveryFormScreen';


const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// --- Define a consistent Color Palette ---
const Colors = {
    primary: '#3b82f6',        // A vibrant, professional blue
    primaryDark: '#2563eb',    // Darker blue
    secondary: '#10b981',      // A calming green
    accentOrange: '#ff7043',   // A warm orange
    accentPurple: '#8e44ad',   // A rich purple
    accentRed: '#e74c3c',      // A clear red
    accentTeal: '#00bcd4',     // For Delivery forms/details
    background: '#f8fafc',
    cardBackground: '#ffffff',
    textPrimary: '#1f2937',
    textSecondary: '#6b7280',
    textLight: '#e0e7ff',
    divider: '#e5e7eb',
    shadow: 'rgba(0,0,0,0.1)',
};

// --- Helper for consistent Stack Header Options ---
const defaultStackScreenOptions = {
    headerStyle: {
        backgroundColor: Colors.primary,
        shadowColor: 'transparent', // Remove shadow from header for consistent look
        elevation: 0, // Remove shadow for Android
    },
    headerTintColor: Colors.cardBackground, // Color of back button and title
    headerTitleStyle: {
        fontWeight: 'bold',
        fontSize: 20,
    },
    headerBackTitleVisible: false, // Hide iOS back button text
    headerTitleAlign: 'center', // Center title for Android
};

// --- Nested Stack Navigators for each Tab ---

// 1. Dashboard Stack
function DashboardStackScreen() {
    return (
        <Stack.Navigator screenOptions={defaultStackScreenOptions}>
            <Stack.Screen
                name="DashboardMain"
                component={DashboardScreen}
                options={{ title: 'Tableau de Bord', headerShown: false }} // Dashboard screen will likely have its own custom header
            />
        </Stack.Navigator>
    );
}

// 2. Gestion Stack
function GestionStackScreen() {
    return (
        <Stack.Navigator screenOptions={defaultStackScreenOptions}>
            <Stack.Screen
                name="GestionMenu"
                component={GestionGrid} // GestionGrid is the initial screen for this stack
                options={{ headerShown: false }} // GestionGrid has its own custom header
            />
            <Stack.Screen name="DeliveryList" component={DeliveryListScreen} options={{ title: 'Liste des Livraisons' }} />
            <Stack.Screen name="DeliveryForm" component={DeliveryFormScreen} options={{ title: 'Détail Livraison' }} />
            <Stack.Screen name="Stock" component={StockOverviewScreen} options={{ title: 'Vue du Stock' }} />
            <Stack.Screen name="Salaires" component={SalaryListScreen} options={{ title: 'Liste des Salaires' }} />
            <Stack.Screen name="Notifications" component={NotificationListScreen} options={{ title: 'Notifications' }} />
            <Stack.Screen name="Utilisateurs" component={UserListScreen} options={{ title: 'Utilisateurs' }} />
            <Stack.Screen name="Actions" component={ActionLogScreen} options={{ title: "Journal d'Activités" }} />
            <Stack.Screen name="Camions" component={TruckListScreen} options={{ title: 'Liste des Camions' }} />
            <Stack.Screen name="TruckForm" component={TruckFormScreen} options={{ title: 'Détail Camion' }} />
            <Stack.Screen name="StockMovementForm" component={StockMovementFormScreen} options={{ title: 'Nouveau Mouvement' }} />
            <Stack.Screen name="StockMovementHistory" component={StockMovementHistoryScreen} options={{ title: 'Historique Mouvements' }} />
            <Stack.Screen name="UserEditScreen" component={UserEditScreen} options={{ title: 'Modifier Utilisateur' }} />
            <Stack.Screen name="AddUserScreen" component={AddUserScreen} options={{ title: 'Ajouter Utilisateur' }} />
            <Stack.Screen name="SalaryCalculation" component={SalaryCalculationScreen} options={{ title: 'Calcul Salaire' }} />
            <Stack.Screen name="SalaryDetail" component={SalaryDetailScreen} options={{ title: 'Détail Salaire' }} />
        </Stack.Navigator>
    );
}

// 3. Profile Stack
function ProfileStackScreen({ setIsAuthenticated }) {
    return (
        <Stack.Navigator screenOptions={defaultStackScreenOptions}>
            <Stack.Screen
                name="ProfileMain"
                options={{ title: 'Mon Profil' }}
            >
                {/* Pass setIsAuthenticated as a prop to ProfileScreen */}
                {(props) => <ProfileScreen {...props} setIsAuthenticated={setIsAuthenticated} />}
            </Stack.Screen>
        </Stack.Navigator>
    );
}


// --- MainTabsAdmin (The main Bottom Tab Navigator) ---
export default function MainTabsAdmin({ setIsAuthenticated }) {
    const tabIconMap = {
        Dashboard: 'speedometer',
        Gestion: 'grid',
        Profil: 'person',
    };

    const tabFocusedIconMap = {
        Dashboard: 'speedometer',
        Gestion: 'grid',
        Profil: 'person',
    };

    return (
        <>
            {/* Status bar configuration for the entire app when this navigator is active */}
            <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    headerShown: false, // Hide default header for tabs, as stacks handle their own
                    tabBarIcon: ({ focused, color, size }) => {
                        // Determine icon name based on focus state
                        const iconName = focused ? tabFocusedIconMap[route.name] : tabIconMap[route.name] + '-outline';
                        return <Ionicons name={iconName} size={size} color={color} />;
                    },
                    tabBarActiveTintColor: Colors.primary, // Color for active tab icon and label
                    tabBarInactiveTintColor: Colors.textSecondary, // Color for inactive tab icon and label
                    tabBarLabelStyle: {
                        fontSize: 11,
                        fontWeight: '600',
                        marginBottom: Platform.OS === 'ios' ? 0 : 3, // Adjust label position
                    },
                    tabBarStyle: {
                        // Styling for the container of the tab bar
                        position: 'absolute', // Makes the tab bar float above content
                        backgroundColor: Colors.cardBackground, // White background
                        borderTopWidth: 0, // Remove default top border
                        elevation: 20, // Android shadow
                        shadowColor: Colors.shadow, // iOS shadow
                        shadowOffset: { width: 0, height: -8 }, // Shadow pointing upwards
                        shadowOpacity: 0.15, // Light shadow
                        shadowRadius: 15, // Soft shadow blur
                        height: Platform.OS === 'ios' ? 90 : 65, // Standard height for iOS with safe area, Android
                        paddingBottom: Platform.OS === 'ios' ? 25 : 10, // Padding for safe area on iOS
                        paddingTop: 5, // Padding above icons
                        borderRadius: 25, // Rounded corners for a modern "pill" effect
                        marginHorizontal: 15, // Space from the left/right edges
                        marginBottom: Platform.OS === 'ios' ? 0 : 10, // Space from the bottom on Android
                    },
                })}
            >
                <Tab.Screen
                    name="Dashboard"
                    component={DashboardStackScreen}
                    options={{ title: 'Tableau de Bord' }}
                />
                <Tab.Screen
                    name="Gestion"
                    component={GestionStackScreen}
                    options={{ title: 'Gestion' }}
                />
                <Tab.Screen
                    name="Profil"
                    // Render ProfileScreen directly within the Tab.Screen to pass props
                    options={{ title: 'Profil' }}
                >
                    {(props) => <ProfileStackScreen {...props} setIsAuthenticated={setIsAuthenticated} />}
                </Tab.Screen>
            </Tab.Navigator>
        </>
    );
}