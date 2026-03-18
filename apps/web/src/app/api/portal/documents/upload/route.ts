import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const CONTROL_PLANE_URL = process.env.CONTROL_PLANE_URL || 'http://localhost:3100';
  const PORTAL_INTERNAL_KEY = process.env.PORTAL_INTERNAL_KEY || '';
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

  // Forward the multipart form data directly to control-plane
  const formData = await req.formData();
  const body = new FormData();
  const entries = Array.from(formData.entries());
  for (const [key, value] of entries) {
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
