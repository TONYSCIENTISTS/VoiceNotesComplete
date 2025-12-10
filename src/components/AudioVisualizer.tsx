import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import VoiceWaveform from './VoiceWaveform';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface AudioVisualizerProps {
    level: number;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ level }) => {
    return (
        <View style={styles.visualizerContainer}>
            <VoiceWaveform currentLevel={level} height={120} width={SCREEN_WIDTH - 40} />
        </View>
    );
};

const styles = StyleSheet.create({
    visualizerContainer: {
        flex: 1, // fill the visualizerWrapper
        width: '100%',
        position: 'relative', // for absolute children
        justifyContent: 'center', // center vertically
        alignItems: 'center',
    },
});
