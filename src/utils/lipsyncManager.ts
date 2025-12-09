/**
 * Simplified Lipsync Manager for React Native
 * 
 * This provides a simplified lipsync system that works with React Native
 * by using audio level detection instead of full FFT analysis.
 * 
 * For full implementation, you would need:
 * - Native audio FFT module
 * - Formant analysis
 * - Phoneme detection
 */

export type Viseme = 'A' | 'E' | 'I' | 'O' | 'U' | 'M' | 'F' | 'TH' | 'S' | 'X';

class LipsyncManager {
    private currentViseme: Viseme = 'X';
    private audioLevel: number = 0;
    private lastUpdateTime: number = 0;
    private visemeTimings: Array<{ time: number; viseme: Viseme }> = [];
    private currentTimeIndex: number = 0;
    private isPlaying: boolean = false;

    /**
     * Simple volume-based viseme estimation
     * In production, this should use FFT and formant analysis
     */
    updateFromAudioLevel(level: number): void {
        this.audioLevel = level;
        const now = Date.now();

        // Simple heuristic: map volume levels to basic visemes
        if (level < 0.05) {
            this.currentViseme = 'X'; // Silence
        } else if (level < 0.2) {
            this.currentViseme = 'M'; // Quiet sounds (m, b, p)
        } else if (level < 0.4) {
            this.currentViseme = 'E'; // Medium
        } else if (level < 0.6) {
            this.currentViseme = 'O'; // Medium-high
        } else {
            this.currentViseme = 'A'; // Loud/open mouth
        }

        this.lastUpdateTime = now;
    }

    /**
     * Use pre-computed viseme timings for accurate lipsync
     * This is more accurate than volume-based detection
     */
    loadVisemeTimings(timings: Array<{ time: number; viseme: Viseme }>): void {
        this.visemeTimings = timings.sort((a, b) => a.time - b.time);
        this.currentTimeIndex = 0;
    }

    /**
     * Update viseme based on current audio playback position
     */
    updateFromAudioPosition(positionMs: number): void {
        if (this.visemeTimings.length === 0) {
            return;
        }

        // Find the appropriate viseme for the current time
        while (
            this.currentTimeIndex < this.visemeTimings.length - 1 &&
            this.visemeTimings[this.currentTimeIndex + 1].time <= positionMs
        ) {
            this.currentTimeIndex++;
        }

        if (this.currentTimeIndex < this.visemeTimings.length) {
            this.currentViseme = this.visemeTimings[this.currentTimeIndex].viseme;
        }
    }

    /**
     * Reset to beginning
     */
    reset(): void {
        this.currentViseme = 'X';
        this.audioLevel = 0;
        this.currentTimeIndex = 0;
        this.isPlaying = false;
    }

    /**
     * Start playback
     */
    start(): void {
        this.isPlaying = true;
        this.currentTimeIndex = 0;
    }

    /**
     * Stop playback
     */
    stop(): void {
        this.isPlaying = false;
        this.reset();
    }

    /**
     * Get current viseme
     */
    get viseme(): Viseme {
        return this.currentViseme;
    }

    /**
     * Get current audio level (0-1)
     */
    get level(): number {
        return this.audioLevel;
    }

    /**
     * Get playing state
     */
    get playing(): boolean {
        return this.isPlaying;
    }
}

// Export singleton instance
export const lipsyncManager = new LipsyncManager();

/**
 * Sample viseme timings for demonstration
 * Format: { time: milliseconds, viseme: Viseme }
 */
export const sampleVisemeTimings: Array<{ time: number; viseme: Viseme }> = [
    { time: 0, viseme: 'X' },
    { time: 200, viseme: 'M' },
    { time: 400, viseme: 'A' },
    { time: 600, viseme: 'E' },
    { time: 800, viseme: 'A' },
    { time: 1000, viseme: 'O' },
    { time: 1200, viseme: 'U' },
    { time: 1400, viseme: 'M' },
    { time: 1600, viseme: 'A' },
    { time: 1800, viseme: 'I' },
    { time: 2000, viseme: 'M' },
    { time: 2200, viseme: 'TH' },
    { time: 2400, viseme: 'E' },
    { time: 2600, viseme: 'S' },
    { time: 2800, viseme: 'X' },
];
