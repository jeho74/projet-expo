import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    Platform,
    Dimensions, // Assurez-vous que Dimensions est bien importé
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/auth';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// --- COULEURS (DOIVENT CORRESPONDRE À VOTRE PALETTE GLOBALE SI DÉFINIE AILLEURS) ---
const Colors = {
    primary: '#3b82f6',
    background: '#f0f4f8',
    cardBackground: '#ffffff',
    textPrimary: '#1f2937',
    textSecondary: '#6b7280',
    shadow: 'rgba(0,0,0,0.1)',
};

// --- HAUTEURS ET MARGES DE LA BARRE D'ONGLETS ET DU FAB ---
// Ces valeurs DOIVENT correspondre à celles définies dans MainTabsAdmin.js pour tabBarStyle
const TAB_BAR_HEIGHT_IOS = 90; // Hauteur de la barre d'onglets sur iOS (inclut la safe area)
const TAB_BAR_HEIGHT_ANDROID = 65; // Hauteur de la barre d'onglets sur Android
const TAB_BAR_MARGIN_BOTTOM_ANDROID = 10; // Si vous avez un marginBottom sur Android dans tabBarStyle

// Calcul de la hauteur effective totale que la barre d'onglets occupe en bas de l'écran
const getEffectiveTabBarHeight = () => {
    return Platform.select({
        ios: TAB_BAR_HEIGHT_IOS,
        android: TAB_BAR_HEIGHT_ANDROID + TAB_BAR_MARGIN_BOTTOM_ANDROID,
        default: 75, // Fallback si la plateforme n'est pas iOS ou Android
    });
};

const FAB_BUTTON_SIZE = 60; // Hauteur et largeur de votre Floating Action Button (FAB)
const FAB_BASE_MARGIN = 20; // Marge entre le FAB et le haut de la barre d'onglets

// Calcul de la position 'bottom' du FAB pour le positionner au-dessus de la barre d'onglets
const FAB_BOTTOM_POSITION = getEffectiveTabBarHeight() + FAB_BASE_MARGIN;
// --- FIN DES HAUTEURS ET MARGES ---


// Fonction utilitaire pour obtenir une icône et couleur de rôle
const getRoleDetails = (role) => {
    role = role.toLowerCase();
    switch (role) {
        case 'admin':
            return { icon: 'shield-account', color: '#e74c3c' }; // Rouge pour admin
        case 'manager':
            return { icon: 'briefcase', color: '#f39c12' }; // Orange pour manager
        case 'employee':
            return { icon: 'account', color: '#2ecc71' }; // Vert pour employé
        case 'driver':
            return { icon: 'truck-fast', color: '#3498db' }; // Bleu pour chauffeur
        default:
            return { icon: 'account', color: '#95a5a6' }; // Gris par défaut
    }
};

