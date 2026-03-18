import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const CONTROL_PLANE_URL = process.env.CONTROL_PLANE_URL || 'http://localhost:3100';
  const PORTAL_INTERNAL_KEY = process.env.PORTAL_INTERNAL_KEY || '';
  const token = await getToken({ req });
  if (!token?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenantId = token.tenantId as string | null;
  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

  const { content, label } = await req.json();

  const res = await fetch(`${CONTROL_PLANE_URL}/portal/documents/text`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-portal-key': PORTAL_INTERNAL_KEY,
      'x-tenant-id': tenantId,
    },
    body: JSON.stringify({ content, label }),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
