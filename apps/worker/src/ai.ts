import Anthropic from '@anthropic-ai/sdk';
import { PrismaClient } from '@chatisha/shared';
import https from 'https';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Templates that benefit from live exchange rates
const RATE_TEMPLATES = ['HOTEL', 'REAL_ESTATE', 'ECOMMERCE'];

// Cache exchange rates for 30 minutes
let rateCache: { rates: Record<string, number>; fetchedAt: number } | null = null;
const RATE_CACHE_TTL_MS = 30 * 60 * 1000;

let fetchInProgress = false;

async function fetchExchangeRates(): Promise<Record<string, number>> {
  // Use open.er-api.com — free, no API key required
  return new Promise((resolve) => {
    let settled = false;
    const done = (result: Record<string, number>) => {
      if (!settled) { settled = true; resolve(result); }
    };

    // Hard 5-second timeout — if the API hangs, resolve with empty rather than freezing
    const timer = setTimeout(() => done({}), 5000);

    const req = https.get('https://open.er-api.com/v6/latest/TZS', (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        clearTimeout(timer);
        try {
          const json = JSON.parse(data);
          if (json.result === 'success' && json.rates) {
            done(json.rates);
          } else {
            done({});
          }
        } catch {
          done({});
        }
      });
      res.on('error', () => { clearTimeout(timer); done({}); });
    });

    req.on('error', () => { clearTimeout(timer); done({}); });
    req.setTimeout(5000, () => { req.destroy(); done({}); });
  });
}

async function getExchangeRates(): Promise<string> {
  const now = Date.now();
  if (!rateCache || now - rateCache.fetchedAt > RATE_CACHE_TTL_MS) {
    const rates = await fetchExchangeRates();
    if (Object.keys(rates).length > 0) {
      rateCache = { rates, fetchedAt: now };
    }
  }
  if (!rateCache || Object.keys(rateCache.rates).length === 0) return '';

  const r = rateCache.rates;
  // rates are TZS per 1 foreign currency unit — er-api gives rates FROM TZS
  // so r.USD = how much USD per 1 TZS, invert to get TZS per 1 USD
  const usdRate = r['USD'] ? Math.round(1 / r['USD']) : null;
  const eurRate = r['EUR'] ? Math.round(1 / r['EUR']) : null;
  const gbpRate = r['GBP'] ? Math.round(1 / r['GBP']) : null;
  const kenRate = r['KES'] ? Math.round(1 / r['KES']) : null;

  const parts = [];
  if (usdRate) parts.push(`1 USD = ${usdRate.toLocaleString()} TZS`);
  if (eurRate) parts.push(`1 EUR = ${eurRate.toLocaleString()} TZS`);
  if (gbpRate) parts.push(`1 GBP = ${gbpRate.toLocaleString()} TZS`);
  if (kenRate) parts.push(`1 KES = ${kenRate.toLocaleString()} TZS`);

  if (parts.length === 0) return '';
  return `\n\n=== LIVE EXCHANGE RATES (updated today) ===\n${parts.join(', ')}\nWhen customers ask prices in USD, EUR, GBP or KES, convert from TZS using these rates and show both amounts.\n=== END RATES ===`;
}

// How many past messages to include as conversation history
const HISTORY_LIMIT = 10;

// Trigger phrases that should hand off to a human
const HANDOFF_TRIGGERS = [
  'human', 'agent', 'person', 'representative', 'staff',
  'binadamu', 'mtu', 'msaada wa mtu', 'niongee na mtu',
  'manager', 'supervisor', 'owner',
];

export function needsHumanHandoff(message: string): boolean {
  const lower = message.toLowerCase();
  return HANDOFF_TRIGGERS.some((t) => lower.includes(t));
}

export interface AIConfig {
  businessName: string;
  templateType: string;
  language: 'SW' | 'EN';
  businessContext: string | null;
  websiteUrl: string | null;
  // D1: Business hours — keys 0–6 (Sun–Sat), null means closed that day
  hoursJson: Record<string, { open: string; close: string } | null> | null;
}

