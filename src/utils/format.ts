/**
 * Format duration from milliseconds to MM:SS format
 * @param ms - Duration in milliseconds
 * @returns Formatted string like "2:34" or "0:05"
 */
export function formatDuration(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Format date to relative time (e.g., "2 hours ago", "Just now")
 * @param date - ISO date string or Date object
 * @returns Human-readable relative time
 */
export function formatRelativeTime(date: string | Date): string {
    const now = new Date();
    const then = typeof date === 'string' ? new Date(date) : date;
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    // Format as date if older than a week
    return then.toLocaleDateString();
}


/**
 * Generate unique ID for voice notes
 * @returns Unique string ID
 */
export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format file size from bytes to human-readable format
 * @param bytes - Size in bytes
 * @returns Formatted string like "1.2 MB"
 */
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
