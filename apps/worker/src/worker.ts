import dotenv from 'dotenv';
import { WhatsAppBot } from './bot';
import { createLogger } from '@flowhq/shared';

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
