import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, ActivityIndicator, StyleSheet, ScrollView, Alert, RefreshControl, Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;

// === Composant StatCard amélioré avec icônes et structure flex ===
const StatCard = ({ title, value, color, subtitle, iconName, iconFamily = 'Ionicons' }) => {
    const IconComponent =
        iconFamily === 'FontAwesome5' ? FontAwesome5 :
        iconFamily === 'MaterialCommunityIcons' ? MaterialCommunityIcons :
        Ionicons;

    return (
        <View style={[styles.card, { borderLeftColor: color }]}>
            {/* Conteneur pour l'icône en haut à droite */}
            <View style={styles.cardIconBadge}>
                <IconComponent name={iconName} size={22} color={color} />
            </View>

            {/* Contenu principal de la carte */}
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{title}</Text>
                <Text style={[styles.cardValue, { color }]}>{value}</Text>
                {subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
            </View>
        </View>
    );
};

// === Composant DashboardScreen ===
const DashboardScreen = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const getToken = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            return token;
        } catch (e) {
            console.error('Failed to get token from AsyncStorage', e);
            setError("Erreur de stockage local : impossible de récupérer le jeton.");
            return null;
        }
    }, []);

    const fetchStats = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const token = await getToken();
            if (!token) {
                setError("Jeton d'authentification manquant. Veuillez vous reconnecter.");
                setLoading(false);
                return;
            }

            console.log('Requête API /stats envoyée avec le jeton...');

            const response = await api.get('/stats', {
                headers: {
                    Authorization: `Bearer ${token}`
                },
            });

            console.log('Réponse de l\'API /stats :', response.data);

            if (response.status === 200) {
                setStats(response.data);
            } else {
                setError(`Erreur de l'API : ${response.status} - ${response.statusText || 'Réponse inattendue'}`);
                Alert.alert("Erreur API", `Échec de la récupération des statistiques: ${response.status}`);
            }
        } catch (err) {
            console.error('Erreur lors de la récupération des statistiques:', err);

            if (err.response) {
                setError(`Erreur du serveur (${err.response.status}): ${err.response.data?.message || 'Une erreur est survenue sur le serveur.'}`);
                Alert.alert("Erreur Serveur", err.response.data?.message || "Échec de la récupération des statistiques.");
            } else if (err.request) {
                setError("Impossible de contacter le serveur. Vérifiez votre connexion internet ou l'adresse du serveur.");
                Alert.alert("Erreur Réseau", "Aucune réponse du serveur. Assurez-vous que le serveur est en ligne et que votre connexion internet fonctionne.");
            } else {
                setError(`Erreur inattendue: ${err.message}`);
                Alert.alert("Erreur Inattendue", `Une erreur inattendue est survenue: ${err.message}`);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [getToken]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchStats();
    }, [fetchStats]);

    // --- Rendu conditionnel ---

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Chargement des statistiques...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <ScrollView
                contentContainerStyle={styles.centered}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <Text style={styles.errorText}>Erreur: {error}</Text>
                <Ionicons
                    name="refresh-circle"
                    size={40}
                    color="#FF6347"
                    onPress={onRefresh}
                    style={styles.refreshIcon}
                />
                <Text style={styles.retryText}>Tirez pour rafraîchir ou appuyez sur l'icône.</Text>
            </ScrollView>
        );
    }

    if (!stats) {
        return (
            <ScrollView
                contentContainerStyle={styles.centered}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <Text style={styles.errorText}>Aucune statistique disponible.</Text>
                <Ionicons
                    name="refresh-circle"
                    size={40}
                    color="#999"
                    onPress={onRefresh}
                    style={styles.refreshIcon}
                />
                <Text style={styles.retryText}>Tirez pour rafraîchir ou appuyez sur l'icône.</Text>
            </ScrollView>
        );
    }

    // --- Rendu du tableau de bord ---
    return (
        <ScrollView
            contentContainerStyle={styles.scrollContainer}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {/* Entête du tableau de bord */}
            <View style={styles.headerContainer}>
                <View style={styles.headerIconBox}>
                    <Ionicons name="stats-chart" size={32} color="#fff" />
                </View>
                <Text style={styles.headerTitle}>Tableau de bord</Text>
                <Text style={styles.headerSubtitle}>Vue globale de l'activité du gaz</Text>
            </View>

            {/* Ligne 1 de cartes */}
            <View style={styles.row}>
                <StatCard
                    color="#3b82f6" // Bleu
                    title="Utilisateurs"
                    value={stats.totalUsers || 0}
                    subtitle="Comptes créés"
                    iconName="people"
                />
                <StatCard
                    color="#22c55e" // Vert
                    title="Chauffeurs"
                    value={stats.totalDrivers || 0}
                    subtitle="En activité"
                    iconName="truck"
                    iconFamily="FontAwesome5"
                />
            </View>

            {/* Ligne 2 de cartes */}
            <View style={styles.row}>
                <StatCard
                    color="#fbbf24" // Jaune/Orange
                    title="Livraisons"
                    value={stats.totalDeliveries || 0}
                    subtitle="Terminées"
                    iconName="cube"
                />
                <StatCard
                    color="#6366f1" // Indigo
                    title="Camions"
                    value={stats.totalTrucks || 0}
                    subtitle="Disponibles"
                    iconName="truck-fast"
                    iconFamily="MaterialCommunityIcons"
                />
            </View>

            <Text style={styles.section}>Stock actuel</Text>
            {/* Ligne 3 de cartes (stock) */}
            <View style={styles.row}>
                <StatCard
                    color="#10b981" // Vert-bleu
                    title="Bouteilles pleines"
                    value={stats.stock?.fullBottles || 0}
                    iconName="gas-cylinder"
                    iconFamily="MaterialCommunityIcons"
                />
                <StatCard
                    color="#f59e42" // Orange brûlé
                    title="Bouteilles vides"
                    value={stats.stock?.emptyBottles || 0}
                    iconName="gas-cylinder-outline"
                    iconFamily="MaterialCommunityIcons"
                />
            </View>
            <View style={styles.rowSingle}>
                <StatCard
                    color="#e11d48" // Rouge
                    title="Bouteilles consignées"
                    value={stats.stock?.consignedBottles || 0}
                    iconName="archive-outline"
                />
            </View>

            {/* Ligne 4 de cartes (salaires) */}
            <View style={styles.rowSingle}>
                <StatCard
                    color="#0ea5e9" // Bleu ciel
                    title="Salaires en attente"
                    value={stats.totalSalariesPending ? `${stats.totalSalariesPending} FCFA` : "0 FCFA"}
                    iconName="cash-outline"
                />
            </View>

            {/* Section pour les graphiques (toujours commentée par défaut) */}
            {/*
            <Text style={styles.section}>Visualisations</Text>
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Consommation Mensuelle (M³)</Text>
            </View>
            */}

        </ScrollView>
    );
};

