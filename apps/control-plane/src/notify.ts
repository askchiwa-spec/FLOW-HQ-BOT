/**
 * Admin alert notifications.
 * Posts a plain-text message to ALERT_WEBHOOK_URL (if configured).
 *
 * Works out of the box with ntfy.sh — free push notifications to your phone:
 *   1. Install the ntfy app (Android/iOS)
 *   2. Subscribe to a unique topic, e.g. "chatisha-alerts-abc123"
 *   3. Set ALERT_WEBHOOK_URL=https://ntfy.sh/chatisha-alerts-abc123
 *
 * Also works with any HTTP endpoint that accepts a POST with a plain-text body.
 */

import { logger } from '@chatisha/shared';

export async function notifyAdmin(message: string, title = 'Chatisha Alert'): Promise<void> {
  const url = process.env.ALERT_WEBHOOK_URL;
  if (!url) return; // Alerts are opt-in — silently skip if not configured

  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'Title': title,
        'Priority': 'high',
        'Tags': 'warning',
      },
      body: message,
    });
  } catch (err) {
    // Never let a failed alert crash the main flow
    logger.warn({ err }, 'Failed to send admin alert notification');
  }
}
