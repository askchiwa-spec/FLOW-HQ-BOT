import dotenv from 'dotenv';
import { WhatsAppBot } from './bot';
import { createLogger } from '@chatisha/shared';

dotenv.config();

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
  logger.error('Worker failed to start:', error);
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
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection:', reason);
});

// F1: Memory watchdog — check RSS every 60s; exit if critical so PM2 restarts cleanly
const MEMORY_WARN_MB = parseInt(process.env.MEMORY_WARN_MB || '400');
const MEMORY_CRITICAL_MB = parseInt(process.env.MEMORY_CRITICAL_MB || '600');
setInterval(() => {
  const rssMb = process.memoryUsage().rss / 1024 / 1024;
  if (rssMb > MEMORY_CRITICAL_MB) {
    logger.error({ rssMb: rssMb.toFixed(1) }, `MEMORY CRITICAL: ${rssMb.toFixed(1)}MB — exiting for PM2 restart`);
    process.exit(1);
  } else if (rssMb > MEMORY_WARN_MB) {
    logger.warn({ rssMb: rssMb.toFixed(1) }, `Memory warning: ${rssMb.toFixed(1)}MB`);
  }
}, 60000);
