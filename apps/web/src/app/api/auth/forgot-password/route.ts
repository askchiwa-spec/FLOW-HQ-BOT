import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    const clean = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: clean } });

    // Always return success to avoid user enumeration
    if (!user || !(user as any).password_hash) {
      return NextResponse.json({ ok: true });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password_reset_token: token,
        password_reset_expires: expires,
      } as any,
    });

    const baseUrl = process.env.NEXTAUTH_URL || 'https://app.chatisha.com';
    const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`;

    // Send via ntfy to admin notification channel
    const webhookUrl = process.env.ALERT_WEBHOOK_URL;
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'Title': 'Password Reset Request',
          'Priority': 'high',
          'Tags': 'key',
        },
        body: `Password reset for ${clean}\n\nReset link (expires in 1 hour):\n${resetUrl}`,
      }).catch((err) => console.error('Failed to send reset notification:', err));
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
