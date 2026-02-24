import pino from 'pino';
import path from 'path';
import fs from 'fs';

export function createLogger(tenantId?: string) {
  const logsDir = path.join(process.cwd(), '..', '..', 'logs');
  
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  const transports: pino.TransportTargetOptions[] = [
    {
      target: 'pino-pretty',
      options: { colorize: true }
    }
  ];

  if (tenantId) {
    transports.push({
      target: 'pino/file',
      options: { destination: path.join(logsDir, `${tenantId}.log`) }
    });
  }

  return pino({
    level: process.env.LOG_LEVEL || 'info',
    base: tenantId ? { tenantId } : undefined
  }, pino.transport({ targets: transports }));
}

export const logger = createLogger();
