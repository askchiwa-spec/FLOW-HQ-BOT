import dotenv from 'dotenv';
dotenv.config({ override: true }); // Always use .env values — overrides any stale vars baked into PM2's saved env

import * as Sentry from '@sentry/node';
import { WhatsAppBot } from './bot';
import { createLogger } from '@chatisha/shared';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
  });
}

const tenantId = process.env.TENANT_ID;
const sessionsPath = process.env.SESSIONS_PATH || './sessions';

const logger = createLogger(tenantId);

if (!tenantId) {
  logger.error('TENANT_ID environment variable is required');
  process.exit(1);
}

logger.info(`Starting worker for tenant: ${tenantId}`);

const bot = new WhatsAppBot(tenantId, sessionsPath);

bot.start().catch((error) => {
  logger.error({ err: error, stack: error?.stack, message: error?.message }, 'Worker failed to start');
  process.exit(1);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await bot.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await bot.stop();
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  Sentry.captureException(error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection:', reason);
  Sentry.captureException(reason);
});

// F1: Memory watchdog — check RSS every 60s; exit if critical so PM2 restarts cleanly
// Tighter thresholds after Chrome memory optimisation (was 400/600)
const MEMORY_WARN_MB = parseInt(process.env.MEMORY_WARN_MB || '250');
const MEMORY_CRITICAL_MB = parseInt(process.env.MEMORY_CRITICAL_MB || '400');
setInterval(() => {
  const rssMb = process.memoryUsage().rss / 1024 / 1024;
  if (rssMb > MEMORY_CRITICAL_MB) {
    logger.error({ rssMb: rssMb.toFixed(1) }, `MEMORY CRITICAL: ${rssMb.toFixed(1)}MB — exiting for PM2 restart`);
    process.exit(1);
  } else if (rssMb > MEMORY_WARN_MB) {
    logger.warn({ rssMb: rssMb.toFixed(1) }, `Memory warning: ${rssMb.toFixed(1)}MB`);
  }
}, 60000);