// === Styles ===
const styles = StyleSheet.create({
    scrollContainer: {
        padding: 15,
        backgroundColor: '#f3f4f6',
        // --- DÉBUT DES MODIFICATIONS POUR UN DÉFILEMENT PLUS AMPLE ---
        flexGrow: 1, // Permet au contenu de s'étendre et de "pousser" la ScrollView pour le défilement
        paddingBottom: 50, // Ajoute un padding supplémentaire au bas de la ScrollView pour plus d'espace
        // Retire `minHeight: '100%'` et `alignItems: 'center'` car `flexGrow: 1` est plus flexible
        // et `alignItems` sur `contentContainerStyle` peut rendre le défilement "juste"
        // --- FIN DES MODIFICATIONS ---
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        padding: 20,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    errorText: {
        fontSize: 17,
        color: '#d9534f',
        textAlign: 'center',
        marginBottom: 15,
        paddingHorizontal: 20,
        fontWeight: 'bold',
    },
    refreshIcon: {
        marginBottom: 10,
    },
    retryText: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
    },

    // Header stylé et centré
    headerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 25,
        backgroundColor: '#fff',
        borderRadius: 15,
        paddingVertical: 25,
        paddingHorizontal: 15,
        width: '100%',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 6,
        marginTop: 10,
    },
    headerIconBox: {
        backgroundColor: '#3b82f6',
        width: 65,
        height: 65,
        borderRadius: 32.5,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,
        shadowColor: "#3b82f6",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#222',
        marginBottom: 5,
        letterSpacing: 0.8,
        textAlign: 'center',
    },
    headerSubtitle: {
        fontSize: 15,
        color: '#3b82f6',
        fontWeight: '600',
        textAlign: 'center',
    },

    section: {
        marginTop: 30,
        fontWeight: 'bold',
        fontSize: 20,
        marginBottom: 15,
        color: '#3b82f6',
        alignSelf: 'flex-start',
        width: '100%',
        paddingLeft: 5,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between', // Maintient un espace entre les deux cartes
        width: '100%',
        marginBottom: 15,
        paddingHorizontal: 5, // Ajout d'un petit padding pour mieux aligner les marges des cartes
    },
    rowSingle: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'center', // Centre la carte unique
        marginBottom: 15,
    },
    card: {
        flex: 1, // Permet aux cartes de prendre l'espace disponible
        backgroundColor: '#fff',
        marginHorizontal: 5, // Marges réduites pour mieux s'adapter
        borderRadius: 15,
        padding: 15, // Padding général de la carte
        paddingTop: 45, // Plus de padding en haut pour laisser de la place à l'icône
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
        alignItems: 'center',
        borderLeftWidth: 6,
        minHeight: 130, // Hauteur minimale légèrement augmentée
        justifyContent: 'center',
        position: 'relative', // Pour positionner l'icône badge
    },
    cardIconBadge: {
        position: 'absolute',
        top: 15,
        right: 15, // Positionne l'icône en haut à droite
        // Pas de fond ici, juste l'icône
    },
    cardContent: {
        alignItems: 'center', // Centre le contenu texte de la carte
        width: '100%',
    },
    cardTitle: {
        fontSize: 15, // Légèrement réduit pour mieux s'adapter
        fontWeight: '700',
        color: '#444',
        marginBottom: 5,
        textAlign: 'center',
    },
    cardValue: {
        fontSize: 26, // Légèrement réduit
        fontWeight: 'bold',
        marginVertical: 4,
        textAlign: 'center',
    },
    cardSubtitle: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
        textAlign: 'center',
    },
    noDataText: {
        textAlign: 'center',
        color: '#999',
        fontStyle: 'italic',
        marginTop: 10,
    }
});

export default DashboardScreen;