import { PrismaClient } from '@chatisha/shared';

const REQUEST_TYPE_MAP: Record<string, string> = {
  SALON: 'APPOINTMENT', BOOKING: 'APPOINTMENT', HEALTHCARE: 'APPOINTMENT',
  RESTAURANT: 'ORDER', ECOMMERCE: 'ORDER',
  HOTEL: 'ROOM_INQUIRY', REAL_ESTATE: 'SERVICE_INQUIRY', SUPPORT: 'GENERAL',
};

export async function upsertCustomer(
  prisma: PrismaClient,
  tenantId: string,
  phone: string,
  templateType: string,
  userMessage: string,
  botReply: string
): Promise<void> {
  try {
    // Normalize phone: strip WhatsApp suffixes so @c.us and @lid contacts don't create duplicates
    phone = phone.replace('@c.us', '').replace('@lid', '');
    const requestType = REQUEST_TYPE_MAP[templateType] ?? 'GENERAL';

    // Detect if the last bot message asked for the customer's name
    const lastBotMsg = await prisma.conversationMessage.findFirst({
      where: { tenant_id: tenantId, contact: phone, role: 'assistant' },
      orderBy: { created_at: 'desc' },
    });
    const askedForName = lastBotMsg && (
      lastBotMsg.content.toLowerCase().includes('share your name') ||
      lastBotMsg.content.toLowerCase().includes('your full name') ||
      lastBotMsg.content.toLowerCase().includes('jina lako') ||
      lastBotMsg.content.toLowerCase().includes('tupe jina')
    );
    const isLikelyName =
      userMessage.length > 1 && userMessage.length < 60 &&
      !/^\d+$/.test(userMessage) &&
      !userMessage.includes('@') &&
      !userMessage.includes('http');
    const nameToSave = askedForName && isLikelyName ? userMessage.trim() : undefined;

    // Infer lead status from bot reply keywords
    const replyLower = botReply.toLowerCase();
    let leadStatus: string | undefined;
    if (
      replyLower.includes('appointment is confirmed') ||
      replyLower.includes('booking is confirmed') ||
      replyLower.includes('imewekwa') ||
      replyLower.includes('imethibitishwa')
    ) {
      leadStatus = 'CONFIRMED';
    } else if (
      replyLower.includes('order has been received') ||
      replyLower.includes('request has been received') ||
      replyLower.includes('imepokelewa')
    ) {
      leadStatus = 'PENDING';
    }

    await (prisma as any).customer.upsert({
      where: { tenant_id_phone: { tenant_id: tenantId, phone } },
      create: {
        tenant_id: tenantId,
        phone,
        name: nameToSave,
        request_type: requestType,
        lead_status: leadStatus ?? 'NEW',
        last_interaction: new Date(),
      },
      update: {
        last_interaction: new Date(),
        ...(nameToSave ? { name: nameToSave } : {}),
        ...(leadStatus ? { lead_status: leadStatus } : {}),
      },
    });
  } catch (err) {
    // CRM failure must never crash message handling
    console.error('Failed to upsert customer:', err);
  }
}
