/**
 * Chatisha Scheduler
 * Runs every 2 minutes. Finds due scheduled_messages and marks them ready.
 * The actual WhatsApp send happens in each tenant's worker (bot.ts polls the DB).
 * Also handles:
 *   - Marking appointments as NO_SHOW after missed check time passes
 *   - Expiring order followups after 3 followups or 48h
 *   - Detecting abandoned conversations (cart/booking mid-flow) and scheduling a nudge
 */

import { PrismaClient, logger } from '@chatisha/shared';

const prisma = new PrismaClient();
const POLL_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

// Keywords indicating the bot was mid-order-collection when the customer went quiet
const ORDER_FLOW_KEYWORDS = [
  'pickup or delivery', 'pickup au delivery',
  'full name', 'jina lako kamili',
  'delivery address', 'anwani yako',
  'payment method', 'njia ya malipo',
  'm-pesa, cash on delivery', 'shall i confirm',
  'reply yes to confirm', 'jibu yes kuthibitisha',
];

// Keywords indicating the bot was mid-booking-collection when the customer went quiet
const BOOKING_FLOW_KEYWORDS = [
  'preferred date', 'tarehe unayopendelea',
  'preferred time', 'available time', 'muda unaopenda',
  'full name', 'jina lako kamili',
  'phone number', 'nambari yako ya simu',
  'shall i confirm', 'jibu yes kuthibitisha',
];

const ORDER_TEMPLATES = ['ECOMMERCE', 'RESTAURANT'];
const BOOKING_TEMPLATES = ['BOOKING', 'SALON', 'HEALTHCARE', 'HOTEL', 'REAL_ESTATE'];

/**
 * Detect conversations where the bot was mid-flow (collecting order/booking details)
 * but the customer went quiet. Send a single gentle nudge after 1 hour of silence.
 */
async function detectAbandonedConversations(now: Date) {
  // Window: customer went quiet between 1h and 4h ago
  const windowStart = new Date(now.getTime() - 4 * 60 * 60 * 1000);
  const windowEnd   = new Date(now.getTime() - 1 * 60 * 60 * 1000);

  // Get all tenants with a template that has mid-flow to abandon
  const tenants = await (prisma as any).tenantConfig.findMany({
    where: { template_type: { in: [...ORDER_TEMPLATES, ...BOOKING_TEMPLATES] } },
    select: { tenant_id: true, language: true, template_type: true },
  });

  for (const tenant of tenants) {
    const isOrder   = ORDER_TEMPLATES.includes(tenant.template_type);
    const keywords  = isOrder ? ORDER_FLOW_KEYWORDS : BOOKING_FLOW_KEYWORDS;

    // Find the most recent assistant message per contact within the abandonment window
    const recentBotMessages = await prisma.conversationMessage.findMany({
      where: {
        tenant_id: tenant.tenant_id,
        role: 'assistant',
        created_at: { gte: windowStart, lte: windowEnd },
      },
      orderBy: { created_at: 'desc' },
      select: { contact: true, content: true, created_at: true },
    });

    // Deduplicate: keep only the most recent bot message per contact
    const contactMap = new Map<string, { content: string; created_at: Date }>();
    for (const msg of recentBotMessages) {
      if (!contactMap.has(msg.contact)) {
        contactMap.set(msg.contact, { content: msg.content, created_at: msg.created_at });
      }
    }

    for (const [contact, lastBotMsg] of contactMap) {
      const contentLower = lastBotMsg.content.toLowerCase();

      // Only care if the bot was actively collecting order/booking details
      if (!keywords.some((kw) => contentLower.includes(kw))) continue;

      // Skip if the customer replied after the bot (not actually abandoned)
      const customerReply = await prisma.conversationMessage.findFirst({
        where: {
          tenant_id: tenant.tenant_id,
          contact,
          role: 'user',
          created_at: { gt: lastBotMsg.created_at },
        },
        select: { id: true },
      });
      if (customerReply) continue;

      // Skip if there's already an active/confirmed order or appointment for this contact
      if (isOrder) {
        const activeOrder = await (prisma as any).orderFollowup.findFirst({
          where: {
            tenant_id: tenant.tenant_id,
            contact_phone: contact,
            status: { in: ['ACTIVE', 'CONFIRMED'] },
          },
          select: { id: true },
        });
        if (activeOrder) continue;
      } else {
        const activeAppt = await (prisma as any).appointment.findFirst({
          where: {
            tenant_id: tenant.tenant_id,
            contact_phone: contact,
            status: { in: ['PENDING', 'CONFIRMED'] },
          },
          select: { id: true },
        });
        if (activeAppt) continue;
      }

      // Skip if we already sent a cart reminder to this contact in the last 24h
      const alreadyReminded = await (prisma as any).scheduledMessage.findFirst({
        where: {
          tenant_id: tenant.tenant_id,
          contact_phone: contact,
          type: 'CART_REMINDER',
          created_at: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
        },
        select: { id: true },
      });
      if (alreadyReminded) continue;

      // Schedule the nudge for immediate delivery (bot heartbeat will pick it up)
      const message = isOrder
        ? (tenant.language === 'EN'
          ? `Hi! It looks like you were placing an order with us but didn't finish. Would you like to continue? Just reply and we'll pick up right where you left off! 🛒`
          : `Habari! Inaonekana ulikuwa ukifanya order kwetu lakini hukumaliza. Ungependa kuendelea? Jibu ujumbe huu na tutakusaidia kukamilisha! 🛒`)
        : (tenant.language === 'EN'
          ? `Hi! It looks like you were booking an appointment with us but didn't finish. Would you like to continue? Just reply and we'll pick up right where you left off! 📅`
          : `Habari! Inaonekana ulikuwa ukifanya booking kwetu lakini hukumaliza. Ungependa kuendelea? Jibu ujumbe huu na tutakusaidia kukamilisha! 📅`);

      await (prisma as any).scheduledMessage.create({
        data: {
          tenant_id: tenant.tenant_id,
          contact_phone: contact,
          message,
          type: 'CART_REMINDER',
          send_at: now,
        },
      });

      logger.info({ tenantId: tenant.tenant_id, contact, template: tenant.template_type }, 'Cart/booking abandonment reminder scheduled');
    }
  }
}

