import { getPortalToken } from '@/lib/portal-auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const CONTROL_PLANE_URL = process.env.CONTROL_PLANE_URL || 'http://localhost:3100';
  const PORTAL_INTERNAL_KEY = process.env.PORTAL_INTERNAL_KEY || '';
  const token = await getPortalToken(request);

  if (!token?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  try {
    const url = new URL(`${CONTROL_PLANE_URL}/portal/customers/export`);
    const status = searchParams.get('status');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
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
      return NextResponse.json({ error: 'Failed to export' }, { status: res.status });
    }

    const csv = await res.text();
    const filename = res.headers.get('content-disposition')?.match(/filename="([^"]+)"/)?.[1] ?? 'customers.csv';

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting customers:', error);
    return NextResponse.json({ error: 'Failed to export customers' }, { status: 500 });
  }
}
