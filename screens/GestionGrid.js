import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Platform,
    Animated, // For subtle animations
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Pour les icônes

// Assurez-vous d'importer vos couleurs de manière cohérente
const Colors = {
    primary: '#4F46E5', // A slightly richer, more vibrant blue
    secondary: '#8B5CF6', // A complementary purple for accents
    background: '#F9FAFB', // Lighter background for more contrast
    cardBackground: '#FFFFFF',
    textPrimary: '#1F2937', // Darker text for better readability
    textSecondary: '#6B7280',
    shadow: 'rgba(0,0,0,0.15)', // Slightly stronger shadow
    textLight: '#E0E7FF', // For header subtitle against primary background
    accentGreen: '#10B981', // Example accent for success/active states
    accentRed: '#EF4444', // Example accent for danger/error states
};

// --- CALCUL DES DIMENSIONS POUR LE LAYOUT DEUX À DEUX ---
const screenWidth = Dimensions.get('window').width;
const numColumns = 2; // FIXÉ à deux colonnes
const gridHorizontalPadding = 20; // Padding désiré sur les bords gauche et droit de la grille
const cardHorizontalGap = 15; // Espacement désiré ENTRE les cartes sur la même ligne

// Largeur disponible pour le contenu (cartes + espaces entre elles) = Largeur de l'écran - (2 * padding horizontal)
const contentAreaWidth = screenWidth - (2 * gridHorizontalPadding);

// Largeur de chaque carte = (Largeur disponible - espace(s) entre les cartes) / nombre de colonnes
// Pour 2 colonnes, il y a 1 seul espace horizontal entre les cartes.
const cardWidth = (contentAreaWidth - (numColumns - 1) * cardHorizontalGap) / numColumns;
// --- FIN DU CALCUL DES DIMENSIONS ---


const GestionGrid = ({ navigation }) => {
    // Définition des options de gestion qui seront affichées en grille
    const managementOptions = [
        { id: 'users', title: 'Gérer les Utilisateurs', icon: 'person-outline', screen: 'Utilisateurs', iconColor: Colors.secondary },
        { id: 'trucks', title: 'Gérer les Camions', icon: 'bus-outline', screen: 'Camions', iconColor: Colors.accentGreen },
        { id: 'stock', title: 'Gérer le Stock', icon: 'server-outline', screen: 'Stock', iconColor: Colors.accentRed },
        { id: 'salaries', title: 'Gérer les Salaires', icon: 'cash-outline', screen: 'Salaires', iconColor: Colors.primary },
        { id: 'notifications', title: 'Voir les Notifications', icon: 'notifications-outline', screen: 'Notifications', iconColor: Colors.secondary },
        { id: 'actionLog', title: 'Journal d\'Activités', icon: 'clipboard-outline', screen: 'Actions', iconColor: Colors.accentGreen },
         ];

    const navigateToScreen = (screenName) => {
        if (screenName && navigation) {
            navigation.navigate(screenName);
        } else {
            console.warn(`Navigation impossible pour ${screenName || 'l\'option'}`);
        }
    };

    // Use Animated values for press feedback
    const scaleValue = React.useRef(new Animated.Value(1)).current;

    const onPressIn = () => {
        Animated.spring(scaleValue, {
            toValue: 0.95,
            useNativeDriver: true,
        }).start();
    };

    const onPressOut = () => {
        Animated.spring(scaleValue, {
            toValue: 1,
            friction: 3, // Lower friction for a quicker spring back
            tension: 50, // Higher tension for a snappier feel
            useNativeDriver: true,
        }).start();
    };

    const renderManagementCard = ({ item }) => (
        <Animated.View style={[{ transform: [{ scale: scaleValue }] }]}>
            <TouchableOpacity
                style={styles.managementCard}
                onPress={() => navigateToScreen(item.screen)}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                activeOpacity={0.8} // Adjust active opacity for touch feedback
            >
                <Ionicons name={item.icon} size={48} color={item.iconColor || Colors.primary} style={styles.cardIcon} />
                <Text style={styles.cardTitle}>{item.title}</Text>
            </TouchableOpacity>
        </Animated.View>
    );

    return (
        <View style={styles.fullScreenContainer}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Tableau de Bord</Text> {/* More generic title */}
                <Text style={styles.headerSubtitle}>Accédez rapidement aux différentes sections de l'application</Text>
            </View>

            <ScrollView
                style={styles.scrollViewMain}
                contentContainerStyle={styles.scrollViewContent}
                bounces={false}
                showsVerticalScrollIndicator={true}
            >
                <View style={styles.managementGrid}>
                    {managementOptions.map((item) => (
                        <View key={item.id} style={styles.gridItemWrapper}>
                            {renderManagementCard({ item })}
                        </View>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    fullScreenContainer: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        backgroundColor: Colors.primary,
        paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight + 10, // Better StatusBar handling
        paddingBottom: 30, // Slightly more padding
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomLeftRadius: 30, // More rounded
        borderBottomRightRadius: 30, // More rounded
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 6 }, // Stronger shadow for depth
        shadowOpacity: 0.3, // More opaque shadow
        shadowRadius: 10, // Larger shadow blur
        elevation: 12, // Higher elevation for Android
    },
    headerTitle: {
        fontSize: 26, // Larger title
        fontWeight: 'bold',
        color: Colors.cardBackground,
        marginBottom: 8, // More space
    },
    headerSubtitle: {
        fontSize: 15, // Slightly larger subtitle
        color: Colors.textLight,
        textAlign: 'center',
        opacity: 0.9, // Slightly less opaque
    },
    scrollViewMain: {
        flex: 1,
    },
    scrollViewContent: {
        paddingHorizontal: gridHorizontalPadding,
        paddingTop: 25, // More padding above the grid
        paddingBottom: 100, // Ample space at the bottom
        flexGrow: 1,
    },
    managementGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    gridItemWrapper: {
        width: cardWidth,
        marginBottom: cardHorizontalGap + 5, // Slightly more vertical space between rows
        // Ensure consistent spacing if cardHorizontalGap is used everywhere.
    },
    managementCard: {
        backgroundColor: Colors.cardBackground,
        borderRadius: 18, // More rounded cards
        padding: 20, // Slightly more padding inside cards
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 150, // Slightly taller cards
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 8 }, // Stronger shadow for depth
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
        borderWidth: StyleSheet.hairlineWidth, // Subtle border
        borderColor: '#E5E7EB', // Light border color
    },
    cardIcon: {
        marginBottom: 12, // More space between icon and title
        // Color is now passed via props from managementOptions
    },
    cardTitle: {
        fontSize: 17, // Slightly larger title in card
        fontWeight: '700', // Bolder font weight
        color: Colors.textPrimary,
        textAlign: 'center',
        lineHeight: 22, // Better line height for multi-line titles
    },
});

export default GestionGrid;