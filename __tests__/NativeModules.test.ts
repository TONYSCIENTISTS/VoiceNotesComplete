import { AudioSession } from '../src/nativeModules/NativeAudioSession';
import { LevelMeter } from '../src/nativeModules/NativeLevelMeter';
import { NativeModules } from 'react-native';

// Mock NativeModules
jest.mock('react-native', () => {
    const RN = jest.requireActual('react-native');
    RN.NativeModules.NativeAudioSession = {
        getRoute: jest.fn(() => Promise.resolve('speaker')),
        setRoute: jest.fn(() => Promise.resolve()),
    };
    RN.NativeModules.NativeLevelMeter = {
        start: jest.fn(),
        stop: jest.fn(),
        addListener: jest.fn(),
        removeListeners: jest.fn(),
    };
    return RN;
});

describe('NativeAudioSession', () => {
    it('should call native getRoute', async () => {
        const route = await AudioSession.getRoute();
        expect(route).toBe('speaker');
        expect(NativeModules.NativeAudioSession.getRoute).toHaveBeenCalled();
    });

    it('should call native setRoute', async () => {
        await AudioSession.setRoute('earpiece');
        expect(NativeModules.NativeAudioSession.setRoute).toHaveBeenCalledWith('earpiece');
    });
});

describe('NativeLevelMeter', () => {
    it('should call native start', () => {
        LevelMeter.start();
        expect(NativeModules.NativeLevelMeter.start).toHaveBeenCalled();
    });

    it('should call native stop', () => {
        LevelMeter.stop();
        expect(NativeModules.NativeLevelMeter.stop).toHaveBeenCalled();
    });
});
