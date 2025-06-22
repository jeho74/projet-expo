// screens/SalaryListScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
    Platform, // Pour les styles spécifiques à la plateforme
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Composant pour chaque carte de salaire (optimisé avec React.memo)
const SalaryCard = React.memo(({ item, handlePaySalary }) => {
    const isPaid = item.status === 'payé';
    const cardBorderColor = isPaid ? '#28a745' : '#ffc107'; // Vert pour payé, Jaune pour en attente

    return (
        <View style={[styles.salaryCard, { borderLeftColor: cardBorderColor }]}>
            <View style={styles.cardHeader}>
                <Text style={styles.driverName}>{item.driver?.name || 'Chauffeur inconnu'}</Text>
                <View style={[styles.statusBadge, isPaid ? styles.paye : styles.enAttente]}>
                    <Text style={styles.statusText}>{item.status}</Text>
                </View>
            </View>
            <Text style={styles.detailText}>Total livraisons : <Text style={styles.detailValue}>{item.totalDeliveries}</Text></Text>
            <Text style={styles.detailText}>Bouteilles vendues : <Text style={styles.detailValue}>{item.totalBottlesSold}</Text></Text>
            <Text style={styles.detailText}>Consignées : <Text style={styles.detailValue}>{item.totalConsignedBottles}</Text></Text>
            <Text style={styles.salaryAmount}>Salaire : {item.salaryAmount.toFixed(2)} €</Text>
            <Text style={styles.dateText}>Généré le : {new Date(item.createdAt).toLocaleDateString('fr-FR', {
                year: 'numeric', month: 'long', day: 'numeric'
            })}</Text>

            {item.status === 'en attente' && (
                <TouchableOpacity style={styles.payButton} onPress={() => handlePaySalary(item._id)}>
                    <Ionicons name="wallet-outline" size={20} color="#fff" />
                    <Text style={styles.payButtonText}>Payer le salaire</Text>
                </TouchableOpacity>
            )}
        </View>
    );
});


