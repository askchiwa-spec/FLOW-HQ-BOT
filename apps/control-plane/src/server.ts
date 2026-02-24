import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { PrismaClient } from '@flowhq/shared';
import { logger } from '@flowhq/shared';
import { authMiddleware } from './middleware/auth';
import adminRoutes, { markStaleWorkers } from './routes/admin';
import portalRoutes from './routes/portal';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

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

app.use('/admin', authMiddleware, adminRoutes);
app.use('/portal', portalRoutes);

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

async function startServer() {
  try {
    validateEnvironment();
    await prisma.$connect();
    logger.info('Connected to database');
    
    // Start background tasks
    startStaleWorkerChecker();
    
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
