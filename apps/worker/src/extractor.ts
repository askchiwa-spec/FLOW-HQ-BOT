import Anthropic from '@anthropic-ai/sdk';
import { PrismaClient } from '@chatisha/shared';
import { notifyAdmin } from './notify';

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
    'booking confirmed', 'appointment confirmed',
    'order received', 'order confirmed',      // ECOMMERCE EN confirmations
    'imepokelewa', 'asante kwa order',        // ECOMMERCE SW confirmations
    'tutakusubiri', 'asante kwa booking',
  ];
  const hasConfirmation = confirmationKeywords.some((kw) =>
    lastBotMessage.content.toLowerCase().includes(kw)
  );
  if (!hasConfirmation) return null;

  const conversationText = conversation
    .map((m) => `${m.role === 'user' ? 'Customer' : 'Bot'}: ${m.content}`)
    .join('\n');

  const tanzaniaDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Nairobi' }); // YYYY-MM-DD in EAT
  const prompt = isAppointment
    ? `Extract appointment details from this conversation. Return ONLY valid JSON, nothing else.

Conversation:
${conversationText}

IMPORTANT: All times are East Africa Time (EAT, UTC+3). Always include the +03:00 offset in the datetime string.

Return this exact JSON structure:
{
  "service": "service name or null",
  "appointment_at": "ISO datetime string WITH timezone like 2026-03-20T14:00:00+03:00 or null if not clear",
  "contact_name": "customer name or null",
  "confirmed": true or false
}

If the date is relative (e.g. "tomorrow", "kesho"), use today's date ${tanzaniaDate} as reference (East Africa Time).
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
  data: ExtractedAppointment,
  language: 'SW' | 'EN' = 'SW',
  templateType: string = ''
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

    const normalizedPhone = contactPhone.replace('@c.us', '').replace('@lid', '');

    // Sync extracted name to CRM if not already set
    if (data.contact_name) {
      await prisma.customer.updateMany({
        where: { tenant_id: tenantId, phone: normalizedPhone, name: null },
        data: { name: data.contact_name },
      }).catch(() => {});
    }

    // Update CRM lead_status to CONFIRMED — appointment is confirmed at booking time.
    // Exception: HOTEL always requires manual team confirmation.
    if (templateType !== 'HOTEL') {
      await prisma.customer.updateMany({
        where: { tenant_id: tenantId, phone: normalizedPhone, lead_status: { in: ['PENDING', 'NEW'] } },
        data: { lead_status: 'CONFIRMED' },
      }).catch(() => {});
    }

    // Notify business owner about the new booking
    const dateStr = data.appointment_at
      ? new Date(data.appointment_at).toLocaleString('en-GB', { timeZone: 'Africa/Nairobi' })
      : 'time TBD';
    await notifyAdmin(
      `New appointment booked by ${data.contact_name ?? normalizedPhone}.\nService: ${data.service ?? 'unknown'}\nDate: ${dateStr}\nPhone: ${normalizedPhone}`,
      'New Appointment Booked'
    ).catch(() => {});

    // Schedule reminders only if we have a datetime
    if (data.appointment_at) {
      const apptDate = new Date(data.appointment_at);
      const now = new Date();
      const timeStr = apptDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Nairobi' });
      const svc = data.service || 'appointment';
      const isHotel = templateType === 'HOTEL';

      const reminder24h = new Date(apptDate.getTime() - 24 * 60 * 60 * 1000);
      const reminder2h  = new Date(apptDate.getTime() -  2 * 60 * 60 * 1000);
      const reminder1h  = new Date(apptDate.getTime() -      60 * 60 * 1000);
      const missedCheck = new Date(apptDate.getTime() +      60 * 60 * 1000);

      const messages = [];

      if (reminder24h > now) {
        messages.push({
          tenant_id: tenantId, contact_phone: contactPhone,
          message: isHotel
            ? (language === 'EN'
                ? `Hi! Just a reminder — your room booking request for tomorrow is still pending confirmation. Please contact us if you haven't heard back. 😊`
                : `Habari! Ukumbusho — ombi lako la chumba kesho bado linasubiri uthibitisho. Wasiliana nasi kama hujapata jibu. 😊`)
            : (language === 'EN'
                ? `Hi! Just a reminder about your *${svc}* appointment tomorrow at ${timeStr}. We look forward to seeing you! 😊`
                : `Habari! Kukumbusha kuhusu miadi yako kesho: *${svc}* saa ${timeStr}. Tuko tayari kukupokea! 😊`),
          type: 'APPOINTMENT_REMINDER_24H' as const, send_at: reminder24h, appointment_id: appt.id,
        });
      }

      if (reminder2h > now) {
        messages.push({
          tenant_id: tenantId, contact_phone: contactPhone,
          message: isHotel
            ? (language === 'EN'
                ? `Hi! Your room booking request is still pending — please check with our reception if you need an update. 🙏`
                : `Habari! Ombi lako la chumba bado linasubiri — wasiliana na mapokezi yetu kama unahitaji habari. 🙏`)
            : (language === 'EN'
                ? `Hi! Your *${svc}* appointment is in 2 hours at ${timeStr}. See you soon! 🙏`
                : `Habari! Miadi yako ya *${svc}* iko karibu — saa ${timeStr}. Tutakusubiri! 🙏`),
          type: 'APPOINTMENT_REMINDER_2H' as const, send_at: reminder2h, appointment_id: appt.id,
        });
      } else if (reminder1h > now) {
        // Fallback for same-day bookings — schedule a 1-hour reminder instead
        messages.push({
          tenant_id: tenantId, contact_phone: contactPhone,
          message: isHotel
            ? (language === 'EN'
                ? `Hi! Your room booking request is still pending — please check with our reception if you need an update. 🙏`
                : `Habari! Ombi lako la chumba bado linasubiri — wasiliana na mapokezi yetu kama unahitaji habari. 🙏`)
            : (language === 'EN'
                ? `Hi! Just a reminder — your *${svc}* appointment is in 1 hour at ${timeStr}. See you soon! 🙏`
                : `Habari! Miadi yako ya *${svc}* iko karibu saa moja — saa ${timeStr}. Tutakusubiri! 🙏`),
          type: 'APPOINTMENT_REMINDER_2H' as const, send_at: reminder1h, appointment_id: appt.id,
        });
      }

      // Missed appointment check — 1 hour after appointment time
      if (missedCheck > now) {
        messages.push({
          tenant_id: tenantId, contact_phone: contactPhone,
          message: isHotel
            ? (language === 'EN'
                ? `Hi! Following up on your room booking request — has our team been in touch? We're happy to help. 🙏`
                : `Habari! Tunafuatilia ombi lako la chumba — timu yetu imekuwasiliana nawe? Tuko hapa kusaidia. 🙏`)
            : (language === 'EN'
                ? `Hi! We missed you today for your *${svc}* appointment. Would you like to reschedule? We'd love to see you. 🙏`
                : `Habari! Tulikukosa leo kwa miadi yako ya *${svc}*. Je, ungependa kuweka miadi mpya? Tafadhali tuambie. 🙏`),
          type: 'APPOINTMENT_MISSED' as const, send_at: missedCheck, appointment_id: appt.id,
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
  data: ExtractedOrder,
  language: 'SW' | 'EN' = 'SW'
): Promise<string | null> {
  try {
    // Deduplication: don't create another followup if one is already ACTIVE for this contact
    const existing = await (prisma as any).orderFollowup.findFirst({
      where: { tenant_id: tenantId, contact_phone: contactPhone, status: 'ACTIVE' },
      select: { id: true },
    });
    if (existing) return existing.id; // already tracking this order

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
          message: language === 'EN'
            ? `Hi! Your order has been received ✅\n\n${data.order_summary}\n\nPlease reply YES to confirm or NO to cancel. Questions? We're here to help. 😊`
            : `Habari! Order yako imepokelewa ✅\n\n${data.order_summary}\n\nTafadhali jibu YES kuthibitisha au NO kufuta. Una maswali? Tuko hapa kukusaidia. 😊`,
          type: 'ORDER_FOLLOWUP' as const,
          send_at: followup30min,
          followup_id: order.id,
        },
        {
          tenant_id: tenantId,
          contact_phone: contactPhone,
          message: language === 'EN'
            ? `Hi again! Checking on your order: *${data.order_summary}*. Is everything okay? Reply YES to confirm or NO to cancel.`
            : `Habari tena! Tunakagua order yako: *${data.order_summary}*. Je, iko sawa? Jibu YES kuthibitisha au NO kufuta.`,
          type: 'ORDER_FOLLOWUP' as const,
          send_at: followup3h,
          followup_id: order.id,
        },
        {
          tenant_id: tenantId,
          contact_phone: contactPhone,
          message: language === 'EN'
            ? `Hi! We're still waiting for your order confirmation. The order will be cancelled after 24 hours if there is no reply. Reply YES to confirm or NO to cancel.`
            : `Habari! Bado tunasubiri uthibitisho wa order yako. Order itafutwa baada ya saa 24 kama hakuna jibu. Jibu YES kuthibitisha au NO kufuta.`,
          type: 'ORDER_FOLLOWUP' as const,
          send_at: followup24h,
          followup_id: order.id,
        },
      ],
    });

    // Notify business owner about the new order
    const normalizedPhone = contactPhone.replace('@c.us', '').replace('@lid', '');
    await notifyAdmin(
      `New order from ${normalizedPhone}:\n${data.order_summary}`,
      'New Order Received'
    );

    return order.id;
  } catch {
    return null;
  }
}
