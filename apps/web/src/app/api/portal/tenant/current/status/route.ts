import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const CONTROL_PLANE_URL = process.env.CONTROL_PLANE_URL || 'http://localhost:3100';
  const PORTAL_INTERNAL_KEY = process.env.PORTAL_INTERNAL_KEY || '';
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const res = await fetch(`${CONTROL_PLANE_URL}/portal/tenant/current/status`, {
      headers: {
        'x-portal-key': PORTAL_INTERNAL_KEY,
        'x-user-email': session.user.email,
      },
    });

    if (!res.ok) {
      const error = await res.json();
      return NextResponse.json(error, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error calling control plane:', error);
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
  }
}
