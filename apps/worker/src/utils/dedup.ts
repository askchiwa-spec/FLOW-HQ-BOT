/**
 * Message de-duplication using wa_message_id
 * Prevents processing the same message multiple times
 */

interface DeduplicationEntry {
  waMessageId: string;
  timestamp: number;
}

export class MessageDeduplicator {
  private seenMessages: Map<string, DeduplicationEntry> = new Map();
  private maxSize: number;
  private ttlMs: number;

  constructor(maxSize: number = 1000, ttlMs: number = 300000) { // 5 min TTL
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
    
    // Periodic cleanup
    setInterval(() => this.cleanup(), 60000); // Every minute
  }

  /**
   * Check if message has been seen before
   * Returns true if message is a duplicate
   */
  isDuplicate(waMessageId: string): boolean {
    this.cleanup();
    return this.seenMessages.has(waMessageId);
  }

  /**
   * Mark message as seen
   */
  markSeen(waMessageId: string): void {
    this.seenMessages.set(waMessageId, {
      waMessageId,
      timestamp: Date.now()
    });

    // Prevent unbounded growth
    if (this.seenMessages.size > this.maxSize) {
      this.evictOldest();
    }
  }

  /**
   * Get cache stats
   */
  getStats(): { size: number; maxSize: number; ttlMs: number } {
    return {
      size: this.seenMessages.size,
      maxSize: this.maxSize,
      ttlMs: this.ttlMs
    };
  }

  private cleanup(): void {
    const now = Date.now();
    const expired: string[] = [];

    for (const [id, entry] of this.seenMessages) {
      if (now - entry.timestamp > this.ttlMs) {
        expired.push(id);
      }
    }

    for (const id of expired) {
      this.seenMessages.delete(id);
    }
  }

  private evictOldest(): void {
    let oldestId: string | null = null;
    let oldestTime = Infinity;

    for (const [id, entry] of this.seenMessages) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestId = id;
      }
    }

    if (oldestId) {
      this.seenMessages.delete(oldestId);
    }
  }
}

// Singleton instance
export const globalDeduplicator = new MessageDeduplicator();
