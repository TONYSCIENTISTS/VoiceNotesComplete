// src/nativeModules/NativeAudioSession.ts

import { NativeModules } from 'react-native';

const { NativeAudioSession } = NativeModules;

export type AudioRoute = 'speaker' | 'earpiece' | 'bluetooth' | 'wired' | 'unknown';

export interface NativeAudioSessionType {
    getRoute(): Promise<AudioRoute>;
    setRoute(route: 'speaker' | 'earpiece'): Promise<void>;
}

// Fallback for Expo Go
const MockAudioSession: NativeAudioSessionType = {
    getRoute: async () => {
        console.warn('NativeAudioSession not available (Expo Go)');
        return 'speaker';
    },
    setRoute: async () => {
        console.warn('NativeAudioSession not available (Expo Go)');
    }
};

export const AudioSession: NativeAudioSessionType = NativeAudioSession || MockAudioSession;
