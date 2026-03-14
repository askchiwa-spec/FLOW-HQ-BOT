import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const CONTROL_PLANE_URL = process.env.CONTROL_PLANE_URL || 'http://localhost:3100';
const PORTAL_INTERNAL_KEY = process.env.PORTAL_INTERNAL_KEY || '';

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { newEmail } = await request.json();
  if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  const res = await fetch(`${CONTROL_PLANE_URL}/portal/email`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-portal-key': PORTAL_INTERNAL_KEY,
      'x-user-email': session.user.email,
    },
    body: JSON.stringify({ newEmail }),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
