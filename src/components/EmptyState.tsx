import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface EmptyStateProps {
    icon?: string;
    title: string;
    message?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon = '🎤',
    title,
    message,
}) => {
    return (
        <View style={styles.container}>
            <Text style={styles.icon}>{icon}</Text>
            <Text style={styles.title}>{title}</Text>
            {message && <Text style={styles.message}>{message}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    icon: {
        fontSize: 64,
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000',
        textAlign: 'center',
        marginBottom: 8,
    },
    message: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
    },
});
