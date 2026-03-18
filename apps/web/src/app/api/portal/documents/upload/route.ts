import { getPortalToken } from '@/lib/portal-auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const CONTROL_PLANE_URL = process.env.CONTROL_PLANE_URL || 'http://localhost:3100';
  const PORTAL_INTERNAL_KEY = process.env.PORTAL_INTERNAL_KEY || '';
  const token = await getPortalToken(req);
  if (!token?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenantId = token.tenantId as string | null;
  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

  const formData = await req.formData();
  const body = new FormData();
  for (const [key, value] of Array.from(formData.entries())) {
    body.append(key, value as any);
  }

  const res = await fetch(`${CONTROL_PLANE_URL}/portal/documents/upload`, {
    method: 'POST',
    headers: {
      'x-portal-key': PORTAL_INTERNAL_KEY,
      'x-tenant-id': tenantId,
    },
    body: body as any,
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
