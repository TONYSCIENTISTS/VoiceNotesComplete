// src/utils/haptics.ts
import * as Haptics from 'expo-haptics';

/**
 * Haptic feedback utility for tactile interactions
 * Uses expo-haptics for premium "click" feel
 */

let hapticsEnabled = true;

export const HapticFeedback = {
    /**
     * Enable or disable haptics globally
     */
    setEnabled: (enabled: boolean) => {
        hapticsEnabled = enabled;
    },

    /**
     * Get current enabled state
     */
    isEnabled: () => hapticsEnabled,

    /**
     * Light tap feedback (button press)
     * Style: Light (crisp click)
     */
    impact: () => {
        if (hapticsEnabled) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    },

    /**
     * Success feedback (action completed)
     * Style: Medium (solid click)
     */
    success: () => {
        if (hapticsEnabled) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    },

    /**
     * Warning feedback (destructive action)
     * Style: Warning (double click)
     */
    warning: () => {
        if (hapticsEnabled) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
    },

    /**
     * Error feedback (failed action)
     * Style: Error (triple click)
     */
    error: () => {
        if (hapticsEnabled) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    },

    /**
     * Selection feedback (toggle, switch)
     * Style: Selection (very light click)
     */
    selection: () => {
        if (hapticsEnabled) {
            Haptics.selectionAsync();
        }
    },
};
