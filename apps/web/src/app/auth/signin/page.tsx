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
    <div className="min-h-screen flex items-center justify-center bg-dark-900 relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-secondary-500/20 rounded-full blur-3xl" />
      
      {/* Circuit pattern overlay */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="circuit" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 50 30 M 50 70 L 50 100 M 0 50 L 30 50 M 70 50 L 100 50" stroke="rgba(16,185,129,0.3)" strokeWidth="1" fill="none"/>
              <circle cx="50" cy="50" r="5" fill="rgba(16,185,129,0.2)"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#circuit)"/>
        </svg>
      </div>

      <div className="relative z-10 max-w-md w-full mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/20">
            <span className="text-white font-bold text-2xl">F</span>
          </div>
          <h1 className="text-3xl font-heading font-bold text-white">
            Welcome to <span className="text-primary-400">Flow HQ</span>
          </h1>
          <p className="mt-2 text-slate-400">
            Sign in to access your WhatsApp automation dashboard
          </p>
        </div>

        {/* Sign in card */}
        <div className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
          <div className="space-y-4">
            {providers &&
              Object.values(providers).map((provider) => (
                <SignInButton key={provider.id} provider={provider} />
              ))}
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-slate-500">
          Made in Tanzania 🇹🇿 for African businesses
        </p>
      </div>
    </div>
  );
}
