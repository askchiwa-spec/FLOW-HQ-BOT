import pino from 'pino';
import path from 'path';
import fs from 'fs';

const isProduction = process.env.NODE_ENV === 'production';

export function createLogger(tenantId?: string) {
  const base = tenantId ? { tenantId } : undefined;
  const level = process.env.LOG_LEVEL || 'info';

  // In production (Vercel serverless), use plain pino with no transport
  if (isProduction) {
    return pino({ level, base });
  }

  const logsDir = process.env.LOGS_PATH
    ? path.resolve(process.env.LOGS_PATH)
    : path.join(process.cwd(), '..', '..', 'logs');

  const transports: pino.TransportTargetOptions[] = [
    {
      target: 'pino-pretty',
      options: { colorize: true }
    }
  ];

  if (tenantId) {
    try {
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
      transports.push({
        target: 'pino/file',
        options: { destination: path.join(logsDir, `${tenantId}.log`) }
      });
    } catch {
      // If log directory can't be created, skip file logging
    }
  }

  return pino({ level, base }, pino.transport({ targets: transports }));
}

export const logger = createLogger();
