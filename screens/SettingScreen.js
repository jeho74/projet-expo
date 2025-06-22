import React, { useState, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Switch,
    TouchableOpacity,
    Alert,
    ScrollView,
    Platform,
    StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../context/ThemeContext'; // We'll create this next!

// Define your color palette, expanding for dark mode
const lightColors = {
    primary: '#4F46E5', // Blue
    background: '#F9FAFB', // Light background
    cardBackground: '#FFFFFF',
    textPrimary: '#1F2937', // Dark text
    textSecondary: '#6B7280',
    borderColor: '#E5E7EB',
    headerBackground: '#4F46E5',
    headerText: '#FFFFFF',
};

const darkColors = {
    primary: '#6D28D9', // Darker purple/blue
    background: '#1A202C', // Dark background
    cardBackground: '#2D3748',
    textPrimary: '#F7FAFC', // Light text
    textSecondary: '#A0AEC0',
    borderColor: '#4A5568',
    headerBackground: '#1A202C',
    headerText: '#F7FAFC',
};

export default function SettingsScreen({ navigation }) {
    const { isDarkMode, toggleDarkMode } = useContext(ThemeContext);
    const Colors = isDarkMode ? darkColors : lightColors;

    // Example of another setting: Notifications Enabled
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    const handleLogout = async () => {
        Alert.alert(
            "Déconnexion",
            "Êtes-vous sûr de vouloir vous déconnecter ?",
            [
                {
                    text: "Annuler",
                    style: "cancel"
                },
                {
                    text: "Oui",
                    onPress: async () => {
                        try {
                            await AsyncStorage.removeItem('authToken');
                            // Navigate to your authentication/login screen
                            // Make sure 'Auth' is the name of your authentication stack/screen
                            navigation.replace('Auth');
                        } catch (e) {
                            console.error("Failed to clear auth token:", e);
                            Alert.alert("Erreur", "Échec de la déconnexion.");
                        }
                    }
                }
            ],
            { cancelable: true }
        );
    };

    const styles = getStyles(Colors); // Dynamic styles based on theme

    return (
        <View style={styles.container}>
            <StatusBar
                barStyle={isDarkMode ? 'light-content' : 'dark-content'}
                backgroundColor={Colors.headerBackground}
            />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={28} color={Colors.headerText} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Paramètres</Text>
                <View style={{ width: 28 }} /> {/* Spacer to balance back button */}
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* --- Section Thème --- */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Apparence</Text>
                    <View style={styles.settingItem}>
                        <Text style={styles.settingText}>Mode Sombre</Text>
                        <Switch
                            onValueChange={toggleDarkMode}
                            value={isDarkMode}
                            trackColor={{ false: Colors.borderColor, true: Colors.primary }}
                            thumbColor={Colors.cardBackground}
                            ios_backgroundColor={Colors.borderColor}
                        />
                    </View>
                </View>

                {/* --- Section Notifications (Exemple) --- */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Notifications</Text>
                    <View style={styles.settingItem}>
                        <Text style={styles.settingText}>Activer les Notifications</Text>
                        <Switch
                            onValueChange={setNotificationsEnabled}
                            value={notificationsEnabled}
                            trackColor={{ false: Colors.borderColor, true: Colors.primary }}
                            thumbColor={Colors.cardBackground}
                            ios_backgroundColor={Colors.borderColor}
                        />
                    </View>
                    <TouchableOpacity style={styles.settingActionItem} onPress={() => Alert.alert("Notifications", "Gérer vos préférences de notifications.")}>
                        <Text style={styles.settingText}>Préférences Détaillées</Text>
                        <Ionicons name="chevron-forward-outline" size={24} color={Colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* --- Section Compte (Exemple) --- */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Compte</Text>
                    <TouchableOpacity style={styles.settingActionItem} onPress={() => Alert.alert("Profil", "Accéder aux informations de profil.")}>
                        <Text style={styles.settingText}>Modifier le Profil</Text>
                        <Ionicons name="chevron-forward-outline" size={24} color={Colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.settingActionItem} onPress={() => Alert.alert("Sécurité", "Gérer le mot de passe et la sécurité.")}>
                        <Text style={styles.settingText}>Sécurité et Confidentialité</Text>
                        <Ionicons name="chevron-forward-outline" size={24} color={Colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.settingActionItem, { borderBottomWidth: 0 }]} onPress={handleLogout}>
                        <Text style={[styles.settingText, { color: 'red', fontWeight: 'bold' }]}>Déconnexion</Text>
                        <Ionicons name="log-out-outline" size={24} color="red" />
                    </TouchableOpacity>
                </View>

                {/* --- Section À Propos (Exemple) --- */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>À Propos</Text>
                    <TouchableOpacity style={styles.settingActionItem} onPress={() => Alert.alert("Version", "Version de l'application: 1.0.0")}>
                        <Text style={styles.settingText}>Version de l'Application</Text>
                        <Text style={styles.settingValue}>1.0.0</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.settingActionItem, { borderBottomWidth: 0 }]} onPress={() => Alert.alert("Termes", "Conditions d'utilisation et politique de confidentialité.")}>
                        <Text style={styles.settingText}>Conditions d'Utilisation</Text>
                        <Ionicons name="document-text-outline" size={24} color={Colors.textSecondary} />
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </View>
    );
}

const getStyles = (Colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        backgroundColor: Colors.headerBackground,
        paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10,
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        shadowColor: Colors.shadow || '#000', // Ensure shadow is defined
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 8,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.headerText,
    },
    scrollContent: {
        paddingVertical: 20,
        paddingHorizontal: 15,
    },
    section: {
        backgroundColor: Colors.cardBackground,
        borderRadius: 12,
        marginBottom: 20,
        shadowColor: Colors.shadow || '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden', // Ensures border radius clips content
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.primary,
        padding: 15,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.borderColor,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 15,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.borderColor,
    },
    settingActionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 15,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.borderColor,
    },
    settingText: {
        fontSize: 16,
        color: Colors.textPrimary,
        flex: 1, // Allow text to take available space
    },
    settingValue: {
        fontSize: 16,
        color: Colors.textSecondary,
    },
});