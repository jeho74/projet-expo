import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    Alert, // Import Alert for better user feedback
    Platform, // For platform-specific styles
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons'; // For icons in header and feedback

const API_BASE_URL = 'http://31.97.55.154:5000/api/auth'; // Centralize API base URL

const AddUserScreen = ({ navigation }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('driver'); // valeur par défaut correcte
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState({ message: '', type: '' }); // { message: '...', type: 'success' | 'error' | 'warning' }

    const validateEmail = (email) => {
        const re = /\S+@\S+\.\S+/;
        return re.test(email);
    };

    const handleAddUser = async () => {
        setFeedback({ message: '', type: '' }); // Clear previous feedback

        if (!name || !email || !password || !role) {
            setFeedback({ message: "Tous les champs sont obligatoires.", type: 'error' });
            return;
        }
        if (!validateEmail(email)) {
            setFeedback({ message: "Veuillez entrer une adresse email valide.", type: 'error' });
            return;
        }
        if (password.length < 6) {
            setFeedback({ message: "Le mot de passe doit contenir au moins 6 caractères.", type: 'error' });
            return;
        }

        setLoading(true);

        try {
            const token = await AsyncStorage.getItem('authToken');
            console.log('Token admin:', token);

            const res = await axios.post(
                `${API_BASE_URL}/register`,
                { name, email, password, role },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setFeedback({ message: "✅ Utilisateur ajouté avec succès.", type: 'success' });
            Alert.alert("Succès", "L'utilisateur a été ajouté avec succès!");
            // Optionally clear form or navigate back after success
            setName('');
            setEmail('');
            setPassword('');
            setRole('driver'); // Reset to default
            // Consider navigating back after a short delay for user to read success message
            // setTimeout(() => navigation.goBack(), 1500);

        } catch (err) {
            if (err.response) {
                if (err.response.status === 403) {
                    setFeedback({ message: "❌ Seuls les administrateurs peuvent créer un utilisateur.", type: 'error' });
                } else if (err.response.status === 400) {
                    setFeedback({ message: `⚠️ ${err.response.data.message || "Email déjà utilisé ou champs invalides."}`, type: 'warning' });
                } else {
                    setFeedback({ message: `❌ Erreur du serveur: ${err.response.data?.message || "Une erreur est survenue."}`, type: 'error' });
                }
            } else if (err.request) {
                setFeedback({ message: "❌ Erreur réseau: Impossible de joindre le serveur.", type: 'error' });
            } else {
                setFeedback({ message: `❌ Erreur inattendue: ${err.message}`, type: 'error' });
            }
            Alert.alert("Erreur", feedback.message || "Une erreur est survenue lors de l'ajout de l'utilisateur.");
        } finally {
            setLoading(false);
        }
    };

    // Function to navigate back
    const handleGoBack = () => {
        navigation.goBack(); // This goes back to the previous screen in the stack (UserListScreen)
    };

    return (
        <View style={styles.fullScreenContainer}>
            {/* Custom Header with Back Button */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                    <Ionicons name="arrow-back-outline" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Ajouter un utilisateur</Text>
                <View style={styles.headerRightPlaceholder} />
            </View>

            <ScrollView contentContainerStyle={styles.container}>

                {feedback.message ? (
                    <View style={[styles.feedbackContainer, styles[`feedback${feedback.type}`]]}>
                        <Ionicons
                            name={
                                feedback.type === 'success' ? 'checkmark-circle' :
                                feedback.type === 'error' ? 'close-circle' :
                                'warning'
                            }
                            size={20}
                            color={
                                feedback.type === 'success' ? '#10b981' :
                                feedback.type === 'error' ? '#ef4444' :
                                '#f59e0b'
                            }
                            style={styles.feedbackIcon}
                        />
                        <Text style={[styles.feedbackText, styles[`feedbackText${feedback.type}`]]}>
                            {feedback.message}
                        </Text>
                    </View>
                ) : null}

                <Text style={styles.label}>Nom complet</Text>
                <TextInput
                    placeholder="Nom complet"
                    value={name}
                    onChangeText={setName}
                    style={styles.input}
                    autoCapitalize="words"
                />

                <Text style={styles.label}>Email</Text>
                <TextInput
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.input}
                />

                <Text style={styles.label}>Mot de passe</Text>
                <TextInput
                    placeholder="Mot de passe"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    style={styles.input}
                />

                <Text style={styles.label}>Rôle</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={role}
                        onValueChange={(itemValue) => setRole(itemValue)}
                        style={styles.picker}
                        itemStyle={styles.pickerItem} // Style for Android items (not all props supported on iOS)
                    >
                        <Picker.Item label="Administrateur" value="admin" />
                        <Picker.Item label="Contrôleur" value="controller" />
                        <Picker.Item label="Chauffeur" value="driver" />
                    </Picker>
                </View>

                <TouchableOpacity
                    onPress={handleAddUser}
                    style={styles.primaryButton}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Créer l'utilisateur</Text>
                    )}
                </TouchableOpacity>

               
               
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    fullScreenContainer: {
        flex: 1,
        backgroundColor: '#f3f4f6', // Match background
    },
    header: {
        backgroundColor: '#3b82f6', // Primary blue
        paddingTop: Platform.OS === 'ios' ? 60 : 30, // Adjust for status bar/notch
        paddingBottom: 20,
        paddingHorizontal: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 8,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerRightPlaceholder: {
        width: 24, // To balance the back button on the left
    },
    container: {
        padding: 20,
        paddingTop: 30, // Add more space below the header
        flexGrow: 1,
    },
    title: {
        fontSize: 24, // Larger title to stand out
        fontWeight: 'bold',
        marginBottom: 25, // More space
        color: '#111827',
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 10, // More rounded corners
        padding: 15, // Increased padding
        marginBottom: 18, // More space between inputs
        backgroundColor: '#fff',
        fontSize: 16, // Larger font size
        color: '#374151',
    },
    label: {
        marginBottom: 8, // More space below label
        color: '#4b5563', // Darker gray for labels
        fontWeight: '600', // Bolder label
        fontSize: 15,
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 10,
        marginBottom: 18,
        backgroundColor: '#fff',
        overflow: 'hidden', // Ensures borderRadius applies correctly to Picker on Android
    },
    picker: {
        height: 55, // Taller picker
        width: '100%', // Ensure it takes full width
        color: '#374151',
    },
    pickerItem: {
        fontSize: 16, // Font size for picker items
    },
    primaryButton: {
        backgroundColor: '#10b981', // Green for primary action
        padding: 16,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10, // Space above
        marginBottom: 10, // Space below for the secondary button
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 4,
    },
    secondaryButton: {
        backgroundColor: '#6b7280', // Gray for secondary action
        padding: 16,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 4,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 17, // Larger text for buttons
    },
    secondaryButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 17,
    },
    feedbackContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
        borderWidth: 1,
    },
    feedbacksuccess: {
        backgroundColor: '#ecfdf5', // Light green
        borderColor: '#34d399',
    },
    feedbackerror: {
        backgroundColor: '#fee2e2', // Light red
        borderColor: '#ef4444',
    },
    feedbackwarning: {
        backgroundColor: '#fffbeb', // Light orange
        borderColor: '#f59e0b',
    },
    feedbackIcon: {
        marginRight: 10,
    },
    feedbackText: {
        fontSize: 15,
        flexShrink: 1, // Allow text to wrap
    },
    feedbackTextsuccess: {
        color: '#059669', // Darker green
    },
    feedbackTexterror: {
        color: '#dc2626', // Darker red
    },
    feedbackTextwarning: {
        color: '#d97706', // Darker orange
    },
});

export default AddUserScreen;