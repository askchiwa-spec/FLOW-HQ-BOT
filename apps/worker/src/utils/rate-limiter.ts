/**
 * Per-tenant rate limiter for outgoing messages
 * Default: 10 replies per minute
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  windowStart: number;
  warningSent: boolean;
}

export class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private contactLimits: Map<string, RateLimitEntry> = new Map();
  private config: RateLimitConfig;
  // Per-contact: max 5 replies per 10 minutes — prevents a single contact from spamming
  private readonly contactConfig: RateLimitConfig = { maxRequests: 5, windowMs: 600000 };

  constructor(config?: Partial<RateLimitConfig>) {
    this.config = {
      maxRequests: config?.maxRequests || 10,
      windowMs: config?.windowMs || 60000 // 1 minute
    };
  }

  /**
   * Check if request is allowed and increment counter
   * Returns: { allowed: boolean, remaining: number, warningSent: boolean }
   */
  checkLimit(tenantId: string): { allowed: boolean; remaining: number; warningSent: boolean } {
    const now = Date.now();
    const key = tenantId;
    const entry = this.limits.get(key);

    if (!entry) {
      // First request in new window
      this.limits.set(key, {
        count: 1,
        windowStart: now,
        warningSent: false
      });
      return { allowed: true, remaining: this.config.maxRequests - 1, warningSent: false };
    }

    // Check if window has expired
    if (now - entry.windowStart > this.config.windowMs) {
      // Reset window
      this.limits.set(key, {
        count: 1,
        windowStart: now,
        warningSent: false
      });
      return { allowed: true, remaining: this.config.maxRequests - 1, warningSent: false };
    }

    // Within current window
    if (entry.count >= this.config.maxRequests) {
      // Limit exceeded
      const warningSent = entry.warningSent;
      if (!warningSent) {
        entry.warningSent = true;
        this.limits.set(key, entry);
      }
      return { allowed: false, remaining: 0, warningSent };
    }

    // Increment and allow
    entry.count++;
    this.limits.set(key, entry);
    return { allowed: true, remaining: this.config.maxRequests - entry.count, warningSent: false };
  }

  /**
   * Per-contact rate limit — silently suppresses replies to a single spammy contact.
   * Max 5 replies per contact per 10 minutes.
   */
  checkContactLimit(contact: string): { allowed: boolean } {
    const now = Date.now();
    const entry = this.contactLimits.get(contact);
    if (!entry || now - entry.windowStart > this.contactConfig.windowMs) {
      this.contactLimits.set(contact, { count: 1, windowStart: now, warningSent: false });
      return { allowed: true };
    }
    if (entry.count >= this.contactConfig.maxRequests) {
      return { allowed: false };
    }
    entry.count++;
    return { allowed: true };
  }

  /**
   * Get current rate limit status for a tenant
   */
  getStatus(tenantId: string): { count: number; limit: number; windowMs: number; resetIn: number } {
    const now = Date.now();
    const entry = this.limits.get(tenantId);

    if (!entry) {
      return { count: 0, limit: this.config.maxRequests, windowMs: this.config.windowMs, resetIn: 0 };
    }

    const resetIn = Math.max(0, this.config.windowMs - (now - entry.windowStart));
    return {
      count: entry.count,
      limit: this.config.maxRequests,
      windowMs: this.config.windowMs,
      resetIn
    };
  }

  /**
   * Update rate limit configuration
   */
  updateConfig(config: Partial<RateLimitConfig>): void {
    if (config.maxRequests !== undefined) {
      this.config.maxRequests = config.maxRequests;
    }
    if (config.windowMs !== undefined) {
      this.config.windowMs = config.windowMs;
    }
  }
}

// Singleton instance
export const globalRateLimiter = new RateLimiter();
