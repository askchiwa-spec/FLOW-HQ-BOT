import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request) {
  const CONTROL_PLANE_URL = process.env.CONTROL_PLANE_URL || 'http://localhost:3100';
  const PORTAL_INTERNAL_KEY = process.env.PORTAL_INTERNAL_KEY || '';
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  const res = await fetch(`${CONTROL_PLANE_URL}/portal/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-portal-key': PORTAL_INTERNAL_KEY,
      'x-user-email': session.user.email,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
