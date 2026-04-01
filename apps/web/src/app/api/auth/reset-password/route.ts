import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@chatisha/shared';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Invalid reset token' }, { status: 400 });
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const user = await (prisma as any).user.findUnique({
      where: { password_reset_token: token },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 });
    }

    if (!user.password_reset_expires || new Date(user.password_reset_expires) < new Date()) {
      return NextResponse.json({ error: 'Reset link has expired. Please request a new one.' }, { status: 400 });
    }

    const hash = await bcrypt.hash(password, 12);

    await (prisma as any).user.update({
      where: { id: user.id },
      data: {
        password_hash: hash,
        password_reset_token: null,
        password_reset_expires: null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
