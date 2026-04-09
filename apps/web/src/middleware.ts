import { withAuth } from 'next-auth/middleware';

/**
 * Edge middleware — protects all /app/* routes.
 * Unauthenticated requests are redirected to /auth/signin?callbackUrl=<original URL>
 * so the user lands back where they intended after signing in.
 *
 * next-auth/middleware uses the JWT cookie (no DB round-trip) so it's safe to run
 * at the edge. The portal layout also checks session server-side as a second layer.
 */
export default withAuth({
  pages: {
    signIn: '/auth/signin',
  },
});

export const config = {
  matcher: ['/app/:path*'],
};
