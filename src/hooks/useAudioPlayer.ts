// src/hooks/useAudioPlayer.ts

import { useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';

export function useAudioPlayer(uri?: string) {
    const soundRef = useRef<Audio.Sound | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [positionMs, setPositionMs] = useState(0);
    const [durationMs, setDurationMs] = useState(0);

    useEffect(() => {
        let isMounted = true;

        const load = async () => {
            if (!uri) return;
            try {
                const { sound, status } = await Audio.Sound.createAsync(
                    { uri },
                    { shouldPlay: false }
                );
                if (!isMounted) {
                    await sound.unloadAsync();
                    return;
                }

                soundRef.current = sound;
                setIsLoaded(true);
                setDurationMs(status.durationMillis ?? 0);

                sound.setOnPlaybackStatusUpdate(st => {
                    if (!st.isLoaded) return;
                    setPositionMs(st.positionMillis ?? 0);
                    setDurationMs(st.durationMillis ?? 0);
                    setIsPlaying(st.isPlaying);
                });
            } catch (err) {
                console.error('load audio error', err);
            }
        };

        load();

        return () => {
            isMounted = false;
            if (soundRef.current) {
                soundRef.current.unloadAsync();
                soundRef.current = null;
            }
        };
    }, [uri]);

    const play = async () => {
        if (!soundRef.current) return;
        await soundRef.current.playAsync();
    };

    const pause = async () => {
        if (!soundRef.current) return;
        await soundRef.current.pauseAsync();
    };

    const seek = async (ms: number) => {
        if (!soundRef.current) return;
        await soundRef.current.setPositionAsync(ms);
    };

    return {
        isLoaded,
        isPlaying,
        positionMs,
        durationMs,
        play,
        pause,
        seek,
    };
}
