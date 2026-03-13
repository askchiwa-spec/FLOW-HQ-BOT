import { Router, Request, Response } from 'express';
import { PrismaClient, logger } from '@chatisha/shared';
import { startWorker, stopWorker, restartWorker, isWorkerRunning } from '../provisioner';

const router = Router();
const prisma = new PrismaClient();

const STALE_THRESHOLD_MINUTES = parseInt(process.env.STALE_THRESHOLD_MINUTES || '5');

router.get('/', (req: Request, res: Response) => {
  res.redirect('/admin/tenants');
});

/**
 * Auto-restart stale workers (no heartbeat for STALE_THRESHOLD_MINUTES)
 * Called periodically by the control plane
 */
export async function markStaleWorkers(): Promise<void> {
  try {
    const staleThreshold = new Date(Date.now() - STALE_THRESHOLD_MINUTES * 60 * 1000);

    const staleWorkers = await prisma.workerProcess.findMany({
      where: {
        status: 'RUNNING',
        tenant: {
          whatsapp_session: {
            last_seen_at: { lt: staleThreshold }
          }
        }
      },
      include: {
        tenant: { include: { whatsapp_session: true } }
      }
    });

    for (const worker of staleWorkers) {
      logger.warn({
        tenantId: worker.tenant_id,
        lastSeen: worker.tenant.whatsapp_session?.last_seen_at
      }, 'Stale worker detected — auto-restarting');

      try {
        const result = await restartWorker(worker.tenant_id, worker.pm2_name, prisma);
        if (result.success) {
          logger.info({ tenantId: worker.tenant_id }, 'Stale worker auto-restarted successfully');
        } else {
          logger.error({ tenantId: worker.tenant_id, error: result.error }, 'Stale worker auto-restart failed');
        }
      } catch (restartErr) {
        logger.error({ tenantId: worker.tenant_id, error: restartErr }, 'Stale worker restart threw');
        await prisma.workerProcess.update({
          where: { id: worker.id },
          data: { status: 'ERROR', last_error: `STALE: No heartbeat ${STALE_THRESHOLD_MINUTES}+ min — auto-restart failed` }
        }).catch(() => {});
        await prisma.tenant.update({
          where: { id: worker.tenant_id },
          data: { status: 'ERROR' }
        }).catch(() => {});
      }
    }

    if (staleWorkers.length > 0) {
      logger.info(`Auto-restarted ${staleWorkers.length} stale workers`);
    }
  } catch (error) {
    logger.error('Error in stale worker check:', error);
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
      include: { worker_process: true },
    });
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

    const pm2Name = tenant.worker_process?.pm2_name || `worker-${tenant.id.slice(0, 8)}`;

    if (await isWorkerRunning(pm2Name)) {
      return res.status(400).json({ error: 'Worker already running. Use restart to reload.' });
    }

    const result = await startWorker(tenant.id, pm2Name, prisma);
    if (!result.success) return res.status(500).json({ error: 'Failed to start worker', detail: result.error });

    res.json({ success: true, message: 'Worker started' });
  } catch (error) {
    logger.error('Error starting worker:', error);
    res.status(500).json({ error: 'Failed to start worker' });
  }
});

router.post('/tenants/:id/worker/stop', async (req: Request, res: Response) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.params.id },
      include: { worker_process: true },
    });
    if (!tenant?.worker_process) return res.status(404).json({ error: 'Tenant or worker not found' });

    await stopWorker(tenant.id, tenant.worker_process.pm2_name, prisma);
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
      include: { worker_process: true },
    });
    if (!tenant?.worker_process) return res.status(404).json({ error: 'Tenant or worker not found' });

    const result = await restartWorker(tenant.id, tenant.worker_process.pm2_name, prisma);
    if (!result.success) return res.status(500).json({ error: 'Failed to restart worker', detail: result.error });

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
      include: { worker_process: true },
    });
    if (!tenant?.worker_process) return res.status(404).json({ error: 'Tenant or worker not found' });

    const result = await restartWorker(tenant.id, tenant.worker_process.pm2_name, prisma);
    if (!result.success) return res.status(500).json({ error: 'Failed to force-restart worker', detail: result.error });

    res.json({ success: true, message: 'Worker force-restarted' });
  } catch (error) {
    logger.error('Error force-restarting worker:', error);
    res.status(500).json({ error: 'Failed to force-restart worker' });
  }
});

router.delete('/tenants/:id', async (req: Request, res: Response) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.params.id },
      include: { worker_process: true },
    });
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

    // Stop worker first if running
    if (tenant.worker_process?.pm2_name) {
      await stopWorker(tenant.id, tenant.worker_process.pm2_name, prisma).catch(() => {});
    }

    // Delete tenant — cascades to all related records (config, session, worker, logs, messages)
    await prisma.tenant.delete({ where: { id: req.params.id } });

    logger.info({ tenantId: req.params.id, name: tenant.name }, 'Tenant deleted by admin');
    res.json({ success: true });
  } catch (error) {
    logger.error('Error deleting tenant:', error);
    res.status(500).json({ error: 'Failed to delete tenant' });
  }
});

