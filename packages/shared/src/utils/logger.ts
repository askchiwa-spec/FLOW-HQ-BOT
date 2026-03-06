import pino from 'pino';
import path from 'path';
import fs from 'fs';

export function createLogger(tenantId?: string) {
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
      // If log directory can't be created (e.g. wrong cwd context), skip file logging
    }
  }

  return pino({
    level: process.env.LOG_LEVEL || 'info',
    base: tenantId ? { tenantId } : undefined
  }, pino.transport({ targets: transports }));
}

export const logger = createLogger();
