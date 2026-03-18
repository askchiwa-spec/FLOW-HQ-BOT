import { getPortalToken } from '@/lib/portal-auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const CONTROL_PLANE_URL = process.env.CONTROL_PLANE_URL || 'http://localhost:3100';
const PORTAL_INTERNAL_KEY = process.env.PORTAL_INTERNAL_KEY || '';

export async function GET(request: NextRequest) {
  const token = await getPortalToken(request);
  if (!token?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenantId = token.tenantId as string | null;
  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

  const res = await fetch(`${CONTROL_PLANE_URL}/portal/documents`, {
    headers: {
      'x-portal-key': PORTAL_INTERNAL_KEY,
      'x-tenant-id': tenantId,
    },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(req: NextRequest) {
  const token = await getPortalToken(req);
  if (!token?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenantId = token.tenantId as string | null;
  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

  const { id } = await req.json();
  const res = await fetch(`${CONTROL_PLANE_URL}/portal/documents/${id}`, {
    method: 'DELETE',
    headers: {
      'x-portal-key': PORTAL_INTERNAL_KEY,
      'x-tenant-id': tenantId,
    },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
