/**
 * Socket.IO rate limiter
 * Tracks events per socket and enforces limits
 */

interface RateLimitEntry {
    timestamps: number[];
}

export class SocketRateLimiter {
    private limits: Map<string, RateLimitEntry> = new Map();
    private readonly cleanupInterval: NodeJS.Timeout;

    constructor() {
        // Clean up old entries every 5 minutes
        this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }

    /**
     * Check if an event is allowed based on rate limits
     * @param socketId Socket ID
     * @param event Event name
     * @param maxPerMinute Maximum events per minute
     * @returns true if allowed, false if rate limited
     */
    checkLimit(socketId: string, event: string, maxPerMinute: number): boolean {
        const key = `${socketId}:${event}`;
        const now = Date.now();
        const entry = this.limits.get(key);

        if (!entry) {
            this.limits.set(key, { timestamps: [now] });
            return true;
        }

        // Filter out timestamps older than 1 minute
        const recentEvents = entry.timestamps.filter((t) => now - t < 60000);

        if (recentEvents.length >= maxPerMinute) {
            return false;
        }

        recentEvents.push(now);
        this.limits.set(key, { timestamps: recentEvents });
        return true;
    }

    /**
     * Remove a socket's rate limit data
     */
    removeSocket(socketId: string): void {
        const keysToDelete: string[] = [];
        for (const key of this.limits.keys()) {
            if (key.startsWith(`${socketId}:`)) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach((key) => this.limits.delete(key));
    }

    /**
     * Clean up old entries
     */
    private cleanup(): void {
        const now = Date.now();
        const keysToDelete: string[] = [];

        for (const [key, entry] of this.limits.entries()) {
            const recentEvents = entry.timestamps.filter((t) => now - t < 60000);
            if (recentEvents.length === 0) {
                keysToDelete.push(key);
            } else {
                this.limits.set(key, { timestamps: recentEvents });
            }
        }

        keysToDelete.forEach((key) => this.limits.delete(key));
    }

    /**
     * Cleanup on shutdown
     */
    destroy(): void {
        clearInterval(this.cleanupInterval);
        this.limits.clear();
    }
}

// Export singleton instance
export const socketRateLimiter = new SocketRateLimiter();
