import { getPortalToken } from '@/lib/portal-auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const CONTROL_PLANE_URL = process.env.CONTROL_PLANE_URL || 'http://localhost:3100';
  const PORTAL_INTERNAL_KEY = process.env.PORTAL_INTERNAL_KEY || '';
  const token = await getPortalToken(request);

  if (!token?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (checkRateLimit(token.email, 'orders', 30, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  try {
    const url = new URL(`${CONTROL_PLANE_URL}/portal/orders`);
    if (status) url.searchParams.set('status', status);
    if (from) url.searchParams.set('from', from);
    if (to) url.searchParams.set('to', to);

    const res = await fetch(url.toString(), {
      headers: {
        'x-portal-key': PORTAL_INTERNAL_KEY,
        'x-user-email': token.email as string,
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
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
