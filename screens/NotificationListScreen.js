import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    TextInput,
    ActivityIndicator,
    RefreshControl,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    Pressable, // Use Pressable for better feedback
} from 'react-native';
import api from '../api/auth';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const API_BASE_URL = 'http://31.97.55.154:5000'; // Define base URL for consistency

export default function NotificationListScreen() {
    const navigation = useNavigation();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [newNotificationType, setNewNotificationType] = useState('');
    const [newNotificationMessage, setNewNotificationMessage] = useState('');
    const [creating, setCreating] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [userId, setUserId] = useState(null); // To store the current user's ID
    const [showCreateForm, setShowCreateForm] = useState(false);

    // --- Helper function to sort notifications ---
    const sortNotifications = (notificationsArray) => {
        return [...notificationsArray].sort((a, b) => {
            // Unread notifications first, then by latest date
            if (a.isRead === b.isRead) {
                return new Date(b.createdAt) - new Date(a.createdAt);
            }
            return a.isRead ? 1 : -1;
        });
    };

    const fetchUserRole = async () => {
        try {
            const res = await api.get(`${API_BASE_URL}/api/auth/profile`); // Use API_BASE_URL
            const role = res.data?.role;
            const id = res.data?._id;
            if (role) setUserRole(role);
            if (id) setUserId(id);
        } catch (err) {
            console.warn("Erreur lors de la récupération du profil :", err);
        }
    };

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await api.get(`${API_BASE_URL}/api/notifications`); // Use API_BASE_URL
            setNotifications(sortNotifications(res.data));
        } catch (err) {
            console.error("Erreur fetch notifications :", err);
            Alert.alert('Erreur', "Impossible de charger les notifications.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchUserRole();
        fetchNotifications();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    const markAsRead = async (notificationId, notificationAuthorId) => {
        // Prevent marking own notifications as read
        if (userId && notificationAuthorId === userId) {
            Alert.alert('Info', "Vous ne pouvez pas marquer vos propres notifications comme lues.");
            return;
        }

        try {
            await api.put(`${API_BASE_URL}/api/notifications/${notificationId}`); // Use API_BASE_URL
            setNotifications((prev) =>
                sortNotifications(
                    prev.map((n) =>
                        n._id === notificationId ? { ...n, isRead: true } : n
                    )
                )
            );
        } catch (err) {
            console.error("Erreur marquer comme lu :", err);
            Alert.alert('Erreur', "Impossible de marquer la notification comme lue.");
        }
    };

    const markAllAsRead = async () => {
        Alert.alert(
            "Confirmer",
            "Voulez-vous vraiment marquer toutes les notifications non lues comme lues ?",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Oui",
                    onPress: async () => {
                        try {
                            // Filter out unread notifications that are not authored by the current user
                            const unreadNotificationsToMark = notifications.filter(n => !n.isRead && n.author !== userId);

                            if (unreadNotificationsToMark.length === 0) {
                                Alert.alert('Information', 'Aucune nouvelle notification à marquer comme lue.');
                                return;
                            }

                            await Promise.all(
                                unreadNotificationsToMark.map(notif => api.put(`${API_BASE_URL}/api/notifications/${notif._id}`))
                            );

                            setNotifications((prev) =>
                                sortNotifications(
                                    prev.map((n) =>
                                        unreadNotificationsToMark.some(um => um._id === n._id) ? { ...n, isRead: true } : n
                                    )
                                )
                            );
                            Alert.alert('Succès', 'Toutes les notifications pertinentes ont été marquées comme lues.');
                        } catch (err) {
                            console.error("Erreur marquer toutes comme lues :", err);
                            Alert.alert('Erreur', "Impossible de marquer toutes les notifications comme lues.");
                        }
                    },
                },
            ]
        );
    };

    const createNotification = async () => {
        if (!newNotificationType.trim() || !newNotificationMessage.trim()) {
            Alert.alert('Attention', 'Merci de remplir tous les champs.');
            return;
        }
        setCreating(true);
        try {
            const res = await api.post(`${API_BASE_URL}/api/notifications`, { // Use API_BASE_URL
                type: newNotificationType.trim(),
                message: newNotificationMessage.trim(),
            });
            Alert.alert('Succès', 'Notification créée avec succès.');
            setNewNotificationType('');
            setNewNotificationMessage('');
            setShowCreateForm(false); // Hide form after successful creation
            setNotifications((prev) => sortNotifications([res.data, ...prev])); // Add and re-sort
        } catch (err) {
            console.error("Erreur création notification :", err);
            Alert.alert('Erreur', `Échec de la création de la notification: ${err.response?.data?.message || err.message}`);
        } finally {
            setCreating(false);
        }
    };

    const renderNotification = ({ item }) => {
        const isOwnNotification = userId && item.author === userId; // Assuming 'author' field exists
        const canMarkAsRead = !item.isRead && !isOwnNotification;

        return (
            <Pressable // Use Pressable for better press feedback
                style={({ pressed }) => [
                    styles.notificationItem,
                    item.isRead ? styles.read : styles.unread,
                    pressed && styles.notificationItemPressed, // Add pressed style
                ]}
                onPress={() => {
                    if (canMarkAsRead) {
                        markAsRead(item._id, item.author);
                    } else if (isOwnNotification) {
                        Alert.alert("Info", "C'est votre propre notification. Vous ne pouvez pas la marquer comme lue.");
                    }
                    // Optionally navigate to a detail screen here regardless of read status
                }}
                disabled={item.isRead && !isOwnNotification} // Disable if already read and not own
            >
                <View style={styles.notificationHeader}>
                    <Text style={styles.notificationType}>{item.type.toUpperCase()}</Text>
                    {canMarkAsRead && ( // Only show unread dot if it can be marked as read
                        <Ionicons name="ellipse" size={10} color="#3b82f6" style={styles.unreadDot} />
                    )}
                    {isOwnNotification && ( // Indicate if it's your own notification
                        <Text style={styles.ownNotificationLabel}>Votre notification</Text>
                    )}
                </View>
                <Text style={styles.notificationMessage}>{item.message}</Text>
                <Text style={styles.notificationDate}>
                    {new Date(item.createdAt).toLocaleString()}
                </Text>
            </Pressable>
        );
    };

    const hasUnreadOthers = notifications.some(n => !n.isRead && n.author !== userId);

    return (
        <KeyboardAvoidingView
            style={styles.flexContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -50}
        >
            <StatusBar barStyle="light-content" backgroundColor="#3b82f6" />
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Notifications</Text>
            </View>

            <View style={styles.contentContainer}>
                {userRole && userRole.toLowerCase() === 'admin' && (
                    <View style={styles.adminActionsContainer}>
                        <Pressable // Use Pressable for button
                            style={({ pressed }) => [styles.toggleCreateButton, pressed && styles.toggleCreateButtonPressed]}
                            onPress={() => setShowCreateForm((v) => !v)}
                        >
                            <Ionicons name={showCreateForm ? "close-circle-outline" : "add-circle-outline"} size={20} color="#fff" />
                            <Text style={styles.toggleCreateButtonText}>
                                {showCreateForm ? 'Annuler la création' : 'Créer une notification'}
                            </Text>
                        </Pressable>

                        {showCreateForm && (
                            <View style={styles.creationContainer}>
                                <Text style={styles.creationTitle}>Nouvelle notification</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Type (ex: stock, livraison...)"
                                    placeholderTextColor="#9ca3af"
                                    value={newNotificationType}
                                    onChangeText={setNewNotificationType}
                                    autoCapitalize="none"
                                />
                                <TextInput
                                    style={[styles.input, styles.messageInput]}
                                    placeholder="Message"
                                    placeholderTextColor="#9ca3af"
                                    value={newNotificationMessage}
                                    onChangeText={setNewNotificationMessage}
                                    multiline
                                    numberOfLines={4}
                                />
                                <Pressable // Use Pressable for button
                                    style={({ pressed }) => [styles.createButton, pressed && styles.createButtonPressed]}
                                    onPress={createNotification}
                                    disabled={creating}
                                >
                                    {creating ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.createButtonText}>Créer</Text>
                                    )}
                                </Pressable>
                            </View>
                        )}
                    </View>
                )}

                {loading && !refreshing ? (
                    <ActivityIndicator size="large" color="#3b82f6" style={styles.mainLoader} />
                ) : (
                    <>
                        {notifications.length > 0 && hasUnreadOthers && (
                            <Pressable // Use Pressable for button
                                style={({ pressed }) => [styles.markAllButton, pressed && styles.markAllButtonPressed]}
                                onPress={markAllAsRead}
                            >
                                <Ionicons name="mail-open-outline" size={18} color="#fff" style={styles.buttonIcon} />
                                <Text style={styles.markAllButtonText}>Marquer toutes comme lues</Text>
                            </Pressable>
                        )}

                        <FlatList
                            data={notifications}
                            keyExtractor={(item) => item._id}
                            renderItem={renderNotification}
                            refreshControl={
                                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} tintColor="#3b82f6" />
                            }
                            contentContainerStyle={[
                                styles.notificationListContainer,
                                notifications.length === 0 && styles.emptyListContainer
                            ]}
                            ListEmptyComponent={
                                !loading && !refreshing && (
                                    <View style={styles.emptyContent}>
                                        <Ionicons name="notifications-off-outline" size={50} color="#9ca3af" />
                                        <Text style={styles.emptyText}>Aucune notification pour le moment.</Text>
                                    </View>
                                )
                            }
                        />
                    </>
                )}
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    flexContainer: {
        flex: 1,
    },
    header: {
        backgroundColor: '#3b82f6',
        paddingTop: Platform.OS === 'ios' ? 50 : 25,
        paddingBottom: 20,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 8,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
    },
    contentContainer: {
        flex: 1,
        backgroundColor: '#f8fafc',
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    adminActionsContainer: {
        marginBottom: 20,
    },
    toggleCreateButton: {
        backgroundColor: '#2563eb',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    toggleCreateButtonPressed: {
        backgroundColor: '#1d4ed8', // Darker blue on press
    },
    toggleCreateButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 8,
    },
    creationContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
    },
    creationTitle: {
        fontWeight: 'bold',
        fontSize: 19,
        marginBottom: 15,
        color: '#2c3e50',
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        marginBottom: 15,
        backgroundColor: '#f9fafb',
        color: '#374151',
    },
    messageInput: {
        height: 100,
        textAlignVertical: 'top',
    },
    createButton: {
        backgroundColor: '#10b981',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    createButtonPressed: {
        backgroundColor: '#0c8f6b', // Darker green on press
    },
    createButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 17,
    },
    mainLoader: {
        marginTop: 50,
    },
    markAllButton: {
        backgroundColor: '#3b82f6',
        paddingVertical: 12,
        borderRadius: 10,
        marginBottom: 15,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    markAllButtonPressed: {
        backgroundColor: '#2563eb', // Darker blue on press
    },
    markAllButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 8,
    },
    buttonIcon: {
        marginRight: 5,
    },
    notificationListContainer: {
        paddingBottom: 20,
    },
    notificationItem: {
        backgroundColor: '#fff',
        padding: 18,
        marginBottom: 12,
        borderRadius: 12,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    notificationItemPressed: {
        transform: [{ scale: 0.99 }], // Slight shrink on press
        backgroundColor: '#f0f4f8', // Feedback background
    },
    unread: {
        borderColor: '#3b82f6',
        backgroundColor: '#ebf5ff',
    },
    read: {
        borderColor: '#e5e7eb',
        backgroundColor: '#fff',
        opacity: 0.8,
    },
    notificationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    notificationType: {
        fontWeight: 'bold',
        color: '#1f2937',
        fontSize: 15,
        letterSpacing: 0.5,
    },
    unreadDot: {
        marginLeft: 5,
    },
    ownNotificationLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#f59e0b', // Orange color to stand out
        backgroundColor: '#fffbeb',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 5,
        overflow: 'hidden', // Ensures border radius is applied
        marginLeft: 10,
    },
    notificationMessage: {
        fontSize: 16,
        color: '#374151',
        marginBottom: 8,
        lineHeight: 22,
    },
    notificationDate: {
        fontSize: 12,
        color: '#6b7280',
        textAlign: 'right',
        marginTop: 5,
    },
    emptyListContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContent: {
        alignItems: 'center',
        paddingVertical: 50,
    },
    emptyText: {
        color: '#9ca3af',
        fontSize: 17,
        marginTop: 10,
        textAlign: 'center',
    },
});