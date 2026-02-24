import { Router, Request, Response } from 'express';
import { PrismaClient, logger } from '@flowhq/shared';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);
const router = Router();
const prisma = new PrismaClient();

const WORKER_SCRIPT_PATH = path.join(__dirname, '..', '..', '..', 'worker', 'dist', 'worker.js');
const STALE_THRESHOLD_MINUTES = parseInt(process.env.STALE_THRESHOLD_MINUTES || '2');

/**
 * Check if a PM2 process is running
 */
async function isPM2ProcessRunning(pm2Name: string): Promise<boolean> {
  try {
    const { stdout } = await execAsync(`pm2 describe "${pm2Name}"`);
    return stdout.includes('online') || stdout.includes('running');
  } catch {
    return false;
  }
}

/**
 * Mark stale workers as ERROR
 * Called periodically to detect workers that haven't sent heartbeats
 */
export async function markStaleWorkers(): Promise<void> {
  try {
    const staleThreshold = new Date(Date.now() - STALE_THRESHOLD_MINUTES * 60 * 1000);
    
    const staleWorkers = await prisma.workerProcess.findMany({
      where: {
        status: 'RUNNING',
        tenant: {
          whatsapp_session: {
            last_seen_at: {
              lt: staleThreshold
            }
          }
        }
      },
      include: {
        tenant: {
          include: {
            whatsapp_session: true
          }
        }
      }
    });
    
    for (const worker of staleWorkers) {
      logger.warn({ 
        tenantId: worker.tenant_id, 
        lastSeen: worker.tenant.whatsapp_session?.last_seen_at 
      }, 'Marking stale worker as ERROR');
      
      await prisma.workerProcess.update({
        where: { id: worker.id },
        data: {
          status: 'ERROR',
          last_error: `Worker marked STALE: No heartbeat for ${STALE_THRESHOLD_MINUTES}+ minutes`
        }
      });
      
      await prisma.tenant.update({
        where: { id: worker.tenant_id },
        data: { status: 'ERROR' }
      });
    }
    
    if (staleWorkers.length > 0) {
      logger.info(`Marked ${staleWorkers.length} stale workers as ERROR`);
    }
  } catch (error) {
    logger.error('Error marking stale workers:', error);
  }
}

router.get('/tenants', async (req: Request, res: Response) => {
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        config: true,
        whatsapp_session: true,
        worker_process: true
      },
      orderBy: { created_at: 'desc' }
    });
    
    if (req.headers.accept?.includes('application/json')) {
      return res.json(tenants);
    }
    
    res.render('tenants', { tenants });
  } catch (error) {
    logger.error('Error fetching tenants:', error);
    res.status(500).json({ error: 'Failed to fetch tenants' });
  }
});

router.post('/tenants', async (req: Request, res: Response) => {
  try {
    const { name, phone_number, template_type, business_name, language } = req.body;
    
    const tenant = await prisma.tenant.create({
      data: {
        name,
        phone_number,
        config: {
          create: {
            template_type,
            business_name,
            language
          }
        },
        whatsapp_session: {
          create: {}
        },
        worker_process: {
          create: {
            pm2_name: `worker-${name.toLowerCase().replace(/\s+/g, '-')}`
          }
        }
      },
      include: {
        config: true,
        whatsapp_session: true,
        worker_process: true
      }
    });
    
    res.status(201).json(tenant);
  } catch (error) {
    logger.error('Error creating tenant:', error);
    res.status(500).json({ error: 'Failed to create tenant' });
  }
});

router.get('/tenants/:id', async (req: Request, res: Response) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.params.id },
      include: {
        config: true,
        whatsapp_session: true,
        worker_process: true
      }
    });
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    const logs = await prisma.messageLog.findMany({
      where: { tenant_id: req.params.id },
      orderBy: { created_at: 'desc' },
      take: 50
    });
    
    if (req.headers.accept?.includes('application/json')) {
      return res.json({ tenant, logs });
    }
    
    res.render('tenant-detail', { tenant, logs });
  } catch (error) {
    logger.error('Error fetching tenant:', error);
    res.status(500).json({ error: 'Failed to fetch tenant' });
  }
});

