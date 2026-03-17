import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
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
    async session({ session, user }) {
      if (session.user) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: {
              tenant: {
                include: {
                  setup_requests: {
                    orderBy: { created_at: 'desc' },
                    take: 1,
                  },
                },
              },
            },
          });

          (session.user as any).id = dbUser?.id;
          (session.user as any).tenantId = dbUser?.tenant_id;
          (session.user as any).role = dbUser?.role;
          (session.user as any).hasSetupRequest = dbUser?.tenant?.setup_requests && dbUser.tenant.setup_requests.length > 0;
        } catch {
          // Non-fatal — session still valid without extended fields
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    newUser: '/app/onboarding',
  },
};
