import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const CONTROL_PLANE_URL = process.env.CONTROL_PLANE_URL || 'http://localhost:3100';
  const PORTAL_INTERNAL_KEY = process.env.PORTAL_INTERNAL_KEY || '';
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = searchParams.get('limit');

  try {
    const url = new URL(`${CONTROL_PLANE_URL}/portal/tenant/current/logs`);
    if (limit) url.searchParams.set('limit', limit);

    const res = await fetch(url.toString(), {
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
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}