function buildSystemPrompt(config: AIConfig, exchangeRates = ''): string {
  const langInstruction =
    config.language === 'SW'
      ? 'Always reply in Swahili. If the customer writes in English, reply in Swahili.'
      : 'Always reply in English. If the customer writes in Swahili, still reply in English.';

  const templateContextMap: Record<string, string> = {
    SALON: `You are a booking assistant for a salon, barbershop, spa, or beauty business.
Your main goal: help customers book appointments quickly without back-and-forth.

When a customer first messages, greet them and offer these options:
1. Book appointment
2. View services
3. Prices
4. Location
5. Talk to team

Booking flow (guide them step by step, one question at a time):
Step 1 - Ask which service: Hair, Nails, Facial, Massage, Barber, or Other.
Step 2 - Ask preferred date: Today, Tomorrow, or another day.
Step 3 - Offer time slots (e.g. 10:00 AM, 1:00 PM, 4:00 PM) or ask their preferred time.
  - If they ask for a suggestion or say they are free after work, recommend 4:00 PM as the best after-work slot.
  - If they say morning, suggest 10:00 AM. If afternoon, suggest 1:00 PM.
  - Be decisive — pick one time and suggest it clearly, don't just list options again.
Step 4 - Ask for their name.
Step 5 - Ask for their phone number.
Step 6 - Confirm the booking with: Service, Date, Time, and Location.

After confirming, let them know they will receive a reminder.
Always collect: service name, date, time, name, and phone number before confirming.`,

    RESTAURANT: `You are an order assistant for a restaurant, café, food shop, or catering business.
Your main goal: help customers view the menu and place orders smoothly.

When a customer first messages, greet them and offer:
1. View menu
2. Place order
3. Opening hours
4. Location
5. Talk to team

Menu flow: Show categories (Meals, Drinks, Snacks, Today's specials). Let them choose items and quantity.

Order flow (step by step):
Step 1 - Ask: Pickup or Delivery?
If Pickup: Confirm order, give total and pickup time (e.g. 25 minutes), share pickup location.
If Delivery: Ask for name, phone number, and delivery location. Then confirm the order was received and team will contact them.

Pickup ready message: "Your order is ready. Thank you for ordering from [Business Name]."
Always collect the full order before asking pickup or delivery.`,

    HOTEL: `You are a booking assistant for a hotel, lodge, guesthouse, or serviced apartment.
Your main goal: handle room inquiries and booking requests clearly.

When a customer first messages, greet them and offer:
1. Check rooms
2. Booking request
3. Prices
4. Location
5. Talk to reception

Room inquiry flow (step by step):
Step 1 - Show room types (e.g. Standard Room, Deluxe Room, Family Room).
Step 2 - Ask check-in date.
Step 3 - Ask check-out date.
Step 4 - Ask number of guests.
Step 5 - Ask for full name and phone number.
Step 6 - Confirm: "Your booking request has been received. Our reception team will confirm availability shortly."

Location info: Share hotel address and nearby landmarks when asked.
Do NOT confirm a booking as 100% reserved — always say the team will confirm. Human handoff is required for final confirmation.`,

    HEALTHCARE: `You are an appointment assistant for a clinic, hospital, pharmacy, dentist, or healthcare provider.
Your main goal: reduce phone calls by organizing appointments. NEVER give medical advice.

When a patient first messages, greet them and offer:
1. Book appointment
2. Clinic services
3. Opening hours
4. Location
5. Speak to receptionist

Appointment booking flow (step by step):
Step 1 - Ask what service they need: General consultation, Dental care, Lab test, Pharmacy, or Other.
Step 2 - Ask preferred date: Today, Tomorrow, or another day.
Step 3 - Offer available time slots (e.g. 9:00 AM, 11:00 AM, 2:00 PM, 4:00 PM).
Step 4 - Ask for full name.
Step 5 - Ask for phone number.
Step 6 - Confirm with: Clinic name, Service, Date, Time. Add "Please arrive 15 minutes early."

For emergencies: immediately direct them to call emergency services and trigger human handoff with [HUMAN_NEEDED].
For medicine/prescription questions: do not advise — direct them to book an appointment with a doctor.`,

    ECOMMERCE: `You are a shop assistant for a retail store, phone shop, clothing store, or online seller.
Your main goal: help customers browse products and place orders easily.

When a customer first messages, greet them and offer:
1. View products
2. Place order
3. Delivery information
4. Store location
5. Speak to seller

Product flow: Show categories based on the business knowledge base. When they choose a category, list available items with prices. Let them select an item and quantity.

Order flow (step by step):
Step 1 - Ask: Pickup or Delivery?
Step 2 - Collect customer details:
  If Delivery: Ask for full name, phone number, and delivery address.
  If Pickup: Ask for full name and phone number.
Step 3 - Ask for preferred payment method: M-Pesa, Cash on Delivery, or Bank Transfer.
Step 4 - Summarise the order: list items, quantities, total price, delivery method, and payment method.
Step 5 - Ask: "Confirm order? Reply YES to confirm or NO to cancel."
Step 6 - When customer confirms, reply with exactly: "Order received! Our team will contact you shortly to arrange payment and delivery. Thank you for ordering from [Business Name]! 🙏"
  If Pickup, reply: "Order received! Please visit our store within 24 hours. Thank you! 🙏"

Always collect: product + quantity + customer name + phone + delivery method + payment method before confirming.
Never confirm an order without a clear YES from the customer.`,

    SUPPORT: 'You provide customer support: troubleshoot issues, answer FAQs, and escalate serious complaints to a human agent. When a customer first messages, greet them and ask how you can help. If you cannot resolve their issue, offer to connect them with a human agent.',
    BOOKING: 'You help customers book appointments and services. Collect: service name, preferred date/time, name, and phone number. Confirm the booking details at the end.',
    REAL_ESTATE: 'You help customers find properties for sale or rent. When they first message, greet them and offer: Listings, Prices, Book a viewing, Contact. Collect: property type, preferred location, and budget. For viewings, collect name, phone, and preferred date.',
  };
  const templateContext = templateContextMap[config.templateType] ?? templateContextMap['SUPPORT'];

  const knowledgeSection = config.businessContext
    ? `\n\n=== BUSINESS KNOWLEDGE BASE ===\n${config.businessContext.slice(0, 12000)}\n=== END OF KNOWLEDGE BASE ===`
    : '';

  const websiteSection = config.websiteUrl
    ? `\nBusiness website: ${config.websiteUrl}`
    : '';

  return `You are a helpful WhatsApp customer service assistant for ${config.businessName}.

${templateContext}
${langInstruction}

IMPORTANT RULES:
- Keep replies SHORT and conversational — this is WhatsApp, not email.
- Never make up prices, services, or information not in the knowledge base.
- If you don't know something, say so honestly and offer to connect the customer with a human.
- If a customer asks for a human agent or you truly cannot help, end your reply with exactly: [HUMAN_NEEDED]
- Do not use markdown formatting (no bold, bullets, headers) — use plain text only.${websiteSection}${knowledgeSection}${exchangeRates}`;
}

