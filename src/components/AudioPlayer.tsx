import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { formatDuration } from '../utils/format';

interface AudioPlayerProps {
    audioUri: string;
    duration: number;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUri, duration }) => {
    const {
        isPlaying,
        isLoaded,
        position,
        duration: actualDuration,
        loadAudio,
        play,
        pause,
        seek,
        unload,
    } = useAudioPlayer();

    useEffect(() => {
        if (audioUri) {
            loadAudio(audioUri);
        }
        return () => {
            unload();
        };
    }, [audioUri]);

    const handlePlayPause = async () => {
        try {
            if (isPlaying) {
                await pause();
            } else {
                await play();
            }
        } catch (error) {
            console.error('Play/Pause error:', error);
        }
    };

    const handleSeek = async (value: number) => {
        try {
            await seek(value);
        } catch (error) {
            console.error('Seek error:', error);
        }
    };

    const displayDuration = actualDuration || duration;

    return (
        <View style={styles.container}>
            <View style={styles.controlsRow}>
                <TouchableOpacity
                    style={[styles.playButton, !isLoaded && styles.playButtonDisabled]}
                    onPress={handlePlayPause}
                    disabled={!isLoaded}
                >
                    <Text style={styles.playButtonText}>
                        {isPlaying ? '⏸' : '▶'}
                    </Text>
                </TouchableOpacity>

                <View style={styles.progressContainer}>
                    <Slider
                        style={styles.slider}
                        minimumValue={0}
                        maximumValue={displayDuration}
                        value={position}
                        onSlidingComplete={handleSeek}
                        minimumTrackTintColor="#007AFF"
                        maximumTrackTintColor="#DDD"
                        thumbTintColor="#007AFF"
                        disabled={!isLoaded}
                    />
                    <View style={styles.timeRow}>
                        <Text style={styles.timeText}>{formatDuration(position)}</Text>
                        <Text style={styles.timeText}>{formatDuration(displayDuration)}</Text>
                    </View>
                </View>
            </View>

            {!isLoaded && (
                <Text style={styles.loadingText}>Loading audio...</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#F9F9F9',
        borderRadius: 12,
        padding: 16,
        marginVertical: 8,
    },
    controlsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    playButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#007AFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    playButtonDisabled: {
        backgroundColor: '#CCC',
    },
    playButtonText: {
        fontSize: 20,
        color: '#FFF',
    },
    progressContainer: {
        flex: 1,
    },
    slider: {
        width: '100%',
        height: 40,
    },
    timeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: -8,
    },
    timeText: {
        fontSize: 12,
        color: '#666',
        fontVariant: ['tabular-nums'],
    },
    loadingText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        marginTop: 8,
    },
});
