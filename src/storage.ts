// src/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VoiceNote, AppSettings, defaultSettings } from './types';

// Try to use MMKV for performance (100x faster than AsyncStorage)
// Falls back to AsyncStorage in Expo Go
let mmkvStorage: any;
let useMMKV = false;

try {
  const { MMKV } = require('react-native-mmkv');
  mmkvStorage = new MMKV();
  useMMKV = true;
  console.log('[Storage] Using MMKV (high-performance mode)');
} catch (err) {
  console.log('[Storage] Using AsyncStorage (Expo Go fallback)');
}

const NOTES_KEY = 'voicenotes_v1';
const SETTINGS_KEY = 'settings_v1';

// -----------------------------------------------------------------------------
// Storage Helpers (Abstraction Layer)
// -----------------------------------------------------------------------------

/**
 * Sync storage helper (MMKV only)
 */
const storageSync = {
  active: () => useMMKV && mmkvStorage,
  getItem: (key: string): string | null => {
    if (!useMMKV || !mmkvStorage) return null;
    return mmkvStorage.getString(key) ?? null;
  },
  setItem: (key: string, value: string) => {
    if (useMMKV && mmkvStorage) mmkvStorage.set(key, value);
  },
  removeItem: (key: string) => {
    if (useMMKV && mmkvStorage) mmkvStorage.delete(key);
  }
};

/**
 * Async storage helper (AsyncStorage)
 */
const storageAsync = {
  getItem: async (key: string): Promise<string | null> => {
    return await AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    return await AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    return await AsyncStorage.removeItem(key);
  }
};

// -----------------------------------------------------------------------------
// Voice Notes Operations
// -----------------------------------------------------------------------------

/**
 * Load all voice notes from storage
 * Uses MMKV if available (sync), otherwise returns empty array (async loading in background)
 */
export function loadNotes(): VoiceNote[] {
  try {
    if (storageSync.active()) {
      const raw = storageSync.getItem(NOTES_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    }
    // AsyncStorage fallback handling is done via loadNotesAsync
    return [];
  } catch (err) {
    console.error('[Storage] Failed to load notes (sync):', err);
    return [];
  }
}

/**
 * Load notes asynchronously (Required for AsyncStorage fallback)
 */
export async function loadNotesAsync(): Promise<VoiceNote[]> {
  try {
    if (storageSync.active()) {
      return loadNotes();
    }
    const raw = await storageAsync.getItem(NOTES_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('[Storage] Failed to load notes (async):', err);
    return [];
  }
}

/**
 * Save all voice notes to storage
 */
export function saveNotes(notes: VoiceNote[]): void {
  try {
    const json = JSON.stringify(notes);
    if (storageSync.active()) {
      storageSync.setItem(NOTES_KEY, json);
    } else {
      storageAsync.setItem(NOTES_KEY, json).catch(err => {
        console.error('[Storage] Failed to save notes (async):', err);
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
    if (storageSync.active()) {
      storageSync.removeItem(NOTES_KEY);
    } else {
      await storageAsync.removeItem(NOTES_KEY);
    }
  } catch (err) {
    console.error('[Storage] Failed to clear notes:', err);
  }
}

// -----------------------------------------------------------------------------
// Settings Operations
// -----------------------------------------------------------------------------

export function loadSettings(): AppSettings {
  try {
    if (storageSync.active()) {
      const raw = storageSync.getItem(SETTINGS_KEY);
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
    if (storageSync.active()) {
      return loadSettings();
    }
    const raw = await storageAsync.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings;
    return JSON.parse(raw);
  } catch (e) {
    return defaultSettings;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    const raw = JSON.stringify(settings);
    if (storageSync.active()) {
      storageSync.setItem(SETTINGS_KEY, raw);
    } else {
      storageAsync.setItem(SETTINGS_KEY, raw).catch(e => {
        console.error('Failed to save settings:', e);
      });
    }
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

// -----------------------------------------------------------------------------
// Debug / Info
// -----------------------------------------------------------------------------

export function getStorageInfo() {
  try {
    if (storageSync.active()) {
      const raw = storageSync.getItem(NOTES_KEY);
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
