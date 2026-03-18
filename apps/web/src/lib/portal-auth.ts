import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

/**
 * Returns a token-shaped object from the active NextAuth session.
 *
 * Using getServerSession(authOptions) instead of getToken({ req }) because
 * getServerSession reads cookies via next/headers — the same path that powers
 * /api/auth/session. getToken({ req }) was returning null despite a valid
 * session because behind nginx (HTTP internally, HTTPS at the edge) the
 * cookie-name detection was unreliable.
 */
export async function getPortalToken(_req?: unknown) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const user = session.user as any;
  return {
    email: user.email as string | null,
    tenantId: user.tenantId as string | null,
    role: user.role as string | null,
    userId: user.id as string | null,
  };
}
