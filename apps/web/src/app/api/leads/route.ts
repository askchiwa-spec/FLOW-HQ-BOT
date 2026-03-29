import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    const clean = email.trim().toLowerCase().slice(0, 254);

    // Fire ntfy notification so you see it immediately
    const webhookUrl = process.env.ALERT_WEBHOOK_URL;
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'Title': 'New Lead',
          'Priority': 'default',
          'Tags': 'email',
        },
        body: `New lead from landing page: ${clean}`,
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
