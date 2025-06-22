import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Navigation principale par rôle
import MainTabsAdmin from './MainTabsAdmin';
import MainTabsController from './MainTabsController';
import MainTabsDriver from './MainTabsDriver';

// Authentification
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';

// Écrans globaux accessibles partout
import UserEditScreen from '../screens/UserEditScreen';
import AddUserScreen from '../screens/AddUserScreen';
import TruckFormScreen from '../screens/TruckFormScreen';

const Stack = createStackNavigator();

export default function AppNavigator({ isAuthenticated, setIsAuthenticated, userRole, setUserRole }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Login">
            {(props) => (
              <LoginScreen
                {...props}
                setIsAuthenticated={setIsAuthenticated}
                setUserRole={setUserRole}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </>
      ) : (
        <>
          {userRole === 'admin' && (
            <Stack.Screen name="MainTabsAdmin">
              {(props) => (
                <MainTabsAdmin {...props} setIsAuthenticated={setIsAuthenticated} />
              )}
            </Stack.Screen>
          )}
          {userRole === 'controller' && (
            <Stack.Screen name="MainTabsController">
              {(props) => (
                <MainTabsController {...props} setIsAuthenticated={setIsAuthenticated} />
              )}
            </Stack.Screen>
          )}
         
          

          {/* ✅ Écrans accessibles depuis n'importe quel onglet */}
          <Stack.Screen
            name="UserEditScreen"
            component={UserEditScreen}
            options={{ title: "Modifier l'utilisateur" }}
          />
          <Stack.Screen
            name="AddUserScreen"
            component={AddUserScreen}
            options={{ title: "Ajouter un utilisateur" }}
          />
          <Stack.Screen
            name="TruckForm"
            component={TruckFormScreen}
            options={{ title: "Ajouter un camion" }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
