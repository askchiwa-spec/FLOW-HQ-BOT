import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

const CONTROL_PLANE_URL = process.env.CONTROL_PLANE_URL || 'http://localhost:3000';
const PORTAL_INTERNAL_KEY = process.env.PORTAL_INTERNAL_KEY || '';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();

  try {
    const res = await fetch(`${CONTROL_PLANE_URL}/portal/setup-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-portal-key': PORTAL_INTERNAL_KEY,
        'x-user-email': session.user.email,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const error = await res.json();
      return NextResponse.json(error, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error calling control plane:', error);
    return NextResponse.json({ error: 'Failed to submit setup request' }, { status: 500 });
  }
}
