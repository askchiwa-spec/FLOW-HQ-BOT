import Anthropic from '@anthropic-ai/sdk';
import { PrismaClient } from '@chatisha/shared';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

function buildSystemPrompt(config: AIConfig): string {
  const langInstruction =
    config.language === 'SW'
      ? 'Always reply in Swahili. If the customer writes in English, reply in Swahili.'
      : 'Always reply in English. If the customer writes in Swahili, still reply in English.';

  const templateContextMap: Record<string, string> = {
    BOOKING: 'You help customers book appointments and services. Collect: service name, preferred date/time, and customer contact.',
    ECOMMERCE: 'You help customers browse products, get prices, place orders, and track deliveries.',
    SUPPORT: 'You provide customer support: troubleshoot issues, answer FAQs, and escalate serious complaints to a human agent.',
    REAL_ESTATE: 'You help customers find properties for sale or rent. Assist with property listings, pricing enquiries, and scheduling property viewings. Collect: property type, preferred location, and budget.',
    RESTAURANT: 'You help customers with menu information, placing food orders for delivery or takeaway, and reserving tables. Collect: order items or reservation date/time and number of guests.',
    HEALTHCARE: 'You help patients book medical appointments, answer general health service questions, and provide clinic information. For emergencies, always direct the patient to call immediately and trigger a human handoff. Never give medical advice — only help with scheduling and information.',
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
- Do not use markdown formatting (no bold, bullets, headers) — use plain text only.${websiteSection}${knowledgeSection}`;
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

  // Load recent conversation history
  const history = await prisma.conversationMessage.findMany({
    where: { tenant_id: tenantId, contact },
    orderBy: { created_at: 'asc' },
    take: HISTORY_LIMIT,
  });

  const messages: Anthropic.MessageParam[] = [
    ...history.map((h) => ({
      role: h.role as 'user' | 'assistant',
      content: h.content,
    })),
    { role: 'user', content: userMessage },
  ];

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    system: buildSystemPrompt(config),
    messages,
  });

  const rawText = response.content[0].type === 'text' ? response.content[0].text : '';
  const handoff = rawText.includes('[HUMAN_NEEDED]');
  const text = rawText.replace('[HUMAN_NEEDED]', '').trim();

  // Persist this exchange to conversation history
  await prisma.conversationMessage.createMany({
    data: [
      { tenant_id: tenantId, contact, role: 'user', content: userMessage },
      { tenant_id: tenantId, contact, role: 'assistant', content: text },
    ],
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

  return { text, handoff };
}
