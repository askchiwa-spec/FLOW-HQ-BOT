import Anthropic from '@anthropic-ai/sdk';
import { PrismaClient } from '@chatisha/shared';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface ExtractedAppointment {
  service: string | null;
  appointment_at: string | null; // ISO string or null
  contact_name: string | null;
  confirmed: boolean;
}

interface ExtractedOrder {
  order_summary: string;
  confirmed: boolean;
}

// Templates that generate appointments
const APPOINTMENT_TEMPLATES = ['BOOKING', 'SALON', 'HEALTHCARE', 'HOTEL', 'REAL_ESTATE'];
// Templates that generate orders
const ORDER_TEMPLATES = ['RESTAURANT', 'ECOMMERCE'];

export async function extractBookingDetails(
  conversation: { role: string; content: string }[],
  templateType: string
): Promise<ExtractedAppointment | ExtractedOrder | null> {
  // Only run extraction for relevant templates
  const isAppointment = APPOINTMENT_TEMPLATES.includes(templateType);
  const isOrder = ORDER_TEMPLATES.includes(templateType);
  if (!isAppointment && !isOrder) return null;

  // Only extract if the last bot message looks like a confirmation
  const lastBotMessage = [...conversation].reverse().find((m) => m.role === 'assistant');
  if (!lastBotMessage) return null;

  const confirmationKeywords = [
    'confirmed', 'booked', 'imewekwa', 'imethibitishwa', 'nimeweka',
    'booking confirmed', 'appointment confirmed', 'order received', 'imepokelewa',
    'tutakusubiri', 'asante kwa booking', 'asante kwa order',
  ];
  const hasConfirmation = confirmationKeywords.some((kw) =>
    lastBotMessage.content.toLowerCase().includes(kw)
  );
  if (!hasConfirmation) return null;

  const conversationText = conversation
    .map((m) => `${m.role === 'user' ? 'Customer' : 'Bot'}: ${m.content}`)
    .join('\n');

  const prompt = isAppointment
    ? `Extract appointment details from this conversation. Return ONLY valid JSON, nothing else.

Conversation:
${conversationText}

Return this exact JSON structure:
{
  "service": "service name or null",
  "appointment_at": "ISO datetime string like 2026-03-20T14:00:00 or null if not clear",
  "contact_name": "customer name or null",
  "confirmed": true or false
}

If the date is relative (e.g. "tomorrow", "kesho"), use today's date ${new Date().toISOString().split('T')[0]} as reference.
If no appointment was confirmed, return {"confirmed": false, "service": null, "appointment_at": null, "contact_name": null}.`
    : `Extract order details from this conversation. Return ONLY valid JSON, nothing else.

Conversation:
${conversationText}

Return this exact JSON structure:
{
  "order_summary": "brief summary of what was ordered",
  "confirmed": true or false
}

If no order was confirmed, return {"confirmed": false, "order_summary": ""}.`;

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
    // Strip markdown code blocks if present
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (!parsed.confirmed) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveAppointment(
  prisma: PrismaClient,
  tenantId: string,
  contactPhone: string,
  data: ExtractedAppointment
): Promise<string | null> {
  try {
    const appt = await (prisma as any).appointment.create({
      data: {
        tenant_id: tenantId,
        contact_phone: contactPhone,
        contact_name: data.contact_name,
        service: data.service,
        appointment_at: data.appointment_at ? new Date(data.appointment_at) : null,
        raw_text: JSON.stringify(data),
      },
    });

    // Schedule reminders only if we have a datetime
    if (data.appointment_at) {
      const apptDate = new Date(data.appointment_at);
      const now = new Date();

      const reminder24h = new Date(apptDate.getTime() - 24 * 60 * 60 * 1000);
      const reminder2h = new Date(apptDate.getTime() - 2 * 60 * 60 * 1000);

      const messages = [];

      if (reminder24h > now) {
        messages.push({
          tenant_id: tenantId,
          contact_phone: contactPhone,
          message: `Habari! Kukumbusha kuhusu miadi yako kesho: *${data.service || 'appointment'}* saa ${apptDate.toLocaleTimeString('sw-TZ', { hour: '2-digit', minute: '2-digit' })}. Tuko tayari kukupokea! 😊`,
          type: 'APPOINTMENT_REMINDER_24H' as const,
          send_at: reminder24h,
          appointment_id: appt.id,
        });
      }

      if (reminder2h > now) {
        messages.push({
          tenant_id: tenantId,
          contact_phone: contactPhone,
          message: `Habari! Miadi yako leo *${data.service || 'appointment'}* iko karibu — saa ${apptDate.toLocaleTimeString('sw-TZ', { hour: '2-digit', minute: '2-digit' })}. Tutakusubiri! 🙏`,
          type: 'APPOINTMENT_REMINDER_2H' as const,
          send_at: reminder2h,
          appointment_id: appt.id,
        });
      }

      // Missed appointment check — 1 hour after appointment time
      const missedCheck = new Date(apptDate.getTime() + 60 * 60 * 1000);
      if (missedCheck > now) {
        messages.push({
          tenant_id: tenantId,
          contact_phone: contactPhone,
          message: `Habari! Tulikukosa leo kwa miadi yako ya *${data.service || 'appointment'}*. Je, ungependa kuweka miadi mpya? Tafadhali tuambie. 🙏`,
          type: 'APPOINTMENT_MISSED' as const,
          send_at: missedCheck,
          appointment_id: appt.id,
        });
      }

      if (messages.length > 0) {
        await (prisma as any).scheduledMessage.createMany({ data: messages });
      }
    }

    return appt.id;
  } catch {
    return null;
  }
}

export async function saveOrderFollowup(
  prisma: PrismaClient,
  tenantId: string,
  contactPhone: string,
  data: ExtractedOrder
): Promise<string | null> {
  try {
    const now = new Date();
    const followup30min = new Date(now.getTime() + 30 * 60 * 1000);
    const followup3h = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    const followup24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const order = await (prisma as any).orderFollowup.create({
      data: {
        tenant_id: tenantId,
        contact_phone: contactPhone,
        order_summary: data.order_summary,
        next_followup_at: followup30min,
      },
    });

    await (prisma as any).scheduledMessage.createMany({
      data: [
        {
          tenant_id: tenantId,
          contact_phone: contactPhone,
          message: `Habari! Order yako imepokelewa. Je, una maswali yoyote? Tuko hapa kukusaidia. 😊`,
          type: 'ORDER_FOLLOWUP' as const,
          send_at: followup30min,
          followup_id: order.id,
        },
        {
          tenant_id: tenantId,
          contact_phone: contactPhone,
          message: `Habari tena! Tunakagua order yako: *${data.order_summary}*. Je, iko sawa? Jibu YES kuthibitisha au NO kufuta.`,
          type: 'ORDER_FOLLOWUP' as const,
          send_at: followup3h,
          followup_id: order.id,
        },
        {
          tenant_id: tenantId,
          contact_phone: contactPhone,
          message: `Habari! Bado tunasubiri uthibitisho wa order yako. Order itafutwa baada ya saa 24 kama hakuna jibu. Jibu YES kuthibitisha au NO kufuta.`,
          type: 'ORDER_FOLLOWUP' as const,
          send_at: followup24h,
          followup_id: order.id,
        },
      ],
    });

    return order.id;
  } catch {
    return null;
  }
}
