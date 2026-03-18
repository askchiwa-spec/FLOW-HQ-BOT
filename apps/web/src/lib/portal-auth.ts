import { cookies } from 'next/headers';
import { decode } from 'next-auth/jwt';

/**
 * Reads and decodes the NextAuth JWT directly from the cookie store.
 *
 * Both getToken({ req }) and getServerSession(authOptions) were returning null
 * in App Router route handlers behind nginx. This approach bypasses both by
 * using cookies() from next/headers (which reliably works in route handlers)
 * and decode() from next-auth/jwt to verify and unpack the JWT.
 */
export async function getPortalToken(_req?: unknown) {
  const cookieStore = cookies();

  // NextAuth uses __Secure- prefix on HTTPS, plain name on HTTP
  const sessionToken =
    cookieStore.get('__Secure-next-auth.session-token')?.value ??
    cookieStore.get('next-auth.session-token')?.value;

  if (!sessionToken) return null;

  const token = await decode({
    token: sessionToken,
    secret: process.env.NEXTAUTH_SECRET!,
  });

  if (!token) return null;

  return {
    email: token.email as string | null,
    tenantId: token.tenantId as string | null,
    role: token.role as string | null,
    userId: token.userId as string | null,
  };
}
