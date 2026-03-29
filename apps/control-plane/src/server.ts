import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import * as Sentry from '@sentry/node';
import { notifyAdmin } from './notify';

dotenv.config();

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
  });
}
import { PrismaClient } from '@chatisha/shared';
import { logger } from '@chatisha/shared';
import { authMiddleware } from './middleware/auth';
import adminRoutes, { markStaleWorkers } from './routes/admin';
import portalRoutes from './routes/portal';
import documentRoutes from './routes/documents';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Trust Nginx reverse proxy (needed for express-rate-limit X-Forwarded-For)
app.set('trust proxy', 1);

// Security headers
app.use(helmet({ contentSecurityPolicy: false }));

// CORS — admin UI is browser-facing; portal routes are internal server-to-server only
const ADMIN_ORIGIN = process.env.ADMIN_ORIGIN || 'https://admin.chatisha.com';

app.use('/admin', cors({
  origin: ADMIN_ORIGIN,
  methods: ['GET', 'POST', 'DELETE', 'PATCH'],
  credentials: true,
}));

// Portal routes are called server-to-server only — block all browser origins
app.use('/portal', cors({
  origin: false,
}));

// Rate limiting
// Admin: 60 req/min per IP — protects against brute-force on ADMIN_PASSWORD
const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

// Portal: 120 req/min per IP — Next.js server calls these; the web layer enforces
// per-user limits on top, so this is a safety net against rogue/direct callers
const portalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

app.use('/admin', adminLimiter);
app.use('/portal', portalLimiter);

// Environment validation
function validateEnvironment(): void {
  const required = ['DATABASE_URL', 'ADMIN_PASSWORD', 'PORTAL_INTERNAL_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    logger.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
  
  // Validate database connection
  prisma.$connect()
    .then(() => logger.info('Database connection validated'))
    .catch((err: Error) => {
      logger.error('Database connection failed:', err);
      process.exit(1);
    });
  
  // Warn about Puppeteer in production
  if (process.env.NODE_ENV === 'production' && !process.env.PUPPETEER_EXECUTABLE_PATH) {
    logger.warn('PUPPETEER_EXECUTABLE_PATH not set in production. Worker may fail to start.');
    logger.warn('Install Chrome/Chromium and set PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome');
  }
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/health', async (_req, res) => {
  const start = Date.now();
  const checks: Record<string, { status: string; detail?: string }> = {};

  // 1. Database ping
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: 'ok' };
  } catch (err) {
    checks.database = { status: 'error', detail: (err as Error).message };
  }

  // 2. Worker summary
  try {
    const [total, running, error] = await Promise.all([
      prisma.workerProcess.count(),
      prisma.workerProcess.count({ where: { status: 'RUNNING' } }),
      prisma.workerProcess.count({ where: { status: 'ERROR' } }),
    ]);
    checks.workers = {
      status: error > 0 ? 'degraded' : 'ok',
      detail: `${running}/${total} running, ${error} in error`,
    };
  } catch (err) {
    checks.workers = { status: 'error', detail: (err as Error).message };
  }

  const allOk = Object.values(checks).every((c) => c.status === 'ok');
  const anyError = Object.values(checks).some((c) => c.status === 'error');

  const httpStatus = anyError ? 503 : 200;
  res.status(httpStatus).json({
    status: anyError ? 'error' : allOk ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    latencyMs: Date.now() - start,
    checks,
  });
});

