import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    Alert,
    ScrollView,
    TouchableOpacity,
    Platform, // For platform-specific styles
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SalaryDetailScreen({ route, navigation }) {
    const { salaryId, salaryData: initialSalaryData } = route.params || {};
    const [salary, setSalary] = useState(initialSalaryData);
    const [isLoading, setIsLoading] = useState(true);
    const [isPaying, setIsPaying] = useState(false);
    const [error, setError] = useState(null); // To manage fetch errors

    const API_BASE_URL = 'http://31.97.55.154:5000/api'; // Your backend server address

    const fetchSalaryDetails = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        if (!salaryId && !initialSalaryData) {
            Alert.alert('Erreur', 'Aucun ID de salaire ou données fournies. Retour à la liste.');
            navigation.goBack();
            return;
        }

        // If initial data is provided, use it directly and avoid fetching
        if (initialSalaryData && initialSalaryData._id === salaryId) {
            setSalary(initialSalaryData);
            setIsLoading(false);
            return;
        }

        // Otherwise, fetch data from the API
        try {
            const token = await AsyncStorage.getItem('authToken'); // Ensure correct token key
            if (!token) {
                setError("Jeton d'authentification manquant. Veuillez vous reconnecter.");
                setIsLoading(false);
                return;
            }

            const response = await axios.get(`${API_BASE_URL}/salaries/${salaryId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSalary(response.data);
        } catch (err) {
            console.error("Erreur lors de la récupération des détails du salaire:", err);
            if (err.response) {
                setError(`Erreur serveur (${err.response.status}): ${err.response.data?.message || "Impossible de charger les détails du salaire."}`);
            } else if (err.request) {
                setError("Erreur réseau: Impossible de contacter le serveur. Vérifiez votre connexion.");
            } else {
                setError(`Erreur inattendue: ${err.message || "Une erreur inconnue est survenue."}`);
            }
            // If there's an error, maybe navigate back or show a retry option
            // Alert.alert("Erreur", "Impossible de charger les détails du salaire.");
            // navigation.goBack(); // Consider whether to go back immediately or show error
        } finally {
            setIsLoading(false);
        }
    }, [salaryId, initialSalaryData, navigation]);

    useEffect(() => {
        fetchSalaryDetails();
        // Add listener to refetch if screen comes into focus
        const unsubscribe = navigation.addListener('focus', () => {
            if (!initialSalaryData) { // Only refetch if not coming from already loaded data
                fetchSalaryDetails();
            }
        });
        return unsubscribe;
    }, [fetchSalaryDetails, initialSalaryData, navigation]);

    const handlePaySalary = useCallback(async () => {
        if (!salary || salary.status === 'payé' || isPaying) return;

        Alert.alert(
            "Confirmer le Paiement",
            `Êtes-vous sûr de vouloir marquer le salaire de ${salary.driver?.name || 'ce chauffeur'} d'un montant de ${salary.salaryAmount.toFixed(2)} € comme "payé" ?`,
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Payer",
                    style: 'destructive', // Indicate a potentially irreversible action
                    onPress: async () => {
                        setIsPaying(true);
                        try {
                            const token = await AsyncStorage.getItem('authToken');
                            if (!token) {
                                Alert.alert("Erreur", "Jeton d'authentification manquant.");
                                return;
                            }
                            await axios.put(`${API_BASE_URL}/salaries/pay/${salary._id}`, {}, {
                                headers: { Authorization: `Bearer ${token}` }
                            });

                            setSalary(prev => ({ ...prev, status: 'payé' }));
                            Alert.alert('Succès', 'Salaire marqué comme payé !');
                            // Optionally navigate back after successful payment
                            navigation.goBack();
                        } catch (err) {
                            console.error('Erreur lors du paiement du salaire:', err);
                            let errorMessage = 'Échec du paiement du salaire.';
                            if (err.response) {
                                if (err.response.status === 403) {
                                    errorMessage = 'Vous n\'avez pas la permission de marquer ce salaire comme payé.';
                                } else {
                                    errorMessage = `Erreur serveur (${err.response.status}): ${err.response.data?.message || errorMessage}`;
                                }
                            } else if (err.request) {
                                errorMessage = "Erreur réseau: Impossible de contacter le serveur.";
                            } else {
                                errorMessage = `Une erreur inattendue est survenue: ${err.message}`;
                            }
                            Alert.alert('Erreur', errorMessage);
                        } finally {
                            setIsPaying(false);
                        }
                    },
                },
            ]
        );
    }, [salary, isPaying, navigation]); // Dependencies: salary and isPaying state

    // Render loading state
    if (isLoading) {
        return (
            <View style={styles.centeredContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.messageText}>Chargement des détails du salaire...</Text>
            </View>
        );
    }

    // Render error state
    if (error) {
        return (
            <View style={styles.centeredContainer}>
                <Ionicons name="warning-outline" size={60} color="#dc3545" />
                <Text style={styles.errorMessageText}>{error}</Text>
                <TouchableOpacity onPress={fetchSalaryDetails} style={styles.retryButton}>
                    <Ionicons name="reload-outline" size={20} color="#fff" />
                    <Text style={styles.retryButtonText}>Réessayer</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Render if no salary data is available (after loading and no error)
    if (!salary) {
        return (
            <View style={styles.centeredContainer}>
                <Ionicons name="alert-circle-outline" size={60} color="#95a5a6" />
                <Text style={styles.messageText}>Détails du salaire non disponibles.</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.retryButton}>
                    <Ionicons name="arrow-back-outline" size={20} color="#fff" />
                    <Text style={styles.retryButtonText}>Retour</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Determine status badge style
    const isPaid = salary.status === 'payé';
    const statusBadgeStyle = isPaid ? styles.statusPaidBadge : styles.statusPendingBadge;
    const statusBadgeTextStyle = isPaid ? styles.statusPaidText : styles.statusPendingText;

    return (
        <ScrollView contentContainerStyle={styles.container}>
            {/* Header Section */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Ionicons name="receipt-outline" size={36} color="#fff" style={styles.headerIcon} />
                <Text style={styles.headerTitle}>Détails du Salaire</Text>
                <Text style={styles.headerSubtitle}>Vue complète du bulletin de paie</Text>
            </View>

            <View style={styles.detailCard}>
                <View style={styles.cardSection}>
                    <Text style={styles.sectionTitle}>Informations Générales</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Chauffeur:</Text>
                        <Text style={styles.value}>{salary.driver?.name || 'Non spécifié'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Statut:</Text>
                        <View style={[styles.statusBadge, statusBadgeStyle]}>
                            <Text style={statusBadgeTextStyle}>{salary.status.toUpperCase()}</Text>
                        </View>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Généré le:</Text>
                        <Text style={styles.valueDate}>{new Date(salary.createdAt).toLocaleString('fr-FR')}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Dernière mise à jour:</Text>
                        <Text style={styles.valueDate}>{new Date(salary.updatedAt).toLocaleString('fr-FR')}</Text>
                    </View>
                </View>

                <View style={styles.separator} />

                <View style={styles.cardSection}>
                    <Text style={styles.sectionTitle}>Détails des Activités</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Total Livraisons:</Text>
                        <Text style={styles.value}>{salary.totalDeliveries}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Bouteilles Vendues:</Text>
                        <Text style={styles.value}>{salary.totalBottlesSold}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Bouteilles Consignées:</Text>
                        <Text style={styles.value}>{salary.totalConsignedBottles}</Text>
                    </View>
                </View>

                <View style={styles.separator} />

                <View style={styles.cardSection}>
                    <Text style={styles.sectionTitle}>Montant Net</Text>
                    <Text style={styles.valueAmount}>{salary.salaryAmount.toFixed(2)} €</Text>
                </View>

                {salary.status === 'en attente' && (
                    <TouchableOpacity
                        style={styles.payButton}
                        onPress={handlePaySalary}
                        disabled={isPaying}
                        activeOpacity={0.8}
                    >
                        {isPaying ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <>
                                <Ionicons name="card-outline" size={24} color="#fff" />
                                <Text style={styles.payButtonText}>Marquer comme Payé</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#f0f4f8',
        paddingBottom: 30, // Some padding at the bottom
    },
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f4f8',
        padding: 20,
    },
    messageText: {
        marginTop: 15,
        fontSize: 16,
        color: '#555',
        textAlign: 'center',
    },
    errorMessageText: {
        marginTop: 15,
        fontSize: 16,
        color: '#dc3545',
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007bff',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
        marginTop: 20,
    },
    retryButtonText: {
        color: '#fff',
        marginLeft: 8,
        fontSize: 16,
        fontWeight: '600',
    },
    header: {
        backgroundColor: '#3b82f6', // Primary blue
        paddingTop: Platform.OS === 'ios' ? 60 : 30,
        paddingBottom: 25,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
        marginBottom: 25,
    },
    backButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 55 : 25,
        left: 20,
        zIndex: 1,
        padding: 5,
    },
    headerIcon: {
        marginBottom: 10,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 5,
        letterSpacing: 0.5,
    },
    headerSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
    },
    detailCard: {
        backgroundColor: '#fff',
        marginHorizontal: 20,
        borderRadius: 15, // More rounded corners
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 7,
    },
    cardSection: {
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 8,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    label: {
        fontSize: 16,
        color: '#555',
        fontWeight: '600', // Slightly bolder for labels
        flex: 1, // Allow label to take space
    },
    value: {
        fontSize: 17,
        color: '#333',
        fontWeight: 'normal',
        textAlign: 'right', // Align value to the right
        flex: 1.5, // Allow value to take more space
    },
    valueAmount: {
        fontSize: 32, // Larger for emphasis
        fontWeight: 'bold',
        color: '#3b82f6', // Primary blue
        marginTop: 10,
        textAlign: 'center', // Center the main amount
    },
    valueDate: {
        fontSize: 15,
        color: '#777',
        textAlign: 'right',
        fontStyle: 'italic', // Italicize dates
    },
    statusBadge: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        minWidth: 90,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusPendingBadge: {
        backgroundColor: '#f39c12', // Orange for pending
    },
    statusPaidBadge: {
        backgroundColor: '#2ecc71', // Green for paid
    },
    statusPendingText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#fff',
        textTransform: 'uppercase',
    },
    statusPaidText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#fff',
        textTransform: 'uppercase',
    },
    separator: {
        height: 1,
        backgroundColor: '#e0e0e0',
        marginVertical: 20,
        marginHorizontal: -20, // Extend across the card width
    },
    payButton: {
        flexDirection: 'row',
        backgroundColor: '#28a745', // Green for action
        padding: 16,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 6,
    },
    payButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
    },
});