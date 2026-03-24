import { getPortalToken } from '@/lib/portal-auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const cpUrl = () => process.env.CONTROL_PLANE_URL || 'http://localhost:3100';
const portalKey = () => process.env.PORTAL_INTERNAL_KEY || '';

export async function GET(request: NextRequest) {
  const token = await getPortalToken(request);
  if (!token?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (checkRateLimit(token.email, 'handoffs', 30, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const res = await fetch(`${cpUrl()}/portal/tenant/current/handoffs`, {
      headers: {
        'x-portal-key': portalKey(),
        'x-user-email': token.email as string,
      },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch handoffs' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const token = await getPortalToken(request);
  if (!token?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (checkRateLimit(token.email, 'handoffs-delete', 20, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { contact } = await request.json();
  if (!contact) return NextResponse.json({ error: 'contact required' }, { status: 400 });

  try {
    const res = await fetch(
      `${cpUrl()}/portal/tenant/current/handoffs/${encodeURIComponent(contact)}`,
      {
        method: 'DELETE',
        headers: {
          'x-portal-key': portalKey(),
          'x-user-email': token.email as string,
        },
      }
    );
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Failed to resolve handoff' }, { status: 500 });
  }
}
