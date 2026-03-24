/**
 * Admin alert notifications — same contract as control-plane/src/notify.ts.
 * Workers run in separate processes so they have their own copy.
 */

export async function notifyAdmin(message: string, title = 'Chatisha Alert'): Promise<void> {
  const url = process.env.ALERT_WEBHOOK_URL;
  if (!url) return;

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
  } catch {
    // Never let a failed alert crash the bot
  }
}
