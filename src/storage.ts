// src/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VoiceNote } from './types';

// Try to use MMKV for performance (100x faster than AsyncStorage)
// Falls back to AsyncStorage in Expo Go
let storage: any;
let useMMKV = false;

try {
  const { MMKV } = require('react-native-mmkv');
  storage = new MMKV();
  useMMKV = true;
  console.log('[Storage] Using MMKV (high-performance mode)');
} catch (err) {
  console.log('[Storage] Using AsyncStorage (Expo Go fallback)');
}

const KEY = 'voicenotes_v1';

/**
 * Load all voice notes from storage
 * Uses MMKV if available, AsyncStorage otherwise
 */
export function loadNotes(): VoiceNote[] {
  try {
    if (useMMKV && storage) {
      // MMKV - synchronous and fast!
      const raw = storage.getString(KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } else {
      // AsyncStorage fallback - need to handle async in a sync context
      // This will return empty on first call, but notes will be loaded via loadNotesAsync
      return [];
    }
  } catch (err) {
    console.error('[Storage] Failed to load notes:', err);
    return [];
  }
}

/**
 * Load notes asynchronously (for AsyncStorage fallback)
 */
export async function loadNotesAsync(): Promise<VoiceNote[]> {
  try {
    if (useMMKV && storage) {
      // MMKV is sync, just return directly
      const raw = storage.getString(KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } else {
      // AsyncStorage
      const raw = await AsyncStorage.getItem(KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('[Storage] Failed to load notes:', err);
    return [];
  }
}

/**
 * Save all voice notes to storage
 * Synchronous with MMKV, async with AsyncStorage
 */
export function saveNotes(notes: VoiceNote[]): void {
  try {
    if (useMMKV && storage) {
      // MMKV - synchronous save
      storage.set(KEY, JSON.stringify(notes));
    } else {
      // AsyncStorage - fire and forget
      AsyncStorage.setItem(KEY, JSON.stringify(notes)).catch(err => {
        console.error('[Storage] Failed to save notes:', err);
      });
    }
  } catch (err) {
    console.error('[Storage] Failed to save notes:', err);
  }
}

/**
 * Clear all stored notes (for testing/debugging)
 */
export async function clearNotes(): Promise<void> {
  try {
    if (useMMKV && storage) {
      storage.delete(KEY);
    } else {
      await AsyncStorage.removeItem(KEY);
    }
  } catch (err) {
    console.error('[Storage] Failed to clear notes:', err);
  }
}

/**
 * Get storage statistics
 */
export function getStorageInfo() {
  try {
    if (useMMKV && storage) {
      const raw = storage.getString(KEY);
      const size = raw ? new Blob([raw]).size : 0;
      const count = raw ? JSON.parse(raw).length : 0;

      return {
        engine: 'MMKV',
        count,
        sizeBytes: size,
        sizeKB: (size / 1024).toFixed(2),
      };
    } else {
      return {
        engine: 'AsyncStorage',
        count: 0,
        sizeBytes: 0,
        sizeKB: '0.00',
      };
    }
  } catch (err) {
    return {
      engine: 'Unknown',
      count: 0,
      sizeBytes: 0,
      sizeKB: '0.00',
    };
  }
}

const SETTINGS_KEY = 'settings_v1';

export type AppSettings = {
  hapticsEnabled: boolean;
};

export const defaultSettings: AppSettings = {
  hapticsEnabled: true,
};

export function loadSettings(): AppSettings {
  try {
    if (useMMKV && storage) {
      const raw = storage.getString(SETTINGS_KEY);
      if (!raw) return defaultSettings;
      return JSON.parse(raw);
    }
    return defaultSettings;
  } catch (e) {
    return defaultSettings;
  }
}

export async function loadSettingsAsync(): Promise<AppSettings> {
  try {
    if (useMMKV && storage) {
      return loadSettings();
    } else {
      const raw = await AsyncStorage.getItem(SETTINGS_KEY);
      if (!raw) return defaultSettings;
      return JSON.parse(raw);
    }
  } catch (e) {
    return defaultSettings;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    const raw = JSON.stringify(settings);
    if (useMMKV && storage) {
      storage.set(SETTINGS_KEY, raw);
    } else {
      AsyncStorage.setItem(SETTINGS_KEY, raw);
    }
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}
