import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

/**
 * Reads the NextAuth JWT from the request cookie.
 *
 * In production the app sits behind nginx (HTTPS at the edge, HTTP internally).
 * NextAuth sets the session cookie as __Secure-next-auth.session-token (secure prefix)
 * because the initial sign-in happened over HTTPS. But getToken() called inside a
 * Next.js route handler sees an HTTP request and defaults to looking for the
 * non-secure cookie name — returning null even when the user is signed in.
 *
 * Passing `secureCookie: true` forces getToken to look for the __Secure- prefixed
 * cookie name regardless of whether the internal request is HTTP or HTTPS.
 */
export function getPortalToken(req: NextRequest) {
  return getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === 'production',
  });
}
