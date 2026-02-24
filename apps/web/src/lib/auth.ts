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
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
          include: { tenant: true },
        });

        if (!existingUser) {
          // Create tenant first
          const newTenant = await prisma.tenant.create({
            data: {
              name: user.name || 'New Business',
              phone_number: '',
              status: 'NEW',
              whatsapp_session: { create: {} },
              worker_process: { create: { pm2_name: `worker-${Date.now()}` } },
            },
          });

          // Create user linked to tenant
          await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name || 'New User',
              tenant_id: newTenant.id,
              role: 'OWNER',
            },
          });
        }
      }
      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email! },
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
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    newUser: '/app/onboarding',
  },
};
