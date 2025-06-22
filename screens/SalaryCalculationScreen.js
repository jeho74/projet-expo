import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';

const API_URL = 'http://31.97.55.154:5000/api';

const CalculatedSalaryCard = ({ data }) => (
    <View style={styles.resultContainer}>
        <Ionicons name="checkmark-circle-outline" size={38} color="#28a745" style={{ marginBottom: 8 }} />
        <Text style={styles.resultTitle}>Salaire Calculé</Text>
        <Text style={styles.resultValue}>
            Montant : <Text style={{ color: '#3b82f6', fontWeight: 'bold' }}>{data.salaryAmount.toFixed(2)} €</Text>
        </Text>
        <Text>Livraisons : {data.totalDeliveries}</Text>
        <Text>Bouteilles vendues : {data.totalBottlesSold}</Text>
        <Text>Bouteilles consignées : {data.totalConsignedBottles}</Text>
        <Text style={styles.resultStatus}>Statut : {data.status}</Text>
        <Text style={styles.resultDate}>{new Date(data.createdAt).toLocaleString('fr-FR')}</Text>
    </View>
);

export default function SalaryCalculationScreen({ navigation }) {
    const [drivers, setDrivers] = useState([]);
    const [selectedDriver, setSelectedDriver] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDrivers = async () => {
            try {
                setIsLoading(true);
                const token = await AsyncStorage.getItem('authToken');
                const res = await axios.get(`${API_URL}/users`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const onlyDrivers = res.data.filter(u => u.role === 'driver');
                setDrivers(onlyDrivers);
            } catch (err) {
                setError("Impossible de charger les chauffeurs.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchDrivers();
    }, []);

    const handleCalculate = async () => {
        setError('');
        setResult(null);
        if (!selectedDriver) return setError('Veuillez sélectionner un chauffeur.');

        try {
            setIsLoading(true);
            const token = await AsyncStorage.getItem('authToken');
            const res = await axios.post(
                `${API_URL}/salaires/calculer/`,
                { driver: selectedDriver },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setResult(res.data);
        } catch (err) {
            if (err.response?.status === 400) {
                setError("Ce chauffeur n'existe pas.");
            } else if (err.request) {
                setError("Erreur réseau : impossible de contacter le serveur.");
            } else {
                setError(err.message || "Erreur inconnue.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <Ionicons name="calculator-outline" size={36} color="#fff" />
                <Text style={styles.headerTitle}>Calcul du Salaire Chauffeur</Text>
                <Text style={styles.headerSubtitle}>Sélectionnez un chauffeur pour calculer son salaire</Text>
            </View>

            {/* PICKER */}
            {drivers.length > 0 && (
                <View style={styles.pickerContainer}>
                    <Text style={styles.label}>Chauffeur :</Text>
                    <View style={styles.pickerWrapper}>
                        <Picker
                            selectedValue={selectedDriver}
                            onValueChange={setSelectedDriver}
                            style={styles.picker}
                        >
                            <Picker.Item label="-- Sélectionner --" value="" />
                            {drivers.map((d) => (
                                <Picker.Item key={d._id} label={d.name} value={d._id} />
                            ))}
                        </Picker>
                    </View>
                </View>
            )}

            {/* ERREUR */}
            {error !== '' && (
                <View style={styles.errorContainer}>
                    <Ionicons name="warning-outline" size={22} color="#dc3545" />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            {/* BOUTON DE CALCUL */}
            <TouchableOpacity
                style={styles.calculateButton}
                onPress={handleCalculate}
                disabled={isLoading || !selectedDriver}
                activeOpacity={0.7}
            >
                {isLoading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <>
                        <Ionicons name="calculator" size={20} color="#fff" />
                        <Text style={styles.calculateButtonText}>Calculer</Text>
                    </>
                )}
            </TouchableOpacity>

            {/* RESULTAT */}
            {result && <CalculatedSalaryCard data={result} />}

            {/* RETOUR */}
            <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
            >
                <Ionicons name="arrow-back" size={20} color="#3b82f6" />
                <Text style={styles.backButtonText}>Retour</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#f0f4f8',
        padding: 20,
    },
    header: {
        backgroundColor: '#3b82f6',
        paddingTop: Platform.OS === 'ios' ? 40 : 18,
        paddingBottom: 20,
        paddingHorizontal: 10,
        borderRadius: 18,
        alignItems: 'center',
        marginBottom: 24,
    },
    headerTitle: {
        fontSize: 23,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 8,
    },
    headerSubtitle: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.92)',
        marginTop: 3,
        textAlign: 'center',
    },
    pickerContainer: {
        marginBottom: 18,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 5,
        color: '#34495e',
    },
    pickerWrapper: {
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#d0d7de',
        overflow: 'hidden',
    },
    picker: {
        width: '100%',
        height: 46,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8d7da',
        borderRadius: 7,
        padding: 10,
        marginBottom: 10,
    },
    errorText: {
        color: '#dc3545',
        fontSize: 15,
        marginLeft: 7,
        fontWeight: '500',
    },
    calculateButton: {
        flexDirection: 'row',
        backgroundColor: '#007bff',
        paddingVertical: 13,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 15,
    },
    calculateButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    resultContainer: {
        backgroundColor: '#eafaf1',
        borderRadius: 12,
        padding: 18,
        alignItems: 'center',
        marginTop: 20,
        borderLeftWidth: 5,
        borderLeftColor: '#28a745',
    },
    resultTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#28a745',
        marginBottom: 6,
    },
    resultValue: {
        fontSize: 17,
        fontWeight: '600',
        marginVertical: 4,
    },
    resultStatus: {
        marginTop: 7,
        color: '#666',
        fontSize: 14,
    },
    resultDate: {
        color: '#888',
        fontSize: 12,
        marginTop: 3,
    },
    backButton: {
        flexDirection: 'row',
        marginTop: 25,
        alignItems: 'center',
        alignSelf: 'center',
        padding: 9,
    },
    backButtonText: {
        color: '#3b82f6',
        fontSize: 16,
        marginLeft: 5,
        fontWeight: '500',
    },
});
