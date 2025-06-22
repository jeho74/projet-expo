import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
    Platform,
    TextInput,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/auth';

export default function StockOverviewScreen({ navigation }) {
    const [stockData, setStockData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [partialStock, setPartialStock] = useState({
        fullBottles: '',
        emptyBottles: '',
        consignedBottles: '',
    });
    const [userRole, setUserRole] = useState(null);

    // Récupère le rôle utilisateur au chargement
    useEffect(() => {
        const fetchUserRole = async () => {
            try {
                const res = await api.get('/auth/profile');
                setUserRole(res.data.role);
            } catch (err) {
                setUserRole(null);
            }
        };
        fetchUserRole();
    }, []);

    const fetchStockData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.get('/stock');
            setStockData(response.data);
        } catch (err) {
            console.error("Erreur lors de la récupération du stock:", err);
            setStockData(null);
            if (err.response) {
                setError(`Erreur serveur (${err.response.status}): ${err.response.data?.message || "Impossible de charger les données de stock."}`);
            } else if (err.request) {
                setError("Erreur réseau: Impossible de contacter le serveur. Vérifiez votre connexion.");
            } else {
                setError(`Erreur inattendue: ${err.message || "Une erreur inconnue est survenue."}`);
            }
            Alert.alert("Erreur", "Impossible de charger les données de stock.");
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchStockData();
        const unsubscribe = navigation.addListener('focus', fetchStockData);
        return unsubscribe;
    }, [navigation, fetchStockData]);

    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        fetchStockData();
    }, [fetchStockData]);

    const handlePartialAddStock = async () => {
        const payload = {
            fullBottles: parseInt(partialStock.fullBottles) || 0,
            emptyBottles: parseInt(partialStock.emptyBottles) || 0,
            consignedBottles: parseInt(partialStock.consignedBottles) || 0,
        };

        try {
            const response = await api.patch('/stock', payload);
            if (response.status === 200) {
                Alert.alert('Succès', 'Stock mis à jour partiellement.');
                setModalVisible(false);
                setPartialStock({ fullBottles: '', emptyBottles: '', consignedBottles: '' });
                fetchStockData();
            }
        } catch (err) {
            console.error('Erreur PATCH stock:', err);
            Alert.alert('Erreur', err.response?.data?.message || 'Erreur serveur');
        }
    };

    // Affichage du loader si le rôle n'est pas encore chargé
    if (userRole === null || isLoading) {
        return (
            <View style={styles.centeredContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.messageText}>Chargement des données de stock...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centeredContainer}>
                <Ionicons name="warning-outline" size={60} color="#dc3545" />
                <Text style={styles.errorMessageText}>{error}</Text>
                <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
                    <Ionicons name="reload-outline" size={20} color="#fff" />
                    <Text style={styles.retryButtonText}>Réessayer</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!stockData || Object.keys(stockData).length === 0) {
        return (
            <View style={styles.emptyStateContainer}>
                <Ionicons name="cube-outline" size={80} color="#ccc" />
                <Text style={styles.emptyStateText}>Aucune donnée de stock disponible.</Text>
                <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
                    <Ionicons name="reload-outline" size={20} color="#fff" />
                    <Text style={styles.retryButtonText}>Charger le stock</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView
            contentContainerStyle={styles.container}
            refreshControl={
                <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={onRefresh}
                    colors={['#3b82f6']}
                    tintColor="#3b82f6"
                />
            }
        >
            {/* Header */}
            <View style={styles.header}>
                <Ionicons name="bar-chart-outline" size={36} color="#fff" style={styles.headerIcon} />
                <Text style={styles.headerTitle}>Vue d'Ensemble du Stock</Text>
                <Text style={styles.headerSubtitle}>Suivi en temps réel de votre inventaire</Text>
            </View>

            {/* Résumé */}
            <View style={styles.summaryGrid}>
                <View style={[styles.summaryCard, styles.fullBottlesCard]}>
                    <Ionicons name="checkmark-circle-outline" size={40} color="rgba(255,255,255,0.8)" style={styles.cardIconTop} />
                    <Text style={styles.cardValue}>{stockData.fullBottles}</Text>
                    <Text style={styles.cardTitle}>Bouteilles Pleines</Text>
                </View>
                <View style={[styles.summaryCard, styles.emptyBottlesCard]}>
                    <Ionicons name="sync-circle-outline" size={40} color="rgba(255,255,255,0.8)" style={styles.cardIconTop} />
                    <Text style={styles.cardValue}>{stockData.emptyBottles}</Text>
                    <Text style={styles.cardTitle}>Bouteilles Vides</Text>
                </View>
                <View style={[styles.summaryCard, styles.consignedBottlesCard]}>
                    <Ionicons name="albums-outline" size={40} color="rgba(255,255,255,0.8)" style={styles.cardIconTop} />
                    <Text style={styles.cardValue}>{stockData.consignedBottles}</Text>
                    <Text style={styles.cardTitle}>Bouteilles Consignées</Text>
                </View>
            </View>

            {/* Infos */}
            <View style={styles.infoCard}>
                <Text style={styles.infoText}>
                    <Ionicons name="information-circle-outline" size={16} color="#555" /> Les chiffres ci-dessus représentent l'état actuel de votre stock de bouteilles.
                </Text>
                <Text style={styles.lastUpdatedText}>
                    Dernière mise à jour: {stockData.updatedAt ? new Date(stockData.updatedAt).toLocaleString('fr-FR') : 'N/A'}
                </Text>
            </View>

            {/* Bouton d'ajout au stock - réservé au rôle controller */}
            {userRole === 'controller' && (
                <>
                    <TouchableOpacity style={styles.retryButton} onPress={() => setModalVisible(true)}>
                        <Ionicons name="add-circle-outline" size={20} color="#fff" />
                        <Text style={styles.retryButtonText}>Ajouter au Stock</Text>
                    </TouchableOpacity>

                    {/* Modal ajout partiel */}
                    <Modal visible={modalVisible} transparent animationType="slide">
                        <View style={styles.modalBackground}>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>Ajouter au Stock</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    placeholder="Bouteilles pleines"
                                    keyboardType="numeric"
                                    value={partialStock.fullBottles}
                                    onChangeText={(val) => setPartialStock({ ...partialStock, fullBottles: val })}
                                />
                                <TextInput
                                    style={styles.modalInput}
                                    placeholder="Bouteilles vides"
                                    keyboardType="numeric"
                                    value={partialStock.emptyBottles}
                                    onChangeText={(val) => setPartialStock({ ...partialStock, emptyBottles: val })}
                                />
                                <TextInput
                                    style={styles.modalInput}
                                    placeholder="Bouteilles consignées"
                                    keyboardType="numeric"
                                    value={partialStock.consignedBottles}
                                    onChangeText={(val) => setPartialStock({ ...partialStock, consignedBottles: val })}
                                />
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
                                    <TouchableOpacity style={[styles.retryButton, { flex: 1, marginRight: 10 }]} onPress={handlePartialAddStock}>
                                        <Text style={styles.retryButtonText}>Valider</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.retryButton, { flex: 1, backgroundColor: '#dc3545' }]} onPress={() => setModalVisible(false)}>
                                        <Text style={styles.retryButtonText}>Annuler</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>
                </>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#f0f4f8',
        paddingBottom: 30,
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
        justifyContent: 'center',
    },
    retryButtonText: {
        color: '#fff',
        marginLeft: 8,
        fontSize: 16,
        fontWeight: '600',
    },
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f0f4f8',
    },
    emptyStateText: {
        marginTop: 20,
        fontSize: 18,
        color: '#888',
        textAlign: 'center',
        marginBottom: 30,
    },
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
        marginBottom: 25,
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
    summaryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
        marginHorizontal: 10,
        marginBottom: 20,
    },
    summaryCard: {
        width: '45%',
        aspectRatio: 1,
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 15,
        margin: 8,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 7,
        borderBottomWidth: 5,
    },
    fullBottlesCard: {
        backgroundColor: '#2ecc71',
        borderBottomColor: '#27ae60',
    },
    emptyBottlesCard: {
        backgroundColor: '#e67e22',
        borderBottomColor: '#d35400',
    },
    consignedBottlesCard: {
        backgroundColor: '#3498db',
        borderBottomColor: '#2980b9',
    },
    cardIconTop: {
        marginBottom: 10,
    },
    cardValue: {
        fontSize: 38,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 5,
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    cardTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    infoCard: {
        backgroundColor: '#e3f2fd',
        borderRadius: 10,
        padding: 15,
        marginHorizontal: 20,
        marginTop: 10,
        borderLeftWidth: 5,
        borderLeftColor: '#2196f3',
        flexDirection: 'column',
        alignItems: 'flex-start',
    },
    infoText: {
        fontSize: 14,
        color: '#3f51b5',
        lineHeight: 20,
        marginBottom: 10,
    },
    lastUpdatedText: {
        fontSize: 13,
        color: '#7f8c8d',
        textAlign: 'right',
        width: '100%',
        fontStyle: 'italic',
    },
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        width: '80%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15
    },
    modalInput: {
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        marginBottom: 15,
        fontSize: 16,
        paddingVertical: 5
    }
});