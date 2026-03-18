/**
 * Chatisha Scheduler
 * Runs every 2 minutes. Finds due scheduled_messages and marks them ready.
 * The actual WhatsApp send happens in each tenant's worker (bot.ts polls the DB).
 * Also handles:
 *   - Marking appointments as NO_SHOW after missed check time passes
 *   - Expiring order followups after 3 followups or 48h
 */

import { PrismaClient, logger } from '@chatisha/shared';

const prisma = new PrismaClient();
const POLL_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

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

    // 3. Count pending scheduled messages due now (just for monitoring)
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
