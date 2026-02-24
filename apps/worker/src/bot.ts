import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import { PrismaClient, createLogger } from '@flowhq/shared';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { getResponse, TemplateConfig } from './templates';
import { RateLimiter } from './utils/rate-limiter';
import { ChatQueueManager } from './utils/chat-queue';
import { MessageDeduplicator } from './utils/dedup';
import { ReconnectManager } from './utils/reconnect';

export class WhatsAppBot {
  private client: Client;
  private prisma: PrismaClient;
  private logger: ReturnType<typeof createLogger>;
  private tenantId: string;
  private config: TemplateConfig | null = null;
  private isReady: boolean = false;
  
  // Hardening components
  private rateLimiter: RateLimiter;
  private chatQueue: ChatQueueManager;
  private deduplicator: MessageDeduplicator;
  private reconnectManager: ReconnectManager;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(tenantId: string, sessionsPath: string) {
    this.tenantId = tenantId;
    this.prisma = new PrismaClient();
    this.logger = createLogger(tenantId);
    
    // Initialize hardening components
    const maxRepliesPerMinute = parseInt(process.env.RATE_LIMIT_MAX_PER_MINUTE || '10');
    this.rateLimiter = new RateLimiter({ maxRequests: maxRepliesPerMinute, windowMs: 60000 });
    this.chatQueue = new ChatQueueManager(tenantId, 50);
    this.deduplicator = new MessageDeduplicator(1000, 300000);
    this.reconnectManager = new ReconnectManager(
      async () => {
        this.logger.info('Attempting to reconnect...');
        await this.client.initialize();
      },
      async () => {
        this.logger.error('Max reconnect attempts reached, marking as ERROR');
        await this.prisma.tenant.update({
          where: { id: this.tenantId },
          data: { status: 'ERROR' }
        });
        await this.prisma.workerProcess.update({
          where: { tenant_id: this.tenantId },
          data: {
            status: 'ERROR',
            last_error: 'Max reconnect attempts reached'
          }
        });
      }
    );

    const sessionPath = path.join(sessionsPath, tenantId);
    
    if (!fs.existsSync(sessionPath)) {
      fs.mkdirSync(sessionPath, { recursive: true });
    }

    this.client = new Client({
      authStrategy: new LocalAuth({
        dataPath: sessionPath
      }),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      }
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.client.on('qr', async (qr) => {
      this.logger.info('QR code received');
      
      try {
        const qrDataUrl = await QRCode.toDataURL(qr);
        
        await this.prisma.whatsappSession.update({
          where: { tenant_id: this.tenantId },
          data: {
            state: 'QR_READY',
            last_qr: qrDataUrl
          }
        });
        
        this.logger.info('QR code saved to database');
      } catch (error) {
        this.logger.error('Failed to process QR code:', error);
      }
    });

    this.client.on('ready', async () => {
      this.logger.info('WhatsApp client ready');
      this.isReady = true;
      
      // Reset reconnect manager on successful connection
      this.reconnectManager.reset();
      
      try {
        await this.prisma.whatsappSession.update({
          where: { tenant_id: this.tenantId },
          data: {
            state: 'CONNECTED',
            last_qr: null,
            last_seen_at: new Date()
          }
        });
        
        await this.prisma.tenant.update({
          where: { id: this.tenantId },
          data: { status: 'ACTIVE' }
        });
        
        await this.prisma.workerProcess.update({
          where: { tenant_id: this.tenantId },
          data: { 
            status: 'RUNNING',
            last_error: null
          }
        });
        
        // Update setup request to ACTIVE if it exists and is APPROVED
        const setupRequest = await this.prisma.setupRequest.findFirst({
          where: { 
            tenant_id: this.tenantId,
            status: 'APPROVED'
          }
        });
        
        if (setupRequest) {
          await this.prisma.setupRequest.update({
            where: { id: setupRequest.id },
            data: { status: 'ACTIVE' }
          });
          this.logger.info({ setupRequestId: setupRequest.id }, 'Setup request marked as ACTIVE');
        }
        
        await this.loadConfig();
        
        // Start heartbeat
        this.startHeartbeat();
      } catch (error) {
        this.logger.error('Failed to update status on ready:', error);
      }
    });

    this.client.on('message', async (msg) => {
      if (!this.isReady) return;
      
      // Skip messages from self
      if (msg.fromMe) return;
      
      // Check for duplicates
      if (this.deduplicator.isDuplicate(msg.id.id)) {
        this.logger.warn({ msgId: msg.id.id }, 'Duplicate message detected, skipping');
        return;
      }
      this.deduplicator.markSeen(msg.id.id);
      
      // Enqueue message for sequential processing per chat
      try {
        await this.chatQueue.enqueue(msg.from, async () => {
          await this.handleMessage(msg);
        });
      } catch (error) {
        if ((error as Error).message.includes('QUEUE_FULL')) {
          this.logger.warn({ chatId: msg.from }, 'Queue full, sending wait message');
          try {
            await msg.reply('Tafadhali subiri... / Please wait...');
          } catch (replyError) {
            this.logger.error('Failed to send wait message:', replyError);
          }
        } else {
          throw error;
        }
      }
    });

    this.client.on('disconnected', async (reason) => {
      this.logger.warn('WhatsApp client disconnected:', reason);
      this.isReady = false;
      
      // Stop heartbeat
      this.stopHeartbeat();
      
      try {
        await this.prisma.whatsappSession.update({
          where: { tenant_id: this.tenantId },
          data: { state: 'DISCONNECTED' }
        });
        
        await this.prisma.tenant.update({
          where: { id: this.tenantId },
          data: { status: 'ERROR' }
        });
        
        // Start reconnect process
        this.reconnectManager.start();
      } catch (error) {
        this.logger.error('Failed to update status on disconnect:', error);
      }
    });

    this.client.on('auth_failure', async (msg) => {
      this.logger.error('Auth failure:', msg);
      
      await this.prisma.tenant.update({
        where: { id: this.tenantId },
        data: { status: 'ERROR' }
      });
      
      await this.prisma.workerProcess.update({
        where: { tenant_id: this.tenantId },
        data: { 
          status: 'ERROR',
          last_error: `Auth failure: ${msg}`
        }
      });
    });
  }

  private async loadConfig() {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: this.tenantId },
        include: { config: true }
      });
      
      if (tenant?.config) {
        this.config = {
          template_type: tenant.config.template_type as 'BOOKING' | 'ECOMMERCE' | 'SUPPORT',
          business_name: tenant.config.business_name,
          language: tenant.config.language as 'SW' | 'EN'
        };
        this.logger.info('Config loaded:', this.config);
      }
    } catch (error) {
      this.logger.error('Failed to load config:', error);
    }
  }

  private async handleMessage(msg: Message) {
    try {
      this.logger.info(`Received message from ${msg.from}: ${msg.body}`);
      
      // Log incoming message
      await this.prisma.messageLog.create({
        data: {
          tenant_id: this.tenantId,
          direction: 'IN',
          from_number: msg.from,
          to_number: msg.to || 'me',
          message_text: msg.body || '',
          wa_message_id: msg.id.id
        }
      });

      // Check rate limit before responding
      const rateLimitStatus = this.rateLimiter.checkLimit(this.tenantId);
      
      if (!rateLimitStatus.allowed) {
        if (!rateLimitStatus.warningSent) {
          this.logger.warn({ tenantId: this.tenantId }, 'Rate limit exceeded, sending warning');
          try {
            await msg.reply('Tafadhali pole pole... / Please slow down...');
          } catch (replyError) {
            this.logger.error('Failed to send rate limit warning:', replyError);
          }
        } else {
          this.logger.warn({ tenantId: this.tenantId }, 'Rate limit exceeded, suppressing reply');
        }
        return;
      }

      // Get response based on template
      if (!this.config) {
        await this.loadConfig();
      }
      
      const replyText = this.config 
        ? getResponse(msg.body || '', this.config)
        : 'Thank you for your message. We will get back to you soon.';

      // Send reply
      const reply = await msg.reply(replyText);
      
      this.logger.info(`Sent reply to ${msg.from}: ${replyText}`);
      
      // Log outgoing message
      await this.prisma.messageLog.create({
        data: {
          tenant_id: this.tenantId,
          direction: 'OUT',
          from_number: msg.to || 'me',
          to_number: msg.from,
          message_text: replyText,
          wa_message_id: reply.id.id
        }
      });

      // Update last seen
      await this.prisma.whatsappSession.update({
        where: { tenant_id: this.tenantId },
        data: { last_seen_at: new Date() }
      });
      
    } catch (error) {
      // Global error boundary - never crash the worker
      this.logger.error('Error handling message:', error);
      
      // Log error to WorkerProcess
      try {
        await this.prisma.workerProcess.update({
          where: { tenant_id: this.tenantId },
          data: { 
            last_error: `Message handling error: ${error instanceof Error ? error.message : String(error)}`.substring(0, 1000)
          }
        });
      } catch (dbError) {
        this.logger.error('Failed to log error to database:', dbError);
      }
      
      // Continue processing other messages - don't throw
    }
  }

  private startHeartbeat(): void {
    const heartbeatIntervalMs = parseInt(process.env.HEARTBEAT_INTERVAL_MS || '30000');
    
    this.heartbeatInterval = setInterval(async () => {
      try {
        const now = new Date();
        
        // Update session last_seen_at
        await this.prisma.whatsappSession.update({
          where: { tenant_id: this.tenantId },
          data: { last_seen_at: now }
        });
        
        // Update worker status
        await this.prisma.workerProcess.update({
          where: { tenant_id: this.tenantId },
          data: { status: 'RUNNING' }
        });
        
        this.logger.debug('Heartbeat sent');
      } catch (error) {
        this.logger.error('Heartbeat failed:', error);
      }
    }, heartbeatIntervalMs);
    
    this.logger.info(`Heartbeat started (${heartbeatIntervalMs}ms interval)`);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      this.logger.info('Heartbeat stopped');
    }
  }

  async start() {
    this.logger.info('Starting WhatsApp bot...');
    
    try {
      await this.prisma.$connect();
      this.logger.info('Connected to database');
      
      await this.loadConfig();
      await this.client.initialize();
      
    } catch (error) {
      this.logger.error('Failed to start bot:', error);
      
      await this.prisma.workerProcess.update({
        where: { tenant_id: this.tenantId },
        data: { 
          status: 'ERROR',
          last_error: String(error)
        }
      });
      
      throw error;
    }
  }

  async stop() {
    this.logger.info('Stopping WhatsApp bot...');
    
    // Stop all components
    this.stopHeartbeat();
    this.reconnectManager.stop();
    this.chatQueue.clearAll();
    
    try {
      await this.client.destroy();
      await this.prisma.$disconnect();
      this.logger.info('Bot stopped successfully');
    } catch (error) {
      this.logger.error('Error stopping bot:', error);
    }
  }
}
