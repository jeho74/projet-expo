// screens/ActionLogScreen.js (Anciennement LogsScreen.js)
import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    Alert,
    RefreshControl, // Pour le pull-to-refresh
    TouchableOpacity, // Pour le bouton de réessai
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'; // Import des icônes
import api from '../services/api'; // Assurez-vous que le chemin est correct pour votre instance axios/api

// Fonction utilitaire pour obtenir une icône en fonction de l'action
const getActionIcon = (action) => {
    action = action.toLowerCase();
    if (action.includes('créé') || action.includes('ajouté') || action.includes('created') || action.includes('added')) {
        return { name: 'plus-circle', color: '#28a745' }; // Vert pour création
    }
    if (action.includes('mis à jour') || action.includes('modifié') || action.includes('updated') || action.includes('modified')) {
        return { name: 'pencil-circle', color: '#ffc107' }; // Jaune/Orange pour mise à jour
    }
    if (action.includes('supprimé') || action.includes('retiré') || action.includes('deleted') || action.includes('removed')) {
        return { name: 'minus-circle', color: '#dc3545' }; // Rouge pour suppression
    }
    if (action.includes('connecté') || action.includes('logged in')) {
        return { name: 'log-in', color: '#17a2b8' }; // Bleu clair pour connexion
    }
    if (action.includes('déconnecté') || action.includes('logged out')) {
        return { name: 'log-out', color: '#6c757d' }; // Gris pour déconnexion
    }
    if (action.includes('visualisé') || action.includes('viewed') || action.includes('consulté')) {
        return { name: 'eye-outline', color: '#8e44ad' }; // Violet pour consultation
    }
    return { name: 'information-circle', color: '#007bff' }; // Bleu par défaut
};

