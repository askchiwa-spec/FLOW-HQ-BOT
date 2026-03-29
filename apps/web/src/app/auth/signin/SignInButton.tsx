'use client';

import { getCsrfToken, signIn } from 'next-auth/react';
import { useEffect, useState } from 'react';

interface SignInButtonProps {
  provider: {
    id: string;
    name: string;
  };
}

export default function SignInButton({ provider }: SignInButtonProps) {
  const [csrfToken, setCsrfToken] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getCsrfToken().then((token) => setCsrfToken(token ?? ''));
  }, []);

  if (provider.id === 'google') {
    return (
      <form method="POST" action={`/api/auth/signin/${provider.id}`}>
        <input type="hidden" name="csrfToken" value={csrfToken} />
        <input type="hidden" name="callbackUrl" value="/app/onboarding" />
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-3 px-6 py-4 border border-white/10 rounded-xl text-white bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-200"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span className="font-medium">Sign in with Google</span>
        </button>
      </form>
    );
  }

  // Email/password form
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Registration failed');
          setLoading(false);
          return;
        }
      }

      const result = await signIn('credentials', {
        email,
        password,
        callbackUrl: '/app/onboarding',
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
        setLoading(false);
        return;
      }

      window.location.href = result?.url || '/app/onboarding';
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {mode === 'register' && (
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-primary-500/50 transition-all"
        />
      )}
      <input
        type="email"
        required
        placeholder="Email address"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-primary-500/50 transition-all"
      />
      <input
        type="password"
        required
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-primary-500/50 transition-all"
      />
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors disabled:opacity-60"
      >
        {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
      </button>
      <p className="text-center text-sm text-slate-500">
        {mode === 'login' ? (
          <>No account?{' '}
            <button type="button" onClick={() => { setMode('register'); setError(''); }} className="text-primary-400 hover:text-primary-300">
              Create one
            </button>
          </>
        ) : (
          <>Already registered?{' '}
            <button type="button" onClick={() => { setMode('login'); setError(''); }} className="text-primary-400 hover:text-primary-300">
              Sign in
            </button>
          </>
        )}
      </p>
    </form>
  );
}
