/**
 * Simple in-memory per-user rate limiter for Next.js API route handlers.
 * Keyed by user email (from JWT) so limits are per-tenant, not per-IP.
 *
 * Usage:
 *   const limited = checkRateLimit(email, 'setup-request', 5, 60_000);
 *   if (limited) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
 */

interface Window {
  count: number;
  resetAt: number;
}

// Global store — persists across requests within the same Node.js process
const store = new Map<string, Window>();

// Prune stale entries every 5 minutes to prevent unbounded memory growth
setInterval(() => {
  const now = Date.now();
  store.forEach((win, key) => {
    if (now > win.resetAt) store.delete(key);
  });
}, 5 * 60 * 1000);

/**
 * Returns true if the caller is over the limit (should be blocked).
 *
 * @param key       Unique identifier (e.g. user email)
 * @param action    Namespace to separate limits per endpoint
 * @param max       Maximum number of requests allowed in the window
 * @param windowMs  Window duration in milliseconds
 */
export function checkRateLimit(
  key: string,
  action: string,
  max: number,
  windowMs: number
): boolean {
  const storeKey = `${action}:${key}`;
  const now = Date.now();

  let win = store.get(storeKey);

  if (!win || now > win.resetAt) {
    win = { count: 1, resetAt: now + windowMs };
    store.set(storeKey, win);
    return false;
  }

  win.count += 1;
  return win.count > max;
}
