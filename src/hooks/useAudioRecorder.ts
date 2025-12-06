import React, { useRef, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';

export function useAudioRecorder() {
    const recordingRef = useRef<Audio.Recording | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [durationMs, setDurationMs] = useState(0);
    const [currentLevel, setCurrentLevel] = useState(0);

    const startRecording = async () => {
        try {
            // Request permissions
            const { status } = await Audio.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission required', 'Microphone permission is needed to record.');
                return;
            }

            // Set audio mode
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
                interruptionModeIOS: InterruptionModeIOS.DoNotMix,
                shouldDuckAndroid: true,
                interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
                playThroughEarpieceAndroid: false
            });

            // Create recording
            const recording = new Audio.Recording();
            await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
            recordingRef.current = recording;

            // Start
            await recording.startAsync();
            setIsRecording(true);
            setDurationMs(0);

            // Poll for duration + metering fallback (since NativeLevelMeter might not be available in Expo Go)
            const interval = setInterval(async () => {
                if (recordingRef.current) {
                    const status = await recordingRef.current.getStatusAsync();
                    if (status.isRecording) {
                        setDurationMs(status.durationMillis);
                    }

                    // Fallback metering if NativeLevelMeter not available
                    if (status.metering !== undefined) {
                        const db = status.metering;
                        // Normalize -60dB (quiet) to 0dB (loud) -> 0..1
                        // You can tweak this range
                        const minDb = -60;
                        const maxDb = 0;
                        let norm = (db - minDb) / (maxDb - minDb);
                        if (norm < 0) norm = 0;
                        if (norm > 1) norm = 1;

                        // Only update if we aren't getting native events (simple heuristic or explicit check)
                        // For now, we just overwrite. If native fires, it might overwrite this, which is fine (native is faster/better).
                        // But since NativeLevelMeter warns it's missing, this will be the primary source.
                        setCurrentLevel(norm);
                    }
                } else {
                    clearInterval(interval);
                }
            }, 100); // Faster polling for smoother visualizer (100ms)

        } catch (err: any) {
            console.error('startRecording error', err);
            Alert.alert('Recording error', err?.message ?? 'Unknown error');
            setIsRecording(false);
        }
    };

    const stopRecording = async (): Promise<{ uri: string; durationMs: number } | null> => {
        try {
            if (!recordingRef.current) return null;

            // Get status BEFORE stopping to capture duration
            const statusBeforeStop = await recordingRef.current.getStatusAsync();
            console.log('[stopRecording] Status BEFORE stop:', statusBeforeStop);
            console.log('[stopRecording] durationMillis BEFORE stop:', statusBeforeStop.durationMillis);

            await recordingRef.current.stopAndUnloadAsync();
            const uri = recordingRef.current.getURI();

            console.log('[stopRecording] URI:', uri);
            console.log('[stopRecording] State durationMs:', durationMs);

            recordingRef.current = null;
            setIsRecording(false);

            if (!uri) return null;

            // Use durationMillis from status before stop
            let finalDuration = statusBeforeStop.durationMillis ?? durationMs;

            // If still 0 or undefined, try loading the audio file to get real duration
            if (!finalDuration || finalDuration === 0) {
                console.log('[stopRecording] Duration is 0, trying to load audio for real duration...');
                try {
                    const { sound } = await Audio.Sound.createAsync({ uri });
                    const loadStatus = await sound.getStatusAsync();
                    if (loadStatus.isLoaded && loadStatus.durationMillis) {
                        finalDuration = loadStatus.durationMillis;
                        console.log('[stopRecording] Got real duration from file:', finalDuration, 'ms');
                    }
                    await sound.unloadAsync();
                } catch (loadErr) {
                    console.error('[stopRecording] Failed to load audio for duration:', loadErr);
                }
            }

            console.log('[stopRecording] Final duration:', finalDuration, 'ms (', Math.round(finalDuration / 1000), 'seconds)');

            return {
                uri,
                durationMs: finalDuration,
            };
        } catch (err: any) {
            console.error('stopRecording error', err);
            setIsRecording(false);
            return null;
        }
    };

    return {
        isRecording,
        durationMs,
        currentLevel,
        startRecording,
        stopRecording,
    };
}
