import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    Alert, ActivityIndicator, ScrollView, Platform
} from 'react-native';
import api from '../api/auth';
import * as Network from 'expo-network';
import { v4 as uuidv4 } from 'uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';


const API_STOCK_MOVEMENT_URL = '/stock/movement';

// --- COULEURS (DOIVENT CORRESPONDRE À VOTRE PALETTE GLOBALE) ---
const Colors = {
    primary: '#3b82f6', // Bleu
    success: '#28a745', // Vert
    warning: '#ffc107', // Jaune
    danger: '#dc3545', // Rouge
    info: '#17a2b8', // Cyan
    background: '#f5f5f5',
    cardBackground: '#fff',
    textPrimary: '#343a40',
    textSecondary: '#6c757d',
    shadow: 'rgba(0,0,0,0.1)',
};

const STORAGE_KEY = 'local_deliveries_v2'; // Clé AsyncStorage partagée avec DeliveryManagerScreen

export default function DeliveryFormScreen({ route, navigation }) {
    const deliveryId = route.params?.deliveryId || null;
    const existingData = route.params?.deliveryData || {};

    const [driver, setDriver] = useState(existingData.driver?._id || '');
    const [truck, setTruck] = useState(existingData.truck?._id || '');
    const [fullBottlesSent, setFullBottlesSent] = useState(existingData.fullBottlesSent?.toString() || '');
    const [emptyBottlesSent, setEmptyBottlesSent] = useState(existingData.emptyBottlesSent?.toString() || '');
    const [fullBottlesReturned, setFullBottlesReturned] = useState(''); // Seulement pour la finalisation
    const [consignedBottles, setConsignedBottles] = useState(''); // Seulement pour la finalisation
    const [loading, setLoading] = useState(false);

    const isEdit = !!deliveryId;
    const isFinalizing = !!fullBottlesReturned; // Indique si on finalise (a des retours)

    const handleSubmit = async () => {
        if (!driver || !truck || !fullBottlesSent) { // Retirer emptyBottlesSent des champs requis
            Alert.alert("Champs requis", "Merci de remplir tous les champs.");
            return;
        }

        const fullSent = parseInt(fullBottlesSent);
        const fullBack = parseInt(fullBottlesReturned || '0'); // Valeur par défaut 0
        const consigned = parseInt(consignedBottles || '0'); // Valeur par défaut 0
        const emptySent = parseInt(emptyBottlesSent || '0'); // Valeur par défaut 0

        const fullSold = fullSent - fullBack;

        if (fullSold < 0) {
            Alert.alert("Erreur", "Le nombre de pleines retournées ne peut pas dépasser le nombre envoyé.");
            return;
        }

        const localId = uuidv4(); // Générer un ID unique pour le suivi local

        const deliveryPayload = {
            localId: localId, // Inclure le localId
            type: isFinalizing ? "retour_livraison" : "sortie_livraison",
            productId: "bouteilles_gaz", // Remplacez par l'ID réel de votre produit
            quantity: fullSent,
            truck: truck,
            driver: driver,
            deliveryDate: new Date().toISOString(),
            status: isFinalizing ? "terminée" : "en cours",
            fullBottlesSent: fullSent,
            emptyBottlesSent: emptySent,
            fullBottlesReturned: fullBack, // Seulement si finalisation
            consignedBottles: consigned, // Seulement si finalisation
            fullBottlesSold: fullSold,      // Seulement si finalisation
        };

        try {
            setLoading(true);
            const status = await Network.getNetworkStateAsync();

            if (!status.isConnected) {
                // Si hors ligne, sauvegarder localement
                const localDelivery = {
                    ...deliveryPayload,
                    id: localId, // Pour la liste locale
                    isSynced: false,
                    driverName: route.params?.deliveryData?.driver?.name || 'Inconnu',
                    truckName: route.params?.deliveryData?.truck?.name || 'Inconnu',
                    licensePlate: route.params?.deliveryData?.truck?.licensePlate || 'N/A',
                };
                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([localDelivery])); // Save as array
                Alert.alert("Mode hors-ligne", "Livraison sauvegardée localement.");
                navigation.goBack();
                return;
            }

            // Envoi à l'API stock/movement
            let res;
            if (isEdit && isFinalizing) {
                // Finalisation d'une livraison existante
                 res = await api.patch(`${API_STOCK_MOVEMENT_URL}/${deliveryId}`, deliveryPayload);
            } else if (isEdit) {
                // Edition d'une livraison existante
                 res = await api.patch(`${API_STOCK_MOVEMENT_URL}/${deliveryId}`, deliveryPayload);
            } else {
                // Création d'une nouvelle livraison
                 res = await api.post(API_STOCK_MOVEMENT_URL, deliveryPayload);
            }

            Alert.alert("Succès", "Livraison enregistrée et stock mis à jour.");
            navigation.goBack();


        } catch (error) {
            console.error("Erreur :", error);
            Alert.alert("Erreur", "Échec de la soumission.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>{isEdit ? "Modifier la livraison" : "Nouvelle livraison"}</Text>
            </View>

            <TextInput
                placeholder="ID du chauffeur"
                value={driver}
                onChangeText={setDriver}
                style={styles.input}
                placeholderTextColor={Colors.textSecondary}
            />
            <TextInput
                placeholder="ID du camion"
                value={truck}
                onChangeText={setTruck}
                style={styles.input}
                placeholderTextColor={Colors.textSecondary}
            />
            <TextInput
                placeholder="Bouteilles pleines envoyées"
                value={fullBottlesSent}
                onChangeText={setFullBottlesSent}
                keyboardType="numeric"
                style={styles.input}
                placeholderTextColor={Colors.textSecondary}
            />
             <TextInput
                placeholder="Bouteilles vides envoyées"
                value={emptyBottlesSent}
                onChangeText={setEmptyBottlesSent}
                keyboardType="numeric"
                style={styles.input}
                placeholderTextColor={Colors.textSecondary}
            />
            {isFinalizing && (
                <>
                    <TextInput
                        placeholder="Bouteilles pleines retournées"
                        value={fullBottlesReturned}
                        onChangeText={setFullBottlesReturned}
                        keyboardType="numeric"
                        style={styles.input}
                        placeholderTextColor={Colors.textSecondary}
                    />
                    <TextInput
                        placeholder="Bouteilles consignées (vendues avec contenu)"
                        value={consignedBottles}
                        onChangeText={setConsignedBottles}
                        keyboardType="numeric"
                        style={styles.input}
                        placeholderTextColor={Colors.textSecondary}
                    />
                </>
            )}


            <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{isEdit ? (isFinalizing ? "Finaliser la livraison" : "Mettre à jour") : "Créer la livraison"}</Text>}
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    backButton: {
        marginRight: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        textAlign: 'center',
        flex: 1,
    },
    input: {
        backgroundColor: Colors.cardBackground,
        padding: 15,
        marginBottom: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        fontSize: 16,
        color: Colors.textPrimary,
    },
    button: {
        backgroundColor: Colors.primary,
        padding: 18,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
    },
});