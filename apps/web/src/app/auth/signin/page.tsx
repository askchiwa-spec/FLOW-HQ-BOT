import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { getProviders } from 'next-auth/react';
import { authOptions } from '@/lib/auth';
import SignInButton from './SignInButton';

export default async function SignInPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect('/app/onboarding');
  }

  const providers = await getProviders();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome to Flow HQ
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to access your WhatsApp automation dashboard
          </p>
        </div>
        <div className="mt-8 space-y-4">
          {providers &&
            Object.values(providers).map((provider) => (
              <SignInButton key={provider.id} provider={provider} />
            ))}
        </div>
      </div>
    </div>
  );
}
