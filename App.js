import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { enableScreens } from 'react-native-screens';

import LoginScreen from './screens/LoginScreen';
import MainTabsAdmin from './navigation/MainTabsAdmin';
import MainTabsController from './navigation/MainTabsController';

// 👇 Import des écrans globaux
import UserEditScreen from './screens/UserEditScreen';
import AddUserScreen from './screens/AddUserScreen';
import TruckFormScreen from './screens/TruckFormScreen';

enableScreens();
const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const checkToken = async () => {
      const token = await AsyncStorage.getItem('authToken');
      const role = await AsyncStorage.getItem('userRole');
      setIsAuthenticated(!!token);
      setUserRole(role);
      setIsLoading(false);
    };
    checkToken();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <NavigationContainer>
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
          </>
        ) : userRole === 'admin' ? (
          <Stack.Screen name="MainTabsAdmin">
            {(props) => <MainTabsAdmin {...props} setIsAuthenticated={setIsAuthenticated} />}
          </Stack.Screen>
        ) : userRole === 'controller' ? (
          <Stack.Screen name="MainTabsController">
            {(props) => <MainTabsController {...props} setIsAuthenticated={setIsAuthenticated} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="UnknownRole">
            {() => (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>Rôle utilisateur inconnu</Text>
              </View>
            )}
          </Stack.Screen>
        )}

        {/* ✅ Ajout des écrans globaux ici */}
        <Stack.Screen name="UserEditScreen" component={UserEditScreen} />
        <Stack.Screen name="AddUserScreen" component={AddUserScreen} />
        <Stack.Screen name="TruckForm" component={TruckFormScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
