import { getPortalToken } from '@/lib/portal-auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest) {
  const CONTROL_PLANE_URL = process.env.CONTROL_PLANE_URL || 'http://localhost:3100';
  const PORTAL_INTERNAL_KEY = process.env.PORTAL_INTERNAL_KEY || '';
  const token = await getPortalToken(request);
  if (!token?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  const res = await fetch(`${CONTROL_PLANE_URL}/portal/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-portal-key': PORTAL_INTERNAL_KEY,
      'x-user-email': token.email as string,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