router.post('/tenants/:id/worker/start', async (req: Request, res: Response) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.params.id },
      include: { worker_process: true }
    });
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    const pm2Name = tenant.worker_process?.pm2_name || `worker-${tenant.id.slice(0, 8)}`;
    
    // Check if worker is already running
    const isRunning = await isPM2ProcessRunning(pm2Name);
    if (isRunning) {
      return res.status(400).json({ 
        error: 'Worker already running',
        message: 'Use restart if you need to reload the worker'
      });
    }
    
    const sessionsPath = path.join(process.cwd(), '..', '..', 'sessions', tenant.id);
    
    const command = `pm2 start ${WORKER_SCRIPT_PATH} --name "${pm2Name}" --env TENANT_ID=${tenant.id} --env SESSIONS_PATH=${sessionsPath}`;
    
    await execAsync(command);
    
    await prisma.workerProcess.update({
      where: { tenant_id: tenant.id },
      data: { 
        status: 'RUNNING',
        pm2_name: pm2Name,
        last_error: null
      }
    });
    
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { status: 'QR_PENDING' }
    });
    
    res.json({ success: true, message: 'Worker started' });
  } catch (error) {
    logger.error('Error starting worker:', error);
    
    await prisma.workerProcess.update({
      where: { tenant_id: req.params.id },
      data: { 
        status: 'ERROR',
        last_error: String(error)
      }
    });
    
    res.status(500).json({ error: 'Failed to start worker' });
  }
});

router.post('/tenants/:id/worker/stop', async (req: Request, res: Response) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.params.id },
      include: { worker_process: true }
    });
    
    if (!tenant || !tenant.worker_process) {
      return res.status(404).json({ error: 'Tenant or worker not found' });
    }
    
    await execAsync(`pm2 stop "${tenant.worker_process.pm2_name}"`);
    
    await prisma.workerProcess.update({
      where: { tenant_id: tenant.id },
      data: { status: 'STOPPED' }
    });
    
    res.json({ success: true, message: 'Worker stopped' });
  } catch (error) {
    logger.error('Error stopping worker:', error);
    res.status(500).json({ error: 'Failed to stop worker' });
  }
});

router.post('/tenants/:id/worker/restart', async (req: Request, res: Response) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.params.id },
      include: { worker_process: true }
    });
    
    if (!tenant || !tenant.worker_process) {
      return res.status(404).json({ error: 'Tenant or worker not found' });
    }
    
    await execAsync(`pm2 restart "${tenant.worker_process.pm2_name}"`);
    
    await prisma.workerProcess.update({
      where: { tenant_id: tenant.id },
      data: { 
        status: 'RUNNING',
        last_error: null
      }
    });
    
    res.json({ success: true, message: 'Worker restarted' });
  } catch (error) {
    logger.error('Error restarting worker:', error);
    res.status(500).json({ error: 'Failed to restart worker' });
  }
});

router.post('/tenants/:id/worker/force-restart', async (req: Request, res: Response) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.params.id },
      include: { worker_process: true }
    });
    
    if (!tenant || !tenant.worker_process) {
      return res.status(404).json({ error: 'Tenant or worker not found' });
    }
    
    const pm2Name = tenant.worker_process.pm2_name;
    
    // Try to stop if running
    try {
      await execAsync(`pm2 stop "${pm2Name}"`);
    } catch {
      // Ignore stop errors
    }
    
    // Wait a moment
    await new Promise(r => setTimeout(r, 1000));
    
    // Start fresh
    const sessionsPath = path.join(process.cwd(), '..', '..', 'sessions', tenant.id);
    const command = `pm2 start ${WORKER_SCRIPT_PATH} --name "${pm2Name}" --env TENANT_ID=${tenant.id} --env SESSIONS_PATH=${sessionsPath}`;
    
    await execAsync(command);
    
    await prisma.workerProcess.update({
      where: { tenant_id: tenant.id },
      data: { 
        status: 'RUNNING',
        last_error: null
      }
    });
    
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { status: 'QR_PENDING' }
    });
    
    res.json({ success: true, message: 'Worker force-restarted' });
  } catch (error) {
    logger.error('Error force-restarting worker:', error);
    res.status(500).json({ error: 'Failed to force-restart worker' });
  }
});