router.post('/tenants/:id/subscription', async (req: Request, res: Response) => {
  try {
    const { subscription_end_date, subscription_status } = req.body;

    await prisma.tenant.update({
      where: { id: req.params.id },
      data: {
        subscription_end_date: subscription_end_date ? new Date(subscription_end_date) : null,
        subscription_status: subscription_status || 'ACTIVE',
      },
    });

    await prisma.portalEventLog.create({
      data: {
        tenant_id: req.params.id,
        event_type: 'PAYMENT_RECORDED',
        payload_json: { subscription_end_date, subscription_status },
      },
    });

    res.redirect('/admin/tenants/' + req.params.id);
  } catch (error) {
    logger.error('Error updating subscription:', error);
    res.status(500).json({ error: 'Failed to update subscription' });
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
    // Fetch all, then deduplicate — keep only the most recent request per tenant
    const all = await prisma.setupRequest.findMany({
      include: { tenant: true, user: true },
      orderBy: { created_at: 'desc' },
    });
    const seen = new Set<string>();
    const requests = all.filter((r: any) => {
      if (seen.has(r.tenant_id)) return false;
      seen.add(r.tenant_id);
      return true;
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
      data: { status: 'APPROVED', notes: notes || undefined },
    });

    // Start the worker via provisioner
    const pm2Name = setupRequest.tenant.worker_process?.pm2_name || `worker-${setupRequest.tenant.id.slice(0, 8)}`;
    const result = await startWorker(setupRequest.tenant.id, pm2Name, prisma);

    if (result.success) {
      logger.info({ requestId: req.params.id, tenantId: setupRequest.tenant_id }, 'Setup request approved and worker started');
    } else {
      logger.error({ requestId: req.params.id, error: result.error }, 'Worker failed to start after approval — admin can retry');
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

// ─── Customers / Leads (Mini CRM) ──────────────────────────────────────────

router.get('/customers', async (req: Request, res: Response) => {
  try {
    const tenantId = req.query.tenant as string | undefined;
    const status = req.query.status as string | undefined;

    const where: any = {};
    if (tenantId) where.tenant_id = tenantId;
    if (status) where.lead_status = status;

    const [customers, tenants, total, newCount, pendingCount, confirmedCount] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: { tenant: { include: { config: true } } },
        orderBy: { last_interaction: 'desc' },
        take: 300,
      }),
      prisma.tenant.findMany({ include: { config: true }, orderBy: { created_at: 'desc' } }),
      prisma.customer.count({ where: tenantId ? { tenant_id: tenantId } : {} }),
      prisma.customer.count({ where: { lead_status: 'NEW', ...(tenantId ? { tenant_id: tenantId } : {}) } }),
      prisma.customer.count({ where: { lead_status: 'PENDING', ...(tenantId ? { tenant_id: tenantId } : {}) } }),
      prisma.customer.count({ where: { lead_status: 'CONFIRMED', ...(tenantId ? { tenant_id: tenantId } : {}) } }),
    ]);

    res.render('customers', {
      customers,
      tenants,
      stats: { total, new: newCount, pending: pendingCount, confirmed: confirmedCount },
      selectedTenant: tenantId || '',
      selectedStatus: status || '',
    });
  } catch (error) {
    logger.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

router.get('/customers/export', async (req: Request, res: Response) => {
  try {
    const tenantId = req.query.tenant as string | undefined;
    const customers = await prisma.customer.findMany({
      where: tenantId ? { tenant_id: tenantId } : {},
      include: { tenant: { include: { config: true } } },
      orderBy: { created_at: 'desc' },
    });

    const rows = customers.map((c: any) => [
      `"${(c.name || '').replace(/"/g, '')}"`,
      `"${c.phone}"`,
      `"${c.request_type}"`,
      `"${c.lead_status}"`,
      `"${(c.tenant.config?.business_name || c.tenant.name).replace(/"/g, '')}"`,
      `"${c.created_at.toISOString().slice(0, 10)}"`,
      `"${c.last_interaction.toISOString().slice(0, 10)}"`,
    ].join(','));

    const csv = ['Name,Phone,Request Type,Lead Status,Business,Date Created,Last Interaction', ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=chatisha-leads.csv');
    res.send(csv);
  } catch (error) {
    logger.error('Error exporting customers:', error);
    res.status(500).json({ error: 'Failed to export' });
  }
});

router.get('/customers/:id', async (req: Request, res: Response) => {
  try {
    const customer = await (prisma.customer as any).findUnique({
      where: { id: req.params.id },
      include: { tenant: { include: { config: true } } },
    });
    if (!customer) return res.status(404).send('Customer not found');

    const messages = await prisma.conversationMessage.findMany({
      where: { tenant_id: customer.tenant_id, contact: customer.phone },
      orderBy: { created_at: 'asc' },
    });

    res.render('customer-detail', { customer, messages });
  } catch (error) {
    logger.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

router.post('/customers/:id/status', async (req: Request, res: Response) => {
  try {
    const { lead_status } = req.body;
    await (prisma.customer as any).update({
      where: { id: req.params.id },
      data: { lead_status },
    });
    res.redirect('/admin/customers/' + req.params.id);
  } catch (error) {
    logger.error('Error updating customer status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

export default router;
