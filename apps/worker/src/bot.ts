import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import { PrismaClient, createLogger } from '@chatisha/shared';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { getAIResponse, AIConfig } from './ai';
import { RateLimiter } from './utils/rate-limiter';
import { ChatQueueManager } from './utils/chat-queue';
import { MessageDeduplicator } from './utils/dedup';
import { ReconnectManager } from './utils/reconnect';
import { MessagingAdapter } from './messaging/interface';
import { WwebjsAdapter } from './messaging/wwebjs';
import { logInbound, logOutbound } from './audit';
import { upsertCustomer } from './crm';

export class WhatsAppBot {
  private client: Client;
  private adapter: MessagingAdapter;
  private prisma: PrismaClient;
  private logger: ReturnType<typeof createLogger>;
  private tenantId: string;
  private config: AIConfig | null = null;
  private isReady: boolean = false;

  // Hardening components
  private rateLimiter: RateLimiter;
  private chatQueue: ChatQueueManager;
  private deduplicator: MessageDeduplicator;
  private reconnectManager: ReconnectManager;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private qrExpiryTimeout: NodeJS.Timeout | null = null;

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
        this.logger.error('Max reconnect attempts reached — PM2 will restart the process');
        // Exit so PM2 restarts with a clean state (exp_backoff_restart_delay prevents rapid loops)
        process.exit(1);
      },
      {
        initialDelayMs: 5000,   // 5s first retry
        maxDelayMs: 300000,     // cap at 5 min between retries
        maxAttempts: 50,        // ~4h of retrying before giving up and letting PM2 restart
        backoffMultiplier: 2,
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

    // Messaging adapter — swap this line to migrate to Cloud API
    this.adapter = new WwebjsAdapter(this.client);

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.client.on('qr', async (qr) => {
      this.logger.info('QR code received');

      // B2: Reset expiry timer — each new QR gets a fresh 65-second window
      if (this.qrExpiryTimeout) clearTimeout(this.qrExpiryTimeout);
      this.qrExpiryTimeout = setTimeout(async () => {
        if (!this.isReady) {
          this.logger.warn('QR code expired without being scanned');
          await this.prisma.workerProcess.update({
            where: { tenant_id: this.tenantId },
            data: { last_error: 'QR_EXPIRED: QR code was not scanned within 65 seconds. Restart the worker to get a new QR.' }
          }).catch(() => {});
        }
      }, 65000);

      try {
        const qrDataUrl = await QRCode.toDataURL(qr);

        await this.prisma.whatsAppSession.update({
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

      // B2: Cancel QR expiry timer — scan succeeded
      if (this.qrExpiryTimeout) { clearTimeout(this.qrExpiryTimeout); this.qrExpiryTimeout = null; }

      // Reset reconnect manager on successful connection
      this.reconnectManager.reset();

      try {
        await this.prisma.whatsAppSession.update({
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
            last_error: null   // B1: Clear any DISCONNECTED/BAN_SIGNAL alert on successful reconnect
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

      // Skip group messages — only respond to 1-on-1 chats
      if (msg.from.endsWith('@g.us')) return;

      // Skip broadcast/status messages (double guard: address suffix + isStatus flag)
      if (msg.from.endsWith('@broadcast')) return;
      if ((msg as any).isStatus) return;
      if (msg.from === 'status@broadcast') return;

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
            await this.adapter.sendMessage(msg.from, 'Tafadhali subiri... / Please wait...');
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
        await this.prisma.whatsAppSession.update({
          where: { tenant_id: this.tenantId },
          data: { state: 'DISCONNECTED' }
        });

        await this.prisma.tenant.update({
          where: { id: this.tenantId },
          data: { status: 'ERROR' }
        });

        // B1: Record disconnect reason so admin panel can show alert
        await this.prisma.workerProcess.update({
          where: { tenant_id: this.tenantId },
          data: { last_error: `DISCONNECTED: ${reason} — worker is attempting to reconnect` }
        }).catch(() => {});

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

      // B1: Prefix with BAN_SIGNAL so admin panel can surface a prominent alert
      await this.prisma.workerProcess.update({
        where: { tenant_id: this.tenantId },
        data: {
          status: 'ERROR',
          last_error: `BAN_SIGNAL: Auth failure — this number may be banned by WhatsApp. Details: ${msg}`
        }
      });
    });
  }

  private async loadConfig() {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: this.tenantId },
        include: { config: true },
      });

      if (tenant?.config) {
        this.config = {
          businessName: tenant.config.business_name,
          templateType: tenant.config.template_type,
          language: tenant.config.language as 'SW' | 'EN',
          businessContext: tenant.config.business_context ?? null,
          websiteUrl: tenant.config.website_url ?? null,
          hoursJson: (tenant.config.hours_json as Record<string, { open: string; close: string } | null> | null) ?? null,
        };
        this.logger.info({ templateType: this.config.templateType }, 'Config loaded');
      }
    } catch (error) {
      this.logger.error('Failed to load config:', error);
    }
  }

  // Exit keywords — customer wants to stop the bot conversation
  private readonly EXIT_KEYWORDS = [
    'stop', 'quit', 'exit', 'unsubscribe', 'end', 'cancel', 'bye', 'goodbye',
    'acha', 'simama', 'ondoa', 'imaliza', 'kwaheri', 'tutaonana',
    // Swahili thank-you / closure phrases
    'asante', 'asante sana', 'nakushukuru', 'nashukuri', 'baadaye', 'imetosha', 'nimemaliza',
  ];

  // Track contacts who have opted out this session (reset on restart)
  private optedOut = new Set<string>();

  // Track contacts waiting for human handoff (persisted in DB)
  private handoffContacts = new Set<string>();

  // Emergency keywords — bypass AI entirely for immediate life-safety response (healthcare template)
  private readonly EMERGENCY_KEYWORDS = [
    'emergency', 'dying', 'unconscious', 'accident', 'bleeding', 'fire', 'overdose',
    'dharura', 'nakufa', 'kupoteza fahamu', 'ajali', 'damu nyingi', 'moto', 'sumu',
  ];

  private async handleMessage(msg: Message) {
    try {
      this.logger.info(`Received message from ${msg.from}: ${msg.body}`);

      const body = (msg.body || '').trim();
      const lang = this.config?.language ?? 'SW';
      const bizName = this.config?.businessName ?? 'us';

      // --- Exit / stop ---
      if (this.EXIT_KEYWORDS.some((kw) => body.toLowerCase() === kw || body.toLowerCase().startsWith(kw + ' '))) {
        this.optedOut.add(msg.from);
        // C2: Persist opt-out so it survives worker restarts
        await this.prisma.conversationMessage.create({
          data: { tenant_id: this.tenantId, contact: msg.from, role: 'opt_out', content: 'OPT_OUT' }
        }).catch(() => {});
        const exitMsg = lang === 'SW'
          ? `Asante ${msg.from.split('@')[0]}! Umesimamisha mazungumzo na bot wa ${bizName}. Tuma ujumbe wowote kuendelea tena. 👋`
          : `Thanks! You have stopped the ${bizName} bot. Send any message to start again. 👋`;
        await this.adapter.sendMessage(msg.from, exitMsg);
        this.logger.info({ contact: msg.from }, 'Contact opted out — bot paused for this contact');
        return;
      }

      // C2 + C1: Single parallel DB round-trip — opt-out status + first-message check + handoff check
      const [priorMsgCount, optOutRecord, handoffRecord] = await Promise.all([
        this.prisma.conversationMessage.count({
          where: { tenant_id: this.tenantId, contact: msg.from, NOT: { role: { in: ['opt_out', 'handoff'] } } },
        }),
        this.prisma.conversationMessage.findFirst({
          where: { tenant_id: this.tenantId, contact: msg.from, role: 'opt_out' },
          select: { id: true },
        }),
        this.prisma.conversationMessage.findFirst({
          where: { tenant_id: this.tenantId, contact: msg.from, role: 'handoff' },
          select: { id: true },
        }),
      ]);

      // C2: Opted-out check (DB-backed, survives restarts)
      if (this.optedOut.has(msg.from) || optOutRecord) {
        this.optedOut.delete(msg.from);
        if (optOutRecord) {
          await this.prisma.conversationMessage.deleteMany({
            where: { tenant_id: this.tenantId, contact: msg.from, role: 'opt_out' },
          }).catch(() => {});
        }
        // fall through — treat as fresh start
      }

      // Handoff check — contact is waiting for a human, bot stays silent
      if (this.handoffContacts.has(msg.from) || handoffRecord) {
        this.handoffContacts.add(msg.from);
        const waitMsg = lang === 'SW'
          ? `Ombi lako limepokelewa. Mtaalamu wetu atakuwasiliana nawe hivi karibuni. 🙏`
          : `Your request has been received. Our team will reach out to you shortly. 🙏`;
        await this.adapter.sendMessage(msg.from, waitMsg);
        return;
      }

      // D1: Business hours check — reply "closed" and skip AI if outside configured hours
      if (this.config?.hoursJson) {
        const now = new Date();
        const dayKey = String(now.getDay()); // 0=Sun … 6=Sat
        const dayHours = this.config.hoursJson[dayKey] as { open: string; close: string } | null | undefined;
        const isClosed = !dayHours || (() => {
          const [openH, openM] = dayHours.open.split(':').map(Number);
          const [closeH, closeM] = dayHours.close.split(':').map(Number);
          const cur = now.getHours() * 60 + now.getMinutes();
          return cur < openH * 60 + openM || cur >= closeH * 60 + closeM;
        })();
        if (isClosed) {
          const hoursStr = dayHours ? `${dayHours.open}–${dayHours.close}` : '';
          const closedMsg = lang === 'SW'
            ? `Samahani, ${bizName} ${dayHours ? `imefungwa sasa. Tunafungua ${hoursStr}` : 'imefungwa leo'}. Tuma ujumbe tena wakati huo! 🙏`
            : `Sorry, ${bizName} is ${dayHours ? `currently closed. Today's hours are ${hoursStr}` : 'closed today'}. Send us a message during business hours! 🙏`;
          await this.adapter.sendMessage(msg.from, closedMsg);
          this.logger.info({ contact: msg.from }, 'Outside business hours — closed message sent');
          return;
        }
      }

      // C1: Trigger message: greet first-time contacts
      const isFirstMessage = priorMsgCount === 0;
      if (isFirstMessage) {
        const triggerMsg = lang === 'SW'
          ? `Habari! Karibu kwa *${bizName}* 🤝\nNiko hapa kukusaidia. Niambie unachohitaji!`
          : `Hello! Welcome to *${bizName}* 🤝\nI'm here to help. What can I do for you today?`;
        await this.adapter.sendMessage(msg.from, triggerMsg);
        // Small pause then continue so the AI also processes their first message
        await new Promise((r) => setTimeout(r, 800));
      }

      // Log incoming message
      await logInbound(this.prisma, this.tenantId, {
        from: msg.from,
        to: msg.to || 'me',
        body: msg.body || '',
        waMessageId: msg.id.id,
      });

      // Check rate limit before responding
      const rateLimitStatus = this.rateLimiter.checkLimit(this.tenantId);

      if (!rateLimitStatus.allowed) {
        if (!rateLimitStatus.warningSent) {
          this.logger.warn({ tenantId: this.tenantId }, 'Rate limit exceeded, sending warning');
          try {
            await this.adapter.sendMessage(msg.from, 'Tafadhali pole pole... / Please slow down...');
          } catch (replyError) {
            this.logger.error('Failed to send rate limit warning:', replyError);
          }
        } else {
          this.logger.warn({ tenantId: this.tenantId }, 'Rate limit exceeded, suppressing reply');
        }
        return;
      }

      // A3: Per-contact rate limit — silently suppress if one contact is hammering the bot
      if (!this.rateLimiter.checkContactLimit(msg.from).allowed) {
        this.logger.warn({ contact: msg.from }, 'Per-contact rate limit exceeded, suppressing reply');
        return;
      }

      // E1: Emergency pre-check — for healthcare, bypass AI entirely with immediate safety response
      if (this.config?.templateType === 'HEALTHCARE') {
        const lowerBody = body.toLowerCase();
        if (this.EMERGENCY_KEYWORDS.some((kw) => lowerBody.includes(kw))) {
          const emergencyMsg = lang === 'SW'
            ? `⚠️ DHARURA: Piga simu ya dharura SASA HIVI — 112 au 999. Usitegemee msaada wa mtandao katika hali ya hatari ya maisha! 🚨`
            : `⚠️ EMERGENCY: Call emergency services RIGHT NOW — 112 or 999. Do not wait for an online response in a life-threatening situation! 🚨`;
          await this.adapter.sendMessage(msg.from, emergencyMsg);
          this.logger.warn({ contact: msg.from }, 'EMERGENCY KEYWORD DETECTED — sent emergency response, skipping AI');
          return;
        }
      }

      // Get response using Claude AI
      if (!this.config) {
        await this.loadConfig();
      }

      // A2: Show typing indicator before AI call — user sees it during the full processing time
      await this.adapter.sendTypingIndicator(msg.from);

      let replyText: string;
      let handoff = false;

      if (this.config) {
        try {
          const result = await getAIResponse(
            this.tenantId,
            msg.from,
            msg.body || '',
            this.config,
            this.prisma
          );
          replyText = result.text;
          handoff = result.handoff;
        } catch (aiError) {
          this.logger.error('AI response failed, using fallback:', aiError);
          replyText = this.config.language === 'SW'
            ? `Karibu ${this.config.businessName}. Samahani, kuna tatizo la muda mfupi. Tafadhali jaribu tena baadaye.`
            : `Welcome to ${this.config.businessName}. Sorry, we are experiencing a brief issue. Please try again shortly.`;
        }
      } else {
        replyText = 'Thank you for your message. We will get back to you soon.';
      }

      // A1: Human-like delay — proportional to reply length (30ms/char, capped 800ms–2500ms)
      const typingDelayMs = Math.min(Math.max(replyText.length * 30, 800), 2500);
      await new Promise((r) => setTimeout(r, typingDelayMs));

      // Append Chatisha signature for organic growth
      const signedReply = replyText + '\n\n_Powered by Chatisha_';

      // Send reply via adapter — swap adapter to migrate to Cloud API
      const { messageId } = await this.adapter.sendMessage(msg.from, signedReply);

      // If handoff needed, persist state and stop bot from replying further
      if (handoff) {
        this.handoffContacts.add(msg.from);
        await this.prisma.conversationMessage.create({
          data: { tenant_id: this.tenantId, contact: msg.from, role: 'handoff', content: 'HANDOFF_REQUESTED' }
        }).catch(() => {});
        this.logger.warn({ contact: msg.from, tenantId: this.tenantId }, 'HUMAN HANDOFF REQUESTED — customer needs live support');
      }

      this.logger.info(`Sent reply to ${msg.from}: ${replyText.substring(0, 80)}`);

      // Log outgoing message
      await logOutbound(this.prisma, this.tenantId, {
        from: msg.to || 'me',
        to: msg.from,
        text: signedReply,
        messageId,
      });

      // Mini CRM: upsert customer record
      if (this.config) {
        await upsertCustomer(this.prisma, this.tenantId, msg.from, this.config.templateType, body, replyText);
      }

      // Update last seen
      await this.prisma.whatsAppSession.update({
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
        await this.prisma.whatsAppSession.update({
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