router.get('/tenants/:id/qr', async (req: Request, res: Response) => {
  try {
    const session = await prisma.whatsAppSession.findUnique({
      where: { tenant_id: req.params.id }
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json({
      state: session.state,
      qr: session.last_qr
    });
  } catch (error) {
    logger.error('Error fetching QR:', error);
    res.status(500).json({ error: 'Failed to fetch QR' });
  }
});

router.get('/tenants/:id/logs', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 200;
    
    const logs = await prisma.messageLog.findMany({
      where: { tenant_id: req.params.id },
      orderBy: { created_at: 'desc' },
      take: limit
    });
    
    res.json(logs);
  } catch (error) {
    logger.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// Setup Request Routes

router.get('/setup-requests', async (req: Request, res: Response) => {
  try {
    const requests = await prisma.setupRequest.findMany({
      include: {
        tenant: true,
        user: true,
      },
      orderBy: { created_at: 'desc' },
    });
    
    if (req.headers.accept?.includes('application/json')) {
      return res.json(requests);
    }
    
    res.render('setup-requests', { requests });
  } catch (error) {
    logger.error('Error fetching setup requests:', error);
    res.status(500).json({ error: 'Failed to fetch setup requests' });
  }
});

router.get('/setup-requests/:id', async (req: Request, res: Response) => {
  try {
    const request = await prisma.setupRequest.findUnique({
      where: { id: req.params.id },
      include: {
        tenant: true,
        user: true,
      },
    });
    
    if (!request) {
      return res.status(404).json({ error: 'Setup request not found' });
    }
    
    if (req.headers.accept?.includes('application/json')) {
      return res.json(request);
    }
    
    res.render('setup-request-detail', { request });
  } catch (error) {
    logger.error('Error fetching setup request:', error);
    res.status(500).json({ error: 'Failed to fetch setup request' });
  }
});

router.post('/setup-requests/:id/approve', async (req: Request, res: Response) => {
  try {
    const { notes } = req.body;
    
    const setupRequest = await prisma.setupRequest.findUnique({
      where: { id: req.params.id },
      include: { tenant: { include: { worker_process: true } } },
    });
    
    if (!setupRequest) {
      return res.status(404).json({ error: 'Setup request not found' });
    }
    
    // Update setup request to APPROVED
    await prisma.setupRequest.update({
      where: { id: req.params.id },
      data: {
        status: 'APPROVED',
        notes: notes || undefined,
      },
    });
    
    // Update tenant status
    await prisma.tenant.update({
      where: { id: setupRequest.tenant_id },
      data: { status: 'QR_PENDING' },
    });
    
    // Start the worker
    const pm2Name = setupRequest.tenant.worker_process?.pm2_name || `worker-${setupRequest.tenant.id.slice(0, 8)}`;
    const sessionsPath = path.join(process.cwd(), '..', '..', 'sessions', setupRequest.tenant.id);
    const command = `pm2 start ${WORKER_SCRIPT_PATH} --name "${pm2Name}" --env TENANT_ID=${setupRequest.tenant.id} --env SESSIONS_PATH=${sessionsPath}`;
    
    try {
      await execAsync(command);
      
      await prisma.workerProcess.update({
        where: { tenant_id: setupRequest.tenant_id },
        data: {
          status: 'RUNNING',
          pm2_name: pm2Name,
          last_error: null,
        },
      });
      
      await prisma.tenant.update({
        where: { id: setupRequest.tenant_id },
        data: { status: 'QR_PENDING' },
      });
      
      logger.info({ requestId: req.params.id, tenantId: setupRequest.tenant_id }, 'Setup request approved and worker started');
    } catch (workerError) {
      logger.error('Error starting worker after approval:', workerError);
      // Still approved, but worker failed to start - admin can retry
    }
    
    // Log event
    await prisma.portalEventLog.create({
      data: {
        tenant_id: setupRequest.tenant_id,
        event_type: 'SETUP_REQUEST_APPROVED',
        payload_json: { requestId: req.params.id, notes },
      },
    });
    
    res.redirect('/admin/setup-requests/' + req.params.id);
  } catch (error) {
    logger.error('Error approving setup request:', error);
    res.status(500).json({ error: 'Failed to approve setup request' });
  }
});

router.post('/setup-requests/:id/reject', async (req: Request, res: Response) => {
  try {
    const { notes } = req.body;
    
    const setupRequest = await prisma.setupRequest.findUnique({
      where: { id: req.params.id },
    });
    
    if (!setupRequest) {
      return res.status(404).json({ error: 'Setup request not found' });
    }
    
    await prisma.setupRequest.update({
      where: { id: req.params.id },
      data: {
        status: 'REJECTED',
        notes: notes || 'No reason provided',
      },
    });
    
    // Log event
    await prisma.portalEventLog.create({
      data: {
        tenant_id: setupRequest.tenant_id,
        event_type: 'SETUP_REQUEST_REJECTED',
        payload_json: { requestId: req.params.id, notes },
      },
    });
    
    res.redirect('/admin/setup-requests/' + req.params.id);
  } catch (error) {
    logger.error('Error rejecting setup request:', error);
    res.status(500).json({ error: 'Failed to reject setup request' });
  }
});

export default router;
