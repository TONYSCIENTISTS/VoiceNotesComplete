// src/nativeModules/NativeLevelMeter.ts

import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

const { NativeLevelMeter } = NativeModules;

// Safely create emitter only if module exists
const emitter = NativeLevelMeter ? new NativeEventEmitter(NativeLevelMeter) : null;

export interface NativeLevelMeterType {
    start(): void;
    stop(): void;
    addListener(cb: (level: number) => void): { remove: () => void };
}

const eventName = 'onLevelChange';

export const LevelMeter: NativeLevelMeterType = {
    start() {
        if (NativeLevelMeter) {
            NativeLevelMeter.start();
        } else {
            console.warn('NativeLevelMeter is not available (running in Expo Go?)');
        }
    },
    stop() {
        if (NativeLevelMeter) {
            NativeLevelMeter.stop();
        }
    },
    addListener(cb) {
        if (emitter) {
            const subscription = emitter.addListener(eventName, (payload: { level: number }) => {
                cb(payload.level);
            });
            return {
                remove: () => subscription.remove(),
            };
        } else {
            console.warn('NativeLevelMeter listeners not available');
            return { remove: () => { } };
        }
    },
};
