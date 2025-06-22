import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    RefreshControl,
    Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const Colors = {
    primary: '#3b82f6',
    background: '#f0f4f8',
    cardBackground: '#ffffff',
    textPrimary: '#1f2937',
    textSecondary: '#6b7280',
    shadow: 'rgba(0,0,0,0.1)',
};

const TAB_BAR_HEIGHT_IOS = 90;
const TAB_BAR_HEIGHT_ANDROID = 65;
const TAB_BAR_MARGIN_BOTTOM_ANDROID = 10;

const getEffectiveTabBarHeight = () => {
    return Platform.select({
        ios: TAB_BAR_HEIGHT_IOS,
        android: TAB_BAR_HEIGHT_ANDROID + TAB_BAR_MARGIN_BOTTOM_ANDROID,
        default: 75,
    });
};

const FAB_BUTTON_SIZE = 60;
const FAB_BASE_MARGIN = 20;
const FAB_BOTTOM_POSITION = getEffectiveTabBarHeight() + FAB_BASE_MARGIN;

export default function TruckListScreen({ navigation }) {
    const [trucks, setTrucks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [userRole, setUserRole] = useState(null);

    const API_BASE_URL = 'http://31.97.55.154:5000/api';

    // Récupérer le rôle de l'utilisateur
    useEffect(() => {
        const fetchUserRole = async () => {
            try {
                const token = await AsyncStorage.getItem('authToken');
                if (token) {
                    const res = await axios.get(`${API_BASE_URL}/auth/profile`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    setUserRole(res.data.role);
                } else {
                    setUserRole(null);
                }
            } catch (e) {
                setUserRole(null);
            }
        };
        fetchUserRole();
    }, []);

    const fetchTrucks = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
            setError("Jeton d'authentification manquant. Veuillez vous reconnecter.");
            setIsLoading(false);
            return;
        }
        try {
            const response = await axios.get(`${API_BASE_URL}/trucks`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const sortedTrucks = response.data.sort((a, b) => a.name.localeCompare(b.name));
            setTrucks(sortedTrucks);
        } catch (err) {
            if (err.response) {
                setError(`Erreur serveur (${err.response.status}): ${err.response.data?.message || "Impossible de charger les camions."}`);
            } else if (err.request) {
                setError("Erreur réseau: Impossible de contacter le serveur. Vérifiez votre connexion.");
            } else {
                setError(`Erreur: ${err.message || "Une erreur inattendue est survenue."}`);
            }
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [API_BASE_URL]);

    useEffect(() => {
        fetchTrucks();
        const unsubscribe = navigation.addListener('focus', () => {
            fetchTrucks();
        });
        return unsubscribe;
    }, [fetchTrucks, navigation]);

    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        fetchTrucks();
    }, [fetchTrucks]);

    const handleDeleteTruck = useCallback((id, truckName) => {
        Alert.alert(
            "Confirmer la suppression",
            `Êtes-vous sûr de vouloir supprimer le camion "${truckName}" ? Cette action est irréversible.`,
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Supprimer",
                    style: 'destructive',
                    onPress: async () => {
                        const token = await AsyncStorage.getItem('authToken');
                        if (!token) {
                            Alert.alert("Erreur", "Jeton d'authentification manquant.");
                            return;
                        }
                        try {
                            await axios.delete(`${API_BASE_URL}/trucks/${id}`, {
                                headers: { Authorization: `Bearer ${token}` },
                            });
                            Alert.alert("Succès", `Le camion "${truckName}" a été supprimé avec succès.`);
                            fetchTrucks();
                        } catch (err) {
                            let errorMessage = "Impossible de supprimer le camion.";
                            if (err.response) {
                                if (err.response?.status === 403) {
                                    errorMessage = "Vous n'avez pas les permissions nécessaires pour effectuer cette action.";
                                } else {
                                    errorMessage = `Erreur serveur (${err.response.status}): ${err.response.data?.message || errorMessage}`;
                                }
                            } else if (err.request) {
                                errorMessage = "Erreur réseau: Impossible de contacter le serveur.";
                            } else {
                                errorMessage = `Erreur: ${err.message || errorMessage}`;
                            }
                            Alert.alert("Erreur", errorMessage);
                        }
                    },
                },
            ],
            { cancelable: true }
        );
    }, [API_BASE_URL, fetchTrucks]);

    const getStatusStyles = (status) => {
        switch (status.toLowerCase()) {
            case 'disponible':
                return { backgroundColor: '#28a745', icon: 'check-circle' };
            case 'en livraison':
                return { backgroundColor: '#ffc107', icon: 'truck-delivery' };
            case 'en maintenance':
                return { backgroundColor: '#dc3545', icon: 'hammer-wrench' };
            default:
                return { backgroundColor: '#6c757d', icon: 'help-circle' };
        }
    };

    const renderItem = useCallback(({ item }) => {
        const { backgroundColor, icon } = getStatusStyles(item.status);
        return (
            <View style={styles.truckCard}>
                <View style={styles.cardHeader}>
                    <MaterialCommunityIcons name="truck-cargo-container" size={30} color="#3b82f6" style={styles.cardIcon} />
                    <View style={styles.headerContent}>
                        <Text style={styles.truckName}>{item.name}</Text>
                        <View style={[styles.statusBadge, { backgroundColor }]}>
                            <MaterialCommunityIcons name={icon} size={14} color="#fff" />
                            <Text style={styles.statusText}>{item.status}</Text>
                        </View>
                    </View>
                </View>
                <View style={styles.cardDetails}>
                    <Text style={styles.detailText}>
                        <Ionicons name="car-outline" size={16} color="#666" /> Plaque: <Text style={styles.detailValue}>{item.licensePlate}</Text>
                    </Text>
                    <Text style={styles.detailText}>
                        <Ionicons name="cube-outline" size={16} color="#666" /> Capacité: <Text style={styles.detailValue}>{item.capacity} kg</Text>
                    </Text>
                </View>
                {userRole === 'admin' && (
                    <View style={styles.actionsContainer}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => navigation.navigate('TruckForm', { truckId: item._id, truckData: item })}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="pencil-outline" size={22} color="#3b82f6" />
                            <Text style={[styles.actionText, { color: '#3b82f6' }]}>Modifier</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleDeleteTruck(item._id, item.name)}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="trash-outline" size={22} color="#ef4444" />
                            <Text style={[styles.actionText, { color: '#ef4444' }]}>Supprimer</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    }, [navigation, handleDeleteTruck, getStatusStyles, userRole]);

    if (isLoading || userRole === null) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Chargement des camions...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="warning-outline" size={60} color="#dc3545" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
                    <Ionicons name="reload-outline" size={20} color="#fff" />
                    <Text style={styles.retryButtonText}>Réessayer</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Ionicons name="truck-outline" size={36} color="#fff" style={styles.headerIcon} />
                <Text style={styles.mainTitle}>Flotte de Camions</Text>
                <Text style={styles.subTitle}>Gérez vos véhicules de transport</Text>
            </View>

            {trucks.length === 0 ? (
                <View style={styles.emptyListContainer}>
                    <MaterialCommunityIcons name="truck-off-outline" size={80} color="#ccc" />
                    <Text style={styles.emptyListText}>Aucun camion enregistré pour le moment.</Text>
                    {userRole === 'admin' && (
                        <TouchableOpacity
                            style={styles.emptyAddButton}
                            onPress={() => navigation.navigate('TruckForm')}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="add-circle-outline" size={24} color="#fff" />
                            <Text style={styles.emptyAddButtonText}>Ajouter un premier camion</Text>
                        </TouchableOpacity>
                    )}
                </View>
            ) : (
                <FlatList
                    data={trucks}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={onRefresh}
                            colors={[Colors.primary]}
                            tintColor={Colors.primary}
                        />
                    }
                />
            )}

            {/* Floating Action Button (FAB) pour ajouter un camion */}
            {trucks.length > 0 && userRole === 'admin' && (
                <TouchableOpacity
                    style={[styles.fab, { bottom: FAB_BOTTOM_POSITION }]}
                    onPress={() => navigation.navigate('TruckForm')}
                    activeOpacity={0.8}
                >
                    <Ionicons name="add" size={30} color="#fff" />
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f4f8' },
    header: {
        backgroundColor: '#3b82f6',
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
        marginBottom: 20,
    },
    headerIcon: { marginBottom: 10 },
    mainTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 5,
        letterSpacing: 0.5,
    },
    subTitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f4f8',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#555',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f0f4f8',
    },
    errorText: {
        fontSize: 16,
        color: '#dc3545',
        textAlign: 'center',
        marginTop: 15,
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
    },
    retryButtonText: {
        color: '#fff',
        marginLeft: 8,
        fontSize: 16,
        fontWeight: '600',
    },
    listContent: {
        paddingHorizontal: 15,
        paddingBottom: FAB_BOTTOM_POSITION + FAB_BUTTON_SIZE + 20,
        paddingTop: 30
    },
    truckCard: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 8,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#eee',
        paddingBottom: 10,
    },
    cardIcon: { marginRight: 15 },
    headerContent: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    truckName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 5,
        paddingHorizontal: 12,
        borderRadius: 20,
        marginLeft: 10,
    },
    statusText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#fff',
        textTransform: 'uppercase',
        marginLeft: 5,
    },
    cardDetails: {
        paddingTop: 10,
        marginBottom: 10,
    },
    detailText: {
        fontSize: 16,
        color: '#555',
        marginBottom: 5,
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailValue: { fontWeight: '600', color: '#333' },
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 15,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#eee',
        paddingTop: 15,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 25,
    },
    actionText: {
        fontSize: 15,
        fontWeight: '600',
        marginLeft: 8,
    },
    emptyListContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyListText: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 18,
        color: '#888',
        marginBottom: 30,
    },
    emptyAddButton: {
        flexDirection: 'row',
        backgroundColor: '#28a745',
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
    emptyAddButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '600',
        marginLeft: 10,
    },
    fab: {
        position: 'absolute',
        width: FAB_BUTTON_SIZE,
        height: FAB_BUTTON_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
        right: 30,
        backgroundColor: '#3b82f6',
        borderRadius: FAB_BUTTON_SIZE / 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
});