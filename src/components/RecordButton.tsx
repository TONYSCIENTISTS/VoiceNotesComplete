import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { formatDuration } from '../utils/format';

interface RecordButtonProps {
    isRecording: boolean;
    duration: number;
    onPress: () => void;
    disabled?: boolean;
}

export const RecordButton: React.FC<RecordButtonProps> = ({
    isRecording,
    duration,
    onPress,
    disabled = false,
}) => {
    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[
                    styles.button,
                    isRecording && styles.buttonRecording,
                    disabled && styles.buttonDisabled,
                ]}
                onPress={onPress}
                disabled={disabled}
                activeOpacity={0.7}
            >
                <View style={[styles.inner, isRecording && styles.innerRecording]} />
            </TouchableOpacity>

            {isRecording && (
                <View style={styles.recordingInfo}>
                    <View style={styles.pulse} />
                    <Text style={styles.durationText}>{formatDuration(duration)}</Text>
                    <Text style={styles.recordingText}>Recording...</Text>
                </View>
            )}

            {!isRecording && !disabled && (
                <Text style={styles.tapToRecordText}>Tap to Record</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
    },
    button: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FF3B30',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    buttonRecording: {
        backgroundColor: '#FF9500',
    },
    buttonDisabled: {
        backgroundColor: '#999',
        opacity: 0.5,
    },
    inner: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#FFF',
    },
    innerRecording: {
        width: 24,
        height: 24,
        borderRadius: 4,
    },
    recordingInfo: {
        marginTop: 16,
        alignItems: 'center',
    },
    pulse: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#FF3B30',
        marginBottom: 8,
    },
    durationText: {
        fontSize: 32,
        fontWeight: '700',
        color: '#000',
        fontVariant: ['tabular-nums'],
    },
    recordingText: {
        fontSize: 16,
        color: '#666',
        marginTop: 4,
    },
    tapToRecordText: {
        fontSize: 16,
        color: '#666',
        marginTop: 12,
    },
});
