// Socket.IO rate limiter — in-memory per-socket event counter
interface SocketBucket {
  count: number;
  resetAt: number; // timestamp when counter resets
}

const WINDOW_MS = 60 * 1000; // 60 seconds
const MAX_EVENTS = 120; // max events per window per socket

class SocketRateLimiter {
  private buckets = new Map<string, SocketBucket>();
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up stale buckets every 5 minutes
    this.cleanupTimer = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    // Make interval unref so it doesn't prevent process exit
    if (this.cleanupTimer.unref) this.cleanupTimer.unref();
  }

  /** Check if a socket is allowed to process an event. Returns true if allowed. */
  allow(socketId: string): boolean {
    const now = Date.now();
    let bucket = this.buckets.get(socketId);

    if (!bucket || now >= bucket.resetAt) {
      // New window
      bucket = { count: 1, resetAt: now + WINDOW_MS };
      this.buckets.set(socketId, bucket);
      return true;
    }

    bucket.count++;
    if (bucket.count > MAX_EVENTS) {
      return false;
    }
    return true;
  }

  /** Get remaining events for a socket (for debugging). */
  remaining(socketId: string): number {
    const bucket = this.buckets.get(socketId);
    if (!bucket) return MAX_EVENTS;
    const now = Date.now();
    if (now >= bucket.resetAt) return MAX_EVENTS;
    return Math.max(0, MAX_EVENTS - bucket.count);
  }

  private cleanup() {
    const now = Date.now();
    let changed = false;
    for (const [id, bucket] of this.buckets.entries()) {
      if (now >= bucket.resetAt) {
        this.buckets.delete(id);
        changed = true;
      }
    }
    if (changed) {
      console.log(`[socketLimiter] Cleaned up ${changed ? 'stale buckets' : ''}`);
    }
  }

  shutdown() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}

// Singleton instance
export const socketLimiter = new SocketRateLimiter();

/** Express-compatible middleware that checks rate limit on socket requests. */
export function socketRateLimitMiddleware(
  socketId: string
): { allowed: boolean; reason?: string } {
  if (socketLimiter.allow(socketId)) {
    return { allowed: true };
  }
  return { allowed: false, reason: 'Too many requests. Please wait a moment.' };
}