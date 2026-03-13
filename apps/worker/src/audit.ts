import { PrismaClient } from '@chatisha/shared';

export async function logInbound(
  prisma: PrismaClient,
  tenantId: string,
  params: { from: string; to: string; body: string; waMessageId: string }
): Promise<void> {
  await prisma.messageLog.create({
    data: {
      tenant_id: tenantId,
      direction: 'IN',
      from_number: params.from,
      to_number: params.to || 'me',
      message_text: params.body,
      wa_message_id: params.waMessageId,
    },
  });
}

export async function logOutbound(
  prisma: PrismaClient,
  tenantId: string,
  params: { from: string; to: string; text: string; messageId: string }
): Promise<void> {
  await prisma.messageLog.create({
    data: {
      tenant_id: tenantId,
      direction: 'OUT',
      from_number: params.from,
      to_number: params.to,
      message_text: params.text,
      wa_message_id: params.messageId,
    },
  });
}
