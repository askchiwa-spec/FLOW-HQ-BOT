import { Router, Request, Response } from 'express';
import { PrismaClient, logger } from '@chatisha/shared';
import { startWorker } from '../provisioner';

const router = Router();
const prisma = new PrismaClient();

/**
 * Middleware to validate portal internal key
 */
function portalAuthMiddleware(req: Request, res: Response, next: Function) {
  const portalKey = req.headers['x-portal-key'];
  const PORTAL_INTERNAL_KEY = process.env.PORTAL_INTERNAL_KEY;

  if (!PORTAL_INTERNAL_KEY) {
    logger.error('PORTAL_INTERNAL_KEY not configured');
    return res.status(500).json({ error: 'Portal not configured' });
  }

  if (portalKey !== PORTAL_INTERNAL_KEY) {
    return res.status(401).json({ error: 'Invalid portal key' });
  }
  
  next();
}

/**
 * Get user by email from header
 */
async function getUserFromRequest(req: Request) {
  const email = req.headers['x-user-email'] as string;
  if (!email) return null;
  
  return prisma.user.findUnique({
    where: { email },
    include: {
      tenant: {
        include: {
          whatsapp_session: true,
          worker_process: true,
          config: true,
        },
      },
    },
  });
}

/**
 * GET /portal/me
 * Returns user, tenant, and latest setup request
 */
router.get('/me', portalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await getUserFromRequest(req);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const setupRequest = await prisma.setupRequest.findFirst({
      where: { user_id: user.id },
      orderBy: { created_at: 'desc' },
    });
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      tenant: user.tenant,
      setupRequest,
    });
  } catch (error) {
    logger.error('Error in /portal/me:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

/**
 * POST /portal/setup-request
 * Create a new setup request for the user
 */
router.post('/setup-request', portalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await getUserFromRequest(req);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!user.tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    const { businessName, templateType, whatsappNumber, language } = req.body;

    // Update tenant name and phone number
    await prisma.tenant.update({
      where: { id: user.tenant.id },
      data: { name: businessName, phone_number: whatsappNumber },
    });

    // Create or update tenant config
    await prisma.tenantConfig.upsert({
      where: { tenant_id: user.tenant.id },
      create: {
        tenant_id: user.tenant.id,
        template_type: templateType,
        business_name: businessName,
        language: language || 'SW',
      },
      update: {
        template_type: templateType,
        business_name: businessName,
        language: language || 'SW',
      },
    });

    // Upsert setup request with SUBMITTED status — admin must approve before worker starts
    const existing = await prisma.setupRequest.findFirst({
      where: { tenant_id: user.tenant.id },
      orderBy: { created_at: 'desc' },
    });

    const setupRequest = existing
      ? await prisma.setupRequest.update({
          where: { id: existing.id },
          data: { template_type: templateType, whatsapp_number: whatsappNumber, status: 'SUBMITTED' },
        })
      : await prisma.setupRequest.create({
          data: {
            tenant_id: user.tenant.id,
            user_id: user.id,
            template_type: templateType,
            whatsapp_number: whatsappNumber,
            status: 'SUBMITTED',
          },
        });

    // Log submission event
    await prisma.portalEventLog.create({
      data: {
        tenant_id: user.tenant.id,
        user_id: user.id,
        event_type: 'SETUP_REQUEST_SUBMITTED',
        payload_json: { templateType, language, businessName },
      },
    });

    logger.info({ tenantId: user.tenant.id }, 'Setup request submitted — awaiting admin approval');

    res.status(201).json({ ...setupRequest, workerStarted: false });
  } catch (error) {
    logger.error('Error creating setup request:', error);
    res.status(500).json({ error: 'Failed to create setup request' });
  }
});

/**
 * GET /portal/tenant/current/status
 * Get current tenant status
 */
router.get('/tenant/current/status', portalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await getUserFromRequest(req);
    
    if (!user?.tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    const setupRequest = await prisma.setupRequest.findFirst({
      where: { tenant_id: user.tenant.id },
      orderBy: { created_at: 'desc' },
    });
    
    res.json({
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        status: user.tenant.status,
        whatsapp_session: user.tenant.whatsapp_session,
        worker_process: user.tenant.worker_process,
      },
      setupRequest,
    });
  } catch (error) {
    logger.error('Error fetching tenant status:', error);
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

/**
 * GET /portal/tenant/current/qr
 * Get QR code for tenant
 */
router.get('/tenant/current/qr', portalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await getUserFromRequest(req);
    
    if (!user?.tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    const session = await prisma.whatsAppSession.findUnique({
      where: { tenant_id: user.tenant.id },
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json({
      state: session.state,
      qr: session.last_qr,
    });
  } catch (error) {
    logger.error('Error fetching QR:', error);
    res.status(500).json({ error: 'Failed to fetch QR' });
  }
});

/**
 * GET /portal/tenant/current/logs
 * Get message logs for tenant
 */
router.get('/tenant/current/logs', portalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await getUserFromRequest(req);
    
    if (!user?.tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    const limit = parseInt(req.query.limit as string) || 50;
    
    const logs = await prisma.messageLog.findMany({
      where: { tenant_id: user.tenant.id },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
    
    res.json(logs);
  } catch (error) {
    logger.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

/**
 * GET /portal/customers
 * Get customers (leads) for the authenticated tenant
 */
router.get('/customers', portalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await getUserFromRequest(req);

    if (!user?.tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const status = req.query.status as string | undefined;

    const customers = await prisma.customer.findMany({
      where: {
        tenant_id: user.tenant.id,
        ...(status ? { lead_status: status as any } : {}),
      },
      orderBy: { last_interaction: 'desc' },
    });

    const total = await prisma.customer.count({ where: { tenant_id: user.tenant.id } });
    const newLeads = await prisma.customer.count({ where: { tenant_id: user.tenant.id, lead_status: 'NEW' } });
    const pending = await prisma.customer.count({ where: { tenant_id: user.tenant.id, lead_status: 'PENDING' } });
    const confirmed = await prisma.customer.count({ where: { tenant_id: user.tenant.id, lead_status: 'CONFIRMED' } });

    res.json({ customers, stats: { total, new: newLeads, pending, confirmed } });
  } catch (error) {
    logger.error('Error fetching portal customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

/**
 * PATCH /portal/profile
 * Update tenant profile: business name, whatsapp number, language, template type
 */
router.patch('/profile', portalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await getUserFromRequest(req);

    if (!user?.tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const { businessName, whatsappNumber, language, templateType } = req.body;

    // Update tenant base fields
    const updatedTenant = await prisma.tenant.update({
      where: { id: user.tenant.id },
      data: {
        ...(businessName ? { name: businessName } : {}),
        ...(whatsappNumber ? { phone_number: whatsappNumber } : {}),
      },
    });

    // Update tenant config if language or templateType provided
    if (language || templateType || businessName) {
      await prisma.tenantConfig.upsert({
        where: { tenant_id: user.tenant.id },
        create: {
          tenant_id: user.tenant.id,
          business_name: businessName || updatedTenant.name,
          language: language || 'SW',
          template_type: templateType || 'SUPPORT',
        },
        update: {
          ...(businessName ? { business_name: businessName } : {}),
          ...(language ? { language } : {}),
          ...(templateType ? { template_type: templateType } : {}),
        },
      });
    }

    const config = await prisma.tenantConfig.findUnique({ where: { tenant_id: user.tenant.id } });

    res.json({
      tenant: updatedTenant,
      config,
    });
  } catch (error) {
    logger.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