export default function SalaryListScreen({ navigation }) {
    const [salaries, setSalaries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null); // Pour gérer les erreurs

    const fetchSalaries = useCallback(async () => {
        setIsLoading(true);
        setError(null); // Réinitialiser l'erreur
        try {
            const token = await AsyncStorage.getItem('authToken');
            if (!token) {
                setError("Jeton d'authentification manquant. Veuillez vous reconnecter.");
                setIsLoading(false);
                return;
            }

            const res = await axios.get('http://31.97.55.154:5000/api/salaries', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            // Triez les salaires pour afficher les plus récents en premier
            const sortedSalaries = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setSalaries(sortedSalaries);
        } catch (err) {
            console.error("Erreur API GET /salaries:", err);
            if (err.response) {
                setError(`Erreur serveur (${err.response.status}): ${err.response.data?.message || "Impossible de charger les salaires."}`);
            } else if (err.request) {
                setError("Erreur réseau: Impossible de contacter le serveur. Vérifiez votre connexion.");
            } else {
                setError(`Erreur inattendue: ${err.message || "Une erreur inconnue est survenue."}`);
            }
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []); // Aucune dépendance ici pour que fetchSalaries ne soit pas recréé inutilement

    useEffect(() => {
        fetchSalaries();
        const unsubscribe = navigation.addListener('focus', fetchSalaries);
        return unsubscribe;
    }, [navigation, fetchSalaries]); // Ajout de fetchSalaries comme dépendance pour l'écouteur

    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        fetchSalaries();
    }, [fetchSalaries]); // Dépend de fetchSalaries

    const handlePaySalary = useCallback(async (salaryId) => {
        Alert.alert(
            "Confirmer le paiement",
            `Voulez-vous vraiment marquer ce salaire comme 'payé' ?`,
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Confirmer",
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('authToken');
                            if (!token) {
                                Alert.alert("Erreur", "Jeton d'authentification manquant.");
                                return;
                            }
                            await axios.put(`http://31.97.55.154:5000/api/salaries/pay/${salaryId}`, {}, {
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                },
                            });
                            Alert.alert("Succès", "Salaire marqué comme payé.");
                            fetchSalaries(); // Recharger la liste
                        } catch (err) {
                            console.error("Erreur API PUT /pay:", err);
                            let errorMessage = "Échec du marquage du salaire comme payé.";
                            if (err.response) {
                                errorMessage = `Erreur serveur (${err.response.status}): ${err.response.data?.message || errorMessage}`;
                            } else if (err.request) {
                                errorMessage = "Erreur réseau: Impossible de contacter le serveur.";
                            } else {
                                errorMessage = `Erreur inattendue: ${err.message || errorMessage}`;
                            }
                            Alert.alert("Erreur", errorMessage);
                        }
                    }
                }
            ]
        );
    }, [fetchSalaries]); // Dépend de fetchSalaries

    // Rendu conditionnel pour les états de chargement et d'erreur
    if (isLoading) {
        return (
            <View style={styles.centeredContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.messageText}>Chargement des salaires...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centeredContainer}>
                <Ionicons name="warning-outline" size={60} color="#dc3545" />
                <Text style={styles.errorMessageText}>{error}</Text>
                <TouchableOpacity onPress={fetchSalaries} style={styles.retryButton}>
                    <Ionicons name="reload-outline" size={20} color="#fff" />
                    <Text style={styles.retryButtonText}>Réessayer</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* En-tête de l'écran */}
            <View style={styles.header}>
                <Ionicons name="cash-outline" size={36} color="#fff" style={styles.headerIcon} />
                <Text style={styles.headerTitle}>Historique des Salaires</Text>
                <Text style={styles.headerSubtitle}>Visualisez et gérez les paiements</Text>
            </View>

            <TouchableOpacity
                style={styles.calculateButton}
                onPress={() => navigation.navigate('SalaryCalculation')} // Assurez-vous que 'SalaryCalculation' est le nom correct de la route
                activeOpacity={0.8}
            >
                <Ionicons name="calculator-outline" size={24} color="#fff" />
                <Text style={styles.calculateButtonText}>Calculer un nouveau salaire</Text>
            </TouchableOpacity>

            <FlatList
                data={salaries}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                    <SalaryCard item={item} handlePaySalary={handlePaySalary} />
                )}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={onRefresh}
                        colors={['#3b82f6']}
                        tintColor="#3b82f6"
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyListContainer}>
                        <Ionicons name="cash-outline" size={80} color="#ccc" />
                        <Text style={styles.emptyListText}>Aucun salaire n'a été calculé pour le moment.</Text>
                        <TouchableOpacity
                            style={styles.emptyStateCalculateButton}
                            onPress={() => navigation.navigate('SalaryCalculation')}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="calculator-outline" size={24} color="#fff" />
                            <Text style={styles.emptyStateCalculateButtonText}>Calculer le premier salaire</Text>
                        </TouchableOpacity>
                    </View>
                }
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f4f8',
    },
    header: {
        backgroundColor: '#3b82f6', // Bleu primaire
        paddingTop: Platform.OS === 'ios' ? 60 : 30, // Ajustement pour l'encoche
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
        marginBottom: 20,
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
    calculateButton: {
        flexDirection: 'row',
        backgroundColor: '#007bff', // Bleu vif
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 20, // Ajout de marges horizontales
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 6,
    },
    calculateButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '600',
        marginLeft: 10,
    },
    listContent: {
        paddingHorizontal: 15,
        paddingBottom: 20,
    },
    salaryCard: {
        backgroundColor: '#fff',
        borderRadius: 12, // Plus arrondi
        padding: 18,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 5,
        borderLeftWidth: 6, // Bordure colorée sur le côté
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    driverName: {
        fontSize: 20,
        fontWeight: '700', // Plus gras
        color: '#2c3e50',
        flex: 1, // Pour que le nom ne pousse pas le badge
    },
    statusBadge: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20, // Plus rond
        minWidth: 80, // Largeur minimale pour l'uniformité
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#fff',
        textTransform: 'capitalize', // Première lettre en majuscule
    },
    enAttente: {
        backgroundColor: '#f39c12', // Orange
    },
    paye: {
        backgroundColor: '#2ecc71', // Vert
    },
    detailText: {
        fontSize: 15,
        color: '#555',
        marginBottom: 4,
    },
    detailValue: {
        fontWeight: '600', // Un peu plus gras pour les valeurs
        color: '#34495e',
    },
    salaryAmount: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#3b82f6', // Bleu primaire pour le montant
        marginVertical: 10,
        textAlign: 'right', // Alignement à droite pour le montant
    },
    dateText: {
        fontSize: 13,
        color: '#888',
        marginTop: 8,
        textAlign: 'right', // Alignement à droite pour la date
    },
    payButton: {
        flexDirection: 'row',
        backgroundColor: '#28a745', // Vert
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 4,
    },
    payButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    emptyListContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        marginTop: 50, // Pour donner un peu d'espace si le header est grand
    },
    emptyListText: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 18,
        color: '#888',
        marginBottom: 30,
    },
    emptyStateCalculateButton: {
        flexDirection: 'row',
        backgroundColor: '#007bff', // Bleu vif
        paddingVertical: 14,
        paddingHorizontal: 25,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 6,
    },
    emptyStateCalculateButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '600',
        marginLeft: 10,
    },
});