export default function ActionLogScreen() { // Renommé de LogsScreen à ActionLogScreen
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(''); // Pour gérer les messages d'erreur
    const [refreshing, setRefreshing] = useState(false); // Pour le RefreshControl

    // Fonction pour obtenir le token
    const getToken = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            return token;
        } catch (e) {
            console.error('Erreur lors de la récupération du jeton :', e);
            // Ne pas alerter l'utilisateur pour une erreur de token ici, l'erreur de fetch le fera
            return null;
        }
    }, []);

    // Fonction de récupération des logs
    const fetchLogs = useCallback(async () => {
        setIsLoading(true);
        setError(''); // Réinitialiser l'erreur
        try {
            const token = await getToken();
            if (!token) {
                setError("Jeton d'authentification manquant. Veuillez vous reconnecter.");
                setIsLoading(false);
                return;
            }

            console.log('Fetching logs with token...');

            // Utilisation de votre instance 'api'
            // Assurez-vous que votre API est configurée pour le chemin de base et que '/logs' est le bon endpoint
            const response = await api.get('/logs', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            console.log('API Response for /logs:', response.data);

            if (response.status === 200) {
                // Trier les logs par timestamp décroissant (les plus récents en premier)
                const sortedLogs = response.data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                setLogs(sortedLogs);
            } else {
                setError(`Erreur de l'API : ${response.status} - ${response.statusText || 'Réponse inattendue'}`);
                Alert.alert("Erreur API", `Échec du chargement des logs: ${response.status}`);
            }
        } catch (err) {
            console.error('Erreur lors du chargement des logs :', err);
            if (err.response) {
                // Erreur du serveur (ex: 401 Unauthorized, 403 Forbidden, 500 Internal Server Error)
                setError(`Erreur du serveur (${err.response.status}): ${err.response.data?.message || 'Impossible de charger les actions des utilisateurs.'}`);
                Alert.alert('Erreur Serveur', err.response.data?.message || 'Impossible de charger les actions des utilisateurs.');
            } else if (err.request) {
                // Erreur réseau (pas de réponse du serveur)
                setError("Problème réseau : Impossible de contacter le serveur. Vérifiez votre connexion.");
                Alert.alert('Erreur Réseau', 'Impossible de contacter le serveur. Vérifiez votre connexion internet.');
            } else {
                // Autres erreurs (ex: erreur de configuration de la requête)
                setError(`Erreur inattendue: ${err.message}`);
                Alert.alert('Erreur', `Une erreur inattendue est survenue: ${err.message}`);
            }
        } finally {
            setIsLoading(false);
            setRefreshing(false); // Arrêter l'indicateur de rafraîchissement
        }
    }, [getToken]); // fetchLogs dépend de getToken

    // Hook useEffect pour le premier chargement
    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]); // Déclenche fetchLogs lorsque la fonction fetchLogs change

    // Fonction appelée par le RefreshControl
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchLogs();
    }, [fetchLogs]);

    // Composant pour le rendu de chaque élément de log
    const renderLogItem = ({ item }) => {
        const { name, color } = getActionIcon(item.action);
        const timestamp = new Date(item.timestamp);
        const formattedDate = timestamp.toLocaleDateString('fr-FR', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });

        return (
            <View style={styles.logItem}>
                <View style={styles.logHeaderSection}>
                    <View style={[styles.logIconContainer, { backgroundColor: color + '20' }]}>
                        <Ionicons name={name} size={24} color={color} />
                    </View>
                    <View style={styles.logHeaderTextContent}>
                         {/* Vérifiez l'existence de user avant d'accéder à ses propriétés */}
                        <Text style={styles.userText} numberOfLines={1} ellipsizeMode="tail">
                            {item.user ? `${item.user.name} (${item.user.email})` : 'Utilisateur inconnu'}
                        </Text>
                        <Text style={styles.actionText}>{item.action}</Text>
                    </View>
                </View>
                
                <View style={styles.logDetailsSection}>
                    <Text style={styles.detailText}>
                        <Ionicons name="pricetag-outline" size={14} color="#6c757d" /> Cible : <Text style={styles.detailValue}>{item.target}</Text>
                    </Text>
                    {item.targetId && (
                        <Text style={styles.detailText}>
                            <Ionicons name="key-outline" size={14} color="#6c757d" /> ID : <Text style={styles.detailValue}>{item.targetId}</Text>
                        </Text>
                    )}
                    <Text style={styles.dateText}>
                        <Ionicons name="time-outline" size={14} color="#888" /> Le {formattedDate}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* En-tête de l'écran des logs */}
            <View style={styles.header}>
                <MaterialCommunityIcons name="clipboard-text-outline" size={32} color="#fff" style={styles.headerIcon} />
                <Text style={styles.headerTitle}>Journal d'Activités</Text>
                <Text style={styles.headerSubtitle}>Suivi détaillé des actions utilisateurs</Text>
            </View>

            {/* Contenu principal (chargement, erreur, ou liste) */}
            {isLoading ? (
                <View style={styles.centeredMessageContainer}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text style={styles.loadingText}>Chargement du journal d'activités...</Text>
                </View>
            ) : error ? (
                <View style={styles.centeredMessageContainer}>
                    <Ionicons name="alert-circle-outline" size={60} color="#dc3545" />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
                        <Ionicons name="reload-outline" size={20} color="#fff" />
                        <Text style={styles.retryButtonText}>Réessayer</Text>
                    </TouchableOpacity>
                </View>
            ) : logs.length === 0 ? (
                <View style={styles.centeredMessageContainer}>
                    <Ionicons name="clipboard-outline" size={60} color="#6c757d" />
                    <Text style={styles.noLogsText}>Aucune activité enregistrée pour le moment.</Text>
                    <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
                        <Ionicons name="refresh-outline" size={20} color="#fff" />
                        <Text style={styles.retryButtonText}>Rafraîchir</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={logs}
                    keyExtractor={(item) => item._id}
                    renderItem={renderLogItem}
                    contentContainerStyle={styles.flatListContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} tintColor="#3b82f6" />
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa', // Arrière-plan plus doux
    },
    header: {
        backgroundColor: '#3b82f6', // Bleu primaire
        paddingTop: 50, // Pour gérer l'encoche/barre de statut
        paddingBottom: 25,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000", // Ombre
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 5.84,
        elevation: 8,
        marginBottom: 20, // Espace sous l'en-tête
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
    centeredMessageContainer: { // Conteneur pour les messages centrés (chargement, erreur, vide)
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#555',
        textAlign: 'center',
    },
    errorText: {
        marginTop: 15,
        fontSize: 16,
        color: '#dc3545', // Rouge erreur
        textAlign: 'center',
        marginBottom: 15,
    },
    noLogsText: {
        marginTop: 15,
        fontSize: 17,
        color: '#6c757d', // Gris neutre
        textAlign: 'center',
        marginBottom: 15,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007bff', // Bleu pour réessayer
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
    flatListContent: {
        paddingHorizontal: 16, // Padding latéral pour la liste
        paddingBottom: 16, // Padding en bas
    },
    logItem: {
        backgroundColor: '#fff',
        borderRadius: 12, // Rayon plus grand
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 3,
        overflow: 'hidden', // Pour s'assurer que l'ombre est bien coupée
    },
    logHeaderSection: { // Renommé pour plus de clarté
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        paddingBottom: 8,
        borderBottomWidth: StyleSheet.hairlineWidth, // Ligne fine
        borderBottomColor: '#eee',
    },
    logIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    logHeaderTextContent: {
        flex: 1, // Prend l'espace restant
    },
    userText: {
        fontWeight: '700', // Plus gras
        fontSize: 15,
        color: '#34495e',
    },
    actionText: {
        fontSize: 14,
        color: '#2c3e50',
        marginTop: 2,
        fontWeight: '600', // Action en gras
    },
    logDetailsSection: { // Renommé pour plus de clarté
        marginTop: 8,
    },
    detailText: {
        fontSize: 13,
        color: '#555',
        marginBottom: 4,
        flexDirection: 'row', // Pour aligner icône et texte
        alignItems: 'center',
    },
    detailValue: { // Style spécifique pour la valeur du détail
        fontWeight: '600',
        color: '#333',
    },
    dateText: {
        fontSize: 12, // Plus petit
        color: '#888',
        marginTop: 6,
        fontStyle: 'italic',
        textAlign: 'right', // Aligne la date à droite
    },
});