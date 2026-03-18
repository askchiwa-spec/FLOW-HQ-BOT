import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  // JWT strategy: session data is stored in a signed cookie — no DB round-trip
  // needed to validate auth. This makes getServerSession() work reliably in
  // both server components AND App Router route handlers.
  session: {
    strategy: 'jwt',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  events: {
    async createUser({ user }) {
      // Runs after the adapter creates the user — safe to create and link a tenant here
      const newTenant = await prisma.tenant.create({
        data: {
          name: user.name || 'New Business',
          phone_number: '',
          status: 'NEW',
          whatsapp_session: { create: {} },
          worker_process: { create: { pm2_name: `worker-${Date.now()}` } },
        },
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { tenant_id: newTenant.id, role: 'OWNER' },
      });
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      // On initial sign-in `user` is the DB user from the adapter.
      // Persist the fields we need into the JWT so the session callback can
      // read them on every subsequent request without a DB query.
      if (user) {
        token.userId = user.id;
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { tenant_id: true, role: true },
          });
          token.tenantId = dbUser?.tenant_id ?? null;
          token.role = dbUser?.role ?? null;
        } catch {
          // Non-fatal
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.userId;
        (session.user as any).tenantId = token.tenantId;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  cookies: {
    // Chrome bounce-tracking mitigation strips SameSite=Lax cookies in OAuth
    // redirect chains (site → Google → site). Setting these to SameSite=None
    // (requires Secure) keeps the state/PKCE cookies intact through the redirect.
    state: {
      name: '__Secure-next-auth.state',
      options: { httpOnly: true, sameSite: 'none' as const, path: '/', secure: true },
    },
    pkceCodeVerifier: {
      name: '__Secure-next-auth.pkce.code_verifier',
      options: { httpOnly: true, sameSite: 'none' as const, path: '/', secure: true },
    },
  },
  pages: {
    signIn: '/auth/signin',
    newUser: '/app/onboarding',
  },
};
