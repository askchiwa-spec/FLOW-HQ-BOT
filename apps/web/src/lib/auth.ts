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
      try {
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
      } catch (err) {
        console.error('[auth] createUser event failed:', err);
      }
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      // On initial sign-in `user` is the DB user from the adapter.
      if (user) {
        token.userId = user.id;
      }

      // Always refresh tenantId/role from DB when missing or on first sign-in.
      // This fixes the race condition where createUser event (which links the tenant)
      // may not have completed before the JWT was first minted, leaving tenantId null.
      const userId = (token.userId ?? user?.id) as string | undefined;
      if (userId && !token.tenantId) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { tenant_id: true, role: true },
          });
          if (dbUser?.tenant_id) {
            token.tenantId = dbUser.tenant_id;
            token.role = dbUser.role;
          }
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
  pages: {
    signIn: '/auth/signin',
    newUser: '/app/onboarding',
  },
};
