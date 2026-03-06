/**
 * Worker provisioner — shared logic for starting/stopping tenant WhatsApp workers.
 * Used by both the portal (auto-provisioning) and admin (manual control).
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { PrismaClient, logger } from '@chatisha/shared';

const execAsync = promisify(exec);

const WORKER_SCRIPT_PATH = path.join(__dirname, '..', '..', 'worker', 'dist', 'worker.js');

function writeEcosystemConfig(pm2Name: string, tenantId: string, sessionsPath: string): string {
  if (!fs.existsSync(sessionsPath)) {
    fs.mkdirSync(sessionsPath, { recursive: true });
  }
  const ecosystemPath = path.join(sessionsPath, 'ecosystem.config.js');
  const content = `module.exports = {
  apps: [{
    name: ${JSON.stringify(pm2Name)},
    script: ${JSON.stringify(WORKER_SCRIPT_PATH)},
    env: {
      TENANT_ID: ${JSON.stringify(tenantId)},
      SESSIONS_PATH: ${JSON.stringify(sessionsPath)},
      DATABASE_URL: ${JSON.stringify(process.env.DATABASE_URL || '')},
      ANTHROPIC_API_KEY: ${JSON.stringify(process.env.ANTHROPIC_API_KEY || '')},
      LOG_LEVEL: ${JSON.stringify(process.env.LOG_LEVEL || 'info')},
      RATE_LIMIT_MAX_PER_MINUTE: ${JSON.stringify(process.env.RATE_LIMIT_MAX_PER_MINUTE || '10')},
      HEARTBEAT_INTERVAL_MS: ${JSON.stringify(process.env.HEARTBEAT_INTERVAL_MS || '30000')},
      NODE_ENV: ${JSON.stringify(process.env.NODE_ENV || 'production')}
    }
  }]
};\n`;
  fs.writeFileSync(ecosystemPath, content);
  return ecosystemPath;
}

export async function isWorkerRunning(pm2Name: string): Promise<boolean> {
  try {
    const { stdout } = await execAsync(`pm2 describe "${pm2Name}"`);
    return stdout.includes('online') || stdout.includes('running');
  } catch {
    return false;
  }
}

/**
 * Start a worker for a tenant. Idempotent — safe to call even if already running.
 * Updates DB on success or failure.
 */
export async function startWorker(
  tenantId: string,
  pm2Name: string,
  prisma: PrismaClient
): Promise<{ success: boolean; error?: string }> {
  const sessionsPath = path.join(process.cwd(), '..', '..', 'sessions', tenantId);
  const ecosystemPath = writeEcosystemConfig(pm2Name, tenantId, sessionsPath);

  const alreadyRunning = await isWorkerRunning(pm2Name);
  if (alreadyRunning) {
    logger.info({ tenantId, pm2Name }, 'Worker already running, skipping start');
    return { success: true };
  }

  try {
    await execAsync(`pm2 start ${ecosystemPath}`);

    await prisma.workerProcess.update({
      where: { tenant_id: tenantId },
      data: { status: 'RUNNING', pm2_name: pm2Name, last_error: null },
    });

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { status: 'QR_PENDING' },
    });

    logger.info({ tenantId, pm2Name }, 'Worker started successfully');
    return { success: true };
  } catch (err) {
    const errorMsg = String(err);
    logger.error({ tenantId, pm2Name, error: errorMsg }, 'Failed to start worker');

    await prisma.workerProcess.update({
      where: { tenant_id: tenantId },
      data: { status: 'ERROR', last_error: errorMsg.slice(0, 1000) },
    }).catch(() => {});

    return { success: false, error: errorMsg };
  }
}

/**
 * Stop a worker. Updates DB status.
 */
export async function stopWorker(
  tenantId: string,
  pm2Name: string,
  prisma: PrismaClient
): Promise<void> {
  try {
    await execAsync(`pm2 stop "${pm2Name}"`);
  } catch {
    // Ignore — process may already be stopped
  }

  await prisma.workerProcess.update({
    where: { tenant_id: tenantId },
    data: { status: 'STOPPED' },
  });
}

/**
 * Force-restart a worker (stop → wait → start fresh).
 */
export async function restartWorker(
  tenantId: string,
  pm2Name: string,
  prisma: PrismaClient
): Promise<{ success: boolean; error?: string }> {
  await stopWorker(tenantId, pm2Name, prisma);
  await new Promise((r) => setTimeout(r, 1000));
  return startWorker(tenantId, pm2Name, prisma);
}