// Logout — registered before authMiddleware so it always returns 401 (clears browser Basic Auth cache)
app.get('/admin/logout', (_req, res) => {
  res.set('WWW-Authenticate', 'Basic realm="Chatisha Admin"');
  res.status(401).send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Signed Out</title>
<style>body{font-family:sans-serif;background:#080d18;color:#e2e8f0;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}a{color:#10b981;text-decoration:none;font-weight:500}p{font-size:16px;margin-bottom:12px;color:#94a3b8}</style>
</head><body><div style="text-align:center"><p>You have been signed out.</p><a href="/admin/tenants">Sign in again &rarr;</a></div></body></html>`);
});

app.use('/admin', authMiddleware, adminRoutes);
app.use('/portal', portalRoutes);
app.use('/portal/documents', documentRoutes);

app.get('/', (req, res) => {
  res.redirect('/admin/tenants');
});

// Start stale worker checker
function startStaleWorkerChecker(): void {
  const intervalMs = parseInt(process.env.STALE_CHECK_INTERVAL_MS || '60000'); // 1 minute default

  logger.info(`Starting stale worker checker (${intervalMs}ms interval)`);

  setInterval(async () => {
    await markStaleWorkers();
  }, intervalMs);
}

/**
 * Daily billing cron — runs once per day.
 * - Auto-pauses tenants whose subscription has expired
 * - Logs PAYMENT_REMINDER events for tenants due within 5 days
 */
async function runBillingCron(): Promise<void> {
  try {
    const now = new Date();
    const in5Days = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

    // 1. Find overdue active tenants (end date passed, not already cancelled)
    const overdueTenants = await prisma.tenant.findMany({
      where: {
        subscription_status: 'ACTIVE',
        subscription_end_date: { lt: now },
        status: { not: 'PAUSED' },
      },
      include: { worker_process: true },
    });

    for (const tenant of overdueTenants) {
      logger.warn({ tenantId: tenant.id }, 'Subscription overdue — pausing tenant');

      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { status: 'PAUSED', subscription_status: 'PAST_DUE' },
      });

      if (tenant.worker_process?.status === 'RUNNING') {
        const { stopWorker } = await import('./provisioner');
        await stopWorker(tenant.id, tenant.worker_process.pm2_name, prisma);
      }

      await prisma.portalEventLog.create({
        data: {
          tenant_id: tenant.id,
          event_type: 'SUBSCRIPTION_PAUSED_OVERDUE',
          payload_json: { subscription_end_date: tenant.subscription_end_date },
        },
      });

      await notifyAdmin(
        `💳 Subscription paused (overdue): ${tenant.name}\nExpired: ${tenant.subscription_end_date?.toISOString().slice(0, 10)}\nPhone: ${tenant.phone_number}`,
        'Subscription Overdue'
      );
    }

    // 2. Find tenants due within 5 days (not yet reminded today)
    const dueSoonTenants = await prisma.tenant.findMany({
      where: {
        subscription_status: 'ACTIVE',
        subscription_end_date: { gte: now, lte: in5Days },
      },
    });

    for (const tenant of dueSoonTenants) {
      const daysLeft = Math.ceil((new Date(tenant.subscription_end_date!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      logger.info({ tenantId: tenant.id, daysLeft }, 'Payment reminder logged');

      await prisma.portalEventLog.create({
        data: {
          tenant_id: tenant.id,
          event_type: 'PAYMENT_REMINDER_DUE',
          payload_json: {
            days_left: daysLeft,
            subscription_end_date: tenant.subscription_end_date,
            phone_number: tenant.phone_number,
          },
        },
      });
    }

    if (overdueTenants.length > 0 || dueSoonTenants.length > 0) {
      logger.info(`Billing cron: ${overdueTenants.length} paused, ${dueSoonTenants.length} reminders logged`);
    }
  } catch (error) {
    logger.error('Billing cron error:', error);
  }
}

function startBillingCron(): void {
  // Run once at startup (in case server was down at midnight), then every 24h
  runBillingCron();
  setInterval(runBillingCron, 24 * 60 * 60 * 1000);
  logger.info('Billing cron started (daily)');
}

async function startServer() {
  try {
    validateEnvironment();
    await prisma.$connect();
    logger.info('Connected to database');
    
    // Start background tasks
    startStaleWorkerChecker();
    startBillingCron();
    
    app.listen(PORT, () => {
      logger.info(`Control plane running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
