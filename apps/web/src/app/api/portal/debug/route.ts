import { cookies } from 'next/headers';
import { decode } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const cookieStore = cookies();
  const allCookies = cookieStore.getAll().map((c) => c.name);

  const secureToken = cookieStore.get('__Secure-next-auth.session-token')?.value;
  const plainToken = cookieStore.get('next-auth.session-token')?.value;
  const tokenValue = secureToken ?? plainToken;

  let decoded: any = null;
  let decodeError: string | null = null;
  if (tokenValue) {
    try {
      decoded = await decode({ token: tokenValue, secret: process.env.NEXTAUTH_SECRET! });
    } catch (e: any) {
      decodeError = e?.message ?? 'decode failed';
    }
  }

  return NextResponse.json({
    allCookies,
    hasSecureToken: !!secureToken,
    hasPlainToken: !!plainToken,
    decoded,
    decodeError,
    secret: process.env.NEXTAUTH_SECRET ? 'set' : 'MISSING',
  });
}
