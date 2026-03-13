import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const CONTROL_PLANE_URL = process.env.CONTROL_PLANE_URL || 'http://localhost:3100';
const PORTAL_INTERNAL_KEY = process.env.PORTAL_INTERNAL_KEY || '';

async function getTenantId(email: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { tenant_id: true },
  });
  return user?.tenant_id ?? null;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = await getTenantId(session.user.email);
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
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = await getTenantId(session.user.email);
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
