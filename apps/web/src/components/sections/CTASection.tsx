'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useState } from 'react';
import { Button } from '../ui/Button';

export function CTASection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  async function handleLeadCapture(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setStatus(res.ok ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  }

  return (
    <section className="relative py-20 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 via-dark-900 to-secondary-600/20" />
      <div className="absolute inset-0 bg-[url('/patterns/circuit.svg')] opacity-5" />
      
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
        >
          {/* Icon */}
          <div className="text-6xl mb-6">🚀</div>

          {/* Headline */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-white mb-6">
            Your Customers Are{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent-400">
              Waiting.
            </span>
          </h2>

          {/* Subtext */}
          <p className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto">
            Every day without automation is another day of missed opportunities. 
            Start converting more customers today.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button href="/app/onboarding" size="lg">
              Get Started Now
            </Button>
            <Button
              href="https://wa.me/255765111131?text=Hi,%20I'm%20interested%20in%20Chatisha"
              variant="outline"
              size="lg"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Chat on WhatsApp
            </Button>
          </div>

          {/* Email capture */}
          {status === 'success' ? (
            <div className="mb-8 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm font-medium">
              ✓ Got it! We'll be in touch soon.
            </div>
          ) : (
            <form onSubmit={handleLeadCapture} className="mb-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                required
                placeholder="Enter your email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-primary-500/50 focus:bg-white/8 transition-all"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="px-6 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-medium text-sm transition-colors disabled:opacity-60 whitespace-nowrap"
              >
                {status === 'loading' ? 'Sending…' : 'Get Early Access'}
              </button>
            </form>
          )}
          {status === 'error' && (
            <p className="text-red-400 text-sm mb-4">Something went wrong. Try WhatsApp instead.</p>
          )}

          {/* Contact options */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-slate-400">
            <a
              href="tel:+255765111131"
              className="flex items-center gap-2 text-primary-400 hover:text-primary-300 font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              +255 765 111 131
            </a>
            <span className="hidden sm:block text-slate-600">·</span>
            <a
              href="mailto:business@chatisha.com"
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              business@chatisha.com
            </a>
            <span className="hidden sm:block text-slate-600">·</span>
            <a
              href="mailto:support@chatisha.com"
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              support@chatisha.com
            </a>
          </div>

          {/* Swahili Tooltip */}
          <p className="mt-6 text-slate-500 text-sm">
            <span className="text-primary-400">Msaada?</span> — Need help? We're here for you.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
