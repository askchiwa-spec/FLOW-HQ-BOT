import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import SignInButton from './SignInButton';

const ERROR_MESSAGES: Record<string, string> = {
  OAuthSignin: 'Error starting sign-in. Try again.',
  OAuthCallback: 'Error during sign-in callback. Try again.',
  OAuthCreateAccount: 'Could not create account. Try again.',
  OAuthAccountNotLinked: 'Account already exists with a different provider.',
  Callback: 'Sign-in callback error.',
  google: 'Google sign-in failed. Check your Google Cloud Console OAuth consent screen — your email may need to be added as a test user if the app is in Testing mode.',
  default: 'Sign-in failed. Please try again.',
};

export default async function SignInPage({ searchParams }: { searchParams: { error?: string; callbackUrl?: string } }) {
  const session = await getServerSession(authOptions);

  if (session) {
    const hasSetup = (session.user as any)?.hasSetupRequest;
    redirect(hasSetup ? '/app/status' : '/app/onboarding');
  }

  const error = searchParams?.error;
  const errorMessage = error ? (ERROR_MESSAGES[error] ?? ERROR_MESSAGES.default) : null;
  // Honour any callbackUrl from the query string (e.g. middleware redirect), otherwise
  // let NextAuth decide (/app/onboarding for new users, /app/status for returning ones
  // via the newUser page setting on the auth config).
  const callbackUrl = searchParams?.callbackUrl ?? '/app/onboarding';

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
            Welcome to <span className="text-primary-400">Chatisha</span>
          </h1>
          <p className="mt-2 text-slate-400">
            Sign in to access your WhatsApp automation dashboard
          </p>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {errorMessage}
          </div>
        )}

        {/* Sign in card */}
        <div className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
          <div className="space-y-4">
            <SignInButton provider={{ id: 'google', name: 'Google' }} callbackUrl={callbackUrl} />
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-slate-500 font-medium">OR</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
            <SignInButton provider={{ id: 'credentials', name: 'Email & Password' }} callbackUrl={callbackUrl} />
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
