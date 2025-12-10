import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MainHeaderProps {
    onHistoryPress: () => void;
    onSettingsPress: () => void;
}

export const MainHeader: React.FC<MainHeaderProps> = ({ onHistoryPress, onSettingsPress }) => {
    return (
        <View style={styles.header}>
            {/* Logo */}
            <View style={styles.logoContainer}>
                <View style={styles.logoIconWrapper}>
                    <Ionicons name="radio-outline" size={24} color="#00D4FF" />
                    <Ionicons name="sparkles" size={12} color="#5E5CE6" style={styles.sparkleIcon} />
                </View>
                <View>
                    <Text style={styles.logoText}>Voice<Text style={styles.logoTextAI}>AI</Text></Text>
                    <Text style={styles.logoSubtext}>Smart Transcription</Text>
                </View>
            </View>

            <View style={styles.headerButtons}>
                <TouchableOpacity style={styles.historyButton} onPress={onHistoryPress}>
                    <Ionicons name="time-outline" size={18} color="#00D4FF" />
                    <Text style={styles.historyButtonText}>History</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.settingsButton} onPress={onSettingsPress}>
                    <Ionicons name="settings-outline" size={20} color="#00D4FF" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    logoIconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(0, 212, 255, 0.3)',
        position: 'relative',
    },
    sparkleIcon: {
        position: 'absolute',
        top: 2,
        right: 2,
    },
    logoText: {
        fontSize: 22,
        fontWeight: '700',
        color: 'white',
    },
    logoTextAI: {
        fontSize: 22,
        fontWeight: '700',
        color: '#5E5CE6',
    },
    logoSubtext: {
        fontSize: 10,
        color: '#888',
        marginTop: -2,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    headerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    historyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 10,
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: 'rgba(0, 212, 255, 0.3)',
    },
    historyButtonText: {
        color: '#00D4FF',
        fontSize: 14,
        fontWeight: '600',
    },
    settingsButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 22,
    },
});
