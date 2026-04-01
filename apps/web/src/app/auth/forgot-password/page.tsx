'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus('sent');
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Something went wrong');
        setStatus('error');
      }
    } catch {
      setErrorMsg('Something went wrong. Please try again.');
      setStatus('error');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 relative overflow-hidden">
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-secondary-500/20 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/20">
            <span className="text-white font-bold text-2xl">F</span>
          </div>
          <h1 className="text-2xl font-heading font-bold text-white">Forgot your password?</h1>
          <p className="mt-2 text-slate-400 text-sm">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        <div className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
          {status === 'sent' ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-white font-medium">Check your admin notifications</p>
              <p className="text-slate-400 text-sm">
                If an account with that email exists, a reset link has been sent to your admin notification channel.
              </p>
              <Link href="/auth/signin" className="block text-primary-400 hover:text-primary-300 text-sm font-medium mt-4">
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                required
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-primary-500/50 transition-all"
              />
              {status === 'error' && (
                <p className="text-red-400 text-sm">{errorMsg}</p>
              )}
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors disabled:opacity-60"
              >
                {status === 'loading' ? 'Sending…' : 'Send Reset Link'}
              </button>
              <p className="text-center">
                <Link href="/auth/signin" className="text-slate-500 hover:text-slate-400 text-sm">
                  Back to sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
