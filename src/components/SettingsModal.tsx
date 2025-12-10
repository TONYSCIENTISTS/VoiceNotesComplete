import React from 'react';
import {
    Modal,
    TouchableOpacity,
    View,
    Text,
    Switch,
    StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { HapticFeedback } from '../utils/haptics';

interface SettingsModalProps {
    visible: boolean;
    onClose: () => void;
    hapticsEnabled: boolean;
    onToggleHaptics: (enabled: boolean) => void;
    onClearHistory: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
    visible,
    onClose,
    hapticsEnabled,
    onToggleHaptics,
    onClearHistory,
}) => {
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <TouchableOpacity
                    style={styles.modalContent}
                    activeOpacity={1}
                    onPress={(e) => e.stopPropagation()}
                >
                    <LinearGradient
                        colors={['rgba(0, 212, 255, 0.15)', 'rgba(94, 92, 230, 0.15)']}
                        style={styles.modalGradient}
                    >
                        <View style={styles.modalHeader}>
                            <Ionicons name="settings" size={24} color="#00D4FF" />
                            <Text style={styles.modalTitle}>Settings</Text>
                            <TouchableOpacity onPress={() => { HapticFeedback.selection(); onClose(); }}>
                                <Ionicons name="close" size={24} color="#888" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalBody}>
                            {/* Haptic Feedback Option */}
                            <View style={styles.settingOption}>
                                <View style={styles.settingIconContainer}>
                                    <Ionicons name="finger-print-outline" size={22} color="#00D4FF" />
                                </View>
                                <View style={styles.settingTextContainer}>
                                    <Text style={styles.settingTitle}>Haptic Feedback</Text>
                                    <Text style={styles.settingDescription}>Vibrate on interactions</Text>
                                </View>
                                <Switch
                                    value={hapticsEnabled}
                                    onValueChange={onToggleHaptics}
                                    trackColor={{ false: '#333', true: '#5E5CE6' }}
                                    thumbColor={hapticsEnabled ? '#00FFFF' : '#666'}
                                    ios_backgroundColor="#333"
                                />
                            </View>
                            {/* Clear History Option */}
                            <TouchableOpacity style={styles.settingOption} onPress={onClearHistory}>
                                <View style={styles.settingIconContainer}>
                                    <Ionicons name="trash-outline" size={22} color="#ff3366" />
                                </View>
                                <View style={styles.settingTextContainer}>
                                    <Text style={styles.settingTitle}>Clear All History</Text>
                                    <Text style={styles.settingDescription}>Delete all voice notes permanently</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#666" />
                            </TouchableOpacity>

                            {/* Placeholder for future options */}
                            <TouchableOpacity style={[styles.settingOption, styles.settingOptionDisabled]}>
                                <View style={styles.settingIconContainer}>
                                    <Ionicons name="cloud-upload-outline" size={22} color="#666" />
                                </View>
                                <View style={styles.settingTextContainer}>
                                    <Text style={[styles.settingTitle, styles.settingTitleDisabled]}>Export Data</Text>
                                    <Text style={styles.settingDescription}>Coming soon</Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.settingOption, styles.settingOptionDisabled]}>
                                <View style={styles.settingIconContainer}>
                                    <Ionicons name="color-palette-outline" size={22} color="#666" />
                                </View>
                                <View style={styles.settingTextContainer}>
                                    <Text style={[styles.settingTitle, styles.settingTitleDisabled]}>Theme</Text>
                                    <Text style={styles.settingDescription}>Coming soon</Text>
                                </View>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalFooter}>v1.0.0 • VoiceAI</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: '#121212',
    },
    modalGradient: {
        padding: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
        gap: 12,
    },
    modalTitle: {
        flex: 1,
        color: 'white',
        fontSize: 20,
        fontWeight: '600',
    },
    modalBody: {
        gap: 24,
    },
    settingOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    settingIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingTextContainer: {
        flex: 1,
    },
    settingTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 4,
    },
    settingDescription: {
        color: '#888',
        fontSize: 13,
    },
    settingOptionDisabled: {
        opacity: 0.5,
    },
    settingTitleDisabled: {
        color: '#666',
    },
    modalFooter: {
        textAlign: 'center',
        color: '#444',
        fontSize: 12,
        marginTop: 30,
    },
});