async function tick() {
  const now = new Date();

  try {
    // 1. Expire order followups that have run 3+ followups or are older than 48h
    const expireResult = await (prisma as any).orderFollowup.updateMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { followup_count: { gte: 3 } },
          { created_at: { lt: new Date(now.getTime() - 48 * 60 * 60 * 1000) } },
        ],
      },
      data: { status: 'EXPIRED' },
    });
    if (expireResult.count > 0) {
      logger.info({ expired: expireResult.count }, 'Expired order followups');
    }

    // 2. Mark appointments as NO_SHOW if missed check time has passed and still PENDING/CONFIRMED
    const noShowResult = await (prisma as any).appointment.updateMany({
      where: {
        status: { in: ['PENDING', 'CONFIRMED'] },
        appointment_at: { lt: new Date(now.getTime() - 60 * 60 * 1000) }, // 1h past appointment
      },
      data: { status: 'NO_SHOW' },
    });
    if (noShowResult.count > 0) {
      logger.info({ no_shows: noShowResult.count }, 'Marked appointments as NO_SHOW');
    }

    // 3. Detect abandoned conversations and schedule nudge messages
    await detectAbandonedConversations(now);

    // 4. Count pending scheduled messages due now (just for monitoring)
    const dueCount = await (prisma as any).scheduledMessage.count({
      where: {
        sent_at: null,
        send_at: { lte: now },
      },
    });
    if (dueCount > 0) {
      logger.info({ due_messages: dueCount }, 'Scheduled messages due for delivery');
    }

  } catch (err) {
    logger.error({ err }, 'Scheduler tick error');
  }
}

async function main() {
  logger.info('Chatisha Scheduler started');

  // Run immediately on start
  await tick();

  // Then every 2 minutes
  setInterval(tick, POLL_INTERVAL_MS);
}

main().catch((err) => {
  logger.error({ err }, 'Scheduler fatal error');
  process.exit(1);
});
