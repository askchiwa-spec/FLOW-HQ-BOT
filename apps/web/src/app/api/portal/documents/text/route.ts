import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const CONTROL_PLANE_URL = process.env.CONTROL_PLANE_URL || 'http://localhost:3100';
const PORTAL_INTERNAL_KEY = process.env.PORTAL_INTERNAL_KEY || '';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { tenant_id: true },
  });
  const tenantId = user?.tenant_id;
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