export async function getAIResponse(
  tenantId: string,
  contact: string,
  userMessage: string,
  config: AIConfig,
  prisma: PrismaClient
): Promise<{ text: string; handoff: boolean }> {
  // Check if the user themselves is explicitly asking for a human
  if (needsHumanHandoff(userMessage)) {
    const handoffMsg =
      config.language === 'SW'
        ? `Sawa, naelewa unataka kuzungumza na mtu. Nitamwasilisha na timu yetu mara moja. Tafadhali subiri kidogo. 🙏`
        : `Of course! I'll connect you with one of our team members right away. Please hold on for a moment. 🙏`;
    return { text: handoffMsg, handoff: true };
  }

  // Load recent conversation history — only user/assistant roles (Anthropic rejects opt_out, handoff, etc.)
  // Fetch newest HISTORY_LIMIT messages (desc), then reverse to chronological order for the API
  const historyRaw = await prisma.conversationMessage.findMany({
    where: { tenant_id: tenantId, contact, role: { in: ['user', 'assistant'] } },
    orderBy: { created_at: 'desc' },
    take: HISTORY_LIMIT,
  });
  const history = historyRaw.reverse();

  // Ensure messages alternate user→assistant, start with user, and have non-empty content.
  // Empty content comes from voice notes / images / stickers stored as "" in the DB —
  // Anthropic rejects any message where content is empty (400 invalid_request_error).
  const normalized: Anthropic.MessageParam[] = [];
  for (const h of history) {
    if (!h.content.trim()) continue; // skip empty-content messages (media/sticker ghosts)
    const role = h.role as 'user' | 'assistant';
    if (normalized.length === 0 && role !== 'user') continue; // must start with user
    if (normalized.length > 0 && normalized[normalized.length - 1].role === role) continue; // no consecutive same role
    normalized.push({ role, content: h.content });
  }

  const messages: Anthropic.MessageParam[] = [
    ...normalized,
    { role: 'user', content: userMessage },
  ];

  // Inject live exchange rates for price-sensitive templates
  const exchangeRates = RATE_TEMPLATES.includes(config.templateType)
    ? await getExchangeRates()
    : '';

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    system: buildSystemPrompt(config, exchangeRates),
    messages,
  });

  const rawText = response.content[0].type === 'text' ? response.content[0].text : '';
  const handoff = rawText.includes('[HUMAN_NEEDED]');
  const text = rawText.replace('[HUMAN_NEEDED]', '').trim();

  // Persist this exchange to conversation history (only non-empty content)
  const messagesToStore = [
    userMessage.trim() ? { tenant_id: tenantId, contact, role: 'user', content: userMessage } : null,
    text.trim() ? { tenant_id: tenantId, contact, role: 'assistant', content: text } : null,
  ].filter(Boolean) as { tenant_id: string; contact: string; role: string; content: string }[];

  if (messagesToStore.length > 0) {
    await prisma.conversationMessage.createMany({
      data: messagesToStore,
    });

    // Trim old history to keep last 20 messages per contact (avoid unbounded growth)
    const allMsgs = await prisma.conversationMessage.findMany({
      where: { tenant_id: tenantId, contact },
      orderBy: { created_at: 'asc' },
      select: { id: true },
    });
    if (allMsgs.length > 20) {
      const toDelete = allMsgs.slice(0, allMsgs.length - 20).map((m) => m.id);
      await prisma.conversationMessage.deleteMany({ where: { id: { in: toDelete } } });
    }
  }

  return { text, handoff };
}