// Composant UserItem optimisé avec React.memo
const UserItem = React.memo(({ item, onEdit, onDelete, currentUserId }) => {
    const { icon, color } = getRoleDetails(item.role);
    const isCurrentUser = item._id === currentUserId; // Pour empêcher la suppression de son propre compte

    return (
        <View style={[styles.userItem, { borderLeftColor: color }]}>
            <View style={styles.userInfo}>
                <View style={[styles.roleIconContainer, { backgroundColor: color + '20' }]}>
                    <MaterialCommunityIcons name={icon} size={24} color={color} />
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
                    <Text style={styles.userEmail} numberOfLines={1} ellipsizeMode="tail">{item.email}</Text>
                    <Text style={[styles.userRole, { color: color }]}>Rôle : <Text style={{ fontWeight: 'bold' }}>{item.role}</Text></Text>
                </View>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity onPress={() => onEdit(item)} style={styles.iconButton}>
                    <Ionicons name="pencil-outline" size={22} color="#3b82f6" />
                </TouchableOpacity>
                {/* Empêcher la suppression de son propre compte */}
                {!isCurrentUser && (
                    <TouchableOpacity onPress={() => onDelete(item._id, item.name)} style={styles.iconButton}>
                        <Ionicons name="trash-outline" size={22} color="#ef4444" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
});

export default function UserListScreen({ navigation }) {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [error, setError] = useState(null);

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const storedUserId = await AsyncStorage.getItem('userId');
            setCurrentUserId(storedUserId);

            const token = await AsyncStorage.getItem('authToken');
            if (!token) {
                setError("Jeton d'authentification manquant. Veuillez vous reconnecter.");
                setIsLoading(false);
                return;
            }

            const res = await api.get('/users', {
                headers: { Authorization: `Bearer ${token}` }
            });

            const sortedUsers = res.data.sort((a, b) => a.name.localeCompare(b.name));
            
            // Filtrer l'utilisateur actuel (pour ne pas le supprimer lui-même)
            const filteredUsers = sortedUsers.filter((user) => user._id !== storedUserId);
            setUsers(filteredUsers);
        } catch (err) {
            console.error('Erreur fetch users:', err);
            if (err.response) {
                setError(`Erreur serveur (${err.response.status}): ${err.response.data?.message || "Impossible de charger les utilisateurs."}`);
            } else if (err.request) {
                setError("Erreur réseau: Impossible de contacter le serveur. Vérifiez votre connexion.");
            } else {
                setError(`Erreur inattendue: ${err.message || "Une erreur inconnue est survenue."}`);
            }
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
        const unsubscribe = navigation.addListener('focus', () => {
            fetchUsers();
        });
        return unsubscribe;
    }, [fetchUsers, navigation]);

    const handleDelete = useCallback(async (userId, userName) => {
        if (userId === currentUserId) {
            Alert.alert('Impossible de supprimer', 'Vous ne pouvez pas supprimer votre propre compte depuis cette interface.');
            return;
        }

        Alert.alert(
            'Confirmer la suppression',
            `Voulez-vous vraiment supprimer l'utilisateur "${userName}" ? Cette action est irréversible.`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        const token = await AsyncStorage.getItem('authToken');
                        if (!token) {
                            Alert.alert("Erreur", "Jeton d'authentification manquant.");
                            return;
                        }
                        try {
                            await api.delete(`/users/${userId}`, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            Alert.alert('Succès', `L'utilisateur "${userName}" a été supprimé avec succès.`);
                            fetchUsers(); // Recharger la liste après suppression
                        } catch (err) {
                            console.error('Erreur suppression utilisateur:', err);
                            let errorMessage = "Échec de la suppression de l'utilisateur.";
                            if (err.response) {
                                if (err.response?.status === 403) {
                                    errorMessage = 'Vous n\'avez pas les permissions nécessaires pour effectuer cette action.';
                                } else {
                                    errorMessage = `Erreur serveur (${err.response.status}): ${err.response.data?.message || errorMessage}`;
                                }
                            } else if (err.request) {
                                errorMessage = "Erreur réseau: Impossible de contacter le serveur.";
                            } else {
                                errorMessage = `Erreur inattendue: ${err.message || errorMessage}`;
                            }
                            Alert.alert('Erreur', errorMessage);
                        }
                    },
                },
            ]
        );
    }, [currentUserId, fetchUsers]);

    const renderUser = useCallback(
        ({ item }) => (
            <UserItem
                item={item}
                onEdit={(user) =>
                    navigation.navigate('UserEditScreen', {
                        userId: user._id,
                        userData: user,
                    })
                }
                onDelete={handleDelete}
                currentUserId={currentUserId}
            />
        ),
        [navigation, handleDelete, currentUserId]
    );

    if (isLoading) {
        return (
            <View style={styles.centeredContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.messageText}>Chargement des utilisateurs...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centeredContainer}>
                <Ionicons name="warning-outline" size={60} color="#dc3545" />
                <Text style={styles.errorMessageText}>{error}</Text>
                <TouchableOpacity onPress={fetchUsers} style={styles.retryButton}>
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
                <Ionicons name="people-outline" size={36} color="#fff" style={styles.headerIcon} />
                <Text style={styles.headerTitle}>Gestion des Utilisateurs</Text>
                <Text style={styles.headerSubtitle}>Administrez les comptes et les rôles</Text>
            </View>

            {users.length === 0 ? (
                <View style={styles.emptyListContainer}>
                    <MaterialCommunityIcons name="account-off-outline" size={80} color="#ccc" />
                    <Text style={styles.emptyListText}>Aucun utilisateur enregistré (hormis vous).</Text>
                    <TouchableOpacity
                        style={styles.emptyAddButton}
                        onPress={() => navigation.navigate('AddUserScreen')}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="person-add-outline" size={24} color="#fff" />
                        <Text style={styles.emptyAddButtonText}>Ajouter un premier utilisateur</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={users}
                    keyExtractor={(item) => item._id.toString()}
                    renderItem={renderUser}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={fetchUsers}
                            colors={[Colors.primary]}
                            tintColor={Colors.primary}
                        />
                    }
                    contentContainerStyle={styles.listContent}
                    initialNumToRender={10}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                    removeClippedSubviews={true}
                />
            )}

            {/* Floating Action Button (FAB) pour ajouter un utilisateur */}
            {users.length > 0 && (
                <TouchableOpacity
                    style={[styles.fab, { bottom: FAB_BOTTOM_POSITION }]} // Applique la position calculée ici
                    onPress={() => navigation.navigate('AddUserScreen')}
                    activeOpacity={0.8}
                >
                    <Ionicons name="add" size={30} color="#fff" />
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        backgroundColor: Colors.primary,
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
        backgroundColor: Colors.background,
        padding: 20,
    },
    messageText: {
        marginTop: 15,
        fontSize: 16,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
    errorMessageText: {
        marginTop: 15,
        fontSize: 16,
        color: '#dc3545', // Rouge d'erreur
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary,
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
        paddingTop: 15,
        // *** LE PADDING BOTTOM CLÉ ***
        // Assure que le contenu défile au-dessus du FAB et de la barre d'onglets
        paddingBottom: FAB_BOTTOM_POSITION + FAB_BUTTON_SIZE + 20,
    },
    userItem: {
        backgroundColor: Colors.cardBackground,
        padding: 15,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 5,
        borderLeftWidth: 5,
        borderColor: Colors.primary, // Fallback, écrasé par la prop
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    roleIconContainer: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    textContainer: {
        flex: 1,
    },
    userName: {
        fontWeight: '700',
        fontSize: 18,
        color: Colors.textPrimary,
    },
    userEmail: {
        color: Colors.textSecondary,
        fontSize: 14,
        marginTop: 3,
    },
    userRole: {
        fontSize: 13,
        marginTop: 5,
        fontWeight: '500',
    },
    actions: {
        flexDirection: 'row',
        marginLeft: 15,
    },
    iconButton: {
        marginLeft: 15,
        padding: 5,
    },
    emptyListContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        // Pour que ce container respecte aussi le padding du bas si users.length est 0
        // On assure que `emptyListContainer` a flex:1 et que son contenu est centré,
        // le `paddingBottom` de `listContent` (quand il est appliqué via FlatList)
        // permet de décaler le contenu vers le haut. Si la FlatList est conditionnelle
        // et que ce View la remplace, il faut s'assurer qu'il prend tout l'espace disponible
        // et que son contenu ne soit pas masqué. Dans ce cas, les styles ci-dessous sont adaptés.
        // Assurez-vous que l'ensemble du View parent du FlatList (styles.container) a bien flex:1
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
        // bottom: FAB_BOTTOM_POSITION est appliqué dynamiquement
        backgroundColor: '#28a745',
        borderRadius: FAB_BUTTON_SIZE / 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
});