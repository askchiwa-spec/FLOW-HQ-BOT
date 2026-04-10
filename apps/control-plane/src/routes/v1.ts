/**
 * External API v1 — Third-party integrations (e.g. WATU HCM)
 *
 * POST /v1/messages  — queue a text message for delivery via a tenant's WhatsApp session
 *
 * Auth: Authorization: Bearer <API_KEY>
 * The raw key is never stored; we compare SHA-256(key) against api_keys.key_hash.
 */

import { Router, Request, Response } from 'express';
import { createHash, randomBytes } from 'crypto';
import { PrismaClient } from '@chatisha/shared';

const router = Router();
const prisma = new PrismaClient();

// ─── helpers ────────────────────────────────────────────────────────────────

function hashKey(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

/** Extract Bearer token from Authorization header. Returns null if missing/malformed. */
function extractBearer(req: Request): string | null {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  return token || null;
}

// ─── API key authentication middleware ──────────────────────────────────────

async function apiKeyAuth(req: Request, res: Response, next: Function) {
  const raw = extractBearer(req);
  if (!raw) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  const hash = hashKey(raw);
  const apiKey = await (prisma as any).apiKey.findUnique({
    where: { key_hash: hash },
  });

  if (!apiKey || !apiKey.is_active) {
    return res.status(401).json({ error: 'Invalid or revoked API key' });
  }

  // Touch last_used_at (fire-and-forget — don't block the request)
  (prisma as any).apiKey.update({
    where: { id: apiKey.id },
    data: { last_used_at: new Date() },
  }).catch(() => {});

  (req as any).apiKey = apiKey;
  next();
}

// ─── POST /v1/messages ──────────────────────────────────────────────────────

router.post('/messages', apiKeyAuth, async (req: Request, res: Response) => {
  const { phoneNumberId, to, type, text } = req.body;

  // Validate required fields
  if (!phoneNumberId || typeof phoneNumberId !== 'string') {
    return res.status(400).json({ error: 'phoneNumberId is required' });
  }
  if (!to || typeof to !== 'string') {
    return res.status(400).json({ error: 'to is required' });
  }
  if (type !== 'text') {
    return res.status(400).json({ error: 'Only type "text" is supported' });
  }
  if (!text?.body || typeof text.body !== 'string') {
    return res.status(400).json({ error: 'text.body is required' });
  }

  // Normalize destination number — ensure it ends with @c.us for whatsapp-web.js
  const normalizedTo = to.replace(/\D/g, ''); // strip non-digits
  if (normalizedTo.length < 7) {
    return res.status(400).json({ error: 'Invalid phone number in "to" field' });
  }

  // Find the tenant whose phone number matches phoneNumberId
  // phoneNumberId may be stored with or without leading '+', digits only, etc.
  const normalizedId = phoneNumberId.replace(/\D/g, '');
  const tenant = await (prisma as any).tenant.findFirst({
    where: {
      phone_number: { contains: normalizedId },
      status: 'ACTIVE',
    },
    include: { worker_process: true },
  });

  if (!tenant) {
    return res.status(404).json({ error: `No active tenant found for phoneNumberId: ${phoneNumberId}` });
  }

  if (!tenant.worker_process || tenant.worker_process.status !== 'RUNNING') {
    return res.status(503).json({ error: `WhatsApp worker for ${phoneNumberId} is not running` });
  }

  // Queue the message via scheduled_messages — worker picks it up on next heartbeat (~30s)
  const messageId = `msg_${randomBytes(8).toString('hex')}`;
  await (prisma as any).scheduledMessage.create({
    data: {
      id:            messageId,
      tenant_id:     tenant.id,
      contact_phone: `${normalizedTo}@c.us`,
      message:       text.body,
      type:          'EXTERNAL_API',
      send_at:       new Date(), // due immediately
    },
  });

  return res.status(200).json({ messageId, status: 'queued' });
});

// ─── Admin: generate a new API key (admin-password-protected) ───────────────
// POST /v1/admin/api-keys  { label, tenant_id? }
// Returns the raw key ONCE — it is never retrievable again.

router.post('/admin/api-keys', async (req: Request, res: Response) => {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const provided = req.headers['x-admin-password'];

  if (!adminPassword || provided !== adminPassword) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { label, tenant_id } = req.body;
  if (!label || typeof label !== 'string') {
    return res.status(400).json({ error: 'label is required' });
  }

  const rawKey = `chatisha_${randomBytes(24).toString('hex')}`;
  const hash   = hashKey(rawKey);

  await (prisma as any).apiKey.create({
    data: {
      key_hash:  hash,
      label:     label.trim(),
      tenant_id: tenant_id || null,
      is_active: true,
    },
  });

  // Return the raw key exactly once — never stored, cannot be recovered
  return res.status(201).json({
    api_key:  rawKey,
    label,
    note: 'Store this key securely. It cannot be retrieved again.',
  });
});

// ─── Admin: list API keys (no raw keys exposed) ──────────────────────────────

router.get('/admin/api-keys', async (req: Request, res: Response) => {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const provided = req.headers['x-admin-password'];

  if (!adminPassword || provided !== adminPassword) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const keys = await (prisma as any).apiKey.findMany({
    select: {
      id:           true,
      label:        true,
      tenant_id:    true,
      is_active:    true,
      created_at:   true,
      last_used_at: true,
    },
    orderBy: { created_at: 'desc' },
  });

  return res.json({ keys });
});

// ─── Admin: revoke an API key ────────────────────────────────────────────────

router.delete('/admin/api-keys/:id', async (req: Request, res: Response) => {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const provided = req.headers['x-admin-password'];

  if (!adminPassword || provided !== adminPassword) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  await (prisma as any).apiKey.update({
    where: { id: req.params.id },
    data:  { is_active: false },
  });

  return res.json({ revoked: true });
});

export default router;
