import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';
import * as Sentry from '@sentry/nextjs';

async function notifyAdmin(message: string): Promise<void> {
  const url = process.env.ALERT_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain', 'Title': 'Chatisha Auth Alert', 'Priority': 'high', 'Tags': 'warning' },
      body: message,
    });
  } catch {}
}

async function ensureTenant(userId: string, userName: string | null): Promise<string | null> {
  try {
    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: { tenant_id: true },
    });
    if (existing?.tenant_id) return existing.tenant_id;

    const newTenant = await prisma.tenant.create({
      data: {
        name: userName || 'New Business',
        phone_number: '',
        status: 'NEW',
        whatsapp_session: { create: {} },
        worker_process: { create: { pm2_name: `worker-${Date.now()}` } },
      },
    });
    await prisma.user.update({
      where: { id: userId },
      data: { tenant_id: newTenant.id, role: 'OWNER' },
    });
    return newTenant.id;
  } catch (err) {
    Sentry.captureException(err, { extra: { userId, context: 'ensureTenant' } });
    await notifyAdmin(`Tenant creation failed for user ${userId} (${userName}): ${err}`);
    return null;
  }
}

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
      await ensureTenant(user.id, user.name ?? null);
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
            select: { tenant_id: true, role: true, name: true },
          });
          if (dbUser?.tenant_id) {
            token.tenantId = dbUser.tenant_id;
            token.role = dbUser.role;
          } else {
            // createUser event failed — self-heal by creating tenant now
            const tenantId = await ensureTenant(userId, dbUser?.name ?? null);
            if (tenantId) {
              token.tenantId = tenantId;
              token.role = 'OWNER';
            }
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
